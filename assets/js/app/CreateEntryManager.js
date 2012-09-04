define (function (require, exports, module) {
	var Parser = require("./Parser");
	var Editor = require("./Editor");
	var Lexer = require("./Lexer");
	var EditorView = require("./EditorView");
	var PersistenceManager = require("./PersistenceManager");
	var UtilityFunctions = require("./UtilityFunctions");
	var Models = require("./Models");

	var editor;
	var $errorTable;
	var snippets = [];

	var POUND = 51;
	var CLOSE_ANGLE = 190;
	var ENTER = 13;
	var TAB = 9;

	var keyUpTriggers = [POUND, CLOSE_ANGLE];
	var keyDownTriggers = [ENTER, TAB];

	var currentParseTree = {
		stale : true,
		root : undefined,
		errors : [],
		rawText : ''
	};

	/*
	 * params: { 
	 *	$editorView : an EditorView element 
	 * 	$errorTable : a tbody element, TODO: rename
	 */
	function init(initData) {	
		var view = new EditorView.TextAreaView(initData.$editorView); 
		editor = new Editor.Presenter(view);
		$(editor.view).on('keydown', function (e) {
			if (keyDownTriggers.indexOf(e.which) > -1) {
				_handleKeyDown(e);
			}
			currentParseTree.stale = true;
		});
		$(editor.view).on('keyup', function (e) {
			if (keyUpTriggers.indexOf(e.which) > -1) {
				_handleKeyUp(e);
			}
		});
		$(editor.view).on('keyupTimeout', function (e) {
			_rebuildParseTree();
			editor.view.stopTimer();
		});
		$errorTable = initData.$errorTable;
		
		var params = {};
		PersistenceManager.requestSnippets(params, function (snips) {
			snippets = snips;
		});
	}

	function _getSnippetLines (name) {
		for (var i = 0; i < snippets.length; i++) {
			if (snippets[i].name === name) {
				var lineCopies = [];
				var snip = snippets[i];
				for (var j = 0; j < snip.lines.length; j++) {
					// deep copy
					lineCopies.push(snip.lines[j]);
				}
				return lineCopies;
			}
		}
	}

	function getEditor() {
		return editor;
	}

	function getCurrentParseTree() {
		return currentParseTree;
	}

	function _handleKeyDown(e) {
		e.preventDefault();
		editor.syncModel();
		var sel = editor.getSelectionRange();
		if (e.which === TAB) {
			if (sel) {
				editor.model.insertText('\t', sel.start);
				sel.end.offset = sel.start.offset += 1;
			}
		} else if (e.which === ENTER) {
			if (sel) {
				var n = _getNodeAtPosition(sel.start);
				var tabbedLine = '\n';
				if (n.level > 0) {
					tabbedLine += UtilityFunctions.dupChar('\t', n.level);
				}
				editor.model.insertText(tabbedLine, sel.start);
				sel.end.lineIndex = sel.start.lineIndex += 1;
				sel.end.offset = sel.start.offset = tabbedLine.length - 1;
			}
		}
		editor.syncView();
		editor.setSelectionRange(sel);
	}
	
	function _handleKeyUp(e) {
		editor.view.startTimer();
		if (e.which === POUND) {
			_insertSnippets();
		} else if (e.which === CLOSE_ANGLE) {
			_completeTags();
		}
	}

	function _rebuildParseTree() {
		$errorTable.empty();
		editor.syncModel();
		var lines = editor.model.getLines();
		var results = Parser.buildParseTree(lines);
		if (results.errors) {
			var content;
			results.errors.forEach(function (err) {
				content = "<tr><td>" + err.line + "</td>"
				content += "<td>" + err.message + "</td></tr>";	
				$errorTable.append(content);
			});	
		}
		editor.syncView();
		currentParseTree.stale = false;
		currentParseTree.root = results.rootNode;
		currentParseTree.errors = results.errors;
		currentParseTree.rawText = editor.model.getLines().join('\n');
		$(currentParseTree).trigger('rebuild');
		// qunit testing
		if (typeof start === 'function') {
			start();
		}
	}

	function _completeTags() {
		function getTagPair(token) {
			switch (token.type) {
				case "tagOpen":
					return "<*/" + token.val + "*>";
				case "ignoreOpen":
					return "##endignore##";
				case "defineOpen":
					return "##enddef " + token.val + "##";
			}
		}
		editor.syncModel();
		var sel = editor.getSelectionRange();
		var curLine = sel.start.lineIndex;
		var lines = editor.model.getLines();
		var tokens = Lexer.extractTokens(lines).reverse();
		var curLineTokens = [];
		for (var i = 0; i < tokens.length; i++) {
			if (tokens[i].range.start.lineIndex === curLine) {
				curLineTokens.push(tokens[i]);
			} else if (tokens[i].range.start.lineIndex > curLine) {
				i = tokens.length;
			}
		}
		// take the last token on the line
		var t = curLineTokens[curLineTokens.length - 1];
		var closeTag = getTagPair(t);
		// only complete if tag is an opener at end of line
		if (closeTag && t.range.end.offset <= lines[curLine].length) {
			var c = UtilityFunctions.countLeadingTabs(lines[curLine]);
			var outerTabs = UtilityFunctions.dupChar('\t', c);
			var innerTabs = outerTabs + '\t';
			var closer = outerTabs + closeTag;
			// needs to be in reverse order
			editor.model.insertLine(curLine + 1, closer);
			editor.model.insertLine(curLine + 1, innerTabs);
			editor.syncView();
			var p = new Models.Position(curLine + 1, innerTabs.length);
			var r = new Models.Range(p,p);
			editor.setSelectionRange(r);
		}
	}

	function _getNodeAtPosition(position) {
		editor.syncModel();
		function getDeepestEnclosing(node, pos) {
			if (node.range.containsPosition(pos)) {
				var next = null;
				for (var i = 0; i < node.children.length; i++) {
					if (next = getDeepestEnclosing(node.children[i], pos)) {
						return next;
					}
				}
				return node;
			}
			return null;
		}

		var tree = Parser.buildParseTree(editor.model.getLines());
		if (tree.rootNode) {
			return getDeepestEnclosing(tree.rootNode, position) || tree.rootNode;
		}
	}

	function _insertSnippets() {
		editor.syncModel();
		var insertRegEx = new RegExp('##insert ([^#]+)##', 'g');
		var sel = editor.getSelectionRange();
		var curLine = sel.start.lineIndex;
		var line = editor.model.getLines()[curLine];
		var tabLevel = UtilityFunctions.countLeadingTabs(line);
		var m;
		if ((m = insertRegEx.exec(line)) && m.length === 2) { // 1 capture
			var preInsert, postInsert;
			if (m.index > 0) {
				var nonTabs = new RegExp('[^\t]+', 'g');
				if (nonTabs.test(line.substring(0, m.index))) {
					preInsert = line.substring(0, m.index);
				}
			}
			if (m.index + m[0].length < line.length) {
				postInsert = line.substring(m.index + m[0].length);
			}
			var snipLines;
			var inserted = [];
			if (snipLines = _getSnippetLines(m[1])) {
				if (postInsert) {
					inserted.push(postInsert);
				}
				if (tabLevel > 0) {
					snipLines = UtilityFunctions.tabLines(snipLines, tabLevel);
				}
				inserted = inserted.concat(snipLines.reverse());
				if (preInsert) {
					inserted.push(preInsert);
				}
			}
			editor.model.deleteLine(curLine);
			for (var i = 0; i < inserted.length; i++) {
				editor.model.insertLine(curLine, inserted[i]);
			}
		}
		editor.syncView();
	}


	exports.init = init;
	exports.getEditor = getEditor;
	exports.getCurrentParseTree = getCurrentParseTree;
	// TESTING
	if (window.DEBUG_EXPOSE) {
		exports.completeTags = _completeTags;
		exports.insertSnippets = _insertSnippets;
	}
});

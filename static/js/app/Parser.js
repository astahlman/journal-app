define (function (require, exports, module) {
	var Models = require('./Models');
	var Lexer = require('./Lexer');
	var Logger = require('./Logger');

	function buildParseTree (lines) {
		var tokens = Lexer.extractTokens(lines);
		function isOpener(t)  {
			var openers = ["tagOpen", "defineOpen", "ignoreOpen"];
			return openers.indexOf(t) > -1;
		}
		function isCloser(t) {
			var closers = ["tagClose", "defineClose", "ignoreClose"];
			return closers.indexOf(t) > -1;
		}
		function textInRange(range) {
			if (range.start.lineIndex === range.end.lineIndex) {
				return lines[range.start.lineIndex].substring(range.start.offset, range.end.offset);
			}

			var t = "";
			t += lines[range.start.lineIndex].substring(range.start.offset);
			for (var i = range.start.lineIndex + 1; i < range.end.lineIndex; i++) {
				t += lines[i];
			}
			t += lines[range.end.lineIndex].substring(0, range.end.offset);
			return t;
		}
		var root = new Models.Node(null);
		root.nodeType = "root";
		root.nodeVal = "root";
		// root content is all lines
		for (var i = 0; i < lines.length; i++) {
			root.nodeContent += lines[i];
		}
		root.range.setStart({lineIndex : 0, offset : 0});
		root.range.setEnd({
			lineIndex : lines.length - 1,
			offset : lines[lines.length - 1].length,
		});
		var results = { rootNode: root, errors : [] };
		var cur = root;
		var t;
		var n;
		var level = 0;
		var line = 0;
		var newLineRegex = new RegExp("\n", "g");
		
		function logToken(t) {
			Logger.log("Token: val=" + t.val + ", type=" + t.type + ", line=" + t.range.start.lineIndex);
		}
		Logger.log("Here are the tokens:");
		tokens.forEach(logToken);
		while (tokens.length > 0) {
			t = tokens.pop(); 
			if (isOpener(t.type)) {
				if (t.type === "ignoreOpen") { // ignore node
					var contents = "";
					var ignored = t;
					var ignoreRange = new Models.Range();
					ignoreRange.setStart(ignored.range.start);
					while ((ignored = tokens.pop()) && ignored.type !== "ignoreClose") {
						contents += ignored.content; 
					}
					if (!ignored) {
						results.errors.push({ line : t.range.start.lineIndex, message : "Must close ignore tag."});
						return results;
					}
					ignoreRange.setEnd(ignored.range.end);
					t.val = t.contents = contents;
					Logger.log("Creating ignore node: " + t.val + " at level " + level + " on line " + t.range.start.lineIndex);
					n = new Models.Node(t, level, ignoreRange);
					cur.addChild(n);
				} else if (t.val === cur.nodeVal) { // duplicate of parent
					results.errors.push({ line : t.range.start.lineIndex, message : "Parent can't be its own child."});
					return results;
				} else { // valid node with children
					Logger.log("Creating node: " + t.type + ", " + t.val + 
						" at level " + level + " on line " + t.range.start.lineIndex);
					n = new Models.Node(t, level);
					n.range.setStart(t.range.start);
					cur.addChild(n);
					level++;
					cur = n;
				}
			} else if (isCloser(t.type)) {
				if (cur.nodeVal === "root") { // can't close at top level
					results.errors.push({ line : t.range.start.lineIndex, message : "Closing tag can't come before an opener."});
					return results;
				} else if (t.val !== cur.nodeVal && t.type !== cur.nodeType) { // imbalanced closing
					results.errors.push({ line : t.range.start.lineIndex, message : "Expected close of " + cur.nodeVal});
					return results;
				}
				cur.range.setEnd(t.range.end);
				cur.nodeContent = textInRange(cur.range);
				cur = cur.parentNode;
				level--;
			} else { // plain content
				// compact subsequent content nodes
				var numChildren = cur.children.length;
				if (numChildren > 0 && cur.children[numChildren - 1].nodeType === "content") {
					var sibling = cur.children[numChildren - 1];
					sibling.nodeVal += "\n" + t.val;
					sibling.range.setEnd(t.range.end);
					sibling.nodeContent = textInRange(n.range);
				} else { // create a new content node
					Logger.log("Creating content node at level " + level + ". Content: " + t.val);
					n = new Models.Node(t, level);
					n.range.setStart(t.range.start);
					n.range.setEnd(t.range.end);
					n.nodeContent = textInRange(n.range);
					cur.addChild(n);
				}
			}
		}

		if (cur.nodeType !== "root") {
			results.errors.push({line : lines.length, message : "Expected close of " + cur.nodeVal});
		}

		results.rootNode = root;
		Logger.log("No more tokens...");
		return results;
	}

	function printParseTree(root, level) {
		var nodes = "";
		root.children.forEach( function(child) {
			nodes += child.nodeType + ": " + child.nodeVal + ", ";
		});
		if (nodes.length > 0) {
			nodes = nodes.substring(0, nodes.length - 2);
			Logger.log("Level: " + level + " - " + nodes);	
		}
		root.children.forEach( function(child) {
			printParseTree(child, level + 1);
		});
	}
	
	exports.buildParseTree = buildParseTree;
	exports.printParseTree = printParseTree;
});

define (function (require, exports, module) {
	var Parser = require("./Parser");
	var Editor = require("./Editor");
	var Models = require("./Models");

	/*
	var SAVE_ENTRY_URL = "http://127.0.0.1:8000/save_entry/";	
	var GET_ENTRIES_URL = "http://127.0.0.1:8000/get_entries/";	
	var NODE_SEARCH_URL = 'http://127.0.0.1:8000/search_nodes/';
	var GET_NODE_URL = 'http://127.0.0.1:8000/get_node/';
	var GET_SNIPPETS_URL = 'http://127.0.0.1:8000/get_snippets/';
	var SAVE_SNIPPET_URL = 'http://127.0.0.1:8000/save_snippet/';
	var TOGGLE_PUBLIC_URL = 'http://127.0.0.1:8000/toggle_public/';
	*/
	
	var SAVE_ENTRY_URL = "/save_entry/";	
	var GET_ENTRIES_URL = "/get_entries/";	
	var NODE_SEARCH_URL = '/search_nodes/';
	var GET_NODE_URL = '/get_node/';
	var GET_SNIPPETS_URL = '/get_snippets/';
	var SAVE_SNIPPET_URL = '/save_snippet/';
	var TOGGLE_PUBLIC_URL = '/toggle_public/';

	function saveEntry(lines, entryNum, callback) {
		var entry = new Entry(lines);	
		var rawText = lines.join('\n');
		var data = { 'root' : nodeToJSON(entry.parseTree.rootNode), 'rawText' : rawText };
		if (entryNum && entryNum >= 0) {
			data.entryNum = entryNum;
		}
		var json = JSON.stringify(data);
		console.log("Here is the JSON: " + json);
		$.post(SAVE_ENTRY_URL, json, function (response) { 
			"Save entry response: " + console.log(response); 
			callback(response);
		}, "json"); 
	}
	
	function saveSnippet(snippet) {
		var data = { name : snippet.name, content : snippet.lines.join('\n') };
		var json = JSON.stringify(data);
		console.log("Here is the JSON: " + json);
		$.post(SAVE_SNIPPET_URL, json, function (response) { "Save snippet response: " + console.log(response); }, "json"); 
	}

	function nodeToJSON(n) {
		var d = {'nodeVal' : n.nodeVal, 'nodeType' : n.nodeType, 'level' : n.level, 'nodeContent' : n.nodeContent};
		d.children = [];
		for (var i = 0; i < n.children.length; i++) {
			d.children.push(nodeToJSON(n.children[i]));
		}
		return d;
	}

	function nodeFromJSON(jsonNode) {
		var n = new Models.Node(null, jsonNode.level, null);
		n.nodeVal = jsonNode.nodeVal;
		n.nodeType = jsonNode.nodeType;
		n.nodeContent = jsonNode.nodeContent;
		for (var i = 0; i < jsonNode.children.length; i++) {
			n.addChild(nodeFromJSON(jsonNode.children[i]));
		}
		return n;
	}
	
	/* params = {
	 * 	entryNum : number,
	 * 	creationDate : isostring,
	 * };
	 * Blank params returns most recent.
	 */
	function requestEntry (params, callback) {
		$.ajax({
			url: GET_ENTRIES_URL,
			type: "GET",
			data: params,
			dataType: "json"
		}).done(callback);
	}

	// if names is not supplied, retrieves all the snippets
	// parses response and passes callback a list of { name : '', lines : '' }
	// TODO: limit the number of results
	function requestSnippets(params, callback) {
		var data = {};
		data.names = params.names || undefined;

		$.ajax({
			url: GET_SNIPPETS_URL,
			type: "POST",
			data: data,
			dataType: "json"
		}).done(function (response) {
			var l = eval(response);
			var snippets = [];
			for (var i = 0; i < l.length; i++) {
				var lines = l[i].content.split('\n'); 
				snippets.push({ name : l[i].name, lines : lines});
			}
			callback(snippets);
		});
	}

	// callback receives a Node as argument
	function requestNode (nodeID, callback) {
		var data = { nodeID : nodeID };
		$.ajax({
			url: GET_NODE_URL,
			type: "GET",
			data: data,
			dataType: "json"
		}).done(function (response) {
			var n = nodeFromJSON(response);
			callback(response, n);
		});
	}
	/*
	 * params = { 
	 *	before : isoDateString,
	 * 	after : isoDateString,
	 *	keywords : [string],
	 *	tags : [string],
	 *	entryNum : number
	 * }
	 *
	 * response = {
	 * 	nodeID : number,
	 *	nodeVal : string
	 * 	date : isoDateString,
	 * 	entryNum : number
	 * }
	 */
	
	function searchNodes(params, callback) {
		var jsonData = JSON.stringify(params);
		console.log("Here are the request params: " + jsonData);
		$.ajax({
				url: NODE_SEARCH_URL,
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				data: jsonData,
				dataType: 'text',
			}).done(function(response) {
				console.log("Received these nodes: " + JSON.stringify(response));
				callback(response);
			});
	}

	function togglePublic(entryNum, callback) {
			var data = { 'entryNum' : entryNum};
			$.ajax({
				url: TOGGLE_PUBLIC_URL,
				type: 'GET',
				contentType: 'application/json; charset=utf-8',
				data: data,
				dataType: 'json',
			}).done(function(response) {
				console.log("Response from toggle_public: " + JSON.stringify(response));
				callback(response);
			});

	}

	function Entry(linesIn) {
		if (linesIn) {
			this.lines = linesIn;
			this.parseTree = Parser.buildParseTree(this.lines);
			if (!this.parseTree.errors || this.parseTree.errors.length === 0) {
				var root = this.parseTree.rootNode;
				var snippets = _extractSnippets(root, this.lines);	
				for (var i = 0; i < snippets.length; i++) {
					saveSnippet(snippets[i]);
				}
			}
		}
	}

	// snippet = { name: '', lines : [] }	
	function _extractSnippets(rootNode, linesIn) {
		var snippets = [];
		rootNode.traverse( function (n) {
			if (n.nodeType === "define") {
				var snip = { name : n.nodeVal, lines : [] };
				var start = n.range.start;
				var end = n.range.end;
				var off = start.offset + "##def ##".length + n.nodeVal.length;
				var t = linesIn[start.lineIndex].substring(off);
				if (t.length > 0 && t[0] === '\n') {
					t = t.substring(1); // remove the first \n
				}
				if (t.length > 0) {
					snip.lines.push(t);
				}
				for (var i = start.lineIndex + 1; i < end.lineIndex; i++) {
					snip.lines.push(linesIn[i]); 
				}
				off = end.offset - "##enddef ##".length - n.nodeVal.length;
				t = linesIn[end.lineIndex].substring(0, off);
				//if (t.length > 0 && t[t.length - 1] === '\n') {
				//	t = t.substring(0, t.length - 2); // remove the last \n
				//}
				if (t.length > 0) {
					snip.lines.push(t); 
				}
				snippets.push(snip);
			}
		});
		return snippets;
	}
	
	exports.saveEntry = saveEntry;
	exports.requestEntry = requestEntry;
	exports.requestNode = requestNode;
	exports.requestSnippets = requestSnippets;
	exports.searchNodes = searchNodes;
	exports.togglePublic = togglePublic;
	exports.nodeFromJSON = nodeFromJSON;
	exports.nodeToJSON = nodeToJSON;
});


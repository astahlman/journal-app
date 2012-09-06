define (function (require, exports, module) {
	var PersistenceManager = require('./PersistenceManager');
	var Logger = require('./Logger');

	var $searchBar;
	var $searchBtn;

	function init(initData) {
		var $displayArea = initData.$displayArea;
		var view = new NodeSetTableView($displayArea);
		var controller = new NodeSetController(view);
		$searchBar = initData.$searchBar;
		$searchBtn = initData.$searchBtn;
		$searchBtn.click(function () {
			controller.executeSearch($searchBar.val());
		});
		return controller;
	}

	function NodeSetController(view) {
		this.model = []; // an array of objects with information about the node 
		this.view = view;
		var that = this;
		$(this.view).on('nodeSelected', function (e, nodeID) {
			// propagate
			$(that).trigger('nodeSelected', nodeID);
		});
	}

	NodeSetController.prototype.updateView = function () {
		this.view.refresh(this.model);
	}

	NodeSetController.prototype.parsePattern = function (pattern) {
		var params = { tags : [], keywords : [] };
		var el = pattern.split(' | ');
		if (el.length > 3) {
			return null;
		}

		var dateRegEx = /(?:\s|^)\[,?(?:((?:[0-9]{1,2}\/){2}[0-9]{4}),?){1,2}\]/g;
		var tagRegEx = /(?:\s|^)#([^\s]+)/g;
		var setDate, setTags, setKeys;
		setDate = setTags = setKeys = false;
		var m;
		for (var i = 0; i < el.length; i++) {
			if (m = dateRegEx.exec(el[i])) {
				if (setDate) {
					return null;
				}
				var comma = m[0].indexOf(',');
				if (m[0].lastIndexOf(',') > comma) { // 2 commas, invalid
					return null;
				} else if (m[0].length < el[i].length) { // leading or trailing characters
					return null;
				}
				
				var distToEnd = (m[0].length - 1) - comma;
				if (comma === -1) {
					params.after = params.before = m[1];
				} else if (comma <= 2) { //  2 == max index of leading comma
					params.before = m[1];
				} else if (distToEnd == 1) {
					params.after = m[1];
				}
				dateRegEx.lastIndex = 0;
				setDate = true;
				// TODO: Add valid date check
			} else if (m = tagRegEx.exec(el[i])) {
				if (setTags) {
					return null;
				}
				while (m) {
					params.tags.push(m[1]);
					m = tagRegEx.exec(el[i]);
				}
				tagRegEx.lastIndex = 0;
				setTags = true;
			} else {
				if (setKeys) {
					return null;
				}
				params.keywords = el[i].split(' ');
				// remove empties
				var j;
				while ((j = params.keywords.indexOf('')) > -1) {
					params.keywords.splice(j, 1);
				}
				// check for non-escaped '|' that slipped through
				for (var k = 0; k < params.keywords.length; k++) {
					var l = -1;
					while ((l = params.keywords[k].indexOf('|', l + 1)) > -1) {
						if (l === 0) {
							return null;
						} else if (params.keywords[k][l - 1] !== '\\') {
							return null;
						}
					}
				}
				setKeys = true;
			}
		}

		return params;
	}

	NodeSetController.prototype.executeSearch = function (query) {
		var that = this;
		function didCompleteSearch(json) {
			var results = eval(json);
			Logger.log("Search results from query \'" + query + "\':" + json);
			that.model = results;
			that.updateView();
		}
		var params = this.parsePattern(query);
		if (params) {
			PersistenceManager.searchNodes(params, didCompleteSearch);
		}
	}

	var NONE = -1;


	function NodeSetTableView($displayArea) {
		this.selectedIndex = NONE;
		this.columns = [ 'Preview', 'Entry', 'Date' ];
		this.$table = $('<table class="table table-striped table-bordered">');
		var $tr = $('<tr>');
		for (var i = 0; i < this.columns.length; i++) {
			$tr.append('<th>' + this.columns[i] + '</th>');
		}
		this.$table.append('<thead>');
		this.$table.children('thead').append($tr);
		this.$table.append('<tbody>');
		$displayArea.append(this.$table);
	}

	NodeSetTableView.prototype.refresh = function (nodes) {
		this.clearResults();
		this.buildHtml(nodes);
	}

	NodeSetTableView.prototype.clearResults = function () {
		this.$table.children('tbody').empty();
	}

	NodeSetTableView.prototype.buildHtml = function (nodes) {
		var that = this;
		function buildRow(result) {
			var $tr = $('<tr>');
			var $tdPreview= $('<td>');
			$tdPreview.text(result.nodePreview);
			var $tdEntry = $('<td>');
			$tdEntry.text(result.entryNum);
			var $tdDate = $('<td>');
			$tdDate.text(result.date);
			$tr.append($tdPreview);
			$tr.append($tdEntry);
			$tr.append($tdDate);
			$tr.attr('data-dismiss', 'modal');
			$tr.click(function () {
				$(that).trigger('nodeSelected', result.nodeID);
			});
			return $tr;
		}
		function buildBlankRow() {
			var $tr = $('<tr>');
			var $tdPreview= $('<td>');
			$tdPreview.text('No nodes matching query');
			var $tdEntry = $('<td>');
			$tdEntry.text('-');
			var $tdDate = $('<td>');
			$tdDate.text('-');
			$tr.append($tdPreview);
			$tr.append($tdEntry);
			$tr.append($tdDate);
			$tr.attr('data-dismiss', 'modal');
			$tr.click(function () {
				$(that).trigger('nodeSelected', result.nodeID);
			});
			return $tr;
		}
		this.clearResults();
		if (nodes.length > 0) {
			for (var i = 0; i < nodes.length; i++) {
				this.$table.children('tbody').append(buildRow(nodes[i]));
			}
		} else {
			this.$table.children('tbody').append(buildBlankRow());
		}
	}

	exports.init = init;
	if (window.DEBUG_EXPOSE) {
		exports.parsePattern = NodeSetController.prototype.parsePattern;
	}
	
});

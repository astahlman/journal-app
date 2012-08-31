define (function (require, exports, module) {
	var Editor = require('./Editor');
	var PersistenceManager = require('./PersistenceManager');
	var UtilityFunctions = require('./UtilityFunctions');
	
	var $viewerDiv;
	var curNode;
	
	var TAB_CHAR = "&nbsp;&nbsp;&nbsp;&nbsp;";
	var defaultExpand = true;

	function init(initData) {
		
		$viewerDiv = initData.$viewerDiv;
		curNode = initData.node;
		if (curNode) {
			buildNodeView(curNode);
		}
		if (typeof initData.defaultExpand !== 'undefined') {
			defaultExpand = initData.defaultExpand;
		}
	}

	function _shouldOpenDiv(n) {
		return (n.children && n.children.length > 0);
	}

	function _getColor(level) {
		var colors = ["Salmon", "MediumTurquoise", "DarkSeaGreen", "MediumPurple"];
		return colors[level % colors.length];
	}

	var divIDBuilder = function () {
		var PREFIX = 'node-'
		var inUse = [];
		function buildID(node) {
			var id = PREFIX + node.nodeVal + '-' + node.level;
			var dup = 1;
			while (inUse.indexOf(id) > -1) {
				if (dup == 1) {
					id += '-' + dup;
				} else {
					id = id.substring(0, length - 1) + dup;
				}
			}
			inUse.push(id);
			return id;
		}
		function reset() {
			inUse = [];
		}
		return { build : buildID, reset : reset };
	}();


	function WrapperDiv(parentWrapperIn, nodeIn) {

		function getAccordionIcon (initData) {
			var PLUS_CLASS = 'icon-plus-sign', MINUS_CLASS = 'icon-minus-sign';
			var isOpen = typeof initData.isOpen === 'undefined' ? true : initData.isOpen;
			var $el = $('<i>');
			var defaultClass = isOpen ? MINUS_CLASS : PLUS_CLASS;
			$el.addClass(defaultClass);
			$el.click(function () {
				$el.toggleClass(PLUS_CLASS + ' ' + MINUS_CLASS);
			});
			$el.attr('data-toggle', 'collapse');
			$el.attr('data-target', initData.dataTarget);
			$el.attr('data-parent', initData.dataParent);
			$el.css('float', 'left');
			return $el;
		}
		this.level = nodeIn.level;
		this.nodes = [nodeIn];

		var colorLevel = _shouldOpenDiv(nodeIn) ? nodeIn.level + 1: nodeIn.level;
		var baseID = divIDBuilder.build(nodeIn);

		this.$outerDiv= $('<div>').attr('id', baseID + '-outer');
		this.$headerDiv = $('<div>').attr('id', baseID + '-header');
		this.$contentDiv = $('<div>').attr('id', baseID + '-content');
		this.$contentDiv.addClass('collapse');
		if (defaultExpand || nodeIn.nodeType === 'root') {
			this.$contentDiv.addClass('in');
		}

		this.$outerDiv.append(this.$headerDiv);
		this.$outerDiv.append(this.$contentDiv);
		this.$outerDiv.css("margin", "5px");
		this.$outerDiv.css("position", "relative");
		this.$outerDiv.css("left", "20");
		this.$outerDiv.css("border-radius", "10px");
		this.$outerDiv.css("padding", "15px");
		this.$outerDiv.css("background-color", _getColor(colorLevel));

		if (nodeIn.nodeType !== 'root') {
			var initData = {
				dataTarget : '#' + baseID + '-content',
				isOpen : defaultExpand,
			};
			var $icon = getAccordionIcon(initData);
			this.$headerDiv.append($icon);
			this.$headerDiv.append('<h3>' + nodeIn.nodeVal+ '</h3>');
		}

		this.children = [];
		if (parentWrapperIn) {
			this.parentWrapper = parentWrapperIn;
			this.parentWrapper.$contentDiv.append(this.$outerDiv);
		}
	}

	WrapperDiv.prototype.addChild = function (node) {
		var child = new WrapperDiv(this, node);
		this.children.push(child);
		return child;
	}

	WrapperDiv.prototype.append = function (n) {
		this.nodes.push(n);
		var appendText = n.nodeVal;
		var tabs = UtilityFunctions.countLeadingTabs(appendText, false);
		appendText = appendText.replace(/^(\t)+/g, "");
		var extra = tabs - n.level;
		for (var i = 0; i < extra; i++) {
			appendText = TAB_CHAR + appendText;
		}
		this.$contentDiv.append(appendText.replace('\n', '<br>'));
	}

	function buildNodeView(nodeIn) {
		divIDBuilder.reset();
		var div = (function buildWrapper(n, wrapper) {
			if (!wrapper) {
				wrapper = new WrapperDiv(null, n);
			} else if (_shouldOpenDiv(n)) {
				wrapper = wrapper.addChild(n);
			} else {
				wrapper.append(n);
			}

			for (var i = 0; i < n.children.length; i++) {
				buildWrapper(n.children[i], wrapper);
			}

			return wrapper;
		}(nodeIn, null));
		$viewerDiv.empty();
		$viewerDiv.append(div.$outerDiv);
	}

	exports.init = init;
	exports.buildNodeView = buildNodeView;
});

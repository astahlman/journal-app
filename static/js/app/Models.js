define (function (require, exports, module) {
	var UtilityFunctions = require('./UtilityFunctions');
	// start is inclusive, end is exclusive
	function Position (lineIndexIn, offsetIn) {
		this.lineIndex = lineIndexIn;
		this.offset = offsetIn;
	}
	
	function Range (startIn, endIn) {
		this.start = startIn;
		this.end = endIn;
	}
	
	Range.prototype.setStart = function (startIn) {
		if (startIn) {
			this.start = { 
				lineIndex : startIn.lineIndex, 
				offset : startIn.offset, 
			};
		}
	}

	Range.prototype.setEnd = function (endIn) {
		if (endIn) {
			this.end = {
				lineIndex : endIn.lineIndex,
				offset : endIn.offset,
			};
		}
	}

	Range.prototype.containsPosition = function (pos) {
		if (this.end) {
			if (this.start.lineIndex < pos.lineIndex && this.end.lineIndex > pos.lineIndex) {
				return true;
			} else if (this.start.lineIndex === pos.lineIndex || this.end.lineIndex === pos.lineIndex) {
				return (this.start.offset <= pos.offset && this.end.offset >= pos.offset);
			} else {
				return false;
			}	
		} else { 
			if (this.start.lineIndex < pos.lineIndex) {
				return true;
			} else if (this.start.lineIndex === pos.lineIndex) {
				return this.start.offset <= pos.offset;
			}
		}
	}

	Range.prototype.isValidRange = function () {
		if (this.start.offset < 0 || this.end.offset < 0) { 
			return false;
		}
		if (this.start.offset > this.end.offset && this.start.lineIndex === this.end.lineIndex) {
			return false;
		}
		if (this.start.lineIndex > this.end.lineIndex) {
			return false;
		}
		if (this.start.lineIndex < 0 || this.end.lineIndex < 0) {
			return false;
		}
		return true;
	}

	function Node (token, levelIn, rangeIn) {
		var types = { 
			"tag" : ["tagOpen", "tagClose"], 
			"ignore" : ["ignoreOpen", "ignoreClose"],
			"define" : ["defineOpen", "defineClose"],
			"content" : ["content"],
		};
		this.range = rangeIn || new Range();
		this.nodeContent = "";
		this.children = [];
		// Note: != catches null and undefined because it tries to 
		// typecast levelIn for comparison, resulting in undefined
		this.level = (levelIn != undefined) ? levelIn : -1;
		var typeMatch;
		if (token) {
			for (key in types) {
				types[key].forEach(function (t) {
					if (t === token.type) {
						typeMatch = key;	
					}
				});
			}
			this.nodeType = typeMatch;
			this.nodeVal = token.val;
		}
	}
	
	Node.prototype.addChild = function (node) {
		this.children.push(node);
		node.parentNode = this;
	}

	Node.prototype.isNodeEqual = function (n) {
		if (!n) {
			return false;
		}
		return n.nodeVal === this.nodeVal && n.nodeType === this.nodeType;
	}

	Node.prototype.isTreeEqual = function (root) {
		var count = this.children.length;
		if (count !== root.children.length) {
			return false;
		} else if (!root) {
			return false;
		} else if (!this.isNodeEqual(root)) {
			return false;
		}
		for (var i = 0; i < count; i++) {
			if (!this.children[i].isTreeEqual(root.children[i])) {
				return false;
			}
		}
		return true;
	}

	Node.prototype.traverse = function (func) {
		func(this);
		this.children.forEach(function (child) {
			child.traverse(func);
		});	
	}

	exports.Node = Node;
	exports.Position = Position;
	exports.Range = Range; 
});

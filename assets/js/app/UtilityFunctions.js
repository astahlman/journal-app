define (function (require, exports, module) {

	function splitLines(content) {
		var split = content.split('\n');
		if (split.length === 0) {
			return [content];
		}
		return split;
	}

	function tabLines(lines, tabCount) {
		var count = tabCount || 1;
		var tabs = dupChar('\t', count);
		var copy = [];
		for (var i = 0; i < lines.length; i++) {
			copy.push(tabs + lines[i]);
		}
		return copy;
	}

	function countLeadingTabs(lineText, matchLineBreaks) {
		if (matchLineBreaks === false) {
			var regex = /^(\t)+/g;
		} else {
			var regex = /^(\t)+/gm;
		}
		var tabs = regex.exec(lineText);
		var tabCount = 0;
		if (tabs) {
			tabCount = tabs[0].length;
		}
		return tabCount;
	}

	function dupChar(charIn, count) {
		if (count > 0) {
			return (new Array(count + 1)).join(charIn);
		} else if (count === 0) {
			return '';
		}
	}

	function extractURLParams() {
		var urlParams = {};
		var match,
			pl     = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query  = window.location.search.substring(1);

		while (match = search.exec(query)) {
		   urlParams[decode(match[1])] = decode(match[2]);
		}
		return urlParams;
	}

	exports.splitLines = splitLines;
	exports.countLeadingTabs = countLeadingTabs;
	exports.dupChar = dupChar;
	exports.tabLines = tabLines;
	exports.extractURLParams = extractURLParams;
	
});

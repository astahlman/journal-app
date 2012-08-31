define (function (require, exports, module) {

	var Models = require('./Models');

	var types = ["content", "tagOpen", "tagClose", "defineOpen", "defineClose", "ignoreOpen", "ignoreClose"];

	function Token(typeIn, valIn, contentIn, range) {
		if (types.indexOf(typeIn) > -1) {
			this.type = typeIn;
			this.val = valIn;
			this.content = contentIn;
			this.range = range;
		}
	}

	function extractTokens(lines) {
		var tokens = [];
		var pattern = new RegExp("<\\*(?:\\/)?([^>\\/<*]+)\\*>|##(?:end)?def ([^#]+)##|##(?:end)?ignore##", "g");
		var m;
		var lineIndex = 0;
		var p1, p2;
		lines.forEach(function (line) {
			var linePos = 0;
			console.log("Lexing line: " + line);
			while (m = pattern.exec(line)) {
				var content = line.substring(linePos, m.index);
				if (content.length > 0) {
					p1 = new Models.Position(lineIndex, linePos);
					p2 = new Models.Position(lineIndex, m.index);
					tokens.push(new Token("content", content, content, new Models.Range(p1, p2)));
				}
				
				var capture = undefined, i = 1;
				while (typeof capture === "undefined" && i < m.length) {
					capture	= typeof m[i] === "undefined" ? capture : m[i];
					i++;
				}
				capture = capture || '';

				var type, content;
				if (m[0].indexOf("<*/") > -1) {
					content = "<*/" + capture + "*>";
					type = "tagClose";
				} else if (m[0].indexOf("<*") > -1) {
					content = "<*" + capture + "*>";
					type = "tagOpen";
				} else if (m[0].indexOf("##enddef") > -1) {
					content = "##enddef " + capture + "##";
					type = "defineClose";
				} else if (m[0].indexOf("##def") > -1) {
					content = "##def " + capture + "##";
					type = "defineOpen";
				} else if (m[0].indexOf("##endignore") > -1) {
					content = "##endignore##";
					type = "ignoreClose";
				} else if (m[0].indexOf("##ignore") > -1) {
					content = "##ignore##";
					type = "ignoreOpen";
				}
				
				p1 = new Models.Position(lineIndex, m.index);
				p2 = new Models.Position(lineIndex, m.index + m[0].length);
				var range = new Models.Range(p1, p2);
				tokens.push(new Token(type, capture, content, new Models.Range(p1, p2)));
				linePos = m.index + m[0].length;
			}
			// add any remaining content	
			if (linePos < line.length) {
				p1 = new Models.Position(lineIndex, linePos);
				p2 = new Models.Position(lineIndex, line.length);
				var remaining = line.substring(linePos);
				tokens.push(new Token("content", remaining, remaining, new Models.Range(p1,p2)));
			}
			lineIndex++;
		});
		
		return tokens.reverse();
	}

	function getTypes() {
		return types;
	}	

	exports.extractTokens = extractTokens;
	exports.getTypes = getTypes;
});


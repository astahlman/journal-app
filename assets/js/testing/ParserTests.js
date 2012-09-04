requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '../static/js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: './app',
		lib: './lib',
    }
});

function parseTestInput(data) {
	var regex = /^SEPARATOR\s*=\s*['"]([^'"\n]+)['"]\s*$/;
	var lines = data.split('\n');
	var m, delim;
	for (var i = 0; i < lines.length; i++) {
		if (m = regex.exec(lines[i])) {
			delim = m[1];
			lines = lines.slice(i + 1);
		}
		i = lines.length;
	}

	var cases = [];

	if (delim) {
		regex = new RegExp("^" + escapeRegExp(delim) + "$");
		for (var i = 0; i < lines.length; i++) {
			if (regex.test(lines[i])) {
				cases.push('');
			} else if (cases.length > 0) {
				cases[cases.length - 1] += (lines[i] + '\n');
			}
		}
	}

	return cases;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

requirejs(['app/Parser', 'app/UtilityFunctions', 'app/Models', 'app/Editor', 'app/EditorView'],
function (Parser, UtilityFunctions, Models, Editor, EditorView) {
	test( "Parser Test", function () {
		var inputs = parseTestInput(PARSER_VALID_TXT);
		ok (inputs.length > 0, "Parsed valid inputs ok.");
		for (var i = 0; i < inputs.length; i++) {	
			console.log("About to get lines");
			console.log("UtlilityFunctions = " + UtilityFunctions);
			var lines = UtilityFunctions.splitLines(inputs[i]);
			console.log("Got lines");
			var r = Parser.buildParseTree(lines);
			console.log("Built parse tree");
			if (r.errors) {
				ok (r.errors.length == 0, "No parse errors - Passed.");
			}
		}
		inputs = parseTestInput(PARSER_INVALID_TXT);
		ok (inputs.length > 0, "Parsed invalid inputs ok.");
		for (var i = 0; i < inputs.length; i++) {	
			var lines = UtilityFunctions.splitLines(inputs[i]);
			var r = Parser.buildParseTree(lines);
			ok (r.errors, "Invalid input produced errors - Passed.");
			ok (r.errors.length > 0, "Caught parse errors - Passed.");
		}
	});
});



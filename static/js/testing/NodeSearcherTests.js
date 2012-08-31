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

requirejs(['app/Models', 'app/UtilityFunctions', 'app/NodeSearcher'],
function (Models, UtilityFunctions, NodeSearcher) {


test ("NodeSearcher ParsePattern Tests", function () {
	var p = '#A | TestContent | [,8/27/2012]';
	var r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 1, "Parsed correct number of tags");
	ok (r.tags[0] === 'A', "Parsed tag ok");
	ok (r.keywords.length === 1, "Parsed correct number of keywords");
	ok (r.keywords[0] === "TestContent", "Parsed correct keyword");
	ok (r.before === "8/27/2012" && !r.after, "Parsed date range ok.");
		
	p = 'Some content | #B | [8/27/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 1, "Parsed correct number of tags");
	ok (r.tags[0] === 'B', "Parsed tag ok");
	ok (r.keywords.length === 2, "Parsed correct number of keywords");
	ok (r.keywords[0] === "Some", "Parsed correct keyword");
	ok (r.keywords[1] === "content", "Parsed correct keyword");
	ok (r.after === "8/27/2012" && !r.before, "Parsed date range ok.");
	
	p = 'Some content | #B #C | [8/27/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 2, "Parsed correct number of tags");
	ok (r.tags[0] === 'B', "Parsed tag ok");
	ok (r.tags[1] === 'C', "Parsed tag ok");
	ok (r.keywords.length === 2, "Parsed correct number of keywords");
	ok (r.keywords[0] === "Some", "Parsed correct keyword");
	ok (r.keywords[1] === "content", "Parsed correct keyword");
	ok (r.after === "8/27/2012" && !r.before, "Parsed date range ok.");
	
	p = 'More content | [8/27/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 0, "Parsed correct number of tags");
	ok (r.keywords.length === 2, "Parsed tag ok");
	ok (r.keywords[0] === "More", "Parsed correct keyword");
	ok (r.keywords[1] === "content", "Parsed correct keyword");
	ok (r.after === "8/27/2012" && !r.before, "Parsed date range ok.");
		
	p = '#C | [8/27/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 1, "Parsed correct number of tags");
	ok (r.tags[0] === 'C', "Parsed tag ok");
	ok (r.keywords.length === 0, "Parsed correct number of keywords");
	ok (r.after === "8/27/2012" && !r.before, "Parsed date range ok.");
	
	p = '[8/27/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 0, "Parsed correct number of tags");
	ok (r.keywords.length === 0, "Parsed correct number of keywords");
	ok (r.after === "8/27/2012" && !r.before, "Parsed date range ok.");
		
	p = '\\[some keywords\\] | [8/27/2012]';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 0, "Parsed correct number of tags");
	ok (r.keywords.length === 2, "Parsed correct number of keywords");
	ok (r.keywords[0] === '\\[some', "Parsed keyword ok");
	ok (r.keywords[1] === 'keywords\\]', "Parsed keyword ok");
	ok (r.after === '8/27/2012' && r.before === '8/27/2012', "Parsed date range ok.");

	p = 'some search \\|\\| | #A';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 1, "Parsed correct number of tags");
	ok (r.tags[0] === 'A', "Parsed tag ok");
	ok (r.keywords.length === 3, "Parsed correct number of keywords");
	ok (r.keywords[0] === 'some', "Parsed keyword ok");
	ok (r.keywords[1] === 'search', "Parsed keyword ok");
	ok (r.keywords[2] === '\\|\\|', "Parsed keyword ok");
	ok (!r.after && !r.before, "Parsed date range ok.");

	p = '\\#SomeSearch';
	r = NodeSearcher.parsePattern(p);
	ok (r.tags.length === 0, "Parsed correct number of tags");
	ok (r.keywords.length === 1, "Parsed correct number of keywords");
	ok (r.keywords[0] === '\\#SomeSearch', "Parsed keyword ok");
	ok (!r.after && !r.before, "Parsed date range ok.");

	p = '|';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")

	p = ' | ';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")

	p = 'someKey | anotherKey';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")
	
	p = '#someTag | #anotherTag';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")

	p = '[,8/27/2012] | [8/25/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")
	
	p = '[,8/27/2012] [8/25/2012,]';
	r = NodeSearcher.parsePattern(p);
	ok (!r, "Invalid pattern returned null.")
});
});

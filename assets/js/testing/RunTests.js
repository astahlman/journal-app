requirejs.config({
    baseUrl: '../static/js',
    paths: {
		tests: './testing',
    }
});

window.DEBUG_EXPOSE = true;

requirejs(
	['tests/ParserTests', 'tests/EditorTests',
	'tests/CreateEntryManagerTests', 'tests/NodeSearcherTests']
);

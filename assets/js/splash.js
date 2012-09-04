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

// Start the main app logic.
requirejs(['app/NodeViewer', 'app/CreateEntryManager'],
function (NodeViewer, CreateEntryManager) {
	$(document).ready(function() {
		
		CreateEntryManager.init({
			$editorView : $('#editor_view'),
			$errorTable : $('#errTable'),
		});
		NodeViewer.init({
			$viewerDiv : $('#entryViewerDiv'),
			defaultExpand : false,
		});

		var parseTree = CreateEntryManager.getCurrentParseTree();
		$(parseTree).on('rebuild', function () {
			if (parseTree.root) {
				NodeViewer.buildNodeView(parseTree.root);
			} else {
				$('#entryViewerDiv').empty();
				var t = 'Errors in parse tree...\n\n';
				t += parseTree.rawText;
				$('#entryViewerDiv').text(t);
			}
		});
	});
});

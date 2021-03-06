requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '../../static/js',
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
requirejs(['app/NodeViewer', 'app/PersistenceManager'],
function (NodeViewer, PersistenceManager) {
	$(document).ready(function() {
		var $viewer = $('#entryViewerDiv');
		
		NodeViewer.init({
			$viewerDiv : $viewer,
			defaultExpand : true,
		});

		if (PublicViewGlobal.jsonNode) {
			var n = PersistenceManager.nodeFromJSON(PublicViewGlobal.jsonNode);
			if (n) {
				NodeViewer.buildNodeView(n);
			}
		}
	});
});

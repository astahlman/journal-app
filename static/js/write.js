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
requirejs(['app/CreateEntryManager', 'app/Models', 'app/PersistenceManager', 'app/UtilityFunctions'],
function (CreateEntryManager, Models, PersistenceManager, UtilityFunctions) {
	//jQuery is loaded and can be used here now.
	$(document).ready(function() {
		var NEW_ENTRY = -1;
		var curEntryNum = UtilityFunctions.extractURLParams()['entryNum'] || NEW_ENTRY;
		var $editorView = $('#editor_view');
		var $errTable = $("#errTable");
		var $saveButton = $("#saveButton");
		var initData = { 
			$editorView : $editorView, 
			$errorTable : $errTable,
		}

		CreateEntryManager.init(initData);
		var editor = CreateEntryManager.getEditor();
		if (curEntryNum !== NEW_ENTRY) {
			var params = { entryNum : curEntryNum };
			PersistenceManager.requestEntry(params, function(response) {
				if (!response['rawText']) {
					alert("Error: Couldn't retrieve entry " + curEntryNum + ". You will be redirected so that you can create a new entry.");
					var reg = /\??entryNum=[^?=]*/g;
					var redirect = document.URL.replace(reg, '');
					window.location = redirect;
					return;
				}
				editor.model.setContent(response['rawText']);
				editor.syncView();
			});
		}
		

		$saveButton.click(function (e) {
			editor.syncModel();
			var lines = editor.model.getLines();
			var entry = PersistenceManager.saveEntry(lines, 
				curEntryNum, 
				function(response) {
					var msg = '';
					curEntryNum = response['entryNum'];
					if (response['status'] == 'success') {
						msg = 'Successfully saved entry ' + response['entryNum'];
					} else {
						msg = 'Save failed.';
					}
					alert(msg);
					window.location = '/write_entry/?entryNum=' + response['entryNum'];
					return;
				}
			);
		});

	});
});

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

// Easier to see the difference between strings in debugging.
function stringDiff(s1,s2) {
	for (var i = 0; i < Math.max(s1.length, s2.length); i++) {
		if (s1[i] !== s2[i]) {
			console.log("String diff - not equal:");
			console.log("s1["+i+"] = " + s1[i]);
			console.log("s2["+i+"] = " + s2[i]);
			return i;
		}
	}
	return -1;
}

requirejs(['app/Models', 'app/Editor', 'app/EditorView', 'app/CreateEntryManager', 'app/UtilityFunctions'],
function (Models, Editor, EditorView, CreateEntryManager, UtilityFunctions) {

	function insertAtCaret(editor, text) {
		var r = editor.getSelectionRange();
		var caret;
		if (r) {
			caret = r.start;
		} else {
			caret = new Models.Position(0, 0);
		}
		editor.model.insertText(text, caret);
		editor.syncView();
		caret.offset = text.length;
		editor.setSelectionRange(new Models.Range(caret, caret))
}

test ("CreateEntryManager Tests", function () {
	var $textarea = $('<textarea>').appendTo('body');
	$textarea.get(0).rows = 20;
	$textarea.get(0).cols = 20;
	var $errTable = $('<table>');
	var $saveButton = $('<button>');
	var initData = { 
		$editorView : $textarea,
		$errorTable : $errTable,
		$saveButton : $saveButton,
	};
	CreateEntryManager.init(initData);
	var editor = CreateEntryManager.getEditor();

	// TAG COMPLETION
	var testContent = "<*A*>\n\t<*B*>\n\t\tContent\n\t<*/B*>\n<*/A*";
	var s = testContent;
	editor.model.setContent(testContent);
	editor.syncView();
	deepEqual($errTable.find('tr').length, 0, "errTable is empty before parse.");
	$(editor.view).trigger('keyupTimeout');
	stop();
	deepEqual ($errTable.find('tr').length, 1, "Error displayed after parse.");
	var lines = editor.model.getLines();
	var p = new Models.Position(lines.length - 1, lines[lines.length - 1].length);
	editor.model.insertText('>', p);
		editor.syncView();
		$(editor.view).trigger('keyupTimeout');
		deepEqual ($errTable.find('tr').length, 0, "Error fixed after adding '>'.");
		s = $textarea.val();
		var t = "\n<*A2*>";
		$textarea.val(s + t);
		editor.syncModel();
		lines = editor.model.getLines();
		p = new Models.Position(lines.length - 1, lines[lines.length - 1].length);
		editor.setSelectionRange(new Models.Range(p,p));
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), s + t + "\n\t\n<*/A2*>") === -1, "Completed tag at level 0 ok.");

		s = "<*A*>";
		$textarea.val(s);
		editor.syncModel();
		lines = editor.model.getLines();
		p = new Models.Position(lines.length - 1, lines[lines.length - 1].length);
		editor.setSelectionRange(new Models.Range(p,p));
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), s + "\n\t\n<*/A*>") === -1, "Completed tag at level 0 ok.");

		insertAtCaret(editor, "<*B*>");
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), "<*A*>\n\t<*B*>\n\t\t\n\t<*/B*>\n<*/A*>") === -1, "Completed tag at level 1 ok.");
		s = editor.view.getContent();
		
		t = "<*C*> But then more content on the same line.";
		insertAtCaret(editor, t);
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), "<*A*>\n\t<*B*>\n\t\t" + t + "\n\t<*/B*>\n<*/A*>") === -1, "Didn't complete tag with trailing content on line.");

		editor.model.clear();
		editor.syncView();
		p = new Models.Position(0,0);
		editor.setSelectionRange(new Models.Range(p, p));
		insertAtCaret(editor, '##def SomeDef##');
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), "##def SomeDef##\n\t\n##enddef SomeDef##") === -1, "Completed def at level 0.");

		insertAtCaret(editor, '##ignore##');
		CreateEntryManager.completeTags();
		ok(stringDiff(editor.view.getContent(), "##def SomeDef##\n\t" + "##ignore##\n\t\t\n\t##endignore##" + "\n##enddef SomeDef##") === -1, "Completed def at level 0.");

	/*
		TODO: This has moved to CreateEntryManager (User is eliminated). Fix these and test extract snippets in PersistenceManager.
		// SNIPPETS
		var snipA = testUser.getSnippetLines('WorkoutA');
		var tabbedA = testUser.getSnippetLines('WorkoutATabbed');		
		var textA = snipA.join('\n');
		var textTabbedA = tabbedA.join('\n');
		
		editor.model.clear();
		editor.model.appendLine('<*Tag1*>');
		editor.model.appendLine('\t');
		editor.model.appendLine('<*//*Tag1*>');
		editor.syncView();
		var saved = editor.view.getContent();
		var p = new Models.Position(1, 1);
		editor.setSelectionRange(new Models.Range(p, p));
		insertAtCaret(editor, '##insert WorkoutA##');
		CreateEntryManager.insertSnippets();
		// test
		ok (stringDiff(editor.view.getContent(), '<*Tag1*>\n' + textTabbedA + '\n<*//*Tag1*>') === -1, 'insertSnippet at level 1 ok.');
		
		editor.model.clear();
		editor.model.appendLine('Test content.##insert WorkoutA##');
		editor.syncView();
		CreateEntryManager.insertSnippets();
		ok (stringDiff(editor.view.getContent(), 'Test content.\n' + textA) === -1, 'insertSnippet at level 0 with text preceding insert ok.');

		editor.model.clear();
		editor.model.appendLine('##insert WorkoutA##Test content.');
		editor.syncView();
		CreateEntryManager.insertSnippets();
		ok (stringDiff(editor.view.getContent(), textA + '\nTest content.') === -1, 'insertSnippet at level 0 with text following insert ok.');

		editor.model.setContent(saved);
		editor.syncView();
		p = new Models.Position(1, 1);
		editor.model.insertText('<*Tag2*>\n\t\t\n\t<*//*Tag2*>', p);
		p = new Models.Position(2, 2);
		var t = '##insert WorkoutA##';
		editor.model.insertText(t, p);
		editor.syncView();
		p = new Models.Position(2, 2 + t.length);
		editor.setSelectionRange(new Models.Range(p, p));
		CreateEntryManager.insertSnippets();
		var doubleTabbedA = UtilityFunctions.tabLines(snipA, 2);
		ok (stringDiff(editor.view.getContent(), '<*Tag1*>\n\t<*Tag2*>\n' + doubleTabbedA.join('\n') + '\n\t<*//*Tag2*>\n<*//*Tag1*>') === -1, 'insertSnippet at level 2 ok.');
	*/
	});
});

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

function areArraysEqual(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	} else {
		for (var i = 0; i < arr1.length; i++) {
			if (arr1[i] !== arr2[i]) {
				return false;
			}
		}
	}
	return true;
}

requirejs(['app/Models', 'app/Editor', 'app/EditorView'],
function (Models, Editor, EditorView) {
	test ("Editor Model Tests", function () {
		var e = new Editor.Model();
		// Editor methods
		// insertLine(lineIndex, text)
		// appendLine(text)
		// deleteLine(lineIndex)
		// getLines()
		// setContent()
		// insertText(text, position)
		// deleteText(range)
		// clear()
		function setTestContent() {
			var lines = [];
			lines.push("This is a content node before any tags.");
			lines.push("<*A*>");
			lines.push("\t<*B*>");
			lines.push("\t\tHere is content in B");
			lines.push("\t\t##ignore##");
			lines.push("\t\t\t<*/B*>");
			lines.push("\t\t##endignore##");
			lines.push("\t<*/B*>");
			lines.push("\tMore content at level A");
			lines.push("<*/A*>");
			lines.push("Final content");
			var content = lines.join('\n');

			e.setContent(content);
			var c1 = e.getLines();

			e.clear();
			ok (e.getLines().length === 0, "0 lines after clear");

			for (var i = 0; i < lines.length; i++) {
				e.appendLine(lines[i]);
			}
			var c2 = e.getLines();

			ok (areArraysEqual(c1, c2), "Set content === append lines");
		}
		

		// INSERT
		setTestContent(); // initialize content for insertText testing
		
		// insertText case 1
		// test insert at beginning of first line
		p = new Models.Position(0, 0);
		ok(e.insertText("Editor Test: ", p), "insertText 1 returned true");
		deepEqual(e.getLines()[0], "Editor Test: This is a content node before any tags.", "insertText case 1.");

		// insertText case 2
		// test insert in middle of line
		p = new Models.Position(0, 23);
		ok(e.insertText("test ", p), "insertText 2 returned true"); 
		deepEqual(e.getLines()[0], "Editor Test: This is a test content node before any tags.", "insertText case 2.");
	
		// insertText case 3
		// test insert at end of line
		var l = e.getLines()[0].length;
		p = new Models.Position(0, l);
		ok(e.insertText("..", p), "insertText 3 returned true");
		deepEqual(e.getLines()[0], "Editor Test: This is a test content node before any tags...", "insertText case 3.");
		
		// insertText case 4
		// test multi-line insert
		var l = e.getLines()[0].length;
		p = new Models.Position(0, l);
		ok(e.insertText(" Inserting a\nnewline", p), "insertText 4 returned true");
		deepEqual(e.getLines()[0], "Editor Test: This is a test content node before any tags... Inserting a", "insertText case 4 .");
		deepEqual(e.getLines()[1], "newline", "insertText case 4.");

		// insertText case 5
		// test insert at end of last line
		var l = e.getLines();
		var last = l.length - 1;
		p = new Models.Position(last, l[last].length);
		ok(e.insertText(" here.", p), "insertText 5 returned false");
		l = e.getLines();
		last = l.length - 1;
		deepEqual(l[last], "Final content here.", " insertText case 5.");

		// save content for comparison, text shouldn't change anymore
		var saved = e.getLines();

		// insertText case 6
		// test insert after last line
		// This should return false, as it is invalid
		l = e.getLines();
		p = new Models.Position(l.length, 0);
		ok(e.insertText("Doesn't matter", p) == false, "insertText case 6.");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// insertText case 7
		// test insert before first line
		// This should return false, as it is invalid
		l = e.getLines();
		p = new Models.Position(-1, 0);
		ok(e.insertText("Doesn't matter", p) == false, "insertText case 7.");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// insertText case 8
		// test insert before beginning of line 
		// This should return false, as it is invalid
		l = e.getLines();
		p = new Models.Position(0, -1);
		ok(e.insertText("Doesn't matter", p) == false, "insertText case 8.");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// DELETE 
		setTestContent(); // reset content for deleteText testing

		// deleteText case 1
		// test delete at beginning of first line
		var start, end;
		start = new Models.Position(0, 0);
		end = new Models.Position(0, 5);
		var r = new Models.Range(start, end);
		ok(e.deleteText(r), "deleteText returned true");
		deepEqual(e.getLines()[0], "is a content node before any tags.", "deleteText case 1 failed.");

		// deleteText case 2
		// test delete in middle of line
		start = new Models.Position(0, 5);
		end = new Models.Position(0, 13);
		r = new Models.Range(start, end);
		ok(e.deleteText(r), "deleteText returned true");
		deepEqual(e.getLines()[0], "is a node before any tags.", "deleteText case 2 failed.");

		// deleteText case 3
		// test delete at end of line
		l = e.getLines()[0];
		start = new Models.Position(0, l.length - 1);
		end = new Models.Position(0, l.length);
		r = new Models.Range(start, end);
		ok(e.deleteText(r), "deleteText returned true");
		deepEqual(e.getLines()[0], "is a node before any tags", "deleteText case 3 failed.");

		// save content for comparison, text shouldn't change anymore
		saved = e.getLines();

		// deleteText case 4
		// range starts before first line
		start = new Models.Position(-1, 0);
		end = new Models.Position(0, 1);
		r = new Models.Range(start, end);
		ok(e.deleteText(r) == false, "invalid delete failed");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// deleteText case 5
		// range ends after last line
		l = e.getLines();
		start = new Models.Position(0, 0);
		end = new Models.Position(l.length, 0);
		r = new Models.Range(start, end);
		ok(e.deleteText(r) == false, "invalid delete failed");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// deleteText case 6
		// range starts after end of line
		l = e.getLines();
		start = new Models.Position(0, l[0].length + 1);
		end = new Models.Position(0, l[0].length + 1);
		r = new Models.Range(start, end);
		ok(e.deleteText(r) == false, "invalid delete failed");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");

		// deleteText case 7
		// range ends after end of line
		l = e.getLines();
		start = new Models.Position(0, 1);
		end = new Models.Position(0, l[0].length + 1);
		r = new Models.Range(start, end);
		ok(e.deleteText(r) == false, "invalid delete failed");
		ok(areArraysEqual(e.getLines(), saved), "Invalid insert modified content.");


		// INSERT LINE
		setTestContent(); // reset content for deleteText testing
		
		// insertLine case 1
		// insert before first line
		var oldFirst = e.getLines()[0];
		var s = "Added with insertLine.";
		e.insertLine(0, s);
		deepEqual(e.getLines()[0], s);
		deepEqual(e.getLines()[1], oldFirst);
		
		// insertLine case 2
		// insert after first line and before last line
		var oldThird = e.getLines()[2];
		s = "Another added with insertLine.";
		e.insertLine(2, s);
		deepEqual(e.getLines()[2], s);
		deepEqual(e.getLines()[3], oldThird);
	
		// insertLine case 3
		// insert after first line
		var lines = e.getLines();
		var oldLast = lines[lines.length - 1];
		s = "Final added with insertLine.";
		e.insertLine(lines.length, s);
		lines = e.getLines();
		deepEqual(lines[lines.length - 1], s);
		deepEqual(lines[lines.length - 2], oldLast);
		
		// These should fail
		var saved = e.getLines();

		// insertLine case 4
		// insert at invalid index: -1
		s = "Doesn't matter - should fail.";
		ok (e.insertLine(-1, s) === false, "Invalid insert at -1 fails.");

		// insertLine case 5
		// insert at invalid index: length + 1
		lines = e.getLines();
		ok (e.insertLine(lines.length + 1, s) === false, "Invalid insert at at length + 1 fails.");
	
		ok(areArraysEqual(saved, e.getLines()), "Content not modified by invalid insert cases.");

		// DELETE LINE
		setTestContent(); // reset content for deleteText testing
		
		// deleteLine case 1
		// delete first line
		var oldSecond = e.getLines()[1];
		e.deleteLine(0);
		deepEqual(e.getLines()[0], oldSecond);
		
		// deleteLine case 2
		// delete line between first and last
		var oldThird = e.getLines()[2];
		e.deleteLine(1);
		deepEqual(e.getLines()[1], oldThird);
	
		// deleteLine case 3
		// delete last line
		var lines = e.getLines();
		var oldAlmostLast = lines[lines.length - 2];
		e.deleteLine(lines.length - 1);
		lines = e.getLines();
		deepEqual(lines[lines.length - 1], oldAlmostLast);

		// These should fail
		var saved = e.getLines();
	
		// deleteLine case 4
		// delete at invalid index: -1
		ok (e.deleteLine(-1) === false, "Invalid delete at -1 fails.");

		// deleteLine case 5
		// delete at invalid index: length
		lines = e.getLines();
		ok (e.deleteLine(lines.length) === false, "Invalid delete at index length fails.");
	
		ok(areArraysEqual(saved, e.getLines()), "Content not modified by invalid delete cases.");

		// APPEND
		setTestContent(); // reset content for deleteText testing
		
		// appendLine Case 1
		// append with existing lines
		s = "This line was appended.";
		e.appendLine(s);
		var lines = e.getLines(); 
		deepEqual(lines[lines.length - 1], s, "appendLine case 1");

		e.clear();
		ok (e.getLines().length === 0, "Cleared lines ok");

		// appendLine case 2
		// append with no existing lines
		e.appendLine(s);
		ok (e.getLines().length === 1, "appendLine case 2 - length ok");
		deepEqual (e.getLines()[0], s, "appendLine case 2");
	
		// Presenter-TextView
		setTestContent();
		var expected = e.getLines().join('\n');
		var $textarea = $('<textarea>');
		var view = new EditorView.TextAreaView($textarea);
		var presenter = new Editor.Presenter(view, e);
		ok (e.getLines().join('\n') !== presenter.view.getContent(), "Content != before sync");
		presenter.syncView();
		deepEqual(e.getLines().join('\n'), expected, "Model content == expected");
		deepEqual(presenter.view.getContent(), expected, "SyncView ok");

		var s = "\nAdded line from view.";
		$textarea.val(presenter.view.getContent() + s);
		ok (e.getLines().join('\n') !== presenter.view.getContent(), "Content != before sync");
		presenter.syncModel();
		deepEqual(e.getLines().join('\n'), expected + s, "SyncModel ok");
	});
});

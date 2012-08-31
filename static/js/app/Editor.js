define (function (require, exports, module) {
	// TODO: Check selection before inserting, if start != end, 
	// overwrite the selected text
	var UtilityFunctions = require('./UtilityFunctions');
	var Models = require('./Models');

	/*
	 * Model - this is is the model for an editor object
	 * Model consists of a lines array and methods for 
	 * manipulating the Model's lines.
	 */
	function Model(editorIn) {
		this.lines = [""];
	}

	Model.prototype.setContent = function (text) {
		this.lines = UtilityFunctions.splitLines(text);
	}
	
	Model.prototype.getLines = function () {
		return this.lines;
	}

	Model.prototype.insertText = function (text, pos) {
		var lines = this.getLines();
		if (lines.length === 0) {
			this.lines = lines = [''];
		}
		if (pos.lineIndex < 0 || pos.lineIndex >= lines.length) {
			return false;
		}
		if (pos.offset < 0 || pos.offset > lines[pos.lineIndex].length) {
			return false;
		}
			
		lines[pos.lineIndex] = lines[pos.lineIndex].substring(0,pos.offset) + text + lines[pos.lineIndex].substring(pos.offset);
		var split = UtilityFunctions.splitLines(lines[pos.lineIndex]);
		if (split.length > 1) {
			this.deleteLine(pos.lineIndex);
			// reinsert, reverse to preserve order
			var that = this;
			split.reverse().forEach(function(s) {
				that.insertLine(pos.lineIndex, s);
			});
		}
		return true;
	}
	
	Model.prototype.deleteText = function (range) {
		var lines = this.getLines();

		if (!range.isValidRange()) {
			return false;
		}
		if (range.start.lineIndex !== range.end.lineIndex) {
			return false;
		}
		if (range.start.lineIndex > lines.length - 1) {
			return false;
		}
		if (range.end.lineIndex > lines.length - 1) {
			return false;
		}
		if (range.start.offset >= lines[range.start.lineIndex].length) {
			return false;
		}
		if (range.end.offset > lines[range.end.lineIndex].length) {	
			return false;
		}

		var l = lines[range.start.lineIndex];
		l = l.substring(0, range.start.offset) + l.substring(range.end.offset);
		lines[range.start.lineIndex] = l;
		
		return true;
	}

	Model.prototype.insertLine = function (lineIndex, text) {
		var l = this.getLines().length;
		if (lineIndex < 0 || lineIndex > l) {
			return false;
		}
		this.lines.splice(lineIndex, 0, text);
	}

	Model.prototype.appendLine = function (text) {
		var l = this.getLines().length;
		this.insertLine(l, text);
	}

	Model.prototype.deleteLine = function (lineIndex) {
		var l = this.getLines().length;
		if (lineIndex < 0 || lineIndex >= l) {
			return false;
		}
		this.lines.splice(lineIndex, 1);
	}

	
	Model.prototype.clear = function () {
		this.lines = [];
	}

	/*
	 * Presenter - the mediator between an Editor Model and View.
	 * Presenter is responsible for syncing changes between the Model
	 * and the View.
	 */
	
	function Presenter(view, model) {
		this.view = view;
		this.model = model || new Model();
	}

	Presenter.prototype.syncView = function() {
		this.view.setContent(this.model.getLines());
	}
	
	Presenter.prototype.syncModel = function() {
		this.model.setContent(this.view.getContent());
	}

	Presenter.prototype.getSelectionRange = function() {
		var lines = this.model.getLines();
		var sel = this.view.getSelectionOffsets();
		var count = 0;
		var startRem = sel.start - count;
		var endRem = sel.end - count;
		var r = new Models.Range();
		for (var i = 0; i < lines.length; i++) {
			if (!r.start && startRem < lines[i].length + 1) {
				r.setStart(new Models.Position(i, startRem));
			}
			if (endRem < lines[i].length + 1) {
				r.setEnd(new Models.Position(i, endRem));
			}
			count += lines[i].length + 1;
			startRem = sel.start - count;
			endRem = sel.end - count;
			if (r.start && r.end && r.isValidRange()) {
				return r;
			}
	 	}
	}

	Presenter.prototype.setSelectionRange = function(range) {
		if (!range.isValidRange()) {
			return;
		}
		var lines = this.model.getLines();
		var c = 0;
		var cursor = {};
		for (var i = 0; i < lines.length; i++) {
			if (range.start.lineIndex === i) {
				cursor.start = c + range.start.offset;
			}
			if (range.end.lineIndex === i) {
				cursor.end = c + range.end.offset;
				this.view.setSelectionOffsets(cursor);
				return;
			}
			c += lines[i].length + 1;
		}
	}

	exports.Model = Model;
	exports.Presenter = Presenter;
});

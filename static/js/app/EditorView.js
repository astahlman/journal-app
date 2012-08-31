define (function (require, exports, module) {
	var KEYUP_INTERVAL = 750;
	var TAB = 9;
	var ENTER = 13;

	function EditorView() {
		var that = this;
		this.keyupTimer = $.timer(function() {
			$(that).trigger('keyupTimeout');
		});
		this.startTimer(KEYUP_INTERVAL);
	}

	EditorView.prototype.stopTimer = function () {
		this.keyupTimer.stop();
	}
	
	EditorView.prototype.startTimer = function (interval) {
		var t = interval || KEYUP_INTERVAL;
		this.keyupTimer.set({time : t, autostart : true});
	}

	TextAreaView.prototype = Object.create(EditorView.prototype);
	TextAreaView.prototype.constructor = TextAreaView;

	function TextAreaView($textarea) {
		EditorView.call(this);
		var that = this;
		this.$textarea = $textarea;
		this.$textarea.on('keyup', function (e) {
			var newE = $.Event('keyup');
			newE.which = e.which;
			$(that).trigger(newE);
			that.startTimer();
		});
		this.$textarea.on('keydown', function (e) {
			if (e.which === TAB || e.which === ENTER) {
				e.preventDefault();
			}
			var newE = $.Event('keydown');
			newE.which = e.which;
			$(that).trigger(newE);
		});
	}
	
	TextAreaView.prototype.setContent = function(lines) {
		this.$textarea.val(lines.join('\n'));
	}

	TextAreaView.prototype.getContent = function() {
		return this.$textarea.val();
	}

	TextAreaView.prototype.getSelectionOffsets = function() {
		return {
			start : this.$textarea.get(0).selectionStart,
			end : this.$textarea.get(0).selectionEnd,
		};
	}
	
	TextAreaView.prototype.setSelectionOffsets = function(cursor) {
		var input = this.$textarea.get(0);
		if (!input.setSelectionRange) {
			return;
		}
		if (cursor.start <= input.value.length && cursor.end <= input.value.length) {
			input.focus();
			input.setSelectionRange(cursor.start, cursor.end);
		}
	}

	exports.TextAreaView = TextAreaView;
});

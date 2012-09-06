define (function (require, exports, module) {
	function log(msg) {
		if (window.DEBUG_EXPOSE) {
			console.log(msg);
		}
	}
	exports.log = log;
});

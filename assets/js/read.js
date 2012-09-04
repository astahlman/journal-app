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
requirejs(['app/NodeViewer', 'app/NodeSearcher', 'app/PersistenceManager', 'app/UtilityFunctions'],
function (NodeViewer, NodeSearcher, PersistenceManager, UtilityFunctions) {
	$(document).ready(function() {

		var GET_ENTRY_PATH = "/get_entries/"

		var $viewer = $('#entryViewerDiv');
		var $nextEntry = $('#nextEntry').attr('disabled' , 'disabled');
		var $prevEntry = $('#prevEntry').attr('disabled' , 'disabled');
		var $editEntry = $('#editEntry').attr('disabled' , 'disabled');
		var $shareEntry = $('#shareEntry');
		var $dateLabel = $('#creationDateLabel');
		var $publicIDLabel = $('#publicIDLabel');
		var $entryHeader = $('#entryHeader')
		var NONE = -1;

		var currentEntry = {};
		
		var containingEntryNum = NONE;

		NodeViewer.init({
			$viewerDiv : $viewer,
			defaultExpand : true,
		});
		
		function resetToolbar() {
			function _setButtonState($el, idNum) {
				function disableButton($el) {
					$el.attr('disabled', 'disabled');
				}
				function enableButton($el) {
					$el.removeAttr('disabled');
				}
				var f = idNum < 0 ? disableButton : enableButton;
				f($el);
			}
			
			if (currentEntry) {
				_setButtonState($editEntry, currentEntry['entryNum']);
				_setButtonState($shareEntry, currentEntry['entryNum']);
				_setButtonState($nextEntry, currentEntry['nextEntry']);
				_setButtonState($prevEntry, currentEntry['prevEntry']);
				var text, icon;
				if (currentEntry['treeRoot'] && currentEntry.treeRoot['publicID']) {
					text = 'Unshare ';
					icon = 'icon-lock';
				} else {
					text = 'Share ';
					icon = 'icon-globe';
				}
				$icon = $('<i>').addClass(icon);
				$shareEntry.text(text)
				$shareEntry.append($icon);
			} else {
				// viewing a node, disable the whole toolbar
				$editEntry.attr('disabled', 'disabled');
				$shareEntry.attr('disabled', 'disabled');
				$nextEntry.attr('disabled', 'disabled');
				$prevEntry.attr('disabled', 'disabled');
			}
		}

		function resetEntryHeader() {
			$entryHeader.empty();
			if (currentEntry) {
				var $dateLabel = $('<h3>');
				var dateObj = new Date(currentEntry['creationDate']);
				$dateLabel.text(dateObj.toLocaleDateString());
				var $idLabel = $('<h4>');
				if (currentEntry.treeRoot['publicID']) {
					var url = '/public/' + currentEntry.treeRoot['publicID'] + '/';
					$idLabel.html("This entry is <a href='" + url + "'>public</a>");
				} else {
					$idLabel.text("This entry is private.");
				}
				$entryHeader.append($idLabel);
				$entryHeader.append($dateLabel);
			} else {
				$btn = $('<button class="btn">');
				$btn.text('View full entry');
				$btn.click(function (e) {
					var params = { entryNum : containingEntry };
					PersistenceManager.requestEntry(params, parseEntry);
				});
				$entryHeader.append($btn);
				$entryHeader.append('</br></br>');
			}
		}

		function parseNodeResponse(rawResponse, node) {
			NodeViewer.buildNodeView(node);
			containingEntry = rawResponse['containingEntryNum'];
			currentEntry = null;
			resetToolbar();
			resetEntryHeader();
		}

		function parseEntry(response) {
			if (response.treeRoot) {
				var n = PersistenceManager.nodeFromJSON(response.treeRoot);
				NodeViewer.buildNodeView(n);
			}
			currentEntry = response;
			containingEntry = NONE;

			resetToolbar();
			resetEntryHeader();
		}

		$nextEntry.click(function() {
			var params = { entryNum : currentEntry['entryNum'] + 1 };
			PersistenceManager.requestEntry(params, parseEntry);
			return false;
		});

		$prevEntry.click(function() {
			var params = { entryNum : currentEntry['entryNum'] - 1 };
			PersistenceManager.requestEntry(params, parseEntry);
			return false;
		});

		$editEntry.click(function() {
			window.location = '/write_entry/?entryNum=' + currentEntry['entryNum'];
			return false;
		});

		$shareEntry.click(function() {
			PersistenceManager.togglePublic(currentEntry['entryNum'], function(response) {
				if (!response.hasOwnProperty('publicID')) {
					alert("Error. Could not set public.");
				}
				currentEntry.treeRoot['publicID'] = response['publicID'];
				resetToolbar();
				resetEntryHeader();
			});
			return false;
		});

		PersistenceManager.requestEntry(null, parseEntry); // gets most recent

		var initData = {
			$searchBtn : $('#searchBtn'),
			$searchBar : $('#searchBar'),
			$displayArea : $('#searchDisplay'),
		}
		var searchController = NodeSearcher.init(initData);	
		$(searchController).on('nodeSelected', function (e, nodeID) {
			PersistenceManager.requestNode(nodeID, parseNodeResponse);
		});
	});
});

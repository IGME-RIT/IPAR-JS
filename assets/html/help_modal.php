<div id="help-modal" class="modal fade" role="dialog"> 
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal">&times;</button>
				<h4 class="modal-title" id="help-modal-title"></h4>
			</div>
			<div class="modal-body">
				<p id="help-modal-body"></p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				<button type="button" class="btn btn-primary" id="help-prev-button" onclick="prevHelpPage()">Previous</button>
				<button type="button" class="btn btn-primary" id="help-next-button" onclick="nextHelpPage()">Next</button>
			</div>
		</div>
	</div>
</div>

<!-- TODO: build, minify, and include here -->
<script type="text/javascript">
	var helpPage = 0;
	var helpData;

	// loads the help info at the path
	function loadHelp(path) {	
		var req = new XMLHttpRequest();
		req.onload = function() {
			if(req.status === 200) {
				helpData = JSON.parse(req.responseText);
				setHelpModalContent(helpPage);
				showHelp();
			}
		}
		req.open('GET', path);
		req.send();
	}
	
	// loads help if it is not already loaded
	function loadHelpOnce(path) {
		if(helpData == null){
			loadHelp(path);
		}
		else {
			showHelp();
		}
	}

	function nextHelpPage() {
		setHelpModalContent(++helpPage);
	}

	function prevHelpPage() {
		setHelpModalContent(--helpPage);
	}

	function setHelpModalContent(page) {
		document.getElementById("help-modal-title").innerHTML = helpData[page]["title"];
		document.getElementById("help-modal-body").innerHTML = helpData[page]["description"];

		// disable next button if we need to
		document.getElementById("help-next-button").disabled = page + 1 == helpData.length;

		// disable previous button if we need to
		document.getElementById("help-prev-button").disabled = page == 0;
	}
	
	// show the help modal
	function showHelp() {
		$("#help-modal").modal("show");
	}
	
	// hide the help modal
	function hideHelp() {
		$("#help-modal").modal("hide");
	}
</script>

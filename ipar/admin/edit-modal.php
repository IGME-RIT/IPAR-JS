<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Modal Editor</title>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
	</head>
	<body>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/help_modal.php"; ?>
		<div class="jumbotron">
			<div class="container">
                <div class="row">
                    <div class="col-md-12 col-vcenter">
                        <h1 class="uline">Help Modal Editor</h1>
                    </div>
                </div>
				<div class="col-md-6 col-xs-12">
					<div class="row">
						<label for="modal-select" style="width: 9%">Modal: </label>
						<select name="modal-select" id="modal-select" style="width: 90%">
							<option value="Test">Test</option>
						</select>
					</div>
					<div class="row" style="padding-bottom: 10px">
						<label for="page-select" style="width: 9%">Page: </label>
						<select name="page-select" id="page-select" style="width: 90%">
							<option value="1">Page 1</option>
							<option value="2">Page 2</option>
							<option value="new" id="new-page-option">&lt;New Page&gt;</option>
						</select>
					</div>
					<div class="row" style="padding-bottom: 5px">
						<input type="text" name="modal-name" id="modal-name" style="width:100%" disabled>
					</div>
					<div class="row">
						<textarea name="modal-body" id="modal-body" rows="15" style="width: 100%" disabled></textarea>
					</div>
					<div class="row">
						<div class="col-xs-3" style="padding: 0; text-align:left;">
							<a href="#" onclick="loadHelp('/assets/php/modal/modal.php?name=Modal%20Editor&format=html');">Modal Editor Help</a>
						</div>
						<div class="col-xs-9" style="padding: 0; text-align:right;">
							<button type="button" class="btn btn-default" id="delete-page-button">Delete Page</button>
							<button type="button" class="btn btn-primary" id="save-button">Save</button>
						</div>
					</div>
				</div>
				<div class="col-md-6 col-xs-12">
					<h4>Preview</h4>
					<div id="demo-modal"> 
						<div class="modal-dialog" style="width: auto;">
							<div class="modal-content">
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal" disabled>&times;</button>
									<h4 class="modal-title" id="preview-modal-title"></h4>
								</div>
								<div class="modal-body">
									<p id="preview-modal-body"></p>
								</div>
								<div class="modal-footer">
									<button type="button" class="btn btn-default" data-dismiss="modal" disabled>Close</button>
									<button type="button" class="btn btn-primary" id="preview-prev-button" disabled>Previous</button>
									<button type="button" class="btn btn-primary" id="preview-next-button" disabled>Next</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<script>
			//TODO: move to node module(s)
			updateModalsList();

			updateTextAreas();
			document.getElementById("modal-select").addEventListener('change', onModalSelectChange);

			document.getElementById("page-select").addEventListener('change', onPageSelectChange);
			
			document.getElementById("modal-name").addEventListener('keyup', updatePreviewTitle);
			document.getElementById("modal-name").addEventListener('input', updatePreviewTitle);

			document.getElementById("modal-body").addEventListener('keyup', updatePreview);
			document.getElementById("modal-body").addEventListener('input', updatePreview);

			document.getElementById("save-button").addEventListener('click', saveModal);
			document.getElementById("delete-page-button").addEventListener('click', function(){deletePage()});

			var currentModal; //json representation of the current modal

			function onModalSelectChange() {
				if(confirm("Are you sure you'd like to change modals? Any unsaved changes will be lost.")) {
					// get updated modal info
					updateCurrentModal(this.value);
				}
			}

			function onPageSelectChange() {
				updateTextAreas();
				
			}

			function updateCurrentModal(name=currentModal['name'], page=null) {
				// get updated modal info
				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						console.log(req.responseText);
						currentModal = JSON.parse(req.responseText);
						if(currentModal['pages'].length > 0 && page == null) {
							updatePageList(currentModal['pages'][0]['id']);
						}
						else if(page != null) {
							updatePageList(page);
						}
						else {
							updatePageList("new");
						}
					}
					else {
						alert("Failed to load modal!\nError " + req.status + ": " + req.responseText);
					}
				}
				req.open("GET", "/assets/php/modal/modal.php?name="+name); // TODO: send name as json
				req.send();
			}

			function updateModalsList() {
				var modalSelect = document.getElementById("modal-select");
				modalSelect.disabled = true;

				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						// get response object
						var modals = JSON.parse(req.responseText);

						// get current select value
						var lastVal = modalSelect.value;

						// clear select options
						modalSelect.innerHTML = "";

						// set select options
						for(var i = 0; i < modals.length; i++) {
							var option = document.createElement("option");
							option.text = modals[i]['name'];
							option.value = modals[i]['name'];
							modalSelect.add(option);
							
						}
						// update current modal
						updateCurrentModal(modalSelect.value);
					}
					else {
						alert("Failed to update modals list!");
					}

					// enable the select
					modalSelect.disabled = false;
				}
				req.open("GET", "/assets/php/modal/modals.php");
				req.send();
			}

			function updatePageList(selectedValue) {
				var pages = currentModal['pages'];
				var pageSelect = document.getElementById("page-select");

				// get current select value
				var lastVal = selectedValue;
				if(selectedValue === undefined){
					lastVal = pageSelect.value;
				}

				// get new page option element
				var newPageElement = document.getElementById("new-page-option");

				// clear select options
				pageSelect.innerHTML = "";

				// set select options
				for(var i = 0; i < pages.length; i++) {
					var option = document.createElement("option");
					option.text = pages[i]['title'];
					option.value = pages[i]['id'];
					pageSelect.add(option);
					
				}

				// add new page option back to options
				pageSelect.add(newPageElement);

				// reselect old option if it exists
				pageSelect.value = lastVal;

				// update text areas
				updateTextAreas();

			}

			function updateTextAreas() {	
				var pageId = document.getElementById("page-select").value;
				var nameInput = document.getElementById('modal-name');
				var bodyInput = document.getElementById('modal-body');

				// clear text areas if selected page is 'new'
				if(pageId === "new") {
					nameInput.value = "";
					bodyInput.value = "";

					updatePreview();
					updatePreviewTitle();

					return;
				}
					
				var button = document.getElementById("delete-page-button");
				button.disabled = (document.getElementById("page-select").value === "new")

				// get page info in markdown
				getPage(pageId, 'md', function(page) {
					// set input values
					nameInput.value = page['title'];
					nameInput.disabled = false;
			
					bodyInput.value = page['body'];
					bodyInput.disabled = false;
					
					updatePreview();
					updatePreviewTitle();
				});
			}

			var previewRequest;
			var lastBody;

			function updatePreview() {
				// get html from markdown
				var body = document.getElementById('modal-body').value;
			
				// don't make a request if there are no changes
				if(body === lastBody) return;
				lastBody = body;

				// abort the last request if it is still running
				if(previewRequest != null) { previewRequest.abort(); }
				
				previewRequest = new XMLHttpRequest();
				previewRequest.onload = function() {
					if(previewRequest.status === 200) {
						document.getElementById('preview-modal-body').innerHTML = previewRequest.responseText;
						previewRequest = null;
					}
					else {
						alert("Failed to update preview!");
					}
				}
				previewRequest.open('GET', '/assets/php/markdown_helper.php?md=' + encodeURIComponent(body));
				previewRequest.send();
			}

			function updatePreviewTitle() {
				var title = document.getElementById('modal-name').value;
				document.getElementById('preview-modal-title').innerHTML = title;
			}

			function getPage(id, format = 'html', callback) {
				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						var page = JSON.parse(req.responseText);
						callback(page);
					}
					else {
						alert("Failed to get page information!\n" + req.status + ": " + req.responseCode);
					}
				}
				req.open('GET', '/assets/php/modal/page.php?id=' + id + '&format=' + format);
				req.send();
			}

			function saveModal() { //TODO: save modal object, not current page
				var btn = document.getElementById('save-button');
				btn.disabled = true;
				var id = document.getElementById('page-select').value;
				var title = document.getElementById('modal-name').value;
				var body = document.getElementById('modal-body').value;

				if(id === 'new') {
					// make new page
					var modalName = document.getElementById('modal-select').value;
					newPage(modalName, title, body);
					btn.disabled = false;
					return;
				}

				var data = "id="+id+"&title="+title+"&body="+body; //TODO: json

				var req = new XMLHttpRequest();
				req.onload = function() {
					btn.disabled = false;
					if(req.status === 200) {
						// update page list
						updateCurrentModal(currentModal['name'], id);
					}
					else {
						alert("Save failed!\n" + req.status + ": " + req.responseCode);
					}
				}
				req.open('PUT', '/assets/php/modal/page.php');
				req.send(data);
			}
			
			function newPage(modalname, title, body) {
				var data = {
					'modalname': modalname,
					'title': title,
					'body': body
				};

				// make request
				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						// get page from response
						var page = JSON.parse(req.responseText);
						// update modal
						updateCurrentModal(modalname, page['id']);
					}
					else {
						alert("Save failed!\n" + req.status + ": " + req.responseText);
					}
				}
				req.open('POST', '/assets/php/modal/page.php');
				req.send(JSON.stringify(data));
			}

			function deletePage(id) {
				if(id === undefined) {
					// get current page id
					id = document.getElementById('page-select').value;
				}

				// confirm
				if(confirm("Are you sure you want to delete this page?")) {
					// disable button
					var btn = document.getElementById('delete-page-button');
					btn.disabled = true;
					
					// prepare json payload
					var data = {"id":id};

					// send request
					var req = new XMLHttpRequest();
					req.onload = function() {
						if(req.status === 200) {
							var pages = document.getElementById('page-select');
							updateCurrentModal();
						}
						else {
							alert("Failed to delete page!\nError " + req.status + ": "+req.responseText);
						}

						btn.disabled = false;
					}
					req.open("DELETE", "/assets/php/modal/page.php");
					req.send(JSON.stringify(data));
				}
			}
		</script>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php"; ?>
	</body>
</html>

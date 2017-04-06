<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Modal Editor</title>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
	</head>
	<body>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
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
					<div class="row" style="text-align: right;">
						<button type="button" class="btn btn-default" id="delete-page-button">Delete Page</button>
						<button type="button" class="btn btn-primary" id="save-button">Save</button>
					</div>
				</div>
				<div class="col-md-6 col-xs-12">
					<h4>Preview</h4>
					<div id="demo-modal"> 
						<div class="modal-dialog" style="width: auto;">
							<div class="modal-content">
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal" disabled>&times;</button>
									<h4 class="modal-title" id="help-modal-title"></h4>
								</div>
								<div class="modal-body">
									<p id="help-modal-body"></p>
								</div>
								<div class="modal-footer">
									<button type="button" class="btn btn-default" data-dismiss="modal" disabled>Close</button>
									<button type="button" class="btn btn-primary" id="help-prev-button" disabled>Previous</button>
									<button type="button" class="btn btn-primary" id="help-next-button" disabled>Next</button>
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
			document.getElementById("modal-select").addEventListener('change', updateTextAreas);
			document.getElementById("modal-select").addEventListener('change', updatePageList);

			document.getElementById("page-select").addEventListener('change', onPageSelectChange);
			
			document.getElementById("modal-name").addEventListener('keyup', updatePreviewTitle);
			document.getElementById("modal-name").addEventListener('input', updatePreviewTitle);

			document.getElementById("modal-body").addEventListener('keyup', updatePreview);
			document.getElementById("modal-body").addEventListener('input', updatePreview);

			document.getElementById("save-button").addEventListener('click', saveModal);
			document.getElementById("delete-page-button").addEventListener('click', function(){deletePage()});

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
							
							// reselect old option if it exists
							if(option['name'] == lastVal){
								modalSelect.value = option['name'];
							}
						}

						// update page list
						updatePageList();
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

			function onPageSelectChange() {
				var modalSelect = document.getElementById("modal-select");
				var pageSelect = document.getElementById("page-select");
				if(pageSelect.value === "new") { // new page selected
					newPage(modalSelect.value, "New Page", "");
				}
				else {
					updateTextAreas();
				}
			}

			function updatePageList(selectedValue) {
				var modalSelect = document.getElementById("modal-select");
				var pageSelect = document.getElementById("page-select");
				pageSelect.disabled = true;

				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						// get response object
						var modal = JSON.parse(req.responseText);
						var pages = modal['pages'];

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
					else {
						alert("Failed to update pages list!");
					}

					// enable the select
					pageSelect.disabled = false;
				}
				req.open("GET", "/assets/php/modal/modal.php?name="+modalSelect.value);
				req.send();
			}

			function updateTextAreas() {
				var pageId = document.getElementById("page-select").value;

				// get page info in markdown
				getPage(pageId, 'md', function(page) {
					// set input values
					var nameInput = document.getElementById('modal-name');
					nameInput.value = page['title'];
					nameInput.disabled = false;

					var bodyInput = document.getElementById('modal-body');
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
						document.getElementById('help-modal-body').innerHTML = previewRequest.responseText;
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
				document.getElementById('help-modal-title').innerHTML = title;
			}

			function getModal(name, format = 'html', callback) {
				var req = new XMLHttpRequest();
				req.onload = function() {
					if(req.status === 200) {
						var modal = JSON.parse(req.responseText);
						callback(modal);
					}
					else {
						alert("Failed to get modal information!\n" + req.status + ": " + req.responseCode);
					}
				}
				req.open('GET', '/assets/php/modal/modal.php?name=' + name + '&format=' + format);
				req.send();
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

			function saveModal() {
				this.disabled = true;
				var btn = this;
				var id = document.getElementById('page-select').value;
				var title = document.getElementById('modal-name').value;
				var body = document.getElementById('modal-body').value;

				var data = "id="+id+"&title="+title+"&body="+body; //TODO: json

				var req = new XMLHttpRequest();
				req.onload = function() {
					btn.disabled = false;
					if(req.status === 200) {
						// update page list
						updatePageList();
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

						updatePageList(page['id']);
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
							updatePageList(pages.options[0].value);
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

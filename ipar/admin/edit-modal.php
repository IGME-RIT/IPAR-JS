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
							<option value="Page 1">Page 1</option>
						</select>
					</div>
					<div class="row" style="padding-bottom: 5px">
						<input type="text" name="modal-name" id="modal-name" style="width:100%" disabled>
					</div>
					<div class="row">
						<textarea name="modal-body" id="modal-body" rows="15" style="width: 100%" disabled></textarea>
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
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php"; ?>
	</body>
</html>

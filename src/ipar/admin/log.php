<?php require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR - Admin Log</title>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
	<div class="jumbotron">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <h1 class="uline">Admin Log</h1>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
					<pre id="log" style="height: 60vh;">
					</pre>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 col-xs-12">
		        	<ul class="panel-buttons col border">
		    			<li>
		    				<a id="back" href="./" class="btn-tile horiz">
		    					<span class="glyphicon glyphicon-arrow-left"></span>
		    					<span class="name">Back</span>
		    				</a>
		    			</li>
		    		</ul>
                </div>
				<div class="col-md-6 col-xs-12">
					<ul class="panel-buttons col border">
						<li>
							<a id="refresh" href="#" onclick="updateLog()" class="btn-tile horiz">
								<span class="glyphicon glyphicon-refresh"></span>
								<span class="name">Refresh</span>
							</a>
						</li>
					</ul>
				</div>
            </div>
        </div>
    </div>
	<script type="text/javascript">
		var log = document.querySelector("#log");
		updateLog();

		function updateLog() {
			// make ajax request to get raw log
			var request = new XMLHttpRequest();
			request.open("GET", "rawLog.php");
			request.onreadystatechange = function() {
				if(request.readyState === XMLHttpRequest.DONE) {
					log.innerText = request.responseText;
				}
			}
			request.send();
		}
	</script>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

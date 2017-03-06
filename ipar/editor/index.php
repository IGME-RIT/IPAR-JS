<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Editor</title>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
	</head>
	<body>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
		<div class="jumbotron">
			<div class="container">
                <div class="row">
                    <div class="col-md-12 col-vcenter">
                        <h1 class="uline">Editor</h1>
                    </div>
                </div>
                <ul class="panel-buttons">
                    <li>
                        <a href="#" data-toggle="modal" data-target="#newCaseModal" class="btn-tile">
                            <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
                            <span class="name">New Case</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" data-toggle="modal" data-target="loadCaseModal" class="btn-tile">
                            <span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>
                            <span class="name">Load Case</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" data-toggle="modal" data-target="loadCaseModal" class="btn-tile">
                            <span class="glyphicon glyphicon-play" aria-hidden="true"></span>
                            <span class="name">Continue</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" data-toggle="modal" data-target="convertCaseModal" class="btn-tile">
                            <span class="glyphicon glyphicon-retweet" aria-hidden="true"></span>
                            <span class="name">Convert</span>
                        </a>
                    </li>
                    <li>
                        <a href="/" class="btn-tile">
                            <span class="glyphicon glyphicon-home" aria-hidden="true"></span>
                            <span class="name">Home</span>
                        </a>
                    </li>
                </ul>
			</div>
		</div>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php"; ?>
	</body>
</html>

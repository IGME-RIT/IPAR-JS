<?php
	session_start();
	if($_SESSION && $_SESSION["user"]){
		header("Location: ../editor/");
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR - Recover User</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php' ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
</head>
<body>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php' ?>
    <div class="jumbotron">
    	<div class="container" style="max-width:430px;">
			<div class="row">
				<div class="col-xs-12">
    				<h1 class="uline med">Lost Username</h1>
				</div>
			</div>
    		<form name="recoverUser" action="recoverUserCheck.php" method="POST">
				<div class="row">
					<div class="col-xs-12">
   			 			Enter the email address associated with the account:
					</div>
				</div>
				<div class="row">
					<div class="col-xs-12">
						<input type="email" name="email" />
					</div>
				</div>
				<div class="row">
					<ul class="panel-buttons col border" style="margin-top: 10px">
						<div class="col-md-4 col-xs-12">
							<li>
								<a href="./login.php" class="btn-tile horiz">
									<span class="glyphicon glyphicon-arrow-left"></span>
									<span class="name">Back</span>
								</a>
							</li>
						</div>
						<div class="col-md-8 col-xs-12">
							<li>
								<a onclick="document.forms['recoverUser'].submit();" href="#" class="btn-tile horiz">
									<span class="glyphicon glyphicon-refresh"></span>
									Recover
								</a>
							</li>
						</div>
					</ul>
				</div>
			</form>
		</div>
    </div>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php' ?>
</body>
</html>

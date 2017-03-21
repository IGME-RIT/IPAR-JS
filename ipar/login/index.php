<?php
	session_start();
	if($_SESSION && $_SESSION["user"]){
		header("Location: ../");
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
</head>
<body>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <div class="jumbotron">
		<div class="container">
        	<div class="row">
				<div class="col-xs-12">
            		<h1 class="uline">IPAR Login</h1>
					<ul class="panel-buttons col">
    			    	<li>
							<a href="./login.php" class="btn-tile horiz">
								<span class="glyphicon glyphicon-%gly%"></span>
								<span class="name">Login</span>
							</a>
						</li>
    			    	<li>
							<a href="./signup.php" class="btn-tile horiz">
								<span class="glyphicon glyphicon-%gly%"></span>
								<span class="name">Sign Up</span>
							</a>
						</li>
    			    	<li>
							<a href="../" class="btn-tile horiz">
								<span class="glyphicon glyphicon-%gly%"></span>
								<span class="name">Back to Main Menu</span>
							</a>
						</li>
					</ul>
				</div>
    		</div>
		</div>
    </div>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

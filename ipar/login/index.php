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
					<ul class="panel-buttons ">
    			    	<li>
							<a href="./login.php" class="btn-tile ">
								<span class="glyphicon glyphicon-log-in"></span>
								<span class="name">Login</span>
							</a>
						</li>
    			    	<li>
							<a href="./signup.php" class="btn-tile ">
								<span class="glyphicon glyphicon-plus"></span>
								<span class="name">Sign Up</span>
							</a>
						</li>
    			    	<li>
							<a href="../" class="btn-tile ">
								<span class="glyphicon glyphicon-home"></span>
								<span class="name">Home</span>
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

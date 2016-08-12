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
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
</head>
<body>
    <section class="menu">
    	<div>
    		<h1>Lost Password</h1>
    		<form name="recoverPass" action="recoverPassCheck.php" method="POST">
    			Enter the username of the account:<br>
				<input type="text" name="username" />
				<a onclick="document.forms['recoverPass'].submit();" href="#" class="menuButton">Recover</a>
				<a href="./login.php" class="menuButton">Back</a>
			</form>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>
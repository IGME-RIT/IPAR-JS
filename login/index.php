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
    		<h1>IPAR Editor</h1>
			<a href="./login.php" class="menuButton">Login</a>
			<a href="./signup.php" class="menuButton">Sign Up</a>
			<a href="../index.html" class="menuButton">Back to Main Menu</a>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

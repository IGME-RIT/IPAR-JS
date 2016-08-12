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
    		<h1>Lost Username</h1>
    		<form name="recoverUser" action="recoverUserCheck.php" method="POST">
    			Enter the email address associated with the account:<br>
				<input type="email" name="email" />
				<a onclick="document.forms['recoverUser'].submit();" href="#" class="menuButton">Recover</a>
				<a href="./login.php" class="menuButton">Back</a>
			</form>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

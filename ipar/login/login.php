<?php
	session_start();
	if($_SESSION && $_SESSION["user"]){
		header("Location: ../editor");
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
    		<h1>IPAR Editor Login</h1>
    		<form name="login" action="loginCheck.php" method="POST" onsubmit="return vaildate();">
				Username: <input type="text" name="username" required />
				<hr>
				Password: <input type="password" name="password" required />
				<div class="menuLinks">
					<a class="menuLink" href="./recoverUser.php">Forgot Username</a><br>
					<a class="menuLink" href="./recoverPass.php">Forgot Password</a>
				</div>
				<a onclick="document.forms['login'].submit();" href="#" class="menuButton">Login</a>
				<a href="./index.php" class="menuButton">Back</a>
			</form>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
	<script type='text/javascript'>
		var username = /username=(.*?)&/g.exec(window.location.search)[1];
		document.forms['login']['username'].value = decodeURIComponent(username);
	</script>
</body>
</html>
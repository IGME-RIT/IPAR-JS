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
	<script type='text/javascript'>
		function submit(){ 
			if(document.forms["signup"]["password"].value!=document.forms["signup"]["password2"].value){
				alert("Your passwords don't match!");
				document.forms["signup"]["password"].value = "";
				document.forms["signup"]["password2"].value = "";
			}
			else if(document.forms["signup"]["email"].value != "" && !document.forms["signup"]["email"].checkValidity())
				alert(document.forms["signup"]["email"].validationMessage);
			else if(!document.forms["signup"].checkValidity())
				alert('Please fill out every entry in the form');
			else
				document.forms["signup"].submit();
		}
	</script>
</head>
<body>
    <section class="menu">
    	<div>
    		<h1>IPAR Editor Create Account</h1>
    		<form name="signup" action="new_user.php" method="POST">
				Username: <input type="text" name="username" required />
				<hr>
				Email: <input type="email" name="email" required />
				<hr>
				Password: <input type="password" name="password" required />
				<hr>
				Confirm Password: <input type="password" name="password2" required />
                <hr>
                First Name: <input type="text" name="first-name" required />
                <hr>
                Last Name: <input type="text" name="last-name" required />
                <hr>
                Organization: <input type="text" name="organization" required />
				<a href="#" onclick="submit();" class="menuButton">Create Account</a>
				<a href="./index.php" class="menuButton">Back</a>
			</form>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
	<script type='text/javascript'>
		var username = /(?:&|\?)username=(.*?)&/g.exec(window.location.search)[1];
		document.forms["signup"]["username"].value = decodeURIComponent(username);
		var email = /(?:&|\?)email=(.*?)&/g.exec(window.location.search)[1];
		document.forms["signup"]["email"].value = decodeURIComponent(email);
	</script>
</body>
</html>

<?php 
	session_start();
	$db = new SQLite3('../../../users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$email = strtolower($_POST['email']);
	if(!$email || !filter_var($_POST["email"], FILTER_VALIDATE_EMAIL)){
	   	echo "<script type='text/javascript'>
			   	alert('That email address is not vaild!');
			   	window.location.href = './edit.php';
		   	</script>";
	   	exit();
	}
	$result = $db->query("SELECT * FROM users WHERE email = '$email'");
	if($res = $result->fetchArray()){
		echo "<script type='text/javascript'>
		alert('That email is already in use by another account!');
		window.location.href = './edit.php';
		</script>";
		exit();
	}
	$db->query("UPDATE users SET email = '$email' WHERE username = '$user'");
	header("Location: ./message.html?message=Your email address has been changed!&");
	exit();
?>
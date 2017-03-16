<?php 
	session_start();
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$email = strtolower($_POST['email']);
	if(!$email || !filter_var($_POST["email"], FILTER_VALIDATE_EMAIL)){
	   	echo "<script type='text/javascript'>
			   	alert('That email address is not vaild!');
			   	window.location.href = './edit.php';
		   	</script>";
	   	exit();
	}

    $sth = $dbh->prepare("SELECT * FROM users WHERE email = :email");
    $sth->execute(array(":email"=>$email));
    if($res = $sth->fetchAll()){
		echo "<script type='text/javascript'>
		alert('That email is already in use by another account!');
		window.location.href = './edit.php';
		</script>";
		exit();
	}

    $sth = $dbh->prepare("UPDATE users SET email = :email WHERE username = :username");
    $success = $sth->execute(array(":email"=>$email, ":username"=>$user));
	header("Location: /message.php?message=Your email address has been changed!&redirect=/ipar/login/edit.php");
	exit();
?>
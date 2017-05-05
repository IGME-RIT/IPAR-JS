<?php
	require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php';

	session_start();

    $dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$key = gen_key();
    $sdh = $dbh->prepare("UPDATE users SET curKey = :curKey WHERE username = :username");
    $sdh->execute(array(":curKey"=>$key, ":username"=>$user));
	$parts = explode('/',$_SERVER['REQUEST_URI']);
	$path = '';
	for($i = 0;$i<count($parts)-2;$i++)
		$path .= $parts[$i] . "/";
	$path .= $parts[count($parts)-2];
	$path = $_SERVER['HTTP_HOST'].$path;
	$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$path/activate.php?key=$key&";
	mail($_POST['email'],'Account Activation',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
	header("Location:/message.php?message=You will be emailed a new confirmation email shortly. Please use it to confirm your email and unlock your account for use.&");
	exit();
?>

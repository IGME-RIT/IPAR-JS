<?php 
    $db = new SQLite3('../../../users.sql') or die ("cannot open");
	$key = $_GET['key'];
	if(!$key) 
		header("Location: ./message.html?message=That recovery link is expired!&");
	$result = $db->query("SELECT * FROM users WHERE curKey = '$key'");
	if($result->fetchArray()){
		$db->query("UPDATE users SET active = 1 WHERE curKey = '$key'");
		header("Location: ./message.html?message=Your account has now been activated!&");
		exit();
	}
	header("Location: ./message.html?message=That recovery link is expired!&");
	exit();
?>
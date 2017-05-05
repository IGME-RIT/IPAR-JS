<?php 
	require_once $_SERVER['DOCUMENT_ROOT']."/assets/php/util.php";

	$key = $_GET['key'];
	if(!$key) 
		header("Location: /message.php?message=That recovery link is expired!&");

	if($res = get_user_from_key($key, $KEY_RELATION['email'])){
        $sdh = $dbh->prepare("UPDATE users SET active = 1 WHERE username = :username");
        $sdh->execute(array(":username"=>$res['username']));
		
		// delete old key
		delete_keys($res['username'], $KEY_RELATION['email']);

		header("Location: /message.php?message=Your account has now been activated!&");
		exit();
	}

	header("Location: /message.php?message=That recovery link is expired!&");
	exit();
?>

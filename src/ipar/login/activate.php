<?php 
    $dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$key = $_GET['key'];
	if(!$key) 
		header("Location: /message.php?message=That recovery link is expired!&");
    $params = array(":curKey"=>$key);
    $sdh = $dbh->prepare("SELECT * FROM users WHERE curKey = :curKey");
    $sdh->execute($params);
	if($sdh->fetchAll()){
        $sdh = $dbh->prepare("UPDATE users SET active = 1 WHERE curKey = :curKey");
        $sdh->execute($params);
		header("Location: /message.php?message=Your account has now been activated!&");
		exit();
	}
	header("Location: /message.php?message=That recovery link is expired!&");
	exit();
?>
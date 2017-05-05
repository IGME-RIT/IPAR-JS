<?php
	require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php';
	session_start();

	if($_POST && $_POST['username'] && $_POST['username']!=""){
		$user = strtolower($_POST['username']);

		$sth = $dbh->prepare("SELECT email FROM users WHERE username = :username");
		 $sth->execute(array(":username"=>$user));
		 if($res = $sth->fetch()){
			  	$key = set_key($user, $KEY_RELATION['password']);
			  
				$parts = explode('/',$_SERVER['REQUEST_URI']);
				$path = '';
				for($i = 0;$i<count($parts)-2;$i++)
					$path .= $parts[$i] . "/";
				$path .= $parts[count($parts)-2];
				$path = $_SERVER['HTTP_HOST'].$path;
				$msg = "Hello $user,\n Sorry to hear you lost your password. Please use the following link to reset your password:\n\nhttp://$path/resetPass.php?key=$key&";
				mail($res['email'],'Lost Password',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
		}
	}
	header("Location: /message.php?message=A recovery email was sent to the email address for the account with the given username if the account exists. Follow the instructions in the email to change your passsword.&");
	exit();
?>

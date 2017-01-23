<?php
   session_start();
   if($_POST && $_POST['email'] && $_POST['email']!=""){
	   $db = new SQLite3('../../../db/users.sql') or die ("cannot open");
	   $email = strtolower($_POST['email']);
	   $result = $db->query("SELECT username FROM users WHERE email = '$email'");
	   if($res = $result->fetchArray()){

	   		$user = strtolower($res['username']);
		   	$parts = explode('/',$_SERVER['REQUEST_URI']);
		   	$path = '';
		   	for($i = 0;$i<count($parts)-2;$i++)
		   		$path .= $parts[$i] . "/";
	   		$path .= $parts[count($parts)-2];
	   		$path = $_SERVER['HTTP_HOST'].$path;
	   		$msg = "Hello $user ,\n Sorry to hear you lost your username. Your username is $user.\n If you lost your password as well you can use the following link with your username to reset your password:\n\nhttp://$path/recoverPass.php";
	   		mail($email,'Lost Username',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
	   	
	   }
	   
   }
   header("Location: ./message.html?message=A recovery email was sent to the email address if their is an account connected to it. Follow the instructions in the email to recover your account.&");
   exit();
?>
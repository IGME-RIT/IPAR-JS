<?php
   session_start();
   if($_POST && $_POST['username'] && $_POST['username']!=""){
	   $db = new SQLite3('../../../db/users.sql') or die ("cannot open");
	   $user = strtolower($_POST['username']);
	   $result = $db->query("SELECT email FROM users WHERE username = '$user'");
	   if($res = $result->fetchArray()){
	   	
		   	$key = uniqid($user, true);
		   	$db->query("UPDATE users SET curKey = '$key' WHERE username = '$user'");
		   	
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
   header("Location: ./message.html?message=A recovery email was sent to the email address for the account with the given username if the account exists. Follow the instructions in the email to change your passsword.&");
   exit();
?>
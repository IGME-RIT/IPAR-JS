<?php
   session_start();
   if($_POST){
	   $db = new SQLite3('../../../users.sql') or die ("cannot open");
	   $user = strtolower($_POST['username']);
	   if($user && $_POST['password'] && $_POST['password']!="" && preg_match('/^[a-z0-9_]+$/', $user)==1){
		   $result = $db->query("SELECT password FROM users WHERE username = '$user'");
		   if($res = $result->fetchArray()){
		   	if(password_verify($_POST['password'] , $res['password'])){
		   		$_SESSION["user"] = $user;
		   		header("Location: ../editor/");
		   		exit();
		   	}
		   }
	   }
   	   echo "<script type='text/javascript'>
			   alert('Invaild username or password!');
			   window.location.href = './login.php?username=$user&';
		   </script>";
   	   exit();
   }
   echo "<script type='text/javascript'>
		   alert('Invaild username or password!');
		   window.location.href = './login.php';
	   </script>";
   exit();
?>
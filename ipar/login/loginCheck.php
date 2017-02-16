<?php
   session_start();
   if($_POST){
	   $dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	   $user = strtolower($_POST['username']);
	   if($user && $_POST['password'] && $_POST['password']!="" && preg_match('/^[a-z0-9_]+$/', $user)==1){
		   //$result = $db->query("SELECT password FROM users WHERE username = '$user'");
           $sth = $dbh->prepare("SELECT password FROM users WHERE username = :username");
           $sth->execute(array(":username"=>$user));
		   if($res = $sth->fetch()){
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
<?php
	if(!$_POST || !$_POST['username'] || !$_POST['password'] || !$_POST['email'])
		exit();
		
   $db = new SQLite3('../../../users.sql') or die ("cannot open");
   $user = strtolower($_POST['username']);
   $email = strtolower($_POST['email']);;
   
   if(strlen($_POST['password'])<6 || preg_match('/^[A-Za-z0-9_]*$/', $_POST['password'])!=1 || preg_match('/[A-Z]+/', $_POST['password'])!=1 || preg_match('/[a-z]+/', $_POST['password'])!=1 || preg_match('/[0-9]+/', $_POST['password'])!=1){
	   	echo "<script type='text/javascript'>
			   	alert('Your password can only contain letters, numbers, and an underscore, must be at least 6 characters, and contain at least one lowercase letter, one uppercase letter, and one number!');
			   	window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
	   	exit();
   }
   if(strlen($user)<6 || strlen($user)>32 || preg_match('/^[a-z0-9_]*$/', $user)!=1){
	   	echo "<script type='text/javascript'>
			   	alert('Your username can only contain letters, numbers, and an underscore and must be between 6 and 32 characters!');
			   	window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
	   	exit();
   }
   if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
	   	echo "<script type='text/javascript'>
			   	alert('The given email address is not vaild!');
			   	window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
	   	exit();
   }
   
   $result = $db->query("SELECT * FROM users WHERE username = '$user'");
   if($result->fetchArray()){
	   	echo "<script type='text/javascript'>
	   			alert('That username is already in use!');
	   			window.location.href = './signup.php?username=$user&email=$email&';
	   		  </script>";
	   	exit();
   }
   else{
   	$result = $db->query("SELECT * FROM users WHERE email = '$email'");
   	if($res = $result->fetchArray()){
   		echo "<script type='text/javascript'>
	   			alert('That email is already in use!');
	   			window.location.href = './signup.php?username=$user&email=$email&';
	   		  </script>";
   		exit();
   	}
   	else{
   		$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		$key = uniqid($user, true);
   		$hash = password_hash($_POST['password'], PASSWORD_DEFAULT);
   		$db->query("INSERT INTO users VALUES ('$user','$email','$hash','$key',0);");
   		$parts = explode('/',$_SERVER[REQUEST_URI]);
   		$path = '';
   		for($i = 0;$i<count($parts)-2;$i++)
   			$path .= $parts[$i] . "/";
   		$path .= $parts[count($parts)-2];
   		$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$_SERVER[HTTP_HOST]$path/activate.php?key=$key&";
   		mail($_POST['email'],'Account Activation',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
   		header("Location: ./message.html?message=Your account has been created! You will be been emailed a confirmation email shortly. Please use it to confirm your email and unlock your account for use.&");
   	}
   }
?>
<?php 
	session_start();
	$db = new SQLite3('../../../users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$result = $db->query("SELECT password FROM users WHERE username = '$user'");
	if($res = $result->fetchArray()){
		if(password_verify($_POST['oldPassword'] , $res['password'])){
			if(strlen($_POST['password'])<6 || preg_match('/^[A-Za-z0-9_]*$/', $_POST['password'])!=1 || preg_match('/[A-Z]+/', $_POST['password'])!=1 || preg_match('/[a-z]+/', $_POST['password'])!=1 || preg_match('/[0-9]+/', $_POST['password'])!=1){
				echo "<script type='text/javascript'>
						alert('Your password can only contain letters, numbers, and an underscore, must be at least 6 characters, and contain at least one lowercase letter, one uppercase letter, and one number!');
						window.location.href = './edit.php';
					   </script>";
				exit();
			}
			$pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
			$db->query("UPDATE users SET password = '$pass' WHERE username = '$user'");
			header("Location: ./message.html?message=Your password has been changed!&");
			exit();
		}
	}
	echo "<script type='text/javascript'>
			   alert('Invaild username or password!');
			   window.location.href = './edit.php';
		   </script>";
	exit();
	
    
?>
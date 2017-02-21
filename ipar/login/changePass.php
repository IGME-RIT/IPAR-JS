<?php 
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$key = $_POST['key'];
	if(!$key)
		header("Location: /message.php?message=That recovery link is expired!&");
	//$result = $db->query("SELECT username FROM users WHERE curKey = '$key'");
    $sth = $dbh->prepare("SELECT username FROM users WHERE curKey = :curKey");
    $sth->execute(array(":curKey"=>$key));
	if(!$sth->fetch())
		header("Location: /message.php?message=That recovery link is expired!&");
	if(strlen($_POST['password'])<6 || preg_match('/^[A-Za-z0-9_]*$/', $_POST['password'])!=1 || preg_match('/[A-Z]+/', $_POST['password'])!=1 || preg_match('/[a-z]+/', $_POST['password'])!=1 || preg_match('/[0-9]+/', $_POST['password'])!=1){
			echo "<script type='text/javascript'>
				alert('Your password can only contain letters, numbers, and an underscore, must be at least 6 characters, and contain at least one lowercase letter, one uppercase letter, and one number!');
				window.location.href = './resetPass.php?key=$key&';
			</script>";
		exit();
	}
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
	//$db->query("UPDATE users SET password = '$pass' WHERE curKey = '$key'"); 
    $sth = $dbh->prepare("UPDATE users SET password = :password WHERE curKey = :curKey");
    $sth->execute(array(":password"=>$pass, ":curKey"=>$key));
    header("Location: /message.php?message=Your password has been changed!&"); 
?>
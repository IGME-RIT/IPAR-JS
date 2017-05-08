<?php 
	require_once $_SERVER['DOCUMENT_ROOT']."/assets/php/util.php";

	if(!isset($_SESSION['user']) && !isset($_SESSION['key']))
		header("Location: /message.php?message=That recovery link is expired!&redirect=/ipar/login/edit.php");
	
	$key = $_SESSION['key'];

	if(isset($_SESSION['user']))
		$user = get_user($_SESSION['user']);
	else
		$user = get_user_from_key($key, $KEY_RELATION['password']);

	if(!$user)
		header("Location: /message.php?message=That recovery link is expired!&redirect=/ipar/login/edit.php");

	// remove old key from database
	delete_keys($user['username'], $KEY_RELATION['password']);

	if(strlen($_POST['password'])<6 || preg_match('/^[A-Za-z0-9_]*$/', $_POST['password'])!=1 || preg_match('/[A-Z]+/', $_POST['password'])!=1 || preg_match('/[a-z]+/', $_POST['password'])!=1 || preg_match('/[0-9]+/', $_POST['password'])!=1){
		// if not logged in, create a new key for the user, and set it in session
		if(!isset($_SESSION['user'])) {
			$_SESSION['key'] = set_key($user['username'], $KEY_RELATION['password']);
		}

		echo "<script type='text/javascript'>
				alert('Your password can only contain letters, numbers, and an underscore, must be at least 6 characters, and contain at least one lowercase letter, one uppercase letter, and one number!');
				window.location.href = './resetPass.php';
			</script>";

		exit();
	}

    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $sth = $dbh->prepare("UPDATE users SET password = :password WHERE username = :username");
    $sth->execute(array(":password"=>$pass, ":username"=>$user['username']));

	// clear key in session
	unset($_SESSION['key']);

    header("Location: /message.php?message=Your password has been changed!&redirect=/ipar/login/edit.php"); 
?>

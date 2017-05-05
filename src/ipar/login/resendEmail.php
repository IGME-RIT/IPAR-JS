<?php 
	// regenerate key and resend email for account
	// requires a valid key to be sent with request

	$key = $_GET['key'];
	
	// check that a key was provided
	if(!$key) {
		header("Location: /message.php?message=Invalid request. Please contact the site administrator.&");
	}
   	
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	
	// find the user by key
   	$params = array(":curKey"=>$key);
    $sdh = $dbh->prepare("SELECT * FROM users WHERE curKey = :curKey");
    $sdh->execute($params);
	
	if($res = $sdh->fetch()){ // valid key
		require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php'; 

		sendActivationEmail($res['username'], $res['email'], $dbh);

		// redirect to success message
		// intentionally vague here so we don't expose any account info, since we don't do user auth for this script
		$successMessage = "A new activation link has been sent to the email associated with your account.";
		
		$header = "Location: /message.php?message=$successMessage&";
	
		// pass redirect url if set
		if(isset($_GET['redirect'])){
			$header = $header."redirect=".$_GET['redirect']."&";
		}
		
		header($header);
		exit();
	}

	// something went wrong
	header("Location: /message.php?message=Invalid request. Please contact the site administrator.&");
	exit();
?>

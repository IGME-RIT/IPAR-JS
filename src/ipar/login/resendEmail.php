<?php 
	// regenerate key and resend email for account
	require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php';
	
	if(isset($_SESSION['user'])){
		// send the activation email
		sendActivationEmail($_SESSION['user']);

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

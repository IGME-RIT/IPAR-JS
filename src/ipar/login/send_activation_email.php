<?php
	require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php';
	
	// sends an activation email to the user with provided username
	function sendActivationEmail($username, $email, $dbh) {
		// get uid for email activation
        $newKey = gen_key();

		// update key in database
		$sdh = $dbh->prepare("UPDATE users SET curKey = :newKey WHERE username = :username");
		$params = array(":newKey"=>$newKey, ":username"=>$username);
		$sdh->execute($params);

        // get appliction URL 
		// TODO: do this properly -ntr
	   	$path = "forensic-games.csec.rit.edu/ipar/login";
        	
        // send account confirmation email to user
   		$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$path/activate.php?key=$newKey&\n\nPlease note: An IPAR admin must still approve your account before you can begin using the editor.";
   		mail($email,'Account Activation',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
	}
?>

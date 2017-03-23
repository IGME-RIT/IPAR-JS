<?php 
   	// regenerate key and resend email for account
	// requires a valid key to be sent with request

	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$key = $_GET['key'];
	
	// check that a key was provided
	if(!$key) 
		header("Location: /message.php?message=Invalid request. Please contact the site administrator.&");
   	
	// find the user by key
   	$params = array(":curKey"=>$key);
    $sdh = $dbh->prepare("SELECT * FROM users WHERE curKey = :curKey");
    $sdh->execute($params);
	
	if($sdh->fetchAll()){ // valid key
		// get uid for email activation
        $newKey = uniqid($user, true);
      	
		// update key in database
		$sdh = $dbh->prepare("UPDATE users SET curKey = :newKey WHERE curKey = :curKey");
		$params = array(":newKey"=>$newKey, ":curKey"=>$key);
		$sdh->execute($params);

        // get appliction URL 
        // TODO: this could probably be stored in a config table -ntr
   		$parts = explode('/',$_SERVER['REQUEST_URI']);
   		$path = '';
   		for($i = 0;$i<count($parts)-2;$i++)
   			$path .= $parts[$i] . "/";
   		$path .= $parts[count($parts)-2];
	   	$path = $_SERVER['HTTP_HOST'].$path;
        
        // send account confirmation email to user
   		$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$path/activate.php?key=$newKey&\n\nPlease note: An IPAR admin must still approve your account before you can begin using the editor.";
   		mail($_POST['email'],'Account Activation',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
	
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

	// invalid key
	header("Location: /message.php?message=Invalid request. Please contact the site administrator.&");
	exit();
?>

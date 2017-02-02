<?php
    // check if all user information has been posted
	if(!$_POST || 
       !$_POST['username'] || 
       !$_POST['password'] || 
       !$_POST['email'] ||
       !$_POST['first-name'] ||
       !$_POST['last-name'] ||
       !$_POST['organization'])
		exit();

    // open database with PDO
    $db = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");

    // make username and email all lowercase (case insensitive)
    $user = strtolower($_POST['username']);
    $email = strtolower($_POST['email']);

    // get post variables for prepared statements
    $firstname = $_POST['first-name'];
    $lastname = $_POST['last-name'];
    $organization = $_POST['organization'];

    // check if password matches reqirements
    if(strlen($_POST['password'])<6 || 
       preg_match('/^[A-Za-z0-9_]*$/', $_POST['password'])!=1 || 
       preg_match('/[A-Z]+/', $_POST['password'])!=1 || 
       preg_match('/[a-z]+/', $_POST['password'])!=1 || 
       preg_match('/[0-9]+/', $_POST['password'])!=1){
        echo "<script type='text/javascript'>
            \t	alert('Your password can only contain letters, numbers, and an underscore, must be at least 6 characters, and contain at least one lowercase letter, one uppercase letter, and one number!');
            window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
        exit();
    }

    // check if username matches reqirements
    if(strlen($user)<6 || 
       strlen($user)>32 || 
       preg_match('/^[a-z0-9_]*$/', $user)!=1){
        echo "<script type='text/javascript'>
			   	alert('Your username can only contain letters, numbers, and an underscore and must be between 6 and 32 characters!');
			   	window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
	   	exit();
    }

    // check if email is valid
    if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        echo "<script type='text/javascript'>
			   	alert('The given email address is not vaild!');
			   	window.location.href = './signup.php?username=$user&email=$email&';
		   	</script>";
        exit();
    }
    
    // check if user already exists
    $userStatement = $db->prepare("SELECT * FROM users WHERE username = :username");

    $success = $userStatement->execute(array(":username" => $user));

    if(!$success){
            // TODO: put some error logging here
            die("<br><br>Failed to create account. Please contact the site administrator.");
    }

    if($userStatement->fetchAll()){
        echo "<script type='text/javascript'>
	   			alert('That username is already in use!');
	   			window.location.href = './signup.php?username=$user&email=$email&';
	   		  </script>";
	   	exit();
    }
    else{
        // check if email is already in use
        $emailStatement = $db->prepare("SELECT * FROM users WHERE email = :email");
        $emailStatement->execute(array(":email" => $email));

        if(!$success){
            // TODO: put some error logging here -ntr
            die("<br><br>Failed to create account. Please contact the site administrator.");
        }
        
   	    if($res = $emailStatement->fetchAll()){
   		   echo "<script type='text/javascript'> 
                    alert('That email is already in use!');
                    window.location.href = './signup.php?username=$user&email=$email&';
                </script>";
   		   exit();
   	}
   	else{
   		$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		
        // get uid for email activation
        $key = uniqid($user, true);
        
        // hash password
   		$hash = password_hash($_POST['password'], PASSWORD_DEFAULT);
        
        // create user record in users
        $sth = $db->prepare("INSERT INTO users VALUES (:username, :email, :password, :curKey, 0, :firstname, :lastname, :organization)");
        
        // prepare parameters set
        $params = array(":username" => $user, 
                        ":email" => $email,
                        ":password" => $hash,
                        ":curKey" => $key,
                        ":firstname" => $firstname,
                        ":lastname" => $lastname,
                        ":organization" => $organization);
        
        $success = $sth->execute($params);
        if(!$success){
            // print_r($db->errorInfo());
            
            // TODO: put some error logging here -ntr
            die("<br><br>Failed to create account. Please contact the site administrator.");
        }

        // collect user metadata
        $date = new DateTime();
        $ip = $_SERVER['REMOTE_ADDR'];
        $useragent = $_SERVER['HTTP_USER_AGENT'];

        // insert user metadata 
        $sth = $db->prepare("INSERT INTO usermetadata VALUES (:username, :ip, :useragent, :date)");
        $sth->execute(array(
            ":username"=>$user,
            ":ip"=>ip2long($ip),
            ":useragent"=>$useragent,
            ":date"=>$date->getTimestamp()
        ));

        // add default user role (editor)
        $sth = $db->prepare("INSERT INTO users_roles (username, roleid) SELECT :username as username, roles.rowid as roleid FROM roles WHERE roles.name=:role");
        $sth->execute(array(":username"=>$user, ":role"=>"editor"));
        
        // get appliction URL 
        // TODO: this could probably be stored in a config table -ntr
   		$parts = explode('/',$_SERVER['REQUEST_URI']);
   		$path = '';
   		for($i = 0;$i<count($parts)-2;$i++)
   			$path .= $parts[$i] . "/";
   		$path .= $parts[count($parts)-2];
	   	$path = $_SERVER['HTTP_HOST'].$path;
        
        // send account confirmation email to user
   		$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$path/activate.php?key=$key&";
   		mail($_POST['email'],'Account Activation',wordwrap($msg,70),"From: IPAR Editor <yin.pan@rit.edu>");
        
        // send new user email to admin
        $msg = "A new IPAR account has just been created:\nUsername: ".$user."\nEmail: ".$email."\nName: ".$firstname." ".$lastname."\nOrganization: ".$organization."\nIP: ".$ip."\nUseragent: ".$useragent;

        // TODO: send to all admin users?
        mail('yin.pan@rit.edu', 'New IPAR Account', $msg, "From: IPAR (Noreply) <no-reply@rit.edu>");
        mail('ntr5008@rit.edu', 'New IPAR Account', $msg, "From: IPAR (Noreply) <no-reply@rit.edu>"); //debug email, uncomment above for prod.

        // redirect to message screen
   		header("Location: ./message.html?message=Your account has been created! You will be been emailed a confirmation email shortly. Please use it to confirm your email and unlock your account for use.&");
   	}
   }
?>
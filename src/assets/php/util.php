<?php
/* Utility fucntions for IPAR services */

// start session if not already started
if(session_status() == PHP_SESSION_NONE) {
	session_start();
}

// require random_compat for PHP7-like random fucntions
require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/random_compat.phar';

// generates a random hex key (for email verification and password reset)
function gen_key($length = 32) {
	$bytes = random_bytes($length);
	return bin2hex($bytes);
}

// human readable mapping for key relations
$KEY_RELATION = array(
	'email' => 0,
	'password' => 1
);

require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/users_db.php';

// sets a key with the specified relation for the user
function set_key($user, $rel, $length = 32) {
	global $dbh;

	// delete key if it exists
	delete_keys($user, $rel);

	// add new key
	$key = gen_key($length);
	$sth = $dbh->prepare("INSERT INTO users_keys VALUES (:username, :key, :rel)");
	$sth->execute(array(":username"=>$user, ":key"=>$key, ":rel"=>$rel));
	
	return $key;
}

// deletes any exisiting keys with the specified relationship
function delete_keys($user, $rel) {
	global $dbh; 
	
	$sth = $dbh->prepare("DELETE FROM users_keys WHERE username = :username AND rel = :rel");
	$sth->execute(array(":username"=>$user, ":rel"=>$rel));
}

// returns the user for the given key/relation, or false if there is no user
function get_user_from_key($key, $rel) {
	global $dbh;
	$sth = $dbh->prepare("SELECT users.* FROM users_keys JOIN users ON users_keys.username = users.username WHERE key = :key AND rel = :rel LIMIT 1");
	$sth->execute(array(":key"=>$key, ":rel"=>$rel));

	return $sth->fetch();
}

function get_user($username) {
	global $dbh;
	$sth = $dbh->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
	$sth->execute(array(":username"=>$username));

	return $sth->fetch();
}

// sends an activation email to the user with provided username
function sendActivationEmail($username) {
	global $KEY_RELATION;
	// set email reset key
	$newKey = set_key($username, $KEY_RELATION['email']);

    // get appliction URL 
	// TODO: do this properly
   	$path = "forensic-games.csec.rit.edu/ipar/login";
    	
    // send account confirmation email to user
	$msg = "Thank you for creating an IPAR Editor Account! You can use this account to create IPAR cases and to manage both the images and resources for them! To activate your account please use the following link:\n\nhttp://$path/activate.php?key=$newKey&\n\nPlease note: An IPAR admin must still approve your account before you can begin using the editor.";

	send_mail_to_user($username, "Account Activation", wordwrap($msg, 70));

	return $msg;
}

// sends email to a user
function send_mail_to_user($to, $subject, $message, $from = "From IPAR Editor <yin.pan@rit.edu>") {
	global $dbh;
	
	// get user info from username
	$user = get_user($to);

	if($user == null)
		return false;
	
	// send email
	mail($user['email'], $subject, $message, $from);
}

// determines whether or not a url is safe for redirect
// valid filetypes are html and php only
// url may not contain the characters < > : ( ) or . (before the filetype)
// url may or may not start with /
// url may be a directory
function is_safe_url($url) {
	$pattern = "/^\/?[^<>:.();]+?(?:\.(?:php|html))?$/";
	return (bool) preg_match($pattern, $url);
}

// rawurlencodes everything in a string except /
function encode_url($url) {
	return implode('/', array_map('rawurlencode', explode('/', $url)));
}

function get_safe_url($url) {
	if(is_safe_url($url)) {
		return encode_url($url);
	}
	else {
		return '/';
	}
}

// injects js into the page to redirect to a url
function js_redirect($url = "/", $msg = null, $validate = true) {
	// sanitize url, or ignore it
	if($validate) {
		$url = get_safe_url($url);
	}

	echo "<script type='text/javascript'>";
	
	// echo message if there is one
	if($msg) {
		echo "alert('".htmlspecialchars($msg)."');";
	}

	// redirect
	echo "window.location = '".$url."';</script>";
}

// constructs a hidden form and then submits it to redirect with POST data
function js_redirect_post($url = "/", $msg = null, $post = array(), $validate = true) {
	// sanitize url, or ignore it
	if($validate) {
		$url = get_safe_url($url);
	}

	// echo form
	echo "<form id='js-post-request' action='{$url}' method='post'>";

	// echo post data
	foreach ($post as $key => $value) {
		echo "<input type='hidden' name='{$key}' value='{$value}'>";
	}

	echo "</form>";

	echo "<script type='text/javascript'>";
	
	// echo message if there is one
	if($msg) {
		echo "alert('".htmlspecialchars($msg)."');";
	}

	// submit the form
	echo "document.querySelector('#js-post-request').submit();";

	echo "</script>";
}

// redirects to a url by header response
function header_redirect($url = "/", $validate = true) {
	// ignore url if unsafe
	if($validate && !is_safe_url($url)) {
		$url = "/";
	}

	header("Location: ".$url);
}

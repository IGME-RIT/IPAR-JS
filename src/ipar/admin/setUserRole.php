<?php
/* Called via AJAX POST request in users.php when a role checkbox is ticked
 * The admin directory .htaccess should ensure that this request is being made
 * by a user authenticated as an admin.
 */
require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php';

// check to be sure there is POST data & user is authorized to change roles
if(!$_POST){
    echo "Failed to update role. Reason: POST data not included with request.";
    exit();
}

// get POST data
$username = $_POST['user'];
$roleid = $_POST['roleid'];
$value = $_POST['value'];

$query = "DELETE FROM users_roles WHERE username=:username And roleid=:roleid";

if($value == 1){
    // insert new record if it doesn't already exist
    $query = "INSERT INTO users_roles (username, roleid)
                SELECT :username, :roleid WHERE NOT EXISTS (
                    SELECT 1 FROM users_roles 
                    WHERE username=:username And roleid=:roleid)";
}

// execute query
$sth = $dbh->prepare($query);
$success = $sth->execute(array(":username"=>$username, ":roleid"=>$roleid));

if($roleid == 1) { // editor
	$rolename = "editor";
	$msg = "Your account has been given access to the IPAR Editor by an admin. You can now use your account to create IPAR cases and to manage the images and resources for them.";
}
else if($roleid == 2) { // admin
	$rolename = "admin";
	$msg = "You now have administrator privledges for IPAR. You may now log in and make administrative changes to the website from the Admin panel.";
}

// send role change email
send_mail_to_user($username, "Updated permission for your IPAR account", $msg);

echo "Successfully changed user role.";
?>

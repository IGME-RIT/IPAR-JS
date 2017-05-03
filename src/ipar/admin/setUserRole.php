<?php
/* Called via AJAX POST request in users.php when a role checkbox is ticked
 * The admin directory .htaccess should ensure that this request is being made
 * by a user authenticated as an admin.
 */

// check to be sure there is POST data & user is authorized to change roles
if(!$_POST){
    echo "Failed to update role. Reason: POST data not included with request.";
    exit();
}

// get POST data
$username = $_POST['user'];
$rolename = $_POST['roleid'];
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
$success = $sth->execute(array(":username"=>$username, ":roleid"=>$rolename));

echo "Successfully changed user role.";
?>
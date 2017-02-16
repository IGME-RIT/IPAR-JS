<?php
/* Called via AJAX POST request in users.php when a role checkbox is ticked
 * The admin directory .htaccess should ensure that this request is being made
 * by a user authenticated as an admin.
 */

// check to be sure there is POST data
if(!$_POST)
    exit();

// get POST data
$username = $_POST['user'];
$rolename = $_POST['roleid'];
$value = $_POST['value'];

// establish db connection
$dbh = new PDO("sqlite:../../../db/users.sql");
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

// TODO: return result?
?>
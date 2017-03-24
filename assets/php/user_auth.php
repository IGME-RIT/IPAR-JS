<?php
// establish db connection and get handler
include "users_db.php"; // sets $dbh
if(!isset($_SESSION)) {
	session_start();
}

// check if user is logged in
$loggedIn = !(!$_SESSION || !$_SESSION["user"]);

// extracts role name from row returned from select below
function role_name($row){
    return $row["name"];
}

// set user roles (updating every page load because they could change)
// TODO: might want to look into setting a flag in the user session when roles change, so we don't have to query the db every page load
if($loggedIn) { 
    // get user roles from db
    $sth = $dbh->prepare("SELECT roles.name FROM users_roles JOIN roles ON roles.rowid = users_roles.roleid WHERE users_roles.username = :username");
    
    if($sth->execute(array(":username"=>$_SESSION["user"]))) {
        $rows = $sth->fetchAll();
        
        // set user_roles to an an array of the user's roles
        $_SESSION["user_roles"] = array_map("role_name", $rows);
    }
}
?>

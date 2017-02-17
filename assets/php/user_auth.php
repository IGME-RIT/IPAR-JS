<?php
// establish db connection and get handler
include "users_db.php"; // sets $dbh

session_start();

// check if user is logged in
$loggedIn = !(!$_SESSION || !$_SESSION["user"]);

if($loggedIn) { // set user roles (updating every page load because they could change)
    // get user roles from db
    
}
?>

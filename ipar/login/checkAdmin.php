<?php
include $_SERVER['DOCUMENT_ROOT']."/assets/php/user_auth.php"; // sets $loggedIn, $dbh and $_SESSION['user_roles']

// direct to login screen if user is not logged in
if(!$_SESSION['user']){
    header("Location: ../login/login.php?redirect=".$_SERVER['PHP_SELF']);
    exit();
}

// check if user has admin rights
if(!in_array('admin', $_SESSION['user_roles'])){
    header("Location: ../login/message.html?message=You are not authorized to view this page.&");
    exit();
}
?>
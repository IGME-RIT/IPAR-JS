<?php
include $_SERVER['DOCUMENT_ROOT']."/assets/php/user_auth.php"; // sets $loggedIn, $dbh and $_SESSION['user_roles']

if(!$_SESSION['user']){
    header("Location: ../login/login.php?redirect=".$_SERVER['PHP_SELF']);
    exit();
}

if(!in_array('editor', $_SESSION['user_roles'])){
    header("Location: ../login/message.html?message=You are not yet authorized to view this page. If you just created your account, pleae wait for an IPAR admin to approve it.&");
    exit();
}
?>
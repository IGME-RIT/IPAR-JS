<?php
#session_start();
#
#// direct to login screen if user is not logged in
#if(!$_SESSION || !$_SESSION["user"]){
#    header("Location: ../login/");
#    exit();
#}
#
#$user = $_SESSION["user"];
#
#// check if user has admin rights
#$authenticated = false;
#$dbh = new PDO("sqlite:../../../db/users.sql") or die ("Could not establish a database connection.");
#$sth = $dbh->prepare("SELECT roles.name FROM users_roles JOIN roles ON roles.rowid = users_roles.roleid WHERE users_roles.username = :username");
#if($sth->execute(array(":username"=> $user))){
#    $rows = $sth->fetchAll();
#    foreach($rows as $row){
#        if($row["name"] == "admin"){
#            // authenticated
#            $authenticated = true;
#        }
#    }
#}
#
#if(!$authenticated){
#    header("Location: ../login/message.html?message=You are not authorized to view this page.&");
#    exit();
#}
?>

<html>
    <head></head>
    <body>
        It works!
    </body>
</html>
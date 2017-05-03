<?php
if(!$_POST["firstname"] ||
    !$_POST["lastname"] ||
    !$_POST["organization"]){
        echo "<script type='text/javascript'>
            alert('Missing informtion from form!');
            window.location.href='./edit.php';
            </script>";
        exit();
    }

session_start();
// update record
$dbh = new PDO("sqlite:../../../db/users.sql") or die ("Could not establish a database connection.");
$user = $_SESSION["user"];
$sth = $dbh->prepare("UPDATE users 
SET firstname = :firstname, lastname = :lastname, organization = :organization
WHERE username = :username");
$args = array(
    ":firstname"=>$_POST["firstname"],
    ":lastname"=>$_POST["lastname"],
    ":organization"=>$_POST["organization"],
    ":username"=>$user
    );

if($sth->execute($args)){
    header("Location: /message.php?message=Your information has been updated!&redirect=/ipar/login/edit.php");
    exit();
}

echo "<script type='text/javascript'>
        alert('Invalid username!');
        window.location.href = './edit.php';
    </script>";
?>
<?php
session_start();
if($_SESSION && $_SESSION['user']) {
	// check if user has admin rights
	// TODO: look into setting a session variable on login
    $isdamin = false;
	$user = $_SESSION['user'];
    $dbh = new PDO("sqlite:../../db/users.sql") or die ("Could not establish a database connection.");
    $sth = $dbh->prepare("SELECT roles.name FROM users_roles JOIN roles ON roles.rowid = users_roles.roleid WHERE users_roles.username = :username");
    if($sth->execute(array(":username"=> $user))){
        $rows = $sth->fetchAll();
        foreach($rows as $row){
            if($row["name"] == "admin"){
                // authenticated
                $isadmin = true;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="css/menuStyle.css">
    <script src="lib/jszip.min.js"></script>
    <script src="lib/mimetypes.js"></script>
</head>
<body>
    <section class="menu">
    	<div>
			<h1 id="title">IPAR</h1>
			<button class="menuButton" onclick="window.location.href = './game/';">Game</button>
			<button class="menuButton" onclick="window.location.href = './editor/';">Editor</button>
			<button class="menuButton" onclick="window.location.href = './reader/';">Reader</button>
			<?php if($isadmin){ ?>
			<button class="menuButton" onclick="window.location.href = './admin/';">Admin</button>
			<?php } ?>
		</div>
		<img class="logo" src="img/nsflogo.png" />
    </section>
</body>
</html>

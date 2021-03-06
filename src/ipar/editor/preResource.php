<?php
	if(session_status() == PHP_SESSION_NONE) {
		session_start();
	}

	if(!$_SESSION || !$_SESSION["user"])
		exit();
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$parts = explode('/',$_SERVER['REQUEST_URI']);
	$path = '';
	for($i = 0;$i<count($parts)-3;$i++)
	    $path .= $parts[$i] . "/";
	$path .= $parts[count($parts)-3];
	//$result = $db->query("SELECT file, name FROM resources WHERE username = '$user'");
	$sth = $dbh->prepare("SELECT file, name FROM resources WHERE username = :username");
    $sth->execute(array(":username"=>$user));
    while($res = $sth->fetch()){
	   	$path = $_SERVER['HTTP_HOST'].$path;
	   	$file = "http://$path/resource/".$res['file'];
	   	echo "<div class='image'><img src='../img/iconToolboxYellow.png' file='$file' class='viewSmall' /><a href='#' class='unactiveLink'>".htmlspecialchars($res['name'])."</a><img src='../img/iconClose.png' class='deleteSmall'/></div>";
	}
?>

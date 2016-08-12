<?php
	session_start();
	if(!$_SESSION || !$_SESSION["user"])
		exit();
	$db = new SQLite3('../../../users.sql') or die ("cannot open");
	$user = $_SESSION["user"];
	$parts = explode('/',$_SERVER[REQUEST_URI]);
	$path = '';
	for($i = 0;$i<count($parts)-3;$i++)
	    $path .= $parts[$i] . "/";
	$path .= $parts[count($parts)-3];
	$result = $db->query("SELECT file, name FROM resources WHERE username = '$user'");
	while($res = $result->fetchArray()){
	   	$file = "http://$_SERVER[HTTP_HOST]$path/resource/".$res['file'];
	   	echo "<div class='image'><img src='../img/iconToolboxYellow.png' file='$file' class='viewSmall' /><a href='#' class='unactiveLink'>".$res['name']."</a><img src='../img/iconClose.png' class='deleteSmall'/></div>";
	}
?>
<?php
	if(!isset($_POST) || !isset($_POST["md"])
	&& (!isset($_GET) || !isset($_GET["md"]))) {
		http_response_code(400);
		die('Bad request.');
	}

	if(isset($_POST["md"])) {
		$text = $_POST["md"];
	}
	else {
		$text = $_GET["md"];
	}
	
	// set up parsedown
	include 'parsedown/Parsedown.php';
	$Parsedown = new Parsedown();
	
	// echo html
	echo $Parsedown->text($text);

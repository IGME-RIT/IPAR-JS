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

	spl_autoload_register(function($class){
		require preg_replace('{\\\\|_(?!.*\\\\)}', DIRECTORY_SEPARATOR, ltrim($class, '\\')).'.php';
	});

	// get markdown class
	use \Michelf\Markdown;

	// parse markdown and return html
	echo Markdown::defaultTransform($text);

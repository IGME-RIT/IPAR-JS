<?php
// require authentication
require_once "../user_auth.php"; // sets $dbh, $loggedIn, $_SESSION['user_roles']

if(!$loggedIn || !in_array('admin', $_SESSION['user_roles'])) {
	respondUnauthorized();
}

// processes GET, POST, and PUT requests for pages
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	processGETRequest();
}
elseif ($_SERVER['REUQEST_METHOD'] == 'POST') {
	processPOSTRequest();
}
elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
	processPUTRequest();
}
else {
	respondBadRequest();
}

function processGETRequest() {
	if(!isset($_GET['id'])) {
		respondBadRequest();
	}

	$mdbh = getDbh();
	$sth = $mdbh->prepare("SELECT pages.rowid AS id, modals.name as modalname, title, body FROM pages JOIN modals ON modals.rowid = modalid WHERE pages.rowid = :id LIMIT 1");
	
	if(!$sth->execute(array("id"=>$_GET['id']))) {
		respondBadRequest();
	}

	$row = $sth->fetch();
	$page = array(
		'id'=>intval($row['id']),
		'modalname'=>$row['modalname'],
		'title'=>$row['title'],
		'body'=>$row['body']
	);

	// convert body to html if we need to
	if(isset($_GET['format']) && $_GET['format'] == 'html') {
		require_once '../parsedown/Parsedown.php';
		$Parsedown = new Parsedown();
		$page['body'] = $Parsedown->text($page['body']);
	}

	// return json
	header('Content-Type: application/json');
	die(json_encode($page));
}

function processPOSTRequest() { // TODO: add new page
	respondBadRequest();
}

function processPUTRequest() {
	// parse the post variables
	parse_str(file_get_contents("php://input"), $put); // TODO: get json
	if(!isset($put['id'])) {
		respondBadRequest();
	}

	// establish db connection
	$mdbh = getDbh();
	if(isset($put['title']) && isset($put['body'])) { // change title and body
		$sth = $mdbh->prepare("UPDATE pages SET title = :title, body = :body WHERE rowid = :id");
	}
	elseif(isset($put['body'])) { // change body only
		$sth = $mdbh->prepare("UPDATE pages SET body = :body WHERE rowid = :id");
	}
	elseif(isset($put['title'])) { // change title only
		$sth = $mdbh->prepare("UPDATE pages SET title = :title WHERE rowid = :id");
	}
	else { // bad request
		resondBadRequest();
	}

	// update database
	if($sth->execute($put)) {
		respondOK();	
	}
	else {
		respondBadRequest();	
	}
}

function getDbh() {
	return new PDO('sqlite:../../../../db/modals.sql');
}

function respondBadRequest() {
	http_response_code(400);
	die('Bad request.');
}

function respondUnauthorized() {
	http_response_code(401);
	die('Unauthorized request.');
}

function respondOK($msg = "") {
	http_response_code(200);
	die($msg);
}

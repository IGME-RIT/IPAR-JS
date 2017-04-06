<?php
// processes GET, POST, and PUT requests for pages
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	processGETRequest();
}
elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
	processPOSTRequest();
}
elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
	processPUTRequest();
}
elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
	processDELETERequest();
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

function processPOSTRequest() {
	requireAuth();
	// get json payload
	$page = json_decode(file_get_contents('php://input'), true);
	// validate request
	if(!isset($page['modalname'])
	|| !isset($page['title'])
	|| !isset($page['body'])) {
		respondBadRequest();
	}

	// get modal id
	$mdbh = getDbh();
	$sth = $mdbh->prepare("SELECT rowid AS id FROM modals WHERE name = :modalname");
	
	if(!$sth->execute(array('modalname'=>$page['modalname']))) {
		respondBadRequest();
	}

	$modalrow = $sth->fetch();

	if(!$modalrow) {
		respondBadRequest();
	}

	$modalid = $modalrow['id'];

	// insert page
	$sth = $mdbh->prepare("INSERT INTO pages VALUES (:modalid, :title, :body)");

	$sth->execute(array('modalid'=>$modalid, 'title'=>$page['title'], 'body'=>$page['body']));

	// return newly created page
	$sth = $mdbh->prepare("SELECT pages.rowid AS id, modals.name AS modalname, title, body FROM pages JOIN modals ON modals.rowid = pages.modalid WHERE pages.rowid = last_insert_rowid()");

	$sth->execute();

	$row=$sth->fetch();

	$page = array(
		'id'=>$row['id'],
		'modalname'=>$row['modalname'],
		'title'=>$row['title'],
		'body'=>$row['body']
	);

	// set response header
	header('Content-Type: application/json');
	die(json_encode($page));
}

function processPUTRequest() {
	requireAuth();
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

function processDELETERequest(){
	requireAuth();

	// get json payload
	$page = json_decode(file_get_contents('php://input'), true);
	// validate request
	if(!isset($page['id'])) {
		respondBadRequest();
	}

	// connect to database
	$mdbh = getDbh();
	
	// make delete request
	$sth = $mdbh->prepare("DELETE FROM pages WHERE rowid = :id");
	if(!$sth->execute(array('id'=>$page['id'])) || $sth -> rowCount() == 0) {
		// no rows affected, return 404 (not found)
		respondNotFound();
	}
}

function requireAuth() {
	// require authentication
	require_once "../user_auth.php"; // sets $dbh, $loggedIn, $_SESSION['user_roles']
	
	if(!$loggedIn || !in_array('admin', $_SESSION['user_roles'])) {
		respondUnauthorized();
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

function respondNotFound() {
	http_response_code(404);
	die('Not found.');
}

function respondOK($msg = "") {
	http_response_code(200);
	die($msg);
}

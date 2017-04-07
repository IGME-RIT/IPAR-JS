<?php
// process request
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

// returns a help modal
function processGETRequest() {
	// check for a proper request
	if (!isset($_GET) || !isset($_GET['name'])) {
		respondBadRequest();
	}

	$format = 'md';
	if(isset($_GET['format'])) {
		$format = $_GET['format'];
	}

	// don't include parsedown unless we need to
	if($format == 'html') {
		include '../parsedown/Parsedown.php';	
		$Parsedown = new Parsedown();
	}
	
	// get modal name
	$name = $_GET['name'];
	
	// get modal information
	$dbh = new PDO('sqlite:../../../../db/modals.sql');
	$sth = $dbh->prepare("SELECT pages.rowid as id, pages.title, pages.body FROM modals JOIN pages ON pages.modalid = modals.rowid WHERE modals.name = :name");
	
	if(!$sth->execute(array(":name"=>$name))) {
		respondBadRequest();
	}
	
	// set response header
	header('Content-Type: application/json');
	
	// return json
	$modal = array('name'=>$name, 'pages'=>array());
	while($row = $sth->fetch()) {
		$body = $row['body'];
		if($format == 'html'){
			// get html with parsedown
			$body = $Parsedown->text($body);
		}
		$modal['pages'][] = array('id' => intval($row['id']), 'title' => $row['title'], 'body' => $body);
		$ind++;
	}
	echo json_encode($modal);
}

function processPOSTRequest() { // TODO: add modal
	respondBadRequest();
}

function processPUTRequest() { // TODO: update modal
//	requireAuth();
//
//	// parse the json payload
//	$modal = json_decode(file_get_contents("php://input"), true);
//
//	// validate request
//	if(!isset($modal['id']) || !isset($modal['pages'])){
//		respondBadRequest();
//	}
//
//	// connect to db
//	$mdbh = getDbh();
//	
//	// update pages
//	$sel_sth = $mdbh->prepare("SELECT rowid FROM pages WHERE rowid = :id"); // checks if page exists
//	$ins_sth = $mdbh->prepare("INSERT INTO pages VALUES (:modalid, :title, :body)"); // inserts a new page
//	$upd_sth = $mdbh->prepare("UPDATE pages VALUES (:modalid, :title, :body) WHERE rowid = 1");
	respondBadRequest();
}

function getDbh() {
	return new PDO('sqlite:../../../../db/modals.sql');
}

function requireAuth() {
	// require authentication
	require_once "../user_auth.php"; // sets $dbh, $loggedIn, $_SESSION['user_roles']
	
	if(!$loggedIn || !in_array('admin', $_SESSION['user_roles'])) {
		respondUnauthorized();
	}

}

function respondBadRequest() {
	http_response_code(400);
	die('Bad request.');
}

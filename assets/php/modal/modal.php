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
	$modal = array();
	while($row = $sth->fetch()) {
		$body = $row['body'];
		if($format == 'html'){
			// get html with parsedown
			$body = $Parsedown->text($body);
		}
		$modal[$row['title']] = array('title' => $row['title'], 'body' => $body);
		$ind++;
	}
	echo json_encode($modal);
}

function processPOSTRequest() {
	respondBadRequest();
}

function processPUTRequest() {
	respondBadRequest();
}

function respondBadRequest() {
	http_response_code(400);
	die('Bad request.');
}

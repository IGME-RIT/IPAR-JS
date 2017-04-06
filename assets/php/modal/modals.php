<?php
// returns a list of all modals

// process request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	processGETRequest();
}
else {
	respondBadRequest();
}

function processGETRequest() {
	// return all modal names
	// get modal information
	$dbh = new PDO('sqlite:../../../../db/modals.sql') or respondError("Could not establish database connection.");
	$sth = $dbh->prepare("SELECT rowid as id, name FROM modals");

	if(!$sth->execute()) {
		respondError("Failed to execute query.");	
	}

	$modals = array();
	
	while($row = $sth->fetch()) {
		$modals[] = array('id'=>$row['id'], 'name'=>$row['name']);
	}

	// set response header
	header('Content-Type: application/json');

	// return json
	echo json_encode($modals);
}

function respondBadRequest() {
	http_response_code(400);
	die('Bad request.');
}

function respondError($msg = "Internal Server Error.") {
	http_response_code(500);
	die($msg);
}

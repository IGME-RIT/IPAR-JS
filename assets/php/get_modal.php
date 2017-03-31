<?php
// returns a help modal with json formatting

// check for a proper request
if (!isset($_GET) || !isset($_GET['name'])) {
	http_response_code(400);
	die('Bad request.');
}

// don't include parsedown unless we need to
if(!isset($_POST['format']) || $_POST['format'] == 'html') {
	include 'parsedown/Parsedown.php';	
	$Parsedown = new Parsedown();
}

// get modal name
$name = $_GET['name'];

// get modal information
$dbh = new PDO('sqlite:../../../db/modals.sql');
$sth = $dbh->prepare("SELECT pages.title, pages.body FROM modals JOIN pages ON pages.modalid = modals.rowid WHERE modals.name = :name");

if(!$sth->execute(array(":name"=>$name))) {
	http_response_code(500);
	die('Failed to process request.');
}

// set response header
header('Content-Type: application/json');

// return json
$modal = array();
while($row = $sth->fetch()) {
	$modal[$row['title']] = array('title' => $row['title'], 'body' => $row['body']);
	$ind++;
}
echo json_encode($modal);

<?php
/* Prints the contents of admin_log
 * in a human-readable text log format
 */

require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/users_db.php';

$query = "SELECT * FROM admin_log ORDER BY datetime DESC";

if(!$res = $dbh->query($query)){
    print_r($dbh->errorinfo());
    die("Failed to read from database.");
}

foreach($res as $row) {
	$date = date("m/d/Y H:i:s", $row['datetime']);
	$line = "{$row['username']} - {$date}\t{$row['message']}";
	echo $line."\r\n";
}

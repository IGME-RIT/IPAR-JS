<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
<meta name="description" content="Gamified Digital Forensics Project">
<link href="/assets/css/bootstrap.min.css" rel="stylesheet">
<link href="/assets/css/custom.css" rel="stylesheet">
<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/assets/php/users_db.php';

// increment the hits counter
$sth = $dbh->prepare('UPDATE md_hits SET count = (SELECT count FROM md_hits) + 1;');
$sth->execute();

?>

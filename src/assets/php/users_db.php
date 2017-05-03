<?php
// Script to be included whenever querying the users database
$rootPath = realpath(dirname(__FILE__)."/../../../");

// create database handler with PDO
$dbh = new PDO('sqlite:'.$rootPath.'/db/users.sql') or die ("cannot open");
?>
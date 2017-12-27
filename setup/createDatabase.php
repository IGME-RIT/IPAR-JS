<?php
	$dbh = new PDO('sqlite:../db/users.sql');
	$usersSchema = "CREATE TABLE users (username CHAR(255) PRIMARY KEY NOT NULL, email CHAR(255) NOT NULL UNIQUE, password CHAR(255) NOT NULL, curKey CHAR(255) UNIQUE, active INT, firstname CHAR(255) NOT NULL DEFAULT '', lastname CHAR(255) NOT NULL DEFAULT '', organization CHAR(255) NOT NULL DEFAULT '')";
	$imagesSchema = "CREATE TABLE images (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255))";
	$resourcesSchema = "CREATE TABLE resources (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255))";
	$usermetadataSchema = "CREATE TABLE usermetadata (username CHAR(255) PRIMARY KEY NOT NULL, ip INTEGER NOT NULL, useragent TEXT NOT NULL, datetime INTEGER NOT NULL);";
	$rolesSchema = "CREATE TABLE roles (name CHAR(255) NOT NULL);";
	$usersrolesSchema = "CREATE TABLE users_roles (username CHAR(255) NOT NULL, roleid INT NOT NULL);";
	$usersKeysSchema = "CREATE TABLE users_keys (username CHAR(255) NOT NULL, key CHAR(255) NOT NULL, rel INT NOT NULL);";
	$adminLogSchema = "CREATE TABLE admin_log (username CHAR(255) NOT NULL, message TEXT NOT NULL, datetime INTEGER NOT NULL);";
	$mdHitsSchema = "CREATE TABLE md_hits (count INT NOT NULL); INSERT INTO md_hits VALUES (0)";

	if($dbh){
		 // create tables
		 $dbh->query($usersSchema);
		 $dbh->query($imagesSchema);
		 $dbh->query($resourcesSchema);
		 $dbh->query($usermetadataSchema);
		 $dbh->query($rolesSchema);
		 $dbh->query($usersrolesSchema);
		 $dbh->query($usersKeysSchema);
		 $dbh->query($adminLogSchema);
		 $dbh->query($mdHitsSchema);

		 // add default roles
		 $sth = $dbh->prepare("INSERT INTO roles VALUES (:role)");
		 $sth->execute(array(":role"=>"editor"));
		 $sth->execute(array(":role"=>"admin"));
		  
		echo "CREATED";
	}
	else{
		echo "FAILED TO CREATE";
	}
?>

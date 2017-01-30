<?php
   $dbh = new PDO('sqlite:../../db/users.sql');
   $usersSchema = "CREATE TABLE users (username CHAR(255) PRIMARY KEY NOT NULL, email CHAR(255) NOT NULL UNIQUE, password CHAR(255) NOT NULL, curKey CHAR(255) UNIQUE, active INT, firstname CHAR(255) NOT NULL DEFAULT '', lastname CHAR(255) NOT NULL DEFAULT '', organization CHAR(255) NOT NULL DEFAULT '')";
   $imagesSchema = "CREATE TABLE images (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255))";
   $resourcesSchema = "CREATE TABLE resources (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255))";
   $usermetadataSchema = "CREATE TABLE usermetadata (username CHAR(255) PRIMARY KEY NOT NULL, ip INTEGER NOT NULL, useragent TEXT NOT NULL, datetime INTEGER NOT NULL);";
   if($dbh){
       // create tables
       $dbh->query($usersSchema);
       $dbh->query($imagesSchema);
       $dbh->query($resourcesSchema);
       $dbh->query($usermetadataSchema);
	   echo "CREATED";
   }
   else{
   	echo "FAILED TO CREATE";
   }
?>
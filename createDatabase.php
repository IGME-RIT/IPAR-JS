<?php
   $db = new SQLite3('../../users.sql');
   if($db){
	   $db->query("CREATE TABLE users (username CHAR(255) PRIMARY KEY NOT NULL, email CHAR(255) NOT NULL UNIQUE, password CHAR(255) NOT NULL, curKey CHAR(255) UNIQUE, active INT);");
	   $db->query("CREATE TABLE images (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255));");
	   $db->query("CREATE TABLE resources (file CHAR(255) PRIMARY KEY NOT NULL, name TEXT, username CHAR(255));");
	   echo "CREATED";
   }
   else{
   	echo "FAILED TO CREATE";
   }
?>
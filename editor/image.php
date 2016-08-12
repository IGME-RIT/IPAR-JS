<?php
session_start();
$db = new SQLite3('../../../users.sql');
$user = $_SESSION["user"];

if($_FILES["image"] && getimagesize($_FILES["image"]["tmp_name"]) !== false){

	$result = $db->query("SELECT active FROM users WHERE username = '$user'");
	if(($res = $result->fetchArray()) && $res['active']!=0){
		$image_folder = "../image/";
		$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		$extension = '.' . pathinfo(basename($_FILES["image"]["name"]), PATHINFO_EXTENSION);
		if($extension=='.png' || $extension=='.jpg' || $extension=='.jpeg' || $extension=='.gif'){
			$new_image = uniqid($user, true);
			if (move_uploaded_file($_FILES["image"]["tmp_name"], $image_folder . $new_image . $extension)) {
	   		    echo $new_image . $extension;
	   		    $fileName = $_FILES["image"]["name"];
	   		    $result = $db->query("INSERT INTO images VALUES ('$new_image$extension','$fileName','$user');");
	    	    exit();
	   		}
	    }
	}
    else{
    	echo"!Error Uploading File! Your account is not active!";
    	exit();
    }
}

echo "!Error Uploading File!";
exit();

?>
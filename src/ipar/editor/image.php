<?php
$user = $_SESSION["user"];

if($_FILES["image"] && getimagesize($_FILES["image"]["tmp_name"]) !== false){

	//$result = $db->query("SELECT active FROM users WHERE username = '$user'");
    $sth = $dbh->prepare("SELECT active FROM users WHERE username = :username");
    $sth->execute(array(":username"=>$user));
	if(($res = $sth->fetch()) && $res['active']!=0){
		$image_folder = "../image/";
		$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		$extension = '.' . pathinfo(basename($_FILES["image"]["name"]), PATHINFO_EXTENSION);
		if($extension=='.png' || $extension=='.jpg' || $extension=='.jpeg' || $extension=='.gif'){
			$new_image = str_replace(".", "-", uniqid($user, true));
			if (move_uploaded_file($_FILES["image"]["tmp_name"], $image_folder . $new_image . $extension)) {
			    chmod($image_folder . $new_image . $extension, 0644);
	   		    $fileName = $_FILES["image"]["name"];
	   		    echo $new_image . $extension;
                $sth = $dbh->prepare("INSERT INTO images VALUES (:img, :fileName, :username)");
                $sth->execute(array(
                    ":img"=>($new_image.$extension),
                    ":fileName"=>$fileName,
                    ":username"=>$user));
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
echo $_FILES["image"];
exit();

?>
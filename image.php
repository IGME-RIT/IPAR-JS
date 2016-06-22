<?php

$default_image = "eb1832a80fa41e395491571d4930119b.png";

if($_FILES["image"] && getimagesize($_FILES["image"]["tmp_name"]) !== false){

	$image_folder = "image/";
	$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	$extension = '.' . pathinfo(basename($_FILES["image"]["name"]), PATHINFO_EXTENSION);
	if($extension=='.png' || $extension=='.jpg' || $extension=='.jpeg' || $extension=='.gif'){
		$new_image = '';
		do{
			for ($i = 0;$i <32; $i++)
			  $new_image .= $characters[rand(0, strlen($characters)-1)];
		} while(file_exists($image_folder . $new_image . $extension));
		
		if (move_uploaded_file($_FILES["image"]["tmp_name"], $image_folder . $new_image . $extension)) {
   		     echo $new_image . $extension;
    	    return true;
   		}
    }
}

echo $default_image;
return false;

?>
<?php

if($_FILES["resource"]){

	$resource_folder = "resource/";
	$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	$extension = '.' . pathinfo(basename($_FILES["resource"]["name"]), PATHINFO_EXTENSION);
	$new_resource = '';
	do{
		for ($i = 0;$i <32; $i++)
		  $new_resource .= $characters[rand(0, strlen($characters)-1)];
	} while(file_exists($resource_folder . $new_resource . $extension));
	
	if (move_uploaded_file($_FILES["resource"]["tmp_name"], $resource_folder . $new_resource . $extension)) {
        echo $new_resource . $extension;
        return true;
    }
}

echo "404";
return false;

?>
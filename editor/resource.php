<?php
session_start();
$db = new SQLite3('../../../db/users.sql');
$user = $_SESSION["user"];

if($_FILES["resource"]){
	
	$result = $db->query("SELECT active FROM users WHERE username = '$user'");
	if(($res = $result->fetchArray()) && $res['active']!=0){
		$resource_folder = "../resource/";
		$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		$extension = '.' . pathinfo(basename($_FILES["resource"]["name"]), PATHINFO_EXTENSION);
		$finfo = new finfo(FILEINFO_MIME);
		$type = $finfo->file($_FILES["resource"]["tmp_name"]);
		if($extension=='.pdf' && preg_match('/^application\/pdf.*/', $type)){
			$new_resource = uniqid($user, true);
			if (move_uploaded_file($_FILES["resource"]["tmp_name"], $resource_folder . $new_resource . $extension)) {
			        chmod($resource_folder . $new_resource . $extension, 0644);
				echo $new_resource . $extension;
				$fileName = $_FILES["resource"]["name"];
				$db->query("INSERT INTO resources VALUES ('$new_resource$extension','$fileName','$user');");
				exit();
			}
		}
	}
	else{
		echo"!Error Uploading File! Your account is not active!";
		exit();
	}
	
}

$upload_value = ini_get("upload_max_filesize");
$post_value = ini_get("post_max_size");
echo "!Error Uploading File! File size limit is " . (intval($upload_value)<intval($post_value) ? $upload_value : $post_value) . "!";
exit();

?>
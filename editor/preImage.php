<?php
	session_start();
	if(!$_SESSION || !$_SESSION["user"])
		exit();
?>
<div class="window images">
	<div class="title">
		Uploaded Images
	</div>
	<div class="windowContent">
		<div class="imageContent">
		<?php 
	   		$db = new SQLite3('../../../users.sql') or die ("cannot open");
	   		$user = $_SESSION["user"];
	   		$parts = explode('/',$_SERVER[REQUEST_URI]);
	   		$path = '';
	   		for($i = 0;$i<count($parts)-3;$i++)
	   			$path .= $parts[$i] . "/";
	   		$path .= $parts[count($parts)-3];
	   		$result = $db->query("SELECT file, name FROM images WHERE username = '$user'");
	   		while($res = $result->fetchArray()){
	   			$image = "http://$_SERVER[HTTP_HOST]$path/image/".$res['file'];
	   			echo "<div class='image'><img src='$image' />".$res['name']."<img src='../img/iconClose.png' class='delete'/></div>";
	   		}
		?>
		</div>
		<br>
		<button class="full">Close</button>
	</div>
</div>
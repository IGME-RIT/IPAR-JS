<div class="window images">
	<div class="title">
		Uploaded Images
	</div>
	<div class="windowContent">
		<div class="imageContent">
		<?php 
	   		$user = $_SESSION["user"];
	   		$parts = explode('/',$_SERVER['REQUEST_URI']);
	   		$path = '';
	   		for($i = 0;$i<count($parts)-3;$i++)
	   			$path .= $parts[$i] . "/";
	   		$path .= $parts[count($parts)-3];
            $sth = $dbh->prepare("SELECT file, name FROM images WHERE username = :username");
            $sth->execute(array(":username"=>$user));
	   		while($res = $sth->fetch()){
	   		$path = $_SERVER['HTTP_HOST'].$path;
	   			$image = "http://$path/image/".$res['file'];
	   			echo "<div class='image'><img src='$image' />".$res['name']."<img src='../img/iconClose.png' class='delete'/></div>";
	   		}
		?>
		</div>
		<br>
		<button class="full">Close</button>
	</div>
</div>
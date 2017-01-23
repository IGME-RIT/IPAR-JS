<?php
	session_start();
	if(!$_SESSION || !$_SESSION["user"]){
		header("Location: ../login/");
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    <script src="../lib/localforage.min.js"></script>
	<script>
	function logout(){
		if(confirm("Are you sure you want to logout? I you have an autosave it will be deleted!")){
			localforage.removeItem('caseName').then(function(){
				window.location.href = './logout.php';
			});
		}
	}
	</script>
</head>
<body>
    <section class="menu">
    	<div>
    		<h1><?php echo $_SESSION["user"]; ?></h1>
			<a href="./edit.php" class="menuButton">Edit Account</a>
			<a href="#" onclick="logout();" class="menuButton">Logout</a>
			<?php 
				$db = new SQLite3('../../../db/users.sql') or die ("cannot open");
				$user = $_SESSION["user"];
				$result = $db->query("SELECT active FROM users WHERE username = '$user'");
				if($res = $result->fetchArray())
					if($res['active']==0)  
						echo '<a href="./activeEmail.php" class="menuButton">Resend Activation Email</a>';
			?>
			<a href="./index.php" class="menuButton">Back</a>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

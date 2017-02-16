<?php
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$key = $_GET['key'];
	if(!$key)
		header("Location: ./message.html?message=That recovery link is expired!&");
	$sth = $dbh->prepare("SELECT username FROM users WHERE curKey = :curKey");
    $sth->execute(array(":curKey"=>$key));
	if(!$sth->fetch())
		header("Location: ./message.html?message=That recovery link is expired!&");
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
	<script type='text/javascript'>
		function submit(){ 
			if(document.forms["reset"]["password"].value!=document.forms["reset"]["password2"].value){
				alert("Your passwords don't match!");
				document.forms["reset"]["password"].value = "";
				document.forms["reset"]["password2"].value = "";
			}
			else if(!document.forms["reset"].checkValidity())
				alert('Please fill out every entry in the form');
			else
				document.forms["reset"].submit();
		}
	</script>
</head>
<body>
    <section class="menu">
    	<div>
    		<h1>Reset Password</h1>
    		<form name="reset" action="changePass.php" method="POST">
				New Password: <input type="password" name="password" required />
				<hr>
				Confirm Password: <input type="password" name="password2" required />
				<input type="text" name="key" value="<?php echo $key ?>" style="display:none;" />
				<a onclick="submit();" href="#" class="menuButton">Reset</a>
				<a href="./" class="menuButton">Back</a>
			</form>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

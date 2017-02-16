<?php
	session_start();
	if(!$_SESSION || !$_SESSION["user"]){
		header("Location: ../");
	}
	
	// get user information (for filling out form)
	$user = $_SESSION["user"];
	$dbh = new PDO("sqlite:../../../db/users.sql") or die("Could not establish a database connection.");
	$sth = $dbh->prepare("SELECT email, firstname, lastname, organization FROM users WHERE username = :username");
    $sth->execute(array(":username"=>$user));
	if(!$res = $sth->fetch())
		die("Failed to load user information");

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
	<script type='text/javascript'>
		function submitEmail(){
			if(document.forms["email"]["email"].value != "" && !document.forms["email"]["email"].checkValidity())
				alert(document.forms["email"]["email"].validationMessage);
			else if(!document.forms["email"].checkValidity())
				alert('Please enter an email to change to!');
			else
				document.forms["email"].submit();
		}
		function submitPass(){ 
			if(document.forms["password"]["password"].value!=document.forms["password"]["password2"].value){
				alert("Your passwords don't match!");
				document.forms["password"]["password"].value = "";
				document.forms["password"]["password2"].value = "";
			}
			else if(!document.forms["password"].checkValidity())
				alert('Please enter both a your old password and a new one to change your password!');
			else
				document.forms["password"].submit();
		}

		function submitInfo(){
			if(document.forms["info"].checkValidity()){
				document.forms["info"].submit();
			}
			else {
				alert("All information fields are required.");
			}
		}
	</script>
</head>
<body>
    <section class="menu">
    	<div>
    		<h1><?php echo $_SESSION["user"]; ?></h1>
    		<form name="email" action="changeEmail.php" method="POST" style="padding-bottom:25px;">
    			<fieldset>
    				<legend>Email</legend>
	    			Current:
	    			<?php echo $res["email"]; ?>
					<hr>
	    			New:
	    			<input type="email" name="email" required />
	    			<a href="#" onclick="submitEmail();" class="menuButton">Change Email</a>
    			</fieldset>
    		</form>
    		<form name="password" action="changePass.php" method="POST" style="padding-bottom:25px;">
    			<fieldset>
    				<legend>Password</legend>
	    			Old:
	    			<input type="password" name="oldPassword" required />
	    			New:
	    			<input type="password" name="password" required />
	    			Confirm:
	    			<input type="password" name="password2" required />
	    			<a href="#" onclick="submitPass();" class="menuButton">Change Password</a>
	    		</fieldset>
    		</form>
			<form name="info" action="changeInfo.php" method="POST">
				<fieldset>
					<legend>Information</legend>
					First Name:
					<input type="text" name="firstname" value="<?php echo $res["firstname"]; ?>" required >
					Last Name:
					<input type="text" name="lastname" value="<?php echo $res["lastname"]; ?>" required >
					Organization:
					<input type="text" name="organization" value="<?php echo $res["organization"]; ?>" required >
					<a href="#" onclick="submitInfo();" class="menuButton">Update</a>
				</fieldset>
			</form>
			<a href="./account.php" class="menuButton">Back</a>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

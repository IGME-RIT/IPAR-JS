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
	<title>IPAR - Edit Account</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
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
<body style="overflow: scroll;">
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <div class="jumbotron">
    	<div class="container">
		    <div class="row">
        		<h1 class="uline">Edit Account: <?php echo $_SESSION['user']; ?></h1>
        		<form name="email" action="changeEmail.php" method="POST" style="padding-bottom:25px;">
        			<fieldset>
						<div class="col-xs-12">
        					<legend>Email</legend>
	        			<input type="email" name="email" required value="<?php echo $res["email"]; ?>" >
	        			<ul class="panel-buttons col border" style="margin: 10px 0 10px 0;"><li><a href="#" onclick="submitEmail();" class="btn-tile ">Update Email</a></li></ul>
						</div>
        			</fieldset>
        		</form>
        		<form name="password" action="changePass.php" method="POST" style="padding-bottom:25px;">
        			<fieldset>
						<div class="col-xs-12">
        					<legend>Password</legend>
	            			Old:
	            			<input type="password" name="oldPassword" required />
	            			New:
	            			<input type="password" name="password" required />
	            			Confirm:
	            			<input type="password" name="password2" required />
							
	            			<ul class="panel-buttons col border" style="margin: 10px 0 10px 0;"><li><a href="#" onclick="submitPass();" class="btn-tile ">Change Password</a></li></ul>
						</div>
	        		</fieldset>
        		</form>
		    	<form name="info" action="changeInfo.php" method="POST">
		    		<fieldset>
						<div class="col-xs-12">
		    			    <legend>Information</legend>
		    			    First Name:
		    			    <input type="text" name="firstname" value="<?php echo $res["firstname"]; ?>" required >
		    			    Last Name:
		    			    <input type="text" name="lastname" value="<?php echo $res["lastname"]; ?>" required >
		    			    Organization:
		    			    <input type="text" name="organization" value="<?php echo $res["organization"]; ?>" required >
		    			    <ul class="panel-buttons col border" style="margin:10px 0 10px 0;"><li><a href="#" onclick="submitInfo();" class="btn-tile">Update</a></li></ul>
						</div>
		    		</fieldset>
		    	</form>
				<div class="col-xs-12">
					<hr>
		        	<ul class="panel-buttons col border">
		    			<li>
		    				<a href="./account.php" class="btn-tile horiz">
		    					<span class="glyphicon glyphicon-arrow-left"></span>
		    					<span class="name">Back</span>
		    				</a>
		    			</li>
		    		</ul>
				</div>
			</div>
		</div>
    </div>

	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

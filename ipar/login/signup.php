<?php
	session_start();
	if($_SESSION && $_SESSION["user"]){
		header("Location: ../editor/");
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php' ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
	<script type='text/javascript'>
		function submit(){ 
			if(document.forms["signup"]["password"].value!=document.forms["signup"]["password2"].value){
				alert("Your passwords don't match!");
				document.forms["signup"]["password"].value = "";
				document.forms["signup"]["password2"].value = "";
			}
			else if(document.forms["signup"]["email"].value != "" && !document.forms["signup"]["email"].checkValidity())
				alert(document.forms["signup"]["email"].validationMessage);
			else if(!document.forms["signup"].checkValidity())
				alert('Please fill out every entry in the form');
			else
				document.forms["signup"].submit();
		}
	</script>
</head>
<body style="overflow: scroll;">
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php' ?>
    <div class="jumbotron">
    	<div class="container" style="max-width:430px;">
			<div class="row">
				<div class="col-xs-12">
    				<h1 class="uline med">IPAR Editor Create Account</h1>
				</div>
			</div>
    		<form name="signup" action="new_user.php" method="POST">
				<div class="row"><div class="col-xs-12">Username: <input type="text" name="username" required /></div></div>
				<div class="row"><div class="col-xs-12">Email: <input type="email" name="email" required /></div></div>
				<div class="row"><div class="col-xs-12">Password: <input type="password" name="password" required /></div></div>
				<div class="row"><div class="col-xs-12">Confirm Password: <input type="password" name="password2" required /></div></div>
    	        <div class="row"><div class="col-xs-12">First Name: <input type="text" name="first-name" required /></div></div>
    	        <div class="row"><div class="col-xs-12">Last Name: <input type="text" name="last-name" required /></div></div>
    	        <div class="row"><div class="col-xs-12">Organization: <input type="text" name="organization" required /></div></div>
				<div class="row">
					<ul class="panel-buttons col border" style="margin-top: 10px">
						<div class="col-md-4 col-xs-12">
							<li>
								<a href="./index.php" class="btn-tile horiz">
									<span class="glyphicon glyphicon-arrow-left"></span>
									<span class="name">Back</span>
								</a>
							</li>
						</div>
						<div class="col-md-8 col-xs-12">
							<li>
								<a href="#" onclick="submit();" class="btn-tile horiz">
									<span class="glyphicon glyphicon-plus"></span>
									<span class="name">Create Account</span>
								</a>
							</li>
						</div>
					</ul>
				</div>
			</form>
		</div>
    </div>
	<script type='text/javascript'>
		var username = /(?:&|\?)username=(.*?)&/g.exec(window.location.search)[1];
		document.forms["signup"]["username"].value = decodeURIComponent(username);
		var email = /(?:&|\?)email=(.*?)&/g.exec(window.location.search)[1];
		document.forms["signup"]["email"].value = decodeURIComponent(email);
	</script>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php' ?>
</body>
</html>

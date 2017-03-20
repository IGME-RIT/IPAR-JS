<?php
	$dbh = new PDO('sqlite:../../../db/users.sql') or die ("cannot open");
	$key = $_GET['key'];
	if(!$key)
		header("Location: /message.php?message=That recovery link is expired!&");
	$sth = $dbh->prepare("SELECT username FROM users WHERE curKey = :curKey");
    $sth->execute(array(":curKey"=>$key));
	if(!$sth->fetch())
		header("Location: /message.php?message=That recovery link is expired!&");
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR - Reset Password</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
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
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <div class="jumbotron">
		<div class="container">
        		<h1 class="uline">Reset Password</h1>
        		<form name="reset" action="changePass.php" method="POST">
			    	<div class="row">
						<div class="col-xs-12">
							New Password: <input type="password" name="password" required />
						</div>
					</div>
					<div class="row" style="margin-top: 5px;">
						<div class="col-xs-12">
			    			Confirm Password: <input type="password" name="password2" required />
						</div>
					</div>
					<input type="hidden" name="key" value="<?php echo $key ?>"/>
					<div class="row" style="margin-top: 10px;">
					    <ul class="panel-buttons col border">
			            	<div class="col-xs-12 col-md-4">
					    		<li><a href="./" class="btn-tile horiz">
									<span class="glyphicon glyphicon-arrow-left"></span>
									<span class="name">Back</span>
								</a></li>
					    	</div>
					        <div class="col-xs-12 col-md-8">
					    		<li><a onclick="submit();" href="#" class="btn-tile horiz">
									<span class="glyphicon glyphicon-refresh"></span>
									<span class="name">Change Password</span>
								</a></li>
					    	</div>
					    </ul>
					</div>
			    </form>
			</div>
		</div>
		</div>
    </div>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

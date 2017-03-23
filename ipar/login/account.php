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
	<title>IPAR - Account</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    <script src="../lib/localforage.min.js"></script>
	<script>
	function logout(){
		if(confirm("Are you sure you want to logout? If you have an autosave it will be deleted!")){
			localforage.removeItem('caseName').then(function(){
				window.location.href = './logout.php?redirect=/ipar/login/';
			});
		}
	}
	</script>
</head>
<body>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <section class="jumbotron">
    	<div class="container">
    		<div class="col-xs-12">
				<h1 class="uline">User: <?php echo $_SESSION["user"]; ?></h1>
			</div>
			<div class="col-xs-12">
				<ul class="panel-buttons">
			    	<li >
						<a href="./edit.php" class="btn-tile" >
							<span class="glyphicon glyphicon-pencil"></span>
							<span class="name">Edit Account</span>
						</a>
					</li>
			    	<li>
						<a href="#" onclick="logout();" class="btn-tile" >
							<span class="glyphicon glyphicon-log-out"></span>
							<span class="name">Logout</span>
						</a>
					</li>
			        <?php 
                        $db = new PDO('sqlite:../../../db/users.sql') or die("cannot open");
                        $sth = $db->prepare("SELECT active, curKey FROM users WHERE username = :username");
			        	if($sth -> execute(array(":username" => $_SESSION["user"]))
			        	&& $res = $sth->fetch()) {
			        		if($res['active'] == 0){
			        			?>
								<li>
									<a href="./resendEmail.php?key=<?php echo $res['curKey']; ?>&redirect=<?php echo $_SERVER['REQUEST_URI']; ?>" class="btn-tile">
										<span class="glyphicon glyphicon-envelope"></span>
										<span class="name">Resend Activation Email</span>
									</a>
								</li>
								<?php
			        		}
			        	}
			        ?>
			    	<li >
						<a href="./index.php" class="btn-tile">
							<span class="glyphicon glyphicon-home"></span>
							<span class="name">Home</span>
						</a>
					</li>
				</ul>
		</div>
    </section>
	
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

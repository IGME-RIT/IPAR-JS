<?php
	session_start();
	if($_SESSION && $_SESSION["user"]){
		if(isset($_GET['redirect'])){
			header("Location: ".$_GET['redirect']);
		}
		else{ 
			header("Location: /");
		}	
	}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Login</title>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
	</head>
	<body>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
		<div class="jumbotron">
			<div class="container" style="max-width:430px;">
				<div class="row">
					<div class="col-xs-12">
						<h1 class="uline med">Login</h1>
					</div>
				</div>
			<?php
			$redir = $_SERVER['PHP_SELF'];
			if(isset($_GET['redirect'])){
				$redir = $_GET['redirect'];
			}
			?>
                <form name="login" action="/ipar/login/loginCheck.php?redirect=<?php echo $redir ?>" method="POST" onsubmit="return validate();">
                    <div class="row">
                        <div class="col-md-12"><label>Username:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="text" style="width:100%;" name="username" required ></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><label>Password:</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-12"><input type="password" name="password" style="width:100%;" required></div>
                    </div>
                    <div class="row" style="display: flex; flex-direction: row; margin-top: 10px">
                        <div class="col-md-4 col-xs-4">
                            <a href="/ipar/login/recoverPass.php">Forgot Password</a><br>
                            <a href="/ipar/login/recoverUser.php">Forgot Username</a><br>
                            <a href="/ipar/login/signup.php">Create Account</a>
                        </div>
                        <div class="col-md-8 col-xs-8" style="text-align: right; display: flex; align-items: top; justify-content: flex-end;">
							<ul class="panel-buttons col border" style="width: 100%">
                        	    <li><a class="btn-tile horiz" onclick="document.forms['login'].submit();">Log In</a></li>
							</ul>
                        </div>
                    </div>
                </form>
			</div>
		</div>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php"; ?>
    	<script type='text/javascript'>
    		var username = /username=(.*?)&/g.exec(window.location.search)[1];
    		document.forms['login']['username'].value = decodeURIComponent(username);
    	</script>
	</body>
</html>

<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/php/util.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR</title>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
    <!--section class="menu">
    	<div>
    		<p id="message"></p>
			<a id="back" href="/ipar/" class="menuButton">Back</a>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section-->
	<div class="jumbotron">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <h3>Message</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <p id="message"><?php echo htmlspecialchars($_GET['message']); ?></p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                </div>
		        	<ul class="panel-buttons col border">
		    			<li>
		    				<a id="back" href="<?php echo isset($_GET['redirect']) ? get_safe_url($_GET['redirect']) : '/'; ?>" class="btn-tile horiz">
		    					<span class="glyphicon glyphicon-arrow-left"></span>
		    					<span class="name">Back</span>
		    				</a>
		    			</li>
		    		</ul>
            </div>
        </div>
    </div>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

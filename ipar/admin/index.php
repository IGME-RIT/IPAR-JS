<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Admin Panel</title>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
	</head>
	<body>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
		<div class="jumbotron">
			<div class="container">
                <div class="row">
                    <div class="col-md-12 col-vcenter">
                        <h1 class="uline">Admin Panel</h1>
                    </div>
                </div>
                <ul class="panel-buttons">
                    <li>
                        <a href="users.php" class="btn-tile">
                            <span class="glyphicon glyphicon-user" aria-hidden="true"></span>
                            <span class="name">Users</span>
                        </a>
                    </li>
                    <li>
                        <a href="edit-modal.php" class="btn-tile">
                            <span class="glyphicon glyphicon-edit" aria-hidden="true"></span>
                            <span class="name">Edit Help Modals</span>
                        </a>
                    </li>
					<li>
                        <a href="/" class="btn-tile">
                            <span class="glyphicon glyphicon-home" aria-hidden="true"></span>
                            <span class="name">Home</span>
                        </a>
                    </li>
                </ul>
			</div>
		</div>
		<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php"; ?>
	</body>
</html>

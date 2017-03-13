<!DOCTYPE html>
<html lang="en">
<head>
	<title>IPAR - Reader</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/readerStyle.css">
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    <script src="../lib/preloadjs-0.6.1.min.js"></script>
    <script src="../lib/jszip.min.js"></script>
    <script src="../lib/FileSaver.min.js"></script>
    <script src="reader.min.js"></script>
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>

	<section id="case" style="display:none;">
		<div class="buttonCol">
			<h2>Submissions</h2>
			<div></div>
			<input type="file" id="file-submission" style="display:none;" accept=".iparsubmit, .iparwsubmit"/>
		</div>
		<div class="buttonCol">
			<h2>Categories</h2>
			<div></div>
		</div>
		<div class="categoryContent">
			<img id="multiple-choice" title="Hide/Show Multiple Choice Questions" src="../img/iconToolboxBlue.png" />
			<img id="exit" onclick='window.location.reload();' title="Exit to Menu" src="../img/iconExit.png" />
			<h2>Questions</h2>
			<div></div>
		</div>
    </section>
    <!-- Section For Menus -->
    <section id="titleMenu" class="menu" style="display:none;">
    	<div>
			<h1>IPAR</h1>
			<button id="load-button" class="menuButton">Load Submission</button>
			<button id="menu-button" class="menuButton">Back to Main Menu</button>
			<input type="file" id="load-input"  accept=".iparsubmit, .iparwsubmit"/>
		</div>
		<img class="logo" src="../img/nsflogo.png"/>
    </section>

    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

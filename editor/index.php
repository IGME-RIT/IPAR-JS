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
	<title>IPAR</title>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/styles.css">
	<link rel="stylesheet" type="text/css" href="../css/windowsStyle.css">
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    <script src="../lib/preloadjs-0.6.1.min.js"></script>
    <script src="../lib/jszip.min.js"></script>
    <script src="../lib/FileSaver.min.js"></script>
    <script src="../lib/localforage.min.js"></script>
    <script src="../lib/mimetypes.js"></script>
    <script src="editor.min.js"></script>
</head>
<body>
	<!-- div for console for mobile testing -->
	<!--<div id="console" style="position:fixed;background-color:black;color:white;top:0;left:0;z-index:999;width:100vw;">This is the console</div>  -->
	<!-- Section for the board -->
	<section id="board" style="display:none;">
		<div id="controlBar" class="buttonBar">
			<button id="zoom-in">+</button>
			<input id="zoom-slider" type="range" step="0.1" min="-2.0" max="-0.5" />
			<button id="zoom-out">-</button>
		</div>
		<div id="board-context" class="context">
			<ul>
				<li id="add-question">Add Question <div class="hotkey">Ctrl+Q</div></li>
				<hr>
				<li id="add-category">Add Category <div class="hotkey">Ctrl+C</div></li>
				<li id="rename-category">Rename Category <div class="hotkey">Ctrl+V</div></li>
				<li id="delete-category">Delete Category <div class="hotkey">Delete</div></li>
				<li id="forward-category">Move Category Forward <div class="hotkey">Ctrl+X</div></li>
				<li id="backward-category">Move Category Back <div class="hotkey">Ctrl+Z</div></li>
				<hr>
				<li id="edit-info">Edit Case Info <div class="hotkey">Ctrl+F</div></li>
				<li id="edit-resources">Edit Resources <div class="hotkey">Ctrl+R</div></li>
			</ul>
		</div>
		<div id="node-context" class="context">
			<ul>
				<li id="add-connection">Add Connection <div class="hotkey">Ctrl+Shift+A</div></li>
				<li id="hide-connection">Hide/Show Connection <div class="hotkey">Ctrl+Shift+S</div></li>
				<li id="remove-connection">Remove Connection <div class="hotkey">Ctrl+Shift+D</div></li>
				<hr>
				<li id="make-larger">Make Question Larger <div class="hotkey">Ctrl+S</div></li>
				<li id="make-smaller">Make Question Smaller <div class="hotkey">Ctrl+A</div></li>
				<hr>
				<li id="delete-question">Delete Question <div class="hotkey">Ctrl+D</div></li>
			</ul>
		</div>
	    <!-- save button -->
	    <div class="topBtns">
		    <button id="blob" class="saveBtn"><img src="../img/iconSave.png" /></button>
		    <button onclick="location.reload();" class="saveBtn"><img src="../img/iconExit.png" /></button>
	    </div>
	    <!-- hidden save as link -->
	    <input type="file" id="load-input" style="display: none;" />
	    <div id="bottomBar" class="buttonBar"></div>
	    <div id="windowFlim" style="display: none">
	    	<div id="proceedContainer" style="display: none">
				<button id="proceedBtnLong" class="proceedWidthStart">Proceed</button>
				<div id="proceedBtnRound" class="proceedLeftStart">
					<div id="rightArrow"> > </div>
				</div>
	    	</div>
	    	<div id="windowWrapper"> <div id="windowOuter">
	    		<div id="window"></div>
	   		</div></div>
	    </div>
    </section>
    <!-- Section For Menus -->
    <section id="titleMenu" class="menu" style="display:none;">
    	<div>
			<h1>IPAR Editor Cases</h1>
			<button id="load-button" class="menuButton">Load Case</button>
			<button id="create-button" class="menuButton">Create Case</button>
			<button id="continue-button" class="menuButton">Continue</button>
			<button id="convert-button" class="menuButton">Convert Case</button>
			<button id="menu-button" class="menuButton">Back to Main Menu</button>
			<input type="file" id="load-input" accept=".ipar, .iparw" />
			<input type="file" id="convert-input" accept=".ipar" />
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    	<a href="./account.php" class="menuButton accountName"><?php echo $_SESSION["user"]; ?></a>
    </section>
    <section id="createMenu" class="menu" style="display:none;">
    	<div>
			<h1>Create Case</h1>
			<form>
				Name: <input name="name" id="input-name" />
				<hr>
				Description: <p><div class="text-box large" id="input-description" contenteditable></div></p>
				<hr>
				Conclusion: <p><div class="text-box large" id="input-conclusion" contenteditable></div></p>
				<hr> 
				First Category Name: <input name="cat1" id="input-cat1" /></span>
			</form>
			<button id="back-button" class="menuButton inline">Back</button>
			<button id="create-button" class="menuButton inline">Create</button>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </section>
</body>
</html>

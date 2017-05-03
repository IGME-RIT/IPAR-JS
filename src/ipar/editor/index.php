<!DOCTYPE html>
<html lang="en">
<head>
	<title>IPAR - Editor</title>
    <?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/head.php"; ?>
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
    <!-- TODO: clean up head -->
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/navbar.php"; ?>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/help_modal.php'; ?>
		<div class="navbar clearfix"></div>
	<!-- div for console for mobile testing -->
	<!--<div id="console" style="position:fixed;background-color:black;color:white;top:0;left:0;z-index:999;width:100vw;">This is the console</div>  -->
	<!-- Section for the board -->
	<section id="board" style="display:none;">
		<div style="position:relative">
		<div id="controlBar" class="buttonBar">
			<button id="zoom-in">+</button>
			<input id="zoom-slider" type="range" step="0.1" min="-2.0" max="-0.5" />
			<button id="zoom-out">-</button>
		</div>
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
    <div id="titleMenu" class="jumbotron" style="display:none;">
		<div class="container">
			<div class="row">
				<div class="col-md-12 col-vcenter">
					<h1 class="uline">Editor</h1>
				</div>
			</div>
        	<ul class="panel-buttons">
				<li>
    				<button id="load-button" class="btn-tile">
						<span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>
						<span class="name">Load Case</span>
					</button>
				</li>
				<li>
					<button id="create-button" class="btn-tile">
                        <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>
                        <span class="name">New Case</span>
					</button>
				</li>
				<li>
    				<button id="continue-button" class="btn-tile">
                    	<span class="glyphicon glyphicon-play" aria-hidden="true"></span>
                        <span class="name">Continue</span>
					</button>
				</li>
				<li>
    	    		<button id="convert-button" class="btn-tile">
                        <span class="glyphicon glyphicon-retweet" aria-hidden="true"></span>
                        <span class="name">Convert</span>
					</button>
				</li>
				<li>
    	    		<button id="menu-button" class="btn-tile">
                        <span class="glyphicon glyphicon-home" aria-hidden="true"></span>
                        <span class="name">Home</span>
					</button>
				</li>
				<li>
			       	<button id="menu-button" class="btn-tile" onclick="loadHelpOnce('/assets/php/modal/modal.php?name=Editor%20Menu&format=html');">
						<span class="glyphicon glyphicon-question-sign"></span>
						<span class="name">Help</span>
					</button>
				</li>
    		</ul>
    		<input type="file" id="load-input" accept=".ipar, .iparw" />
    		<input type="file" id="convert-input" accept=".ipar" />
		</div>
        <!-- TODO: remove this -->
    	<a href="../login/account.php" class="menuButton accountName" style="display: none;"><?php echo $_SESSION["user"]; ?></a>

    </div>
    <section id="createMenu" class="modal fade" role="modal">
    	<div class="modal-dialog" role="document">
			<div class="modal-header">
				<h3>New Case</h3>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
		    	<form>
		    		Name: <input name="name" id="input-name" />
		    		<hr>
		    		Description: <p><div class="text-box large" id="input-description" contenteditable></div></p>
		    		<hr>
		    		Conclusion: <p><div class="text-box large" id="input-conclusion" contenteditable></div></p>
		    		<hr> 
		    		First Category Name: <input name="cat1" id="input-cat1" /></span>
		    	</form>
			</div>
			<div class="modal-footer">
		    	<button id="back-button" type="button" class="btn btn-seconday" data-dismiss="modal">Close</button>
		    	<button id="create-button" type="button" class="btn btn-primary">Create case</button>
			</div>
		</div>
    </section>
	<?php include $_SERVER['DOCUMENT_ROOT']."/assets/html/footer.php";?>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>IPAR - Game</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="../css/styles.css">
	<link rel="stylesheet" type="text/css" href="../css/windowsStyle.css">
	<link rel="stylesheet" type="text/css" href="../css/menuStyle.css">
    <script src="../lib/preloadjs-0.6.1.min.js"></script>
    <script src="../lib/jszip.min.js"></script>
    <script src="../lib/FileSaver.min.js"></script>
    <script src="../lib/localforage.min.js"></script>
    <script src="../lib/mimetypes.js"></script>
    <script src="game.min.js"></script>
</head>
<body>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>

	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/help_modal.php'; ?>
	
	<!-- div for console for mobile testing -->
	<!--<div id="console" style="position:fixed;background-color:black;color:white;top:0;left:0;z-index:999;width:100vw;">This is the console</div>  -->
	<!-- Section for the board -->
	<section id="board" style="display:none; margin-top: 51px;">
		<div id="controlBar" class="buttonBar">
			<button id="zoom-in">+</button>
			<button id="zoom-out">-</button>
			<input id="zoom-slider" type="range" step="0.1" min="-2.0" max="-0.5" />
		</div>
	    <div id="bottomBar" class="buttonBar"></div>
	    <!-- save button -->
	    <div class="topBtns">
		    <button id="blob"><img src="../img/iconSave.png" /></button>
		    <button onclick="location.reload();"><img src="../img/iconExit.png" /></button>
		    <button id="infoButton"><img src="../img/iconToolbox.png" /></button>
	    </div>
	    <!-- hidden save as link -->
	    <input type="file" id="load-input" style="display: none;" />
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
					<h1 class="uline">IPAR</h1>
				</div>
			</div>
			<div class="row">
				<ul class="panel-buttons">
					<li>
			        	<button id="load-button" class="btn-tile">
							<span class="glyphicon glyphicon-folder-open"></span>
							<span class="name">Load Case</span>
						</button>
					</li>
					<li>
			        	<button id="demo-button" class="btn-tile">
							<span class="glyphicon glyphicon-file"></span>
							<span class="name">Demo</span>
						</button>
					</li>
					<li>
			        	<button id="continue-button" class="btn-tile">
							<span class="glyphicon glyphicon-play"></span>
							<span class="name">Continue</span>
						</button>
					</li>
					<li>
			        	<button id="menu-button" class="btn-tile">
							<span class="glyphicon glyphicon-home"></span>
							<span class="name">Home</span>
						</button>
					</li>
					<li>
			        	<button id="menu-button" class="btn-tile" onclick="loadHelpOnce('/assets/php/modal/modal.php?name=Game%20Menu&format=html');">
							<span class="glyphicon glyphicon-question-sign"></span>
							<span class="name">Help</span>
						</button>
					</li>
				</ul>
			</div>
			<input type="file" id="load-input" accept=".ipar, .iparw" />
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </div>
    <div id="caseMenu" class="jumbotron" style="display:none;">
    	<div class="container">
			<div class="row">
				<div class="col-md-12 col-vcenter">
					<h1 id="case-title" class="uline"></h1>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-5">
					<div id="description-box"><p id="case-description"></p></div>
				</div>
				<div class="col-sm-7">
			    	<ul class="panel-buttons col">
		        		<li>
							<button id="resume-button" class="btn-tile horiz">
								<span class="name">Resume Session</span>
								<span class="glyphicon glyphicon-play"></span>
							</button>
						</li>
		        		<li>
							<button id="start-button" class="btn-tile horiz">
								<span class="name">Start from Beginning</span>
								<span class="glyphicon glyphicon-asterisk"></span>
							</button>
						</li>
		        		<li>
							<button id="back-button" class="btn-tile horiz">
								<span class="glyphicon glyphicon-arrow-left"></span>
								<span class="name">Back</span>
							</button>
						</li>
			    	</ul>
				</div>
			</div>
		</div>
		<img class="logo" src="../img/nsflogo.png" />
    </div>
    <div id="profileMenu" class="jumbotron" style="display:none;">
    	<div class="container">
			<div class="row">
				<div class="col-md-12 col-vcenter">
					<h1 id="profile-title" class="uline"></h1>
				</div>
			</div>
			<div class="row">
		    	<form>
					<div class="col-sm-6 col-xs-12">
		    			First Name: <span id="first-name"></span><input name="first" id="input-first-name" />
					</div>
					<div class="col-sm-6 col-xs-12">	
		    			Last Name: <span id="last-name"></span><input name="last" id="input-last-name" />
					</div>
					<div class="col-xs-12">
		    			<span id="email">Email: <input name="email" id="input-email" /></span>
					</div>
		    	</form>
			</div>
			<div class="row" style="margin-top: 6px">
				<div class="col-xs-12">
				<ul class="panel-buttons inline" style="float: right;">
		    	    <li>
						<button id="back-button" class="btn-tile">
							<span class="glyphicon glyphicon-arrow-left"></span>
							<span class="name">Back</span>
						</button>
					</li>
		    	    <li>
						<button id="proceed-button" class="btn-tile">
							<span class="name">Proceed</span>
							<span class="glyphicon glyphicon-arrow-right"></span>
						</button>
					</li>
				</ul>
				</div>
			</div>
		</div>
    </div>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Forensics Project</title>
		<?php include("assets/html/head.php"); ?>
		<script src="/assets/js/player.min.js"></script>
	</head>
	<body>
		<?php include("assets/html/navbar.php"); ?>
		<?php include("assets/html/help_modal.php"); ?>
		<div class="navbar clearfix"></div>
		<div class="container">
			<div class="playDiv">
				<a class="playButton" href="/ipar/game/">Play Now</a>	
			</div>
			<div class="jumbotron">
				<h2><strong>Gamified Digital Forensics Project</strong></h2>
				<div class="row">
					<div class="col-xs-7 col-md-7">
						<h4>IPAR  (Imaging, preserving, analyzing and reporting):</h4>
						<div class="player embed-responsive embed-responsive-16by9" data-video-src="/assets/media/game-demo.mp4"></div>
					</div>
					<div class="col-xs-5 col-md-5">
						<img id="nsf" src="assets/img/NSF.png"/>
						<p class="larger moveDown">
							IPAR (Imaging, Preserving, analyzing and reporting) is a narrative-based detective-themed
							adventure <a href="files/IPAR Game 1.01.zip">game</a>, which has two versions. One runs on Windows 7 or newer with the .NET framework installed, and the other can be run in most modern browsers. Through the
							game, the player assumes the role of an
							investigator and collects evidence, answers questions, and draws conclusions as part
							of a simulated investigation. Players are guided through a series of scripted steps,
							allowing them to gain practical experience
							and draw their own conclusions by answering
							subject related questions.
						</p>
					</div>
				</div>
				<div class="row">
					<div class="col-xs-7 col-md-7">
						<h4>IPAR Editor:</h4>
						<div class="player embed-responsive embed-responsive-16by9" data-video-src="/assets/media/editor-demo.mp4"></div>
					</div>
					
					<div class="col-xs-5 col-md-5">
						<p class="larger moveDown">
							Developed alongside the <a href="files/IPAR Game 1.01.zip">game</a> is an <a href="files/IPAR Editor.zip">editor</a>
							that can be used to generate new cases. Everything from subject matter to graphical
							elements to story can be set by the user to create an entertaining educational experience, and an <a href="files/IPAR Reader.zip">reader</a> that
							allows instructors to view the reports submitted by students for grading.
						</p>
						<p class="larger moveDown">
							An account is not required to play the web-based game. However, an account is required to use the online editor features. Once your account is created, an administrator will need to approve your access to the editor before you can begin using it.
						</p>
						<p class="larger moveDown">
							Sample case files for the game can be downloaded on the <a href="/downloads.php">downloads</a> page. These files may be downloaded and played in the web or Windows game.
						</p>
					</div>
				</div>
			</div>
		</div>
		<button id="help-button-fixed" onclick="loadHelpOnce('/assets/php/modal/modal.php?name=Homepage&format=html')">
			<span class="glyphicon glyphicon-question-sign"></span>
		</button>

		<script>
			// show help if this is the first time the client has visited the page
			if(document.cookie.replace(/(?:(?:^|.*;\s*)homepageHelpShown\s*\=\s*([^;]*).*$)|^.*$/, "$1") !== "true") {
				// show help after 3 seconds
				setTimeout(showHelpFirstTime, 3000);
			}

			function showHelpFirstTime() {
				// show help
				loadHelpOnce('/assets/php/modal/modal.php?name=Homepage&format=html');

				// set cookie
				document.cookie = "homepageHelpShown=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
				
			}
		</script>

		<?php include("assets/html/footer.php"); ?>
	</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
	<title>IPAR - Reader</title>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/head.php'; ?>
	<link href='https://fonts.googleapis.com/css?family=Quicksand:700' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" type="text/css" href="/assets/css/readerStyle.css">
	<link rel="stylesheet" type="text/css" href="/assets/css/menuStyle.css">
    <script src="/assets/js/preloadjs-0.6.1.min.js"></script>
    <script src="/assets/js/jszip.min.js"></script>
    <script src="/assets/js/FileSaver.min.js"></script>
    <script src="/assets/js/reader.min.js"></script>
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/navbar.php'; ?>
	<?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/help_modal.php'; ?>

	<section id="case" style="display:none; margin-top: 51px;">
		<div class="buttonCol">
			<h2>Submissions</h2>
			<ul class="panel-buttons col border" id="submission-col"></ul>
			<ul class="panel-buttons col border" id="addsub-col">
				<input type="file" id="file-submission" style="display:none;" accept=".iparsubmit, .iparwsubmit"/>
			</ul>
		</div>
		<div class="buttonCol">
			<h2>Categories</h2>
			<ul class="panel-buttons col border" id="category-col"></ul>
		</div>
		<div class="categoryContent">
	    	<div style="position: relative;">
	    		<ul class="panel-buttons col border" style="width: auto; position: absolute;">
	    			<li>
	    		<button id="multiple-choice" class="btn-tile horiz" title="Hide/Show Multiple Choice Questions">
	    			<span class="glyphicon glyphicon-search"></span>
	    			<span class="name">Hide Multiple Choice</span>
	    		</button>
	    		</li>
	    		</ul>
				<ul class="panel-buttons col border" style="width: auto;" id="exit">
					<li>
						<button class="btn-tile horiz" title="Exit to Menu" onclick="window.location.reload();">
							<span class="glyphicon glyphicon-remove"></span>
							<span class="name">Exit to Menu</span>
						</button>
					</li>
				</ul>
	    		<h2>Questions</h2>
			</div>
			<div id="questions"></div>
		</div>
    </section>
    <!-- Section For Menus -->
    <section id="titleMenu" class="jumbotron" style="display:none;">
    	<div class="container">
            <div class="row">
                <div class="col-md-12 col-vcenter">
			    <h1 class="uline">Reader</h1>
                </div>
            </div>
            <ul class="panel-buttons">
                <li>
			<button id="load-button" class="btn-tile">
                <span class="glyphicon glyphicon-folder-open" aria-hidden="true" style="font-size:3.5em;"></span>
                <span>Load Submission</span>
            </button>
                </li>
                <li>
			<button id="menu-button" class="btn-tile">
                <span class="glyphicon glyphicon-home" aria-hidden="true" style="font-size:3.5em;"></span>
                <span class="name">Home</span>
            </button>
                </li>
				<li>
			       	<button id="menu-button" class="btn-tile" onclick="loadHelpOnce('/assets/php/modal/modal.php?name=Reader%20Menu&format=html');">
						<span class="glyphicon glyphicon-question-sign"></span>
						<span class="name">Help</span>
					</button>
				</li>
            </ul>
			<input type="file" id="load-input"  accept=".iparsubmit, .iparwsubmit"/>
		</div>
    </section>

    <?php include $_SERVER['DOCUMENT_ROOT'].'/assets/html/footer.php'; ?>
</body>
</html>

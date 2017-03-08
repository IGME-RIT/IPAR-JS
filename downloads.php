<!DOCTYPE html>
<html lang="en">
	<head>
		<title>IPAR - Downloads</title>
		<?php include("assets/html/head.php"); ?>
	</head>
	<body>
		<?php include("assets/html/navbar.php"); ?>
		<div class="jumbotron">
			<div class="container">
	        	<div class="row">
					<div clas="col-md-12">
						<h1 style="margin-bottom: 0;">Downloads</h1>
					</div>
				</div>
            </div>
		</div>
		<div class="jumbotron light short">
			<div class="container">
				<div class="row">
					<div class="col-12">
						<h2 class="uline heavy">Case Files</h2>
				    </div>
				</div>
				<div class="row">
					<div class="col-md-2 col-3 col-vcenter" style="text-align: right; vertical-align:top;">
						<h4>Web</h4>
					</div>
					<div class="col-md-8 col-8 col-vcenter">
		     			<?php 
	        				$case_dir = 'CasesW';
	        				$cases = scandir($case_dir);
	        				$num_cases = count($cases);
	        				for($i = 0;$i<$num_cases;$i++){
	        					if(!preg_match('/.*\.iparw$/', $cases[$i]))
	        						continue;
	        					$name = substr($cases[$i], 0, strrpos($cases[$i], '.'));
 	     					?>
             				<a href="<?php echo $case_dir . '/' . $cases[$i]; ?>"><?php echo $name ?>.iparw</a><br>
             				<?php
	        				} 
		     			?>
 					</div>
				</div>
				<div class="row" style="margin-top: 8px;">
					<div class="col-md-2 col-3 col-vcenter" style="text-align: right; vertical-align:top;">
						<h4>Windows</h4>
					</div>
					<div class="col-md-8 col-8 col-vcenter">
		     			<?php 
	        				$case_dir = 'Cases';
	        				$cases = scandir($case_dir);
	        				$num_cases = count($cases);
	        				for($i = 0;$i<$num_cases;$i++){
	        					if(!preg_match('/.*\.ipar$/', $cases[$i]))
	        						continue;
	        					$name = substr($cases[$i], 0, strrpos($cases[$i], '.'));
 	     					?>
             				<a href="<?php echo $case_dir . '/' . $cases[$i]; ?>"><?php echo $name ?>.ipar</a><br>
             				<?php
	        				} 
		     			?>
 					</div>
				</div>
            </div>
        </div>
		<div class="jumbotron short">
			<div class="container">
				<div class="row">
					<div class="col-12">
						<h2 class="uline heavy">Windows Executables<small><a href="https://docs.google.com/document/d/1ynVoazj1kUtUd_DR6Vq3PbRdB4CoL4iNi0NrCrEPZHI/edit?usp=sharing"> Instructions</a></small></h2>
				    </div>
				</div>
				<div class="row">
					<div class="col-md-2 col-3 col-vcenter" style="text-align: right">
						<h4>Game (1.01)</h4>
				    </div>
					<div class="col-md-8 col-8 col-vcenter" >
						<a href="files/IPAR Game 1.01.zip">IPAR Game 1.01.zip</a>
					</div>
				</div>
				<div class="row">
					<div class="col-md-2 col-3 col-vcenter" style="text-align: right">
						<h4>Editor</h4>
					</div>
					<div class="col-md-8 col-8 col-vcenter" >
						<a href="files/IPAR Editor.zip">IPAR Editor.zip</a>
					</div>
				</div>
				<div class="row">
					<div class="col-md-2 col-3 col-vcenter" style="text-align: right">
						<h4>Reader</h4>
					</div>
					<div class="col-md-8 col-8 col-vcenter" >
						<a href="files/IPAR Reader.zip">IPAR Reader.zip</a>
					</div>
				</div>
			</div>
		</div>
		<?php include("assets/html/footer.php"); ?>
	</body>
</html>

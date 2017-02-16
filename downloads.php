<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Downloads</title>
		<?php include("assets/html/head.php"); ?>
	</head>
	<body>
		<?php include("assets/html/navbar.php"); ?>
		<div style="height:65px"></div>
		<div class="container">
			<div class="row">
				<div class="jumbotron">
					<div class="row">
						<div class="col-xs-11 col-md-11">
							<div style="border: 1px solid black;padding:10px 25px;">
								<h2 class="downloads"><strong>Windows Version</strong><small><a href="https://docs.google.com/document/d/1ynVoazj1kUtUd_DR6Vq3PbRdB4CoL4iNi0NrCrEPZHI/edit?usp=sharing"> Instructions</a></small></h2>
								<h3>Game (1.01):</h3>
								<p>Download the Forensics game <a href="files/IPAR Game 1.01.zip">here</a></p>
								<h3>Game Editor:</h3>
								<p>Download the Forensics game editor <a href="files/IPAR Editor.zip">here</a></p>
								<h3>Game Reader:</h3>
								<p>Download the Forensics game reader <a href="files/IPAR Reader.zip">here</a></p>
								<h3>Cases:</h3>
								<?php
								require_once '../google-api-php-client/src/Google/autoload.php';

								$client_email = 'ipar-website@lithe-sandbox-140110.iam.gserviceaccount.com';
								$private_key = json_decode(file_get_contents('../IPARW-drive-api.json'), true)['private_key'];
								$scopes = array('https://www.googleapis.com/auth/drive.readonly');
								$credentials = new Google_Auth_AssertionCredentials(
								    $client_email,
								    $scopes,
								    $private_key
								);

								$client = new Google_Client();
								$client->setAssertionCredentials($credentials);
								if ($client->getAuth()->isAccessTokenExpired()) {
								  $client->getAuth()->refreshTokenWithAssertion();
								}

								$service = new Google_Service_Drive($client);
								function readFolder($rootID, $service){
									$folders = $service->files->listFiles(array(
											'q' => "mimeType = 'application/vnd.google-apps.folder' and '$rootID' in parents"
									));
									$files = $service->files->listFiles(array(
											'q' => "'$rootID' in parents"
									));
									foreach ($files->files as $file) {
										if(strlen($file->name)>strlen(".ipar") && substr($file->name, strlen($file->name)-strlen(".ipar"))==".ipar"){
											$fileName = substr($file->name, 0, strlen($file->name)-strlen(".ipar"));
											echo "<p>Download $fileName <a href='https://drive.google.com/uc?export=download&id=$file->id'>here</a></p>";
										}
									}
									foreach ($folders->files as $folder) {
										readFolder($folder->id, $service);
									}
								}
								readFolder('0BzI-q-SFKR5JfjFXWHNnc240cGpEU0FUY0NidHFucHVFQnJoUW55cDNiUHBtbTJRZmJ1TjQ', $service);
								?>
							</div>
							<div style="border: 1px solid black;padding:10px 25px;">
								<h2 class="downloads"><strong>Web Version</strong></h2>
								<h3>Game:</h3>
								<p>Play the Forensics game <a href="ipar/game/">here</a></p>
								<h3>Game Editor:</h3>
								<p>Play the Forensics game editor <a href="ipar/editor/">here</a></p>
								<h3>Game Reader:</h3>
								<p>Play the Forensics game reader <a href="ipar/reader/">here</a></p>
								<h3>Cases:</h3>
								<?php 
									$case_dir = 'CasesW';
									$cases = scandir($case_dir);
									$num_cases = count($cases);
									for($i = 0;$i<$num_cases;$i++){
										if(!preg_match('/.*\.iparw$/', $cases[$i]))
											continue;
										$name = substr($cases[$i], 0, strrpos($cases[$i], '.'));
										echo '<p>Download ' . $name . ' <a href="' . $case_dir . '/' . $cases[$i] . '" download>here</a></p>';
									}
								?>
							</div>
						</div>
						<div class="col-xs-1 col-md-1">
							<img id="nsf2" src="assets/img/NSF.png"/>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php include("assets/html/footer.php"); ?>
	</body>
</html>

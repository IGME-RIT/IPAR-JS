<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Workshop</title>
		<?php include("assets/html/head.php"); ?>
	</head>
	<body>
		<?php include("assets/html/navbar.php"); ?>
		<div style="height:65px"></div>
		<div class="container">
			<div class="jumbotron">
				<h2><strong>Gamified Digital Forensics Course Modules for Undergraduates<br>Faculty Summer Workshop</strong></h2>
				<div class="row">
					<div class="col-xs-7 col-md-7">
						<?php 
							$workshop_dir = 'assets/workshop';
							$images = scandir($workshop_dir);
							$num_images = count($images);
							for($i = 0;$i<$num_images;$i++)
								if(preg_match('/\.(jpg|jpeg|png|gif)$/', $images[$i]))
									echo "<img src='assets/workshop/$images[$i]' width='100%' style='margin: 10px 0;border: 5px solid black;' />";
						?>
					</div>
					<div class="col-xs-5 col-md-5">
						<img id="nsf" src="assets/img/NSF.png"/>
						<p>
							Two summer workshops, <i>Gamified Digital Forensics Course Modules for Undergraduates</i>, have been provided by Rochester Institute of Technology, Onondaga Community College, and Community Corning College, in an effort to provide a unique opportunity for college faculty to learn the basic forensics concept and technologies through modular-based forensics games.
The first workshop was held at Rochester Institute Technology on July 17, 2015 and the second one was held at Onondaga Community College on June 24, 2016. During these workshops, participates learned the basic forensics concept and technologies through modular-based forensics games with hands-on activities. The goal for these workshops are to engage college faculty to integrate forensics games into their existing security curriculum, especially to enhance digital forensics curricula by introducing game-based digital forensics modules for entry-level students. 
More than 30 faculty member from two-year and four-year colleges and universities went through these two workshops.
						</p>
						<h3 style="margin-top:25px;">Gamified Digital Forensics Workshop co-organizers:</h3>
						<ul>
							<li>Alicia McNett (Corning Community College)</li>
							<li>David Schwartz (Rochester Institute of Technology)</li>
							<li>Joseph DeLeone (Corning Community College)</li>
							<li>Michael Heise (Onondaga Community College)</li>
							<li>Pamela McCarthy (Onondaga Community College)</li>
							<li>Sumita Mishra (Rochester Institute of Technology)</li>
							<li>Timothy Stedman (Onondaga Community College)</li>
							<li>Yin Pan (Rochester Institute of Technology)</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<?php include("assets/html/footer.php"); ?>
	</body>
</html>

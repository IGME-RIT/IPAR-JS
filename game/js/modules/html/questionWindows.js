
var m = module.exports;

m.closeCase = '\
<div class="window">\
	<div class="title">\
		Closing the Case\
	</div>\
	<div class="windowContent" style="overflow-y:scroll;">\
		<h3><b>%title%</b></h3>\
		<p style="height: 60%;">%conclusion%</p>\
		<hr>\
		<p class="center">Click the export case button below to export an .iparwsubmit type file that you can deliver to your instructor for grading.</p>\
	  <button class="answer">Export Case</button>\
	</div>\
</div>\
';

m.caseClosed = '\
<div class="window">\
	<div class="title">\
		Case Closed\
	</div>\
	<div class="windowContent" style="overflow-y:scroll;">\
		<p class="center">Deliver the submission file to your instructor for evaluation. The quality of your findings will determine the outcome of the cases.</p>\
	  <button class="answer" onclick="window.location.href=\'../index.html\';">Return to Main Menu</button>\
	</div>\
</div>\
';

m.taskWindow = '\
<div class="window left">\
	<div class="title">\
		Task\
	</div>\
	<div class="windowContent" style="overflow-y: scroll;height:35vh;">\
		<h3><b>%title%</b></h3>\
		<p>%instructions%</p>\
		<hr>\
		<p><b>%question%</b></p>\
		<hr>\
		<p class="feedback"></p>\
	</div>\
</div>\
';


m.resourceWindow = '\
<div class="window left">\
	<div class="title">\
		Resource\
	</div>\
	<div class="windowContent" style="overflow-y: scroll; height:20vh;">\
		%resources%\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%"/>\
  %title%\
  <a href="%link%" target="_blank">\
    <div class="center">\
      Open\
      <img src="../img/iconLaunch.png"/>\
    </div>\
  </a>\
</div>\
';

m.answerWindow = '\
<div class="window right">\
	<div class="title">\
		Answers\
	</div>\
	<div class="windowContent" style="min-height:20vh;">\
	\
	</div>\
</div>\
';

m.fileWindow = '\
<div class="window right">\
  <div class="title">\
    Files\
  </div>\
  <div class="windowContent" style="height:25vh;min-height: 100px;">\
	<div class="fileButton full">\
		<img src="../img/iconFileSubmit.png"/><br>\
		Browse And Submit\
	</div>\
    <input type="file" style="display:none;" multiple/>\
  </div>\
</div>\
';

m.messageWindow = '\
<div class="window">\
	<div class="title">\
		Message\
	</div>\
	<div class="windowContent" style="height:80vh;overflow-y:scroll;">\
		<p><b>From </b>%title%</p>\
		<hr>\
		<p><b>Subject </b>%instructions%</p>\
		<hr>\
		<p>%question%</p>\
	  <button class="answer">Mark as Read</button>\
	</div>\
</div>\
';
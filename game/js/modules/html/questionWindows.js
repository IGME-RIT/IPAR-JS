
var m = module.exports;

m.taskWindow = '\
<div class="window task">\
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
<div class="window resource">\
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
<div class="window answer">\
	<div class="title">\
		Answers\
	</div>\
	<div class="windowContent" style="min-height:20vh;">\
	\
	</div>\
</div>\
';

m.fileWindow = '\
<div class="window file">\
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
<div class="window message">\
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
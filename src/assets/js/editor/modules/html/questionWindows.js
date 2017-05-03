
var m = module.exports;

m.taskWindow = '\
<div class="window">\
	<div class="title">\
		Task\
	</div>\
	<div class="windowContent" style="overflow-y: scroll;height:30vh;">\
		<h3><b>Question Name</b></h3>\
		<h3><b><div class="text-box" contenteditable>%title%</div></b></h3><br>\
		<p>Instructions</p>\
		<p><div class="text-box large" contenteditable>%instructions%</div></p>\
		<hr>\
		<p><b>Question</b></p>\
		<p><b><div class="text-box large" contenteditable>%question%</div></b></p>\
	</div>\
</div>\
';


m.resourceWindow = '\
<div class="window">\
	<div class="title">\
		Resource\
	</div>\
	<div class="windowContent" style="overflow-y: scroll; height:20vh;">\
		<div class="resourceContent">\
		</div>\
		<br>\
		<button class="full">Add Resource</button>\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%" class="icon"/>\
  <img src="../img/iconClose.png" class="delete"/>\
  %title%\
  <a href="%link%" target="_blank" class="alignBot" >\
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
	<div class="windowContent" style="min-height:20vh;max-height:50vh;overflow-y:scroll;">\
		<select>\
			<option value="2">2</option>\
			<option value="3">3</option>\
			<option value="4">4</option>\
			<option value="5">5</option>\
		</select>\
		answers. Select correct answer with radio button.\
		<form onsubmit="return false;">\
		\
		</form>\
	</div>\
</div>\
';

m.answer ='\
<input type="radio" name="answer" value="%num%" class="answerRadio">\
<div class="answerInputs">\
	<b>Choice %num%</b><br>\
	<input name="answer%num%" value="%answer%"><br>\
	Feedback<br>\
	<input name="feedback%num%" value="%feedback%"><br>\
</div>\
';

m.messageWindow = '\
<div class="window">\
	<div class="title">\
		Message\
	</div>\
	<div class="windowContent" style="height:60vh;overflow-y:scroll;">\
		<p><b>From </b>\
		<div class="text-box" contenteditable>%title%</div></p>\
		<hr>\
		<p><b>Subject </b>\
		<div class="text-box" contenteditable>%instructions%</div></p>\
		<hr>\
		<p>Message</p>\
		<p><div class="text-box tall" contenteditable>%question%</div></p>\
	</div>\
</div>\
';

m.questionTypeWindow = '\
<div class="window">\
	<div class="title">\
		Question Type\
	</div>\
	<div class="windowContent">\
		<select class="full">\
			<option value="1">Justification Multiple Choice</option>\
			<option value="2">Standard Multiple Choice</option>\
			<option value="3">Short Response</option>\
			<option value="4">File Submisson</option>\
			<option value="5">Message</option>\
		</select>\
		<button class="imageButton">\
		  <div><img src="../img/placeholder.png"/></div>\
		  <div> Select Image </div>\
		</button>\
	</div>\
	<div class="windowButtons">\
		<button>Save</button>\
	</div>\
</div>\
';
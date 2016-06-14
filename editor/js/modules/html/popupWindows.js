
var m = module.exports;

m.editInfo = '\
<div class="window popup">\
	<div class="title">\
		Case Info\
	</div>\
	<div class="windowContent" style="min-height:35vh;">\
		<form onsubmit="return false;">\
			<b>Name</b><br>\
			<input name="caseName" value="%caseName%"><br>\
			<b>Description</b><br>\
		 	<p><div class="text-box large" contenteditable>%description%</div></p>\
			<b>Conclusion</b><br>\
	 		<p><div class="text-box large" contenteditable>%conclusion%</div></p>\
			<button class="halfButton">Back</button><button class="halfButton">Apply Changes</button>\
		</form>\
	</div>\
</div>\
';

m.resourcesWindow = '\
<div class="window popup">\
	<div class="title">\
		Resources\
	</div>\
	<div class="windowContent">\
		<div class="resourceContent" style="overflow-y:scroll;height:35vh;">\
		</div>\
		<br>\
		<button class="halfButton">Back</button><button class="halfButton">Create New Resources</button>\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%" class="icon"/>\
  <img src="../img/iconClose.png" class="delete"/>\
  <img src="../img/iconTools.png" class="edit"/>\
  <div class="resourceText">%title%\
  <br>\
  <span style="color:gray;">%link%</span></div>\
</div>\
';

m.resourceEditor = '\
<div class="window popup">\
	<div class="title">\
		%edit% Resource\
	</div>\
	<div class="windowContent">\
		<form onsubmit="return false;">\
			<select name="type" class="full">\
				<option value="0">File Refrence</option>\
				<option value="1">Web Link</option>\
				<option value="2">Video Link</option>\
			</select>\
			<b>Display Name</b><br>\
			<input name="name" value="%name%"><br>\
			<b>Link Address (www. needed)</b><br>\
			<input name="link" value="%link%">\
		</form>\
		<br>\
		<button class="halfButton">Cancel</button><button class="halfButton">%apply%</button>\
	</div>\
</div>\
';

m.textInput = '\
<div class="window popup">\
	<div class="title">\
		%title%\
	</div>\
	<div class="windowContent">\
		<form onsubmit="return false;">\
			<b>%prompt%</b><br>\
			<input name="text" value="%value%"><br>\
		</form>\
		<br>\
		<button class="halfButton">Cancel</button><button class="halfButton">%apply%</button>\
	</div>\
</div>\
';
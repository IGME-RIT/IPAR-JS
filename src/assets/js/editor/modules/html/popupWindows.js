
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
<div class="window popup" style="width:35vh;">\
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
<div class="resourceItem overNone">\
  <img src="%icon%" class="icon"/>\
  <img src="../img/iconClose.png" class="delete"/>\
  <img src="../img/iconTools.png" class="edit"/>\
  %title%\
  <div class="flavor">%link%</div>\
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
				<option value="3">Previous File Refrence</option>\
			</select>\
			<b>Display Name</b><br>\
			<input name="name" value="%name%"><br>\
			<b class="addressTag">Link Address</b><br>\
			<input class="address" name="link" value="%link%">\
			<button class="halfButton">Choose File</button><button class="halfButton">View File</button>\
			<span class="addressInfo"></span>\
			<div class="preResources"></div>\
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

m.imagesEditor = '\
<div class="window images">\
	<div class="title">\
		Images\
	</div>\
	<div class="windowContent">\
		<div class="imageContent">\
		</div>\
		<br>\
		<input type="file" style="display:none;"/>\
		<button class="thirdButton">Close</button><button class="thirdButton">Upload Image</button><button class="thirdButton">Import Image</button>\
		<button class="full">Previously Uploaded Images</button>\
	</div>\
</div>\
';

m.image = '\
<div class="image">\
	<img src=%image% />\
	<img src="../img/iconClose.png" class="delete"/>\
</div>\
';

m.getImage = function(url) {
	var div = document.createElement("div");
	div.setAttribute("class", "image");

	var img = document.createElement("img");
	img.src = url;

	var closeButton = document.createElement("img");
	closeButton.src = "../img/iconClose.png";
	closeButton.setAttribute("class", "delete");

	div.appendChild(img);
	div.appendChild(closeButton);

	return div;
}

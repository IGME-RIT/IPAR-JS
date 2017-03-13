
var m = module.exports;

m.button = '\
<li>\
	<button class="btn-tile">\
		<b>%title%</b><br>\
		%text%\
	</button>\
</li>\
';

m.buttonNoTitle = '\
<li>\
	<button class="btn-tile">\
		%text%\
	</button>\
</li>\
';

m.questionStart = '\
<div class="questionContent">\
	<h2>%title%</h2>\
	<p>%instructions%</p>\
	<p><b>%question%</b></p>\
';

m.questionEnd = '\
</div>\
';

m.justification = '\
	<b>Submitted Response</b><br>\
	<p class="justification">%justification%</p>\
';

m.answer = '\
<p class="answer %correct%">%answer%</p>\
';

m.submissions = '\
	<b>Submitted Content</b><br>\
	<button class="submission">Download Submissions</button>\
';

// creates an element from a template defined above
m.makeElement = function(template, subs) {
	var tempDiv = document.createElement("div");
	tempDiv.innerHTML = template;

	// replace any subsitutable parts of the template
	if(subs){
		$.each(subs, function(key, value) {
			// replace by id with msg
			var re = new RegExp(key, "g");
			console.log(re);
			tempDiv.innerHTML = tempDiv.innerHTML.replace(re, value);	
		});
	}

	var element = tempDiv.firstChild;
	return element;
}
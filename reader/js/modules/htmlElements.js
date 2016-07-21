
var m = module.exports;

m.button = '\
<button class="readerButton">\
	<b>%title%</b><br>\
	%text%\
</button>\
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
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

var caseStatus = '0';

// Load the current case's info if found (If not found return to title)
document.addEventListener('DOMContentLoaded', function() {
	
	// Make sure there is a current case
	if(!localStorage['caseFiles'])
		document.location = "../";
	var caseFiles = localStorage['caseFiles'];
	
	// Load the case name and description
	window.resolveLocalFileSystemURL(caseFiles+'active/caseFile.ipardata', function(fileEntry) {
		fileEntry.file(function(file) {
			
			var reader = new FileReader();
			reader.onloadend = function() {

				// Get the case name and description from the xml
				var curCase = getDoc(this.result).getElementsByTagName("case")[0];
				document.getElementById("title").innerHTML = curCase.getAttribute("caseName")+document.getElementById("title").innerHTML;
				document.title = document.getElementById("title").innerHTML;
				document.getElementById("description").innerHTML = curCase.getAttribute("description");
			   
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
	
	// Load if the case has a save
	window.resolveLocalFileSystemURL(caseFiles+'active/saveFile.ipardata', function(fileEntry) {
		fileEntry.file(function(file) {
			
			var reader = new FileReader();
			reader.onloadend = function() {

				// Get the case save status
				caseStatus = getDoc(this.result).getElementsByTagName("case")[0].getAttribute("caseStatus");
				var statusMessage = "";
				switch(caseStatus){
					case '0':
						statusMessage = "";
						document.getElementById("resume-button").disabled = true;
						break;
					case '1':
						statusMessage = " [In Progress]";
						break;
					case '2':
						statusMessage = " [Completed]";
						break;
				}
			    document.getElementById("title").innerHTML += statusMessage;
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
});

function displayCase(xml){
	
	// Get the case name and description from the xml
	var curCase = xmlDoc.getElementsByTagName("case")[0];
	document.getElementById("title").innerHTML = curCase.getAttribute("caseName");
	document.title = curCase.getAttribute("caseName");
	document.getElementById("description").innerHTML = curCase.getAttribute("description");
	
}

// Get the xmlDoc of an given xml
function getDoc(xml){
	// Load the xml as doc for parseing
	var xmlDoc;
	if (window.DOMParser){
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(xml, "text/xml");
	}
	else{ // IE
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(xml);
	}
	return xmlDoc;
}

// Return to title
function back(){
	document.location = "../";
}

// Create new case session
function start(){
	document.location = "../profile/?new=true";
	window.localStorage.set("autosave","");
}

// Resume an old case session
function resume(){
	document.location = "../profile/?new=false";
}
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

var caseFiles, firstNameInput, lastNameInput, emailInput;

// Load the current case's info if found (If not found return to title)
document.addEventListener('DOMContentLoaded', function() {
	
	// Make sure there is a current case
	if(!localStorage['caseFiles'])
		document.location = "../";
	caseFiles = localStorage['caseFiles'];
	
	// Check the query for if new profile or old
	if(document.location.search.substr(document.location.search.indexOf("new=")+"new=".length, 4)=='true'){
		
		// Update the title
		document.getElementById("title").innerHTML = "Enter "+document.getElementById("title").innerHTML;
		document.title = document.getElementById("title").innerHTML;
		
		// Create the inputs for first, last, and email
		firstNameInput = document.createElement("input");
		document.getElementById("first-name").appendChild(firstNameInput);
		lastNameInput = document.createElement("input");
		document.getElementById("last-name").appendChild(lastNameInput);
		emailInput = document.getElementById("input-email");
		
		// Make it so that proceed is disabled until all three inputs have values
		var checkProceed = function(){
			var proceedButton = document.getElementById("proceed-button");
			if(firstNameInput.value=="" ||
				lastNameInput.value=="" ||
				emailInput.value=="")
				proceedButton.disabled = true;
			else
				proceedButton.disabled = false;
		};
		firstNameInput.addEventListener('change', checkProceed);
		lastNameInput.addEventListener('change', checkProceed);
		emailInput.addEventListener('change', checkProceed);
		checkProceed();
		
	}
	else{
		
		// Load the case's current save
		window.resolveLocalFileSystemURL(caseFiles+'active/saveFile.ipardata', function(fileEntry) {
			fileEntry.file(function(file) {
				
				var reader = new FileReader();
				reader.onloadend = function() {

					// Get the case
					var curCase = getDoc(this.result).getElementsByTagName("case")[0];
					
					// Update the title
					document.getElementById("title").innerHTML = "Confirm "+document.getElementById("title").innerHTML;
					document.title = document.getElementById("title").innerHTML;
					
					// Hide the email and display the current name
					document.getElementById("email").style.display = 'none';
					var firstName = document.getElementById("first-name");
					firstName.innerHTML = curCase.getAttribute("profileFirst");
					firstName.style.fontWeight = 'bold';
					var lastName = document.getElementById("last-name");
					lastName.innerHTML = curCase.getAttribute("profileLast");
					lastName.style.fontWeight = 'bold';
					
				};
				reader.readAsText(file);
			   
			}, function(e){
				console.log("Error: "+e.message);
			});
		});
		
	}
});

function displayCase(xml){
	
	// Get the case name and description from the xml
	var curCase = xmlDoc.getElementsByTagName("case")[0];
	document.getElementById("title").innerHTML = curCase.getAttribute("caseName");
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
	document.location = "../case/";
}

// Start the current case (Saving the input if any)
function proceed(){
	// If input save it
	if(firstNameInput!=null){
		
		// Disable the buttons to stop from multiple clicks
		document.getElementById("back-button").disabled = true;
		document.getElementById("proceed-button").disabled = true;
		
		// Get the current save file to overwrite with new data
		window.resolveLocalFileSystemURL(caseFiles+'active/saveFile.ipardata', function(fileEntry) {
			fileEntry.file(function(file) {
				
				var reader = new FileReader();
				reader.onloadend = function() {

					// Get the xml and change the profile values
					var xml = getDoc(this.result);
					var curCase = xml.getElementsByTagName("case")[0];
					curCase.setAttribute("caseStatus", "1");
					curCase.setAttribute("profileFirst", firstNameInput.value);
					curCase.setAttribute("profileLast", lastNameInput.value);
					curCase.setAttribute("profileMail", emailInput.value);
					var xmlFinal = new XMLSerializer().serializeToString(xml);
					
					// Write the result back to file
					fileEntry.createWriter(function(fileWriter) {
						
						// Write the new xml and load the current board
						fileWriter.write(new Blob([xmlFinal], {type : 'text/xml'}));
						document.location = "../board/";
						
				    }, function(e){
						console.log("Error: "+e.message);
					});
					
				};
				reader.readAsText(file);
			   
			}, function(e){
				console.log("Error: "+e.message);
			});
		});
	}
	else{
		// Load the board
		document.location = "../board/";
	}
}
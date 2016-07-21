
// HTML
var section;

// Parts of the html
var loadInput, loadButton, demoButton, continueButton, menuButton;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, BOARD: 1, CASE: 2});

function TitleMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the load button and input
	loadInput = document.querySelector('#'+section.id+' #load-input');
	loadButton = document.querySelector('#'+section.id+' #load-button');
	demoButton = document.querySelector('#'+section.id+' #demo-button');
	continueButton = document.querySelector('#'+section.id+' #continue-button');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	demoButton.onclick = this.demo.bind(this);
	loadButton.onclick = loadInput.click.bind(loadInput);
	loadInput.addEventListener('change', this.loadFile.bind(this), false);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "../index.html";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Setup continue button based on local stoarge
	if(localStorage['caseData'])
		continueButton.disabled = false;
	else
		continueButton.disabled = true;
	this.next = NEXT.BOARD;
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Set the button to not disabled in case coming back to this menu
	loadButton.disabled = false;
	loadInput.disabled = false;
	demoButton.disabled = false;
	menuButton.disabled = false;
	
}

p.demo = function(){

	if(localStorage['caseData'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
		
	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	demoButton.disabled = true;
	continueButton.disabled = true;
	menuButton.disabled = true;
	
	var page = this;
	var request = new XMLHttpRequest();
	request.responseType = "arraybuffer";
	request.onreadystatechange = function() {
	  if (request.readyState == 4 && request.status == 200) {
		  	
		 	// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
			localStorage.setItem("autosave","");
			localStorage['caseName'] = "demo.iparw";
			
			// Create a worker for unzipping the file
			var zipWorker = new Worker("../lib/unzip.js");
			zipWorker.onmessage = function(message) {
				
				// Save the base url to local storage
				localStorage['caseData'] = JSON.stringify(message.data);
				
				// call the callback
				page.next = NEXT.BOARD;
				page.close();
			}
			
			// Start the worker
			zipWorker.postMessage(request.response);
	  }
	};
	request.open("GET", "demo.iparw", true);
	request.send();
	
}

p.loadFile = function(event){
	
	if(localStorage['caseData'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
	
	// Make sure a ipar file was choosen
	if(!loadInput.value.endsWith("iparw")){
		if(loadInput.value.endsWith("ipar"))
			alert("That is an old version of a case file! You can use the converter on the main menu to change it to an iparw file to use in the web ipar!");
		else
			alert("You didn't choose an iparw file! you can only load iparw files!");
		return;
	}
	localStorage['caseName'] = event.target.files[0].name;

	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	demoButton.disabled = true;
	continueButton.disabled = true;
	menuButton.disabled = true;
	
	// Create a reader and read the zip
	var page = this;
	var reader = new FileReader();
	reader.onload = function(event){
	
		// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
		localStorage.setItem("autosave","");
		
		// Create a worker for unzipping the file
		var zipWorker = new Worker("../lib/unzip.js");
		zipWorker.onmessage = function(message) {
			
			// Save the base url to local storage
			localStorage['caseData'] = JSON.stringify(message.data);
			
			// Redirect to the next page
			page.next = NEXT.CASE;
			page.close();
			
		}
		
		// Start the worker
		zipWorker.postMessage(event.target.result);
		
	};
	reader.readAsArrayBuffer(event.target.files[0]);
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = TitleMenu;
module.exports.NEXT = NEXT;
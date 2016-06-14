
// HTML
var section;

// Parts of the html
var loadInput, loadButton, createButton, continueButton, menuButton;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, BOARD: 1, CREATE: 2});

function TitleMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the load button and input
	loadInput = document.querySelector('#'+section.id+' #load-input');
	loadButton = document.querySelector('#'+section.id+' #load-button');
	createButton = document.querySelector('#'+section.id+' #create-button');
	continueButton = document.querySelector('#'+section.id+' #continue-button');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	createButton.onclick = this.create.bind(this);
	loadButton.onclick = function(){
		if(localStorage['caseDataCreate'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
			return;
		loadInput.click.bind(loadInput);
	}
	loadInput.addEventListener('change', this.loadFile.bind(this), false);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "../index.html";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Setup continue button based on local stoarge
	if(localStorage['caseDataCreate'])
		continueButton.disabled = false;
	else
		continueButton.disabled = true;
	this.next = NEXT.BOARD;
	
	// Set the button to not disabled in case coming back to this menu
	loadButton.disabled = false;
	loadInput.disabled = false;
	menuButton.disabled = false;
	
}

p.create = function(){

	if(localStorage['caseDataCreate'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
	
	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	createButton.disabled = true;
	continueButton.disabled = true;
	continueButton.disabled = true;
	
	var page = this;
	var request = new XMLHttpRequest();
	request.responseType = "arraybuffer";
	request.onreadystatechange = function() {
	  if (request.readyState == 4 && request.status == 200) {
		  	
			// Create a worker for unzipping the file
			var zipWorker = new Worker("../lib/unzip.js");
			zipWorker.onmessage = function(message) {
				
				// Save the base url to local storage
				localStorage['caseDataCreate'] = JSON.stringify(message.data);
				
				// go to the next page
				page.next = NEXT.CREATE;
				page.close();
			}
			
			// Start the worker
			zipWorker.postMessage(request.response);
	  }
	};
	request.open("GET", "base.ipar", true);
	request.send();
	
}

p.loadFile = function(event){
	
	// Make sure a ipar file was choosen
	if(!loadInput.value.endsWith("ipar")){
		alert("You didn't choose an ipar file! you can only load ipar files!");
		return;
	}
	localStorage['caseName'] = event.target.files[0].name;

	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	createButton.disabled = true;
	
	// Create a reader and read the zip
	var page = this;
	var reader = new FileReader();
	reader.onload = function(event){
	
		// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
		localStorage.setItem("autosave","");
		
		// Create a worker for unzipping the file
		var zipWorker = new Worker("lib/unzip.js");
		zipWorker.onmessage = function(message) {
			
			// Save the base url to local storage
			localStorage['caseDataCreate'] = JSON.stringify(message.data);
			
			// Redirect to the next page
			page.next = NEXT.BOARD;
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
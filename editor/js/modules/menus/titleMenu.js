var Utilities = require('../helper/utilities.js');

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
	loadButton.onclick = loadInput.click.bind(loadInput);
	loadInput.onchange = this.loadFile.bind(this);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "../index.html";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Setup continue button based on local stoarge
	localforage.getItem('caseName').then(function(caseName){
		if(caseName)
			continueButton.disabled = false;
		else
			continueButton.disabled = true;
	});
	this.next = NEXT.BOARD;
	
	// Set the button to not disabled in case coming back to this menu
	loadButton.disabled = false;
	loadInput.disabled = false;
	menuButton.disabled = false;
	createButton.disabled = false;
	
}

p.create = function(){

	var page = this;
	localforage.getItem('caseName').then(function(caseName){
		if(!caseName || confirm("Are you sure you want to start a new case? Your autosave data will be lost!")){
			page.next = NEXT.CREATE;
			page.close();
		}
	});
	
}

p.loadFile = function(event){
	
	var page = this;
	localforage.getItem('caseName').then(function(caseName){
		if(!caseName || confirm("Are you sure you want to start a new case? Your autosave data will be lost!")){
			// Make sure a ipar file was choosen
			if(!loadInput.value.endsWith("iparw")){
				if(loadInput.value.endsWith("ipar"))
					alert("That is an old version of a case file! You can use the converter on the main menu to change it to an iparw file to use in the web ipar!");
				else
					alert("You didn't choose an iparw file! you can only load iparw files!");
				return;
			}
			
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			menuButton.disabled = true;
			createButton.disabled = true;
			continueButton.disabled = true;
			
			var reader = new FileReader();
			reader.onload = function(event){
				Utilities.loadCaseData(caseName, event.target.result, function(){
					page.next = NEXT.BOARD;
					page.close();
				});
			};
			reader.readAsArrayBuffer(event.target.files[0]);
		}
	});
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = TitleMenu;
module.exports.NEXT = NEXT;
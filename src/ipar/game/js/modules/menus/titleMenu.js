var Utilities = require('../helper/utilities.js');

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
	loadInput.onchange = this.loadFile.bind(this);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "/";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Setup continue button based on local stoarge
	localforage.getItem('caseName').then(function(caseName){
		if(caseName)
			continueButton.disabled = false;
		else
			continueButton.disabled = true;
	});
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

	var page = this;
	localforage.getItem('caseName').then(function(caseName){
		if(!caseName || confirm("Are you sure you want to start a new case? Your autosave data will be lost!")){
			
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			demoButton.disabled = true;
			continueButton.disabled = true;
			menuButton.disabled = true;
			
			var request = new XMLHttpRequest();
			request.responseType = "arraybuffer";
			request.onreadystatechange = function() {
			  if (request.readyState == 4 && request.status == 200) {
				Utilities.loadCaseData('demo.iparw', request.response, function(){
					page.next = NEXT.BOARD;
					page.close();
				});
			  }
			};
			request.open("GET", "demo.iparw", true);
			request.send();
			
		}
	})
	
}

p.loadFile = function(event){
console.log("LOAD FILE");
	var page = this;
	localforage.getItem('caseName').then(function(caseName){
		if(!caseName || confirm("Are you sure you want to start a new case? Your autosave data will be lost!")){
	console.log("LOAD");
			// Make sure a ipar file was choosen
			if(!loadInput.value.match(/.*iparw$/)){
				if(loadInput.value.match(/.*ipar$/))
					alert("That is an old version of a case file! You can use the converter on the main menu to change it to an iparw file to use in the web ipar!");
				else
					alert("You didn't choose an iparw file! you can only load iparw files!");
				return;
			}
			var zipName = event.target.files[0].name;
	console.log("NAME");
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			demoButton.disabled = true;
			continueButton.disabled = true;
			menuButton.disabled = true;
			
			// Create a reader and read the zip
			var reader = new FileReader();
			reader.onload = function(event){console.log("ZIP");
				Utilities.loadCaseData(zipName, event.target.result, function(){console.log("UNZIP");
					page.next = NEXT.CASE;
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

var Utilities = require('./utilities.js');

// HTML
var section;

// Parts of the html
var loadInput, loadButton, menuButton;

function TitleMenu(pSection){
	section = pSection;
	
	// Get the load button and input
	loadInput = document.querySelector('#'+section.id+' #load-input');
	loadButton = document.querySelector('#'+section.id+' #load-button');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	loadButton.onclick = loadInput.click.bind(loadInput);
	loadInput.addEventListener('change', this.loadFile.bind(this), false);
	menuButton.onclick = function(){window.location.href = "../index.html";};
	
	// Display the section holding the menu
	section.style.display = '';
	
}

var p = TitleMenu.prototype;

p.loadFile = function(event){
	
	// Make sure a ipar file was choosen
	if(!loadInput.value.endsWith("iparsubmit")){
		alert("You didn't choose an iparsubmit file! you can only load iparsubmit files!");
		return;
	}

	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	menuButton.disabled = true;
	
	// Create a reader and read the zip
	var page = this;
	var reader = new FileReader();
	reader.onload = function(event){
		JSZip.loadAsync(event.target.result).then(function(zip){
			var done = false;
			page.loadData = {submissions: zip.filter(function (relativePath, file){
											return relativePath.match(/^submitted\\.*/i);
							})};
			// Save the case and save files as text
			zip.file('saveFile.ipardata').async("string").then(function(saveFile){
				page.loadData.saveFile = Utilities.getXml(saveFile);
				if(done)
					page.close();
				else
					done = true;
				
			});
			zip.file('caseFile.ipardata').async("string").then(function(caseFile){
				page.loadData.caseFile = Utilities.getXml(caseFile);
				if(done)
					page.close();
				else
					done = true;
			});
		});
		
	};
	reader.readAsArrayBuffer(event.target.files[0]);
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = TitleMenu;
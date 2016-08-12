var Utilities = require('../helper/utilities.js');

// HTML
var section;

// Parts of the html
var loadInput, loadButton, createButton, continueButton, convertButton, convertInput, menuButton;

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
	convertButton = document.querySelector('#'+section.id+' #convert-button');
	convertInput = document.querySelector('#'+section.id+' #convert-input');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	createButton.onclick = this.create.bind(this);
	loadButton.onclick = loadInput.click.bind(loadInput);
	loadInput.onchange = this.loadFile.bind(this);
	convertButton.onclick = convertInput.click.bind(convertInput);
	convertInput.onchange = this.convertFile.bind(this);
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
	convertButton.disabled = false;
	convertInput.disabled = false;
	
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
			if(!loadInput.value.match(/.*iparw$/)){
				if(loadInput.value.match(/.*ipar$/))
					alert("That is an old version of a case file! You can use the converter on the main menu to change it to an iparw file to use in the web ipar!");
				else
					alert("You didn't choose an iparw file! you can only load iparw files!");
				return;
			}
			
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			convertButton.disabled = true;
			convertInput.disabled = true;
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

p.convertFile = function(event){
	
	// Check for an ipar file
	if(convertInput.files.length!=1 || !convertInput.files[0].name.match(/.*\.ipar$/)){
		alert("You must select an IPAR file to convert!");
		return;
	}
	
	// Check if they want to confirm
	if(!confirm("Are you sure you want to convert this case file? You will lose all save data current inside it!"))
		return;
	
	// Disable all buttons while converting
	loadButton.disabled = true;
	loadInput.disabled = true;
	convertButton.disabled = true;
	convertInput.disabled = true;
	menuButton.disabled = true;
	createButton.disabled = true;
	continueButton.disabled = true;
	
	// Read the ipar file
	var reader = new FileReader();
	reader.onload = function(){

		// Unzip the ipar file
		JSZip.loadAsync(reader.result).then(function(zip){
			
			// Function and variables used to keep track of async methods
			var data = {};
			var totalCB = 1, curCB = 0;
			var finishedCB = function(){
				if(++curCB>=totalCB){
					
					// Update the case with the links and clear the save file
					var curCase = data.caseFile.getElementsByTagName('case')[0];
					if(Number(curCase.getAttribute('version'))>=1){
						alert("Can only convert case's from before version 1!");
						return;
					}
					curCase.setAttribute('version', '1.0');
					var resources = curCase.getElementsByTagName('resourceList')[0].getElementsByTagName('resource');
					for(var i=0;i<resources.length;i++)
						if(Number(resources[i].getAttribute("type"))==0)
							resources[i].setAttribute('link', data.resourceLinks[resources[i].getAttribute('link')]);
					var questions = curCase.getElementsByTagName('button');
					for(var i=0;i<questions.length;i++)
						questions[i].setAttribute('imageLink', data.imageLinks[questions[i].getAttribute('imageLink').replace(/\//g, "\\")]);
					data.saveFile.getElementsByTagName('questions')[0].innerHTML = '';
					data.saveFile.getElementsByTagName('case')[0].setAttribute('caseStatus', 0);
					
					// Create the zip file and download it
					var zip = new JSZip();
					zip.file("caseFile.ipardata", new XMLSerializer().serializeToString(data.caseFile));
					zip.file("saveFile.ipardata", new XMLSerializer().serializeToString(data.saveFile));
					zip.folder("submitted");
					zip.generateAsync({type:"base64"}).then(function (base64) {
						var a = document.createElement("a");
						a.style.display = 'none';
						a.href = "data:application/zip;base64," + base64;
						a.download = convertInput.files[0].name+'w';
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
						window.location.reload();
					});
					
				}
			}

			// Get the case file
			totalCB++;
			zip.file('case\\active\\caseFile.ipardata').async("string").then(function(caseFile){
				data.caseFile = Utilities.getXml(caseFile);
				finishedCB();
			});
			  
			// Get the save file
			totalCB++;
			zip.file('case\\active\\saveFile.ipardata').async("string").then(function(saveFile){
				data.saveFile = Utilities.getXml(saveFile);
				finishedCB();
			});
				  
			// Upload and save all the images
			var images = zip.folder("case\\assets\\images");
			data.imageLinks = {};
			for (var file in images.files){
				if (!images.files.hasOwnProperty(file) || file.match(/.*\/$/) || file.substr(0, file.lastIndexOf("\\"))!=images.root.substr(0, images.root.length-1)) continue;
				totalCB++;
				(function(file){
					zip.file(file).async("arraybuffer").then(function(fileData){
						
						var imageData = new FormData();
						imageData.append('image', new Blob([fileData], {type: getMimeType(file)}), file.substring(file.lastIndexOf("\\")+1));
						var request = new XMLHttpRequest();
						request.onreadystatechange = function() {
							if (request.readyState == 4 && request.status == 200) {
								if(request.responseText.match(/^!.*$/)){
									console.log(request.responseText.substr(1));
									data.imageLinks[file.substring(file.indexOf("\\")+1)] = window.location.href.substr(0, window.location.href.lastIndexOf("editor/")-1)+"/image/default.png";
								}
								else
									data.imageLinks[file.substring(file.indexOf("\\")+1)] = window.location.href.substr(0, window.location.href.lastIndexOf("editor/")-1)+"/image/"+request.responseText;
				    			finishedCB();
							}
						};
						request.open("POST", "image.php", true);
						request.send(imageData);
						
						});
				})(file);
			}
		  
			// Upload and save all the resources
			var resources = zip.folder("case\\assets\\files");
			data.resourceLinks = {};
			for (var file in resources.files){
				if (!resources.files.hasOwnProperty(file) || file.match(/.*\/$/) || file.substr(0, file.lastIndexOf("\\"))!=resources.root.substr(0, resources.root.length-1)) continue;
				totalCB++;
				(function(file){
					zip.file(file).async("arraybuffer").then(function(fileData){
						
						var resourceData = new FormData();
						resourceData.append('resource', new Blob([fileData], {type: getMimeType(file)}), file.substring(file.lastIndexOf("/")+1));
						var request = new XMLHttpRequest();
						request.onreadystatechange = function() {
							if (request.readyState == 4 && request.status == 200) {
								data.resourceLinks[file.substring(file.lastIndexOf("\\")+1)] = window.location.href.substr(0, window.location.href.lastIndexOf("editor/")-1)+"/resource/"+request.responseText;
				    			finishedCB();
							}
						};
						request.open("POST", "resource.php", true);
						request.send(resourceData);
						
						});
				})(file);
			}
			
			finishedCB();
			  
		});		
	};
	reader.readAsArrayBuffer(convertInput.files[0]);
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = TitleMenu;
module.exports.NEXT = NEXT;
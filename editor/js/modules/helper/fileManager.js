"use strict";
var Category = require("../case/category.js");
var Resource = require("../case/resources.js");
var Utilities = require('./utilities.js');
var Parser = require('./iparDataParser.js');

// Module export
var m = module.exports;

// ********************** LOADING ************************

// load the file entry and parse the xml
m.loadCase = function(windowDiv, callback) {
    
	// Get the xml data
    localforage.getItem('caseFile').then(function(caseFile){
    	var xmlData = Utilities.getXml(caseFile);

    	// Get the save data
    	localforage.getItem('saveFile').then(function(saveFile){
			var saveData = Utilities.getXml(saveFile);
			var resources = Parser.getResources(xmlData);
	    	var categories = Parser.getCategoriesAndQuestions(xmlData, saveData, resources, windowDiv);
	    	

	    	var images = [];
	    	for(var i=0;i<categories.length;i++)
	    		for(var j=0;j<categories[i].questions.length;j++)
	    			if(images.indexOf(categories[i].questions[j].imageLink)==-1)
	    				images.push(categories[i].questions[j].imageLink);
	    	
			// alert user if there is an error
			if (!saveData) { alert ("ERROR no save data found, or save data was unreadable"); return; }
			// progress
			var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
			
			// parse the save data if not new
			if(stage>0){
				localforage.getItem('submitted').then(function(submitted){
					for(var file in submitted){
						if (!submitted.hasOwnProperty(file)) continue;
						file = file.substr(file.lastIndexOf("/")+1);
						var cat = file.indexOf("-"),
							que = file.indexOf("-", cat+1),
							fil = file.indexOf("-", que+1);
						categories[Number(file.substr(0, cat))].
							questions[Number(file.substr(cat+1, que-cat-1))].
							files[Number(file.substr(que+1, fil-que-1))] = 
								file.substr(file.indexOfAt("-", 3)+1);
					}
					Parser.assignQuestionStates(categories, saveData.getElementsByTagName("question"));
					callback(categories, resources, images, stage-1);
				});
			}
			else
				callback(categories, resources, images, 0);
			
    	});	   
    });
	
}
					 
// ********************** SAVING ************************

/* here's the general outline of what is happening:
selectSaveLocation was the old way of doing things
now we use createZip
 - when this whole thing starts, we request a file system and save all the entries (directories and files) to the allEntries variable
 - then we get the blobs using readAsBinaryString and store those in an array when we are saving 
  - - could do that on page load to save time later..?
 - anyway, then we - in theory - take the blobs and use zip.file(entry.name, blob) to recreate the structure
 - and finally we download the zip with download()
 
*/

// called when the game is loaded, add onclick to save button that actually does the saving
m.prepareZip = function(saveButton) {
	//var content = zip.generate();
	
	
	// code from JSZip site
	if (JSZip.support.blob) {
		
		// link download to click
		saveButton.onclick = function(){ m.saveIPAR(false); };
  	}
}

// create IPAR file and download it
m.saveIPAR = function(submit) {
	
	var zip = new JSZip();
	var done = 0;
	var zipped = function(){
		if(++done>=4){
			zip.generateAsync({type:"blob"}).then(function (blob) {
				localforage.getItem('caseName').then(function(caseName){
					if(submit)
						caseName += "submit";
					saveAs(blob, caseName);
				});
			});
		}
	}
	
	localforage.getItem('caseFile').then(function(caseFile){
		zip.file("caseFile.ipardata", caseFile);
		zipped();
	});
	localforage.getItem('saveFile').then(function(saveFile){
		zip.file("saveFile.ipardata", saveFile);
		zipped();
	});
	localforage.getItem('submitted').then(function(submitted){
		var subFolder = zip.folder('submitted');
		for (var file in submitted) {
			if (!submitted.hasOwnProperty(file)) continue;
			subFolder.file(file, submitted[file]);
		}
		zipped();
	});
	zipped();
	
}

/***************** CACHING *******************/

m.removeFilesFor = function(submitted, toRemove){

	var questionData = toRemove.board+"-"+toRemove.question+"-";
	for(var file in submitted){
		if (!submitted.hasOwnProperty(file) || !file.startsWith(questionData)) continue;
		delete submitted[file];
	}
	
}

// Adds a submitted file to the local stoarge
m.addNewFilesToSystem = function(submitted, toStore, callback){

	// Used for callback
	var totalCB = 1, curCB = 0;
	var finished = function(){
		if(++curCB>=totalCB){
			callback(submitted);
		}
	}
	
	for(var i=0;i<toStore.files.length;i++){
		(function(){
			var fileReader = new FileReader();
			var filename = toStore.board+"-"+toStore.question+"-"+i+"-"+toStore.files[i].name;
			totalCB++;
			submitted[filename] =  toStore.files[i];
			finished();
		})();
	}
	
	finished();
}
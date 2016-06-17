"use strict";
var Category = require("../case/category.js");
var Resource = require("../case/resources.js");
var Utilities = require('./utilities.js');
var Parser = require('./iparDataParser.js');

// Module export
var m = module.exports;

// ********************** LOADING ************************

// load the file entry and parse the xml
m.loadCase = function(caseData, windowDiv) {
    
    this.categories = [];
    this.questions = [];
	
	// Get the xml data
	var xmlData = Utilities.getXml(caseData.caseFile);
	var resources = Parser.getResources(xmlData);
	var categories = Parser.getCategoriesAndQuestions(xmlData, resources, windowDiv);
	var images = [];
	for(var i=0;i<categories.length;i++)
		for(var j=0;j<categories[i].questions.length;j++)
			if(images.indexOf(categories[i].questions[j].imageLink)==-1)
				images.push(categories[i].questions[j].imageLink);
	
	// load the most recent progress from saveFile.ipardata
	var questions = [];
    
	// Get the save data
	var saveData = Utilities.getXml(caseData.saveFile);
	// alert user if there is an error
	if (!saveData) { alert ("ERROR no save data found, or save data was unreadable"); return; }
	// progress
	var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
	
	// parse the save data if not new
	if(stage>0){
		for(var file in caseData.submitted){
			if (!caseData.submitted.hasOwnProperty(file)) continue;
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
	}
	else
		stage = 1;
	
	// return results
	return {categories: categories, category:stage-1, resources:resources, images:images}; // maybe stage + 1 would be better because they are not zero indexed?
			   
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
	
	//console.log("prepare zip");
	
	// code from JSZip site
	if (JSZip.support.blob) {
		//console.log("supports blob");
		
		// link download to click
		saveButton.onclick = saveIPAR;
  	}
}

// create IPAR file and download it
function saveIPAR() {
	
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	
	var zip = new JSZip();
	zip.file("caseFile.ipardata", caseData.caseFile);
	zip.file("saveFile.ipardata", caseData.saveFile);
	var submitted = zip.folder('submitted');
	for (var file in caseData.submitted) {
		if (!caseData.submitted.hasOwnProperty(file)) continue;
		var start = caseData.submitted[file].indexOf("base64,")+"base64,".length;
		submitted.file(file, caseData.submitted[file].substr(start), {base64: true});
	}

	
	zip.generateAsync({type:"base64"}).then(function (base64) {
		var a = document.createElement("a");
		a.style.display = 'none';
		a.href = "data:application/zip;base64," + base64;
		a.download = localStorage['caseName'];
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	});
	
}

/***************** CACHING *******************/

m.removeFilesFor = function(caseData, toRemove){

	var questionData = toRemove.board+"-"+toRemove.question+"-";
	for(var file in caseData.submitted){
		if (!caseData.submitted.hasOwnProperty(file) || !file.startsWith(questionData)) continue;
		delete caseData.submitted[file];
	}
	
}

// Adds a submitted file to the local stoarge
m.addNewFilesToSystem = function(caseData, toStore, callback){

	// Used for callback
	var totalCB = 1, curCB = 0;
	var finished = function(){
		if(++curCB>=totalCB){
			callback(caseData);
		}
	}
	
	for(var i=0;i<toStore.files.length;i++){
		(function(){
			var fileReader = new FileReader();
			var filename = toStore.board+"-"+toStore.question+"-"+i+"-"+toStore.files[i].name;
			totalCB++;
			fileReader.onload = function (event) {
				caseData.submitted[filename] =  event.target.result;
				finished();
		    };
		    fileReader.readAsDataURL(toStore.files[i]);
		})();
	}
	
	finished();
}
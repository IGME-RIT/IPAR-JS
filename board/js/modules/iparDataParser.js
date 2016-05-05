"use strict";
var Category = require("./category.js");
var Resource = require("./resources.js");
var Utilities = require('./utilities.js');
var Constants = require('./constants.js');
var Question = require('./question.js');
var QuestionWindows = require('./questionWindows.js');
window.resolveLocalFileSystemURL  = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

// Parses the xml case files
// ----------------------------
// known tags
/*
answer
button
categoryList
connections
element
feedback
instructions
resource
resourceList
resourceIndex
softwareList
question
questionText
qustionName
*/

// conversion
var stateConverter = {
	"hidden" : Question.SOLVE_STATE.HIDDEN,
	"unsolved" :  Question.SOLVE_STATE.UNSOLVED,
	"correct" :  Question.SOLVE_STATE.SOLVED
}
// conversion
var reverseStateConverter = ["hidden", "unsolved", "correct"];

// Module export
var m = module.exports;

// stores an array of all the files for rezipping
var allEntries;

// 						LOADING
// *****************************************************

// load the file entry and parse the xml
m.parseData = function(url, windowDiv, callback) {
    
    this.categories = [];
    this.questions = [];
    
    // Load the question windows first
    var windows = new QuestionWindows(function(){
    	// get XML
        window.resolveLocalFileSystemURL(url+'active/caseFile.ipardata', function(fileEntry) {
    		fileEntry.file(function(file) {
    			var reader = new FileReader();
    			
    			// hook up callback
    			reader.onloadend = function() {

    				// Get the raw data
    				var rawData = Utilities.getXml(this.result);
    				var categories = getCategoriesAndQuestions(rawData, url, windowDiv, windows);
    				// load the most recent version
    				var autosave = localStorage.getItem("autosave");
    				if (autosave) {
    					loadAutosave(autosave, categories, callback);
    				} else {
    					loadSaveProgress(categories, url, windowDiv, callback);
    				}
    				// prepare for saving by reading the files right when the program starts
    			    window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024, recursivelyReadFiles, errorHandler);
    			};
    			reader.readAsText(file);
    		   
    		}, function(e){
    			console.log("Error: "+e.message);
    		});
    	});
    });
}

// load the save from the filesytem sandbox
function loadSaveProgress(categories, url, windowDiv, callback) {
    var questions = [];
    
	// get XML
    window.resolveLocalFileSystemURL(url+'active/saveFile.ipardata', function(fileEntry) {
		fileEntry.file(function(file) {
			var reader = new FileReader();
			
			// hook up callback
			reader.onloadend = function() {

				// Get the save data
				var saveData = Utilities.getXml(this.result);
				assignQuestionStates(categories, saveData.getElementsByTagName("question"));
				var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
				callback(categories, stage); // maybe stage + 1 would be better because they are not zero indexed?
			   
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
}

// load the save from the localStorage
function loadAutosave(autosave, categories, callback) {
	// Get the save data
	var saveData = Utilities.getXml(autosave);
	assignQuestionStates(categories, saveData.getElementsByTagName("question"));
	var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
	callback(categories, stage);
}

// set the question states
function assignQuestionStates(categories, questionElems) {
	console.log("qelems: " + questionElems.length);
	var tally = 0; // track total index in nested loop
	
	// all questions
	for (var i=0; i<categories.length; i++) {
		for (var j=0; j<categories[i].questions.length; j++, tally++) {
		
			// store question  for easy reference
			var q = categories[i].questions[j];
			
			// store tag for easy reference
			var qElem = questionElems[tally];
			
			// If position is less than zero don't load the question
			if(parseInt(qElem.getAttribute("positionPercentX"))<0 || 
					parseInt(qElem.getAttribute("positionPercentY"))<0)
				continue;
			
			// state
			q.currentState = stateConverter[qElem.getAttribute("questionState")];
			
			// justification
			if(q.justification)
				q.justification.value = qElem.getAttribute("justification");
			
			// Call correct answer if state is correct
			if(q.currentState==Question.SOLVE_STATE.SOLVED)
			  q.correctAnswer();
				
			// xpos
			q.positionPercentX = Utilities.map(parseInt(qElem.getAttribute("positionPercentX")), 0, 100, 0, Constants.boardSize.x);
			// ypos
			q.positionPercentY = Utilities.map(parseInt(qElem.getAttribute("positionPercentY")), 0, 100, 0, Constants.boardSize.y);
			
		}
	}
}

// takes the xml structure and fills in the data for the question object
function getCategoriesAndQuestions(rawData, url, windowDiv, windows) {
	// if there is a case file
	if (rawData != null) {
		
		// First load the resources
		var resourceElements = rawData.getElementsByTagName("resourceList")[0].getElementsByTagName("resource");
		var resources = [];
		for (var i=0; i<resourceElements.length; i++) {
			// Load each resource
			resources[i] = new Resource(resourceElements[i], url);
		}
		
		// Then load the categories
		var categoryElements = rawData.getElementsByTagName("category");
		var categoryNames = rawData.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
		var categories = [];
		for (var i=0; i<categoryElements.length; i++) {
			// Load each category (which loads each question)
			categories[i] = new Category(categoryNames[i].innerHTML, categoryElements[i], resources, url, windowDiv, windows);
		}
		return categories;
	}
	return null
}

//						 SAVING
// *******************************************************

// called when the game is loaded, add onclick to save button that actually does the saving
m.prepareZip = function(myBoards) {
	//var content = zip.generate();
	
	console.log("prepare zip");
	
	// code from JSZip site
	var blobLink = document.getElementById('blob');
	if (JSZip.support.blob) {
		console.log("supports blob");
		
		// link download to click
		blobLink.onclick = function() { saveIPAR(myBoards); };
  	}
}

// create IPAR file and download it
function saveIPAR(boards) {

	// error handling
	if (!allEntries) {
		alert("CANNOT SAVE: file data did not load"); return; 
	}
	// 1)
	// get the files that the user uploaded 
	var uploadedFiles = getAllSubmissions(boards);
	
	// 2)
	// create the case file like the one we loaded
	var caseFile = m.recreateCaseFile(boards);
	
	// 3) (ASYNC)
	// recreate the case file using FileSystem, then download it
	getAllContents(caseFile, uploadedFiles);
	
}

// creates a case file for zipping
m.recreateCaseFile = function(boards) {

	// create save file text
	var dataToSave = m.createXMLSaveFile(boards, true);
	
	console.log ("saveData.ipar data created");
	
	//if (callback) callback(dataToSave);
	return dataToSave;
	
}

// creates the xml
m.createXMLSaveFile = function(boards, includeNewline) {
	// newline
	var nl;
	includeNewline ? nl = "\n" : nl = "";
	// header
	var output = '<?xml version="1.0" encoding="utf-8"?>' + nl;
	// case data
	output += '<case categoryIndex="3" caseStatus="1" profileFirst="j" profileLast="j" profileMail="j">' + nl;
	// questions header
	output += '<questions>' + nl;
	
	// loop through questions
	for (var i=0; i<boards.length; i++) {
		for (var j=0; j<boards[i].lessonNodeArray.length; j++) {
			// shorthand
			var q = boards[i].lessonNodeArray[j].question;
			
			// tag start
			output += '<question ';
			
			// questionState
			output += 'questionState="' + reverseStateConverter[q.currentState] + '" ';
			// justification
			var newJustification = q.justification.value;
			var justification;
			newJustification ? justification = newJustification : justification = q.justificationString;
			output += 'justification="' + justification + '" ';
			// animated
			output += 'animated="' + (q.currentState == 2) + '" '; // might have to fix this later
			// linesTranced
			output += 'linesTraced="0" '; // might have to fix this too
			// revealBuffer
			output += 'revealBuffer="0" '; // and this
			// positionPercentX
			output += 'positionPercentX="' + Utilities.map(q.positionPercentX, 0, Constants.boardSize.x, 0, 100) + '" ';
			// positionPercentY
			output += 'positionPercentY="' + Utilities.map(q.positionPercentY, 0, Constants.boardSize.y, 0, 100) + '" ';
			
			// tag end
			output += '/>' + nl;
		}
	}
	output += "</questions>" + nl;
	output += "</case>" + nl;
	return output;
}

function createZip(data, blobs, names, subs) {
	console.log("create zip run");
	
	var zip = new JSZip();
	/*allEntries.forEach(function(fileEntry) {
		//zip.file(fileEntry.name,fileEntry
		if (fileEntry.isFile) {
			//console.log("blob " + getBlobFromFileEntry(fileEntry));
			zip.file(fileEntry.name,fileEntry
		}
	});*/
	// zip each file one by one
	blobs.forEach(function(blob,i) {
		zip.file(names[i],blob);
	});
	// zip submitted files
	subs.names.forEach(function(subName,i) {
		zip.file("case\\active\\submitted\\"+subName,subs.blobs[i]);
	});
	
	// backslashes per zip file protocol
	zip.file("case\\active\\saveFile.ipardata",data);
	// download the file
	download(zip);
}

function getAllSubmissions(boards) {
	var names = [];
	var blobs = [];
	
	// loop through questions
	for (var i=0; i<boards.length; i++) {
		for (var j=0; j<boards[i].lessonNodeArray.length; j++) {
			// shorthand
			var q = boards[i].lessonNodeArray[j].question;
			
			// add blobs to an array
			if (q.fileName && q.blob) {
				names.push(q.fileName);
				blobs.push(q.blob);
			}
		}
	}
	// return object 
	return {
		"names" : names,
		"blobs" : blobs
	}
}

function getAllContents(data, subs) {
	var blobs = [];
	var names = [];
	var fileCount = 0;
	allEntries.forEach(function(fileEntry) {
		//zip.file(fileEntry.name,fileEntry
		if (fileEntry.isFile) {
			fileCount++
			// Get a File object representing the file,
			// then use FileReader to read its contents.
			//console.log(fileEntry);
			fileEntry.file(function(file) {
			   var reader = new FileReader();

			   reader.onloadend = function(e) {
			   
			   		var arrayBufferView = new Uint8Array( this.result ); // fingers crossed
			   		//console.log(arrayBufferView);
			   		
					//console.log(this.result);
				 	blobs.push(arrayBufferView);
				 	names.push(fileEntry.fullPath.replace(new RegExp('\/','g'),'\\').substring(1));
				 	if (blobs.length == fileCount) {
				 		createZip(data,blobs,names,subs);
				 	}
			   };

			   reader.readAsArrayBuffer(file);
			}, errorHandler);
		}
	});
}

/* here's the general outline of what is happening:
selectSaveLocation was the old way of doing things
now we use createZip
 - when this whole thing starts, we request a file system and save all the entries (directories and files) to the allEntries variable
 - then we get the blobs using readAsBinaryString and store those in an array when we are saving 
  - - could do that on page load to save time later..?
 - anyway, then we - in theory - take the blobs and use zip.file(entry.name, blob) to recreate the structure
 - and finally we download the zip with download()
 
*/


/*function selectSaveLocation (data) {

	console.log("selectSaveLocation");

	// Make sure the need APIs are supported
	if(!window.File || !window.FileReader || !window.FileList || !window.Blob || !window.ArrayBuffer || !window.Worker){
		alert('The File APIs need to load files are not supported in this browser!');
		//document.getElementById("load-button").disabled = true;
	}
	else{
		console.log ("selectingSaveLocation");
	
		// Get the load button and input
		var loadInput = document.getElementById('load-input');

		// load input is hidden, so click it
		loadInput.click();
		
		// When load input file is chosen, load the file
		loadInput.addEventListener('change', function(event){
			
			// Make sure a ipar file was choosen
			if(!loadInput.value.endsWith("ipar")){
				alert("You didn't choose an ipar file! you can only load ipar files!");
				return;
			}
			
			// Save the zip file's name to local storage 
			// NOTE: this will overwrite the old name, 
			//    so if the user chooses a different file, this could lead to errors
			localStorage['caseName'] = loadInput.files[0].name;
			
			// Read the zip
			JSZip.loadAsync(loadInput.files[0])
			.then(function(zip) {
				// backslashes per zip file protocol
				zip.file("case\\active\\saveFile.ipardata",data);
				// download the file
				download(zip);
			});

			//reader.readAsArrayBuffer(event.target.files[0]);
			
		}, false);
	}
}*/

function download(zip) {
	console.log("downloading");
	console.log(zip.generateAsync);
	
	var content = zip.generateAsync({type:"blob"}).then(
	function (blob) {
		//console.log(blob);
		//saveAs(blob, "hello.zip");
		//var url = window.URL.createObjectURL(blob);
		//window.location.assign(url);
		
		
		
		var a = document.createElement("a");
		
		a.innerHTML = localStorage['caseName'];
		
		a.setAttribute("class","downloadLink");
		
		a.href = window.URL.createObjectURL(blob);
		
		a.download = localStorage["caseName"];
		
		
		var showLink = false;
		// if you show the link, the user can download to a location of their choice
		if (showLink) {
			document.body.appendChild(a);
		// if you hide the link, it will simply go to their downloads folder
		} else {
			a.click(); //download immediately
		}
		
		

	}, function (err) {
		blobLink.innerHTML += " " + err;
	});
}

/************* READ FILES **************/



function errorHandler() {
	//do nothing
	console.log("yo we got errors");
}

// helper function for recursivelyReadFiles
function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function recursivelyReadFiles(fs) {
	console.log("recursivelyReadFiles called");

  var dirReader = fs.root.createReader();
  var entries = [];

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function(reader) {
     reader.readEntries (function(results) {
      if (!results.length) {
        // all entries found
        saveEntries(entries);
      } else {
      	var resultsArray = toArray(results)
        entries = entries.concat(resultsArray);
        for (var i=0; i<resultsArray.length; i++) {
        	//console.log("is directory ? " + resultsArray[i].isDirectory);
        	if (resultsArray[i].isDirectory) {
        		//directoryString += resultsArray[i].
        		var recursiveReader = resultsArray[i].createReader();
        		readEntries(recursiveReader);
        	} else {
        		
        	}
        }
        //nameStructure = {};
        readEntries(reader);
      }
    }, errorHandler);
  };
  
  

  readEntries(dirReader); // Start reading dirs.

}

function saveEntries(entries, callback) {
	allEntries = entries;
	//console.log(allEntries);
	if (callback) callback();
}
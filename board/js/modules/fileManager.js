"use strict";
var Category = require("./category.js");
var Resource = require("./resources.js");
var Utilities = require('./utilities.js');
var Constants = require('./constants.js');
var Parser = require('./iparDataParser.js');
var QuestionWindows = require('./questionWindows.js');
window.resolveLocalFileSystemURL  = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

// Module export
var m = module.exports;

var baseURL = localStorage['caseFiles'];

var fileSystem = null;

var baseDir = null;

var boardsReference = null;

var addFileData = { filename: "", blob: "", callback: undefined};

// stores an array of all the files for rezipping
var allEntries;

// ********************** LOADING ************************

// load the file entry and parse the xml
m.loadCase = function(url, windowDiv, callback) {
    
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
    				var categories = Parser.getCategoriesAndQuestions(rawData, url, windowDiv, windows);
    				// load the most recent version
    				var autosave = localStorage.getItem("autosave");
    				if (autosave) {
    					loadAutosave(autosave, categories, callback);
    				} else {
    					loadSaveProgress(categories, url, windowDiv, callback);
    				}
    				
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
				// parse the save data
				Parser.assignQuestionStates(categories, saveData.getElementsByTagName("question"));
				// progress
				var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
				// callback with results
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
	Parser.assignQuestionStates(categories, saveData.getElementsByTagName("question"));
	var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
	callback(categories, stage);
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

	// store in module scope for reference in callback
	boardsReference = boards;

	// prepare for saving by loading the files into memory first
    window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024, saveStage1, errorHandler);
	
}

// this is a callback that takes 1 argument and 
// then passes multiple arguments to the useful callback function 
function saveStage1(fs) {
	recursivelyReadFiles(fs, saveStage2);
}

// this is a callback that takes 1 argument and 
// then passes multiple arguments to the useful callback function 
function saveStage2() {
	console.log("ss2 run");

	// error handling: check if the save data loaded
	if (!allEntries) {
		alert("CANNOT SAVE: file data did not load"); return; 
	}
	// 1)
	// get the files that the user uploaded 
	var uploadedFiles = getAllSubmissions(boardsReference);
	
	// 2)
	// create the case file like the one we loaded
	var caseFile = Parser.recreateCaseFile(boardsReference);
	
	// 3) (ASYNC)
	// recreate the IPAR file using FileSystem, then download it
	getAllContents(caseFile, uploadedFiles);
}

function createZip(data, blobs, names, subs) {
	console.log("create zip run");
	
	var zip = new JSZip();

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
	// return submissions object 
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

// Loads all the files by recursively calling readEntries 
//  on DirectoryEntries in the FileSystem 
// Uses helper functions to determine when it is finished
//  since the callbacks do not return in order
function recursivelyReadFiles(fs, callback) {
	
	console.log("recursivelyReadFiles called");
	
	var dirReader = fs.root.createReader();
	var entries = [];
	
	// all entries found
	RunOnAllFilesLoaded(saveEntries, entries);
	if (callback) RunOnAllFilesLoaded(callback);
	
	fileSystem = fs;

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function(reader) {
     reader.readEntries (function(results) {
		  if (!results.length) {
			// done here
			DequeueLoaded(entries);
		  } else {
			var resultsArray = toArray(results)
			entries = entries.concat(resultsArray);
			for (var i=0; i<resultsArray.length; i++) {
				//console.log("is directory ? " + resultsArray[i].isDirectory);
				if (resultsArray[i].isDirectory) {
					//directoryString += resultsArray[i].
					var recursiveReader = resultsArray[i].createReader();
					QueueLoaded();
					readEntries(recursiveReader);
				}
			}
			//nameStructure = {};
			//QueueLoaded();
			readEntries(reader);
		  }
    }, errorHandler);
  };

  QueueLoaded();
  readEntries(dirReader); // Start reading dirs.

}

// adds functions and arguments to be called when all files are loaded
var onLoadedFunctions = [];
function RunOnAllFilesLoaded(callback, arg1) {
	onLoadedFunctions.push(callback);
}

// add another level to wait for
var recursionLevelsQueued = 0;
function QueueLoaded() {
	recursionLevelsQueued++;
	console.log("added, queue: "+recursionLevelsQueued);
}

// this level is done, remove it from the queue
function DequeueLoaded(entries) {
	recursionLevelsQueued--;
	// if this is the last recursive call to come in
	if (recursionLevelsQueued == 0) {
		// run all the functions
		onLoadedFunctions.forEach(function(f,i) {
			console.log("running callback "+i);
			f(entries);
		});
	}
	console.log("subtracted, queue: "+recursionLevelsQueued);
}

function saveEntries(entries) {
	allEntries = entries;
	console.log(allEntries);
}

/***************** CACHING *******************/

m.addFileToSystem = function(filename, data, callback){

	console.log("fs: " + fileSystem.root);
	
	if (!fileSystem) {
		retrieveFileSystem(function() { m.addFileToSystem(filename, data, callback); });
		return;
	}
	
	// Make sure the dir exists first
	var dirs = filename.substr(0, filename.lastIndexOf('\\')).split('\\');
	var curDir = fileSystem.root;
	for(var i=0;i<dirs.length;i++) {
		console.log(curDir.getDirectory(dirs[i])); 
		curDir = curDir.getDirectory(dirs[i], {create: true, exclusive: false});
	}
	
	// Make sure not working with an empty directory
	if(filename.endsWith('\\'))
		return;

	
	// Create the file
	var file = curDir.getFile(filename.substr(filename.lastIndexOf('\\')+1), {create: true});
	//file.createWriter().write(new Blob([data], {type: getMimeType(filename)}));
	// data is a blob in this case
	file.createWriter().write(data);
	
	// Return the url to the file
	if (callback) callback( file.toURL() );
}

// Filename must be the full desired path for this to work
//  otherwise the function it will assume that the file is a submission
m.addNewFileToSystem = function(filename, data, callback){
	// if the path uses backslashes
	if (filename.indexOf("\\") > -1) {
		filename = Utilities.replaceAll(filename,"\\","/");
	}

	// if there is no path, assume submission
	if (filename.indexOf("/") < 0) filename = "case/active/submitted/"+filename;
	
	// store the data in an module-scope object so that all of the callback functions can make use of it
	addFileData.filename = filename;
	addFileData.data = data;
	addFileData.callback = callback;
	
	// debug
	//console.log("addFileToSystem("+filename+", "+data+", "+callback+")");
	//retrieveBaseDir(function(dir) { addFileToDir(filename, dir, callback); } );
	
	// find the directoryEntry that will contain the file and call addFileToDir with the result
	retrieveBottomDir(addFileToDir);
}

// gets the directory of interest
function retrieveBottomDir(callback) {
	//window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024, function(fs) { setFileSystem(fs, callback); }, errorHandler);
	console.log("base URL: " + baseURL);
	var name = addFileData.filename;
	// extract the path of the directory to put the file in from the file name
	var extension = name.substring(0,name.lastIndexOf("/"));
	// "case" is already part of the base url
	if (extension.indexOf("case/") > -1) {
		extension = extension.substring(5);
	}
	
	// debug
	console.log("ext: " + extension);
	
	// get the directory entry from the filesystem callback
	window.resolveLocalFileSystemURL(baseURL+extension, callback);
}

// add the file
function addFileToDir(dir) {

	// shorthand
	var filename = addFileData.filename;
	
	// debug
	console.log("addFileToDir("+filename+", "+dir+")");
	
	// relic from legacy code
	var curDir = dir;
	
	// debug
	console.log("curdir: "  + curDir.name);
	
	// Make sure not working with an empty directory
	if(filename.endsWith('\\'))
		return;

	// Create the file
	var file = curDir.getFile(filename.substr(filename.lastIndexOf('/')+1), {create: true}, createWriter);
	
	
	//var file = curDir.getFile(filename, {create: true}, createWriter); // function(fileEntry) { writeFile(fileEntry, callback); });
	/*console.log(file);
	//file.createWriter().write(new Blob([data], {type: getMimeType(filename)}));
	// data is a blob in this case
	file.createWriter().write(data);
	
	// Return the url to the file
	if (callback) callback( file.toURL() );

	callback( file.toURL() );*/
}

function createWriter(file) {
	console.log(file);
	file.createWriter(writeFile);
}

function writeFile(fileWriter) {
	console.log(fileWriter);
	fileWriter.onwriteend = function (e) { console.log("write completed"); }
	fileWriter.onerror = function (e) { console.log("writer error: " + e.toString()); }
	//fileWriter.write(new Blob([addFileData.data], {type: getMimeType(addFileData.filename)}));
	
	var blob = addFileData.data;
	// check for plain text and convert
	if ( !(blob instanceof Blob) ) {
		blob = new Blob([blob], {type : 'text/plain'});
	}
	
	// data must be a blob to use this function	
	fileWriter.write(blob);
	
	// Return the url to the file
	if (addFileData.callback) callback( file.toURL() );
}

function setBase(entry, callback) {
	baseDir = entry;
	callback();
}

function loadFileSystem(type, size, curCase){
	// Load the file system
	fileSystem = self.requestFileSystemSync(type, size);
	
	// Write the files
	var urls = {};
	for (var file in curCase.files) {
		if (!curCase.files.hasOwnProperty(file)) continue;
		urls[file] = addFileToSystem(file, curCase.file(file).asArrayBuffer(), fileSystem);
	}
	
	// return the urls to the files
	return JSON.stringify(urls);
}

function getMimeType(file){
	switch(file.substr(file.lastIndexOf('.')+1)){
		case 'png':
			return 'image/png';
		case 'jpeg':
		case 'jpg':
			return 'image/jpeg';
		case 'pdf':
			return 'application/pdf';
		case 'docx':
		case 'doc':
			return 'application/msword';
		case 'rtf':
			return 'text/richtext';
		case 'ipardata':
			return 'text/xml';
		default:
			return 'text/plain';
	}
}


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
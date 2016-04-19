"use strict";
var Category = require("./category.js");
var Resource = require("./resources.js");
var Utilities = require('./utilities.js');
var Question = require('./question.js');
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

// Module export
var m = module.exports;

// constructor
m.parseData = function(url, windowDiv, callback) {
    
    this.categories = [];
    this.questions = [];
    
	// get XML
    window.resolveLocalFileSystemURL(url+'active/caseFile.ipardata', function(fileEntry) {
		fileEntry.file(function(file) {
			var reader = new FileReader();
			
			// hook up callback
			reader.onloadend = function() {

				// Get the raw data
				var rawData = Utilities.getXml(this.result);
				var categories = getCategoriesAndQuestions(rawData, url, windowDiv);
				loadSaveProgress(categories, url, windowDiv, callback);
			   
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
}

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
				callback(categories);
			   
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
}

function assignQuestionStates(categories, questionElems) {
	console.log(questionElems);
	
	var tally = 0; // track total index in nested loop
	
	// all questions
	for (var i=0; i<categories.length; i++) {
		for (var j=0; j<categories[i].questions.length; j++) {
		
			// store question  for easy reference
			var q = categories[i].questions[j];
			
			// store tag for easy reference
			var qElem = questionElems[tally];
			
			q.currentState = stateConverter[qElem.getAttribute("questionState")];
			
			tally++;
		}
	}
}

// takes the xml structure and fills in the data for the question object
function getCategoriesAndQuestions(rawData, url, windowDiv) {
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
			categories[i] = new Category(categoryNames[i].innerHTML, categoryElements[i], resources, url, windowDiv);
		}
		return categories;
	}
	return null
}
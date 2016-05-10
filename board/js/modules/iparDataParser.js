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

var firstName = "unassigned";
var lastName = "unassigned";
var email = "email";

// Module export
var m = module.exports;
				
// ********************** LOADING ************************

// set the question states
m.assignQuestionStates = function(categories, questionElems) {
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
m.getCategoriesAndQuestions = function(rawData, url, windowDiv, windows) {
	// if there is a case file
	if (rawData != null) {
		
		// Get player data 
		firstName = rawData.getElementsByTagName("case")[0].getAttribute("profileFirst");
		lastName = rawData.getElementsByTagName("case")[0].getAttribute("profileLast");
		rawData.getElementsByTagName("case")[0].getAttribute("profileMail");
		
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
	output += '<case categoryIndex="3" caseStatus="1" profileFirst="'+ firstName +'" profileLast="' + lastName + '" profileMail="'+ email +'">' + nl;
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
			output += 'positionPercentX="' + Utilities.map(q.positionPercentX - boards[i].lessonNodeArray[j].width/2, 0, Constants.boardSize.x, 0, 100) + '" ';
			// positionPercentY
			output += 'positionPercentY="' + Utilities.map(q.positionPercentY - boards[i].lessonNodeArray[j].height/2, 0, Constants.boardSize.y, 0, 100) + '" ';
			
			// tag end
			output += '/>' + nl;
		}
	}
	output += "</questions>" + nl;
	output += "</case>" + nl;
	return output;
}

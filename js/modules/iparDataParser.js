"use strict"

var Question = require("./question.js");

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

// the xml structure that stores the data
var caseFile;

// constructor
function iparDataParser() {
	this.parser = new DOMParser();
}

var p = iparDataParser.prototype;

p.parser = {};

// creates data structure in case file variable, takes url argument
p.createCaseFile = function(url, callback) {
	//													console.log("loading "+url);
	// get XML
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    	//												console.log("readystate " + xhr.readyState);
    	if (xhr.readyState == 4 && xhr.status == 200) {
    		//											console.log(xhr.response);
    		caseFile = xhr.responseXML;
    		callback(caseFile);
    		//											console.log(caseFile.getElementsByTagName("resource")[0].getAttribute("text"));
		}
    }
    xhr.open("GET",url, true);
    xhr.send();
}

// getter
p.getCaseFile = function() {
	return caseFile;
}

// takes the xml structure and fills in the data for the question object
p.getQuestionsArray = function() {
	// if there is a case file
	if (caseFile != null) {
		// buttons are the top-level element for the questions
		var questionElements = caseFile.getElementsByTagName("button");
		var questions = [];
		// create questions
		for (var i=0; i<questionElements.length; i++) 
		{
			// fill question
			
			// create a question object
			questions[i] = new Question();
			
			// correct answer number
			questions[i].correctAnswer = questionElements[i].getAttribute("correctAnswer");
			
			// question text
			questions[i].questionText = questionElements[i].getElementsByTagName("questionText")[0].textContent;
			
			// get an array of answers
			var answers = questionElements[i].getElementsByTagName("answer");
			// initialize question's answerText property
			questions[i].answerText = [];
			// loop through and add answer's textContent
			for (var j=0; j<answers.length; j++) {
				questions[i].answerText.push(answers[j].textContent);
			}
			
			// get an array of feedback
			var feedback = questionElements[i].getElementsByTagName("feedback");
			// initialize question's feedbackText property
			questions[i].feedbackText = [];
			// loop through and add answer's textContent
			for (var j=0; j<answers.length; j++) {
				questions[i].feedbackText.push(feedback[j].textContent);
			}
			
			// correct answer number
			
			// image link
			questions[i].imageLink = questionElements[i].getAttribute("imageLink");
			// alter image link string for new file structure
			questions[i].imageLink = "./images/"+ ( questions[i].imageLink.replace("assets/images/","") );
			
			//console.log("answer text: "+questions[i].answerText);
			//console.log("Correct answer for question "+(i+1)+": "+questions[i].correctAnswer); debug
			
		}
		return questions;
	}
	return null
}

module.exports = iparDataParser;
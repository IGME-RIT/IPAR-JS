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
var rawData;

// constructor
function iparDataParser(url, callback) {
    this.categories = [];
    this.questions = [];
    
	// get XML
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        rawData = xhr.responseXML;
        this.categories = p.getCategoriesAndQuestions();
        //callback(this.questions); instead of returning the questions, return the 
        callback(this.categories);
    }
    xhr.open("GET", url, true);
    xhr.send();
}

var p = iparDataParser.prototype;

// takes the xml structure and fills in the data for the question object
p.getCategoriesAndQuestions = function() {
	// if there is a case file
	if (rawData != null) {
		var categoryElements = rawData.getElementsByTagName("category");
		var categories = [];
		for (var h=0; h<categoryElements.length; h++) {
			// buttons are the top-level element for the questions
			var questionElements = categoryElements[h].getElementsByTagName("button");
			var questions = [];
			// create questions
			for (var i=0; i<questionElements.length; i++) 
			{
				// fill question
				/* question needs these things:
				index;             //int
				correctAnswer;     //int
				questionText;      //string
				questionType	   //int
				answerText;        //string array
				feedbackText;      //string array
				imageLink;         //string
				connections;       //string array
				instructions;      //string
				resources;         //resourceItem
				revealThreshold;   //int
	
				justification;     //string
				fileSubmitCount;   //int
				animated;          //bool
				linesTraced;       //int
				revealBuffer;      //int
				*/
				// create a question object
				questions[i] = new Question();
			
				// index (may not exhibit expected behavior)
				questions[i].index = i;
                
                //positionPercentX
                questions[i].positionPercentX = questionElements[i].getAttribute("xPositionPercent")*9;
                
                //positionPercentY
                questions[i].positionPercentY = questionElements[i].getAttribute("yPositionPercent")*8;
			
				// correct answer number
				questions[i].correctAnswer = questionElements[i].getAttribute("correctAnswer");
			
				// q type
				questions[i].questionType = questionElements[i].getAttribute("questionType");
			
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
				// loop through and add feedback's textContent
				for (var j=0; j<feedback.length; j++) {
					questions[i].feedbackText.push(feedback[j].textContent);
				}
			
				// image link
				questions[i].imageLink = questionElements[i].getAttribute("imageLink");
				// alter image link string for new file structure
				questions[i].imageLink = questions[i].imageLink.replace("assets",".").replace("software/","");
			
				// connections
				questions[i].connections = [];
				var connectionElems = questionElements[i].getElementsByTagName("connections");
				for (var j=0; j<connectionElems.length; j++) {
					var connectionElem = connectionElems[j];
					if (connectionElem) questions[i].connections.push(connectionElem.textContent);
				}
			
				// instructions
				questions[i].instructions = questionElements[i].getElementsByTagName("instructions")[0].textContent;
			
				// get an array of resources
				var resources = questionElements[i].getElementsByTagName("resource");
				// initialize question's resources property
				questions[i].resources = [];
				// loop through and add resources's textContent
				for (var j=0; j<resources.length; j++) {
					questions[i].resources.push(resources[j].textContent);
				}
			
				// reveal threshold
				questions[i].revealThreshold = questionElements[i].getAttribute("revealThreshold");
			
				// justification
			
				// fileSubmitCount
			
				// animated
			
				// linesTraced
			
				// revealBuffer
			
				// DEBUG
				//console.log("answer text: "+questions[i].answerText);
				//console.log("Correct answer for question "+(i+1)+": "+questions[i].correctAnswer); 
			
			}
			categories[h] = {};
			categories[h].questions = questions;
			categories[h].numQuestions = questions.length;
		}
		return categories;
	}
	return null
}

module.exports = iparDataParser;
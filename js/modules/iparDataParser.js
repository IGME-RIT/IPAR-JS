"use strict"

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

// get questions
p.getQuestionsArray = function() {
	// if there is a case file
	if (caseFile != null) {
		return caseFile.getElementsByTagName("button");
	}
}

module.exports = iparDataParser;
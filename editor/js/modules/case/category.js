"use strict";
var Question = require("./question.js");

// Creates a category with the given name and from the given xml
function Category(name, xml, resources, windowDiv){
	
	// Save the name
	this.name = name;
	
	// Load all the questions
	var questionElements = xml.getElementsByTagName("button");
	this.questions = [];
	// create questions
	for (var i=0; i<questionElements.length; i++) 
	{
		// create a question object
		this.questions[i] = new Question(questionElements[i], resources, windowDiv, i);
	}
    
}

var p = Category.prototype;

p.xml = function(xmlDoc, catDes){
	var xml = xmlDoc.createElement("category");
	xml.setAttribute("categoryDesignation", catDes);
	xml.setAttribute("questionCount", this.questions.length);
	for (var i=0; i<this.questions.length; i++) 
		xml.appendChild(this.questions[i].xml);
	return xml;
}

module.exports = Category;
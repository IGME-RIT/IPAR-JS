"use strict";
var Utilities = require('../helper/utilities.js');
var Constants = require('../game/constants.js');
var Windows = require('../html/questionWindows.js');

var SOLVE_STATE = Object.freeze({HIDDEN: 0, UNSOLVED: 1, SOLVED: 2});
var QUESTION_TYPE = Object.freeze({JUSTIFICATION: 1, MULTIPLE_CHOICE: 2, SHORT_RESPONSE: 3, FILE: 4, MESSAGE: 5});

/* Question properties:
currentState: SOLVE_STATE
windowDiv: element
correct: int
positionPercentX: float
positionPercentY: float
revealThreshold: int
imageLink: string
feedbacks: string[]
connectionElements: element[]
connections: int[]
questionType: SOLVE_STATE
justification: string
wrongAnswer: string
correctAnswer: string
*/
//parameter is a point that denotes starting position
function Question(xml, resources, windowDiv, num){
	
	// Set the current state to default at hidden and store the window div
    this.currentState = SOLVE_STATE.HIDDEN;
    this.windowDiv = windowDiv;
    this.num = num;

    // Get and save the given index, correct answer, position, reveal threshold, image link, feedback, and connections
    this.correct = parseInt(xml.getAttribute("correctAnswer"));
    this.positionPercentX = Utilities.map(parseInt(xml.getAttribute("xPositionPercent")), 0, 100, 0, Constants.boardSize.x);
    this.positionPercentY = Utilities.map(parseInt(xml.getAttribute("yPositionPercent")), 0, 100, 0, Constants.boardSize.y);
    this.revealThreshold = parseInt(xml.getAttribute("revealThreshold"));
    this.imageLink = xml.getAttribute("imageLink");
    this.feedbacks = xml.getElementsByTagName("feedback");
    var scale = xml.getAttribute("scale");
    if(scale==="" || !scale)
    	this.scale = 1;
    else
    	this.scale = Number(scale);
    this.newFiles = false;
    this.files = [];
    var connectionElements = xml.getElementsByTagName("connections");
    this.connections = [];
    for(var i=0;i<connectionElements.length;i++)
    	this.connections[i] = parseInt(connectionElements[i].innerXML());
    
    // Create the windows for this question based on the question type
    this.questionType = parseInt(xml.getAttribute("questionType"));
    this.justification = this.questionType==1 || this.questionType==3;
	if(this.questionType!=5){
		this.createTaskWindow(xml);
		this.createResourceWindow(xml, resources);
	}
	switch(this.questionType){
		case 5:
			this.createMessageWindow(xml);
			break;
		case 4:
			this.createFileWindow();
			break;
		case 3:
		case 2:
		case 1:
			this.createAnswerWindow(xml, this.questionType!=3);
			break;
	}
    
}

var p = Question.prototype;

p.showPrevSubmittedFiles = function(files) {
	// acknowledge submitted files in task window
	if(files.length>0)
		this.feedback.innerHTML = 'Submitted Files:<br/>';
	else
		this.feedback.innerHTML = '';
	for(var i=0;i<files;i++)
		this.feedback.innerHTML += '<span class="feedbackI">'+files[i].name+'</span><br/>';
}

p.wrongAnswer = function(num){
	
  // If feeback display it
	if(this.feedbacks.length>0)
		this.feedback.innerHTML = '"'+String.fromCharCode(num + "A".charCodeAt())+
											'" is not correct <br/>&nbsp;<span class="feedbackI">'+
											this.feedbacks[num].innerXML()+'</span><br/>';
	  var question = this;
	  if(this.taskContent)
		setTimeout(function(){question.taskContent.scrollTop = question.taskContent.scrollHeight}, 100);
}

p.correctAnswer = function(){
	
	// Disable all the answer buttons
	if(this.answers)
		for(var i=0;i<this.answers.length;i++)
			this.answers[i].disabled = true;
	
	// If feedback display it
	if(this.feedbacks[0])
		this.feedback.innerHTML = '"'+String.fromCharCode(this.correct + "A".charCodeAt())+
											'" is the correct response <br/><span class="feedbackI">'+
											this.feedbacks[this.correct].innerXML()+'</span><br/>';
	
	if(this.questionType===3 && this.justification.value != '')
		this.feedback.innerHTML = 'Submitted Text:<br/><span class="feedbackI">'+this.justification.value+'</span><br/>';
	if(this.questionType===1 && this.justification.value != '')
		this.feedback.innerHTML += 'Submitted Text:<br/><span class="feedbackI">'+this.justification.value+'</span><br/>';
	if(this.questionType===4){
		if(this.files.length>0)
			this.feedback.innerHTML = 'Submitted Files:<br/>';
		else
			this.feedback.innerHTML = '';
		for(var i=0;i<this.files.length;i++)
			this.feedback.innerHTML += '<span class="feedbackI">'+this.files[i]+'</span><br/>';
	}
  if(this.currentState!=SOLVE_STATE.SOLVED && 
     (((this.questionType===3 || this.questionType===1) && this.justification.value != '') ||
      (this.questionType===4 && this.fileInput.files.length>0) ||
       this.questionType===2)){ 
    // Set the state of the question to correct
    this.currentState = SOLVE_STATE.SOLVED;
    // if there is a proceed button
    if (this.proceedElement) { 
		this.proceedElement.style.display = "block"; // animate proceed button
	}
  }
  
  var question = this;
  if(this.taskContent)
	setTimeout(function(){question.taskContent.scrollTop = question.taskContent.scrollHeight}, 100);
	
}

p.displayWindows = function(){
	
	// Add the windows to the window div
	var windowNode = this.windowDiv;
	var exitButton = new Image();
	exitButton.src = "../img/iconClose.png";
	exitButton.className = "exit-button";
	var question = this;
	exitButton.onclick = function() { question.windowDiv.innerHTML = ''; };
	if(this.questionType===5){
		windowNode.appendChild(this.message);
	    exitButton.style.left = "75vw";
	}
	else{
		windowNode.appendChild(this.task);
		windowNode.appendChild(this.answer);
		windowNode.appendChild(this.resource);
		exitButton.style.left = "85vw";
	}
	if(this.currentState === SOLVE_STATE.SOLVED && this.questionType != QUESTION_TYPE.MESSAGE)  {
		// if there is a proceed button
		if (this.proceedElement) { 
			this.proceedElement.style.display = "block"; // animate proceed button
		}
	}
	
	windowNode.appendChild(exitButton);
	
}

p.createTaskWindow = function(xml){
	this.proceedElement = document.getElementById("proceedContainer");
	
	// Create the task window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.taskWindow;
    this.task = tempDiv.firstChild;
    this.task.innerHTML = this.task.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerXML().replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerXML().replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerXML().replace(/\n/g, '<br/>'));
    this.feedback = this.task.getElementsByClassName("feedback")[0];
    this.taskContent = this.task.getElementsByClassName("windowContent")[0];
}

p.createResourceWindow = function(xml, resourceFiles){
	
	// Create the resource window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourceWindow;
    this.resource = tempDiv.firstChild;
	
	// Get the template for individual resouces if any
	var resources = xml.getElementsByTagName("resourceIndex");
    if(resources.length > 0){
    	
    	// Get the html for each resource and then add the result to the window
    	var resourceHTML = '';
	    for(var i=0;i<resources.length;i++){
    		var curResource = Windows.resource.replace("%icon%", resourceFiles[parseInt(resources[i].innerXML())].icon);
	    	curResource = curResource.replace("%title%", resourceFiles[parseInt(resources[i].innerXML())].title);
	    	curResource = curResource.replace("%link%", resourceFiles[parseInt(resources[i].innerXML())].link);
	    	resourceHTML += curResource;
	    }
	  	this.resource.innerHTML = this.resource.innerHTML.replace("%resources%", resourceHTML);
		        
	}
	else{
		// Display that there aren't any resources
		this.resource.innerHTML = this.resource.innerHTML.replace("%resources%", "No resources have been provided for this task.");
		this.resource.getElementsByClassName("windowContent")[0].style.color = "grey";
		this.resource.getElementsByClassName("windowContent")[0].style.backgroundColor = "#FFFFFF";
		this.resource.getElementsByClassName("windowContent")[0].className += ", center";
	}
}

p.createAnswerWindow = function(xml, answers){
	
	// Create the answer window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.answerWindow;
    this.answer = tempDiv.firstChild;
    
    // Create the text element if any
    var question = this;
    var submit;
    if(this.justification){
    	this.justification = document.createElement("textarea");
    	this.justification.submit = document.createElement("button");
    	this.justification.submit.className = "answer submit";
    	this.justification.submit.innerHTML = "Submit";
        this.justification.submit.disabled = true;
        this.justification.submit.onclick = function() {
        	question.correctAnswer();
    	};
    	this.justification.addEventListener('input', function() {
    		if(question.justification.value.length > 0)
    			question.justification.submit.disabled = false;
    		else
    			question.justification.submit.disabled = true;
    	}, false);
    }
    
    // Create and get all the answer elements
    if(answers){
	    this.answers = [];
	    var answersXml = xml.getElementsByTagName("answer");
	    var correct = parseInt(xml.getAttribute("correctAnswer"));
	    for(var i=0;i<answersXml.length;i++){
	    	if(this.justification)
	    		this.justification.disabled = true;
	    	this.answers[i] = document.createElement("button");
	    	if(correct===i)
	    		this.answers[i].className = "answer correct";
	    	else
	    		this.answers[i].className = "answer wrong";
	    	this.answers[i].innerHTML = String.fromCharCode(i + "A".charCodeAt())+". "+answersXml[i].innerXML();
	    }
	    
	    // Create the events for the answers
	    for(var i=0;i<this.answers.length;i++){
		  if(this.answers[i].className == "answer wrong"){
			this.answers[i].num = i;
	        this.answers[i].onclick = function(){
	          this.disabled = true;
			  question.wrongAnswer(this.num);
		    };
	      }
	      else{
	    	this.answers[i].onclick = function(){
		      if(question.justification)
		        question.justification.disabled = false;
		      question.correctAnswer();
		    };
	      }
	    }
	    
	    // Add the answers to the window
	    for(var i=0;i<this.answers.length;i++)
	      this.answer.getElementsByClassName("windowContent")[0].appendChild(this.answers[i]);
    }
    
    if(this.justification){
    	this.answer.getElementsByClassName("windowContent")[0].appendChild(this.justification);
    	this.answer.getElementsByClassName("windowContent")[0].appendChild(this.justification.submit);
    }
}

p.createFileWindow = function(){
	
	// Create the file window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.fileWindow;
    this.answer = tempDiv.firstChild;
    this.fileInput = this.answer.getElementsByTagName("input")[0];
    var question = this;
    this.answer.getElementsByClassName("fileButton")[0].onclick = function(){
    	question.fileInput.click();
    }
    this.fileInput.addEventListener("change", function(event){
    	question.newFiles = true;
    	question.files = [];
    	for(var i=0;i<event.target.files.length;i++)
    		question.files[i] = event.target.files[i].name;
	    question.correctAnswer();
    });
    
}

p.createMessageWindow = function(xml){
	
	// Create the message window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.messageWindow;
    this.message = tempDiv.firstChild;
    this.message.innerHTML = this.message.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerXML().replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerXML().replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerXML().replace(/\n/g, '<br/>'));
    var question = this;
    this.message.getElementsByTagName("button")[0].onclick = function() {
    	question.currentState = SOLVE_STATE.SOLVED;
    	question.windowDiv.innerHTML = '';
    };

}

module.exports = Question;
module.exports.SOLVE_STATE = SOLVE_STATE;
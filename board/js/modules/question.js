"use strict";
var Utilities = require('./utilities.js');
var Constants = require('./constants.js');
var Windows = require('./questionWindows.js');

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
function Question(xml, resources, url, windowDiv){
	
	// Set the current state to default at hidden and store the window div
    this.currentState = SOLVE_STATE.HIDDEN;
    this.windowDiv = windowDiv;
    
    // Get and save the given index, correct answer, position, reveal threshold, image link, feedback, and connections
    this.correct = parseInt(xml.getAttribute("correctAnswer"));
    this.positionPercentX = Utilities.map(parseInt(xml.getAttribute("xPositionPercent")), 0, 100, 0, Constants.boardSize.x);
    this.positionPercentY = Utilities.map(parseInt(xml.getAttribute("yPositionPercent")), 0, 100, 0, Constants.boardSize.y);
    this.revealThreshold = parseInt(xml.getAttribute("revealThreshold"));
    //console.log(xml);
    this.imageLink = url+xml.getAttribute("imageLink");
    this.feedbacks = xml.getElementsByTagName("feedback");
    this.blob = null; // no upload by default
    this.fileName = "";
    var connectionElements = xml.getElementsByTagName("connections");
    this.connections = [];
    for(var i=0;i<connectionElements.length;i++)
    	this.connections[i] = parseInt(connectionElements[i].innerHTML);
    
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
			this.createAnswerWindow(xml);
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
											this.feedbacks[num].innerHTML+'</span><br/>';
	
}

p.correctAnswer = function(){
	
	// Disable all the answer buttons
	if(this.answers)
		for(var i=0;i<this.answers.length;i++)
			this.answers[i].disabled = true;
	
	// If feedback display it
	if(this.feedbacks.length>0)
		this.feedback.innerHTML = '"'+String.fromCharCode(this.correct + "A".charCodeAt())+
											'" is the correct response <br/><span class="feedbackI">'+
											this.feedbacks[this.correct].innerHTML+'</span><br/>';
	
	
	if(this.questionType===3 && this.justification.value != '')
		this.feedback.innerHTML = 'Submitted Text:<br/><span class="feedbackI">'+this.justification.value+'</span><br/>';
	
	if(this.questionType===1 && this.justification.value != '')
		this.feedback.innerHTML += 'Submitted Text:<br/><span class="feedbackI">'+this.justification.value+'</span><br/>';
	
	if(this.questionType===4){
		if(this.fileInput.files.length>0)
			this.feedback.innerHTML = 'Submitted Files:<br/>';
		else
			this.feedback.innerHTML = '';
		for(var i=0;i<this.fileInput.files.length;i++)
			this.feedback.innerHTML += '<span class="feedbackI">'+this.fileInput.files[i].name+'</span><br/>';
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
    this.task.innerHTML = this.task.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.feedback = this.task.getElementsByClassName("feedback")[0];
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
    		var curResource = Windows.resource.replace("%icon%", resourceFiles[parseInt(resources[i].innerHTML)].icon);
	    	curResource = curResource.replace("%title%", resourceFiles[parseInt(resources[i].innerHTML)].title);
	    	curResource = curResource.replace("%link%", resourceFiles[parseInt(resources[i].innerHTML)].link);
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

p.createAnswerWindow = function(xml){
	
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
    	this.justification.submit.className = "submit";
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
    this.answers = [];
    var answersXml = xml.getElementsByTagName("answer");
    var correct = parseInt(xml.getAttribute("correctAnswer"));
    for(var i=0;i<answersXml.length;i++){
    	if(this.justification)
    		this.justification.disabled = true;
    	this.answers[i] = document.createElement("button");
    	if(correct===i)
    		this.answers[i].className = "correct";
    	else
    		this.answers[i].className = "wrong";
    	this.answers[i].innerHTML = String.fromCharCode(i + "A".charCodeAt())+". "+answersXml[i].innerHTML;
    }
    
    // Create the events for the answers
    for(var i=0;i<this.answers.length;i++){
	  if(this.answers[i].className == "wrong"){
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
    this.fileInput.addEventListener("change", function(event){
    		// Make sure a valid file was chosen (currently not implemented)
			if(false){
				alert("You didn't choose an ipar file! you can only load ipar files!");
				return;
			}
			
			/*// Create a reader and read the zip
			var reader = new FileReader();
			reader.onload = function(event){
				console.log(event);
			};
			// read the first file
			reader.readAsArrayBuffer(event.target.files[0]);*/
			
			question.fileName = event.target.files[0].name;
			question.blob = event.target.files[0].slice();

			
	    question.correctAnswer();
    });
    
}

p.createMessageWindow = function(xml){
	
	// Create the message window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.messageWindow;
    this.message = tempDiv.firstChild;
    this.message.innerHTML = this.message.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));
    var question = this;
    this.message.getElementsByTagName("button")[0].onclick = function() {
    	question.currentState = SOLVE_STATE.SOLVED;
    	question.windowDiv.innerHTML = '';
    };

}

module.exports = Question;
module.exports.SOLVE_STATE = SOLVE_STATE;
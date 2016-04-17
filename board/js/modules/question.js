"use strict";
var Utilities = require('./utilities.js');
var Constants = require('./constants.js');

var SOLVE_STATE = Object.freeze({HIDDEN: 0, UNSOLVED: 1, SOLVED: 2});
var QUESTION_TYPE = Object.freeze({JUSTIFICATION: 1, MULTIPLE_CHOICE: 2, SHORT_RESPONSE: 3, FILE: 4, MESSAGE: 5});

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
    this.imageLink = url+xml.getAttribute("imageLink");
    this.feedbacks = xml.getElementsByTagName("feedback");
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

p.wrongAnswer = function(num){

  // If feeback display it
	if(this.feedbacks.length>0)
		this.feedback.innerHTML = '"'+String.fromCharCode(num + "A".charCodeAt())+
											'" is not correct <br/>&nbsp;<span class="feedbackI">'+
											this.feedbacks[num].innerHTML+'</span><br/>';
	
}

p.correctAnswer = function(){
	
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
	windowNode.appendChild(exitButton);
	
}

p.createTaskWindow = function(xml){
	
	// Get the template for task windows
	var question = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Create the task window 
	    	question.task = document.createElement("DIV");
	        question.task.className = "window";
	        question.task.style.top = "10vh";
	        question.task.style.left = "5vw";
	        question.task.innerHTML = request.responseText;
	        question.task.innerHTML = question.task.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
	        question.task.innerHTML = question.task.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
	        question.task.innerHTML = question.task.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));
	        question.feedback = question.task.getElementsByClassName("feedback")[0];
	    }
	}
	request.open("GET", "taskWindow.html", true);
	request.send();
}

p.createResourceWindow = function(xml, resourceFiles){
	
	// Get the template for resource windows
	var question = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Create the resource window 
	    	question.resource = document.createElement("DIV");
			question.resource.className = "window";
			question.resource.style.top = "55vh";
			question.resource.style.left = "5vw";
			question.resource.innerHTML = request.responseText;
	    	
	    	// Get the template for individual resouces if any
	    	var resources = xml.getElementsByTagName("resourceIndex");
		    if(resources.length > 0){
				var request2 = new XMLHttpRequest();
				request2.onreadystatechange = function() {
				    if (request2.readyState == 4 && request2.status == 200) {
				    	
				    	// Get the html for each resource and then add the result to the window
				    	var resourceHTML = '';
					    for(var i=0;i<resources.length;i++){
				    		var curResource = request2.responseText.replace("%icon%", resourceFiles[parseInt(resources[i].innerHTML)].icon);
					    	curResource = curResource.replace("%title%", resourceFiles[parseInt(resources[i].innerHTML)].title);
					    	curResource = curResource.replace("%link%", resourceFiles[parseInt(resources[i].innerHTML)].link);
					    	resourceHTML += curResource;
					    }
					  	question.resource.innerHTML = question.resource.innerHTML.replace("%resources%", resourceHTML);
				        
				    }
				}
				request2.open("GET", "resource.html", true);
				request2.send();
	    	}
	    	else{
	    		// Display that there aren't any resources
	    		question.resource.innerHTML = question.resource.innerHTML.replace("%resources%", "No resources have been provided for this task.");
	    		question.resource.getElementsByClassName("windowContent")[0].style.color = "grey";
	    		question.resource.getElementsByClassName("windowContent")[0].style.backgroundColor = "#FFFFFF";
	    		question.resource.getElementsByClassName("windowContent")[0].className += ", center";
	    	}
	        
	    }
	};
	request.open("GET", "resourceWindow.html", true);
	request.send();
}

p.createAnswerWindow = function(xml){
	
	// Get the template for answer windows
	var question = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Create the answer window 
	    	question.answer = document.createElement("DIV");
		    question.answer.className = "window";
		    question.answer.style.top = "10vh";
		    question.answer.style.left = "50vw";
		    question.answer.innerHTML = request.responseText;
	        
	        // Create the text element if any
	        var submit;
	        if(question.justification){
	        	question.justification = document.createElement("textarea");
	        	question.justification.submit = document.createElement("button");
	        	question.justification.submit.className = "submit";
	        	question.justification.submit.innerHTML = "Submit";
		        question.justification.submit.disabled = true;
		        question.justification.submit.onclick = function() {
		        	question.correctAnswer();
		    	}
		    	question.justification.addEventListener('input', function() {
		    		if(question.justification.value.length > 0)
		    			question.justification.submit.disabled = false;
		    		else
		    			question.justification.submit.disabled = true;
		    	}, false);
	        }
	        
	        // Create and get all the answer elements
	        var answers = [];
	        var answersXml = xml.getElementsByTagName("answer");
	        var correct = parseInt(xml.getAttribute("correctAnswer"));
	        for(var i=0;i<answersXml.length;i++){
	        	if(question.justification)
	        		question.justification.disabled = true;
	        	answers[i] = document.createElement("button");
	        	if(correct===i)
	        		answers[i].className = "correct";
	        	else
	        		answers[i].className = "wrong";
	        	answers[i].innerHTML = String.fromCharCode(i + "A".charCodeAt())+". "+answersXml[i].innerHTML;
	        }
	        
	        // Create the events for the answers
	        for(var i=0;i<answers.length;i++){
	        	if(answers[i].className == "wrong"){
	        		answers[i].num = i;
              answers[i].onclick = function(){
                this.disabled = true;
	        			question.wrongAnswer(this.num);
	        		};
	        	}
	        	else{
	        		answers[i].onclick = function(){
                for(var j=0;j<answers.length;j++)
                  answers[j].disabled = true;
                if(question.justification)
                  question.justification.disabled = false;
                  question.correctAnswer();
              };
	        	}
	        }
	        
	        // Add the answers to the window
          for(var i=0;i<answers.length;i++)
            question.answer.getElementsByClassName("windowContent")[0].appendChild(answers[i]);
	        if(question.justification){
	        	question.answer.getElementsByClassName("windowContent")[0].appendChild(question.justification);
	        	question.answer.getElementsByClassName("windowContent")[0].appendChild(question.justification.submit);
	        }
	    }
	}
	request.open("GET", "answerWindow.html", true);
	request.send();
}

p.createFileWindow = function(){
	
	// Get the template for file windows
	var question = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Create the file window 
	    	question.answer = document.createElement("DIV");
		    question.answer.className = "window";
		    question.answer.style.top = "10vh";
		    question.answer.style.left = "50vw";
		    question.answer.innerHTML = request.responseText;
		    question.fileInput = question.answer.getElementsByTagName("input")[0];
		    question.fileInput.onchange = function(){
			    question.correctAnswer();
	        };
	        
	    }
	}
	request.open("GET", "fileWindow.html", true);
	request.send();
}

p.createMessageWindow = function(xml){
	
	// Get the template for file windows
	var question = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Create the file window 
	    	question.message = document.createElement("DIV");
		    question.message.className = "window";
		    question.message.style.top = "10vh";
		    question.message.style.left = "40vw";
		    question.message.innerHTML = request.responseText;
		    question.message.innerHTML = question.message.innerHTML.replace("%title%", xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
		    question.message.innerHTML = question.message.innerHTML.replace("%instructions%", xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
		    question.message.innerHTML = question.message.innerHTML.replace("%question%", xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));
	        question.message.getElementsByTagName("button")[0].onclick = function() {
	        	question.currentState = SOLVE_STATE.SOLVED;
	        	question.windowDiv.innerHTML = '';
	        };

	    }
	}
	request.open("GET", "messageWindow.html", true);
	request.send();
}

module.exports = Question;
module.exports.SOLVE_STATE = SOLVE_STATE;
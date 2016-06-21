"use strict";
var Utilities = require('../helper/utilities.js');
var Constants = require('../game/constants.js');
var Windows = require('../html/questionWindows.js');
var Popup = require('../menus/popup.js');
var PopupWindows = require('../html/popupWindows.js');

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
    this.xml = xml;
    this.resources = resources;
    
    this.refresh();
    
}

var p = Question.prototype;

p.refresh = function() {

    // Get and save the given index, correct answer, position, reveal threshold, image link, feedback, and connections
    this.correct = parseInt(this.xml.getAttribute("correctAnswer"));
    this.positionPercentX = Number(this.xml.getAttribute("xPositionPercent"));
    this.positionPercentY = Number(this.xml.getAttribute("yPositionPercent"));
    this.revealThreshold = parseInt(this.xml.getAttribute("revealThreshold"));
    //console.log(xml);
    this.imageLink = this.xml.getAttribute("imageLink");
    this.feedbacks = this.xml.getElementsByTagName("feedback");
    var scale = this.xml.getAttribute("scale");
    if(scale==="" || !scale)
    	this.scale = 1;
    else
    	this.scale = Number(scale);
    this.save = false;
    var connectionElements = this.xml.getElementsByTagName("connections");
    this.connections = [];
    for(var i=0;i<connectionElements.length;i++)
    	this.connections[i] = parseInt(connectionElements[i].innerHTML);
    
    // Create the windows for this question based on the question type
    this.questionType = parseInt(this.xml.getAttribute("questionType"));
    this.createWindows();
	this.createTypeWindow();
}

p.saveXML = function(){
	this.xml.setAttribute("xPositionPercent", this.positionPercentX);
	this.xml.setAttribute("yPositionPercent", this.positionPercentY);
	this.xml.setAttribute("revealThreshold", this.revealThreshold);
	this.xml.setAttribute("scale", this.scale);
	this.xml.setAttribute("correctAnswer", this.correct);
	this.xml.setAttribute("questionType", this.questionType);
	var connectionElement = this.xml.getElementsByTagName("connections")[0];
	while(connectionElement!=null){
		this.xml.removeChild(connectionElement);
		connectionElement = this.xml.getElementsByTagName("connections")[0];
	}
	for(var i=0;i<this.connections.length;i++){
		var connection = this.xml.ownerDocument.createElement("connections");
		connection.innerHTML = this.connections[i];
		this.xml.appendChild(connection);
	}
}

p.createWindows = function(){
	this.justification = this.questionType==1 || this.questionType==3;
	if(this.questionType!=5){
		this.createTaskWindow();
		this.createResourceWindow(this.resources);
		if(this.questionType<=2)
			this.createAnswerWindow();
	}
	else
		this.createMessageWindow();
}

p.displayWindows = function(){
	
	// Add the windows to the window div
	this.windowDiv.innerHTML = '';
	var windowNode = this.windowDiv;
	var exitButton = new Image();
	exitButton.src = "../img/iconClose.png";
	exitButton.className = "exit-button";
	var question = this;
	exitButton.onclick = function() { question.windowDiv.innerHTML = ''; };
	
	if(this.questionType<=2){
		windowNode.appendChild(this.answer);
		this.typeWindow.className = "window left";
		this.task.className = "window left";
		this.resource.className = "window left";
		exitButton.style.right = "5vw";
	}
	
	windowNode.appendChild(this.typeWindow);
	if(this.questionType===5){
		windowNode.appendChild(this.message);
		exitButton.style.right = "25vw";
		this.typeWindow.className = "window";
	}
	else{
		if(this.questionType>2){
			this.typeWindow.className = "window";
			this.task.className = "window";
			this.resource.className = "window";
			exitButton.style.right = "25vw";
		}
		windowNode.appendChild(this.task);
		windowNode.appendChild(this.resource);
	}
	
	windowNode.appendChild(exitButton);
	
}

p.createTypeWindow = function(){
	
	// Create the task window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.questionTypeWindow;
    this.typeWindow = tempDiv.firstChild;
    
    this.typeWindow.getElementsByTagName("img")[0].src = this.imageLink;
    
    // Setup the image button
    var question = this;
    var button = this.typeWindow.getElementsByClassName("imageButton")[0];
    var icon = button.getElementsByTagName("img")[0];
    button.onclick = function(){
    	
    	question.windowDiv.innerHTML = '';
    	question.windowDiv.appendChild(question.imagesWindow);
        var buttons = question.imagesWindow.getElementsByTagName("button");
        var images = question.imagesWindow.getElementsByTagName("img");
        var input = question.imagesWindow.getElementsByTagName("input")[0];
        var imageContent = question.imagesWindow.getElementsByClassName("imageContent")[0];
        var close = function(){
        	buttons[0].onclick = function(){};
        	buttons[1].onclick = function(){};
        	for(var i =0;i<images.length;i++)
        		images[i].onclick = function(){};
        	question.displayWindows();
        }
        buttons[0].onclick = close;
        buttons[1].onclick = input.click.bind(input);
        buttons[2].onclick = function(){
        	Popup.prompt(question.windowDiv, "Select Image", "Image URL:", "", "Load Image", function(newImage){
        		if(newImage)
        			imageContent.innerHTML += PopupWindows.image.replace(/%image%/g, newImage);
        		close();
        		button.click();
        	});
        }
        for(var i=0;i<images.length;i+=2){
        (function(i){
        	images[i].onclick = function(){
        		question.imageLink = images[i].src;
    			question.xml.setAttribute("imageLink", images[i].src);
    			icon.src = images[i].src;
        		close();
        	}
        	images[i+1].onclick = function(){
        		if(confirm("Are you sure you want to remove this image from your data bank? This can not be undone!")){
        			var toRemove = question.imagesWindow.getElementsByClassName("image")[i/2];
        			toRemove.parentNode.removeChild(toRemove);
            		close();
            		button.click();
        		}
        	}
        })(i);
        }

        input.onchange = function(){
        	if(input.files.length>0 && input.files[0].type.match(/^image.*/)){
				for(var i=0;i<buttons.length;i++)
					buttons[i].disabled = true;
				var imageData = new FormData();
				imageData.append('image', input.files[0], input.files[0].name);
				var request = new XMLHttpRequest();
				request.onreadystatechange = function() {
					if (request.readyState == 4 && request.status == 200) {
						for(var i=0;i<buttons.length;i++)
							buttons[i].disabled = false;
						imageContent.innerHTML += PopupWindows.image.replace(/%image%/g, window.location.href.substr(0, window.location.href.substr(0, window.location.href.length-1).lastIndexOf("/"))+"/image/"+request.responseText);
		        		close();
		        		button.click();
					}
				};
				request.open("POST", "../image.php", true);
				request.send(imageData);
			}
        }
    	
    	
    }
    
    // Setup the combo box
    var typeCombo = this.typeWindow.getElementsByTagName("select")[0];
    typeCombo.value = this.questionType;
    typeCombo.onchange = function(){
    	question.questionType = Number(this.value);
    	question.createWindows();
		question.displayWindows();
    }
    
    // Setup the save button
    this.typeWindow.getElementsByClassName("windowButtons")[0].getElementsByTagName("button")[0].onclick = function(){
    	question.save = true;
    	question.windowDiv.innerHTML = '';
    }
}

p.createTaskWindow = function(){
	this.proceedElement = document.getElementById("proceedContainer");
	
	// Create the task window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.taskWindow;
    this.task = tempDiv.firstChild;
    this.task.innerHTML = this.task.innerHTML.replace("%title%", this.xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%instructions%", this.xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.task.innerHTML = this.task.innerHTML.replace("%question%", this.xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));
    
    // Setup to update xml on changing
    var textBoxes = this.task.getElementsByClassName("text-box");
    for(var i=0;i<textBoxes.length;i++)
    	textBoxes[i].onblur = this.updateXML.bind(this, textBoxes);
}

p.updateXML = function(textBoxes){
	this.xml.getElementsByTagName("questionName")[0].innerHTML = textBoxes[0].innerHTML;
	this.xml.getElementsByTagName("instructions")[0].innerHTML = textBoxes[1].innerHTML;
	this.xml.getElementsByTagName("questionText")[0].innerHTML = textBoxes[2].innerHTML;
}

p.createResourceWindow = function(resourceFiles){
	
	// Create the resource window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourceWindow;
    this.resource = tempDiv.firstChild;
    
    // Create the basic resources from save
	this.resourceDiv = this.resource.getElementsByClassName("resourceContent")[0];
	this.updateResources(resourceFiles);
    
    // Setup the add button
    var question = this;
    this.resource.getElementsByTagName("button")[0].onclick = function(){
    	resourceFiles.openWindow(question.windowDiv, true, function(selectedResource){
    		if(selectedResource!=null){
    			var newResource = question.xml.ownerDocument.createElement("resourceIndex");
    			newResource.innerHTML = selectedResource;
    			question.xml.appendChild(newResource);
    			question.updateResources(this);
    		}
    		question.displayWindows();
    	});
    }
}

p.updateResources = function(resourceFiles){
	
	var resources = this.xml.getElementsByTagName("resourceIndex");
	var question = this;
	
	if(resources.length==0){
		this.resourceDiv.color = "grey";
		this.resourceDiv.className = "resourceContent center";
		this.resourceDiv.innerHTML = "No resources have been added.";
	}else{
		this.resourceDiv.color = "";
		this.resourceDiv.className = "resourceContent";
		this.resourceDiv.innerHTML = '';
		var used = [];
		for(var i=0;i<resources.length;i++){
			    	
			    	if(used.indexOf(resources[i].innerHTML)==-1)
			    		used.push(resources[i].innerHTML);
			    	else{
			    		this.xml.removeChild(resources[i]);
			    		i = 0;
			    		resources = this.xml.getElementsByTagName("resourceIndex");
			    	}
		}
	    for(var i=0;i<resources.length;i++){
	    	
	    	// Create the current resource element
    		var curResource = Windows.resource.replace("%icon%", resourceFiles[parseInt(resources[i].innerHTML)].icon);
	    	curResource = curResource.replace("%title%", resourceFiles[parseInt(resources[i].innerHTML)].title);
	    	curResource = curResource.replace("%link%", resourceFiles[parseInt(resources[i].innerHTML)].link);
	    	var tempDiv = document.createElement("DIV");
	    	tempDiv.innerHTML = curResource;
	        curResource = tempDiv.firstChild;
	    	this.resourceDiv.appendChild(curResource);
	    	
	    	// Setup delete button
	    	(function(resourceXml){
	    		curResource.getElementsByClassName("delete")[0].onclick = function(){
	    			question.xml.removeChild(resourceXml);
	    			question.updateResources(resourceFiles);
	    		}
	    	})(resources[i]);
	    }
	}
}

p.createAnswerWindow = function(){
	
	// Create the answer window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.answerWindow;
    this.answer = tempDiv.firstChild;
    
    // Setup the combox for number of answers
    var question = this;
    this.answerForm = this.answer.getElementsByTagName("form")[0];
    var select = this.answer.getElementsByTagName("select")[0];
    select.onchange = function(){
    	question.setNumberAnswers(Number(this.value));
    }
    this.setNumberAnswers(Number(this.xml.getAttribute("numAnswers")));
    select.value = this.xml.getAttribute("numAnswers");
	this.answerForm.elements["answer"].value = this.correct+1;
	
	// Setup the from to update the xml
	this.answerForm.onchange = function(){

	    // Setup the radio buttons for the form if justification
		if(question.justification && Number(this.elements["answer"].value)-1!=question.correct){
			for(var i=0;i<this.elements.length;i++)
				this.elements[i].disabled = false;
			this.elements["feedback"+this.elements["answer"].value].disabled = true;
		}
		
		question.correct = Number(this.elements["answer"].value)-1;
		var answers = question.xml.getElementsByTagName("answer");
		var feedback = question.xml.getElementsByTagName("feedback");
		for(var i=0;i<answers.length;i++){
			answers[i].innerHTML = this.elements["answer"+(i+1)].value;
			feedback[i].innerHTML = this.elements["feedback"+(i+1)].value;
		}
	}
	this.correct = -1;
	this.answerForm.onchange();
	
    
}

p.setNumberAnswers = function(num){

    var answersXml = this.xml.getElementsByTagName("answer");
    var feedbackXml = this.xml.getElementsByTagName("feedback");
	var answers = this.answerForm.getElementsByTagName("div");
	for(var i=0;i<answers.length;i++){
		var inputs = answers[i].getElementsByTagName("input");
		answersXml[i].innerHTML = inputs[0].value;
		feedbackXml[i].innerHTML = inputs[1].value;
	}
	
	this.xml.setAttribute("numAnswers", num);
	
	if(answersXml.length<num){
		for(var i=answersXml.length;i<num;i++){
			this.xml.appendChild(this.xml.ownerDocument.createElement("answer"));
			this.xml.appendChild(this.xml.ownerDocument.createElement("feedback"));
		}
	}
	else if(answersXml.length>num){
		while(answersXml.length>num){
			this.xml.removeChild(answersXml[answersXml.length-1]);
			this.xml.removeChild(feedbackXml[feedbackXml.length-1]);
		    var feedbackXml = this.xml.getElementsByTagName("feedback");
			answersXml = this.xml.getElementsByTagName("answer");
		}
	}

	this.answerForm.innerHTML = '';
	for(var i=0;i<answersXml.length;i++)
		this.answerForm.innerHTML += Windows.answer.replace(/%num%/g, i+1).replace(/%answer%/g, answersXml[i].innerHTML).replace(/%feedback%/g, feedbackXml[i].innerHTML);
	if(this.correct<answersXml.length)
		this.answerForm.elements["answer"].value = this.correct+1;
	else{
		this.answerForm.elements["answer"].value = 1;
		this.correct=0;
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
    	question.newFiles = true;
    	question.files = [];
    	for(var i=0;i<event.target.files.length;i++)
    		question.files[i] = event.target.files[i].name;
	    question.correctAnswer();
    });
    
}

p.createMessageWindow = function(){
	
	// Create the message window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.messageWindow;
    this.message = tempDiv.firstChild;
    this.message.innerHTML = this.message.innerHTML.replace("%title%", this.xml.getElementsByTagName("questionName")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%instructions%", this.xml.getElementsByTagName("instructions")[0].innerHTML.replace(/\n/g, '<br/>'));
    this.message.innerHTML = this.message.innerHTML.replace("%question%", this.xml.getElementsByTagName("questionText")[0].innerHTML.replace(/\n/g, '<br/>'));

    // Setup to update xml on changing
    var textBoxes = this.message.getElementsByClassName("text-box");
    for(var i=0;i<textBoxes.length;i++)
    	textBoxes[i].onblur = this.updateXML.bind(this, textBoxes);

}

module.exports = Question;
module.exports.SOLVE_STATE = SOLVE_STATE;
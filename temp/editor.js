(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Game = require('./modules/game/game.js');
var Point = require('./modules/helper/point.js');
var Constants = require('./modules/game/constants.js');
var Utilities = require('./modules/helper/utilities.js');
var TitleMenu = require('./modules/menus/titleMenu.js');
var CreateMenu = require('./modules/menus/createMenu.js');

// The current game
var game;

// The section holding the board
var boardSection;

// The current page the website is on
var curPage;
var menus = [];
var PAGE = Object.freeze({TITLE: 0, CREATE: 1, BOARD: 2});

//fires when the window loads
window.onload = function(e){
	
	// Get the sections
	boardSection = document.getElementById("board");
	
	// Setup title menu
	menus[PAGE.TITLE] = new TitleMenu(document.getElementById("titleMenu"));
	menus[PAGE.TITLE].onclose = function(){
		switch(this.next){
		case TitleMenu.NEXT.BOARD:
			curPage = PAGE.BOARD;
			createCase();
			break;
		case TitleMenu.NEXT.CREATE:
			curPage = PAGE.CREATE;
			menus[curPage].open();
			break;
		}
	}
	

	// Setup create menu
	menus[PAGE.CREATE] = new CreateMenu(document.getElementById("createMenu"));
	menus[PAGE.CREATE].onclose = function(){
		switch(this.next){
		case CreateMenu.NEXT.BOARD:
			curPage = PAGE.BOARD;
			createCase();
			break;
		case CreateMenu.NEXT.TITLE:
			curPage = PAGE.TITLE;
			menus[curPage].open();
			break;
		}
	}
	
	// Open the title menu
    curPage = PAGE.TITLE;
    menus[PAGE.TITLE].open();
    
}

// create the game object and start the loop with a dt
function createCase(){
	// Show the section for the game
	boardSection.style.display = 'block';
	
    // Create the game
    game = new Game(document.getElementById("board"), Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
    
    // Start the game loop
    gameLoop(Date.now());
    
}

//fires once per frame for the game
function gameLoop(prevTime){
    
    // update game
    game.update(Date.now() - prevTime);
    
	// loop
    window.requestAnimationFrame(gameLoop.bind(this, Date.now()));
    
}

//listens for changes in size of window and scales the game accordingly
window.addEventListener("resize", function(e){
	
	// Scale the game to the new size
	if(curPage==PAGE.BOARD)
		game.setScale(Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
	
});

// Listen for touch for fullscreen while in game on mobile
window.addEventListener('touchstart', function(event){
	
	if(curPage==PAGE.BOARD && window.matchMedia("only screen and (max-width: 760px)"))
		document.documentElement.requestFullScreen();
	
}, false);

// Stop the default context menu from working
window.addEventListener("contextmenu", function(e){
	e.preventDefault();
});
},{"./modules/game/constants.js":6,"./modules/game/game.js":7,"./modules/helper/point.js":14,"./modules/helper/utilities.js":15,"./modules/menus/createMenu.js":18,"./modules/menus/titleMenu.js":20}],2:[function(require,module,exports){
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
},{"./question.js":3}],3:[function(require,module,exports){
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
},{"../game/constants.js":6,"../helper/utilities.js":15,"../html/popupWindows.js":16,"../html/questionWindows.js":17,"../menus/popup.js":19}],4:[function(require,module,exports){
"use strict";
var Windows = require('../html/popupWindows.js');
var Utilities = require('../helper/utilities.js');


// Creates a category with the given name and from the given xml
function Resource(xml){
	
	// First get the icon
	this.xml = xml;
	var type = parseInt(xml.getAttribute("type"));
	this.type = type;
	switch(type){
	  case 0:
	    this.icon = '../img/iconResourceFile.png';
	    break;
	  case 1:
	    this.icon = '../img/iconResourceLink.png';
	    break;
	  case 2:
    	this.icon = '../img/iconResourceVideo.png';
	    break;
	  default:
	    this.icon = '';
	    break;
	}

	// Next get the title
	this.title = xml.getAttribute("text");

	// Last get the link
	this.link = xml.getAttribute("link");
    
}

function Resources(resourceElements, doc){
	for (var i=0; i<resourceElements.length; i++) {
		// Load each resource
		this[i] = new Resource(resourceElements[i]);
	}
	this.length = resourceElements.length;
	this.doc = doc;
	
	// Create the resource window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourcesWindow;
    this.resource = tempDiv.firstChild;
	this.resourceDiv = this.resource.getElementsByClassName("resourceContent")[0];
	this.updateResources();
	
	// Store the buttons
	this.buttons = this.resource.getElementsByTagName("button");
	
}

var p = Resources.prototype;

p.openWindow = function(windowDiv, select, callback){
	
	// Setup the buttons
	var resources = this;
    this.buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	resources.windowDiv = null;
    	callback();
    }
	this.buttons[1].onclick = function(){
		resources.edit(null, function(){
			resources.updateResources();
			if(resources.windowDiv)
				resources.openWindow(resources.windowDiv, resources.select, resources.onclose);
		});
	}
    this.onclose = callback;
    this.windowDiv = windowDiv;
    this.select = select;
	
	var icons = this.resource.getElementsByClassName("icon");
	for(var i=0;i<icons.length;i++){
		if(this.select)
			icons[i].className = "iconSelect icon";
		else
			icons[i].className = "icon";
	}
    
	windowDiv.innerHTML = '';
	windowDiv.appendChild(this.resource);
	
}

p.updateResources = function(){
	
	if(this.length==0){
		this.resourceDiv.color = "grey";
		this.resourceDiv.className = "resourceContent center";
		this.resourceDiv.innerHTML = "No Resources Loaded";
	}else{
		var resources = this;
		this.resourceDiv.color = "";
		this.resourceDiv.className = "resourceContent";
		this.resourceDiv.innerHTML = '';
	    for(var i=0;i<this.length;i++){
	    	
	    	// Create the current resource element
    		var curResource = Windows.resource.replace("%icon%", this[i].icon);
	    	curResource = curResource.replace("%title%", this[i].title);
	    	curResource = curResource.replace("%link%", this[i].link);
	    	var tempDiv = document.createElement("DIV");
	    	tempDiv.innerHTML = curResource;
	        curResource = tempDiv.firstChild;
	    	this.resourceDiv.appendChild(curResource);
	    	
	    	// Setup delete and edit buttons
	    	(function(index){
	    		curResource.getElementsByClassName("delete")[0].onclick = function(){
	    			for(var i=index;i<resources.length-1;i++)
	    				resources[i] = resources[i+1];
	    			delete resources[--resources.length];
	    			resources.updateResources();
	    		}
	    		curResource.getElementsByClassName("edit")[0].onclick = function(){
	    			resources.edit(index, function(){
	    				resources.updateResources();
	    				if(resources.windowDiv)
	    					resources.openWindow(resources.windowDiv, resources.select, resources.onclose);
	    			});
	    		}
	    		
	    	    // If select setup the resources as buttons
	    		curResource.getElementsByClassName("icon")[0].onclick = function(){
		    	    if(resources.windowDiv && resources.select){
		    	    	resources.windowDiv.innerHTML = '';
		    	    	resources.windowDiv = null;
		    	    	resources.onclose(index);
		    	    	
		    	    }
	    		}
	    		
	    	})(i);
	    }
	}
	
}

p.edit = function(index, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourceEditor;
    var editInfo = tempDiv.firstChild;
    var form = editInfo.getElementsByTagName("form")[0];

	var resources = this;
    var type = editInfo.getElementsByTagName("select")[0];
	var buttons = editInfo.getElementsByTagName("button");
    
    
	if(index==null){
		editInfo.innerHTML = editInfo.innerHTML.replace(/%edit%/g, "Create").replace(/%apply%/g, "Create Resource").replace(/%name%/g, '').replace(/%link%/g, '');
	}
	else{
		editInfo.innerHTML = editInfo.innerHTML.replace(/%edit%/g, "Edit").replace(/%apply%/g, "Apply Changes").replace(/%name%/g, this[index].title).replace(/%link%/g, this[index].link);
		type.value = this[index].type;
		this.newLink = this[index].link;
	}
	
	// Setup combo box
	this.updateEditInfo(type, buttons, editInfo.getElementsByClassName("addressTag")[0], editInfo.getElementsByClassName("addressInfo")[0], editInfo.getElementsByClassName("address")[0], index);
	editInfo.getElementsByTagName("select")[0].onchange = function(){
		resources.updateEditInfo(resources.windowDiv.getElementsByTagName("select")[0], resources.windowDiv.getElementsByTagName("button"), resources.windowDiv.getElementsByClassName("addressTag")[0], resources.windowDiv.getElementsByClassName("addressInfo")[0], resources.windowDiv.getElementsByClassName("address")[0], index);
	};
	
	// Setup cancel button
	buttons[2].onclick = function(){
		resources.windowDiv.innerHTML = '';
    	callback();
	}
	
	// Setup confirm button
	buttons[3].onclick = function(){
		if(index==null)
			index = resources.length++;
		var newResource = resources.doc.createElement("resource");
		var form = editInfo.getElementsByTagName("form")[0];
		newResource.setAttribute("type", form.elements["type"].value);
		newResource.setAttribute("text", form.elements["name"].value);
		if(resources.newLink==null)
			newResource.setAttribute("link", form.elements["link"].value);
		else
			newResource.setAttribute("link", resources.newLink);
		resources[index] = new Resource(newResource);
		resources.windowDiv.innerHTML = '';
    	callback();
	}
	

	// Display the edit window
	this.windowDiv.innerHTML = '';
	this.windowDiv.appendChild(editInfo);
}

p.updateEditInfo = function(type, buttons, addressTag, addressInfo, address, index){

	if(!this.newLink)
		this.newLink = "";
	
	if(Number(type.value)==0){
		addressTag.innerHTML = "Refrence File";
		address.value = "";
		address.type = "file";
		address.style.display = "none";
		addressInfo.style.display = "";
		addressInfo.innerHTML = this.newLink;
		buttons[0].style.display = "";
		buttons[1].style.display = "";
		var resources = this;
		
		// Setup View button
		buttons[1].onclick = function(){
			console.log(resources.newLink);
			if(resources.newLink && resources.newLink!="")
				window.open(resources.newLink,'_blank');
		};
		
		// Setup input button
		buttons[0].onclick = address.click.bind(address);
		address.onchange = function(){
			if(address.files.length>0){
				for(var i=0;i<buttons.length;i++)
					buttons[i].disabled = true;
				var resourceData = new FormData();
				resourceData.append('resource', address.files[0], address.files[0].name);
				var request = new XMLHttpRequest();
				request.onreadystatechange = function() {
					if (request.readyState == 4 && request.status == 200) {
						for(var i=0;i<buttons.length;i++)
							buttons[i].disabled = false;
						if(request.responseText.match(/^error.*/i))
							addressInfo.innerHTML = request.responseText;
						else{
							resources.newLink = window.location.href.substr(0, window.location.href.substr(0, window.location.href.length-1).lastIndexOf("/"))+"/resource/"+request.responseText;
							addressInfo.innerHTML = resources.newLink;
						}
					}
				};
				request.open("POST", "../resource.php", true);
				request.send(resourceData);
				addressInfo.innerHTML = "Uploading...";
			}
			else{
				resources.newLink = "";
				addressInfo.innerHTML = resources.newLink;
			}
		}
	}
	else{
		addressTag.innerHTML = "Link Address";
		address.value = "";
		address.type = "text";
		address.style.display = "";
		address.value = this.newLink;
		this.newLink = null;
		address.onchange = function(){};
		addressInfo.style.display = "none";
		buttons[0].style.display = "none";
		buttons[1].style.display = "none";
		buttons[0].onclick = function(){};
		buttons[1].onclick = function(){};
	}
}

p.xml = function(xmlDoc){
	var xml = xmlDoc.createElement("resourceList");
	xml.setAttribute("resourceCount", this.length);
	for(var i=0;i<this.length;i++)
		xml.appendChild(this[i].xml);
	return xml;
}

module.exports = Resources;
},{"../helper/utilities.js":15,"../html/popupWindows.js":16}],5:[function(require,module,exports){
"use strict";
var Utilities = require('../helper/utilities.js');
var Point = require('../helper/point.js');
var Question = require("../case/question.js");
var Constants = require("./constants.js");
var DrawLib = require("../helper/drawlib.js");

//parameter is a point that denotes starting position
function board(section, boardContext, nodeContext, mouseState, startPosition, lessonNodes, save){
	
	// Create the canvas for this board and add it to the section
	this.canvas = document.createElement("canvas");
	this.ctx = this.canvas.getContext('2d');
	this.canvas.style.display = 'none';
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	this.save = save;
	mouseState.addCanvas(this.canvas);
	section.appendChild(this.canvas);
	
	var board = this;
	this.canvas.addEventListener('animationend', function(){
		if(board.loaded)
			board.loaded();
	}, false);
	
	this.boardContext = boardContext;
	this.nodeContext = nodeContext;
    this.lessonNodeArray = lessonNodes;
    this.boardOffset = startPosition;
    this.prevBoardOffset = {x:0,y:0};
    this.zoom = Constants.startZoom;
    this.stage = 0;
    this.lastSaveTime = 0; // assume no cookie
    this.lastQuestion = null;
    this.lastQuestionNum = -1;
    
    //if (document.cookie) this.loadCookie(); 

	// Check if all nodes are solved
	var done = true;
	for(var i=0;i<this.lessonNodeArray.length && done;i++)
		if(this.lessonNodeArray[i].question.currentState!=Question.SOLVE_STATE.SOLVED)
			done = false;
	if(done)
		this.finished = true;
	else
		this.finished = false;
}

//prototype
var p = board.prototype;

p.act = function(gameScale, pMouseState, dt) {
    
    // Check mouse events if given a mouse state
    if(pMouseState) {
	    
		
	    if (!pMouseState.mouseDown && this.target) {
			this.target.dragPosition = undefined; // clear drag behavior
			this.target.dragging = false;
			this.target = null;
		}
	    
	    if(pMouseState.mouseDown){
			var bounds = this.boardContext.getBoundingClientRect();
			if(bounds.left >= pMouseState.mousePosition.x || bounds.right <= pMouseState.mousePosition.x || bounds.top >= pMouseState.mousePosition.y || bounds.bottom <= pMouseState.mousePosition.y)
				this.boardContext.style.display = '';
			bounds = this.nodeContext.getBoundingClientRect();
			if(bounds.left >= pMouseState.mousePosition.x || bounds.right <= pMouseState.mousePosition.x || bounds.top >= pMouseState.mousePosition.y || bounds.bottom <= pMouseState.mousePosition.y)
				this.nodeContext.style.display = '';
	    }
	    
		for (var i=this.lessonNodeArray.length-1, nodeChosen; i>=0 && this.target==null; i--) {
			var lNode = this.lessonNodeArray[i];
			
			lNode.mouseOver = false;
			
			//console.log("node update");
			// if hovering, show hover glow
			/*if (pMouseState.relativePosition.x > lNode.position.x-lNode.width/2 
			&& pMouseState.relativePosition.x < lNode.position.x+lNode.width/2
			&& pMouseState.relativePosition.y > lNode.position.y-lNode.height/2
			&& pMouseState.relativePosition.y < lNode.position.y+lNode.height/2) {*/
			if (Utilities.mouseIntersect(pMouseState,lNode,this.boardOffset)) {
				lNode.mouseOver = true;
				this.target = lNode;
				
				//console.log(pMouseState.hasTarget);
			}
		}

    	if(this.addCon){

    		if(pMouseState.mouseClicked){
    			this.addCon = false;
    			if(this.target && this.target!=this.startCon){
    				if(!this.subConnection(this.target.question, this.startCon.question)){
    					this.target.question.revealThreshold++;
        				this.startCon.question.connections.push(this.target.question.num+1);
        				this.save();
    				}
    			}
    		}
    		if(this.target==null)
    			this.canvas.style.cursor = 'crosshair';
    		
    	}
    	else if(this.hideCon){
    		if(pMouseState.mouseClicked){
    			this.hideCon = false;
    			if(this.target && this.target!=this.startCon){
    				var contains = 0;
    				for(var i=0;i<this.startCon.question.connections.length && contains == 0;i++)
    					if(this.lessonNodeArray[Math.abs(this.startCon.question.connections[i])-1]==this.target)
    						contains = this.startCon.question.connections[i];
    				if(contains!=0){
    					console.log(contains);
    					this.startCon.question.connections.splice(this.startCon.question.connections.indexOf(contains), 1);
        				this.startCon.question.connections.push(-contains);
    					this.save();
    				}
    			}
    		}
    		if(this.target==null)
    			this.canvas.style.cursor = 'crosshair';
    	}
    	else if(this.removeCon){
    		if(pMouseState.mouseClicked){
    			this.removeCon = false;
    			if(this.target && this.target!=this.startCon && confirm("Are you sure you want to remove this connection? This action can't be undone!")){
    				var contains = -1;
    				for(var i=0;i<this.startCon.question.connections.length && contains == -1;i++)
    					if(this.lessonNodeArray[this.startCon.question.connections[i]-1]==this.target)
    						contains = this.startCon.question.connections[i];
    				if(contains>=0){
    					this.target.question.revealThreshold--;
    					this.startCon.question.connections.splice(this.startCon.question.connections.indexOf(contains), 1);
    					this.save();
    				}
    			}
    		}
    		if(this.target==null)
    			this.canvas.style.cursor = 'crosshair';
    	}
    	else if(this.target){
	
			if(!this.target.dragging){
				if (pMouseState.mouseDown) {
					// drag
					this.target.dragging = true;
					this.target.dragPosition = new Point(
					pMouseState.virtualPosition.x - this.target.position.x,
					pMouseState.virtualPosition.y - this.target.position.y
					);
				}
				if (pMouseState.mouseClicked) {
					// handle click code
					this.target.click(pMouseState);
					this.lastQuestion = this.target.question;
				}
				if (pMouseState.leftMouseClicked()) {
					// handle left click code
					this.nodeContext.style.top = pMouseState.mousePosition.y+"px";
					this.nodeContext.style.left = pMouseState.mousePosition.x+"px";
					this.nodeContext.style.display = 'block';
					this.nodeContext.virtualPosition = pMouseState.virtualPosition;
					this.boardContext.style.display = '';
					this.contextNode = this.target;
				}
			}
			else{
				var naturalX = pMouseState.virtualPosition.x - this.target.dragPosition.x;
				this.target.position.x = Math.max(Constants.boardOutline,Math.min(naturalX,Constants.boardSize.x - Constants.boardOutline));
				var naturalY = pMouseState.virtualPosition.y - this.target.dragPosition.y;
				this.target.position.y = Math.max(Constants.boardOutline,Math.min(naturalY,Constants.boardSize.y - Constants.boardOutline));
			}
			
	  }
		
		// drag the board around
		else {
			if (pMouseState.mouseDown) {
				this.canvas.style.cursor = '-webkit-grabbing';
				this.canvas.style.cursor = '-moz-grabbing';
				this.canvas.style.cursor = 'grabbing';
				if (!this.mouseStartDragBoard) {
					this.mouseStartDragBoard = pMouseState.virtualPosition;
					this.prevBoardOffset.x = this.boardOffset.x;
					this.prevBoardOffset.y = this.boardOffset.y;
				}
				else {
					this.boardOffset.x = this.prevBoardOffset.x - (pMouseState.virtualPosition.x - this.mouseStartDragBoard.x);
					if (this.boardOffset.x > this.maxBoardWidth/2) this.boardOffset.x = this.maxBoardWidth/2;
					if (this.boardOffset.x < -1*this.maxBoardWidth/2) this.boardOffset.x = -1*this.maxBoardWidth/2;
					this.boardOffset.y = this.prevBoardOffset.y - (pMouseState.virtualPosition.y - this.mouseStartDragBoard.y);
					if (this.boardOffset.y > this.maxBoardHeight/2) this.boardOffset.y = this.maxBoardHeight/2;
					if (this.boardOffset.y < -1*this.maxBoardHeight/2) this.boardOffset.y = -1*this.maxBoardHeight/2;
				}
			} else {
				this.mouseStartDragBoard = undefined;
				this.canvas.style.cursor = '';
				if (pMouseState.leftMouseClicked()) {
					// handle left click code
					this.boardContext.style.top = pMouseState.mousePosition.y+"px";
					this.boardContext.style.left = pMouseState.mousePosition.x+"px";
					this.boardContext.style.display = 'block';
					this.boardContext.virtualPosition = pMouseState.virtualPosition;
					this.nodeContext.style.display = '';
				}
			}
	    }
    }
}

p.subConnection = function(question, searchQues){
	var found = false;
	for(var i=0;i<question.connections.length && !found;i++){
		var cur = this.lessonNodeArray[question.connections[i]-1].question;
		if(cur==searchQues)
			found = true;
		else
			found = this.subConnection(cur, searchQues);
	}
	return found;
}

p.draw = function(gameScale, pMouseState){
    
    // save canvas state because we are about to alter properties
    this.ctx.save();   
    
    // Clear before drawing new stuff
	DrawLib.rect(this.ctx, 0, 0, this.canvas.width, this.canvas.height, "#15718F");

	
	// Scale the game
    this.ctx.save();
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
	this.ctx.scale(gameScale, gameScale);
	this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);

    // Translate to center of screen and scale for zoom then translate back
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
    // move the board to where the user dragged it
    //translate to the center of the board
    //console.log(this);
    this.ctx.translate(this.canvas.width/2 - this.boardOffset.x, this.canvas.height/2 - this.boardOffset.y);
    
	
    // Draw the background of the board
    DrawLib.rect(this.ctx, 0, 0, Constants.boardSize.x, Constants.boardSize.y, "#D3B185");
    DrawLib.strokeRect(this.ctx, -Constants.boardOutline/2, -Constants.boardOutline/2, Constants.boardSize.x+Constants.boardOutline/2, Constants.boardSize.y+Constants.boardOutline/2, Constants.boardOutline, "#CB9966");
    


	// draw the nodes itself
	for(var i=0; i<this.lessonNodeArray.length; i++)
        this.lessonNodeArray[i].draw(this.ctx, this.canvas);
    
	// draw the lines
	for(var i=0; i<this.lessonNodeArray.length; i++){
		
		// get the pin position
        var oPos = this.lessonNodeArray[i].getNodePoint();
        
		// set line style
        
        // draw lines
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	var connection = this.lessonNodeArray[Math.abs(this.lessonNodeArray[i].question.connections[j]) - 1];
        	
        	var color = "rgba(255, 0, 0, ", 
        		size = Constants.arrowSize;
        	
        	if((!this.removeCon && !this.hideCon && this.lessonNodeArray[i]==this.target) || 
        			((this.removeCon || this.hideCon) && this.lessonNodeArray[i]==this.startCon && connection==this.target)){
        		size *= 2;
        		color =  "rgba(0, 0, 255, ";
        	}

        	if(this.lessonNodeArray[i].question.connections[j]<0)
        		color += "0.25)";
        	else
        		color += "1)";

        	// -1 becase node connection index values are 1-indexed but connections is 0-indexed
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var cPos = connection.getNodePoint();
            DrawLib.arrow(this.ctx, oPos, cPos, Constants.arrowHeadSize, size, color);
            
        }
    }

	if(this.addCon)
        DrawLib.arrow(this.ctx, this.startCon.getNodePoint(), new Point(pMouseState.virtualPosition.x+this.boardOffset.x, pMouseState.virtualPosition.y+this.boardOffset.y), Constants.arrowHeadSize, Constants.arrowSize, "darkRed");
	
	this.ctx.restore();
};

// Gets a free node in this board (i.e. not unsolved) returns null if none
p.getFreeNode = function() {
	for(var i=0; i<this.lessonNodeArray.length; i++)
		if(this.lessonNodeArray[i].currentState == Question.SOLVE_STATE.UNSOLVED)
			return this.lessonNodeArray[i];
	return null;
}

// Moves this board towards the given point
p.moveTowards = function(point, dt, speed){
	
	// Get the vector towards the given point
	var toPoint = new Point(point.x-this.boardOffset.x, point.y-this.boardOffset.y);
	
	// Get the distance of said vector
	var distance = Math.sqrt(toPoint.x*toPoint.x+toPoint.y*toPoint.y);
	
	// Get the new offset of the board after moving towards the point
	var newOffset = new Point( this.boardOffset.x + toPoint.x/distance*dt*speed,
								this.boardOffset.y + toPoint.y/distance*dt*speed);
	
	// Check if passed point on x axis and if so set to point's x
	if(this.boardOffset.x !=point.x &&
		Math.abs(point.x-newOffset.x)/(point.x-newOffset.x)==Math.abs(point.x-this.boardOffset.x)/(point.x-this.boardOffset.x))
		this.boardOffset.x = newOffset.x;
	else
		this.boardOffset.x = point.x;
	

	// Check if passed point on y axis and if so set to point's y
	if(this.boardOffset.y != point.y &&
		Math.abs(point.y-newOffset.y)/(point.y-newOffset.y)==Math.abs(point.y-this.boardOffset.y)/(point.y-this.boardOffset.y))
		this.boardOffset.y = newOffset.y;
	else
		this.boardOffset.y = point.y;
}

p.windowClosed = function(){
	var xml;
	if(this.lastQuestion){
		var question = this.lastQuestion;
		this.lastQuestion = null;
		if(question.save){
			question.save = false;
			xml = question.xml;
			for(var i=0;i<this.lessonNodeArray.length;i++)
				this.lessonNodeArray[i].updateImage();
		}
		return {xml:xml, num:question.num};
	}
	return null;
}

p.addConnection = function(start){
	this.addCon = true;
	this.canvas.style.cursor = 'crosshair';
	this.startCon = start;
}

p.removeConnection = function(start){
	this.removeCon = true;
	this.canvas.style.cursor = 'crosshair';
	this.startCon = start;
}

p.hideConnection = function(start){
	this.hideCon = true;
	this.canvas.style.cursor = 'crosshair';
	this.startCon = start;
}

p.show = function(dir){
	if(dir!=null)
		this.canvas.style.animation = 'canvasEnter' + (dir ? 'L' : 'R') + ' 1s';
	this.canvas.style.display = 'inline-block';
}

p.hide = function(dir){
	if(dir!=null){
		this.canvas.style.animation = 'canvasLeave' + (dir ? 'R' : 'L') + ' 1s';
		var board = this;
		this.loaded = function(){
			board.canvas.style.display = 'none';
		}
	}
	else{
		board.canvas.style.display = 'none';
	}
}

p.updateSize = function(){
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
}

module.exports = board;    

},{"../case/question.js":3,"../helper/drawlib.js":9,"../helper/point.js":14,"../helper/utilities.js":15,"./constants.js":6}],6:[function(require,module,exports){
"use strict";
var Point = require('../helper/point.js');

//Module export
var m = module.exports;

// The size of the board in game units at 100% zoom
m.boardSize = new Point(1920, 1080);
m.boundSize = 3;

//The size of the board outline in game units at 100% zoom
m.boardOutline = m.boardSize.x > m.boardSize.y ? m.boardSize.x/20 : m.boardSize.y/20;

// The zoom values at start and end of animation
m.startZoom = 0.5;
m.endZoom = 1.5;

// The speed of the zoom animation
m.zoomSpeed = 0.001;
m.zoomMoveSpeed = 0.75;

// The speed of the line animation
m.lineSpeed = 0.002;

// The time between zoom checks
m.pinchSpeed = .0025;

// Used for resizing nodes
m.nodeStep = 0.1;
m.maxNodeScale = 2;
m.minNodeScale = 0.5;
m.nodeEdgeWidth = 25;

// Used for drawing arrows
m.arrowHeadSize = 50;
m.arrowSize = 5;
},{"../helper/point.js":14}],7:[function(require,module,exports){
"use strict";
var Board = require('./board.js');
var Point = require('../helper/point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('../helper/drawlib.js');
var DataParser = require('../helper/iparDataParser.js');
var MouseState = require('../helper/mouseState.js');
var KeyboardState = require('../helper/keyboardState.js');
var FileManager = require('../helper/fileManager.js');
var Utilities = require('../helper/utilities.js');
var Question = require('../case/question.js');
var Category = require('../case/category.js');
var Popup = require('../menus/popup.js');
var PopupWindows = require('../html/popupWindows.js');

//mouse & keyboard management
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

// HTML elements
var zoomSlider;
var windowDiv;
var windowFilm;

// Used for pinch zoom
var pinchStart;

// Used for waiting a second to close windows
var pausedTime = 0;

//phase handling
var phaseObject;

function game(section, baseScale){
	var game = this;
	this.active = false;
	this.section = section;
	this.saveFiles = [];
	
	// Get and setup the window elements
	windowDiv = document.getElementById('window');
	windowFilm = document.getElementById('windowFlim');
	
	// Get and setup the zoom slider
	zoomSlider = document.querySelector('#'+section.id+' #zoom-slider');
	zoomSlider.oninput = function(){
		game.setZoom(-parseFloat(zoomSlider.value));
	};
	document.querySelector('#'+section.id+' #zoom-in').onclick = function() {
    	zoomSlider.stepDown();
		game.setZoom(-parseFloat(zoomSlider.value));
    };
    document.querySelector('#'+section.id+' #zoom-out').onclick = function() { 
		zoomSlider.stepUp(); 
		game.setZoom(-parseFloat(zoomSlider.value));
	};
	
	// Get and setup the board context menu
	var boardContext = document.querySelector('#'+section.id+' #board-context');
	document.querySelector('#'+section.id+' #board-context #add-question').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		game.addQuestion((boardContext.virtualPosition.x+Constants.boardSize.x/2)/Constants.boardSize.x*100,
				(boardContext.virtualPosition.y+Constants.boardSize.y/2)/Constants.boardSize.y*100);
		boardContext.style.display = '';
	};


	document.querySelector('#'+section.id+' #board-context #add-category').onclick = function(e){
		Popup.prompt(windowDiv, "Create Category", "Category Name:", "", "Create", function(newName){
    		if(newName)
    			game.addCategory(newName);
    	});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #rename-category').onclick = function(e){
		Popup.prompt(windowDiv, "Rename Category", "Category Name:", game.categories[game.activeBoardIndex].name, "Rename", function(newName){
    		if(newName){
    			game.categories[game.activeBoardIndex].name = newName;
    			game.boardArray[game.activeBoardIndex].button.innerHTML = newName;
    			var caseData = JSON.parse(localStorage['caseDataCreate']);
    			var caseFile = Utilities.getXml(caseData.caseFile);
    			caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element")[game.activeBoardIndex].innerHTML = newName;
    			caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
    			localStorage['caseDataCreate'] = JSON.stringify(caseData);
    		}
    	});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #delete-category').onclick = function(e){
		if(game.boardArray.length>1 && confirm("Are you sure you want to delete the current category You can't undo this action!"))
			game.deleteCategory();
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #forward-category').onclick = function(e){
		if(game.activeBoardIndex+1<game.categories.length)
			game.moveCategory(1);
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #backward-category').onclick = function(e){
		if(game.activeBoardIndex-1>=0)
			game.moveCategory(-1);
		boardContext.style.display = '';
	};
	
	
	document.querySelector('#'+section.id+' #board-context #edit-info').onclick = function(e){
		var caseData = JSON.parse(localStorage['caseDataCreate']);
		Popup.editInfo(windowDiv, Utilities.getXml(caseData.caseFile), function(newCaseFile, name){
	    	localStorage['caseName'] =name+".ipar";
			caseData = JSON.parse(localStorage['caseDataCreate']);
			caseData.caseFile = new XMLSerializer().serializeToString(newCaseFile);
			localStorage['caseDataCreate'] = JSON.stringify(caseData);
		});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #edit-resources').onclick = function(e){
		game.resources.openWindow(windowDiv, false, function(){
			var caseData = JSON.parse(localStorage['caseDataCreate']);
			var caseFile = Utilities.getXml(caseData.caseFile);
			var resourceList = caseFile.getElementsByTagName("resourceList")[0];
			resourceList.parentNode.replaceChild(game.resources.xml(caseFile), resourceList);
			caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
			localStorage['caseDataCreate'] = JSON.stringify(caseData);
			game.save();
		});
		boardContext.style.display = '';
	};
	

	// Get and setup the node context menu
	var nodeContext = document.querySelector('#'+this.section.id+' #node-context');
	document.querySelector('#'+section.id+' #node-context #add-connection').onclick = function(e){
		game.boardArray[game.activeBoardIndex].addConnection(game.boardArray[game.activeBoardIndex].contextNode);
		game.save();
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #hide-connection').onclick = function(e){
		if(game.boardArray[game.activeBoardIndex].contextNode.question.connections.length>0){
			game.boardArray[game.activeBoardIndex].hideConnection(game.boardArray[game.activeBoardIndex].contextNode);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #remove-connection').onclick = function(e){
		if(game.boardArray[game.activeBoardIndex].contextNode.question.connections.length>0){
			game.boardArray[game.activeBoardIndex].removeConnection(game.boardArray[game.activeBoardIndex].contextNode);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #delete-question').onclick = function(e){
		if(confirm("Are you sure want to delete this question? You can't undo this action!")){
			var board = game.boardArray[game.activeBoardIndex],
				cat = game.categories[game.activeBoardIndex];
			for(var i=0;i<cat.questions.length;i++){
				if(cat.questions[i].num>board.contextNode.question.num)
					cat.questions[i].num--;
				var con = cat.questions[i].connections.indexOf(board.contextNode.question.num+1);
				while(con!=-1){
					cat.questions[i].connections.splice(con, 1);
					con = cat.questions[i].connections.indexOf(board.contextNode.question.num+1);
				}
				for(var j=0;j<cat.questions[i].connections.length;j++)
					if(cat.questions[i].connections[j]-1>board.contextNode.question.num)
						cat.questions[i].connections[j]--;
			}
			board.lessonNodeArray.splice(board.contextNode.question.num, 1);
			cat.questions.splice(board.contextNode.question.num, 1);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #make-larger').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		if(board.lessonNodeArray[board.contextNode.question.num].question.scale<Constants.maxNodeScale){
			board.lessonNodeArray[board.contextNode.question.num].question.scale += Constants.nodeStep;
			board.lessonNodeArray[board.contextNode.question.num].updateImage();
		}
		game.save();
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #make-smaller').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		if(board.lessonNodeArray[board.contextNode.question.num].question.scale>Constants.minNodeScale){
			board.lessonNodeArray[board.contextNode.question.num].question.scale -= Constants.nodeStep;
			board.lessonNodeArray[board.contextNode.question.num].updateImage();
		}
		game.save();
		nodeContext.style.display = '';
	};
	
	
	
	// Save the given scale
	this.scale = baseScale;
	
	// Load the case file
	var loadData = FileManager.loadCase(JSON.parse(localStorage['caseDataCreate']), document.querySelector('#'+section.id+' #window'));
	
	// Create the boards
	this.resources = loadData.resources;
	this.categories = loadData.categories;
	this.nodeContext = nodeContext;
	this.boardContext = boardContext;
	this.createLessonNodes();
	
	// Display the current board
	this.activeBoardIndex = loadData.category;
	this.active = true;
	this.boardArray[this.activeBoardIndex].show();
	this.boardArray[this.activeBoardIndex].button.className = "active";
	zoomSlider.value = -this.getZoom();
	
	// Setup the save button
	FileManager.prepareZip(document.querySelector('#'+section.id+' #blob'));
	
	
	// Create the images window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = PopupWindows.imagesEditor;
    this.imagesWindow = tempDiv.firstChild;
    
    // Fill it with the current images
    var content = this.imagesWindow.getElementsByClassName("imageContent")[0];
    for(var i=0;i<loadData.images.length;i++)
    	content.innerHTML += PopupWindows.image.replace(/%image%/g, loadData.images[i]);

	// Add it to all the questions
	for(var i=0;i<this.categories.length;i++)
		for(var j=0;j<this.categories[i].questions.length;j++)
			this.categories[i].questions[j].imagesWindow = this.imagesWindow;
}

var p = game.prototype;

p.addCategory = function(name){
	
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	var caseFile = Utilities.getXml(caseData.caseFile);
	var cat = caseFile.createElement("category");
	cat.setAttribute("categoryDesignation", this.categories.length);
	cat.setAttribute("questionCount", 0);
	caseFile.getElementsByTagName("case")[0].appendChild(cat);
	this.categories.push(new Category(name, cat, this.resources, windowDiv));
	this.createBoard(this.categories[this.categories.length-1], this.categories.length-1);
	
	caseFile.getElementsByTagName("case")[0].appendChild(cat);
	var list = caseFile.getElementsByTagName("categoryList")[0];
	list.setAttribute("categoryCount", this.categories.length);
	var newElement = caseFile.createElement("element");
	newElement.innerHTML = name;
	list.appendChild(newElement);
	caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
	localStorage['caseDataCreate'] = JSON.stringify(caseData);
	
}

p.moveCategory = function(dir){
	
	// Flip the categories first
	var temp = this.categories[this.activeBoardIndex];
	this.categories[this.activeBoardIndex] = this.categories[dir+this.activeBoardIndex];
	this.categories[this.activeBoardIndex+dir] = temp;
	
	// Next flip the button names
	this.boardArray[this.activeBoardIndex].button.innerHTML = this.categories[this.activeBoardIndex].name;
	this.boardArray[this.activeBoardIndex+dir].button.innerHTML = this.categories[this.activeBoardIndex+dir].name;
	
	// Then flip the buttons
	temp = this.boardArray[this.activeBoardIndex+dir].button;
	this.boardArray[this.activeBoardIndex+dir].button = this.boardArray[this.activeBoardIndex].button;
	this.boardArray[this.activeBoardIndex].button = temp;
	
	// Then, flip the boards
	temp = this.boardArray[this.activeBoardIndex+dir];
	this.boardArray[this.activeBoardIndex+dir] = this.boardArray[this.activeBoardIndex];
	this.boardArray[this.activeBoardIndex] = temp;
	
	// Finally, flip the data in the xml and save
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	var caseFile = Utilities.getXml(caseData.caseFile);
	var list = caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
	list[this.activeBoardIndex].innerHTML = this.categories[this.activeBoardIndex].name;
	list[this.activeBoardIndex+dir].innerHTML = this.categories[this.activeBoardIndex+dir].name;
	var cats = caseFile.getElementsByTagName("category");
	for(var i=0;i<cats.length;i++){
		if(Number(cats[i].getAttribute("categoryDesignation"))==this.activeBoardIndex)
			cats[i].setAttribute("categoryDesignation", this.activeBoardIndex+dir);
		else if(Number(cats[i].getAttribute("categoryDesignation"))==this.activeBoardIndex+dir)
			cats[i].setAttribute("categoryDesignation", this.activeBoardIndex);
	}
	caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
	localStorage['caseDataCreate'] = JSON.stringify(caseData);
	
	
	this.boardArray[this.activeBoardIndex+dir].button.className = "active";
	this.boardArray[this.activeBoardIndex].button.className = "";
	this.activeBoardIndex += dir;
}

p.deleteCategory = function() {
	
	// Remove the button, board, and cat first
	this.boardArray[this.boardArray.length-1].button.parentNode.removeChild(this.boardArray[this.boardArray.length-1].button);
	this.boardArray[this.activeBoardIndex].canvas.parentNode.removeChild(this.boardArray[this.activeBoardIndex].canvas);
	for(var i=this.boardArray.length-1;i>this.activeBoardIndex;i--){
		this.boardArray[i].button = this.boardArray[i-1].button;
		this.boardArray[i].button.innerHTML = this.categories[i].name;
	}
	for(var i=this.activeBoardIndex+1;i<this.boardArray.length;i++){
		this.boardArray[i-1] = this.boardArray[i];
		this.categories[i-1] = this.categories[i];
	}
	this.boardArray.pop();
	this.categories.pop();
	
	// Then remove it from the xml
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	var caseFile = Utilities.getXml(caseData.caseFile);
	var list = caseFile.getElementsByTagName("categoryList")[0];
	list.setAttribute("categoryCount", this.categories.length);
	list.removeChild(list.getElementsByTagName("element")[this.activeBoardIndex]);
	var cats = caseFile.getElementsByTagName("category");
	for(var i=0;i<cats.length;i++){
		if(Number(cats[i].getAttribute("categoryDesignation"))==this.activeBoardIndex){
			cats[i].parentNode.removeChild(cats[i]);
			break;
		}
	}
	cats = caseFile.getElementsByTagName("category");
	for(var i=0;i<cats.length;i++)
		if(Number(cats[i].getAttribute("categoryDesignation"))>this.activeBoardIndex)
			cats[i].setAttribute("categoryDesignation", this.activeBoardIndex-1);
	caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
	localStorage['caseDataCreate'] = JSON.stringify(caseData);
	
	if(this.activeBoardIndex>=this.boardArray.length)
		this.activeBoardIndex = this.boardArray.length-1;
	this.boardArray[this.activeBoardIndex].button.className = "active";
	this.newBoard = this.activeBoardIndex;
	this.zoomout = true;
}

p.createLessonNodes = function(){
	this.boardArray = [];
	this.bottomBar = document.querySelector('#'+this.section.id+' #bottomBar');
	this.mouseState = new MouseState();
	this.keyboardState = new KeyboardState(this);
	for(var i=0;i<this.categories.length;i++)
		this.createBoard(this.categories[i], i);
	
}

p.createBoard = function(cat, num){
	this.lessonNodes = [];
	// add a node per question
	for (var j = 0; j < cat.questions.length; j++) {
		// create a new lesson node
		this.lessonNodes.push(new LessonNode( cat.questions[j] ) );
		// attach question object to lesson node
		this.lessonNodes[this.lessonNodes.length-1].question = cat.questions[j];
	
	}

	// create a board
	this.boardArray[num] = new Board(this.section, this.boardContext, this.nodeContext, this.mouseState, new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), this.lessonNodes, this.save.bind(this));
	var button = document.createElement("BUTTON");
	button.innerHTML = cat.name;
	var game = this;
	button.onclick = (function(i){ 
		return function() {
			if(game.active){
				game.changeBoard(i);
			}
	}})(num);
	this.bottomBar.appendChild(button);
	this.boardArray[num].button = button;
}

p.update = function(dt){

    if(this.active){
    
    	// perform game actions
    	this.act(dt);
    	
	    // draw stuff
	    this.boardArray[this.activeBoardIndex].draw(this.scale, this.mouseState);
	    
    }
    else if(pausedTime!=0 && windowDiv.innerHTML=='')
    	this.windowClosed();
    
}

p.act = function(dt){

    // Update the mouse and keyboard states
	this.mouseState.update(dt, this.scale*this.getZoom());
	this.keyboardState.update();
	
	// Handle keyboard shortcuts
	this.checkKeyboard();
	
	
    // Update the current board (give it the mouse only if not zooming)
    this.boardArray[this.activeBoardIndex].act(this.scale, (this.zoomout ? null : this.mouseState), dt);
    
    // Check if new board available
    if(this.activeBoardIndex < this.boardArray.length-1 &&
    		this.boardArray[this.activeBoardIndex+1].button.disabled && 
    		this.boardArray[this.activeBoardIndex].finished){
    	this.boardArray[this.activeBoardIndex+1].button.disabled = false;
    }
	

	// If the needs to zoom out to center
	if(this.zoomout){
		
		// Get the current board
		var board = this.boardArray[this.activeBoardIndex];
		
		// Zoom out and move towards center
		if(this.getZoom()>Constants.startZoom)
			board.zoom -= dt*Constants.zoomSpeed;
		else if(this.getZoom()<Constants.startZoom)
			board.zoom = Constants.startZoom;
		board.moveTowards(new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), dt, Constants.zoomMoveSpeed);
		
		// Update the zoom slider
		zoomSlider.value = -this.getZoom();
		
		// If fully zoomed out and in center stop
		if(this.getZoom()==Constants.startZoom && board.boardOffset.x==Constants.boardSize.x/2 && board.boardOffset.y==Constants.boardSize.y/2){				
			this.zoomout = false;
			
			// If changing board start that process
			if(this.newBoard!=null){
				var dir = this.newBoard < this.activeBoardIndex;
				this.boardArray[this.activeBoardIndex].hide(dir);
				this.activeBoardIndex = this.newBoard;
				this.boardArray[this.activeBoardIndex].show(dir);
				zoomSlider.value = -this.getZoom();
				this.active = false;
				var game = this;
				this.boardArray[this.activeBoardIndex].loaded = function(){
					game.active = true;
					game.newBoard = null;
				}
			}
		}
	}
	else{ // Only handle zooming if not performing animation zoom
	
		// Handle pinch zoom
	    if(this.mouseState.zoomDiff!=0){
	    	zoomSlider.value = pinchStart + this.mouseState.zoomDiff * Constants.pinchSpeed;
	    	this.updateZoom(-parseFloat(zoomSlider.value)); 
	    }
	    else
	    	pinchStart = Number(zoomSlider.value);
	    
	    // Handle mouse zoom
	    if(this.mouseState.mouseWheelDY!=0)
	    	this.zoom(this.mouseState.mouseWheelDY<0);
	}

    
    // Check if should pause
    if(windowDiv.innerHTML!='' && pausedTime++>3){
    	this.active = false;
    	windowFilm.style.display = 'block';
    }
    
}

p.getZoom = function(){
	return this.boardArray[this.activeBoardIndex].zoom;
}

p.setZoom = function(zoom){
	this.boardArray[this.activeBoardIndex].zoom = zoom;
}

p.zoom = function(dir){
	if(dir)
    	zoomSlider.stepDown();
    else
    	zoomSlider.stepUp();
	this.setZoom(-parseFloat(zoomSlider.value));
}

p.setScale = function(scale){
	for(var i=0;i<this.boardArray.length;i++)
		this.boardArray[i].updateSize();
	this.scale = scale;
}

p.changeBoard = function(num){
	if(num!=this.activeBoardIndex){
		this.boardArray[num].button.className = "active";
		this.boardArray[this.activeBoardIndex].button.className = "";
		this.newBoard = num;
		this.zoomout = true;
	}
}

p.windowClosed = function() {
	
	// Unpause the game and fully close the window
	pausedTime = 0;
	this.active = true;
	windowFilm.style.display = 'none';
	
	var save = this.boardArray[this.activeBoardIndex].windowClosed();
	
	if(save){
		var caseData = JSON.parse(localStorage['caseDataCreate']);
		var caseFile = Utilities.getXml(caseData.caseFile);
		if(save.xml){
			var cat = caseFile.getElementsByTagName('category')[this.activeBoardIndex];
			cat.replaceChild(save.xml, cat.getElementsByTagName('button')[save.num]);
			caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
			localStorage['caseDataCreate'] = JSON.stringify(caseData);
		}
		else{
			this.categories[this.activeBoardIndex].questions[save.num].xml = caseFile.getElementsByTagName('category')[this.activeBoardIndex].getElementsByTagName('button')[save.num];
			this.categories[this.activeBoardIndex].questions[save.num].refresh();
		}
	}
	
	this.save();
	
}

p.save = function(){
	
	var lessonNodes = this.boardArray[this.activeBoardIndex].lessonNodeArray;
	for(var i=0;i<lessonNodes.length;i++)
		lessonNodes[i].save();
	
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	var caseFile = Utilities.getXml(caseData.caseFile);
	var caseNode = caseFile.getElementsByTagName("case")[0];
	var cat = caseNode.getElementsByTagName("category")[0];
	while(cat){
		caseNode.removeChild(cat);
		cat = caseNode.getElementsByTagName("category")[0];
	}
	for(var i=0;i<this.categories.length;i++)
		caseNode.appendChild(this.categories[i].xml(caseFile, i));
	caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
	localStorage['caseDataCreate'] = JSON.stringify(caseData);
	
}

p.addQuestion = function(x, y){
	
	// Get the case to add the question
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	var caseFile = Utilities.getXml(caseData.caseFile);
	var newQuestion = caseFile.createElement('button');
	newQuestion.setAttribute('xPositionPercent', x);
	newQuestion.setAttribute('yPositionPercent', y);
	newQuestion.setAttribute('scale', '1');
	newQuestion.setAttribute('numConnections', '0');
	newQuestion.setAttribute('numAnswers', '3');
	newQuestion.setAttribute('correctAnswer', '0');
	newQuestion.setAttribute('imageLink', window.location.href.substr(0, window.location.href.substr(0, window.location.href.length-1).lastIndexOf("/"))+"/image/"+'eb1832a80fa41e395491571d4930119b.png');
	newQuestion.setAttribute('revealThreshold', '0');
	newQuestion.setAttribute('questionType', '2');
	newQuestion.setAttribute('resourceCount', '0');
	newQuestion.appendChild(caseFile.createElement('questionName'));
	newQuestion.appendChild(caseFile.createElement('instructions'));
	newQuestion.appendChild(caseFile.createElement('questionText'));
	newQuestion.appendChild(caseFile.createElement('answer'));
	newQuestion.appendChild(caseFile.createElement('answer'));
	newQuestion.appendChild(caseFile.createElement('answer'));
	newQuestion.appendChild(caseFile.createElement('feedback'));
	newQuestion.appendChild(caseFile.createElement('feedback'));
	newQuestion.appendChild(caseFile.createElement('feedback'));
	var cats = caseFile.getElementsByTagName('category');
	for(var i=0;i<cats.length;i++){
		if(Number(cats[i].getAttribute("categoryDesignation"))==this.activeBoardIndex)
		{
			cats[i].appendChild(newQuestion);
			break;
		}
	}
	
	var question = new Question(newQuestion, this.resources, windowDiv, this.categories[this.activeBoardIndex].questions.length);
	question.imagesWindow = this.imagesWindow;
	this.categories[this.activeBoardIndex].questions.push(question);
	var lessonNodes = this.boardArray[this.activeBoardIndex].lessonNodeArray;
	lessonNodes.push(new LessonNode( question ) );
	// attach question object to lesson node
	lessonNodes[lessonNodes.length-1].question = question;
	this.boardArray[this.activeBoardIndex].lessonNodeArray = lessonNodes;
	
	// Save the changes to local storage
	this.save();
	
}

p.checkKeyboard = function(){
	
	if(this.keyboardState.keyPressed[46]){ // Delete - Delete Category
		if(this.boardArray.length>1 && confirm("Are you sure you want to delete the current category You can't undo this action!"))
			this.deleteCategory();
	}
	
	if(this.keyboardState.key[17]){ // Ctrl
		
		var board = this.boardArray[this.activeBoardIndex];
		var game = this;
		
		if(this.keyboardState.keyPressed[67]){ // C - Add Category
			Popup.prompt(windowDiv, "Create Category", "Category Name:", "", "Create", function(newName){
	    		if(newName)
	    			game.addCategory(newName);
	    	});
		}
		
		if(this.keyboardState.keyPressed[86]){ // V - Rename Category
			Popup.prompt(windowDiv, "Rename Category", "Category Name:", this.categories[this.activeBoardIndex].name, "Rename", function(newName){
	    		if(newName){
	    			game.categories[game.activeBoardIndex].name = newName;
	    			game.boardArray[game.activeBoardIndex].button.innerHTML = newName;
	    			var caseData = JSON.parse(localStorage['caseDataCreate']);
	    			var caseFile = Utilities.getXml(caseData.caseFile);
	    			caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element")[game.activeBoardIndex].innerHTML = newName;
	    			caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
	    			localStorage['caseDataCreate'] = JSON.stringify(caseData);
	    		}
	    	});
		}
		
		if(this.keyboardState.keyPressed[88]){ // X - Move Category forward
			if(this.activeBoardIndex+1<this.categories.length)
				this.moveCategory(1);
		}
		
		if(this.keyboardState.keyPressed[90]){ // Z - Move Category backward
			if(this.activeBoardIndex-1>=0)
				this.moveCategory(-1);
		}
		
		if(this.keyboardState.keyPressed[70]){ // F - Edit Case Info
			var caseData = JSON.parse(localStorage['caseDataCreate']);
			Popup.editInfo(windowDiv, Utilities.getXml(caseData.caseFile), function(newCaseFile, name){
		    	localStorage['caseName'] =name+".ipar";
				caseData = JSON.parse(localStorage['caseDataCreate']);
				caseData.caseFile = new XMLSerializer().serializeToString(newCaseFile);
				localStorage['caseDataCreate'] = JSON.stringify(caseData);
			});
		}
		
		if(this.keyboardState.keyPressed[82]){ // R - Edit resources
			this.resources.openWindow(windowDiv, false, function(){
				var caseData = JSON.parse(localStorage['caseDataCreate']);
				var caseFile = Utilities.getXml(caseData.caseFile);
				var resourceList = caseFile.getElementsByTagName("resourceList")[0];
				resourceList.parentNode.replaceChild(game.resources.xml(caseFile), resourceList);
				caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
				localStorage['caseDataCreate'] = JSON.stringify(caseData);
				game.save();
			});
		}
		
		if(board.target){

			if(this.keyboardState.key[16]){ // Shift
				if(this.keyboardState.keyPressed[65]){ // A - Add connection
					board.addConnection(board.target);
					this.save();
				}
				
				if(this.keyboardState.keyPressed[68]){ // D - Remove connection
					if(board.target.question.connections.length>0){
						board.removeConnection(board.target);
						this.save();
					}
				}
				
				if(this.keyboardState.keyPressed[83]){ // S - Show/Hide connection
					if(game.boardArray[game.activeBoardIndex].contextNode.question.connections.length>0){
						game.boardArray[game.activeBoardIndex].hideConnection(game.boardArray[game.activeBoardIndex].contextNode);
						game.save();
					}
				}
			}
			else{
			
				if(this.keyboardState.keyPressed[65]){ // A - Make question smaller
					if(board.lessonNodeArray[board.target.question.num].question.scale>Constants.minNodeScale){
						board.lessonNodeArray[board.target.question.num].question.scale -= Constants.nodeStep;
						board.lessonNodeArray[board.target.question.num].updateImage();
					}
					this.save();
				}
		
				if(this.keyboardState.keyPressed[83]){ // S - Make question larger
					if(board.lessonNodeArray[board.target.question.num].question.scale<Constants.maxNodeScale){
						board.lessonNodeArray[board.target.question.num].question.scale += Constants.nodeStep;
						board.lessonNodeArray[board.target.question.num].updateImage();
					}
					this.save();
				}
				
				if(this.keyboardState.keyPressed[68]){ // D - Delete question
					if(confirm("Are you sure want to delete this question? You can't undo this action!")){
						var cat = this.categories[this.activeBoardIndex];
						for(var i=0;i<cat.questions.length;i++){
							if(cat.questions[i].num>board.target.question.num)
								cat.questions[i].num--;
							var con = cat.questions[i].connections.indexOf(board.target.question.num+1);
							while(con!=-1){
								cat.questions[i].connections.splice(con, 1);
								con = cat.questions[i].connections.indexOf(board.target.question.num+1);
							}
							for(var j=0;j<cat.questions[i].connections.length;j++)
								if(cat.questions[i].connections[j]-1>board.target.question.num)
									cat.questions[i].connections[j]--;
						}
						board.lessonNodeArray.splice(board.target.question.num, 1);
						cat.questions.splice(board.target.question.num, 1);
						this.save();
					}
				}
				
			}
			
		}
		else{
			if(this.keyboardState.keyPressed[81]){ // Q - Add Question
				this.addQuestion((this.mouseState.virtualPosition.x+Constants.boardSize.x/2)/Constants.boardSize.x*100,
						(this.mouseState.virtualPosition.y+Constants.boardSize.y/2)/Constants.boardSize.y*100);
			}
		}
	}
	
}

module.exports = game;

},{"../case/category.js":2,"../case/question.js":3,"../helper/drawlib.js":9,"../helper/fileManager.js":10,"../helper/iparDataParser.js":11,"../helper/keyboardState.js":12,"../helper/mouseState.js":13,"../helper/point.js":14,"../helper/utilities.js":15,"../html/popupWindows.js":16,"../menus/popup.js":19,"./board.js":5,"./constants.js":6,"./lessonNode.js":8}],8:[function(require,module,exports){
"use strict";
var DrawLib = require('../helper/drawlib.js');
var Question = require("../case/question.js");
var Constants = require("./constants.js");
var Point = require('../helper/point.js');

var CHECK_IMAGE = "../img/iconPostItCheck.png";

//parameter is a point that denotes starting position
function lessonNode(pQuestion){
    
    this.position = new Point(pQuestion.positionPercentX/100*Constants.boardSize.x, pQuestion.positionPercentY/100*Constants.boardSize.y);
    this.dragLocation = undefined;
    this.mouseOver = false;
    this.dragging = false;
    this.type = "lessonNode";
    this.image = new Image();
    this.check = new Image();
    this.width;
    this.height;
    this.question = pQuestion;
    this.connections = 0;
    this.currentState = 0;
    this.linePercent = 0;
    
    // skip animations for solved
    if (pQuestion.currentState == Question.SOLVE_STATE.SOLVED) this.linePercent = 1;
    
    var that = this;
    //image loading and resizing
    this.image.onload = function() {
        that.width = that.image.naturalWidth;
        that.height = that.image.naturalHeight;
        var maxDimension = Constants.boardSize.x/10;
        //too small?
        if(that.width < maxDimension && that.height < maxDimension){
            var x;
            if(that.width > that.height){
                x = maxDimension / that.width;
            }
            else{
                x = maxDimension / that.height;
            }
            that.width = that.width * x * that.question.scale;
            that.height = that.height * x * that.question.scale;
        }
        if(that.width > maxDimension || that.height > maxDimension){
            var x;
            if(that.width > that.height){
                x = that.width / maxDimension;
            }
            else{
                x = that.height / maxDimension;
            }
            that.width = that.width / x * that.question.scale;
            that.height = that.height / x * that.question.scale;
        }
        
    };
    
    this.image.src = this.question.imageLink;
    this.check.src = CHECK_IMAGE;
}

var p = lessonNode.prototype;

p.draw = function(ctx, canvas){

    //lessonNode.drawLib.circle(ctx, this.position.x, this.position.y, 10, "red");
    //draw the image, shadow if hovered
    ctx.save();
    if(this.dragging) {
    	ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 5;
		canvas.style.cursor = '-webkit-grabbing';
		canvas.style.cursor = '-moz-grabbing';
		canvas.style.cursor = 'grabbing';
    }
    else if(this.mouseOver){
        ctx.shadowColor = 'dodgerBlue';
        ctx.shadowBlur = 5;
        canvas.style.cursor = 'pointer';
    }
    //drawing the button image
    ctx.drawImage(this.image, this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
    
    //drawing the pin
	ctx.fillStyle = "blue";
	ctx.strokeStyle = "cyan";
	var smaller = this.width < this.height ? this.width : this.height;
	ctx.lineWidth = smaller/32;

	ctx.beginPath();
	var nodePoint = this.getNodePoint();
	ctx.arc(nodePoint.x, nodePoint.y, smaller*3/32, 0, 2*Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    
    ctx.restore();
};

p.getNodePoint = function(){
	var smaller = this.width < this.height ? this.width : this.height;
	return new Point(this.position.x - this.width/2 + smaller*3/16, this.position.y - this.height/2 + smaller*3/16);
}

p.click = function(mouseState){
    this.question.displayWindows();
}

p.updateImage = function(){
    this.image.src = this.question.imageLink;
}

p.save = function(){
	this.question.positionPercentX = this.position.x/Constants.boardSize.x*100;
	this.question.positionPercentY = this.position.y/Constants.boardSize.y*100;
	this.question.saveXML();
}

module.exports = lessonNode;

},{"../case/question.js":3,"../helper/drawlib.js":9,"../helper/point.js":14,"./constants.js":6}],9:[function(require,module,exports){
"use strict";

//Module export
var m = module.exports;

m.clear = function(ctx, x, y, w, h) {
    ctx.clearRect(x, y, w, h);
}

m.rect = function(ctx, x, y, w, h, col, centerOrigin) {
    ctx.save();
    ctx.fillStyle = col;
    if(centerOrigin){
        ctx.fillRect(x - (w / 2), y - (h / 2), w, h);
    }
    else{
        ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
}

m.strokeRect = function(ctx, x, y, w, h, line, col, centerOrigin) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = line;
    if(centerOrigin){
        ctx.strokeRect(x - (w / 2), y - (h / 2), w, h);
    }
    else{
        ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
}

m.line = function(ctx, x1, y1, x2, y2, thickness, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

m.circle = function(ctx, x, y, radius, color){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

// http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag 
m.arrow = function(ctx, start, end, headlen, thickness, color){

    var angle = Math.atan2(end.y-start.y, end.x-start.x);
	
    ctx.save();
	ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x-headlen*Math.cos(angle-Math.PI/6), end.y-headlen*Math.sin(angle-Math.PI/6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x-headlen*Math.cos(angle+Math.PI/6), end.y-headlen*Math.sin(angle+Math.PI/6))
    ctx.closePath();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

function boardButton(ctx, position, width, height, hovered){
    //ctx.save();
    if(hovered){
        ctx.fillStyle = "dodgerblue";
    }
    else{
        ctx.fillStyle = "lightblue";
    }
    //draw rounded container
    ctx.rect(position.x - width/2, position.y - height/2, width, height);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.fill();
    //ctx.restore();
}
},{}],10:[function(require,module,exports){
"use strict";
var Category = require("../case/category.js");
var Resource = require("../case/resources.js");
var Utilities = require('./utilities.js');
var Parser = require('./iparDataParser.js');

// Module export
var m = module.exports;

// ********************** LOADING ************************

// load the file entry and parse the xml
m.loadCase = function(caseData, windowDiv) {
    
    this.categories = [];
    this.questions = [];
	
	// Get the xml data
	var xmlData = Utilities.getXml(caseData.caseFile);
	var resources = Parser.getResources(xmlData);
	var categories = Parser.getCategoriesAndQuestions(xmlData, resources, windowDiv);
	var images = [];
	for(var i=0;i<categories.length;i++)
		for(var j=0;j<categories[i].questions.length;j++)
			if(images.indexOf(categories[i].questions[j].imageLink)==-1)
				images.push(categories[i].questions[j].imageLink);
	
	// load the most recent progress from saveFile.ipardata
	var questions = [];
    
	// Get the save data
	var saveData = Utilities.getXml(caseData.saveFile);
	// alert user if there is an error
	if (!saveData) { alert ("ERROR no save data found, or save data was unreadable"); return; }
	// progress
	var stage = saveData.getElementsByTagName("case")[0].getAttribute("caseStatus");
	
	// parse the save data if not new
	if(stage>0){
		for(var file in caseData.submitted){
			if (!caseData.submitted.hasOwnProperty(file)) continue;
			file = file.substr(file.lastIndexOf("/")+1);
			var cat = file.indexOf("-"),
				que = file.indexOf("-", cat+1),
				fil = file.indexOf("-", que+1);
			categories[Number(file.substr(0, cat))].
				questions[Number(file.substr(cat+1, que-cat-1))].
				files[Number(file.substr(que+1, fil-que-1))] = 
					file.substr(file.indexOfAt("-", 3)+1);
		}
		Parser.assignQuestionStates(categories, saveData.getElementsByTagName("question"));
	}
	else
		stage = 1;
	
	// return results
	return {categories: categories, category:stage-1, resources:resources, images:images}; // maybe stage + 1 would be better because they are not zero indexed?
			   
}
					 
// ********************** SAVING ************************

/* here's the general outline of what is happening:
selectSaveLocation was the old way of doing things
now we use createZip
 - when this whole thing starts, we request a file system and save all the entries (directories and files) to the allEntries variable
 - then we get the blobs using readAsBinaryString and store those in an array when we are saving 
  - - could do that on page load to save time later..?
 - anyway, then we - in theory - take the blobs and use zip.file(entry.name, blob) to recreate the structure
 - and finally we download the zip with download()
 
*/

// called when the game is loaded, add onclick to save button that actually does the saving
m.prepareZip = function(saveButton) {
	//var content = zip.generate();
	
	//console.log("prepare zip");
	
	// code from JSZip site
	if (JSZip.support.blob) {
		//console.log("supports blob");
		
		// link download to click
		saveButton.onclick = saveIPAR;
  	}
}

// create IPAR file and download it
function saveIPAR() {
	
	var caseData = JSON.parse(localStorage['caseDataCreate']);
	
	var zip = new JSZip();
	zip.file("caseFile.ipardata", caseData.caseFile);
	zip.file("saveFile.ipardata", caseData.saveFile);
	var submitted = zip.folder('submitted');
	for (var file in caseData.submitted) {
		if (!caseData.submitted.hasOwnProperty(file)) continue;
		var start = caseData.submitted[file].indexOf("base64,")+"base64,".length;
		submitted.file(file, caseData.submitted[file].substr(start), {base64: true});
	}

	
	zip.generateAsync({type:"base64"}).then(function (base64) {
		var a = document.createElement("a");
		a.style.display = 'none';
		a.href = "data:application/zip;base64," + base64;
		a.download = localStorage['caseName'];
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	});
	
}

/***************** CACHING *******************/

m.removeFilesFor = function(caseData, toRemove){

	var questionData = toRemove.board+"-"+toRemove.question+"-";
	for(var file in caseData.submitted){
		if (!caseData.submitted.hasOwnProperty(file) || !file.startsWith(questionData)) continue;
		delete caseData.submitted[file];
	}
	
}

// Adds a submitted file to the local stoarge
m.addNewFilesToSystem = function(caseData, toStore, callback){

	// Used for callback
	var totalCB = 1, curCB = 0;
	var finished = function(){
		if(++curCB>=totalCB){
			callback(caseData);
		}
	}
	
	for(var i=0;i<toStore.files.length;i++){
		(function(){
			var fileReader = new FileReader();
			var filename = toStore.board+"-"+toStore.question+"-"+i+"-"+toStore.files[i].name;
			totalCB++;
			fileReader.onload = function (event) {
				caseData.submitted[filename] =  event.target.result;
				finished();
		    };
		    fileReader.readAsDataURL(toStore.files[i]);
		})();
	}
	
	finished();
}
},{"../case/category.js":2,"../case/resources.js":4,"./iparDataParser.js":11,"./utilities.js":15}],11:[function(require,module,exports){
"use strict";
var Category = require("../case/category.js");
var Resources = require("../case/resources.js");
var Utilities = require('./utilities.js');
var Constants = require('../game/constants.js');
var Question = require('../case/question.js');

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

	var tally = 0; // track total index in nested loop
	
	// all questions
	for (var i=0; i<categories.length; i++) {
		for (var j=0; j<categories[i].questions.length; j++, tally++) {
			// store question  for easy reference
			var q = categories[i].questions[j];
			
			// store tag for easy reference
			var qElem = questionElems[tally];
			
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

m.getResources = function(xmlData){
	var resourceElements = xmlData.getElementsByTagName("resourceList")[0].getElementsByTagName("resource");
	return new Resources(resourceElements, xmlData);
}

// takes the xml structure and fills in the data for the question object
m.getCategoriesAndQuestions = function(xmlData, resources, windowDiv) {
	// if there is a case file
	if (xmlData != null) {
		
		// Get player data 
		firstName = xmlData.getElementsByTagName("case")[0].getAttribute("profileFirst");
		lastName = xmlData.getElementsByTagName("case")[0].getAttribute("profileLast");
		xmlData.getElementsByTagName("case")[0].getAttribute("profileMail");
		
		// Then load the categories
		var categoryElements = xmlData.getElementsByTagName("category");
		var categoryNames = xmlData.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
		var categories = [];
		for (var i=0; i<categoryElements.length; i++) {
			// Load each category (which loads each question)
			categories[parseInt(categoryElements[i].getAttribute("categoryDesignation"))] = new Category(categoryNames[i].innerHTML, categoryElements[i], resources, windowDiv);
		}
		return categories;
	}
	return null
}

// creates a case file for zipping
m.recreateCaseFile = function(boards) {

	// create save file text
	var dataToSave = m.createXMLSaveFile(boards, true);
	
	//if (callback) callback(dataToSave);
	return dataToSave;
	
}

// creates the xml
m.createXMLSaveFile = function(activeIndex, boards, includeNewline) {
	// newline
	var nl;
	includeNewline ? nl = "\n" : nl = "";
	// header
	var output = '<?xml version="1.0" encoding="utf-8"?>' + nl;
	// case data
	output += '<case categoryIndex="3" caseStatus="'+(activeIndex+1)+'" profileFirst="'+ firstName +'" profileLast="' + lastName + '" profileMail="'+ email +'">' + nl;
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
			// handle undefined
			if (!justification) justification = "";
			output += 'justification="' + justification + '" ';
			// animated
			output += 'animated="' + (q.currentState == 2) + '" '; // might have to fix this later
			// linesTranced
			output += 'linesTraced="0" '; // might have to fix this too
			// revealThreshold
			output += 'revealThreshold  ="' + q.revealThreshold  +'" '; // and this
			// positionPercentX
			output += 'positionPercentX="' + Utilities.map(q.positionPercentX, 0, Constants.boardSize.x, 0, 100) + '" ';
			// positionPercentY
			output += 'positionPercentY="' + Utilities.map(q.positionPercentY, 0, Constants.boardSize.y, 0, 100) + '" ';
			
			// tag end
			output += '/>' + nl;
		}
	}
	output += "</questions>" + nl;
	output += "</case>" + nl;
	return output;
}

},{"../case/category.js":2,"../case/question.js":3,"../case/resources.js":4,"../game/constants.js":6,"./utilities.js":15}],12:[function(require,module,exports){
"use strict";

function KeyboardState(game){
	this.key = [];
	this.preKey = [];
	this.keyPressed = [];
	this.keyReleased = [];
    var keyboardState = this;
    window.addEventListener("keydown", function(e){
    	if(game.active)
    		e.preventDefault();
    	keyboardState.key[e.keyCode] = true;
    });
    window.addEventListener("keyup", function(e){
    	if(game.active)
    		e.preventDefault();
    	keyboardState.key[e.keyCode] = false;
    });
}

var p = KeyboardState.prototype;

//Update the mouse to the current state
p.update = function(){

	for(var i=0;i<this.keyPressed.length;i++)
		if(this.keyPressed[i])
			this.keyPressed[i] = false;

	for(var i=0;i<this.keyReleased.length;i++)
		if(this.keyReleased[i])
			this.keyReleased[i] = false;
	
	for(var i=0;i<this.key.length;i++){
		if(this.preKey[i] && !this.key[i])
			this.keyReleased[i] = true;
		if(!this.preKey[i] && this.key[i])
			this.keyPressed[i] = true;
		this.preKey[i] = this.key[i];
	}
}

module.exports = KeyboardState;
},{}],13:[function(require,module,exports){
"use strict";
var Point = require('./point.js');

// private variables
var relativeMousePosition;
var mouseDownTimer, leftMouseClicked, maxClickDuration;
var mouseWheelVal;
var prevTime;
var deltaY;
var scaling, touchZoom, startTouchZoom;

function mouseState(){
	this.mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    this.virtualPosition = new Point(0,0);
    
    // Set variable defaults
    this.mouseDown = false;
    this.mouseIn = false;
    mouseDownTimer = 0;
    deltaY = 0;
    this.mouseWheelDY = 0;
    this.zoomDiff = 0;
    touchZoom = 0;
    this.mouseClicked = false;
    leftMouseClicked = false;
    maxClickDuration = 200;
	
}

var p = mouseState.prototype;

//event listeners for mouse interactions with the canvases
p.addCanvas = function(canvas){
    var mouseState = this;
    canvas.addEventListener("mousemove", function(e){
    	e.preventDefault();
    	mouseState.updatePosition(e);
    });
    canvas.addEventListener("touchmove", function(e){
    	e.preventDefault();
    	if(scaling)
    		mouseState.updateTouchPositions(e);
    	else
    		mouseState.updatePosition(e.touches[0]);
    });
    canvas.addEventListener("mousedown", function(e){
    	e.preventDefault();
    	if (e.which && e.which!=3 || e.button && e.button!=2)
	    	mouseState.mouseDown = true;
    });
    canvas.addEventListener("contextmenu", function(e){
    	leftMouseClicked = true;
    });
    canvas.addEventListener("touchstart", function(e){
    	e.preventDefault();
    	if(e.touches.length == 1 && !scaling){
    		mouseState.updatePosition(e.touches[0]);
	        setTimeout(function(){
	        	mouseState.mouseDown = true;
	        });
    	}
    	else if(e.touches.length == 2){
    		mouseState.mouseDown = false;
    		scaling = true;
    		mouseState.updateTouchPositions(e);
    		startTouchZoom = touchZoom;
    	}
    });
    canvas.addEventListener("mouseup", function(e){
    	e.preventDefault();
    	if (e.which && e.which!=3 || e.button && e.button!=2)
	    	mouseState.mouseDown = false;
    });
    canvas.addEventListener("touchend", function(e){
    	e.preventDefault();
    	if(scaling){
    		scaling = false;
    	    touchZoom = 0;
    	    startTouchZoom = 0;
    	}
    	mouseState.mouseDown = false;
    });
    canvas.addEventListener("mouseover", function(e){
    	mouseState.mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
    	mouseState.mouseIn = false;
    	mouseState.mouseDown = false;
    });
    canvas.addEventListener('mousewheel',function(event){
    	event.preventDefault();
        deltaY += event.deltaY;
    }, false);
}

p.updatePosition = function(e){
    this.mousePosition = new Point(e.clientX, e.clientY);
    relativeMousePosition = new Point(this.mousePosition.x - (window.innerWidth/2.0), this.mousePosition.y - (window.innerHeight/2.0));
}

p.updateTouchPositions = function(e){
	var curTouches = [
	               new Point(e.touches[0].clientX, e.touches[0].clientY),
	               new Point(e.touches[1].clientX, e.touches[1].clientY)
	];
	touchZoom = Math.sqrt(Math.pow(curTouches[0].x-curTouches[1].x, 2)+Math.pow(curTouches[0].y-curTouches[1].y, 2));
}

// Update the mouse to the current state
p.update = function(dt, scale){
    
	// Save the current virtual position from scale
	this.virtualPosition = new Point(relativeMousePosition.x/scale, relativeMousePosition.y/scale);;
	
	// Get the currtenl delta y for the mouse wheel
    this.mouseWheelDY = deltaY;
    deltaY = 0;
	
	// Save the zoom diff and prev zoom
	if(scaling)
		this.zoomDiff = startTouchZoom - touchZoom;
	else
		this.zoomDiff = 0;
    
    // check mouse click
    this.mouseClicked = false;
    if (this.mouseDown)
    	mouseDownTimer += dt;
    else{
    	if (mouseDownTimer > 0 && mouseDownTimer < maxClickDuration)
    		this.mouseClicked = true;
    	mouseDownTimer = 0;
    }
    
    this.prevMouseDown = this.mouseDown;
    this.hasTarget = false;
    
}

p.leftMouseClicked = function() {
	var temp = leftMouseClicked;
	leftMouseClicked = false;
	return temp;
}

module.exports = mouseState;
},{"./point.js":14}],14:[function(require,module,exports){
"use strict";
function Point(pX, pY){
    this.x = pX;
    this.y = pY;
}

var p = Point.prototype;

p.add = function(pX, pY){
	if(pY)
		return new Point(this.x+pX, this.y+pY);
	else
		return new Point(this.x+pX.x, this.y+pX.y);
}

p.mult = function(pX, pY){
	if(pY)
		return new Point(this.x*pX, this.y*pY);
	else
		return new Point(this.x*pX.x, this.y*pX.y);
}

p.scale = function(scale){
	return new Point(this.x*scale, this.y*scale);
}

module.exports = Point;
},{}],15:[function(require,module,exports){
"use strict";
var Point = require('./point.js');

//Module export
var m = module.exports;

// returns mouse position in local coordinate system of element
m.getMouse = function(e){
    return new Point((e.pageX - e.target.offsetLeft), (e.pageY - e.target.offsetTop));
}

//returns a value relative to the ratio it has with a specific range "mapped" to a different range
m.map = function(value, min1, max1, min2, max2){
    return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
}

//if a value is higher or lower than the min and max, it is "clamped" to that outer limit
m.clamp = function(value, min, max){
    return Math.max(min, Math.min(max, value));
}

//determines whether the mouse is intersecting the area
m.mouseIntersect = function(pMouseState, area, pOffsetter){
    if(pMouseState.virtualPosition.x > area.position.x - area.width/2 - pOffsetter.x && pMouseState.virtualPosition.x < area.position.x + area.width/2 - pOffsetter.x &&
    		pMouseState.virtualPosition.y > area.position.y - area.height/2 - pOffsetter.y && pMouseState.virtualPosition.y < area.position.y + area.height/2 - pOffsetter.y)
            return true;
    else
    	return false;
}

//determines whether the mouse is intersecting the area around the given area and at what side (result is side n - north, w - west, s - south, e - east, nw - northwest, etc.)
m.mouseIntersectEdge = function(pMouseState, area, outline, pOffsetter){
	var bounds = {left: area.position.x - area.width/2 - pOffsetter.x,
					right: area.position.x + area.width/2 - pOffsetter.x,
					top: area.position.y - area.height/2 - pOffsetter.y,
					bottom: area.position.y + area.height/2 - pOffsetter.y};
    if (pMouseState.virtualPosition.x > bounds.left - outline && pMouseState.virtualPosition.x < bounds.right + outline &&
    		pMouseState.virtualPosition.y > bounds.top - outline && pMouseState.virtualPosition.y < bounds.bottom + outline){
    	var side = '';
    	if(pMouseState.virtualPosition.y <= bounds.top)
    		side += 'n';
    	if(pMouseState.virtualPosition.y >= bounds.bottom)
    		side += 's';
    	if(pMouseState.virtualPosition.x <= bounds.left)
    		side += 'w';
    	if(pMouseState.virtualPosition.x >= bounds.right)
    		side += 'e';
    	if(side!=1)
    		return side
    }
    return null;
}


// gets the xml object of a string
m.getXml = function(xml){
	
	// Clean up the xml
	xml = xml.trim();
	while(xml.charCodeAt(0)<=32)
		xml = xml.substr(1);
	xml = xml.trim();
	
	var xmlDoc;
	if (window.DOMParser){
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(xml, "text/xml");
	}
	else{ // IE
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(xml);
	}
	return xmlDoc;
}

// gets the scale of the first parameter to the second (with the second fitting inside the first)
m.getScale = function(virtual, actual){
	return actual.y/virtual.x*virtual.y < actual.x ? actual.y/virtual.y : actual.x/virtual.x;
}

m.replaceAll = function (str, target, replacement) {
	while (str.indexOf(target) > -1) {
		str = str.replace(target,replacement);
	}
	return str;
}

// Gets the index of the nth search string (starting at 1, 0 will always return 0)
String.prototype.indexOfAt = function(search, num){
	var curIndex = 0;
	for(var i=0;i<num && curIndex!=-1;i++)
		curIndex = this.indexOf(search, curIndex+1);
	return curIndex;
}

},{"./point.js":14}],16:[function(require,module,exports){

var m = module.exports;

m.editInfo = '\
<div class="window popup">\
	<div class="title">\
		Case Info\
	</div>\
	<div class="windowContent" style="min-height:35vh;">\
		<form onsubmit="return false;">\
			<b>Name</b><br>\
			<input name="caseName" value="%caseName%"><br>\
			<b>Description</b><br>\
		 	<p><div class="text-box large" contenteditable>%description%</div></p>\
			<b>Conclusion</b><br>\
	 		<p><div class="text-box large" contenteditable>%conclusion%</div></p>\
			<button class="halfButton">Back</button><button class="halfButton">Apply Changes</button>\
		</form>\
	</div>\
</div>\
';

m.resourcesWindow = '\
<div class="window popup">\
	<div class="title">\
		Resources\
	</div>\
	<div class="windowContent">\
		<div class="resourceContent" style="overflow-y:scroll;height:35vh;">\
		</div>\
		<br>\
		<button class="halfButton">Back</button><button class="halfButton">Create New Resources</button>\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%" class="icon"/>\
  <img src="../img/iconClose.png" class="delete"/>\
  <img src="../img/iconTools.png" class="edit"/>\
  <div class="resourceText">%title%\
  <br>\
  <span style="color:gray;">%link%</span></div>\
</div>\
';

m.resourceEditor = '\
<div class="window popup">\
	<div class="title">\
		%edit% Resource\
	</div>\
	<div class="windowContent">\
		<form onsubmit="return false;">\
			<select name="type" class="full">\
				<option value="0">File Refrence</option>\
				<option value="1">Web Link</option>\
				<option value="2">Video Link</option>\
			</select>\
			<b>Display Name</b><br>\
			<input name="name" value="%name%"><br>\
			<b class="addressTag">Link Address</b><br>\
			<input class="address" name="link" value="%link%">\
			<button class="halfButton">Choose File</button><button class="halfButton">View File</button>\
			<span class="addressInfo"></span>\
		</form>\
		<br>\
		<button class="halfButton">Cancel</button><button class="halfButton">%apply%</button>\
	</div>\
</div>\
';

m.textInput = '\
<div class="window popup">\
	<div class="title">\
		%title%\
	</div>\
	<div class="windowContent">\
		<form onsubmit="return false;">\
			<b>%prompt%</b><br>\
			<input name="text" value="%value%"><br>\
		</form>\
		<br>\
		<button class="halfButton">Cancel</button><button class="halfButton">%apply%</button>\
	</div>\
</div>\
';

m.imagesEditor = '\
<div class="window images">\
	<div class="title">\
		Images\
	</div>\
	<div class="windowContent">\
		<div class="imageContent">\
		</div>\
		<br>\
		<input type="file" style="display:none;"/>\
		<button class="thirdButton">Close</button><button class="thirdButton">Upload Image</button><button class="thirdButton">Import Image</button>\
	</div>\
</div>\
';

m.image = '\
<div class="image">\
	<img src=%image% />\
	<img src="../img/iconClose.png" class="delete"/>\
</div>\
';
},{}],17:[function(require,module,exports){

var m = module.exports;

m.taskWindow = '\
<div class="window">\
	<div class="title">\
		Task\
	</div>\
	<div class="windowContent" style="overflow-y: scroll;height:30vh;">\
		<h3><b>Question Name</b></h3>\
		<h3><b><div class="text-box" contenteditable>%title%</div></b></h3><br>\
		<p>Instructions</p>\
		<p><div class="text-box large" contenteditable>%instructions%</div></p>\
		<hr>\
		<p><b>Question</b></p>\
		<p><b><div class="text-box large" contenteditable>%question%</div></b></p>\
	</div>\
</div>\
';


m.resourceWindow = '\
<div class="window">\
	<div class="title">\
		Resource\
	</div>\
	<div class="windowContent" style="overflow-y: scroll; height:20vh;">\
		<div class="resourceContent">\
		</div>\
		<br>\
		<button class="full">Add Resource</button>\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%" class="icon"/>\
  <img src="../img/iconClose.png" class="delete"/>\
  <div class="resourceText">%title%</div>\
  <a href="%link%" target="_blank">\
    <div class="center">\
      Open\
      <img src="../img/iconLaunch.png"/>\
    </div>\
  </a>\
</div>\
';

m.answerWindow = '\
<div class="window right">\
	<div class="title">\
		Answers\
	</div>\
	<div class="windowContent" style="min-height:20vh;">\
		<select>\
			<option value="2">2</option>\
			<option value="3">3</option>\
			<option value="4">4</option>\
			<option value="5">5</option>\
		</select>\
		answers. Select correct answer with radio button.\
		<form onsubmit="return false;">\
		\
		</form>\
	</div>\
</div>\
';

m.answer ='\
<input type="radio" name="answer" value="%num%" class="answerRadio">\
<div class="answerInputs">\
	<b>Choice %num%</b><br>\
	<input name="answer%num%" value="%answer%"><br>\
	Feedback<br>\
	<input name="feedback%num%" value="%feedback%"><br>\
</div>\
';

m.messageWindow = '\
<div class="window">\
	<div class="title">\
		Message\
	</div>\
	<div class="windowContent" style="height:60vh;overflow-y:scroll;">\
		<p><b>From </b>\
		<div class="text-box" contenteditable>%title%</div></p>\
		<hr>\
		<p><b>Subject </b>\
		<div class="text-box" contenteditable>%instructions%</div></p>\
		<hr>\
		<p>Message</p>\
		<p><div class="text-box tall" contenteditable>%question%</div></p>\
	</div>\
</div>\
';

m.questionTypeWindow = '\
<div class="window">\
	<div class="title">\
		Question Type\
	</div>\
	<div class="windowContent">\
		<select class="full">\
			<option value="1">Justification Multiple Choice</option>\
			<option value="2">Standard Multiple Choice</option>\
			<option value="3">Short Response</option>\
			<option value="4">File Submisson</option>\
			<option value="5">Message</option>\
		</select>\
		<button class="imageButton">\
		  <div><img src="../img/placeholder.png"/></div>\
		  <div> Select Image </div>\
		</button>\
	</div>\
	<div class="windowButtons">\
		<button>Save</button>\
	</div>\
</div>\
';
},{}],18:[function(require,module,exports){
var Utilities = require('../helper/utilities.js');

// HTML
var section;

//Elements
var nameInput, descriptionInput, cat1Input;
var create, back;

// The cur case
var caseFile;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, TITLE: 1, BOARD: 2});

function CreateMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	nameInput = document.querySelector('#'+section.id+' #input-name');
	descriptionInput = document.querySelector('#'+section.id+' #input-description');
	conclusionInput = document.querySelector('#'+section.id+' #input-conclusion');
	cat1Input = document.querySelector('#'+section.id+' #input-cat1');
	create = document.querySelector('#'+section.id+' #create-button');
	back = document.querySelector('#'+section.id+' #back-button');
    
	// Setup the buttons
	back.onclick = function(){
    	page.next = NEXT.TITLE;
    	page.close();
    };
	var page = this;
    create.onclick = function(){
    	
    	page.next = NEXT.BOARD;
    	create.disabled = true;
    	back.disabled = true;
    	
    	var request = new XMLHttpRequest();
    	request.responseType = "arraybuffer";
    	request.onreadystatechange = function() {
    	  if (request.readyState == 4 && request.status == 200) {
    		  	
    			// Create a worker for unzipping the file
    			var zipWorker = new Worker("../lib/unzip.js");
    			zipWorker.onmessage = function(message) {
    				
    				// Get the case
    				var caseData = message.data;
    				var caseFile = Utilities.getXml(caseData.caseFile);
    		    	
    		    	// Set the inputs to the current case
    		    	var curCase = caseFile.getElementsByTagName("case")[0];
    		    	curCase.setAttribute('caseName', nameInput.value);
    		    	curCase.setAttribute('description', descriptionInput.innerHTML);
    		    	curCase.setAttribute('conclusion', conclusionInput.innerHTML);
    		    	var catList = curCase.getElementsByTagName('categoryList')[0];
    		    	catList.setAttribute('categoryCount', '1');
    		    	catList.innerHTML = '<element>'+cat1Input.value+'</element>';
    		    	var cat1 = caseFile.createElement('category');
    		    	cat1.setAttribute('categoryDesignation', '0');
    		    	cat1.setAttribute('questionCount', '0');
    		    	curCase.appendChild(cat1);
    		    	
    		    	// Save the changes to local storage
    		    	localStorage['caseName'] = nameInput.value+".ipar";
    		    	caseData.caseFile = new XMLSerializer().serializeToString(caseFile);
    				localStorage['caseDataCreate'] = JSON.stringify(caseData);

    		    	page.close();
    		    	
    			}
    			
    			// Start the worker
    			zipWorker.postMessage(request.response);
    	  }
    	};
    	request.open("GET", "base.ipar", true);
    	request.send();
    };
}

var p = CreateMenu.prototype;

p.open = function(){
	
	// Make the menu visible
	section.style.display = '';

	// Make it so that create is disabled until you at least have a name and 1st cat
	var checkProceed = function(){
		if(nameInput.value=="" ||
			cat1Input.value=="")
			create.disabled = true;
		else
			create.disabled = false;
	};
	nameInput.addEventListener('change', checkProceed);
	cat1Input.addEventListener('change', checkProceed);
	checkProceed();
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = CreateMenu;
module.exports.NEXT = NEXT;
},{"../helper/utilities.js":15}],19:[function(require,module,exports){
var Windows = require('../html/popupWindows.js');

var m = module.exports;

m.editInfo = function(windowDiv, caseFile, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.editInfo;
    var editInfo = tempDiv.firstChild;
    
    // Fill it with the given info
    var caseInfo = caseFile.getElementsByTagName("case")[0];
    editInfo.innerHTML = editInfo.innerHTML.replace(/%caseName%/g, caseInfo.getAttribute("caseName")).replace(/%description%/g, caseInfo.getAttribute("description")).replace(/%conclusion%/g, caseInfo.getAttribute("conclusion"));
    
    // Setup the buttons
    var buttons = editInfo.getElementsByTagName("button");
    buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback(caseFile, caseInfo.getAttribute("caseName"));
    }
    buttons[1].onclick = function(){
    	windowDiv.innerHTML = '';
    	var form = editInfo.getElementsByTagName("form")[0];
    	var divs = form.getElementsByTagName("div");
    	caseInfo.setAttribute("caseName", form.elements["caseName"].value);
    	caseInfo.setAttribute("description", divs[0].innerHTML);
    	caseInfo.setAttribute("conclusion", divs[1].innerHTML);
    	callback(caseFile, form.elements["caseName"].value);
    }

    // Display the window
    windowDiv.innerHTML = '';
    windowDiv.appendChild(editInfo);
    
    
}

m.prompt = function(windowDiv, title, prompt, defaultValue, applyText, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.textInput;
    var promptWindow = tempDiv.firstChild;
    
    // Fill it with the given info
    promptWindow.innerHTML = promptWindow.innerHTML.replace(/%title%/g, title).replace(/%prompt%/g, prompt).replace(/%value%/g, defaultValue).replace(/%apply%/g, applyText);
    
    // Setup the buttons
    var buttons = promptWindow.getElementsByTagName("button");
    buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback();
    }
    buttons[1].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback(promptWindow.getElementsByTagName("form")[0].elements["text"].value);
    }

    // Display the window
    windowDiv.innerHTML = '';
    windowDiv.appendChild(promptWindow);
	
}
},{"../html/popupWindows.js":16}],20:[function(require,module,exports){

// HTML
var section;

// Parts of the html
var loadInput, loadButton, createButton, continueButton, menuButton;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, BOARD: 1, CREATE: 2});

function TitleMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the load button and input
	loadInput = document.querySelector('#'+section.id+' #load-input');
	loadButton = document.querySelector('#'+section.id+' #load-button');
	createButton = document.querySelector('#'+section.id+' #create-button');
	continueButton = document.querySelector('#'+section.id+' #continue-button');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	createButton.onclick = this.create.bind(this);
	loadButton.onclick = function(){
		if(localStorage['caseDataCreate'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
			return;
		loadInput.click();
	}
	loadInput.onchange = this.loadFile.bind(this);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "../index.html";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Setup continue button based on local stoarge
	if(localStorage['caseDataCreate'])
		continueButton.disabled = false;
	else
		continueButton.disabled = true;
	this.next = NEXT.BOARD;
	
	// Set the button to not disabled in case coming back to this menu
	loadButton.disabled = false;
	loadInput.disabled = false;
	menuButton.disabled = false;
	createButton.disabled = false;
	
}

p.create = function(){

	if(localStorage['caseDataCreate'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
	
	// go to the next page
	this.next = NEXT.CREATE;
	this.close();
	
}

p.loadFile = function(event){
	
	// Make sure a ipar file was choosen
	if(!loadInput.value.endsWith("ipar")){
		alert("You didn't choose an ipar file! you can only load ipar files!");
		return;
	}
	localStorage['caseName'] = event.target.files[0].name;

	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	menuButton.disabled = true;
	createButton.disabled = true;
	continueButton.disabled = true;
	
	// Create a reader and read the zip
	var page = this;
	var reader = new FileReader();
	reader.onload = function(event){
	
		// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
		localStorage.setItem("autosave","");
		
		// Create a worker for unzipping the file
		var zipWorker = new Worker("lib/unzip.js");
		zipWorker.onmessage = function(message) {
			
			// Save the base url to local storage
			localStorage['caseDataCreate'] = JSON.stringify(message.data);
			
			// Redirect to the next page
			page.next = NEXT.BOARD;
			page.close();
			
		}
		
		// Start the worker
		zipWorker.postMessage(event.target.result);
		
	};
	reader.readAsArrayBuffer(event.target.files[0]);
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = TitleMenu;
module.exports.NEXT = NEXT;
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlZGl0b3IvanMvbWFpbi5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2Nhc2UvY2F0ZWdvcnkuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9jYXNlL3F1ZXN0aW9uLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvY2FzZS9yZXNvdXJjZXMuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2JvYXJkLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvZ2FtZS9jb25zdGFudHMuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2dhbWUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2xlc3Nvbk5vZGUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvZHJhd2xpYi5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9maWxlTWFuYWdlci5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9pcGFyRGF0YVBhcnNlci5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9rZXlib2FyZFN0YXRlLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvaGVscGVyL21vdXNlU3RhdGUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvcG9pbnQuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvdXRpbGl0aWVzLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvaHRtbC9wb3B1cFdpbmRvd3MuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9odG1sL3F1ZXN0aW9uV2luZG93cy5qcyIsImVkaXRvci9qcy9tb2R1bGVzL21lbnVzL2NyZWF0ZU1lbnUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9tZW51cy9wb3B1cC5qcyIsImVkaXRvci9qcy9tb2R1bGVzL21lbnVzL3RpdGxlTWVudS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2haQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzN1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4gfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbjtcclxuXHJcbi8vaW1wb3J0c1xyXG52YXIgR2FtZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9nYW1lL2dhbWUuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2hlbHBlci9wb2ludC5qcycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dhbWUvY29uc3RhbnRzLmpzJyk7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG52YXIgVGl0bGVNZW51ID0gcmVxdWlyZSgnLi9tb2R1bGVzL21lbnVzL3RpdGxlTWVudS5qcycpO1xyXG52YXIgQ3JlYXRlTWVudSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tZW51cy9jcmVhdGVNZW51LmpzJyk7XHJcblxyXG4vLyBUaGUgY3VycmVudCBnYW1lXHJcbnZhciBnYW1lO1xyXG5cclxuLy8gVGhlIHNlY3Rpb24gaG9sZGluZyB0aGUgYm9hcmRcclxudmFyIGJvYXJkU2VjdGlvbjtcclxuXHJcbi8vIFRoZSBjdXJyZW50IHBhZ2UgdGhlIHdlYnNpdGUgaXMgb25cclxudmFyIGN1clBhZ2U7XHJcbnZhciBtZW51cyA9IFtdO1xyXG52YXIgUEFHRSA9IE9iamVjdC5mcmVlemUoe1RJVExFOiAwLCBDUkVBVEU6IDEsIEJPQVJEOiAyfSk7XHJcblxyXG4vL2ZpcmVzIHdoZW4gdGhlIHdpbmRvdyBsb2Fkc1xyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oZSl7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBzZWN0aW9uc1xyXG5cdGJvYXJkU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRcIik7XHJcblx0XHJcblx0Ly8gU2V0dXAgdGl0bGUgbWVudVxyXG5cdG1lbnVzW1BBR0UuVElUTEVdID0gbmV3IFRpdGxlTWVudShkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRpdGxlTWVudVwiKSk7XHJcblx0bWVudXNbUEFHRS5USVRMRV0ub25jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRzd2l0Y2godGhpcy5uZXh0KXtcclxuXHRcdGNhc2UgVGl0bGVNZW51Lk5FWFQuQk9BUkQ6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLkJPQVJEO1xyXG5cdFx0XHRjcmVhdGVDYXNlKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSBUaXRsZU1lbnUuTkVYVC5DUkVBVEU6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLkNSRUFURTtcclxuXHRcdFx0bWVudXNbY3VyUGFnZV0ub3BlbigpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblxyXG5cdC8vIFNldHVwIGNyZWF0ZSBtZW51XHJcblx0bWVudXNbUEFHRS5DUkVBVEVdID0gbmV3IENyZWF0ZU1lbnUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcmVhdGVNZW51XCIpKTtcclxuXHRtZW51c1tQQUdFLkNSRUFURV0ub25jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRzd2l0Y2godGhpcy5uZXh0KXtcclxuXHRcdGNhc2UgQ3JlYXRlTWVudS5ORVhULkJPQVJEOlxyXG5cdFx0XHRjdXJQYWdlID0gUEFHRS5CT0FSRDtcclxuXHRcdFx0Y3JlYXRlQ2FzZSgpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgQ3JlYXRlTWVudS5ORVhULlRJVExFOlxyXG5cdFx0XHRjdXJQYWdlID0gUEFHRS5USVRMRTtcclxuXHRcdFx0bWVudXNbY3VyUGFnZV0ub3BlbigpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0Ly8gT3BlbiB0aGUgdGl0bGUgbWVudVxyXG4gICAgY3VyUGFnZSA9IFBBR0UuVElUTEU7XHJcbiAgICBtZW51c1tQQUdFLlRJVExFXS5vcGVuKCk7XHJcbiAgICBcclxufVxyXG5cclxuLy8gY3JlYXRlIHRoZSBnYW1lIG9iamVjdCBhbmQgc3RhcnQgdGhlIGxvb3Agd2l0aCBhIGR0XHJcbmZ1bmN0aW9uIGNyZWF0ZUNhc2UoKXtcclxuXHQvLyBTaG93IHRoZSBzZWN0aW9uIGZvciB0aGUgZ2FtZVxyXG5cdGJvYXJkU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcclxuICAgIC8vIENyZWF0ZSB0aGUgZ2FtZVxyXG4gICAgZ2FtZSA9IG5ldyBHYW1lKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRcIiksIFV0aWxpdGllcy5nZXRTY2FsZShDb25zdGFudHMuYm9hcmRTaXplLCBuZXcgUG9pbnQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCkpKTtcclxuICAgIFxyXG4gICAgLy8gU3RhcnQgdGhlIGdhbWUgbG9vcFxyXG4gICAgZ2FtZUxvb3AoRGF0ZS5ub3coKSk7XHJcbiAgICBcclxufVxyXG5cclxuLy9maXJlcyBvbmNlIHBlciBmcmFtZSBmb3IgdGhlIGdhbWVcclxuZnVuY3Rpb24gZ2FtZUxvb3AocHJldlRpbWUpe1xyXG4gICAgXHJcbiAgICAvLyB1cGRhdGUgZ2FtZVxyXG4gICAgZ2FtZS51cGRhdGUoRGF0ZS5ub3coKSAtIHByZXZUaW1lKTtcclxuICAgIFxyXG5cdC8vIGxvb3BcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZ2FtZUxvb3AuYmluZCh0aGlzLCBEYXRlLm5vdygpKSk7XHJcbiAgICBcclxufVxyXG5cclxuLy9saXN0ZW5zIGZvciBjaGFuZ2VzIGluIHNpemUgb2Ygd2luZG93IGFuZCBzY2FsZXMgdGhlIGdhbWUgYWNjb3JkaW5nbHlcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHJcblx0Ly8gU2NhbGUgdGhlIGdhbWUgdG8gdGhlIG5ldyBzaXplXHJcblx0aWYoY3VyUGFnZT09UEFHRS5CT0FSRClcclxuXHRcdGdhbWUuc2V0U2NhbGUoVXRpbGl0aWVzLmdldFNjYWxlKENvbnN0YW50cy5ib2FyZFNpemUsIG5ldyBQb2ludCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KSkpO1xyXG5cdFxyXG59KTtcclxuXHJcbi8vIExpc3RlbiBmb3IgdG91Y2ggZm9yIGZ1bGxzY3JlZW4gd2hpbGUgaW4gZ2FtZSBvbiBtb2JpbGVcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihldmVudCl7XHJcblx0XHJcblx0aWYoY3VyUGFnZT09UEFHRS5CT0FSRCAmJiB3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjBweClcIikpXHJcblx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcclxufSwgZmFsc2UpO1xyXG5cclxuLy8gU3RvcCB0aGUgZGVmYXVsdCBjb250ZXh0IG1lbnUgZnJvbSB3b3JraW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgZnVuY3Rpb24oZSl7XHJcblx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG59KTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XHJcblxyXG4vLyBDcmVhdGVzIGEgY2F0ZWdvcnkgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgZnJvbSB0aGUgZ2l2ZW4geG1sXHJcbmZ1bmN0aW9uIENhdGVnb3J5KG5hbWUsIHhtbCwgcmVzb3VyY2VzLCB3aW5kb3dEaXYpe1xyXG5cdFxyXG5cdC8vIFNhdmUgdGhlIG5hbWVcclxuXHR0aGlzLm5hbWUgPSBuYW1lO1xyXG5cdFxyXG5cdC8vIExvYWQgYWxsIHRoZSBxdWVzdGlvbnNcclxuXHR2YXIgcXVlc3Rpb25FbGVtZW50cyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcclxuXHR0aGlzLnF1ZXN0aW9ucyA9IFtdO1xyXG5cdC8vIGNyZWF0ZSBxdWVzdGlvbnNcclxuXHRmb3IgKHZhciBpPTA7IGk8cXVlc3Rpb25FbGVtZW50cy5sZW5ndGg7IGkrKykgXHJcblx0e1xyXG5cdFx0Ly8gY3JlYXRlIGEgcXVlc3Rpb24gb2JqZWN0XHJcblx0XHR0aGlzLnF1ZXN0aW9uc1tpXSA9IG5ldyBRdWVzdGlvbihxdWVzdGlvbkVsZW1lbnRzW2ldLCByZXNvdXJjZXMsIHdpbmRvd0RpdiwgaSk7XHJcblx0fVxyXG4gICAgXHJcbn1cclxuXHJcbnZhciBwID0gQ2F0ZWdvcnkucHJvdG90eXBlO1xyXG5cclxucC54bWwgPSBmdW5jdGlvbih4bWxEb2MsIGNhdERlcyl7XHJcblx0dmFyIHhtbCA9IHhtbERvYy5jcmVhdGVFbGVtZW50KFwiY2F0ZWdvcnlcIik7XHJcblx0eG1sLnNldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIiwgY2F0RGVzKTtcclxuXHR4bWwuc2V0QXR0cmlidXRlKFwicXVlc3Rpb25Db3VudFwiLCB0aGlzLnF1ZXN0aW9ucy5sZW5ndGgpO1xyXG5cdGZvciAodmFyIGk9MDsgaTx0aGlzLnF1ZXN0aW9ucy5sZW5ndGg7IGkrKykgXHJcblx0XHR4bWwuYXBwZW5kQ2hpbGQodGhpcy5xdWVzdGlvbnNbaV0ueG1sKTtcclxuXHRyZXR1cm4geG1sO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhdGVnb3J5OyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vZ2FtZS9jb25zdGFudHMuanMnKTtcclxudmFyIFdpbmRvd3MgPSByZXF1aXJlKCcuLi9odG1sL3F1ZXN0aW9uV2luZG93cy5qcycpO1xyXG52YXIgUG9wdXAgPSByZXF1aXJlKCcuLi9tZW51cy9wb3B1cC5qcycpO1xyXG52YXIgUG9wdXBXaW5kb3dzID0gcmVxdWlyZSgnLi4vaHRtbC9wb3B1cFdpbmRvd3MuanMnKTtcclxuXHJcbnZhciBTT0xWRV9TVEFURSA9IE9iamVjdC5mcmVlemUoe0hJRERFTjogMCwgVU5TT0xWRUQ6IDEsIFNPTFZFRDogMn0pO1xyXG52YXIgUVVFU1RJT05fVFlQRSA9IE9iamVjdC5mcmVlemUoe0pVU1RJRklDQVRJT046IDEsIE1VTFRJUExFX0NIT0lDRTogMiwgU0hPUlRfUkVTUE9OU0U6IDMsIEZJTEU6IDQsIE1FU1NBR0U6IDV9KTtcclxuXHJcbi8qIFF1ZXN0aW9uIHByb3BlcnRpZXM6XHJcbmN1cnJlbnRTdGF0ZTogU09MVkVfU1RBVEVcclxud2luZG93RGl2OiBlbGVtZW50XHJcbmNvcnJlY3Q6IGludFxyXG5wb3NpdGlvblBlcmNlbnRYOiBmbG9hdFxyXG5wb3NpdGlvblBlcmNlbnRZOiBmbG9hdFxyXG5yZXZlYWxUaHJlc2hvbGQ6IGludFxyXG5pbWFnZUxpbms6IHN0cmluZ1xyXG5mZWVkYmFja3M6IHN0cmluZ1tdXHJcbmNvbm5lY3Rpb25FbGVtZW50czogZWxlbWVudFtdXHJcbmNvbm5lY3Rpb25zOiBpbnRbXVxyXG5xdWVzdGlvblR5cGU6IFNPTFZFX1NUQVRFXHJcbmp1c3RpZmljYXRpb246IHN0cmluZ1xyXG53cm9uZ0Fuc3dlcjogc3RyaW5nXHJcbmNvcnJlY3RBbnN3ZXI6IHN0cmluZ1xyXG4qL1xyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBRdWVzdGlvbih4bWwsIHJlc291cmNlcywgd2luZG93RGl2LCBudW0pe1xyXG5cdFxyXG5cdC8vIFNldCB0aGUgY3VycmVudCBzdGF0ZSB0byBkZWZhdWx0IGF0IGhpZGRlbiBhbmQgc3RvcmUgdGhlIHdpbmRvdyBkaXZcclxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuSElEREVOO1xyXG4gICAgdGhpcy53aW5kb3dEaXYgPSB3aW5kb3dEaXY7XHJcbiAgICB0aGlzLm51bSA9IG51bTtcclxuICAgIHRoaXMueG1sID0geG1sO1xyXG4gICAgdGhpcy5yZXNvdXJjZXMgPSByZXNvdXJjZXM7XHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaCgpO1xyXG4gICAgXHJcbn1cclxuXHJcbnZhciBwID0gUXVlc3Rpb24ucHJvdG90eXBlO1xyXG5cclxucC5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gR2V0IGFuZCBzYXZlIHRoZSBnaXZlbiBpbmRleCwgY29ycmVjdCBhbnN3ZXIsIHBvc2l0aW9uLCByZXZlYWwgdGhyZXNob2xkLCBpbWFnZSBsaW5rLCBmZWVkYmFjaywgYW5kIGNvbm5lY3Rpb25zXHJcbiAgICB0aGlzLmNvcnJlY3QgPSBwYXJzZUludCh0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJjb3JyZWN0QW5zd2VyXCIpKTtcclxuICAgIHRoaXMucG9zaXRpb25QZXJjZW50WCA9IE51bWJlcih0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJ4UG9zaXRpb25QZXJjZW50XCIpKTtcclxuICAgIHRoaXMucG9zaXRpb25QZXJjZW50WSA9IE51bWJlcih0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJ5UG9zaXRpb25QZXJjZW50XCIpKTtcclxuICAgIHRoaXMucmV2ZWFsVGhyZXNob2xkID0gcGFyc2VJbnQodGhpcy54bWwuZ2V0QXR0cmlidXRlKFwicmV2ZWFsVGhyZXNob2xkXCIpKTtcclxuICAgIC8vY29uc29sZS5sb2coeG1sKTtcclxuICAgIHRoaXMuaW1hZ2VMaW5rID0gdGhpcy54bWwuZ2V0QXR0cmlidXRlKFwiaW1hZ2VMaW5rXCIpO1xyXG4gICAgdGhpcy5mZWVkYmFja3MgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZlZWRiYWNrXCIpO1xyXG4gICAgdmFyIHNjYWxlID0gdGhpcy54bWwuZ2V0QXR0cmlidXRlKFwic2NhbGVcIik7XHJcbiAgICBpZihzY2FsZT09PVwiXCIgfHwgIXNjYWxlKVxyXG4gICAgXHR0aGlzLnNjYWxlID0gMTtcclxuICAgIGVsc2VcclxuICAgIFx0dGhpcy5zY2FsZSA9IE51bWJlcihzY2FsZSk7XHJcbiAgICB0aGlzLnNhdmUgPSBmYWxzZTtcclxuICAgIHZhciBjb25uZWN0aW9uRWxlbWVudHMgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvbm5lY3Rpb25zXCIpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IFtdO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjb25uZWN0aW9uRWxlbWVudHMubGVuZ3RoO2krKylcclxuICAgIFx0dGhpcy5jb25uZWN0aW9uc1tpXSA9IHBhcnNlSW50KGNvbm5lY3Rpb25FbGVtZW50c1tpXS5pbm5lckhUTUwpO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdGhlIHdpbmRvd3MgZm9yIHRoaXMgcXVlc3Rpb24gYmFzZWQgb24gdGhlIHF1ZXN0aW9uIHR5cGVcclxuICAgIHRoaXMucXVlc3Rpb25UeXBlID0gcGFyc2VJbnQodGhpcy54bWwuZ2V0QXR0cmlidXRlKFwicXVlc3Rpb25UeXBlXCIpKTtcclxuICAgIHRoaXMuY3JlYXRlV2luZG93cygpO1xyXG5cdHRoaXMuY3JlYXRlVHlwZVdpbmRvdygpO1xyXG59XHJcblxyXG5wLnNhdmVYTUwgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMueG1sLnNldEF0dHJpYnV0ZShcInhQb3NpdGlvblBlcmNlbnRcIiwgdGhpcy5wb3NpdGlvblBlcmNlbnRYKTtcclxuXHR0aGlzLnhtbC5zZXRBdHRyaWJ1dGUoXCJ5UG9zaXRpb25QZXJjZW50XCIsIHRoaXMucG9zaXRpb25QZXJjZW50WSk7XHJcblx0dGhpcy54bWwuc2V0QXR0cmlidXRlKFwicmV2ZWFsVGhyZXNob2xkXCIsIHRoaXMucmV2ZWFsVGhyZXNob2xkKTtcclxuXHR0aGlzLnhtbC5zZXRBdHRyaWJ1dGUoXCJzY2FsZVwiLCB0aGlzLnNjYWxlKTtcclxuXHR0aGlzLnhtbC5zZXRBdHRyaWJ1dGUoXCJjb3JyZWN0QW5zd2VyXCIsIHRoaXMuY29ycmVjdCk7XHJcblx0dGhpcy54bWwuc2V0QXR0cmlidXRlKFwicXVlc3Rpb25UeXBlXCIsIHRoaXMucXVlc3Rpb25UeXBlKTtcclxuXHR2YXIgY29ubmVjdGlvbkVsZW1lbnQgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvbm5lY3Rpb25zXCIpWzBdO1xyXG5cdHdoaWxlKGNvbm5lY3Rpb25FbGVtZW50IT1udWxsKXtcclxuXHRcdHRoaXMueG1sLnJlbW92ZUNoaWxkKGNvbm5lY3Rpb25FbGVtZW50KTtcclxuXHRcdGNvbm5lY3Rpb25FbGVtZW50ID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjb25uZWN0aW9uc1wiKVswXTtcclxuXHR9XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmNvbm5lY3Rpb25zLmxlbmd0aDtpKyspe1xyXG5cdFx0dmFyIGNvbm5lY3Rpb24gPSB0aGlzLnhtbC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb25uZWN0aW9uc1wiKTtcclxuXHRcdGNvbm5lY3Rpb24uaW5uZXJIVE1MID0gdGhpcy5jb25uZWN0aW9uc1tpXTtcclxuXHRcdHRoaXMueG1sLmFwcGVuZENoaWxkKGNvbm5lY3Rpb24pO1xyXG5cdH1cclxufVxyXG5cclxucC5jcmVhdGVXaW5kb3dzID0gZnVuY3Rpb24oKXtcclxuXHR0aGlzLmp1c3RpZmljYXRpb24gPSB0aGlzLnF1ZXN0aW9uVHlwZT09MSB8fCB0aGlzLnF1ZXN0aW9uVHlwZT09MztcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZSE9NSl7XHJcblx0XHR0aGlzLmNyZWF0ZVRhc2tXaW5kb3coKTtcclxuXHRcdHRoaXMuY3JlYXRlUmVzb3VyY2VXaW5kb3codGhpcy5yZXNvdXJjZXMpO1xyXG5cdFx0aWYodGhpcy5xdWVzdGlvblR5cGU8PTIpXHJcblx0XHRcdHRoaXMuY3JlYXRlQW5zd2VyV2luZG93KCk7XHJcblx0fVxyXG5cdGVsc2VcclxuXHRcdHRoaXMuY3JlYXRlTWVzc2FnZVdpbmRvdygpO1xyXG59XHJcblxyXG5wLmRpc3BsYXlXaW5kb3dzID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBBZGQgdGhlIHdpbmRvd3MgdG8gdGhlIHdpbmRvdyBkaXZcclxuXHR0aGlzLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuXHR2YXIgd2luZG93Tm9kZSA9IHRoaXMud2luZG93RGl2O1xyXG5cdHZhciBleGl0QnV0dG9uID0gbmV3IEltYWdlKCk7XHJcblx0ZXhpdEJ1dHRvbi5zcmMgPSBcIi4uL2ltZy9pY29uQ2xvc2UucG5nXCI7XHJcblx0ZXhpdEJ1dHRvbi5jbGFzc05hbWUgPSBcImV4aXQtYnV0dG9uXCI7XHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHRleGl0QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgcXVlc3Rpb24ud2luZG93RGl2LmlubmVySFRNTCA9ICcnOyB9O1xyXG5cdFxyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPD0yKXtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5hbnN3ZXIpO1xyXG5cdFx0dGhpcy50eXBlV2luZG93LmNsYXNzTmFtZSA9IFwid2luZG93IGxlZnRcIjtcclxuXHRcdHRoaXMudGFzay5jbGFzc05hbWUgPSBcIndpbmRvdyBsZWZ0XCI7XHJcblx0XHR0aGlzLnJlc291cmNlLmNsYXNzTmFtZSA9IFwid2luZG93IGxlZnRcIjtcclxuXHRcdGV4aXRCdXR0b24uc3R5bGUucmlnaHQgPSBcIjV2d1wiO1xyXG5cdH1cclxuXHRcclxuXHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMudHlwZVdpbmRvdyk7XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT01KXtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5tZXNzYWdlKTtcclxuXHRcdGV4aXRCdXR0b24uc3R5bGUucmlnaHQgPSBcIjI1dndcIjtcclxuXHRcdHRoaXMudHlwZVdpbmRvdy5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdH1cclxuXHRlbHNle1xyXG5cdFx0aWYodGhpcy5xdWVzdGlvblR5cGU+Mil7XHJcblx0XHRcdHRoaXMudHlwZVdpbmRvdy5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdFx0XHR0aGlzLnRhc2suY2xhc3NOYW1lID0gXCJ3aW5kb3dcIjtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZS5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdFx0XHRleGl0QnV0dG9uLnN0eWxlLnJpZ2h0ID0gXCIyNXZ3XCI7XHJcblx0XHR9XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMudGFzayk7XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMucmVzb3VyY2UpO1xyXG5cdH1cclxuXHRcclxuXHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKGV4aXRCdXR0b24pO1xyXG5cdFxyXG59XHJcblxyXG5wLmNyZWF0ZVR5cGVXaW5kb3cgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgdGFzayB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5xdWVzdGlvblR5cGVXaW5kb3c7XHJcbiAgICB0aGlzLnR5cGVXaW5kb3cgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIHRoaXMudHlwZVdpbmRvdy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKVswXS5zcmMgPSB0aGlzLmltYWdlTGluaztcclxuICAgIFxyXG4gICAgLy8gU2V0dXAgdGhlIGltYWdlIGJ1dHRvblxyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHZhciBidXR0b24gPSB0aGlzLnR5cGVXaW5kb3cuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImltYWdlQnV0dG9uXCIpWzBdO1xyXG4gICAgdmFyIGljb24gPSBidXR0b24uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIilbMF07XHJcbiAgICBidXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdFxyXG4gICAgXHRxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBcdHF1ZXN0aW9uLndpbmRvd0Rpdi5hcHBlbmRDaGlsZChxdWVzdGlvbi5pbWFnZXNXaW5kb3cpO1xyXG4gICAgICAgIHZhciBidXR0b25zID0gcXVlc3Rpb24uaW1hZ2VzV2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHZhciBpbWFnZXMgPSBxdWVzdGlvbi5pbWFnZXNXaW5kb3cuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIik7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gcXVlc3Rpb24uaW1hZ2VzV2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIilbMF07XHJcbiAgICAgICAgdmFyIGltYWdlQ29udGVudCA9IHF1ZXN0aW9uLmltYWdlc1dpbmRvdy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaW1hZ2VDb250ZW50XCIpWzBdO1xyXG4gICAgICAgIHZhciBjbG9zZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgXHRidXR0b25zWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe307XHJcbiAgICAgICAgXHRidXR0b25zWzFdLm9uY2xpY2sgPSBmdW5jdGlvbigpe307XHJcbiAgICAgICAgXHRmb3IodmFyIGkgPTA7aTxpbWFnZXMubGVuZ3RoO2krKylcclxuICAgICAgICBcdFx0aW1hZ2VzW2ldLm9uY2xpY2sgPSBmdW5jdGlvbigpe307XHJcbiAgICAgICAgXHRxdWVzdGlvbi5kaXNwbGF5V2luZG93cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBidXR0b25zWzBdLm9uY2xpY2sgPSBjbG9zZTtcclxuICAgICAgICBidXR0b25zWzFdLm9uY2xpY2sgPSBpbnB1dC5jbGljay5iaW5kKGlucHV0KTtcclxuICAgICAgICBidXR0b25zWzJdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIFx0UG9wdXAucHJvbXB0KHF1ZXN0aW9uLndpbmRvd0RpdiwgXCJTZWxlY3QgSW1hZ2VcIiwgXCJJbWFnZSBVUkw6XCIsIFwiXCIsIFwiTG9hZCBJbWFnZVwiLCBmdW5jdGlvbihuZXdJbWFnZSl7XHJcbiAgICAgICAgXHRcdGlmKG5ld0ltYWdlKVxyXG4gICAgICAgIFx0XHRcdGltYWdlQ29udGVudC5pbm5lckhUTUwgKz0gUG9wdXBXaW5kb3dzLmltYWdlLnJlcGxhY2UoLyVpbWFnZSUvZywgbmV3SW1hZ2UpO1xyXG4gICAgICAgIFx0XHRjbG9zZSgpO1xyXG4gICAgICAgIFx0XHRidXR0b24uY2xpY2soKTtcclxuICAgICAgICBcdH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IodmFyIGk9MDtpPGltYWdlcy5sZW5ndGg7aSs9Mil7XHJcbiAgICAgICAgKGZ1bmN0aW9uKGkpe1xyXG4gICAgICAgIFx0aW1hZ2VzW2ldLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIFx0XHRxdWVzdGlvbi5pbWFnZUxpbmsgPSBpbWFnZXNbaV0uc3JjO1xyXG4gICAgXHRcdFx0cXVlc3Rpb24ueG1sLnNldEF0dHJpYnV0ZShcImltYWdlTGlua1wiLCBpbWFnZXNbaV0uc3JjKTtcclxuICAgIFx0XHRcdGljb24uc3JjID0gaW1hZ2VzW2ldLnNyYztcclxuICAgICAgICBcdFx0Y2xvc2UoKTtcclxuICAgICAgICBcdH1cclxuICAgICAgICBcdGltYWdlc1tpKzFdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIFx0XHRpZihjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGltYWdlIGZyb20geW91ciBkYXRhIGJhbms/IFRoaXMgY2FuIG5vdCBiZSB1bmRvbmUhXCIpKXtcclxuICAgICAgICBcdFx0XHR2YXIgdG9SZW1vdmUgPSBxdWVzdGlvbi5pbWFnZXNXaW5kb3cuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImltYWdlXCIpW2kvMl07XHJcbiAgICAgICAgXHRcdFx0dG9SZW1vdmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0b1JlbW92ZSk7XHJcbiAgICAgICAgICAgIFx0XHRjbG9zZSgpO1xyXG4gICAgICAgICAgICBcdFx0YnV0dG9uLmNsaWNrKCk7XHJcbiAgICAgICAgXHRcdH1cclxuICAgICAgICBcdH1cclxuICAgICAgICB9KShpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBcdGlmKGlucHV0LmZpbGVzLmxlbmd0aD4wICYmIGlucHV0LmZpbGVzWzBdLnR5cGUubWF0Y2goL15pbWFnZS4qLykpe1xyXG5cdFx0XHRcdGZvcih2YXIgaT0wO2k8YnV0dG9ucy5sZW5ndGg7aSsrKVxyXG5cdFx0XHRcdFx0YnV0dG9uc1tpXS5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHRcdFx0dmFyIGltYWdlRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG5cdFx0XHRcdGltYWdlRGF0YS5hcHBlbmQoJ2ltYWdlJywgaW5wdXQuZmlsZXNbMF0sIGlucHV0LmZpbGVzWzBdLm5hbWUpO1xyXG5cdFx0XHRcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdFx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHRcdFx0XHRcdFx0Zm9yKHZhciBpPTA7aTxidXR0b25zLmxlbmd0aDtpKyspXHJcblx0XHRcdFx0XHRcdFx0YnV0dG9uc1tpXS5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRpbWFnZUNvbnRlbnQuaW5uZXJIVE1MICs9IFBvcHVwV2luZG93cy5pbWFnZS5yZXBsYWNlKC8laW1hZ2UlL2csIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cigwLCB3aW5kb3cubG9jYXRpb24uaHJlZi5zdWJzdHIoMCwgd2luZG93LmxvY2F0aW9uLmhyZWYubGVuZ3RoLTEpLmxhc3RJbmRleE9mKFwiL1wiKSkrXCIvaW1hZ2UvXCIrcmVxdWVzdC5yZXNwb25zZVRleHQpO1xyXG5cdFx0ICAgICAgICBcdFx0Y2xvc2UoKTtcclxuXHRcdCAgICAgICAgXHRcdGJ1dHRvbi5jbGljaygpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVxdWVzdC5vcGVuKFwiUE9TVFwiLCBcIi4uL2ltYWdlLnBocFwiLCB0cnVlKTtcclxuXHRcdFx0XHRyZXF1ZXN0LnNlbmQoaW1hZ2VEYXRhKTtcclxuXHRcdFx0fVxyXG4gICAgICAgIH1cclxuICAgIFx0XHJcbiAgICBcdFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0aGUgY29tYm8gYm94XHJcbiAgICB2YXIgdHlwZUNvbWJvID0gdGhpcy50eXBlV2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2VsZWN0XCIpWzBdO1xyXG4gICAgdHlwZUNvbWJvLnZhbHVlID0gdGhpcy5xdWVzdGlvblR5cGU7XHJcbiAgICB0eXBlQ29tYm8ub25jaGFuZ2UgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRxdWVzdGlvbi5xdWVzdGlvblR5cGUgPSBOdW1iZXIodGhpcy52YWx1ZSk7XHJcbiAgICBcdHF1ZXN0aW9uLmNyZWF0ZVdpbmRvd3MoKTtcclxuXHRcdHF1ZXN0aW9uLmRpc3BsYXlXaW5kb3dzKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRoZSBzYXZlIGJ1dHRvblxyXG4gICAgdGhpcy50eXBlV2luZG93LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dCdXR0b25zXCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRxdWVzdGlvbi5zYXZlID0gdHJ1ZTtcclxuICAgIFx0cXVlc3Rpb24ud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgfVxyXG59XHJcblxyXG5wLmNyZWF0ZVRhc2tXaW5kb3cgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMucHJvY2VlZEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2NlZWRDb250YWluZXJcIik7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSB0YXNrIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLnRhc2tXaW5kb3c7XHJcbiAgICB0aGlzLnRhc2sgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICB0aGlzLnRhc2suaW5uZXJIVE1MID0gdGhpcy50YXNrLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uTmFtZVwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMudGFzay5pbm5lckhUTUwgPSB0aGlzLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlaW5zdHJ1Y3Rpb25zJVwiLCB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMudGFzay5pbm5lckhUTUwgPSB0aGlzLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlcXVlc3Rpb24lXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25UZXh0XCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0byB1cGRhdGUgeG1sIG9uIGNoYW5naW5nXHJcbiAgICB2YXIgdGV4dEJveGVzID0gdGhpcy50YXNrLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ0ZXh0LWJveFwiKTtcclxuICAgIGZvcih2YXIgaT0wO2k8dGV4dEJveGVzLmxlbmd0aDtpKyspXHJcbiAgICBcdHRleHRCb3hlc1tpXS5vbmJsdXIgPSB0aGlzLnVwZGF0ZVhNTC5iaW5kKHRoaXMsIHRleHRCb3hlcyk7XHJcbn1cclxuXHJcbnAudXBkYXRlWE1MID0gZnVuY3Rpb24odGV4dEJveGVzKXtcclxuXHR0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uTmFtZVwiKVswXS5pbm5lckhUTUwgPSB0ZXh0Qm94ZXNbMF0uaW5uZXJIVE1MO1xyXG5cdHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5zdHJ1Y3Rpb25zXCIpWzBdLmlubmVySFRNTCA9IHRleHRCb3hlc1sxXS5pbm5lckhUTUw7XHJcblx0dGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblRleHRcIilbMF0uaW5uZXJIVE1MID0gdGV4dEJveGVzWzJdLmlubmVySFRNTDtcclxufVxyXG5cclxucC5jcmVhdGVSZXNvdXJjZVdpbmRvdyA9IGZ1bmN0aW9uKHJlc291cmNlRmlsZXMpe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgcmVzb3VyY2Ugd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MucmVzb3VyY2VXaW5kb3c7XHJcbiAgICB0aGlzLnJlc291cmNlID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdGhlIGJhc2ljIHJlc291cmNlcyBmcm9tIHNhdmVcclxuXHR0aGlzLnJlc291cmNlRGl2ID0gdGhpcy5yZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicmVzb3VyY2VDb250ZW50XCIpWzBdO1xyXG5cdHRoaXMudXBkYXRlUmVzb3VyY2VzKHJlc291cmNlRmlsZXMpO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0aGUgYWRkIGJ1dHRvblxyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIilbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHJlc291cmNlRmlsZXMub3BlbldpbmRvdyhxdWVzdGlvbi53aW5kb3dEaXYsIHRydWUsIGZ1bmN0aW9uKHNlbGVjdGVkUmVzb3VyY2Upe1xyXG4gICAgXHRcdGlmKHNlbGVjdGVkUmVzb3VyY2UhPW51bGwpe1xyXG4gICAgXHRcdFx0dmFyIG5ld1Jlc291cmNlID0gcXVlc3Rpb24ueG1sLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInJlc291cmNlSW5kZXhcIik7XHJcbiAgICBcdFx0XHRuZXdSZXNvdXJjZS5pbm5lckhUTUwgPSBzZWxlY3RlZFJlc291cmNlO1xyXG4gICAgXHRcdFx0cXVlc3Rpb24ueG1sLmFwcGVuZENoaWxkKG5ld1Jlc291cmNlKTtcclxuICAgIFx0XHRcdHF1ZXN0aW9uLnVwZGF0ZVJlc291cmNlcyh0aGlzKTtcclxuICAgIFx0XHR9XHJcbiAgICBcdFx0cXVlc3Rpb24uZGlzcGxheVdpbmRvd3MoKTtcclxuICAgIFx0fSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbnAudXBkYXRlUmVzb3VyY2VzID0gZnVuY3Rpb24ocmVzb3VyY2VGaWxlcyl7XHJcblx0XHJcblx0dmFyIHJlc291cmNlcyA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VJbmRleFwiKTtcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdFxyXG5cdGlmKHJlc291cmNlcy5sZW5ndGg9PTApe1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jb2xvciA9IFwiZ3JleVwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jbGFzc05hbWUgPSBcInJlc291cmNlQ29udGVudCBjZW50ZXJcIjtcclxuXHRcdHRoaXMucmVzb3VyY2VEaXYuaW5uZXJIVE1MID0gXCJObyByZXNvdXJjZXMgaGF2ZSBiZWVuIGFkZGVkLlwiO1xyXG5cdH1lbHNle1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jb2xvciA9IFwiXCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNsYXNzTmFtZSA9IFwicmVzb3VyY2VDb250ZW50XCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dmFyIHVzZWQgPSBbXTtcclxuXHRcdGZvcih2YXIgaT0wO2k8cmVzb3VyY2VzLmxlbmd0aDtpKyspe1xyXG5cdFx0XHQgICAgXHRcclxuXHRcdFx0ICAgIFx0aWYodXNlZC5pbmRleE9mKHJlc291cmNlc1tpXS5pbm5lckhUTUwpPT0tMSlcclxuXHRcdFx0ICAgIFx0XHR1c2VkLnB1c2gocmVzb3VyY2VzW2ldLmlubmVySFRNTCk7XHJcblx0XHRcdCAgICBcdGVsc2V7XHJcblx0XHRcdCAgICBcdFx0dGhpcy54bWwucmVtb3ZlQ2hpbGQocmVzb3VyY2VzW2ldKTtcclxuXHRcdFx0ICAgIFx0XHRpID0gMDtcclxuXHRcdFx0ICAgIFx0XHRyZXNvdXJjZXMgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlSW5kZXhcIik7XHJcblx0XHRcdCAgICBcdH1cclxuXHRcdH1cclxuXHQgICAgZm9yKHZhciBpPTA7aTxyZXNvdXJjZXMubGVuZ3RoO2krKyl7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSBjdXJyZW50IHJlc291cmNlIGVsZW1lbnRcclxuICAgIFx0XHR2YXIgY3VyUmVzb3VyY2UgPSBXaW5kb3dzLnJlc291cmNlLnJlcGxhY2UoXCIlaWNvbiVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0uaWNvbik7XHJcblx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJXRpdGxlJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS50aXRsZSk7XHJcblx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJWxpbmslXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLmxpbmspO1xyXG5cdCAgICBcdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHQgICAgXHR0ZW1wRGl2LmlubmVySFRNTCA9IGN1clJlc291cmNlO1xyXG5cdCAgICAgICAgY3VyUmVzb3VyY2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcblx0ICAgIFx0dGhpcy5yZXNvdXJjZURpdi5hcHBlbmRDaGlsZChjdXJSZXNvdXJjZSk7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gU2V0dXAgZGVsZXRlIGJ1dHRvblxyXG5cdCAgICBcdChmdW5jdGlvbihyZXNvdXJjZVhtbCl7XHJcblx0ICAgIFx0XHRjdXJSZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiZGVsZXRlXCIpWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdCAgICBcdFx0XHRxdWVzdGlvbi54bWwucmVtb3ZlQ2hpbGQocmVzb3VyY2VYbWwpO1xyXG5cdCAgICBcdFx0XHRxdWVzdGlvbi51cGRhdGVSZXNvdXJjZXMocmVzb3VyY2VGaWxlcyk7XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSkocmVzb3VyY2VzW2ldKTtcclxuXHQgICAgfVxyXG5cdH1cclxufVxyXG5cclxucC5jcmVhdGVBbnN3ZXJXaW5kb3cgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgYW5zd2VyIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLmFuc3dlcldpbmRvdztcclxuICAgIHRoaXMuYW5zd2VyID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0aGUgY29tYm94IGZvciBudW1iZXIgb2YgYW5zd2Vyc1xyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHRoaXMuYW5zd2VyRm9ybSA9IHRoaXMuYW5zd2VyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9ybVwiKVswXTtcclxuICAgIHZhciBzZWxlY3QgPSB0aGlzLmFuc3dlci5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNlbGVjdFwiKVswXTtcclxuICAgIHNlbGVjdC5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHF1ZXN0aW9uLnNldE51bWJlckFuc3dlcnMoTnVtYmVyKHRoaXMudmFsdWUpKTtcclxuICAgIH1cclxuICAgIHRoaXMuc2V0TnVtYmVyQW5zd2VycyhOdW1iZXIodGhpcy54bWwuZ2V0QXR0cmlidXRlKFwibnVtQW5zd2Vyc1wiKSkpO1xyXG4gICAgc2VsZWN0LnZhbHVlID0gdGhpcy54bWwuZ2V0QXR0cmlidXRlKFwibnVtQW5zd2Vyc1wiKTtcclxuXHR0aGlzLmFuc3dlckZvcm0uZWxlbWVudHNbXCJhbnN3ZXJcIl0udmFsdWUgPSB0aGlzLmNvcnJlY3QrMTtcclxuXHRcclxuXHQvLyBTZXR1cCB0aGUgZnJvbSB0byB1cGRhdGUgdGhlIHhtbFxyXG5cdHRoaXMuYW5zd2VyRm9ybS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdCAgICAvLyBTZXR1cCB0aGUgcmFkaW8gYnV0dG9ucyBmb3IgdGhlIGZvcm0gaWYganVzdGlmaWNhdGlvblxyXG5cdFx0aWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbiAmJiBOdW1iZXIodGhpcy5lbGVtZW50c1tcImFuc3dlclwiXS52YWx1ZSktMSE9cXVlc3Rpb24uY29ycmVjdCl7XHJcblx0XHRcdGZvcih2YXIgaT0wO2k8dGhpcy5lbGVtZW50cy5sZW5ndGg7aSsrKVxyXG5cdFx0XHRcdHRoaXMuZWxlbWVudHNbaV0uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5lbGVtZW50c1tcImZlZWRiYWNrXCIrdGhpcy5lbGVtZW50c1tcImFuc3dlclwiXS52YWx1ZV0uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRxdWVzdGlvbi5jb3JyZWN0ID0gTnVtYmVyKHRoaXMuZWxlbWVudHNbXCJhbnN3ZXJcIl0udmFsdWUpLTE7XHJcblx0XHR2YXIgYW5zd2VycyA9IHF1ZXN0aW9uLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFuc3dlclwiKTtcclxuXHRcdHZhciBmZWVkYmFjayA9IHF1ZXN0aW9uLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZlZWRiYWNrXCIpO1xyXG5cdFx0Zm9yKHZhciBpPTA7aTxhbnN3ZXJzLmxlbmd0aDtpKyspe1xyXG5cdFx0XHRhbnN3ZXJzW2ldLmlubmVySFRNTCA9IHRoaXMuZWxlbWVudHNbXCJhbnN3ZXJcIisoaSsxKV0udmFsdWU7XHJcblx0XHRcdGZlZWRiYWNrW2ldLmlubmVySFRNTCA9IHRoaXMuZWxlbWVudHNbXCJmZWVkYmFja1wiKyhpKzEpXS52YWx1ZTtcclxuXHRcdH1cclxuXHR9XHJcblx0dGhpcy5jb3JyZWN0ID0gLTE7XHJcblx0dGhpcy5hbnN3ZXJGb3JtLm9uY2hhbmdlKCk7XHJcblx0XHJcbiAgICBcclxufVxyXG5cclxucC5zZXROdW1iZXJBbnN3ZXJzID0gZnVuY3Rpb24obnVtKXtcclxuXHJcbiAgICB2YXIgYW5zd2Vyc1htbCA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYW5zd2VyXCIpO1xyXG4gICAgdmFyIGZlZWRiYWNrWG1sID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmZWVkYmFja1wiKTtcclxuXHR2YXIgYW5zd2VycyA9IHRoaXMuYW5zd2VyRm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImRpdlwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGFuc3dlcnMubGVuZ3RoO2krKyl7XHJcblx0XHR2YXIgaW5wdXRzID0gYW5zd2Vyc1tpXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpO1xyXG5cdFx0YW5zd2Vyc1htbFtpXS5pbm5lckhUTUwgPSBpbnB1dHNbMF0udmFsdWU7XHJcblx0XHRmZWVkYmFja1htbFtpXS5pbm5lckhUTUwgPSBpbnB1dHNbMV0udmFsdWU7XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMueG1sLnNldEF0dHJpYnV0ZShcIm51bUFuc3dlcnNcIiwgbnVtKTtcclxuXHRcclxuXHRpZihhbnN3ZXJzWG1sLmxlbmd0aDxudW0pe1xyXG5cdFx0Zm9yKHZhciBpPWFuc3dlcnNYbWwubGVuZ3RoO2k8bnVtO2krKyl7XHJcblx0XHRcdHRoaXMueG1sLmFwcGVuZENoaWxkKHRoaXMueG1sLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFuc3dlclwiKSk7XHJcblx0XHRcdHRoaXMueG1sLmFwcGVuZENoaWxkKHRoaXMueG1sLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZlZWRiYWNrXCIpKTtcclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZSBpZihhbnN3ZXJzWG1sLmxlbmd0aD5udW0pe1xyXG5cdFx0d2hpbGUoYW5zd2Vyc1htbC5sZW5ndGg+bnVtKXtcclxuXHRcdFx0dGhpcy54bWwucmVtb3ZlQ2hpbGQoYW5zd2Vyc1htbFthbnN3ZXJzWG1sLmxlbmd0aC0xXSk7XHJcblx0XHRcdHRoaXMueG1sLnJlbW92ZUNoaWxkKGZlZWRiYWNrWG1sW2ZlZWRiYWNrWG1sLmxlbmd0aC0xXSk7XHJcblx0XHQgICAgdmFyIGZlZWRiYWNrWG1sID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmZWVkYmFja1wiKTtcclxuXHRcdFx0YW5zd2Vyc1htbCA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYW5zd2VyXCIpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dGhpcy5hbnN3ZXJGb3JtLmlubmVySFRNTCA9ICcnO1xyXG5cdGZvcih2YXIgaT0wO2k8YW5zd2Vyc1htbC5sZW5ndGg7aSsrKVxyXG5cdFx0dGhpcy5hbnN3ZXJGb3JtLmlubmVySFRNTCArPSBXaW5kb3dzLmFuc3dlci5yZXBsYWNlKC8lbnVtJS9nLCBpKzEpLnJlcGxhY2UoLyVhbnN3ZXIlL2csIGFuc3dlcnNYbWxbaV0uaW5uZXJIVE1MKS5yZXBsYWNlKC8lZmVlZGJhY2slL2csIGZlZWRiYWNrWG1sW2ldLmlubmVySFRNTCk7XHJcblx0aWYodGhpcy5jb3JyZWN0PGFuc3dlcnNYbWwubGVuZ3RoKVxyXG5cdFx0dGhpcy5hbnN3ZXJGb3JtLmVsZW1lbnRzW1wiYW5zd2VyXCJdLnZhbHVlID0gdGhpcy5jb3JyZWN0KzE7XHJcblx0ZWxzZXtcclxuXHRcdHRoaXMuYW5zd2VyRm9ybS5lbGVtZW50c1tcImFuc3dlclwiXS52YWx1ZSA9IDE7XHJcblx0XHR0aGlzLmNvcnJlY3Q9MDtcclxuXHR9XHJcbn1cclxuXHJcbnAuY3JlYXRlRmlsZVdpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBmaWxlIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLmZpbGVXaW5kb3c7XHJcbiAgICB0aGlzLmFuc3dlciA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIHRoaXMuZmlsZUlucHV0ID0gdGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKVswXTtcclxuICAgIHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcbiAgICB0aGlzLmZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIFx0cXVlc3Rpb24ubmV3RmlsZXMgPSB0cnVlO1xyXG4gICAgXHRxdWVzdGlvbi5maWxlcyA9IFtdO1xyXG4gICAgXHRmb3IodmFyIGk9MDtpPGV2ZW50LnRhcmdldC5maWxlcy5sZW5ndGg7aSsrKVxyXG4gICAgXHRcdHF1ZXN0aW9uLmZpbGVzW2ldID0gZXZlbnQudGFyZ2V0LmZpbGVzW2ldLm5hbWU7XHJcblx0ICAgIHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbnAuY3JlYXRlTWVzc2FnZVdpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBtZXNzYWdlIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLm1lc3NhZ2VXaW5kb3c7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uTmFtZVwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMubWVzc2FnZS5pbm5lckhUTUwgPSB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIlaW5zdHJ1Y3Rpb25zJVwiLCB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMubWVzc2FnZS5pbm5lckhUTUwgPSB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIlcXVlc3Rpb24lXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25UZXh0XCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG5cclxuICAgIC8vIFNldHVwIHRvIHVwZGF0ZSB4bWwgb24gY2hhbmdpbmdcclxuICAgIHZhciB0ZXh0Qm94ZXMgPSB0aGlzLm1lc3NhZ2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInRleHQtYm94XCIpO1xyXG4gICAgZm9yKHZhciBpPTA7aTx0ZXh0Qm94ZXMubGVuZ3RoO2krKylcclxuICAgIFx0dGV4dEJveGVzW2ldLm9uYmx1ciA9IHRoaXMudXBkYXRlWE1MLmJpbmQodGhpcywgdGV4dEJveGVzKTtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XHJcbm1vZHVsZS5leHBvcnRzLlNPTFZFX1NUQVRFID0gU09MVkVfU1RBVEU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBXaW5kb3dzID0gcmVxdWlyZSgnLi4vaHRtbC9wb3B1cFdpbmRvd3MuanMnKTtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxuXHJcblxyXG4vLyBDcmVhdGVzIGEgY2F0ZWdvcnkgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgZnJvbSB0aGUgZ2l2ZW4geG1sXHJcbmZ1bmN0aW9uIFJlc291cmNlKHhtbCl7XHJcblx0XHJcblx0Ly8gRmlyc3QgZ2V0IHRoZSBpY29uXHJcblx0dGhpcy54bWwgPSB4bWw7XHJcblx0dmFyIHR5cGUgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSk7XHJcblx0dGhpcy50eXBlID0gdHlwZTtcclxuXHRzd2l0Y2godHlwZSl7XHJcblx0ICBjYXNlIDA6XHJcblx0ICAgIHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlRmlsZS5wbmcnO1xyXG5cdCAgICBicmVhaztcclxuXHQgIGNhc2UgMTpcclxuXHQgICAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VMaW5rLnBuZyc7XHJcblx0ICAgIGJyZWFrO1xyXG5cdCAgY2FzZSAyOlxyXG4gICAgXHR0aGlzLmljb24gPSAnLi4vaW1nL2ljb25SZXNvdXJjZVZpZGVvLnBuZyc7XHJcblx0ICAgIGJyZWFrO1xyXG5cdCAgZGVmYXVsdDpcclxuXHQgICAgdGhpcy5pY29uID0gJyc7XHJcblx0ICAgIGJyZWFrO1xyXG5cdH1cclxuXHJcblx0Ly8gTmV4dCBnZXQgdGhlIHRpdGxlXHJcblx0dGhpcy50aXRsZSA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJ0ZXh0XCIpO1xyXG5cclxuXHQvLyBMYXN0IGdldCB0aGUgbGlua1xyXG5cdHRoaXMubGluayA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpO1xyXG4gICAgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlc291cmNlcyhyZXNvdXJjZUVsZW1lbnRzLCBkb2Mpe1xyXG5cdGZvciAodmFyIGk9MDsgaTxyZXNvdXJjZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHQvLyBMb2FkIGVhY2ggcmVzb3VyY2VcclxuXHRcdHRoaXNbaV0gPSBuZXcgUmVzb3VyY2UocmVzb3VyY2VFbGVtZW50c1tpXSk7XHJcblx0fVxyXG5cdHRoaXMubGVuZ3RoID0gcmVzb3VyY2VFbGVtZW50cy5sZW5ndGg7XHJcblx0dGhpcy5kb2MgPSBkb2M7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSByZXNvdXJjZSB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5yZXNvdXJjZXNXaW5kb3c7XHJcbiAgICB0aGlzLnJlc291cmNlID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG5cdHRoaXMucmVzb3VyY2VEaXYgPSB0aGlzLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyZXNvdXJjZUNvbnRlbnRcIilbMF07XHJcblx0dGhpcy51cGRhdGVSZXNvdXJjZXMoKTtcclxuXHRcclxuXHQvLyBTdG9yZSB0aGUgYnV0dG9uc1xyXG5cdHRoaXMuYnV0dG9ucyA9IHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIik7XHJcblx0XHJcbn1cclxuXHJcbnZhciBwID0gUmVzb3VyY2VzLnByb3RvdHlwZTtcclxuXHJcbnAub3BlbldpbmRvdyA9IGZ1bmN0aW9uKHdpbmRvd0Rpdiwgc2VsZWN0LCBjYWxsYmFjayl7XHJcblx0XHJcblx0Ly8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuXHR2YXIgcmVzb3VyY2VzID0gdGhpcztcclxuICAgIHRoaXMuYnV0dG9uc1swXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0d2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgXHRyZXNvdXJjZXMud2luZG93RGl2ID0gbnVsbDtcclxuICAgIFx0Y2FsbGJhY2soKTtcclxuICAgIH1cclxuXHR0aGlzLmJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0XHRyZXNvdXJjZXMuZWRpdChudWxsLCBmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXNvdXJjZXMudXBkYXRlUmVzb3VyY2VzKCk7XHJcblx0XHRcdGlmKHJlc291cmNlcy53aW5kb3dEaXYpXHJcblx0XHRcdFx0cmVzb3VyY2VzLm9wZW5XaW5kb3cocmVzb3VyY2VzLndpbmRvd0RpdiwgcmVzb3VyY2VzLnNlbGVjdCwgcmVzb3VyY2VzLm9uY2xvc2UpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG4gICAgdGhpcy5vbmNsb3NlID0gY2FsbGJhY2s7XHJcbiAgICB0aGlzLndpbmRvd0RpdiA9IHdpbmRvd0RpdjtcclxuICAgIHRoaXMuc2VsZWN0ID0gc2VsZWN0O1xyXG5cdFxyXG5cdHZhciBpY29ucyA9IHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImljb25cIik7XHJcblx0Zm9yKHZhciBpPTA7aTxpY29ucy5sZW5ndGg7aSsrKXtcclxuXHRcdGlmKHRoaXMuc2VsZWN0KVxyXG5cdFx0XHRpY29uc1tpXS5jbGFzc05hbWUgPSBcImljb25TZWxlY3QgaWNvblwiO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRpY29uc1tpXS5jbGFzc05hbWUgPSBcImljb25cIjtcclxuXHR9XHJcbiAgICBcclxuXHR3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcblx0d2luZG93RGl2LmFwcGVuZENoaWxkKHRoaXMucmVzb3VyY2UpO1xyXG5cdFxyXG59XHJcblxyXG5wLnVwZGF0ZVJlc291cmNlcyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0aWYodGhpcy5sZW5ndGg9PTApe1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jb2xvciA9IFwiZ3JleVwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jbGFzc05hbWUgPSBcInJlc291cmNlQ29udGVudCBjZW50ZXJcIjtcclxuXHRcdHRoaXMucmVzb3VyY2VEaXYuaW5uZXJIVE1MID0gXCJObyBSZXNvdXJjZXMgTG9hZGVkXCI7XHJcblx0fWVsc2V7XHJcblx0XHR2YXIgcmVzb3VyY2VzID0gdGhpcztcclxuXHRcdHRoaXMucmVzb3VyY2VEaXYuY29sb3IgPSBcIlwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jbGFzc05hbWUgPSBcInJlc291cmNlQ29udGVudFwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5pbm5lckhUTUwgPSAnJztcclxuXHQgICAgZm9yKHZhciBpPTA7aTx0aGlzLmxlbmd0aDtpKyspe1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgY3VycmVudCByZXNvdXJjZSBlbGVtZW50XHJcbiAgICBcdFx0dmFyIGN1clJlc291cmNlID0gV2luZG93cy5yZXNvdXJjZS5yZXBsYWNlKFwiJWljb24lXCIsIHRoaXNbaV0uaWNvbik7XHJcblx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJXRpdGxlJVwiLCB0aGlzW2ldLnRpdGxlKTtcclxuXHQgICAgXHRjdXJSZXNvdXJjZSA9IGN1clJlc291cmNlLnJlcGxhY2UoXCIlbGluayVcIiwgdGhpc1tpXS5saW5rKTtcclxuXHQgICAgXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0ICAgIFx0dGVtcERpdi5pbm5lckhUTUwgPSBjdXJSZXNvdXJjZTtcclxuXHQgICAgICAgIGN1clJlc291cmNlID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG5cdCAgICBcdHRoaXMucmVzb3VyY2VEaXYuYXBwZW5kQ2hpbGQoY3VyUmVzb3VyY2UpO1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIFNldHVwIGRlbGV0ZSBhbmQgZWRpdCBidXR0b25zXHJcblx0ICAgIFx0KGZ1bmN0aW9uKGluZGV4KXtcclxuXHQgICAgXHRcdGN1clJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJkZWxldGVcIilbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0ICAgIFx0XHRcdGZvcih2YXIgaT1pbmRleDtpPHJlc291cmNlcy5sZW5ndGgtMTtpKyspXHJcblx0ICAgIFx0XHRcdFx0cmVzb3VyY2VzW2ldID0gcmVzb3VyY2VzW2krMV07XHJcblx0ICAgIFx0XHRcdGRlbGV0ZSByZXNvdXJjZXNbLS1yZXNvdXJjZXMubGVuZ3RoXTtcclxuXHQgICAgXHRcdFx0cmVzb3VyY2VzLnVwZGF0ZVJlc291cmNlcygpO1xyXG5cdCAgICBcdFx0fVxyXG5cdCAgICBcdFx0Y3VyUmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImVkaXRcIilbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0ICAgIFx0XHRcdHJlc291cmNlcy5lZGl0KGluZGV4LCBmdW5jdGlvbigpe1xyXG5cdCAgICBcdFx0XHRcdHJlc291cmNlcy51cGRhdGVSZXNvdXJjZXMoKTtcclxuXHQgICAgXHRcdFx0XHRpZihyZXNvdXJjZXMud2luZG93RGl2KVxyXG5cdCAgICBcdFx0XHRcdFx0cmVzb3VyY2VzLm9wZW5XaW5kb3cocmVzb3VyY2VzLndpbmRvd0RpdiwgcmVzb3VyY2VzLnNlbGVjdCwgcmVzb3VyY2VzLm9uY2xvc2UpO1xyXG5cdCAgICBcdFx0XHR9KTtcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHRcdFxyXG5cdCAgICBcdCAgICAvLyBJZiBzZWxlY3Qgc2V0dXAgdGhlIHJlc291cmNlcyBhcyBidXR0b25zXHJcblx0ICAgIFx0XHRjdXJSZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaWNvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHRcdCAgICBcdCAgICBpZihyZXNvdXJjZXMud2luZG93RGl2ICYmIHJlc291cmNlcy5zZWxlY3Qpe1xyXG5cdFx0ICAgIFx0ICAgIFx0cmVzb3VyY2VzLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuXHRcdCAgICBcdCAgICBcdHJlc291cmNlcy53aW5kb3dEaXYgPSBudWxsO1xyXG5cdFx0ICAgIFx0ICAgIFx0cmVzb3VyY2VzLm9uY2xvc2UoaW5kZXgpO1xyXG5cdFx0ICAgIFx0ICAgIFx0XHJcblx0XHQgICAgXHQgICAgfVxyXG5cdCAgICBcdFx0fVxyXG5cdCAgICBcdFx0XHJcblx0ICAgIFx0fSkoaSk7XHJcblx0ICAgIH1cclxuXHR9XHJcblx0XHJcbn1cclxuXHJcbnAuZWRpdCA9IGZ1bmN0aW9uKGluZGV4LCBjYWxsYmFjayl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBwb3B1cCB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5yZXNvdXJjZUVkaXRvcjtcclxuICAgIHZhciBlZGl0SW5mbyA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIHZhciBmb3JtID0gZWRpdEluZm8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xyXG5cclxuXHR2YXIgcmVzb3VyY2VzID0gdGhpcztcclxuICAgIHZhciB0eXBlID0gZWRpdEluZm8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzZWxlY3RcIilbMF07XHJcblx0dmFyIGJ1dHRvbnMgPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcclxuICAgIFxyXG4gICAgXHJcblx0aWYoaW5kZXg9PW51bGwpe1xyXG5cdFx0ZWRpdEluZm8uaW5uZXJIVE1MID0gZWRpdEluZm8uaW5uZXJIVE1MLnJlcGxhY2UoLyVlZGl0JS9nLCBcIkNyZWF0ZVwiKS5yZXBsYWNlKC8lYXBwbHklL2csIFwiQ3JlYXRlIFJlc291cmNlXCIpLnJlcGxhY2UoLyVuYW1lJS9nLCAnJykucmVwbGFjZSgvJWxpbmslL2csICcnKTtcclxuXHR9XHJcblx0ZWxzZXtcclxuXHRcdGVkaXRJbmZvLmlubmVySFRNTCA9IGVkaXRJbmZvLmlubmVySFRNTC5yZXBsYWNlKC8lZWRpdCUvZywgXCJFZGl0XCIpLnJlcGxhY2UoLyVhcHBseSUvZywgXCJBcHBseSBDaGFuZ2VzXCIpLnJlcGxhY2UoLyVuYW1lJS9nLCB0aGlzW2luZGV4XS50aXRsZSkucmVwbGFjZSgvJWxpbmslL2csIHRoaXNbaW5kZXhdLmxpbmspO1xyXG5cdFx0dHlwZS52YWx1ZSA9IHRoaXNbaW5kZXhdLnR5cGU7XHJcblx0XHR0aGlzLm5ld0xpbmsgPSB0aGlzW2luZGV4XS5saW5rO1xyXG5cdH1cclxuXHRcclxuXHQvLyBTZXR1cCBjb21ibyBib3hcclxuXHR0aGlzLnVwZGF0ZUVkaXRJbmZvKHR5cGUsIGJ1dHRvbnMsIGVkaXRJbmZvLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJhZGRyZXNzVGFnXCIpWzBdLCBlZGl0SW5mby5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYWRkcmVzc0luZm9cIilbMF0sIGVkaXRJbmZvLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJhZGRyZXNzXCIpWzBdLCBpbmRleCk7XHJcblx0ZWRpdEluZm8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzZWxlY3RcIilbMF0ub25jaGFuZ2UgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmVzb3VyY2VzLnVwZGF0ZUVkaXRJbmZvKHJlc291cmNlcy53aW5kb3dEaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzZWxlY3RcIilbMF0sIHJlc291cmNlcy53aW5kb3dEaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIiksIHJlc291cmNlcy53aW5kb3dEaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZHJlc3NUYWdcIilbMF0sIHJlc291cmNlcy53aW5kb3dEaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZHJlc3NJbmZvXCIpWzBdLCByZXNvdXJjZXMud2luZG93RGl2LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJhZGRyZXNzXCIpWzBdLCBpbmRleCk7XHJcblx0fTtcclxuXHRcclxuXHQvLyBTZXR1cCBjYW5jZWwgYnV0dG9uXHJcblx0YnV0dG9uc1syXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHRcdHJlc291cmNlcy53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBcdGNhbGxiYWNrKCk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIFNldHVwIGNvbmZpcm0gYnV0dG9uXHJcblx0YnV0dG9uc1szXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHRcdGlmKGluZGV4PT1udWxsKVxyXG5cdFx0XHRpbmRleCA9IHJlc291cmNlcy5sZW5ndGgrKztcclxuXHRcdHZhciBuZXdSZXNvdXJjZSA9IHJlc291cmNlcy5kb2MuY3JlYXRlRWxlbWVudChcInJlc291cmNlXCIpO1xyXG5cdFx0dmFyIGZvcm0gPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XHJcblx0XHRuZXdSZXNvdXJjZS5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIGZvcm0uZWxlbWVudHNbXCJ0eXBlXCJdLnZhbHVlKTtcclxuXHRcdG5ld1Jlc291cmNlLnNldEF0dHJpYnV0ZShcInRleHRcIiwgZm9ybS5lbGVtZW50c1tcIm5hbWVcIl0udmFsdWUpO1xyXG5cdFx0aWYocmVzb3VyY2VzLm5ld0xpbms9PW51bGwpXHJcblx0XHRcdG5ld1Jlc291cmNlLnNldEF0dHJpYnV0ZShcImxpbmtcIiwgZm9ybS5lbGVtZW50c1tcImxpbmtcIl0udmFsdWUpO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRuZXdSZXNvdXJjZS5zZXRBdHRyaWJ1dGUoXCJsaW5rXCIsIHJlc291cmNlcy5uZXdMaW5rKTtcclxuXHRcdHJlc291cmNlc1tpbmRleF0gPSBuZXcgUmVzb3VyY2UobmV3UmVzb3VyY2UpO1xyXG5cdFx0cmVzb3VyY2VzLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0Y2FsbGJhY2soKTtcclxuXHR9XHJcblx0XHJcblxyXG5cdC8vIERpc3BsYXkgdGhlIGVkaXQgd2luZG93XHJcblx0dGhpcy53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcblx0dGhpcy53aW5kb3dEaXYuYXBwZW5kQ2hpbGQoZWRpdEluZm8pO1xyXG59XHJcblxyXG5wLnVwZGF0ZUVkaXRJbmZvID0gZnVuY3Rpb24odHlwZSwgYnV0dG9ucywgYWRkcmVzc1RhZywgYWRkcmVzc0luZm8sIGFkZHJlc3MsIGluZGV4KXtcclxuXHJcblx0aWYoIXRoaXMubmV3TGluaylcclxuXHRcdHRoaXMubmV3TGluayA9IFwiXCI7XHJcblx0XHJcblx0aWYoTnVtYmVyKHR5cGUudmFsdWUpPT0wKXtcclxuXHRcdGFkZHJlc3NUYWcuaW5uZXJIVE1MID0gXCJSZWZyZW5jZSBGaWxlXCI7XHJcblx0XHRhZGRyZXNzLnZhbHVlID0gXCJcIjtcclxuXHRcdGFkZHJlc3MudHlwZSA9IFwiZmlsZVwiO1xyXG5cdFx0YWRkcmVzcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRhZGRyZXNzSW5mby5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHRcdGFkZHJlc3NJbmZvLmlubmVySFRNTCA9IHRoaXMubmV3TGluaztcclxuXHRcdGJ1dHRvbnNbMF0uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblx0XHRidXR0b25zWzFdLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cdFx0dmFyIHJlc291cmNlcyA9IHRoaXM7XHJcblx0XHRcclxuXHRcdC8vIFNldHVwIFZpZXcgYnV0dG9uXHJcblx0XHRidXR0b25zWzFdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhyZXNvdXJjZXMubmV3TGluayk7XHJcblx0XHRcdGlmKHJlc291cmNlcy5uZXdMaW5rICYmIHJlc291cmNlcy5uZXdMaW5rIT1cIlwiKVxyXG5cdFx0XHRcdHdpbmRvdy5vcGVuKHJlc291cmNlcy5uZXdMaW5rLCdfYmxhbmsnKTtcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdC8vIFNldHVwIGlucHV0IGJ1dHRvblxyXG5cdFx0YnV0dG9uc1swXS5vbmNsaWNrID0gYWRkcmVzcy5jbGljay5iaW5kKGFkZHJlc3MpO1xyXG5cdFx0YWRkcmVzcy5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKGFkZHJlc3MuZmlsZXMubGVuZ3RoPjApe1xyXG5cdFx0XHRcdGZvcih2YXIgaT0wO2k8YnV0dG9ucy5sZW5ndGg7aSsrKVxyXG5cdFx0XHRcdFx0YnV0dG9uc1tpXS5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHRcdFx0dmFyIHJlc291cmNlRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG5cdFx0XHRcdHJlc291cmNlRGF0YS5hcHBlbmQoJ3Jlc291cmNlJywgYWRkcmVzcy5maWxlc1swXSwgYWRkcmVzcy5maWxlc1swXS5uYW1lKTtcclxuXHRcdFx0XHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdFx0XHRcdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09IDQgJiYgcmVxdWVzdC5zdGF0dXMgPT0gMjAwKSB7XHJcblx0XHRcdFx0XHRcdGZvcih2YXIgaT0wO2k8YnV0dG9ucy5sZW5ndGg7aSsrKVxyXG5cdFx0XHRcdFx0XHRcdGJ1dHRvbnNbaV0uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0aWYocmVxdWVzdC5yZXNwb25zZVRleHQubWF0Y2goL15lcnJvci4qL2kpKVxyXG5cdFx0XHRcdFx0XHRcdGFkZHJlc3NJbmZvLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xyXG5cdFx0XHRcdFx0XHRlbHNle1xyXG5cdFx0XHRcdFx0XHRcdHJlc291cmNlcy5uZXdMaW5rID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKDAsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cigwLCB3aW5kb3cubG9jYXRpb24uaHJlZi5sZW5ndGgtMSkubGFzdEluZGV4T2YoXCIvXCIpKStcIi9yZXNvdXJjZS9cIityZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuXHRcdFx0XHRcdFx0XHRhZGRyZXNzSW5mby5pbm5lckhUTUwgPSByZXNvdXJjZXMubmV3TGluaztcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVxdWVzdC5vcGVuKFwiUE9TVFwiLCBcIi4uL3Jlc291cmNlLnBocFwiLCB0cnVlKTtcclxuXHRcdFx0XHRyZXF1ZXN0LnNlbmQocmVzb3VyY2VEYXRhKTtcclxuXHRcdFx0XHRhZGRyZXNzSW5mby5pbm5lckhUTUwgPSBcIlVwbG9hZGluZy4uLlwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2V7XHJcblx0XHRcdFx0cmVzb3VyY2VzLm5ld0xpbmsgPSBcIlwiO1xyXG5cdFx0XHRcdGFkZHJlc3NJbmZvLmlubmVySFRNTCA9IHJlc291cmNlcy5uZXdMaW5rO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHRhZGRyZXNzVGFnLmlubmVySFRNTCA9IFwiTGluayBBZGRyZXNzXCI7XHJcblx0XHRhZGRyZXNzLnZhbHVlID0gXCJcIjtcclxuXHRcdGFkZHJlc3MudHlwZSA9IFwidGV4dFwiO1xyXG5cdFx0YWRkcmVzcy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHRcdGFkZHJlc3MudmFsdWUgPSB0aGlzLm5ld0xpbms7XHJcblx0XHR0aGlzLm5ld0xpbmsgPSBudWxsO1xyXG5cdFx0YWRkcmVzcy5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7fTtcclxuXHRcdGFkZHJlc3NJbmZvLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGJ1dHRvbnNbMF0uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0YnV0dG9uc1sxXS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRidXR0b25zWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe307XHJcblx0XHRidXR0b25zWzFdLm9uY2xpY2sgPSBmdW5jdGlvbigpe307XHJcblx0fVxyXG59XHJcblxyXG5wLnhtbCA9IGZ1bmN0aW9uKHhtbERvYyl7XHJcblx0dmFyIHhtbCA9IHhtbERvYy5jcmVhdGVFbGVtZW50KFwicmVzb3VyY2VMaXN0XCIpO1xyXG5cdHhtbC5zZXRBdHRyaWJ1dGUoXCJyZXNvdXJjZUNvdW50XCIsIHRoaXMubGVuZ3RoKTtcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMubGVuZ3RoO2krKylcclxuXHRcdHhtbC5hcHBlbmRDaGlsZCh0aGlzW2ldLnhtbCk7XHJcblx0cmV0dXJuIHhtbDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZXM7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi9oZWxwZXIvdXRpbGl0aWVzLmpzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4uL2hlbHBlci9wb2ludC5qcycpO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi4vY2FzZS9xdWVzdGlvbi5qc1wiKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoXCIuL2NvbnN0YW50cy5qc1wiKTtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKFwiLi4vaGVscGVyL2RyYXdsaWIuanNcIik7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBib2FyZChzZWN0aW9uLCBib2FyZENvbnRleHQsIG5vZGVDb250ZXh0LCBtb3VzZVN0YXRlLCBzdGFydFBvc2l0aW9uLCBsZXNzb25Ob2Rlcywgc2F2ZSl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBjYW52YXMgZm9yIHRoaXMgYm9hcmQgYW5kIGFkZCBpdCB0byB0aGUgc2VjdGlvblxyXG5cdHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuXHR0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblx0dGhpcy5jYW52YXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHR0aGlzLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG5cdHRoaXMuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHR0aGlzLnNhdmUgPSBzYXZlO1xyXG5cdG1vdXNlU3RhdGUuYWRkQ2FudmFzKHRoaXMuY2FudmFzKTtcclxuXHRzZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcclxuXHRcclxuXHR2YXIgYm9hcmQgPSB0aGlzO1xyXG5cdHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGZ1bmN0aW9uKCl7XHJcblx0XHRpZihib2FyZC5sb2FkZWQpXHJcblx0XHRcdGJvYXJkLmxvYWRlZCgpO1xyXG5cdH0sIGZhbHNlKTtcclxuXHRcclxuXHR0aGlzLmJvYXJkQ29udGV4dCA9IGJvYXJkQ29udGV4dDtcclxuXHR0aGlzLm5vZGVDb250ZXh0ID0gbm9kZUNvbnRleHQ7XHJcbiAgICB0aGlzLmxlc3Nvbk5vZGVBcnJheSA9IGxlc3Nvbk5vZGVzO1xyXG4gICAgdGhpcy5ib2FyZE9mZnNldCA9IHN0YXJ0UG9zaXRpb247XHJcbiAgICB0aGlzLnByZXZCb2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxuICAgIHRoaXMuem9vbSA9IENvbnN0YW50cy5zdGFydFpvb207XHJcbiAgICB0aGlzLnN0YWdlID0gMDtcclxuICAgIHRoaXMubGFzdFNhdmVUaW1lID0gMDsgLy8gYXNzdW1lIG5vIGNvb2tpZVxyXG4gICAgdGhpcy5sYXN0UXVlc3Rpb24gPSBudWxsO1xyXG4gICAgdGhpcy5sYXN0UXVlc3Rpb25OdW0gPSAtMTtcclxuICAgIFxyXG4gICAgLy9pZiAoZG9jdW1lbnQuY29va2llKSB0aGlzLmxvYWRDb29raWUoKTsgXHJcblxyXG5cdC8vIENoZWNrIGlmIGFsbCBub2RlcyBhcmUgc29sdmVkXHJcblx0dmFyIGRvbmUgPSB0cnVlO1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoICYmIGRvbmU7aSsrKVxyXG5cdFx0aWYodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY3VycmVudFN0YXRlIT1RdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpXHJcblx0XHRcdGRvbmUgPSBmYWxzZTtcclxuXHRpZihkb25lKVxyXG5cdFx0dGhpcy5maW5pc2hlZCA9IHRydWU7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG59XHJcblxyXG4vL3Byb3RvdHlwZVxyXG52YXIgcCA9IGJvYXJkLnByb3RvdHlwZTtcclxuXHJcbnAuYWN0ID0gZnVuY3Rpb24oZ2FtZVNjYWxlLCBwTW91c2VTdGF0ZSwgZHQpIHtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgbW91c2UgZXZlbnRzIGlmIGdpdmVuIGEgbW91c2Ugc3RhdGVcclxuICAgIGlmKHBNb3VzZVN0YXRlKSB7XHJcblx0ICAgIFxyXG5cdFx0XHJcblx0ICAgIGlmICghcE1vdXNlU3RhdGUubW91c2VEb3duICYmIHRoaXMudGFyZ2V0KSB7XHJcblx0XHRcdHRoaXMudGFyZ2V0LmRyYWdQb3NpdGlvbiA9IHVuZGVmaW5lZDsgLy8gY2xlYXIgZHJhZyBiZWhhdmlvclxyXG5cdFx0XHR0aGlzLnRhcmdldC5kcmFnZ2luZyA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG51bGw7XHJcblx0XHR9XHJcblx0ICAgIFxyXG5cdCAgICBpZihwTW91c2VTdGF0ZS5tb3VzZURvd24pe1xyXG5cdFx0XHR2YXIgYm91bmRzID0gdGhpcy5ib2FyZENvbnRleHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGlmKGJvdW5kcy5sZWZ0ID49IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueCB8fCBib3VuZHMucmlnaHQgPD0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi54IHx8IGJvdW5kcy50b3AgPj0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi55IHx8IGJvdW5kcy5ib3R0b20gPD0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi55KVxyXG5cdFx0XHRcdHRoaXMuYm9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHRcdFx0Ym91bmRzID0gdGhpcy5ub2RlQ29udGV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0aWYoYm91bmRzLmxlZnQgPj0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi54IHx8IGJvdW5kcy5yaWdodCA8PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnggfHwgYm91bmRzLnRvcCA+PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnkgfHwgYm91bmRzLmJvdHRvbSA8PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnkpXHJcblx0XHRcdFx0dGhpcy5ub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0ICAgIH1cclxuXHQgICAgXHJcblx0XHRmb3IgKHZhciBpPXRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aC0xLCBub2RlQ2hvc2VuOyBpPj0wICYmIHRoaXMudGFyZ2V0PT1udWxsOyBpLS0pIHtcclxuXHRcdFx0dmFyIGxOb2RlID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07XHJcblx0XHRcdFxyXG5cdFx0XHRsTm9kZS5tb3VzZU92ZXIgPSBmYWxzZTtcclxuXHRcdFx0XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJub2RlIHVwZGF0ZVwiKTtcclxuXHRcdFx0Ly8gaWYgaG92ZXJpbmcsIHNob3cgaG92ZXIgZ2xvd1xyXG5cdFx0XHQvKmlmIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPiBsTm9kZS5wb3NpdGlvbi54LWxOb2RlLndpZHRoLzIgXHJcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA8IGxOb2RlLnBvc2l0aW9uLngrbE5vZGUud2lkdGgvMlxyXG5cdFx0XHQmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgPiBsTm9kZS5wb3NpdGlvbi55LWxOb2RlLmhlaWdodC8yXHJcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA8IGxOb2RlLnBvc2l0aW9uLnkrbE5vZGUuaGVpZ2h0LzIpIHsqL1xyXG5cdFx0XHRpZiAoVXRpbGl0aWVzLm1vdXNlSW50ZXJzZWN0KHBNb3VzZVN0YXRlLGxOb2RlLHRoaXMuYm9hcmRPZmZzZXQpKSB7XHJcblx0XHRcdFx0bE5vZGUubW91c2VPdmVyID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldCA9IGxOb2RlO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2cocE1vdXNlU3RhdGUuaGFzVGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuICAgIFx0aWYodGhpcy5hZGRDb24pe1xyXG5cclxuICAgIFx0XHRpZihwTW91c2VTdGF0ZS5tb3VzZUNsaWNrZWQpe1xyXG4gICAgXHRcdFx0dGhpcy5hZGRDb24gPSBmYWxzZTtcclxuICAgIFx0XHRcdGlmKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0IT10aGlzLnN0YXJ0Q29uKXtcclxuICAgIFx0XHRcdFx0aWYoIXRoaXMuc3ViQ29ubmVjdGlvbih0aGlzLnRhcmdldC5xdWVzdGlvbiwgdGhpcy5zdGFydENvbi5xdWVzdGlvbikpe1xyXG4gICAgXHRcdFx0XHRcdHRoaXMudGFyZ2V0LnF1ZXN0aW9uLnJldmVhbFRocmVzaG9sZCsrO1xyXG4gICAgICAgIFx0XHRcdFx0dGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5wdXNoKHRoaXMudGFyZ2V0LnF1ZXN0aW9uLm51bSsxKTtcclxuICAgICAgICBcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG4gICAgXHRcdFx0XHR9XHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0fVxyXG4gICAgXHRcdGlmKHRoaXMudGFyZ2V0PT1udWxsKVxyXG4gICAgXHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICBcdFx0XHJcbiAgICBcdH1cclxuICAgIFx0ZWxzZSBpZih0aGlzLmhpZGVDb24pe1xyXG4gICAgXHRcdGlmKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCl7XHJcbiAgICBcdFx0XHR0aGlzLmhpZGVDb24gPSBmYWxzZTtcclxuICAgIFx0XHRcdGlmKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0IT10aGlzLnN0YXJ0Q29uKXtcclxuICAgIFx0XHRcdFx0dmFyIGNvbnRhaW5zID0gMDtcclxuICAgIFx0XHRcdFx0Zm9yKHZhciBpPTA7aTx0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aCAmJiBjb250YWlucyA9PSAwO2krKylcclxuICAgIFx0XHRcdFx0XHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtNYXRoLmFicyh0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2ldKS0xXT09dGhpcy50YXJnZXQpXHJcbiAgICBcdFx0XHRcdFx0XHRjb250YWlucyA9IHRoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnNbaV07XHJcbiAgICBcdFx0XHRcdGlmKGNvbnRhaW5zIT0wKXtcclxuICAgIFx0XHRcdFx0XHRjb25zb2xlLmxvZyhjb250YWlucyk7XHJcbiAgICBcdFx0XHRcdFx0dGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5zcGxpY2UodGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5pbmRleE9mKGNvbnRhaW5zKSwgMSk7XHJcbiAgICAgICAgXHRcdFx0XHR0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLnB1c2goLWNvbnRhaW5zKTtcclxuICAgIFx0XHRcdFx0XHR0aGlzLnNhdmUoKTtcclxuICAgIFx0XHRcdFx0fVxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdH1cclxuICAgIFx0XHRpZih0aGlzLnRhcmdldD09bnVsbClcclxuICAgIFx0XHRcdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgXHR9XHJcbiAgICBcdGVsc2UgaWYodGhpcy5yZW1vdmVDb24pe1xyXG4gICAgXHRcdGlmKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCl7XHJcbiAgICBcdFx0XHR0aGlzLnJlbW92ZUNvbiA9IGZhbHNlO1xyXG4gICAgXHRcdFx0aWYodGhpcy50YXJnZXQgJiYgdGhpcy50YXJnZXQhPXRoaXMuc3RhcnRDb24gJiYgY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgdGhpcyBjb25uZWN0aW9uPyBUaGlzIGFjdGlvbiBjYW4ndCBiZSB1bmRvbmUhXCIpKXtcclxuICAgIFx0XHRcdFx0dmFyIGNvbnRhaW5zID0gLTE7XHJcbiAgICBcdFx0XHRcdGZvcih2YXIgaT0wO2k8dGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGggJiYgY29udGFpbnMgPT0gLTE7aSsrKVxyXG4gICAgXHRcdFx0XHRcdGlmKHRoaXMubGVzc29uTm9kZUFycmF5W3RoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnNbaV0tMV09PXRoaXMudGFyZ2V0KVxyXG4gICAgXHRcdFx0XHRcdFx0Y29udGFpbnMgPSB0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2ldO1xyXG4gICAgXHRcdFx0XHRpZihjb250YWlucz49MCl7XHJcbiAgICBcdFx0XHRcdFx0dGhpcy50YXJnZXQucXVlc3Rpb24ucmV2ZWFsVGhyZXNob2xkLS07XHJcbiAgICBcdFx0XHRcdFx0dGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5zcGxpY2UodGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9ucy5pbmRleE9mKGNvbnRhaW5zKSwgMSk7XHJcbiAgICBcdFx0XHRcdFx0dGhpcy5zYXZlKCk7XHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9XHJcbiAgICBcdFx0aWYodGhpcy50YXJnZXQ9PW51bGwpXHJcbiAgICBcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIFx0fVxyXG4gICAgXHRlbHNlIGlmKHRoaXMudGFyZ2V0KXtcclxuXHRcclxuXHRcdFx0aWYoIXRoaXMudGFyZ2V0LmRyYWdnaW5nKXtcclxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duKSB7XHJcblx0XHRcdFx0XHQvLyBkcmFnXHJcblx0XHRcdFx0XHR0aGlzLnRhcmdldC5kcmFnZ2luZyA9IHRydWU7XHJcblx0XHRcdFx0XHR0aGlzLnRhcmdldC5kcmFnUG9zaXRpb24gPSBuZXcgUG9pbnQoXHJcblx0XHRcdFx0XHRwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueCAtIHRoaXMudGFyZ2V0LnBvc2l0aW9uLngsXHJcblx0XHRcdFx0XHRwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSAtIHRoaXMudGFyZ2V0LnBvc2l0aW9uLnlcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZUNsaWNrZWQpIHtcclxuXHRcdFx0XHRcdC8vIGhhbmRsZSBjbGljayBjb2RlXHJcblx0XHRcdFx0XHR0aGlzLnRhcmdldC5jbGljayhwTW91c2VTdGF0ZSk7XHJcblx0XHRcdFx0XHR0aGlzLmxhc3RRdWVzdGlvbiA9IHRoaXMudGFyZ2V0LnF1ZXN0aW9uO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubGVmdE1vdXNlQ2xpY2tlZCgpKSB7XHJcblx0XHRcdFx0XHQvLyBoYW5kbGUgbGVmdCBjbGljayBjb2RlXHJcblx0XHRcdFx0XHR0aGlzLm5vZGVDb250ZXh0LnN0eWxlLnRvcCA9IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueStcInB4XCI7XHJcblx0XHRcdFx0XHR0aGlzLm5vZGVDb250ZXh0LnN0eWxlLmxlZnQgPSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLngrXCJweFwiO1xyXG5cdFx0XHRcdFx0dGhpcy5ub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHRcdHRoaXMubm9kZUNvbnRleHQudmlydHVhbFBvc2l0aW9uID0gcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uO1xyXG5cdFx0XHRcdFx0dGhpcy5ib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0Tm9kZSA9IHRoaXMudGFyZ2V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNle1xyXG5cdFx0XHRcdHZhciBuYXR1cmFsWCA9IHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54IC0gdGhpcy50YXJnZXQuZHJhZ1Bvc2l0aW9uLng7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQucG9zaXRpb24ueCA9IE1hdGgubWF4KENvbnN0YW50cy5ib2FyZE91dGxpbmUsTWF0aC5taW4obmF0dXJhbFgsQ29uc3RhbnRzLmJvYXJkU2l6ZS54IC0gQ29uc3RhbnRzLmJvYXJkT3V0bGluZSkpO1xyXG5cdFx0XHRcdHZhciBuYXR1cmFsWSA9IHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IC0gdGhpcy50YXJnZXQuZHJhZ1Bvc2l0aW9uLnk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQucG9zaXRpb24ueSA9IE1hdGgubWF4KENvbnN0YW50cy5ib2FyZE91dGxpbmUsTWF0aC5taW4obmF0dXJhbFksQ29uc3RhbnRzLmJvYXJkU2l6ZS55IC0gQ29uc3RhbnRzLmJvYXJkT3V0bGluZSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdCAgfVxyXG5cdFx0XHJcblx0XHQvLyBkcmFnIHRoZSBib2FyZCBhcm91bmRcclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duKSB7XHJcblx0XHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xyXG5cdFx0XHRcdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcclxuXHRcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG5cdFx0XHRcdGlmICghdGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkKSB7XHJcblx0XHRcdFx0XHR0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQgPSBwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb247XHJcblx0XHRcdFx0XHR0aGlzLnByZXZCb2FyZE9mZnNldC54ID0gdGhpcy5ib2FyZE9mZnNldC54O1xyXG5cdFx0XHRcdFx0dGhpcy5wcmV2Qm9hcmRPZmZzZXQueSA9IHRoaXMuYm9hcmRPZmZzZXQueTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLnByZXZCb2FyZE9mZnNldC54IC0gKHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54IC0gdGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkLngpO1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA+IHRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLm1heEJvYXJkV2lkdGgvMjtcclxuXHRcdFx0XHRcdGlmICh0aGlzLmJvYXJkT2Zmc2V0LnggPCAtMSp0aGlzLm1heEJvYXJkV2lkdGgvMikgdGhpcy5ib2FyZE9mZnNldC54ID0gLTEqdGhpcy5tYXhCb2FyZFdpZHRoLzI7XHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnkgPSB0aGlzLnByZXZCb2FyZE9mZnNldC55IC0gKHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IC0gdGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkLnkpO1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueSA+IHRoaXMubWF4Qm9hcmRIZWlnaHQvMikgdGhpcy5ib2FyZE9mZnNldC55ID0gdGhpcy5tYXhCb2FyZEhlaWdodC8yO1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueSA8IC0xKnRoaXMubWF4Qm9hcmRIZWlnaHQvMikgdGhpcy5ib2FyZE9mZnNldC55ID0gLTEqdGhpcy5tYXhCb2FyZEhlaWdodC8yO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQgPSB1bmRlZmluZWQ7XHJcblx0XHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJyc7XHJcblx0XHRcdFx0aWYgKHBNb3VzZVN0YXRlLmxlZnRNb3VzZUNsaWNrZWQoKSkge1xyXG5cdFx0XHRcdFx0Ly8gaGFuZGxlIGxlZnQgY2xpY2sgY29kZVxyXG5cdFx0XHRcdFx0dGhpcy5ib2FyZENvbnRleHQuc3R5bGUudG9wID0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi55K1wicHhcIjtcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRDb250ZXh0LnN0eWxlLmxlZnQgPSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLngrXCJweFwiO1xyXG5cdFx0XHRcdFx0dGhpcy5ib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkQ29udGV4dC52aXJ0dWFsUG9zaXRpb24gPSBwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb247XHJcblx0XHRcdFx0XHR0aGlzLm5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHQgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5wLnN1YkNvbm5lY3Rpb24gPSBmdW5jdGlvbihxdWVzdGlvbiwgc2VhcmNoUXVlcyl7XHJcblx0dmFyIGZvdW5kID0gZmFsc2U7XHJcblx0Zm9yKHZhciBpPTA7aTxxdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGggJiYgIWZvdW5kO2krKyl7XHJcblx0XHR2YXIgY3VyID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbcXVlc3Rpb24uY29ubmVjdGlvbnNbaV0tMV0ucXVlc3Rpb247XHJcblx0XHRpZihjdXI9PXNlYXJjaFF1ZXMpXHJcblx0XHRcdGZvdW5kID0gdHJ1ZTtcclxuXHRcdGVsc2VcclxuXHRcdFx0Zm91bmQgPSB0aGlzLnN1YkNvbm5lY3Rpb24oY3VyLCBzZWFyY2hRdWVzKTtcclxuXHR9XHJcblx0cmV0dXJuIGZvdW5kO1xyXG59XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihnYW1lU2NhbGUsIHBNb3VzZVN0YXRlKXtcclxuICAgIFxyXG4gICAgLy8gc2F2ZSBjYW52YXMgc3RhdGUgYmVjYXVzZSB3ZSBhcmUgYWJvdXQgdG8gYWx0ZXIgcHJvcGVydGllc1xyXG4gICAgdGhpcy5jdHguc2F2ZSgpOyAgIFxyXG4gICAgXHJcbiAgICAvLyBDbGVhciBiZWZvcmUgZHJhd2luZyBuZXcgc3R1ZmZcclxuXHREcmF3TGliLnJlY3QodGhpcy5jdHgsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQsIFwiIzE1NzE4RlwiKTtcclxuXHJcblx0XHJcblx0Ly8gU2NhbGUgdGhlIGdhbWVcclxuICAgIHRoaXMuY3R4LnNhdmUoKTtcclxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh0aGlzLmNhbnZhcy53aWR0aC8yLCB0aGlzLmNhbnZhcy5oZWlnaHQvMik7XHJcblx0dGhpcy5jdHguc2NhbGUoZ2FtZVNjYWxlLCBnYW1lU2NhbGUpO1xyXG5cdHRoaXMuY3R4LnRyYW5zbGF0ZSgtdGhpcy5jYW52YXMud2lkdGgvMiwgLXRoaXMuY2FudmFzLmhlaWdodC8yKTtcclxuXHJcbiAgICAvLyBUcmFuc2xhdGUgdG8gY2VudGVyIG9mIHNjcmVlbiBhbmQgc2NhbGUgZm9yIHpvb20gdGhlbiB0cmFuc2xhdGUgYmFja1xyXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuY2FudmFzLndpZHRoLzIsIHRoaXMuY2FudmFzLmhlaWdodC8yKTtcclxuICAgIHRoaXMuY3R4LnNjYWxlKHRoaXMuem9vbSwgdGhpcy56b29tKTtcclxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSgtdGhpcy5jYW52YXMud2lkdGgvMiwgLXRoaXMuY2FudmFzLmhlaWdodC8yKTtcclxuICAgIC8vIG1vdmUgdGhlIGJvYXJkIHRvIHdoZXJlIHRoZSB1c2VyIGRyYWdnZWQgaXRcclxuICAgIC8vdHJhbnNsYXRlIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGJvYXJkXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuY2FudmFzLndpZHRoLzIgLSB0aGlzLmJvYXJkT2Zmc2V0LngsIHRoaXMuY2FudmFzLmhlaWdodC8yIC0gdGhpcy5ib2FyZE9mZnNldC55KTtcclxuICAgIFxyXG5cdFxyXG4gICAgLy8gRHJhdyB0aGUgYmFja2dyb3VuZCBvZiB0aGUgYm9hcmRcclxuICAgIERyYXdMaWIucmVjdCh0aGlzLmN0eCwgMCwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS54LCBDb25zdGFudHMuYm9hcmRTaXplLnksIFwiI0QzQjE4NVwiKTtcclxuICAgIERyYXdMaWIuc3Ryb2tlUmVjdCh0aGlzLmN0eCwgLUNvbnN0YW50cy5ib2FyZE91dGxpbmUvMiwgLUNvbnN0YW50cy5ib2FyZE91dGxpbmUvMiwgQ29uc3RhbnRzLmJvYXJkU2l6ZS54K0NvbnN0YW50cy5ib2FyZE91dGxpbmUvMiwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55K0NvbnN0YW50cy5ib2FyZE91dGxpbmUvMiwgQ29uc3RhbnRzLmJvYXJkT3V0bGluZSwgXCIjQ0I5OTY2XCIpO1xyXG4gICAgXHJcblxyXG5cclxuXHQvLyBkcmF3IHRoZSBub2RlcyBpdHNlbGZcclxuXHRmb3IodmFyIGk9MDsgaTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGkrKylcclxuICAgICAgICB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5kcmF3KHRoaXMuY3R4LCB0aGlzLmNhbnZhcyk7XHJcbiAgICBcclxuXHQvLyBkcmF3IHRoZSBsaW5lc1xyXG5cdGZvcih2YXIgaT0wOyBpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKXtcclxuXHRcdFxyXG5cdFx0Ly8gZ2V0IHRoZSBwaW4gcG9zaXRpb25cclxuICAgICAgICB2YXIgb1BvcyA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldLmdldE5vZGVQb2ludCgpO1xyXG4gICAgICAgIFxyXG5cdFx0Ly8gc2V0IGxpbmUgc3R5bGVcclxuICAgICAgICBcclxuICAgICAgICAvLyBkcmF3IGxpbmVzXHJcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgXHR2YXIgY29ubmVjdGlvbiA9IHRoaXMubGVzc29uTm9kZUFycmF5W01hdGguYWJzKHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2pdKSAtIDFdO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHR2YXIgY29sb3IgPSBcInJnYmEoMjU1LCAwLCAwLCBcIiwgXHJcbiAgICAgICAgXHRcdHNpemUgPSBDb25zdGFudHMuYXJyb3dTaXplO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHRpZigoIXRoaXMucmVtb3ZlQ29uICYmICF0aGlzLmhpZGVDb24gJiYgdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV09PXRoaXMudGFyZ2V0KSB8fCBcclxuICAgICAgICBcdFx0XHQoKHRoaXMucmVtb3ZlQ29uIHx8IHRoaXMuaGlkZUNvbikgJiYgdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV09PXRoaXMuc3RhcnRDb24gJiYgY29ubmVjdGlvbj09dGhpcy50YXJnZXQpKXtcclxuICAgICAgICBcdFx0c2l6ZSAqPSAyO1xyXG4gICAgICAgIFx0XHRjb2xvciA9ICBcInJnYmEoMCwgMCwgMjU1LCBcIjtcclxuICAgICAgICBcdH1cclxuXHJcbiAgICAgICAgXHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5jb25uZWN0aW9uc1tqXTwwKVxyXG4gICAgICAgIFx0XHRjb2xvciArPSBcIjAuMjUpXCI7XHJcbiAgICAgICAgXHRlbHNlXHJcbiAgICAgICAgXHRcdGNvbG9yICs9IFwiMSlcIjtcclxuXHJcbiAgICAgICAgXHQvLyAtMSBiZWNhc2Ugbm9kZSBjb25uZWN0aW9uIGluZGV4IHZhbHVlcyBhcmUgMS1pbmRleGVkIGJ1dCBjb25uZWN0aW9ucyBpcyAwLWluZGV4ZWRcclxuICAgICAgICBcdC8vIGdvIHRvIHRoZSBpbmRleCBpbiB0aGUgYXJyYXkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgY29ubmVjdGVkIG5vZGUgb24gdGhpcyBib2FyZCBhbmQgc2F2ZSBpdHMgcG9zaXRpb25cclxuICAgICAgICBcdC8vIGNvbm5lY3Rpb24gaW5kZXggc2F2ZWQgaW4gdGhlIGxlc3Nvbk5vZGUncyBxdWVzdGlvblxyXG4gICAgICAgIFx0dmFyIGNQb3MgPSBjb25uZWN0aW9uLmdldE5vZGVQb2ludCgpO1xyXG4gICAgICAgICAgICBEcmF3TGliLmFycm93KHRoaXMuY3R4LCBvUG9zLCBjUG9zLCBDb25zdGFudHMuYXJyb3dIZWFkU2l6ZSwgc2l6ZSwgY29sb3IpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cdGlmKHRoaXMuYWRkQ29uKVxyXG4gICAgICAgIERyYXdMaWIuYXJyb3codGhpcy5jdHgsIHRoaXMuc3RhcnRDb24uZ2V0Tm9kZVBvaW50KCksIG5ldyBQb2ludChwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueCt0aGlzLmJvYXJkT2Zmc2V0LngsIHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55K3RoaXMuYm9hcmRPZmZzZXQueSksIENvbnN0YW50cy5hcnJvd0hlYWRTaXplLCBDb25zdGFudHMuYXJyb3dTaXplLCBcImRhcmtSZWRcIik7XHJcblx0XHJcblx0dGhpcy5jdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuLy8gR2V0cyBhIGZyZWUgbm9kZSBpbiB0aGlzIGJvYXJkIChpLmUuIG5vdCB1bnNvbHZlZCkgcmV0dXJucyBudWxsIGlmIG5vbmVcclxucC5nZXRGcmVlTm9kZSA9IGZ1bmN0aW9uKCkge1xyXG5cdGZvcih2YXIgaT0wOyBpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKVxyXG5cdFx0aWYodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uY3VycmVudFN0YXRlID09IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlVOU09MVkVEKVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07XHJcblx0cmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8vIE1vdmVzIHRoaXMgYm9hcmQgdG93YXJkcyB0aGUgZ2l2ZW4gcG9pbnRcclxucC5tb3ZlVG93YXJkcyA9IGZ1bmN0aW9uKHBvaW50LCBkdCwgc3BlZWQpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgdmVjdG9yIHRvd2FyZHMgdGhlIGdpdmVuIHBvaW50XHJcblx0dmFyIHRvUG9pbnQgPSBuZXcgUG9pbnQocG9pbnQueC10aGlzLmJvYXJkT2Zmc2V0LngsIHBvaW50LnktdGhpcy5ib2FyZE9mZnNldC55KTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIGRpc3RhbmNlIG9mIHNhaWQgdmVjdG9yXHJcblx0dmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KHRvUG9pbnQueCp0b1BvaW50LngrdG9Qb2ludC55KnRvUG9pbnQueSk7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBuZXcgb2Zmc2V0IG9mIHRoZSBib2FyZCBhZnRlciBtb3ZpbmcgdG93YXJkcyB0aGUgcG9pbnRcclxuXHR2YXIgbmV3T2Zmc2V0ID0gbmV3IFBvaW50KCB0aGlzLmJvYXJkT2Zmc2V0LnggKyB0b1BvaW50LngvZGlzdGFuY2UqZHQqc3BlZWQsXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnkgKyB0b1BvaW50LnkvZGlzdGFuY2UqZHQqc3BlZWQpO1xyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHBhc3NlZCBwb2ludCBvbiB4IGF4aXMgYW5kIGlmIHNvIHNldCB0byBwb2ludCdzIHhcclxuXHRpZih0aGlzLmJvYXJkT2Zmc2V0LnggIT1wb2ludC54ICYmXHJcblx0XHRNYXRoLmFicyhwb2ludC54LW5ld09mZnNldC54KS8ocG9pbnQueC1uZXdPZmZzZXQueCk9PU1hdGguYWJzKHBvaW50LngtdGhpcy5ib2FyZE9mZnNldC54KS8ocG9pbnQueC10aGlzLmJvYXJkT2Zmc2V0LngpKVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC54ID0gbmV3T2Zmc2V0Lng7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC54ID0gcG9pbnQueDtcclxuXHRcclxuXHJcblx0Ly8gQ2hlY2sgaWYgcGFzc2VkIHBvaW50IG9uIHkgYXhpcyBhbmQgaWYgc28gc2V0IHRvIHBvaW50J3MgeVxyXG5cdGlmKHRoaXMuYm9hcmRPZmZzZXQueSAhPSBwb2ludC55ICYmXHJcblx0XHRNYXRoLmFicyhwb2ludC55LW5ld09mZnNldC55KS8ocG9pbnQueS1uZXdPZmZzZXQueSk9PU1hdGguYWJzKHBvaW50LnktdGhpcy5ib2FyZE9mZnNldC55KS8ocG9pbnQueS10aGlzLmJvYXJkT2Zmc2V0LnkpKVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gbmV3T2Zmc2V0Lnk7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gcG9pbnQueTtcclxufVxyXG5cclxucC53aW5kb3dDbG9zZWQgPSBmdW5jdGlvbigpe1xyXG5cdHZhciB4bWw7XHJcblx0aWYodGhpcy5sYXN0UXVlc3Rpb24pe1xyXG5cdFx0dmFyIHF1ZXN0aW9uID0gdGhpcy5sYXN0UXVlc3Rpb247XHJcblx0XHR0aGlzLmxhc3RRdWVzdGlvbiA9IG51bGw7XHJcblx0XHRpZihxdWVzdGlvbi5zYXZlKXtcclxuXHRcdFx0cXVlc3Rpb24uc2F2ZSA9IGZhbHNlO1xyXG5cdFx0XHR4bWwgPSBxdWVzdGlvbi54bWw7XHJcblx0XHRcdGZvcih2YXIgaT0wO2k8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoO2krKylcclxuXHRcdFx0XHR0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS51cGRhdGVJbWFnZSgpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHt4bWw6eG1sLCBudW06cXVlc3Rpb24ubnVtfTtcclxuXHR9XHJcblx0cmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbnAuYWRkQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHN0YXJ0KXtcclxuXHR0aGlzLmFkZENvbiA9IHRydWU7XHJcblx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcblx0dGhpcy5zdGFydENvbiA9IHN0YXJ0O1xyXG59XHJcblxyXG5wLnJlbW92ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbihzdGFydCl7XHJcblx0dGhpcy5yZW1vdmVDb24gPSB0cnVlO1xyXG5cdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG5cdHRoaXMuc3RhcnRDb24gPSBzdGFydDtcclxufVxyXG5cclxucC5oaWRlQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHN0YXJ0KXtcclxuXHR0aGlzLmhpZGVDb24gPSB0cnVlO1xyXG5cdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG5cdHRoaXMuc3RhcnRDb24gPSBzdGFydDtcclxufVxyXG5cclxucC5zaG93ID0gZnVuY3Rpb24oZGlyKXtcclxuXHRpZihkaXIhPW51bGwpXHJcblx0XHR0aGlzLmNhbnZhcy5zdHlsZS5hbmltYXRpb24gPSAnY2FudmFzRW50ZXInICsgKGRpciA/ICdMJyA6ICdSJykgKyAnIDFzJztcclxuXHR0aGlzLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XHJcbn1cclxuXHJcbnAuaGlkZSA9IGZ1bmN0aW9uKGRpcil7XHJcblx0aWYoZGlyIT1udWxsKXtcclxuXHRcdHRoaXMuY2FudmFzLnN0eWxlLmFuaW1hdGlvbiA9ICdjYW52YXNMZWF2ZScgKyAoZGlyID8gJ1InIDogJ0wnKSArICcgMXMnO1xyXG5cdFx0dmFyIGJvYXJkID0gdGhpcztcclxuXHRcdHRoaXMubG9hZGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0Ym9hcmQuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHR9XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHRib2FyZC5jYW52YXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHR9XHJcbn1cclxuXHJcbnAudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuXHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYm9hcmQ7ICAgIFxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbi8vIFRoZSBzaXplIG9mIHRoZSBib2FyZCBpbiBnYW1lIHVuaXRzIGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkU2l6ZSA9IG5ldyBQb2ludCgxOTIwLCAxMDgwKTtcclxubS5ib3VuZFNpemUgPSAzO1xyXG5cclxuLy9UaGUgc2l6ZSBvZiB0aGUgYm9hcmQgb3V0bGluZSBpbiBnYW1lIHVuaXRzIGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkT3V0bGluZSA9IG0uYm9hcmRTaXplLnggPiBtLmJvYXJkU2l6ZS55ID8gbS5ib2FyZFNpemUueC8yMCA6IG0uYm9hcmRTaXplLnkvMjA7XHJcblxyXG4vLyBUaGUgem9vbSB2YWx1ZXMgYXQgc3RhcnQgYW5kIGVuZCBvZiBhbmltYXRpb25cclxubS5zdGFydFpvb20gPSAwLjU7XHJcbm0uZW5kWm9vbSA9IDEuNTtcclxuXHJcbi8vIFRoZSBzcGVlZCBvZiB0aGUgem9vbSBhbmltYXRpb25cclxubS56b29tU3BlZWQgPSAwLjAwMTtcclxubS56b29tTW92ZVNwZWVkID0gMC43NTtcclxuXHJcbi8vIFRoZSBzcGVlZCBvZiB0aGUgbGluZSBhbmltYXRpb25cclxubS5saW5lU3BlZWQgPSAwLjAwMjtcclxuXHJcbi8vIFRoZSB0aW1lIGJldHdlZW4gem9vbSBjaGVja3NcclxubS5waW5jaFNwZWVkID0gLjAwMjU7XHJcblxyXG4vLyBVc2VkIGZvciByZXNpemluZyBub2Rlc1xyXG5tLm5vZGVTdGVwID0gMC4xO1xyXG5tLm1heE5vZGVTY2FsZSA9IDI7XHJcbm0ubWluTm9kZVNjYWxlID0gMC41O1xyXG5tLm5vZGVFZGdlV2lkdGggPSAyNTtcclxuXHJcbi8vIFVzZWQgZm9yIGRyYXdpbmcgYXJyb3dzXHJcbm0uYXJyb3dIZWFkU2l6ZSA9IDUwO1xyXG5tLmFycm93U2l6ZSA9IDU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBCb2FyZCA9IHJlcXVpcmUoJy4vYm9hcmQuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcbnZhciBMZXNzb25Ob2RlID0gcmVxdWlyZSgnLi9sZXNzb25Ob2RlLmpzJyk7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cy5qcycpO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4uL2hlbHBlci9kcmF3bGliLmpzJyk7XHJcbnZhciBEYXRhUGFyc2VyID0gcmVxdWlyZSgnLi4vaGVscGVyL2lwYXJEYXRhUGFyc2VyLmpzJyk7XHJcbnZhciBNb3VzZVN0YXRlID0gcmVxdWlyZSgnLi4vaGVscGVyL21vdXNlU3RhdGUuanMnKTtcclxudmFyIEtleWJvYXJkU3RhdGUgPSByZXF1aXJlKCcuLi9oZWxwZXIva2V5Ym9hcmRTdGF0ZS5qcycpO1xyXG52YXIgRmlsZU1hbmFnZXIgPSByZXF1aXJlKCcuLi9oZWxwZXIvZmlsZU1hbmFnZXIuanMnKTtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZSgnLi4vY2FzZS9xdWVzdGlvbi5qcycpO1xyXG52YXIgQ2F0ZWdvcnkgPSByZXF1aXJlKCcuLi9jYXNlL2NhdGVnb3J5LmpzJyk7XHJcbnZhciBQb3B1cCA9IHJlcXVpcmUoJy4uL21lbnVzL3BvcHVwLmpzJyk7XHJcbnZhciBQb3B1cFdpbmRvd3MgPSByZXF1aXJlKCcuLi9odG1sL3BvcHVwV2luZG93cy5qcycpO1xyXG5cclxuLy9tb3VzZSAmIGtleWJvYXJkIG1hbmFnZW1lbnRcclxudmFyIHByZXZpb3VzTW91c2VTdGF0ZTtcclxudmFyIGRyYWdnaW5nRGlzYWJsZWQ7XHJcbnZhciBtb3VzZVRhcmdldDtcclxudmFyIG1vdXNlU3VzdGFpbmVkRG93bjtcclxuXHJcbi8vIEhUTUwgZWxlbWVudHNcclxudmFyIHpvb21TbGlkZXI7XHJcbnZhciB3aW5kb3dEaXY7XHJcbnZhciB3aW5kb3dGaWxtO1xyXG5cclxuLy8gVXNlZCBmb3IgcGluY2ggem9vbVxyXG52YXIgcGluY2hTdGFydDtcclxuXHJcbi8vIFVzZWQgZm9yIHdhaXRpbmcgYSBzZWNvbmQgdG8gY2xvc2Ugd2luZG93c1xyXG52YXIgcGF1c2VkVGltZSA9IDA7XHJcblxyXG4vL3BoYXNlIGhhbmRsaW5nXHJcbnZhciBwaGFzZU9iamVjdDtcclxuXHJcbmZ1bmN0aW9uIGdhbWUoc2VjdGlvbiwgYmFzZVNjYWxlKXtcclxuXHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuXHR0aGlzLnNlY3Rpb24gPSBzZWN0aW9uO1xyXG5cdHRoaXMuc2F2ZUZpbGVzID0gW107XHJcblx0XHJcblx0Ly8gR2V0IGFuZCBzZXR1cCB0aGUgd2luZG93IGVsZW1lbnRzXHJcblx0d2luZG93RGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvdycpO1xyXG5cdHdpbmRvd0ZpbG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93RmxpbScpO1xyXG5cdFxyXG5cdC8vIEdldCBhbmQgc2V0dXAgdGhlIHpvb20gc2xpZGVyXHJcblx0em9vbVNsaWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjem9vbS1zbGlkZXInKTtcclxuXHR6b29tU2xpZGVyLm9uaW5wdXQgPSBmdW5jdGlvbigpe1xyXG5cdFx0Z2FtZS5zZXRab29tKC1wYXJzZUZsb2F0KHpvb21TbGlkZXIudmFsdWUpKTtcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjem9vbS1pbicpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuICAgIFx0em9vbVNsaWRlci5zdGVwRG93bigpO1xyXG5cdFx0Z2FtZS5zZXRab29tKC1wYXJzZUZsb2F0KHpvb21TbGlkZXIudmFsdWUpKTtcclxuICAgIH07XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3pvb20tb3V0Jykub25jbGljayA9IGZ1bmN0aW9uKCkgeyBcclxuXHRcdHpvb21TbGlkZXIuc3RlcFVwKCk7IFxyXG5cdFx0Z2FtZS5zZXRab29tKC1wYXJzZUZsb2F0KHpvb21TbGlkZXIudmFsdWUpKTtcclxuXHR9O1xyXG5cdFxyXG5cdC8vIEdldCBhbmQgc2V0dXAgdGhlIGJvYXJkIGNvbnRleHQgbWVudVxyXG5cdHZhciBib2FyZENvbnRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2JvYXJkLWNvbnRleHQnKTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2JvYXJkLWNvbnRleHQgI2FkZC1xdWVzdGlvbicpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdHZhciBib2FyZCA9IGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0Z2FtZS5hZGRRdWVzdGlvbigoYm9hcmRDb250ZXh0LnZpcnR1YWxQb3NpdGlvbi54K0NvbnN0YW50cy5ib2FyZFNpemUueC8yKS9Db25zdGFudHMuYm9hcmRTaXplLngqMTAwLFxyXG5cdFx0XHRcdChib2FyZENvbnRleHQudmlydHVhbFBvc2l0aW9uLnkrQ29uc3RhbnRzLmJvYXJkU2l6ZS55LzIpL0NvbnN0YW50cy5ib2FyZFNpemUueSoxMDApO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cclxuXHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib2FyZC1jb250ZXh0ICNhZGQtY2F0ZWdvcnknKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRQb3B1cC5wcm9tcHQod2luZG93RGl2LCBcIkNyZWF0ZSBDYXRlZ29yeVwiLCBcIkNhdGVnb3J5IE5hbWU6XCIsIFwiXCIsIFwiQ3JlYXRlXCIsIGZ1bmN0aW9uKG5ld05hbWUpe1xyXG4gICAgXHRcdGlmKG5ld05hbWUpXHJcbiAgICBcdFx0XHRnYW1lLmFkZENhdGVnb3J5KG5ld05hbWUpO1xyXG4gICAgXHR9KTtcclxuXHRcdGJvYXJkQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2JvYXJkLWNvbnRleHQgI3JlbmFtZS1jYXRlZ29yeScpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdFBvcHVwLnByb21wdCh3aW5kb3dEaXYsIFwiUmVuYW1lIENhdGVnb3J5XCIsIFwiQ2F0ZWdvcnkgTmFtZTpcIiwgZ2FtZS5jYXRlZ29yaWVzW2dhbWUuYWN0aXZlQm9hcmRJbmRleF0ubmFtZSwgXCJSZW5hbWVcIiwgZnVuY3Rpb24obmV3TmFtZSl7XHJcbiAgICBcdFx0aWYobmV3TmFtZSl7XHJcbiAgICBcdFx0XHRnYW1lLmNhdGVnb3JpZXNbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5uYW1lID0gbmV3TmFtZTtcclxuICAgIFx0XHRcdGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5pbm5lckhUTUwgPSBuZXdOYW1lO1xyXG4gICAgXHRcdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG4gICAgXHRcdFx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcbiAgICBcdFx0XHRjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIilbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5pbm5lckhUTUwgPSBuZXdOYW1lO1xyXG4gICAgXHRcdFx0Y2FzZURhdGEuY2FzZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGNhc2VGaWxlKTtcclxuICAgIFx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuICAgIFx0XHR9XHJcbiAgICBcdH0pO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjZGVsZXRlLWNhdGVnb3J5Jykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoZ2FtZS5ib2FyZEFycmF5Lmxlbmd0aD4xICYmIGNvbmZpcm0oXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoZSBjdXJyZW50IGNhdGVnb3J5IFlvdSBjYW4ndCB1bmRvIHRoaXMgYWN0aW9uIVwiKSlcclxuXHRcdFx0Z2FtZS5kZWxldGVDYXRlZ29yeSgpO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjZm9yd2FyZC1jYXRlZ29yeScpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdGlmKGdhbWUuYWN0aXZlQm9hcmRJbmRleCsxPGdhbWUuY2F0ZWdvcmllcy5sZW5ndGgpXHJcblx0XHRcdGdhbWUubW92ZUNhdGVnb3J5KDEpO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjYmFja3dhcmQtY2F0ZWdvcnknKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRpZihnYW1lLmFjdGl2ZUJvYXJkSW5kZXgtMT49MClcclxuXHRcdFx0Z2FtZS5tb3ZlQ2F0ZWdvcnkoLTEpO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdFxyXG5cdFxyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjZWRpdC1pbmZvJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0UG9wdXAuZWRpdEluZm8od2luZG93RGl2LCBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKSwgZnVuY3Rpb24obmV3Q2FzZUZpbGUsIG5hbWUpe1xyXG5cdCAgICBcdGxvY2FsU3RvcmFnZVsnY2FzZU5hbWUnXSA9bmFtZStcIi5pcGFyXCI7XHJcblx0XHRcdGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcobmV3Q2FzZUZpbGUpO1xyXG5cdFx0XHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0XHR9KTtcclxuXHRcdGJvYXJkQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2JvYXJkLWNvbnRleHQgI2VkaXQtcmVzb3VyY2VzJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0Z2FtZS5yZXNvdXJjZXMub3BlbldpbmRvdyh3aW5kb3dEaXYsIGZhbHNlLCBmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHRcdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdFx0XHR2YXIgcmVzb3VyY2VMaXN0ID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJyZXNvdXJjZUxpc3RcIilbMF07XHJcblx0XHRcdHJlc291cmNlTGlzdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChnYW1lLnJlc291cmNlcy54bWwoY2FzZUZpbGUpLCByZXNvdXJjZUxpc3QpO1xyXG5cdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdFx0XHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0XHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0fSk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0XHJcblxyXG5cdC8vIEdldCBhbmQgc2V0dXAgdGhlIG5vZGUgY29udGV4dCBtZW51XHJcblx0dmFyIG5vZGVDb250ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrdGhpcy5zZWN0aW9uLmlkKycgI25vZGUtY29udGV4dCcpO1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbm9kZS1jb250ZXh0ICNhZGQtY29ubmVjdGlvbicpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmFkZENvbm5lY3Rpb24oZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUpO1xyXG5cdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHRub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI25vZGUtY29udGV4dCAjaGlkZS1jb25uZWN0aW9uJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoPjApe1xyXG5cdFx0XHRnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5oaWRlQ29ubmVjdGlvbihnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5jb250ZXh0Tm9kZSk7XHJcblx0XHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0fVxyXG5cdFx0bm9kZUNvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNub2RlLWNvbnRleHQgI3JlbW92ZS1jb25uZWN0aW9uJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoPjApe1xyXG5cdFx0XHRnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5yZW1vdmVDb25uZWN0aW9uKGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmNvbnRleHROb2RlKTtcclxuXHRcdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHR9XHJcblx0XHRub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI25vZGUtY29udGV4dCAjZGVsZXRlLXF1ZXN0aW9uJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoY29uZmlybShcIkFyZSB5b3Ugc3VyZSB3YW50IHRvIGRlbGV0ZSB0aGlzIHF1ZXN0aW9uPyBZb3UgY2FuJ3QgdW5kbyB0aGlzIGFjdGlvbiFcIikpe1xyXG5cdFx0XHR2YXIgYm9hcmQgPSBnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XSxcclxuXHRcdFx0XHRjYXQgPSBnYW1lLmNhdGVnb3JpZXNbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XTtcclxuXHRcdFx0Zm9yKHZhciBpPTA7aTxjYXQucXVlc3Rpb25zLmxlbmd0aDtpKyspe1xyXG5cdFx0XHRcdGlmKGNhdC5xdWVzdGlvbnNbaV0ubnVtPmJvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bSlcclxuXHRcdFx0XHRcdGNhdC5xdWVzdGlvbnNbaV0ubnVtLS07XHJcblx0XHRcdFx0dmFyIGNvbiA9IGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMuaW5kZXhPZihib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW0rMSk7XHJcblx0XHRcdFx0d2hpbGUoY29uIT0tMSl7XHJcblx0XHRcdFx0XHRjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLnNwbGljZShjb24sIDEpO1xyXG5cdFx0XHRcdFx0Y29uID0gY2F0LnF1ZXN0aW9uc1tpXS5jb25uZWN0aW9ucy5pbmRleE9mKGJvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bSsxKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Zm9yKHZhciBqPTA7ajxjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLmxlbmd0aDtqKyspXHJcblx0XHRcdFx0XHRpZihjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zW2pdLTE+Ym9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtKVxyXG5cdFx0XHRcdFx0XHRjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zW2pdLS07XHJcblx0XHRcdH1cclxuXHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5LnNwbGljZShib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW0sIDEpO1xyXG5cdFx0XHRjYXQucXVlc3Rpb25zLnNwbGljZShib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW0sIDEpO1xyXG5cdFx0XHRnYW1lLnNhdmUoKTtcclxuXHRcdH1cclxuXHRcdG5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbm9kZS1jb250ZXh0ICNtYWtlLWxhcmdlcicpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdHZhciBib2FyZCA9IGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0aWYoYm9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGU8Q29uc3RhbnRzLm1heE5vZGVTY2FsZSl7XHJcblx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW1dLnF1ZXN0aW9uLnNjYWxlICs9IENvbnN0YW50cy5ub2RlU3RlcDtcclxuXHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0udXBkYXRlSW1hZ2UoKTtcclxuXHRcdH1cclxuXHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0bm9kZUNvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNub2RlLWNvbnRleHQgI21ha2Utc21hbGxlcicpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdHZhciBib2FyZCA9IGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0aWYoYm9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGU+Q29uc3RhbnRzLm1pbk5vZGVTY2FsZSl7XHJcblx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW1dLnF1ZXN0aW9uLnNjYWxlIC09IENvbnN0YW50cy5ub2RlU3RlcDtcclxuXHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0udXBkYXRlSW1hZ2UoKTtcclxuXHRcdH1cclxuXHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0bm9kZUNvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0XHJcblx0XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgZ2l2ZW4gc2NhbGVcclxuXHR0aGlzLnNjYWxlID0gYmFzZVNjYWxlO1xyXG5cdFxyXG5cdC8vIExvYWQgdGhlIGNhc2UgZmlsZVxyXG5cdHZhciBsb2FkRGF0YSA9IEZpbGVNYW5hZ2VyLmxvYWRDYXNlKEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICN3aW5kb3cnKSk7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBib2FyZHNcclxuXHR0aGlzLnJlc291cmNlcyA9IGxvYWREYXRhLnJlc291cmNlcztcclxuXHR0aGlzLmNhdGVnb3JpZXMgPSBsb2FkRGF0YS5jYXRlZ29yaWVzO1xyXG5cdHRoaXMubm9kZUNvbnRleHQgPSBub2RlQ29udGV4dDtcclxuXHR0aGlzLmJvYXJkQ29udGV4dCA9IGJvYXJkQ29udGV4dDtcclxuXHR0aGlzLmNyZWF0ZUxlc3Nvbk5vZGVzKCk7XHJcblx0XHJcblx0Ly8gRGlzcGxheSB0aGUgY3VycmVudCBib2FyZFxyXG5cdHRoaXMuYWN0aXZlQm9hcmRJbmRleCA9IGxvYWREYXRhLmNhdGVnb3J5O1xyXG5cdHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5zaG93KCk7XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYnV0dG9uLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XHJcblx0em9vbVNsaWRlci52YWx1ZSA9IC10aGlzLmdldFpvb20oKTtcclxuXHRcclxuXHQvLyBTZXR1cCB0aGUgc2F2ZSBidXR0b25cclxuXHRGaWxlTWFuYWdlci5wcmVwYXJlWmlwKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYmxvYicpKTtcclxuXHRcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGltYWdlcyB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gUG9wdXBXaW5kb3dzLmltYWdlc0VkaXRvcjtcclxuICAgIHRoaXMuaW1hZ2VzV2luZG93ID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgXHJcbiAgICAvLyBGaWxsIGl0IHdpdGggdGhlIGN1cnJlbnQgaW1hZ2VzXHJcbiAgICB2YXIgY29udGVudCA9IHRoaXMuaW1hZ2VzV2luZG93LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJpbWFnZUNvbnRlbnRcIilbMF07XHJcbiAgICBmb3IodmFyIGk9MDtpPGxvYWREYXRhLmltYWdlcy5sZW5ndGg7aSsrKVxyXG4gICAgXHRjb250ZW50LmlubmVySFRNTCArPSBQb3B1cFdpbmRvd3MuaW1hZ2UucmVwbGFjZSgvJWltYWdlJS9nLCBsb2FkRGF0YS5pbWFnZXNbaV0pO1xyXG5cclxuXHQvLyBBZGQgaXQgdG8gYWxsIHRoZSBxdWVzdGlvbnNcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGg7aSsrKVxyXG5cdFx0Zm9yKHZhciBqPTA7ajx0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zLmxlbmd0aDtqKyspXHJcblx0XHRcdHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0uaW1hZ2VzV2luZG93ID0gdGhpcy5pbWFnZXNXaW5kb3c7XHJcbn1cclxuXHJcbnZhciBwID0gZ2FtZS5wcm90b3R5cGU7XHJcblxyXG5wLmFkZENhdGVnb3J5ID0gZnVuY3Rpb24obmFtZSl7XHJcblx0XHJcblx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdHZhciBjYXQgPSBjYXNlRmlsZS5jcmVhdGVFbGVtZW50KFwiY2F0ZWdvcnlcIik7XHJcblx0Y2F0LnNldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIiwgdGhpcy5jYXRlZ29yaWVzLmxlbmd0aCk7XHJcblx0Y2F0LnNldEF0dHJpYnV0ZShcInF1ZXN0aW9uQ291bnRcIiwgMCk7XHJcblx0Y2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmFwcGVuZENoaWxkKGNhdCk7XHJcblx0dGhpcy5jYXRlZ29yaWVzLnB1c2gobmV3IENhdGVnb3J5KG5hbWUsIGNhdCwgdGhpcy5yZXNvdXJjZXMsIHdpbmRvd0RpdikpO1xyXG5cdHRoaXMuY3JlYXRlQm9hcmQodGhpcy5jYXRlZ29yaWVzW3RoaXMuY2F0ZWdvcmllcy5sZW5ndGgtMV0sIHRoaXMuY2F0ZWdvcmllcy5sZW5ndGgtMSk7XHJcblx0XHJcblx0Y2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmFwcGVuZENoaWxkKGNhdCk7XHJcblx0dmFyIGxpc3QgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXTtcclxuXHRsaXN0LnNldEF0dHJpYnV0ZShcImNhdGVnb3J5Q291bnRcIiwgdGhpcy5jYXRlZ29yaWVzLmxlbmd0aCk7XHJcblx0dmFyIG5ld0VsZW1lbnQgPSBjYXNlRmlsZS5jcmVhdGVFbGVtZW50KFwiZWxlbWVudFwiKTtcclxuXHRuZXdFbGVtZW50LmlubmVySFRNTCA9IG5hbWU7XHJcblx0bGlzdC5hcHBlbmRDaGlsZChuZXdFbGVtZW50KTtcclxuXHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcclxufVxyXG5cclxucC5tb3ZlQ2F0ZWdvcnkgPSBmdW5jdGlvbihkaXIpe1xyXG5cdFxyXG5cdC8vIEZsaXAgdGhlIGNhdGVnb3JpZXMgZmlyc3RcclxuXHR2YXIgdGVtcCA9IHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdID0gdGhpcy5jYXRlZ29yaWVzW2Rpcit0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXSA9IHRlbXA7XHJcblx0XHJcblx0Ly8gTmV4dCBmbGlwIHRoZSBidXR0b24gbmFtZXNcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubmFtZTtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4K2Rpcl0uYnV0dG9uLmlubmVySFRNTCA9IHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5uYW1lO1xyXG5cdFxyXG5cdC8vIFRoZW4gZmxpcCB0aGUgYnV0dG9uc1xyXG5cdHRlbXAgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4K2Rpcl0uYnV0dG9uO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5idXR0b24gPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b247XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYnV0dG9uID0gdGVtcDtcclxuXHRcclxuXHQvLyBUaGVuLCBmbGlwIHRoZSBib2FyZHNcclxuXHR0ZW1wID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXSA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdID0gdGVtcDtcclxuXHRcclxuXHQvLyBGaW5hbGx5LCBmbGlwIHRoZSBkYXRhIGluIHRoZSB4bWwgYW5kIHNhdmVcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0dmFyIGxpc3QgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIik7XHJcblx0bGlzdFt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmlubmVySFRNTCA9IHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLm5hbWU7XHJcblx0bGlzdFt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5pbm5lckhUTUwgPSB0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4K2Rpcl0ubmFtZTtcclxuXHR2YXIgY2F0cyA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIik7XHJcblx0Zm9yKHZhciBpPTA7aTxjYXRzLmxlbmd0aDtpKyspe1xyXG5cdFx0aWYoTnVtYmVyKGNhdHNbaV0uZ2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiKSk9PXRoaXMuYWN0aXZlQm9hcmRJbmRleClcclxuXHRcdFx0Y2F0c1tpXS5zZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIsIHRoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXIpO1xyXG5cdFx0ZWxzZSBpZihOdW1iZXIoY2F0c1tpXS5nZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIpKT09dGhpcy5hY3RpdmVCb2FyZEluZGV4K2RpcilcclxuXHRcdFx0Y2F0c1tpXS5zZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIsIHRoaXMuYWN0aXZlQm9hcmRJbmRleCk7XHJcblx0fVxyXG5cdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFxyXG5cdFxyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5idXR0b24uY2xhc3NOYW1lID0gXCJhY3RpdmVcIjtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uY2xhc3NOYW1lID0gXCJcIjtcclxuXHR0aGlzLmFjdGl2ZUJvYXJkSW5kZXggKz0gZGlyO1xyXG59XHJcblxyXG5wLmRlbGV0ZUNhdGVnb3J5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHJcblx0Ly8gUmVtb3ZlIHRoZSBidXR0b24sIGJvYXJkLCBhbmQgY2F0IGZpcnN0XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYm9hcmRBcnJheS5sZW5ndGgtMV0uYnV0dG9uLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ib2FyZEFycmF5W3RoaXMuYm9hcmRBcnJheS5sZW5ndGgtMV0uYnV0dG9uKTtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5jYW52YXMpO1xyXG5cdGZvcih2YXIgaT10aGlzLmJvYXJkQXJyYXkubGVuZ3RoLTE7aT50aGlzLmFjdGl2ZUJvYXJkSW5kZXg7aS0tKXtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtpXS5idXR0b24gPSB0aGlzLmJvYXJkQXJyYXlbaS0xXS5idXR0b247XHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbaV0uYnV0dG9uLmlubmVySFRNTCA9IHRoaXMuY2F0ZWdvcmllc1tpXS5uYW1lO1xyXG5cdH1cclxuXHRmb3IodmFyIGk9dGhpcy5hY3RpdmVCb2FyZEluZGV4KzE7aTx0aGlzLmJvYXJkQXJyYXkubGVuZ3RoO2krKyl7XHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbaS0xXSA9IHRoaXMuYm9hcmRBcnJheVtpXTtcclxuXHRcdHRoaXMuY2F0ZWdvcmllc1tpLTFdID0gdGhpcy5jYXRlZ29yaWVzW2ldO1xyXG5cdH1cclxuXHR0aGlzLmJvYXJkQXJyYXkucG9wKCk7XHJcblx0dGhpcy5jYXRlZ29yaWVzLnBvcCgpO1xyXG5cdFxyXG5cdC8vIFRoZW4gcmVtb3ZlIGl0IGZyb20gdGhlIHhtbFxyXG5cdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHR2YXIgbGlzdCA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdO1xyXG5cdGxpc3Quc2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlDb3VudFwiLCB0aGlzLmNhdGVnb3JpZXMubGVuZ3RoKTtcclxuXHRsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbGVtZW50XCIpW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0pO1xyXG5cdHZhciBjYXRzID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGNhdHMubGVuZ3RoO2krKyl7XHJcblx0XHRpZihOdW1iZXIoY2F0c1tpXS5nZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIpKT09dGhpcy5hY3RpdmVCb2FyZEluZGV4KXtcclxuXHRcdFx0Y2F0c1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNhdHNbaV0pO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblx0Y2F0cyA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIik7XHJcblx0Zm9yKHZhciBpPTA7aTxjYXRzLmxlbmd0aDtpKyspXHJcblx0XHRpZihOdW1iZXIoY2F0c1tpXS5nZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIpKT50aGlzLmFjdGl2ZUJvYXJkSW5kZXgpXHJcblx0XHRcdGNhdHNbaV0uc2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiLCB0aGlzLmFjdGl2ZUJvYXJkSW5kZXgtMSk7XHJcblx0Y2FzZURhdGEuY2FzZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGNhc2VGaWxlKTtcclxuXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0XHJcblx0aWYodGhpcy5hY3RpdmVCb2FyZEluZGV4Pj10aGlzLmJvYXJkQXJyYXkubGVuZ3RoKVxyXG5cdFx0dGhpcy5hY3RpdmVCb2FyZEluZGV4ID0gdGhpcy5ib2FyZEFycmF5Lmxlbmd0aC0xO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xyXG5cdHRoaXMubmV3Qm9hcmQgPSB0aGlzLmFjdGl2ZUJvYXJkSW5kZXg7XHJcblx0dGhpcy56b29tb3V0ID0gdHJ1ZTtcclxufVxyXG5cclxucC5jcmVhdGVMZXNzb25Ob2RlcyA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy5ib2FyZEFycmF5ID0gW107XHJcblx0dGhpcy5ib3R0b21CYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyt0aGlzLnNlY3Rpb24uaWQrJyAjYm90dG9tQmFyJyk7XHJcblx0dGhpcy5tb3VzZVN0YXRlID0gbmV3IE1vdXNlU3RhdGUoKTtcclxuXHR0aGlzLmtleWJvYXJkU3RhdGUgPSBuZXcgS2V5Ym9hcmRTdGF0ZSh0aGlzKTtcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGg7aSsrKVxyXG5cdFx0dGhpcy5jcmVhdGVCb2FyZCh0aGlzLmNhdGVnb3JpZXNbaV0sIGkpO1xyXG5cdFxyXG59XHJcblxyXG5wLmNyZWF0ZUJvYXJkID0gZnVuY3Rpb24oY2F0LCBudW0pe1xyXG5cdHRoaXMubGVzc29uTm9kZXMgPSBbXTtcclxuXHQvLyBhZGQgYSBub2RlIHBlciBxdWVzdGlvblxyXG5cdGZvciAodmFyIGogPSAwOyBqIDwgY2F0LnF1ZXN0aW9ucy5sZW5ndGg7IGorKykge1xyXG5cdFx0Ly8gY3JlYXRlIGEgbmV3IGxlc3NvbiBub2RlXHJcblx0XHR0aGlzLmxlc3Nvbk5vZGVzLnB1c2gobmV3IExlc3Nvbk5vZGUoIGNhdC5xdWVzdGlvbnNbal0gKSApO1xyXG5cdFx0Ly8gYXR0YWNoIHF1ZXN0aW9uIG9iamVjdCB0byBsZXNzb24gbm9kZVxyXG5cdFx0dGhpcy5sZXNzb25Ob2Rlc1t0aGlzLmxlc3Nvbk5vZGVzLmxlbmd0aC0xXS5xdWVzdGlvbiA9IGNhdC5xdWVzdGlvbnNbal07XHJcblx0XHJcblx0fVxyXG5cclxuXHQvLyBjcmVhdGUgYSBib2FyZFxyXG5cdHRoaXMuYm9hcmRBcnJheVtudW1dID0gbmV3IEJvYXJkKHRoaXMuc2VjdGlvbiwgdGhpcy5ib2FyZENvbnRleHQsIHRoaXMubm9kZUNvbnRleHQsIHRoaXMubW91c2VTdGF0ZSwgbmV3IFBvaW50KENvbnN0YW50cy5ib2FyZFNpemUueC8yLCBDb25zdGFudHMuYm9hcmRTaXplLnkvMiksIHRoaXMubGVzc29uTm9kZXMsIHRoaXMuc2F2ZS5iaW5kKHRoaXMpKTtcclxuXHR2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkJVVFRPTlwiKTtcclxuXHRidXR0b24uaW5uZXJIVE1MID0gY2F0Lm5hbWU7XHJcblx0dmFyIGdhbWUgPSB0aGlzO1xyXG5cdGJ1dHRvbi5vbmNsaWNrID0gKGZ1bmN0aW9uKGkpeyBcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYoZ2FtZS5hY3RpdmUpe1xyXG5cdFx0XHRcdGdhbWUuY2hhbmdlQm9hcmQoaSk7XHJcblx0XHRcdH1cclxuXHR9fSkobnVtKTtcclxuXHR0aGlzLmJvdHRvbUJhci5hcHBlbmRDaGlsZChidXR0b24pO1xyXG5cdHRoaXMuYm9hcmRBcnJheVtudW1dLmJ1dHRvbiA9IGJ1dHRvbjtcclxufVxyXG5cclxucC51cGRhdGUgPSBmdW5jdGlvbihkdCl7XHJcblxyXG4gICAgaWYodGhpcy5hY3RpdmUpe1xyXG4gICAgXHJcbiAgICBcdC8vIHBlcmZvcm0gZ2FtZSBhY3Rpb25zXHJcbiAgICBcdHRoaXMuYWN0KGR0KTtcclxuICAgIFx0XHJcblx0ICAgIC8vIGRyYXcgc3R1ZmZcclxuXHQgICAgdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uZHJhdyh0aGlzLnNjYWxlLCB0aGlzLm1vdXNlU3RhdGUpO1xyXG5cdCAgICBcclxuICAgIH1cclxuICAgIGVsc2UgaWYocGF1c2VkVGltZSE9MCAmJiB3aW5kb3dEaXYuaW5uZXJIVE1MPT0nJylcclxuICAgIFx0dGhpcy53aW5kb3dDbG9zZWQoKTtcclxuICAgIFxyXG59XHJcblxyXG5wLmFjdCA9IGZ1bmN0aW9uKGR0KXtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG1vdXNlIGFuZCBrZXlib2FyZCBzdGF0ZXNcclxuXHR0aGlzLm1vdXNlU3RhdGUudXBkYXRlKGR0LCB0aGlzLnNjYWxlKnRoaXMuZ2V0Wm9vbSgpKTtcclxuXHR0aGlzLmtleWJvYXJkU3RhdGUudXBkYXRlKCk7XHJcblx0XHJcblx0Ly8gSGFuZGxlIGtleWJvYXJkIHNob3J0Y3V0c1xyXG5cdHRoaXMuY2hlY2tLZXlib2FyZCgpO1xyXG5cdFxyXG5cdFxyXG4gICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGJvYXJkIChnaXZlIGl0IHRoZSBtb3VzZSBvbmx5IGlmIG5vdCB6b29taW5nKVxyXG4gICAgdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYWN0KHRoaXMuc2NhbGUsICh0aGlzLnpvb21vdXQgPyBudWxsIDogdGhpcy5tb3VzZVN0YXRlKSwgZHQpO1xyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBuZXcgYm9hcmQgYXZhaWxhYmxlXHJcbiAgICBpZih0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPCB0aGlzLmJvYXJkQXJyYXkubGVuZ3RoLTEgJiZcclxuICAgIFx0XHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4KzFdLmJ1dHRvbi5kaXNhYmxlZCAmJiBcclxuICAgIFx0XHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5maW5pc2hlZCl7XHJcbiAgICBcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrMV0uYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblx0XHJcblxyXG5cdC8vIElmIHRoZSBuZWVkcyB0byB6b29tIG91dCB0byBjZW50ZXJcclxuXHRpZih0aGlzLnpvb21vdXQpe1xyXG5cdFx0XHJcblx0XHQvLyBHZXQgdGhlIGN1cnJlbnQgYm9hcmRcclxuXHRcdHZhciBib2FyZCA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0XHJcblx0XHQvLyBab29tIG91dCBhbmQgbW92ZSB0b3dhcmRzIGNlbnRlclxyXG5cdFx0aWYodGhpcy5nZXRab29tKCk+Q29uc3RhbnRzLnN0YXJ0Wm9vbSlcclxuXHRcdFx0Ym9hcmQuem9vbSAtPSBkdCpDb25zdGFudHMuem9vbVNwZWVkO1xyXG5cdFx0ZWxzZSBpZih0aGlzLmdldFpvb20oKTxDb25zdGFudHMuc3RhcnRab29tKVxyXG5cdFx0XHRib2FyZC56b29tID0gQ29uc3RhbnRzLnN0YXJ0Wm9vbTtcclxuXHRcdGJvYXJkLm1vdmVUb3dhcmRzKG5ldyBQb2ludChDb25zdGFudHMuYm9hcmRTaXplLngvMiwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55LzIpLCBkdCwgQ29uc3RhbnRzLnpvb21Nb3ZlU3BlZWQpO1xyXG5cdFx0XHJcblx0XHQvLyBVcGRhdGUgdGhlIHpvb20gc2xpZGVyXHJcblx0XHR6b29tU2xpZGVyLnZhbHVlID0gLXRoaXMuZ2V0Wm9vbSgpO1xyXG5cdFx0XHJcblx0XHQvLyBJZiBmdWxseSB6b29tZWQgb3V0IGFuZCBpbiBjZW50ZXIgc3RvcFxyXG5cdFx0aWYodGhpcy5nZXRab29tKCk9PUNvbnN0YW50cy5zdGFydFpvb20gJiYgYm9hcmQuYm9hcmRPZmZzZXQueD09Q29uc3RhbnRzLmJvYXJkU2l6ZS54LzIgJiYgYm9hcmQuYm9hcmRPZmZzZXQueT09Q29uc3RhbnRzLmJvYXJkU2l6ZS55LzIpe1x0XHRcdFx0XHJcblx0XHRcdHRoaXMuem9vbW91dCA9IGZhbHNlO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gSWYgY2hhbmdpbmcgYm9hcmQgc3RhcnQgdGhhdCBwcm9jZXNzXHJcblx0XHRcdGlmKHRoaXMubmV3Qm9hcmQhPW51bGwpe1xyXG5cdFx0XHRcdHZhciBkaXIgPSB0aGlzLm5ld0JvYXJkIDwgdGhpcy5hY3RpdmVCb2FyZEluZGV4O1xyXG5cdFx0XHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmhpZGUoZGlyKTtcclxuXHRcdFx0XHR0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPSB0aGlzLm5ld0JvYXJkO1xyXG5cdFx0XHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnNob3coZGlyKTtcclxuXHRcdFx0XHR6b29tU2xpZGVyLnZhbHVlID0gLXRoaXMuZ2V0Wm9vbSgpO1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRcdFx0dmFyIGdhbWUgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmxvYWRlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRnYW1lLmFjdGl2ZSA9IHRydWU7XHJcblx0XHRcdFx0XHRnYW1lLm5ld0JvYXJkID0gbnVsbDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZXsgLy8gT25seSBoYW5kbGUgem9vbWluZyBpZiBub3QgcGVyZm9ybWluZyBhbmltYXRpb24gem9vbVxyXG5cdFxyXG5cdFx0Ly8gSGFuZGxlIHBpbmNoIHpvb21cclxuXHQgICAgaWYodGhpcy5tb3VzZVN0YXRlLnpvb21EaWZmIT0wKXtcclxuXHQgICAgXHR6b29tU2xpZGVyLnZhbHVlID0gcGluY2hTdGFydCArIHRoaXMubW91c2VTdGF0ZS56b29tRGlmZiAqIENvbnN0YW50cy5waW5jaFNwZWVkO1xyXG5cdCAgICBcdHRoaXMudXBkYXRlWm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7IFxyXG5cdCAgICB9XHJcblx0ICAgIGVsc2VcclxuXHQgICAgXHRwaW5jaFN0YXJ0ID0gTnVtYmVyKHpvb21TbGlkZXIudmFsdWUpO1xyXG5cdCAgICBcclxuXHQgICAgLy8gSGFuZGxlIG1vdXNlIHpvb21cclxuXHQgICAgaWYodGhpcy5tb3VzZVN0YXRlLm1vdXNlV2hlZWxEWSE9MClcclxuXHQgICAgXHR0aGlzLnpvb20odGhpcy5tb3VzZVN0YXRlLm1vdXNlV2hlZWxEWTwwKTtcclxuXHR9XHJcblxyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBzaG91bGQgcGF1c2VcclxuICAgIGlmKHdpbmRvd0Rpdi5pbm5lckhUTUwhPScnICYmIHBhdXNlZFRpbWUrKz4zKXtcclxuICAgIFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIFx0d2luZG93RmlsbS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5wLmdldFpvb20gPSBmdW5jdGlvbigpe1xyXG5cdHJldHVybiB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS56b29tO1xyXG59XHJcblxyXG5wLnNldFpvb20gPSBmdW5jdGlvbih6b29tKXtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS56b29tID0gem9vbTtcclxufVxyXG5cclxucC56b29tID0gZnVuY3Rpb24oZGlyKXtcclxuXHRpZihkaXIpXHJcbiAgICBcdHpvb21TbGlkZXIuc3RlcERvd24oKTtcclxuICAgIGVsc2VcclxuICAgIFx0em9vbVNsaWRlci5zdGVwVXAoKTtcclxuXHR0aGlzLnNldFpvb20oLXBhcnNlRmxvYXQoem9vbVNsaWRlci52YWx1ZSkpO1xyXG59XHJcblxyXG5wLnNldFNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5ib2FyZEFycmF5Lmxlbmd0aDtpKyspXHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbaV0udXBkYXRlU2l6ZSgpO1xyXG5cdHRoaXMuc2NhbGUgPSBzY2FsZTtcclxufVxyXG5cclxucC5jaGFuZ2VCb2FyZCA9IGZ1bmN0aW9uKG51bSl7XHJcblx0aWYobnVtIT10aGlzLmFjdGl2ZUJvYXJkSW5kZXgpe1xyXG5cdFx0dGhpcy5ib2FyZEFycmF5W251bV0uYnV0dG9uLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uY2xhc3NOYW1lID0gXCJcIjtcclxuXHRcdHRoaXMubmV3Qm9hcmQgPSBudW07XHJcblx0XHR0aGlzLnpvb21vdXQgPSB0cnVlO1xyXG5cdH1cclxufVxyXG5cclxucC53aW5kb3dDbG9zZWQgPSBmdW5jdGlvbigpIHtcclxuXHRcclxuXHQvLyBVbnBhdXNlIHRoZSBnYW1lIGFuZCBmdWxseSBjbG9zZSB0aGUgd2luZG93XHJcblx0cGF1c2VkVGltZSA9IDA7XHJcblx0dGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cdHdpbmRvd0ZpbG0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcclxuXHR2YXIgc2F2ZSA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLndpbmRvd0Nsb3NlZCgpO1xyXG5cdFxyXG5cdGlmKHNhdmUpe1xyXG5cdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0XHRpZihzYXZlLnhtbCl7XHJcblx0XHRcdHZhciBjYXQgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY2F0ZWdvcnknKVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0XHRjYXQucmVwbGFjZUNoaWxkKHNhdmUueG1sLCBjYXQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpW3NhdmUubnVtXSk7XHJcblx0XHRcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcdH1cclxuXHRcdGVsc2V7XHJcblx0XHRcdHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnF1ZXN0aW9uc1tzYXZlLm51bV0ueG1sID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NhdGVnb3J5JylbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylbc2F2ZS5udW1dO1xyXG5cdFx0XHR0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5xdWVzdGlvbnNbc2F2ZS5udW1dLnJlZnJlc2goKTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0dGhpcy5zYXZlKCk7XHJcblx0XHJcbn1cclxuXHJcbnAuc2F2ZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0dmFyIGxlc3Nvbk5vZGVzID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5O1xyXG5cdGZvcih2YXIgaT0wO2k8bGVzc29uTm9kZXMubGVuZ3RoO2krKylcclxuXHRcdGxlc3Nvbk5vZGVzW2ldLnNhdmUoKTtcclxuXHRcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0dmFyIGNhc2VOb2RlID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdO1xyXG5cdHZhciBjYXQgPSBjYXNlTm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5XCIpWzBdO1xyXG5cdHdoaWxlKGNhdCl7XHJcblx0XHRjYXNlTm9kZS5yZW1vdmVDaGlsZChjYXQpO1xyXG5cdFx0Y2F0ID0gY2FzZU5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKVswXTtcclxuXHR9XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmNhdGVnb3JpZXMubGVuZ3RoO2krKylcclxuXHRcdGNhc2VOb2RlLmFwcGVuZENoaWxkKHRoaXMuY2F0ZWdvcmllc1tpXS54bWwoY2FzZUZpbGUsIGkpKTtcclxuXHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcclxufVxyXG5cclxucC5hZGRRdWVzdGlvbiA9IGZ1bmN0aW9uKHgsIHkpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgY2FzZSB0byBhZGQgdGhlIHF1ZXN0aW9uXHJcblx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdHZhciBuZXdRdWVzdGlvbiA9IGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgneFBvc2l0aW9uUGVyY2VudCcsIHgpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgneVBvc2l0aW9uUGVyY2VudCcsIHkpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgnc2NhbGUnLCAnMScpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgnbnVtQ29ubmVjdGlvbnMnLCAnMCcpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgnbnVtQW5zd2VycycsICczJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdjb3JyZWN0QW5zd2VyJywgJzAnKTtcclxuXHRuZXdRdWVzdGlvbi5zZXRBdHRyaWJ1dGUoJ2ltYWdlTGluaycsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cigwLCB3aW5kb3cubG9jYXRpb24uaHJlZi5zdWJzdHIoMCwgd2luZG93LmxvY2F0aW9uLmhyZWYubGVuZ3RoLTEpLmxhc3RJbmRleE9mKFwiL1wiKSkrXCIvaW1hZ2UvXCIrJ2ViMTgzMmE4MGZhNDFlMzk1NDkxNTcxZDQ5MzAxMTliLnBuZycpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgncmV2ZWFsVGhyZXNob2xkJywgJzAnKTtcclxuXHRuZXdRdWVzdGlvbi5zZXRBdHRyaWJ1dGUoJ3F1ZXN0aW9uVHlwZScsICcyJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdyZXNvdXJjZUNvdW50JywgJzAnKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdxdWVzdGlvbk5hbWUnKSk7XHJcblx0bmV3UXVlc3Rpb24uYXBwZW5kQ2hpbGQoY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgnaW5zdHJ1Y3Rpb25zJykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ3F1ZXN0aW9uVGV4dCcpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdhbnN3ZXInKSk7XHJcblx0bmV3UXVlc3Rpb24uYXBwZW5kQ2hpbGQoY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgnYW5zd2VyJykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2Fuc3dlcicpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdmZWVkYmFjaycpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdmZWVkYmFjaycpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdmZWVkYmFjaycpKTtcclxuXHR2YXIgY2F0cyA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjYXRlZ29yeScpO1xyXG5cdGZvcih2YXIgaT0wO2k8Y2F0cy5sZW5ndGg7aSsrKXtcclxuXHRcdGlmKE51bWJlcihjYXRzW2ldLmdldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIikpPT10aGlzLmFjdGl2ZUJvYXJkSW5kZXgpXHJcblx0XHR7XHJcblx0XHRcdGNhdHNbaV0uYXBwZW5kQ2hpbGQobmV3UXVlc3Rpb24pO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0dmFyIHF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKG5ld1F1ZXN0aW9uLCB0aGlzLnJlc291cmNlcywgd2luZG93RGl2LCB0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5xdWVzdGlvbnMubGVuZ3RoKTtcclxuXHRxdWVzdGlvbi5pbWFnZXNXaW5kb3cgPSB0aGlzLmltYWdlc1dpbmRvdztcclxuXHR0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5xdWVzdGlvbnMucHVzaChxdWVzdGlvbik7XHJcblx0dmFyIGxlc3Nvbk5vZGVzID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5O1xyXG5cdGxlc3Nvbk5vZGVzLnB1c2gobmV3IExlc3Nvbk5vZGUoIHF1ZXN0aW9uICkgKTtcclxuXHQvLyBhdHRhY2ggcXVlc3Rpb24gb2JqZWN0IHRvIGxlc3NvbiBub2RlXHJcblx0bGVzc29uTm9kZXNbbGVzc29uTm9kZXMubGVuZ3RoLTFdLnF1ZXN0aW9uID0gcXVlc3Rpb247XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5ID0gbGVzc29uTm9kZXM7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgY2hhbmdlcyB0byBsb2NhbCBzdG9yYWdlXHJcblx0dGhpcy5zYXZlKCk7XHJcblx0XHJcbn1cclxuXHJcbnAuY2hlY2tLZXlib2FyZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNDZdKXsgLy8gRGVsZXRlIC0gRGVsZXRlIENhdGVnb3J5XHJcblx0XHRpZih0aGlzLmJvYXJkQXJyYXkubGVuZ3RoPjEgJiYgY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGN1cnJlbnQgY2F0ZWdvcnkgWW91IGNhbid0IHVuZG8gdGhpcyBhY3Rpb24hXCIpKVxyXG5cdFx0XHR0aGlzLmRlbGV0ZUNhdGVnb3J5KCk7XHJcblx0fVxyXG5cdFxyXG5cdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlbMTddKXsgLy8gQ3RybFxyXG5cdFx0XHJcblx0XHR2YXIgYm9hcmQgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XTtcclxuXHRcdHZhciBnYW1lID0gdGhpcztcclxuXHRcdFxyXG5cdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNjddKXsgLy8gQyAtIEFkZCBDYXRlZ29yeVxyXG5cdFx0XHRQb3B1cC5wcm9tcHQod2luZG93RGl2LCBcIkNyZWF0ZSBDYXRlZ29yeVwiLCBcIkNhdGVnb3J5IE5hbWU6XCIsIFwiXCIsIFwiQ3JlYXRlXCIsIGZ1bmN0aW9uKG5ld05hbWUpe1xyXG5cdCAgICBcdFx0aWYobmV3TmFtZSlcclxuXHQgICAgXHRcdFx0Z2FtZS5hZGRDYXRlZ29yeShuZXdOYW1lKTtcclxuXHQgICAgXHR9KTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbODZdKXsgLy8gViAtIFJlbmFtZSBDYXRlZ29yeVxyXG5cdFx0XHRQb3B1cC5wcm9tcHQod2luZG93RGl2LCBcIlJlbmFtZSBDYXRlZ29yeVwiLCBcIkNhdGVnb3J5IE5hbWU6XCIsIHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLm5hbWUsIFwiUmVuYW1lXCIsIGZ1bmN0aW9uKG5ld05hbWUpe1xyXG5cdCAgICBcdFx0aWYobmV3TmFtZSl7XHJcblx0ICAgIFx0XHRcdGdhbWUuY2F0ZWdvcmllc1tnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLm5hbWUgPSBuZXdOYW1lO1xyXG5cdCAgICBcdFx0XHRnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uaW5uZXJIVE1MID0gbmV3TmFtZTtcclxuXHQgICAgXHRcdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdCAgICBcdFx0XHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHQgICAgXHRcdFx0Y2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeUxpc3RcIilbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbGVtZW50XCIpW2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uaW5uZXJIVE1MID0gbmV3TmFtZTtcclxuXHQgICAgXHRcdFx0Y2FzZURhdGEuY2FzZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGNhc2VGaWxlKTtcclxuXHQgICAgXHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdCAgICBcdFx0fVxyXG5cdCAgICBcdH0pO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs4OF0peyAvLyBYIC0gTW92ZSBDYXRlZ29yeSBmb3J3YXJkXHJcblx0XHRcdGlmKHRoaXMuYWN0aXZlQm9hcmRJbmRleCsxPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGgpXHJcblx0XHRcdFx0dGhpcy5tb3ZlQ2F0ZWdvcnkoMSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzkwXSl7IC8vIFogLSBNb3ZlIENhdGVnb3J5IGJhY2t3YXJkXHJcblx0XHRcdGlmKHRoaXMuYWN0aXZlQm9hcmRJbmRleC0xPj0wKVxyXG5cdFx0XHRcdHRoaXMubW92ZUNhdGVnb3J5KC0xKTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNzBdKXsgLy8gRiAtIEVkaXQgQ2FzZSBJbmZvXHJcblx0XHRcdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHRcdFx0UG9wdXAuZWRpdEluZm8od2luZG93RGl2LCBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKSwgZnVuY3Rpb24obmV3Q2FzZUZpbGUsIG5hbWUpe1xyXG5cdFx0ICAgIFx0bG9jYWxTdG9yYWdlWydjYXNlTmFtZSddID1uYW1lK1wiLmlwYXJcIjtcclxuXHRcdFx0XHRjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHRcdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcobmV3Q2FzZUZpbGUpO1xyXG5cdFx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzgyXSl7IC8vIFIgLSBFZGl0IHJlc291cmNlc1xyXG5cdFx0XHR0aGlzLnJlc291cmNlcy5vcGVuV2luZG93KHdpbmRvd0RpdiwgZmFsc2UsIGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0XHRcdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdFx0XHRcdHZhciByZXNvdXJjZUxpc3QgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlTGlzdFwiKVswXTtcclxuXHRcdFx0XHRyZXNvdXJjZUxpc3QucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZ2FtZS5yZXNvdXJjZXMueG1sKGNhc2VGaWxlKSwgcmVzb3VyY2VMaXN0KTtcclxuXHRcdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdFx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcdFx0XHRnYW1lLnNhdmUoKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmKGJvYXJkLnRhcmdldCl7XHJcblxyXG5cdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5WzE2XSl7IC8vIFNoaWZ0XHJcblx0XHRcdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNjVdKXsgLy8gQSAtIEFkZCBjb25uZWN0aW9uXHJcblx0XHRcdFx0XHRib2FyZC5hZGRDb25uZWN0aW9uKGJvYXJkLnRhcmdldCk7XHJcblx0XHRcdFx0XHR0aGlzLnNhdmUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNjhdKXsgLy8gRCAtIFJlbW92ZSBjb25uZWN0aW9uXHJcblx0XHRcdFx0XHRpZihib2FyZC50YXJnZXQucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoPjApe1xyXG5cdFx0XHRcdFx0XHRib2FyZC5yZW1vdmVDb25uZWN0aW9uKGJvYXJkLnRhcmdldCk7XHJcblx0XHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs4M10peyAvLyBTIC0gU2hvdy9IaWRlIGNvbm5lY3Rpb25cclxuXHRcdFx0XHRcdGlmKGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmNvbnRleHROb2RlLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aD4wKXtcclxuXHRcdFx0XHRcdFx0Z2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uaGlkZUNvbm5lY3Rpb24oZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUpO1xyXG5cdFx0XHRcdFx0XHRnYW1lLnNhdmUoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZXtcclxuXHRcdFx0XHJcblx0XHRcdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbNjVdKXsgLy8gQSAtIE1ha2UgcXVlc3Rpb24gc21hbGxlclxyXG5cdFx0XHRcdFx0aWYoYm9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLnRhcmdldC5xdWVzdGlvbi5udW1dLnF1ZXN0aW9uLnNjYWxlPkNvbnN0YW50cy5taW5Ob2RlU2NhbGUpe1xyXG5cdFx0XHRcdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGUgLT0gQ29uc3RhbnRzLm5vZGVTdGVwO1xyXG5cdFx0XHRcdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0udXBkYXRlSW1hZ2UoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzgzXSl7IC8vIFMgLSBNYWtlIHF1ZXN0aW9uIGxhcmdlclxyXG5cdFx0XHRcdFx0aWYoYm9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLnRhcmdldC5xdWVzdGlvbi5udW1dLnF1ZXN0aW9uLnNjYWxlPENvbnN0YW50cy5tYXhOb2RlU2NhbGUpe1xyXG5cdFx0XHRcdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGUgKz0gQ29uc3RhbnRzLm5vZGVTdGVwO1xyXG5cdFx0XHRcdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0udXBkYXRlSW1hZ2UoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs2OF0peyAvLyBEIC0gRGVsZXRlIHF1ZXN0aW9uXHJcblx0XHRcdFx0XHRpZihjb25maXJtKFwiQXJlIHlvdSBzdXJlIHdhbnQgdG8gZGVsZXRlIHRoaXMgcXVlc3Rpb24/IFlvdSBjYW4ndCB1bmRvIHRoaXMgYWN0aW9uIVwiKSl7XHJcblx0XHRcdFx0XHRcdHZhciBjYXQgPSB0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4XTtcclxuXHRcdFx0XHRcdFx0Zm9yKHZhciBpPTA7aTxjYXQucXVlc3Rpb25zLmxlbmd0aDtpKyspe1xyXG5cdFx0XHRcdFx0XHRcdGlmKGNhdC5xdWVzdGlvbnNbaV0ubnVtPmJvYXJkLnRhcmdldC5xdWVzdGlvbi5udW0pXHJcblx0XHRcdFx0XHRcdFx0XHRjYXQucXVlc3Rpb25zW2ldLm51bS0tO1xyXG5cdFx0XHRcdFx0XHRcdHZhciBjb24gPSBjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLmluZGV4T2YoYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSsxKTtcclxuXHRcdFx0XHRcdFx0XHR3aGlsZShjb24hPS0xKXtcclxuXHRcdFx0XHRcdFx0XHRcdGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMuc3BsaWNlKGNvbiwgMSk7XHJcblx0XHRcdFx0XHRcdFx0XHRjb24gPSBjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLmluZGV4T2YoYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSsxKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0Zm9yKHZhciBqPTA7ajxjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLmxlbmd0aDtqKyspXHJcblx0XHRcdFx0XHRcdFx0XHRpZihjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zW2pdLTE+Ym9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y2F0LnF1ZXN0aW9uc1tpXS5jb25uZWN0aW9uc1tqXS0tO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheS5zcGxpY2UoYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSwgMSk7XHJcblx0XHRcdFx0XHRcdGNhdC5xdWVzdGlvbnMuc3BsaWNlKGJvYXJkLnRhcmdldC5xdWVzdGlvbi5udW0sIDEpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNhdmUoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9XHJcblx0XHRlbHNle1xyXG5cdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs4MV0peyAvLyBRIC0gQWRkIFF1ZXN0aW9uXHJcblx0XHRcdFx0dGhpcy5hZGRRdWVzdGlvbigodGhpcy5tb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54K0NvbnN0YW50cy5ib2FyZFNpemUueC8yKS9Db25zdGFudHMuYm9hcmRTaXplLngqMTAwLFxyXG5cdFx0XHRcdFx0XHQodGhpcy5tb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55K0NvbnN0YW50cy5ib2FyZFNpemUueS8yKS9Db25zdGFudHMuYm9hcmRTaXplLnkqMTAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKCcuLi9oZWxwZXIvZHJhd2xpYi5qcycpO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi4vY2FzZS9xdWVzdGlvbi5qc1wiKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoXCIuL2NvbnN0YW50cy5qc1wiKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcblxyXG52YXIgQ0hFQ0tfSU1BR0UgPSBcIi4uL2ltZy9pY29uUG9zdEl0Q2hlY2sucG5nXCI7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBsZXNzb25Ob2RlKHBRdWVzdGlvbil7XHJcbiAgICBcclxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnQocFF1ZXN0aW9uLnBvc2l0aW9uUGVyY2VudFgvMTAwKkNvbnN0YW50cy5ib2FyZFNpemUueCwgcFF1ZXN0aW9uLnBvc2l0aW9uUGVyY2VudFkvMTAwKkNvbnN0YW50cy5ib2FyZFNpemUueSk7XHJcbiAgICB0aGlzLmRyYWdMb2NhdGlvbiA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLnR5cGUgPSBcImxlc3Nvbk5vZGVcIjtcclxuICAgIHRoaXMuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuY2hlY2sgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMud2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodDtcclxuICAgIHRoaXMucXVlc3Rpb24gPSBwUXVlc3Rpb247XHJcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0gMDtcclxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gMDtcclxuICAgIHRoaXMubGluZVBlcmNlbnQgPSAwO1xyXG4gICAgXHJcbiAgICAvLyBza2lwIGFuaW1hdGlvbnMgZm9yIHNvbHZlZFxyXG4gICAgaWYgKHBRdWVzdGlvbi5jdXJyZW50U3RhdGUgPT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEKSB0aGlzLmxpbmVQZXJjZW50ID0gMTtcclxuICAgIFxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgLy9pbWFnZSBsb2FkaW5nIGFuZCByZXNpemluZ1xyXG4gICAgdGhpcy5pbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGF0LndpZHRoID0gdGhhdC5pbWFnZS5uYXR1cmFsV2lkdGg7XHJcbiAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmltYWdlLm5hdHVyYWxIZWlnaHQ7XHJcbiAgICAgICAgdmFyIG1heERpbWVuc2lvbiA9IENvbnN0YW50cy5ib2FyZFNpemUueC8xMDtcclxuICAgICAgICAvL3RvbyBzbWFsbD9cclxuICAgICAgICBpZih0aGF0LndpZHRoIDwgbWF4RGltZW5zaW9uICYmIHRoYXQuaGVpZ2h0IDwgbWF4RGltZW5zaW9uKXtcclxuICAgICAgICAgICAgdmFyIHg7XHJcbiAgICAgICAgICAgIGlmKHRoYXQud2lkdGggPiB0aGF0LmhlaWdodCl7XHJcbiAgICAgICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhhdC53aWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IG1heERpbWVuc2lvbiAvIHRoYXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQud2lkdGggPSB0aGF0LndpZHRoICogeCAqIHRoYXQucXVlc3Rpb24uc2NhbGU7XHJcbiAgICAgICAgICAgIHRoYXQuaGVpZ2h0ID0gdGhhdC5oZWlnaHQgKiB4ICogdGhhdC5xdWVzdGlvbi5zY2FsZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhhdC53aWR0aCA+IG1heERpbWVuc2lvbiB8fCB0aGF0LmhlaWdodCA+IG1heERpbWVuc2lvbil7XHJcbiAgICAgICAgICAgIHZhciB4O1xyXG4gICAgICAgICAgICBpZih0aGF0LndpZHRoID4gdGhhdC5oZWlnaHQpe1xyXG4gICAgICAgICAgICAgICAgeCA9IHRoYXQud2lkdGggLyBtYXhEaW1lbnNpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHggPSB0aGF0LmhlaWdodCAvIG1heERpbWVuc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LndpZHRoID0gdGhhdC53aWR0aCAvIHggKiB0aGF0LnF1ZXN0aW9uLnNjYWxlO1xyXG4gICAgICAgICAgICB0aGF0LmhlaWdodCA9IHRoYXQuaGVpZ2h0IC8geCAqIHRoYXQucXVlc3Rpb24uc2NhbGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5pbWFnZS5zcmMgPSB0aGlzLnF1ZXN0aW9uLmltYWdlTGluaztcclxuICAgIHRoaXMuY2hlY2suc3JjID0gQ0hFQ0tfSU1BR0U7XHJcbn1cclxuXHJcbnZhciBwID0gbGVzc29uTm9kZS5wcm90b3R5cGU7XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgsIGNhbnZhcyl7XHJcblxyXG4gICAgLy9sZXNzb25Ob2RlLmRyYXdMaWIuY2lyY2xlKGN0eCwgdGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnksIDEwLCBcInJlZFwiKTtcclxuICAgIC8vZHJhdyB0aGUgaW1hZ2UsIHNoYWRvdyBpZiBob3ZlcmVkXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgaWYodGhpcy5kcmFnZ2luZykge1xyXG4gICAgXHRjdHguc2hhZG93Q29sb3IgPSAneWVsbG93JztcclxuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xyXG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZih0aGlzLm1vdXNlT3Zlcil7XHJcbiAgICAgICAgY3R4LnNoYWRvd0NvbG9yID0gJ2RvZGdlckJsdWUnO1xyXG4gICAgICAgIGN0eC5zaGFkb3dCbHVyID0gNTtcclxuICAgICAgICBjYW52YXMuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3aW5nIHRoZSBidXR0b24gaW1hZ2VcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5wb3NpdGlvbi54IC0gdGhpcy53aWR0aC8yLCB0aGlzLnBvc2l0aW9uLnkgLSB0aGlzLmhlaWdodC8yLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICBcclxuICAgIC8vZHJhd2luZyB0aGUgcGluXHJcblx0Y3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG5cdGN0eC5zdHJva2VTdHlsZSA9IFwiY3lhblwiO1xyXG5cdHZhciBzbWFsbGVyID0gdGhpcy53aWR0aCA8IHRoaXMuaGVpZ2h0ID8gdGhpcy53aWR0aCA6IHRoaXMuaGVpZ2h0O1xyXG5cdGN0eC5saW5lV2lkdGggPSBzbWFsbGVyLzMyO1xyXG5cclxuXHRjdHguYmVnaW5QYXRoKCk7XHJcblx0dmFyIG5vZGVQb2ludCA9IHRoaXMuZ2V0Tm9kZVBvaW50KCk7XHJcblx0Y3R4LmFyYyhub2RlUG9pbnQueCwgbm9kZVBvaW50LnksIHNtYWxsZXIqMy8zMiwgMCwgMipNYXRoLlBJKTtcclxuXHRjdHguY2xvc2VQYXRoKCk7XHJcblx0Y3R4LmZpbGwoKTtcclxuXHRjdHguc3Ryb2tlKCk7XHJcbiAgICBcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5wLmdldE5vZGVQb2ludCA9IGZ1bmN0aW9uKCl7XHJcblx0dmFyIHNtYWxsZXIgPSB0aGlzLndpZHRoIDwgdGhpcy5oZWlnaHQgPyB0aGlzLndpZHRoIDogdGhpcy5oZWlnaHQ7XHJcblx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIgKyBzbWFsbGVyKjMvMTYsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIgKyBzbWFsbGVyKjMvMTYpO1xyXG59XHJcblxyXG5wLmNsaWNrID0gZnVuY3Rpb24obW91c2VTdGF0ZSl7XHJcbiAgICB0aGlzLnF1ZXN0aW9uLmRpc3BsYXlXaW5kb3dzKCk7XHJcbn1cclxuXHJcbnAudXBkYXRlSW1hZ2UgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5pbWFnZS5zcmMgPSB0aGlzLnF1ZXN0aW9uLmltYWdlTGluaztcclxufVxyXG5cclxucC5zYXZlID0gZnVuY3Rpb24oKXtcclxuXHR0aGlzLnF1ZXN0aW9uLnBvc2l0aW9uUGVyY2VudFggPSB0aGlzLnBvc2l0aW9uLngvQ29uc3RhbnRzLmJvYXJkU2l6ZS54KjEwMDtcclxuXHR0aGlzLnF1ZXN0aW9uLnBvc2l0aW9uUGVyY2VudFkgPSB0aGlzLnBvc2l0aW9uLnkvQ29uc3RhbnRzLmJvYXJkU2l6ZS55KjEwMDtcclxuXHR0aGlzLnF1ZXN0aW9uLnNhdmVYTUwoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXNzb25Ob2RlO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8vTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxubS5jbGVhciA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCkge1xyXG4gICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKTtcclxufVxyXG5cclxubS5yZWN0ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoLCBjb2wsIGNlbnRlck9yaWdpbikge1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2w7XHJcbiAgICBpZihjZW50ZXJPcmlnaW4pe1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCh4IC0gKHcgLyAyKSwgeSAtIChoIC8gMiksIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjdHguZmlsbFJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5tLnN0cm9rZVJlY3QgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIGxpbmUsIGNvbCwgY2VudGVyT3JpZ2luKSB7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY29sO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IGxpbmU7XHJcbiAgICBpZihjZW50ZXJPcmlnaW4pe1xyXG4gICAgICAgIGN0eC5zdHJva2VSZWN0KHggLSAodyAvIDIpLCB5IC0gKGggLyAyKSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5zdHJva2VSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubS5saW5lID0gZnVuY3Rpb24oY3R4LCB4MSwgeTEsIHgyLCB5MiwgdGhpY2tuZXNzLCBjb2xvcikge1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGN0eC5tb3ZlVG8oeDEsIHkxKTtcclxuICAgIGN0eC5saW5lVG8oeDIsIHkyKTtcclxuICAgIGN0eC5saW5lV2lkdGggPSB0aGlja25lc3M7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm0uY2lyY2xlID0gZnVuY3Rpb24oY3R4LCB4LCB5LCByYWRpdXMsIGNvbG9yKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHguYXJjKHgseSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODA4ODI2L2RyYXctYXJyb3ctb24tY2FudmFzLXRhZyBcclxubS5hcnJvdyA9IGZ1bmN0aW9uKGN0eCwgc3RhcnQsIGVuZCwgaGVhZGxlbiwgdGhpY2tuZXNzLCBjb2xvcil7XHJcblxyXG4gICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMihlbmQueS1zdGFydC55LCBlbmQueC1zdGFydC54KTtcclxuXHRcclxuICAgIGN0eC5zYXZlKCk7XHJcblx0Y3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4Lm1vdmVUbyhzdGFydC54LCBzdGFydC55KTtcclxuICAgIGN0eC5saW5lVG8oZW5kLngsIGVuZC55KTtcclxuICAgIGN0eC5saW5lVG8oZW5kLngtaGVhZGxlbipNYXRoLmNvcyhhbmdsZS1NYXRoLlBJLzYpLCBlbmQueS1oZWFkbGVuKk1hdGguc2luKGFuZ2xlLU1hdGguUEkvNikpO1xyXG4gICAgY3R4Lm1vdmVUbyhlbmQueCwgZW5kLnkpO1xyXG4gICAgY3R4LmxpbmVUbyhlbmQueC1oZWFkbGVuKk1hdGguY29zKGFuZ2xlK01hdGguUEkvNiksIGVuZC55LWhlYWRsZW4qTWF0aC5zaW4oYW5nbGUrTWF0aC5QSS82KSlcclxuICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgIGN0eC5saW5lV2lkdGggPSB0aGlja25lc3M7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJvYXJkQnV0dG9uKGN0eCwgcG9zaXRpb24sIHdpZHRoLCBoZWlnaHQsIGhvdmVyZWQpe1xyXG4gICAgLy9jdHguc2F2ZSgpO1xyXG4gICAgaWYoaG92ZXJlZCl7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiZG9kZ2VyYmx1ZVwiO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJsaWdodGJsdWVcIjtcclxuICAgIH1cclxuICAgIC8vZHJhdyByb3VuZGVkIGNvbnRhaW5lclxyXG4gICAgY3R4LnJlY3QocG9zaXRpb24ueCAtIHdpZHRoLzIsIHBvc2l0aW9uLnkgLSBoZWlnaHQvMiwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICBjdHgubGluZVdpZHRoID0gNTtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5maWxsKCk7XHJcbiAgICAvL2N0eC5yZXN0b3JlKCk7XHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIENhdGVnb3J5ID0gcmVxdWlyZShcIi4uL2Nhc2UvY2F0ZWdvcnkuanNcIik7XHJcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoXCIuLi9jYXNlL3Jlc291cmNlcy5qc1wiKTtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vdXRpbGl0aWVzLmpzJyk7XHJcbnZhciBQYXJzZXIgPSByZXF1aXJlKCcuL2lwYXJEYXRhUGFyc2VyLmpzJyk7XHJcblxyXG4vLyBNb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG4vLyAqKioqKioqKioqKioqKioqKioqKioqIExPQURJTkcgKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4vLyBsb2FkIHRoZSBmaWxlIGVudHJ5IGFuZCBwYXJzZSB0aGUgeG1sXHJcbm0ubG9hZENhc2UgPSBmdW5jdGlvbihjYXNlRGF0YSwgd2luZG93RGl2KSB7XHJcbiAgICBcclxuICAgIHRoaXMuY2F0ZWdvcmllcyA9IFtdO1xyXG4gICAgdGhpcy5xdWVzdGlvbnMgPSBbXTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHhtbCBkYXRhXHJcblx0dmFyIHhtbERhdGEgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHR2YXIgcmVzb3VyY2VzID0gUGFyc2VyLmdldFJlc291cmNlcyh4bWxEYXRhKTtcclxuXHR2YXIgY2F0ZWdvcmllcyA9IFBhcnNlci5nZXRDYXRlZ29yaWVzQW5kUXVlc3Rpb25zKHhtbERhdGEsIHJlc291cmNlcywgd2luZG93RGl2KTtcclxuXHR2YXIgaW1hZ2VzID0gW107XHJcblx0Zm9yKHZhciBpPTA7aTxjYXRlZ29yaWVzLmxlbmd0aDtpKyspXHJcblx0XHRmb3IodmFyIGo9MDtqPGNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zLmxlbmd0aDtqKyspXHJcblx0XHRcdGlmKGltYWdlcy5pbmRleE9mKGNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLmltYWdlTGluayk9PS0xKVxyXG5cdFx0XHRcdGltYWdlcy5wdXNoKGNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLmltYWdlTGluayk7XHJcblx0XHJcblx0Ly8gbG9hZCB0aGUgbW9zdCByZWNlbnQgcHJvZ3Jlc3MgZnJvbSBzYXZlRmlsZS5pcGFyZGF0YVxyXG5cdHZhciBxdWVzdGlvbnMgPSBbXTtcclxuICAgIFxyXG5cdC8vIEdldCB0aGUgc2F2ZSBkYXRhXHJcblx0dmFyIHNhdmVEYXRhID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5zYXZlRmlsZSk7XHJcblx0Ly8gYWxlcnQgdXNlciBpZiB0aGVyZSBpcyBhbiBlcnJvclxyXG5cdGlmICghc2F2ZURhdGEpIHsgYWxlcnQgKFwiRVJST1Igbm8gc2F2ZSBkYXRhIGZvdW5kLCBvciBzYXZlIGRhdGEgd2FzIHVucmVhZGFibGVcIik7IHJldHVybjsgfVxyXG5cdC8vIHByb2dyZXNzXHJcblx0dmFyIHN0YWdlID0gc2F2ZURhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmdldEF0dHJpYnV0ZShcImNhc2VTdGF0dXNcIik7XHJcblx0XHJcblx0Ly8gcGFyc2UgdGhlIHNhdmUgZGF0YSBpZiBub3QgbmV3XHJcblx0aWYoc3RhZ2U+MCl7XHJcblx0XHRmb3IodmFyIGZpbGUgaW4gY2FzZURhdGEuc3VibWl0dGVkKXtcclxuXHRcdFx0aWYgKCFjYXNlRGF0YS5zdWJtaXR0ZWQuaGFzT3duUHJvcGVydHkoZmlsZSkpIGNvbnRpbnVlO1xyXG5cdFx0XHRmaWxlID0gZmlsZS5zdWJzdHIoZmlsZS5sYXN0SW5kZXhPZihcIi9cIikrMSk7XHJcblx0XHRcdHZhciBjYXQgPSBmaWxlLmluZGV4T2YoXCItXCIpLFxyXG5cdFx0XHRcdHF1ZSA9IGZpbGUuaW5kZXhPZihcIi1cIiwgY2F0KzEpLFxyXG5cdFx0XHRcdGZpbCA9IGZpbGUuaW5kZXhPZihcIi1cIiwgcXVlKzEpO1xyXG5cdFx0XHRjYXRlZ29yaWVzW051bWJlcihmaWxlLnN1YnN0cigwLCBjYXQpKV0uXHJcblx0XHRcdFx0cXVlc3Rpb25zW051bWJlcihmaWxlLnN1YnN0cihjYXQrMSwgcXVlLWNhdC0xKSldLlxyXG5cdFx0XHRcdGZpbGVzW051bWJlcihmaWxlLnN1YnN0cihxdWUrMSwgZmlsLXF1ZS0xKSldID0gXHJcblx0XHRcdFx0XHRmaWxlLnN1YnN0cihmaWxlLmluZGV4T2ZBdChcIi1cIiwgMykrMSk7XHJcblx0XHR9XHJcblx0XHRQYXJzZXIuYXNzaWduUXVlc3Rpb25TdGF0ZXMoY2F0ZWdvcmllcywgc2F2ZURhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblwiKSk7XHJcblx0fVxyXG5cdGVsc2VcclxuXHRcdHN0YWdlID0gMTtcclxuXHRcclxuXHQvLyByZXR1cm4gcmVzdWx0c1xyXG5cdHJldHVybiB7Y2F0ZWdvcmllczogY2F0ZWdvcmllcywgY2F0ZWdvcnk6c3RhZ2UtMSwgcmVzb3VyY2VzOnJlc291cmNlcywgaW1hZ2VzOmltYWdlc307IC8vIG1heWJlIHN0YWdlICsgMSB3b3VsZCBiZSBiZXR0ZXIgYmVjYXVzZSB0aGV5IGFyZSBub3QgemVybyBpbmRleGVkP1xyXG5cdFx0XHQgICBcclxufVxyXG5cdFx0XHRcdFx0IFxyXG4vLyAqKioqKioqKioqKioqKioqKioqKioqIFNBVklORyAqKioqKioqKioqKioqKioqKioqKioqKipcclxuXHJcbi8qIGhlcmUncyB0aGUgZ2VuZXJhbCBvdXRsaW5lIG9mIHdoYXQgaXMgaGFwcGVuaW5nOlxyXG5zZWxlY3RTYXZlTG9jYXRpb24gd2FzIHRoZSBvbGQgd2F5IG9mIGRvaW5nIHRoaW5nc1xyXG5ub3cgd2UgdXNlIGNyZWF0ZVppcFxyXG4gLSB3aGVuIHRoaXMgd2hvbGUgdGhpbmcgc3RhcnRzLCB3ZSByZXF1ZXN0IGEgZmlsZSBzeXN0ZW0gYW5kIHNhdmUgYWxsIHRoZSBlbnRyaWVzIChkaXJlY3RvcmllcyBhbmQgZmlsZXMpIHRvIHRoZSBhbGxFbnRyaWVzIHZhcmlhYmxlXHJcbiAtIHRoZW4gd2UgZ2V0IHRoZSBibG9icyB1c2luZyByZWFkQXNCaW5hcnlTdHJpbmcgYW5kIHN0b3JlIHRob3NlIGluIGFuIGFycmF5IHdoZW4gd2UgYXJlIHNhdmluZyBcclxuICAtIC0gY291bGQgZG8gdGhhdCBvbiBwYWdlIGxvYWQgdG8gc2F2ZSB0aW1lIGxhdGVyLi4/XHJcbiAtIGFueXdheSwgdGhlbiB3ZSAtIGluIHRoZW9yeSAtIHRha2UgdGhlIGJsb2JzIGFuZCB1c2UgemlwLmZpbGUoZW50cnkubmFtZSwgYmxvYikgdG8gcmVjcmVhdGUgdGhlIHN0cnVjdHVyZVxyXG4gLSBhbmQgZmluYWxseSB3ZSBkb3dubG9hZCB0aGUgemlwIHdpdGggZG93bmxvYWQoKVxyXG4gXHJcbiovXHJcblxyXG4vLyBjYWxsZWQgd2hlbiB0aGUgZ2FtZSBpcyBsb2FkZWQsIGFkZCBvbmNsaWNrIHRvIHNhdmUgYnV0dG9uIHRoYXQgYWN0dWFsbHkgZG9lcyB0aGUgc2F2aW5nXHJcbm0ucHJlcGFyZVppcCA9IGZ1bmN0aW9uKHNhdmVCdXR0b24pIHtcclxuXHQvL3ZhciBjb250ZW50ID0gemlwLmdlbmVyYXRlKCk7XHJcblx0XHJcblx0Ly9jb25zb2xlLmxvZyhcInByZXBhcmUgemlwXCIpO1xyXG5cdFxyXG5cdC8vIGNvZGUgZnJvbSBKU1ppcCBzaXRlXHJcblx0aWYgKEpTWmlwLnN1cHBvcnQuYmxvYikge1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhcInN1cHBvcnRzIGJsb2JcIik7XHJcblx0XHRcclxuXHRcdC8vIGxpbmsgZG93bmxvYWQgdG8gY2xpY2tcclxuXHRcdHNhdmVCdXR0b24ub25jbGljayA9IHNhdmVJUEFSO1xyXG4gIFx0fVxyXG59XHJcblxyXG4vLyBjcmVhdGUgSVBBUiBmaWxlIGFuZCBkb3dubG9hZCBpdFxyXG5mdW5jdGlvbiBzYXZlSVBBUigpIHtcclxuXHRcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHJcblx0dmFyIHppcCA9IG5ldyBKU1ppcCgpO1xyXG5cdHppcC5maWxlKFwiY2FzZUZpbGUuaXBhcmRhdGFcIiwgY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdHppcC5maWxlKFwic2F2ZUZpbGUuaXBhcmRhdGFcIiwgY2FzZURhdGEuc2F2ZUZpbGUpO1xyXG5cdHZhciBzdWJtaXR0ZWQgPSB6aXAuZm9sZGVyKCdzdWJtaXR0ZWQnKTtcclxuXHRmb3IgKHZhciBmaWxlIGluIGNhc2VEYXRhLnN1Ym1pdHRlZCkge1xyXG5cdFx0aWYgKCFjYXNlRGF0YS5zdWJtaXR0ZWQuaGFzT3duUHJvcGVydHkoZmlsZSkpIGNvbnRpbnVlO1xyXG5cdFx0dmFyIHN0YXJ0ID0gY2FzZURhdGEuc3VibWl0dGVkW2ZpbGVdLmluZGV4T2YoXCJiYXNlNjQsXCIpK1wiYmFzZTY0LFwiLmxlbmd0aDtcclxuXHRcdHN1Ym1pdHRlZC5maWxlKGZpbGUsIGNhc2VEYXRhLnN1Ym1pdHRlZFtmaWxlXS5zdWJzdHIoc3RhcnQpLCB7YmFzZTY0OiB0cnVlfSk7XHJcblx0fVxyXG5cclxuXHRcclxuXHR6aXAuZ2VuZXJhdGVBc3luYyh7dHlwZTpcImJhc2U2NFwifSkudGhlbihmdW5jdGlvbiAoYmFzZTY0KSB7XHJcblx0XHR2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG5cdFx0YS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0YS5ocmVmID0gXCJkYXRhOmFwcGxpY2F0aW9uL3ppcDtiYXNlNjQsXCIgKyBiYXNlNjQ7XHJcblx0XHRhLmRvd25sb2FkID0gbG9jYWxTdG9yYWdlWydjYXNlTmFtZSddO1xyXG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcclxuXHRcdGEuY2xpY2soKTtcclxuXHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSk7XHJcblx0fSk7XHJcblx0XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKiBDQUNISU5HICoqKioqKioqKioqKioqKioqKiovXHJcblxyXG5tLnJlbW92ZUZpbGVzRm9yID0gZnVuY3Rpb24oY2FzZURhdGEsIHRvUmVtb3ZlKXtcclxuXHJcblx0dmFyIHF1ZXN0aW9uRGF0YSA9IHRvUmVtb3ZlLmJvYXJkK1wiLVwiK3RvUmVtb3ZlLnF1ZXN0aW9uK1wiLVwiO1xyXG5cdGZvcih2YXIgZmlsZSBpbiBjYXNlRGF0YS5zdWJtaXR0ZWQpe1xyXG5cdFx0aWYgKCFjYXNlRGF0YS5zdWJtaXR0ZWQuaGFzT3duUHJvcGVydHkoZmlsZSkgfHwgIWZpbGUuc3RhcnRzV2l0aChxdWVzdGlvbkRhdGEpKSBjb250aW51ZTtcclxuXHRcdGRlbGV0ZSBjYXNlRGF0YS5zdWJtaXR0ZWRbZmlsZV07XHJcblx0fVxyXG5cdFxyXG59XHJcblxyXG4vLyBBZGRzIGEgc3VibWl0dGVkIGZpbGUgdG8gdGhlIGxvY2FsIHN0b2FyZ2VcclxubS5hZGROZXdGaWxlc1RvU3lzdGVtID0gZnVuY3Rpb24oY2FzZURhdGEsIHRvU3RvcmUsIGNhbGxiYWNrKXtcclxuXHJcblx0Ly8gVXNlZCBmb3IgY2FsbGJhY2tcclxuXHR2YXIgdG90YWxDQiA9IDEsIGN1ckNCID0gMDtcclxuXHR2YXIgZmluaXNoZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0aWYoKytjdXJDQj49dG90YWxDQil7XHJcblx0XHRcdGNhbGxiYWNrKGNhc2VEYXRhKTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0Zm9yKHZhciBpPTA7aTx0b1N0b3JlLmZpbGVzLmxlbmd0aDtpKyspe1xyXG5cdFx0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuXHRcdFx0dmFyIGZpbGVuYW1lID0gdG9TdG9yZS5ib2FyZCtcIi1cIit0b1N0b3JlLnF1ZXN0aW9uK1wiLVwiK2krXCItXCIrdG9TdG9yZS5maWxlc1tpXS5uYW1lO1xyXG5cdFx0XHR0b3RhbENCKys7XHJcblx0XHRcdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcblx0XHRcdFx0Y2FzZURhdGEuc3VibWl0dGVkW2ZpbGVuYW1lXSA9ICBldmVudC50YXJnZXQucmVzdWx0O1xyXG5cdFx0XHRcdGZpbmlzaGVkKCk7XHJcblx0XHQgICAgfTtcclxuXHRcdCAgICBmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwodG9TdG9yZS5maWxlc1tpXSk7XHJcblx0XHR9KSgpO1xyXG5cdH1cclxuXHRcclxuXHRmaW5pc2hlZCgpO1xyXG59IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBDYXRlZ29yeSA9IHJlcXVpcmUoXCIuLi9jYXNlL2NhdGVnb3J5LmpzXCIpO1xyXG52YXIgUmVzb3VyY2VzID0gcmVxdWlyZShcIi4uL2Nhc2UvcmVzb3VyY2VzLmpzXCIpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2dhbWUvY29uc3RhbnRzLmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoJy4uL2Nhc2UvcXVlc3Rpb24uanMnKTtcclxuXHJcbi8vIFBhcnNlcyB0aGUgeG1sIGNhc2UgZmlsZXNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBrbm93biB0YWdzXHJcbi8qXHJcbmFuc3dlclxyXG5idXR0b25cclxuY2F0ZWdvcnlMaXN0XHJcbmNvbm5lY3Rpb25zXHJcbmVsZW1lbnRcclxuZmVlZGJhY2tcclxuaW5zdHJ1Y3Rpb25zXHJcbnJlc291cmNlXHJcbnJlc291cmNlTGlzdFxyXG5yZXNvdXJjZUluZGV4XHJcbnNvZnR3YXJlTGlzdFxyXG5xdWVzdGlvblxyXG5xdWVzdGlvblRleHRcclxucXVzdGlvbk5hbWVcclxuKi9cclxuXHJcbi8vIGNvbnZlcnNpb25cclxudmFyIHN0YXRlQ29udmVydGVyID0ge1xyXG5cdFwiaGlkZGVuXCIgOiBRdWVzdGlvbi5TT0xWRV9TVEFURS5ISURERU4sXHJcblx0XCJ1bnNvbHZlZFwiIDogIFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlVOU09MVkVELFxyXG5cdFwiY29ycmVjdFwiIDogIFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRFxyXG59XHJcbi8vIGNvbnZlcnNpb25cclxudmFyIHJldmVyc2VTdGF0ZUNvbnZlcnRlciA9IFtcImhpZGRlblwiLCBcInVuc29sdmVkXCIsIFwiY29ycmVjdFwiXTtcclxuXHJcbnZhciBmaXJzdE5hbWUgPSBcInVuYXNzaWduZWRcIjtcclxudmFyIGxhc3ROYW1lID0gXCJ1bmFzc2lnbmVkXCI7XHJcbnZhciBlbWFpbCA9IFwiZW1haWxcIjtcclxuXHJcbi8vIE1vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHRcdFx0XHRcclxuLy8gKioqKioqKioqKioqKioqKioqKioqKiBMT0FESU5HICoqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLy8gc2V0IHRoZSBxdWVzdGlvbiBzdGF0ZXNcclxubS5hc3NpZ25RdWVzdGlvblN0YXRlcyA9IGZ1bmN0aW9uKGNhdGVnb3JpZXMsIHF1ZXN0aW9uRWxlbXMpIHtcclxuXHJcblx0dmFyIHRhbGx5ID0gMDsgLy8gdHJhY2sgdG90YWwgaW5kZXggaW4gbmVzdGVkIGxvb3BcclxuXHRcclxuXHQvLyBhbGwgcXVlc3Rpb25zXHJcblx0Zm9yICh2YXIgaT0wOyBpPGNhdGVnb3JpZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdGZvciAodmFyIGo9MDsgajxjYXRlZ29yaWVzW2ldLnF1ZXN0aW9ucy5sZW5ndGg7IGorKywgdGFsbHkrKykge1xyXG5cdFx0XHQvLyBzdG9yZSBxdWVzdGlvbiAgZm9yIGVhc3kgcmVmZXJlbmNlXHJcblx0XHRcdHZhciBxID0gY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal07XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBzdG9yZSB0YWcgZm9yIGVhc3kgcmVmZXJlbmNlXHJcblx0XHRcdHZhciBxRWxlbSA9IHF1ZXN0aW9uRWxlbXNbdGFsbHldO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gc3RhdGVcclxuXHRcdFx0cS5jdXJyZW50U3RhdGUgPSBzdGF0ZUNvbnZlcnRlcltxRWxlbS5nZXRBdHRyaWJ1dGUoXCJxdWVzdGlvblN0YXRlXCIpXTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIGp1c3RpZmljYXRpb25cclxuXHRcdFx0aWYocS5qdXN0aWZpY2F0aW9uKVxyXG5cdFx0XHRcdHEuanVzdGlmaWNhdGlvbi52YWx1ZSA9IHFFbGVtLmdldEF0dHJpYnV0ZShcImp1c3RpZmljYXRpb25cIik7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBDYWxsIGNvcnJlY3QgYW5zd2VyIGlmIHN0YXRlIGlzIGNvcnJlY3RcclxuXHRcdFx0aWYocS5jdXJyZW50U3RhdGU9PVF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRClcclxuXHRcdFx0ICBxLmNvcnJlY3RBbnN3ZXIoKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0Ly8geHBvc1xyXG5cdFx0XHRxLnBvc2l0aW9uUGVyY2VudFggPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHFFbGVtLmdldEF0dHJpYnV0ZShcInBvc2l0aW9uUGVyY2VudFhcIikpLCAwLCAxMDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueCk7XHJcblx0XHRcdC8vIHlwb3NcclxuXHRcdFx0cS5wb3NpdGlvblBlcmNlbnRZID0gVXRpbGl0aWVzLm1hcChwYXJzZUludChxRWxlbS5nZXRBdHRyaWJ1dGUoXCJwb3NpdGlvblBlcmNlbnRZXCIpKSwgMCwgMTAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLnkpO1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbm0uZ2V0UmVzb3VyY2VzID0gZnVuY3Rpb24oeG1sRGF0YSl7XHJcblx0dmFyIHJlc291cmNlRWxlbWVudHMgPSB4bWxEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VcIik7XHJcblx0cmV0dXJuIG5ldyBSZXNvdXJjZXMocmVzb3VyY2VFbGVtZW50cywgeG1sRGF0YSk7XHJcbn1cclxuXHJcbi8vIHRha2VzIHRoZSB4bWwgc3RydWN0dXJlIGFuZCBmaWxscyBpbiB0aGUgZGF0YSBmb3IgdGhlIHF1ZXN0aW9uIG9iamVjdFxyXG5tLmdldENhdGVnb3JpZXNBbmRRdWVzdGlvbnMgPSBmdW5jdGlvbih4bWxEYXRhLCByZXNvdXJjZXMsIHdpbmRvd0Rpdikge1xyXG5cdC8vIGlmIHRoZXJlIGlzIGEgY2FzZSBmaWxlXHJcblx0aWYgKHhtbERhdGEgIT0gbnVsbCkge1xyXG5cdFx0XHJcblx0XHQvLyBHZXQgcGxheWVyIGRhdGEgXHJcblx0XHRmaXJzdE5hbWUgPSB4bWxEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FzZVwiKVswXS5nZXRBdHRyaWJ1dGUoXCJwcm9maWxlRmlyc3RcIik7XHJcblx0XHRsYXN0TmFtZSA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmdldEF0dHJpYnV0ZShcInByb2ZpbGVMYXN0XCIpO1xyXG5cdFx0eG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uZ2V0QXR0cmlidXRlKFwicHJvZmlsZU1haWxcIik7XHJcblx0XHRcclxuXHRcdC8vIFRoZW4gbG9hZCB0aGUgY2F0ZWdvcmllc1xyXG5cdFx0dmFyIGNhdGVnb3J5RWxlbWVudHMgPSB4bWxEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIik7XHJcblx0XHR2YXIgY2F0ZWdvcnlOYW1lcyA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeUxpc3RcIilbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbGVtZW50XCIpO1xyXG5cdFx0dmFyIGNhdGVnb3JpZXMgPSBbXTtcclxuXHRcdGZvciAodmFyIGk9MDsgaTxjYXRlZ29yeUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdC8vIExvYWQgZWFjaCBjYXRlZ29yeSAod2hpY2ggbG9hZHMgZWFjaCBxdWVzdGlvbilcclxuXHRcdFx0Y2F0ZWdvcmllc1twYXJzZUludChjYXRlZ29yeUVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIikpXSA9IG5ldyBDYXRlZ29yeShjYXRlZ29yeU5hbWVzW2ldLmlubmVySFRNTCwgY2F0ZWdvcnlFbGVtZW50c1tpXSwgcmVzb3VyY2VzLCB3aW5kb3dEaXYpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhdGVnb3JpZXM7XHJcblx0fVxyXG5cdHJldHVybiBudWxsXHJcbn1cclxuXHJcbi8vIGNyZWF0ZXMgYSBjYXNlIGZpbGUgZm9yIHppcHBpbmdcclxubS5yZWNyZWF0ZUNhc2VGaWxlID0gZnVuY3Rpb24oYm9hcmRzKSB7XHJcblxyXG5cdC8vIGNyZWF0ZSBzYXZlIGZpbGUgdGV4dFxyXG5cdHZhciBkYXRhVG9TYXZlID0gbS5jcmVhdGVYTUxTYXZlRmlsZShib2FyZHMsIHRydWUpO1xyXG5cdFxyXG5cdC8vaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhkYXRhVG9TYXZlKTtcclxuXHRyZXR1cm4gZGF0YVRvU2F2ZTtcclxuXHRcclxufVxyXG5cclxuLy8gY3JlYXRlcyB0aGUgeG1sXHJcbm0uY3JlYXRlWE1MU2F2ZUZpbGUgPSBmdW5jdGlvbihhY3RpdmVJbmRleCwgYm9hcmRzLCBpbmNsdWRlTmV3bGluZSkge1xyXG5cdC8vIG5ld2xpbmVcclxuXHR2YXIgbmw7XHJcblx0aW5jbHVkZU5ld2xpbmUgPyBubCA9IFwiXFxuXCIgOiBubCA9IFwiXCI7XHJcblx0Ly8gaGVhZGVyXHJcblx0dmFyIG91dHB1dCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJ1dGYtOFwiPz4nICsgbmw7XHJcblx0Ly8gY2FzZSBkYXRhXHJcblx0b3V0cHV0ICs9ICc8Y2FzZSBjYXRlZ29yeUluZGV4PVwiM1wiIGNhc2VTdGF0dXM9XCInKyhhY3RpdmVJbmRleCsxKSsnXCIgcHJvZmlsZUZpcnN0PVwiJysgZmlyc3ROYW1lICsnXCIgcHJvZmlsZUxhc3Q9XCInICsgbGFzdE5hbWUgKyAnXCIgcHJvZmlsZU1haWw9XCInKyBlbWFpbCArJ1wiPicgKyBubDtcclxuXHQvLyBxdWVzdGlvbnMgaGVhZGVyXHJcblx0b3V0cHV0ICs9ICc8cXVlc3Rpb25zPicgKyBubDtcclxuXHRcclxuXHQvLyBsb29wIHRocm91Z2ggcXVlc3Rpb25zXHJcblx0Zm9yICh2YXIgaT0wOyBpPGJvYXJkcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgaj0wOyBqPGJvYXJkc1tpXS5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0Ly8gc2hvcnRoYW5kXHJcblx0XHRcdHZhciBxID0gYm9hcmRzW2ldLmxlc3Nvbk5vZGVBcnJheVtqXS5xdWVzdGlvbjtcclxuXHRcdFx0XHJcblx0XHRcdC8vIHRhZyBzdGFydFxyXG5cdFx0XHRvdXRwdXQgKz0gJzxxdWVzdGlvbiAnO1xyXG5cclxuXHRcdFx0Ly8gcXVlc3Rpb25TdGF0ZVxyXG5cdFx0XHRvdXRwdXQgKz0gJ3F1ZXN0aW9uU3RhdGU9XCInICsgcmV2ZXJzZVN0YXRlQ29udmVydGVyW3EuY3VycmVudFN0YXRlXSArICdcIiAnO1xyXG5cdFx0XHQvLyBqdXN0aWZpY2F0aW9uXHJcblx0XHRcdHZhciBuZXdKdXN0aWZpY2F0aW9uID0gcS5qdXN0aWZpY2F0aW9uLnZhbHVlO1xyXG5cdFx0XHR2YXIganVzdGlmaWNhdGlvbjtcclxuXHRcdFx0bmV3SnVzdGlmaWNhdGlvbiA/IGp1c3RpZmljYXRpb24gPSBuZXdKdXN0aWZpY2F0aW9uIDoganVzdGlmaWNhdGlvbiA9IHEuanVzdGlmaWNhdGlvblN0cmluZztcclxuXHRcdFx0Ly8gaGFuZGxlIHVuZGVmaW5lZFxyXG5cdFx0XHRpZiAoIWp1c3RpZmljYXRpb24pIGp1c3RpZmljYXRpb24gPSBcIlwiO1xyXG5cdFx0XHRvdXRwdXQgKz0gJ2p1c3RpZmljYXRpb249XCInICsganVzdGlmaWNhdGlvbiArICdcIiAnO1xyXG5cdFx0XHQvLyBhbmltYXRlZFxyXG5cdFx0XHRvdXRwdXQgKz0gJ2FuaW1hdGVkPVwiJyArIChxLmN1cnJlbnRTdGF0ZSA9PSAyKSArICdcIiAnOyAvLyBtaWdodCBoYXZlIHRvIGZpeCB0aGlzIGxhdGVyXHJcblx0XHRcdC8vIGxpbmVzVHJhbmNlZFxyXG5cdFx0XHRvdXRwdXQgKz0gJ2xpbmVzVHJhY2VkPVwiMFwiICc7IC8vIG1pZ2h0IGhhdmUgdG8gZml4IHRoaXMgdG9vXHJcblx0XHRcdC8vIHJldmVhbFRocmVzaG9sZFxyXG5cdFx0XHRvdXRwdXQgKz0gJ3JldmVhbFRocmVzaG9sZCAgPVwiJyArIHEucmV2ZWFsVGhyZXNob2xkICArJ1wiICc7IC8vIGFuZCB0aGlzXHJcblx0XHRcdC8vIHBvc2l0aW9uUGVyY2VudFhcclxuXHRcdFx0b3V0cHV0ICs9ICdwb3NpdGlvblBlcmNlbnRYPVwiJyArIFV0aWxpdGllcy5tYXAocS5wb3NpdGlvblBlcmNlbnRYLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngsIDAsIDEwMCkgKyAnXCIgJztcclxuXHRcdFx0Ly8gcG9zaXRpb25QZXJjZW50WVxyXG5cdFx0XHRvdXRwdXQgKz0gJ3Bvc2l0aW9uUGVyY2VudFk9XCInICsgVXRpbGl0aWVzLm1hcChxLnBvc2l0aW9uUGVyY2VudFksIDAsIENvbnN0YW50cy5ib2FyZFNpemUueSwgMCwgMTAwKSArICdcIiAnO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gdGFnIGVuZFxyXG5cdFx0XHRvdXRwdXQgKz0gJy8+JyArIG5sO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRvdXRwdXQgKz0gXCI8L3F1ZXN0aW9ucz5cIiArIG5sO1xyXG5cdG91dHB1dCArPSBcIjwvY2FzZT5cIiArIG5sO1xyXG5cdHJldHVybiBvdXRwdXQ7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZFN0YXRlKGdhbWUpe1xyXG5cdHRoaXMua2V5ID0gW107XHJcblx0dGhpcy5wcmVLZXkgPSBbXTtcclxuXHR0aGlzLmtleVByZXNzZWQgPSBbXTtcclxuXHR0aGlzLmtleVJlbGVhc2VkID0gW107XHJcbiAgICB2YXIga2V5Ym9hcmRTdGF0ZSA9IHRoaXM7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGlmKGdhbWUuYWN0aXZlKVxyXG4gICAgXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0a2V5Ym9hcmRTdGF0ZS5rZXlbZS5rZXlDb2RlXSA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGlmKGdhbWUuYWN0aXZlKVxyXG4gICAgXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0a2V5Ym9hcmRTdGF0ZS5rZXlbZS5rZXlDb2RlXSA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBwID0gS2V5Ym9hcmRTdGF0ZS5wcm90b3R5cGU7XHJcblxyXG4vL1VwZGF0ZSB0aGUgbW91c2UgdG8gdGhlIGN1cnJlbnQgc3RhdGVcclxucC51cGRhdGUgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRmb3IodmFyIGk9MDtpPHRoaXMua2V5UHJlc3NlZC5sZW5ndGg7aSsrKVxyXG5cdFx0aWYodGhpcy5rZXlQcmVzc2VkW2ldKVxyXG5cdFx0XHR0aGlzLmtleVByZXNzZWRbaV0gPSBmYWxzZTtcclxuXHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmtleVJlbGVhc2VkLmxlbmd0aDtpKyspXHJcblx0XHRpZih0aGlzLmtleVJlbGVhc2VkW2ldKVxyXG5cdFx0XHR0aGlzLmtleVJlbGVhc2VkW2ldID0gZmFsc2U7XHJcblx0XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmtleS5sZW5ndGg7aSsrKXtcclxuXHRcdGlmKHRoaXMucHJlS2V5W2ldICYmICF0aGlzLmtleVtpXSlcclxuXHRcdFx0dGhpcy5rZXlSZWxlYXNlZFtpXSA9IHRydWU7XHJcblx0XHRpZighdGhpcy5wcmVLZXlbaV0gJiYgdGhpcy5rZXlbaV0pXHJcblx0XHRcdHRoaXMua2V5UHJlc3NlZFtpXSA9IHRydWU7XHJcblx0XHR0aGlzLnByZUtleVtpXSA9IHRoaXMua2V5W2ldO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBLZXlib2FyZFN0YXRlOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XHJcblxyXG4vLyBwcml2YXRlIHZhcmlhYmxlc1xyXG52YXIgcmVsYXRpdmVNb3VzZVBvc2l0aW9uO1xyXG52YXIgbW91c2VEb3duVGltZXIsIGxlZnRNb3VzZUNsaWNrZWQsIG1heENsaWNrRHVyYXRpb247XHJcbnZhciBtb3VzZVdoZWVsVmFsO1xyXG52YXIgcHJldlRpbWU7XHJcbnZhciBkZWx0YVk7XHJcbnZhciBzY2FsaW5nLCB0b3VjaFpvb20sIHN0YXJ0VG91Y2hab29tO1xyXG5cclxuZnVuY3Rpb24gbW91c2VTdGF0ZSgpe1xyXG5cdHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLDApO1xyXG4gICAgcmVsYXRpdmVNb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICB0aGlzLnZpcnR1YWxQb3NpdGlvbiA9IG5ldyBQb2ludCgwLDApO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgdmFyaWFibGUgZGVmYXVsdHNcclxuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB0aGlzLm1vdXNlSW4gPSBmYWxzZTtcclxuICAgIG1vdXNlRG93blRpbWVyID0gMDtcclxuICAgIGRlbHRhWSA9IDA7XHJcbiAgICB0aGlzLm1vdXNlV2hlZWxEWSA9IDA7XHJcbiAgICB0aGlzLnpvb21EaWZmID0gMDtcclxuICAgIHRvdWNoWm9vbSA9IDA7XHJcbiAgICB0aGlzLm1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgbGVmdE1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgbWF4Q2xpY2tEdXJhdGlvbiA9IDIwMDtcclxuXHRcclxufVxyXG5cclxudmFyIHAgPSBtb3VzZVN0YXRlLnByb3RvdHlwZTtcclxuXHJcbi8vZXZlbnQgbGlzdGVuZXJzIGZvciBtb3VzZSBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgY2FudmFzZXNcclxucC5hZGRDYW52YXMgPSBmdW5jdGlvbihjYW52YXMpe1xyXG4gICAgdmFyIG1vdXNlU3RhdGUgPSB0aGlzO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0bW91c2VTdGF0ZS51cGRhdGVQb3NpdGlvbihlKTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0aWYoc2NhbGluZylcclxuICAgIFx0XHRtb3VzZVN0YXRlLnVwZGF0ZVRvdWNoUG9zaXRpb25zKGUpO1xyXG4gICAgXHRlbHNlXHJcbiAgICBcdFx0bW91c2VTdGF0ZS51cGRhdGVQb3NpdGlvbihlLnRvdWNoZXNbMF0pO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRpZiAoZS53aGljaCAmJiBlLndoaWNoIT0zIHx8IGUuYnV0dG9uICYmIGUuYnV0dG9uIT0yKVxyXG5cdCAgICBcdG1vdXNlU3RhdGUubW91c2VEb3duID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0bGVmdE1vdXNlQ2xpY2tlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRpZihlLnRvdWNoZXMubGVuZ3RoID09IDEgJiYgIXNjYWxpbmcpe1xyXG4gICAgXHRcdG1vdXNlU3RhdGUudXBkYXRlUG9zaXRpb24oZS50b3VjaGVzWzBdKTtcclxuXHQgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHQgICAgICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSB0cnVlO1xyXG5cdCAgICAgICAgfSk7XHJcbiAgICBcdH1cclxuICAgIFx0ZWxzZSBpZihlLnRvdWNoZXMubGVuZ3RoID09IDIpe1xyXG4gICAgXHRcdG1vdXNlU3RhdGUubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICBcdFx0c2NhbGluZyA9IHRydWU7XHJcbiAgICBcdFx0bW91c2VTdGF0ZS51cGRhdGVUb3VjaFBvc2l0aW9ucyhlKTtcclxuICAgIFx0XHRzdGFydFRvdWNoWm9vbSA9IHRvdWNoWm9vbTtcclxuICAgIFx0fVxyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0aWYgKGUud2hpY2ggJiYgZS53aGljaCE9MyB8fCBlLmJ1dHRvbiAmJiBlLmJ1dHRvbiE9MilcclxuXHQgICAgXHRtb3VzZVN0YXRlLm1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBcdGlmKHNjYWxpbmcpe1xyXG4gICAgXHRcdHNjYWxpbmcgPSBmYWxzZTtcclxuICAgIFx0ICAgIHRvdWNoWm9vbSA9IDA7XHJcbiAgICBcdCAgICBzdGFydFRvdWNoWm9vbSA9IDA7XHJcbiAgICBcdH1cclxuICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdG1vdXNlU3RhdGUubW91c2VJbiA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdG1vdXNlU3RhdGUubW91c2VJbiA9IGZhbHNlO1xyXG4gICAgXHRtb3VzZVN0YXRlLm1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGRlbHRhWSArPSBldmVudC5kZWx0YVk7XHJcbiAgICB9LCBmYWxzZSk7XHJcbn1cclxuXHJcbnAudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbihlKXtcclxuICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQodGhpcy5tb3VzZVBvc2l0aW9uLnggLSAod2luZG93LmlubmVyV2lkdGgvMi4wKSwgdGhpcy5tb3VzZVBvc2l0aW9uLnkgLSAod2luZG93LmlubmVySGVpZ2h0LzIuMCkpO1xyXG59XHJcblxyXG5wLnVwZGF0ZVRvdWNoUG9zaXRpb25zID0gZnVuY3Rpb24oZSl7XHJcblx0dmFyIGN1clRvdWNoZXMgPSBbXHJcblx0ICAgICAgICAgICAgICAgbmV3IFBvaW50KGUudG91Y2hlc1swXS5jbGllbnRYLCBlLnRvdWNoZXNbMF0uY2xpZW50WSksXHJcblx0ICAgICAgICAgICAgICAgbmV3IFBvaW50KGUudG91Y2hlc1sxXS5jbGllbnRYLCBlLnRvdWNoZXNbMV0uY2xpZW50WSlcclxuXHRdO1xyXG5cdHRvdWNoWm9vbSA9IE1hdGguc3FydChNYXRoLnBvdyhjdXJUb3VjaGVzWzBdLngtY3VyVG91Y2hlc1sxXS54LCAyKStNYXRoLnBvdyhjdXJUb3VjaGVzWzBdLnktY3VyVG91Y2hlc1sxXS55LCAyKSk7XHJcbn1cclxuXHJcbi8vIFVwZGF0ZSB0aGUgbW91c2UgdG8gdGhlIGN1cnJlbnQgc3RhdGVcclxucC51cGRhdGUgPSBmdW5jdGlvbihkdCwgc2NhbGUpe1xyXG4gICAgXHJcblx0Ly8gU2F2ZSB0aGUgY3VycmVudCB2aXJ0dWFsIHBvc2l0aW9uIGZyb20gc2NhbGVcclxuXHR0aGlzLnZpcnR1YWxQb3NpdGlvbiA9IG5ldyBQb2ludChyZWxhdGl2ZU1vdXNlUG9zaXRpb24ueC9zY2FsZSwgcmVsYXRpdmVNb3VzZVBvc2l0aW9uLnkvc2NhbGUpOztcclxuXHRcclxuXHQvLyBHZXQgdGhlIGN1cnJ0ZW5sIGRlbHRhIHkgZm9yIHRoZSBtb3VzZSB3aGVlbFxyXG4gICAgdGhpcy5tb3VzZVdoZWVsRFkgPSBkZWx0YVk7XHJcbiAgICBkZWx0YVkgPSAwO1xyXG5cdFxyXG5cdC8vIFNhdmUgdGhlIHpvb20gZGlmZiBhbmQgcHJldiB6b29tXHJcblx0aWYoc2NhbGluZylcclxuXHRcdHRoaXMuem9vbURpZmYgPSBzdGFydFRvdWNoWm9vbSAtIHRvdWNoWm9vbTtcclxuXHRlbHNlXHJcblx0XHR0aGlzLnpvb21EaWZmID0gMDtcclxuICAgIFxyXG4gICAgLy8gY2hlY2sgbW91c2UgY2xpY2tcclxuICAgIHRoaXMubW91c2VDbGlja2VkID0gZmFsc2U7XHJcbiAgICBpZiAodGhpcy5tb3VzZURvd24pXHJcbiAgICBcdG1vdXNlRG93blRpbWVyICs9IGR0O1xyXG4gICAgZWxzZXtcclxuICAgIFx0aWYgKG1vdXNlRG93blRpbWVyID4gMCAmJiBtb3VzZURvd25UaW1lciA8IG1heENsaWNrRHVyYXRpb24pXHJcbiAgICBcdFx0dGhpcy5tb3VzZUNsaWNrZWQgPSB0cnVlO1xyXG4gICAgXHRtb3VzZURvd25UaW1lciA9IDA7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMucHJldk1vdXNlRG93biA9IHRoaXMubW91c2VEb3duO1xyXG4gICAgdGhpcy5oYXNUYXJnZXQgPSBmYWxzZTtcclxuICAgIFxyXG59XHJcblxyXG5wLmxlZnRNb3VzZUNsaWNrZWQgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgdGVtcCA9IGxlZnRNb3VzZUNsaWNrZWQ7XHJcblx0bGVmdE1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xyXG5cdHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1vdXNlU3RhdGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIFBvaW50KHBYLCBwWSl7XHJcbiAgICB0aGlzLnggPSBwWDtcclxuICAgIHRoaXMueSA9IHBZO1xyXG59XHJcblxyXG52YXIgcCA9IFBvaW50LnByb3RvdHlwZTtcclxuXHJcbnAuYWRkID0gZnVuY3Rpb24ocFgsIHBZKXtcclxuXHRpZihwWSlcclxuXHRcdHJldHVybiBuZXcgUG9pbnQodGhpcy54K3BYLCB0aGlzLnkrcFkpO1xyXG5cdGVsc2VcclxuXHRcdHJldHVybiBuZXcgUG9pbnQodGhpcy54K3BYLngsIHRoaXMueStwWC55KTtcclxufVxyXG5cclxucC5tdWx0ID0gZnVuY3Rpb24ocFgsIHBZKXtcclxuXHRpZihwWSlcclxuXHRcdHJldHVybiBuZXcgUG9pbnQodGhpcy54KnBYLCB0aGlzLnkqcFkpO1xyXG5cdGVsc2VcclxuXHRcdHJldHVybiBuZXcgUG9pbnQodGhpcy54KnBYLngsIHRoaXMueSpwWC55KTtcclxufVxyXG5cclxucC5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcclxuXHRyZXR1cm4gbmV3IFBvaW50KHRoaXMueCpzY2FsZSwgdGhpcy55KnNjYWxlKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9wb2ludC5qcycpO1xyXG5cclxuLy9Nb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG4vLyByZXR1cm5zIG1vdXNlIHBvc2l0aW9uIGluIGxvY2FsIGNvb3JkaW5hdGUgc3lzdGVtIG9mIGVsZW1lbnRcclxubS5nZXRNb3VzZSA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQb2ludCgoZS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQpLCAoZS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcCkpO1xyXG59XHJcblxyXG4vL3JldHVybnMgYSB2YWx1ZSByZWxhdGl2ZSB0byB0aGUgcmF0aW8gaXQgaGFzIHdpdGggYSBzcGVjaWZpYyByYW5nZSBcIm1hcHBlZFwiIHRvIGEgZGlmZmVyZW50IHJhbmdlXHJcbm0ubWFwID0gZnVuY3Rpb24odmFsdWUsIG1pbjEsIG1heDEsIG1pbjIsIG1heDIpe1xyXG4gICAgcmV0dXJuIG1pbjIgKyAobWF4MiAtIG1pbjIpICogKCh2YWx1ZSAtIG1pbjEpIC8gKG1heDEgLSBtaW4xKSk7XHJcbn1cclxuXHJcbi8vaWYgYSB2YWx1ZSBpcyBoaWdoZXIgb3IgbG93ZXIgdGhhbiB0aGUgbWluIGFuZCBtYXgsIGl0IGlzIFwiY2xhbXBlZFwiIHRvIHRoYXQgb3V0ZXIgbGltaXRcclxubS5jbGFtcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4sIG1heCl7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHZhbHVlKSk7XHJcbn1cclxuXHJcbi8vZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtb3VzZSBpcyBpbnRlcnNlY3RpbmcgdGhlIGFyZWFcclxubS5tb3VzZUludGVyc2VjdCA9IGZ1bmN0aW9uKHBNb3VzZVN0YXRlLCBhcmVhLCBwT2Zmc2V0dGVyKXtcclxuICAgIGlmKHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54ID4gYXJlYS5wb3NpdGlvbi54IC0gYXJlYS53aWR0aC8yIC0gcE9mZnNldHRlci54ICYmIHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54IDwgYXJlYS5wb3NpdGlvbi54ICsgYXJlYS53aWR0aC8yIC0gcE9mZnNldHRlci54ICYmXHJcbiAgICBcdFx0cE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPiBhcmVhLnBvc2l0aW9uLnkgLSBhcmVhLmhlaWdodC8yIC0gcE9mZnNldHRlci55ICYmIHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IDwgYXJlYS5wb3NpdGlvbi55ICsgYXJlYS5oZWlnaHQvMiAtIHBPZmZzZXR0ZXIueSlcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICBlbHNlXHJcbiAgICBcdHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy9kZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vdXNlIGlzIGludGVyc2VjdGluZyB0aGUgYXJlYSBhcm91bmQgdGhlIGdpdmVuIGFyZWEgYW5kIGF0IHdoYXQgc2lkZSAocmVzdWx0IGlzIHNpZGUgbiAtIG5vcnRoLCB3IC0gd2VzdCwgcyAtIHNvdXRoLCBlIC0gZWFzdCwgbncgLSBub3J0aHdlc3QsIGV0Yy4pXHJcbm0ubW91c2VJbnRlcnNlY3RFZGdlID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUsIGFyZWEsIG91dGxpbmUsIHBPZmZzZXR0ZXIpe1xyXG5cdHZhciBib3VuZHMgPSB7bGVmdDogYXJlYS5wb3NpdGlvbi54IC0gYXJlYS53aWR0aC8yIC0gcE9mZnNldHRlci54LFxyXG5cdFx0XHRcdFx0cmlnaHQ6IGFyZWEucG9zaXRpb24ueCArIGFyZWEud2lkdGgvMiAtIHBPZmZzZXR0ZXIueCxcclxuXHRcdFx0XHRcdHRvcDogYXJlYS5wb3NpdGlvbi55IC0gYXJlYS5oZWlnaHQvMiAtIHBPZmZzZXR0ZXIueSxcclxuXHRcdFx0XHRcdGJvdHRvbTogYXJlYS5wb3NpdGlvbi55ICsgYXJlYS5oZWlnaHQvMiAtIHBPZmZzZXR0ZXIueX07XHJcbiAgICBpZiAocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPiBib3VuZHMubGVmdCAtIG91dGxpbmUgJiYgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPCBib3VuZHMucmlnaHQgKyBvdXRsaW5lICYmXHJcbiAgICBcdFx0cE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPiBib3VuZHMudG9wIC0gb3V0bGluZSAmJiBwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSA8IGJvdW5kcy5ib3R0b20gKyBvdXRsaW5lKXtcclxuICAgIFx0dmFyIHNpZGUgPSAnJztcclxuICAgIFx0aWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPD0gYm91bmRzLnRvcClcclxuICAgIFx0XHRzaWRlICs9ICduJztcclxuICAgIFx0aWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPj0gYm91bmRzLmJvdHRvbSlcclxuICAgIFx0XHRzaWRlICs9ICdzJztcclxuICAgIFx0aWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPD0gYm91bmRzLmxlZnQpXHJcbiAgICBcdFx0c2lkZSArPSAndyc7XHJcbiAgICBcdGlmKHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54ID49IGJvdW5kcy5yaWdodClcclxuICAgIFx0XHRzaWRlICs9ICdlJztcclxuICAgIFx0aWYoc2lkZSE9MSlcclxuICAgIFx0XHRyZXR1cm4gc2lkZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcblxyXG4vLyBnZXRzIHRoZSB4bWwgb2JqZWN0IG9mIGEgc3RyaW5nXHJcbm0uZ2V0WG1sID0gZnVuY3Rpb24oeG1sKXtcclxuXHRcclxuXHQvLyBDbGVhbiB1cCB0aGUgeG1sXHJcblx0eG1sID0geG1sLnRyaW0oKTtcclxuXHR3aGlsZSh4bWwuY2hhckNvZGVBdCgwKTw9MzIpXHJcblx0XHR4bWwgPSB4bWwuc3Vic3RyKDEpO1xyXG5cdHhtbCA9IHhtbC50cmltKCk7XHJcblx0XHJcblx0dmFyIHhtbERvYztcclxuXHRpZiAod2luZG93LkRPTVBhcnNlcil7XHJcblx0XHR2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cdFx0eG1sRG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsIFwidGV4dC94bWxcIik7XHJcblx0fVxyXG5cdGVsc2V7IC8vIElFXHJcblx0XHR4bWxEb2MgPSBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxET01cIik7XHJcblx0XHR4bWxEb2MuYXN5bmMgPSBmYWxzZTtcclxuXHRcdHhtbERvYy5sb2FkWE1MKHhtbCk7XHJcblx0fVxyXG5cdHJldHVybiB4bWxEb2M7XHJcbn1cclxuXHJcbi8vIGdldHMgdGhlIHNjYWxlIG9mIHRoZSBmaXJzdCBwYXJhbWV0ZXIgdG8gdGhlIHNlY29uZCAod2l0aCB0aGUgc2Vjb25kIGZpdHRpbmcgaW5zaWRlIHRoZSBmaXJzdClcclxubS5nZXRTY2FsZSA9IGZ1bmN0aW9uKHZpcnR1YWwsIGFjdHVhbCl7XHJcblx0cmV0dXJuIGFjdHVhbC55L3ZpcnR1YWwueCp2aXJ0dWFsLnkgPCBhY3R1YWwueCA/IGFjdHVhbC55L3ZpcnR1YWwueSA6IGFjdHVhbC54L3ZpcnR1YWwueDtcclxufVxyXG5cclxubS5yZXBsYWNlQWxsID0gZnVuY3Rpb24gKHN0ciwgdGFyZ2V0LCByZXBsYWNlbWVudCkge1xyXG5cdHdoaWxlIChzdHIuaW5kZXhPZih0YXJnZXQpID4gLTEpIHtcclxuXHRcdHN0ciA9IHN0ci5yZXBsYWNlKHRhcmdldCxyZXBsYWNlbWVudCk7XHJcblx0fVxyXG5cdHJldHVybiBzdHI7XHJcbn1cclxuXHJcbi8vIEdldHMgdGhlIGluZGV4IG9mIHRoZSBudGggc2VhcmNoIHN0cmluZyAoc3RhcnRpbmcgYXQgMSwgMCB3aWxsIGFsd2F5cyByZXR1cm4gMClcclxuU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mQXQgPSBmdW5jdGlvbihzZWFyY2gsIG51bSl7XHJcblx0dmFyIGN1ckluZGV4ID0gMDtcclxuXHRmb3IodmFyIGk9MDtpPG51bSAmJiBjdXJJbmRleCE9LTE7aSsrKVxyXG5cdFx0Y3VySW5kZXggPSB0aGlzLmluZGV4T2Yoc2VhcmNoLCBjdXJJbmRleCsxKTtcclxuXHRyZXR1cm4gY3VySW5kZXg7XHJcbn1cclxuIiwiXHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG5tLmVkaXRJbmZvID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3cgcG9wdXBcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRDYXNlIEluZm9cXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIiBzdHlsZT1cIm1pbi1oZWlnaHQ6MzV2aDtcIj5cXFxyXG5cdFx0PGZvcm0gb25zdWJtaXQ9XCJyZXR1cm4gZmFsc2U7XCI+XFxcclxuXHRcdFx0PGI+TmFtZTwvYj48YnI+XFxcclxuXHRcdFx0PGlucHV0IG5hbWU9XCJjYXNlTmFtZVwiIHZhbHVlPVwiJWNhc2VOYW1lJVwiPjxicj5cXFxyXG5cdFx0XHQ8Yj5EZXNjcmlwdGlvbjwvYj48YnI+XFxcclxuXHRcdCBcdDxwPjxkaXYgY2xhc3M9XCJ0ZXh0LWJveCBsYXJnZVwiIGNvbnRlbnRlZGl0YWJsZT4lZGVzY3JpcHRpb24lPC9kaXY+PC9wPlxcXHJcblx0XHRcdDxiPkNvbmNsdXNpb248L2I+PGJyPlxcXHJcblx0IFx0XHQ8cD48ZGl2IGNsYXNzPVwidGV4dC1ib3ggbGFyZ2VcIiBjb250ZW50ZWRpdGFibGU+JWNvbmNsdXNpb24lPC9kaXY+PC9wPlxcXHJcblx0XHRcdDxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+QmFjazwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+QXBwbHkgQ2hhbmdlczwvYnV0dG9uPlxcXHJcblx0XHQ8L2Zvcm0+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5yZXNvdXJjZXNXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBwb3B1cFwiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdFJlc291cmNlc1xcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiPlxcXHJcblx0XHQ8ZGl2IGNsYXNzPVwicmVzb3VyY2VDb250ZW50XCIgc3R5bGU9XCJvdmVyZmxvdy15OnNjcm9sbDtoZWlnaHQ6MzV2aDtcIj5cXFxyXG5cdFx0PC9kaXY+XFxcclxuXHRcdDxicj5cXFxyXG5cdFx0PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj5CYWNrPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj5DcmVhdGUgTmV3IFJlc291cmNlczwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0ucmVzb3VyY2UgPSAnXFxcclxuPGRpdiBjbGFzcz1cInJlc291cmNlSXRlbVwiPlxcXHJcbiAgPGltZyBzcmM9XCIlaWNvbiVcIiBjbGFzcz1cImljb25cIi8+XFxcclxuICA8aW1nIHNyYz1cIi4uL2ltZy9pY29uQ2xvc2UucG5nXCIgY2xhc3M9XCJkZWxldGVcIi8+XFxcclxuICA8aW1nIHNyYz1cIi4uL2ltZy9pY29uVG9vbHMucG5nXCIgY2xhc3M9XCJlZGl0XCIvPlxcXHJcbiAgPGRpdiBjbGFzcz1cInJlc291cmNlVGV4dFwiPiV0aXRsZSVcXFxyXG4gIDxicj5cXFxyXG4gIDxzcGFuIHN0eWxlPVwiY29sb3I6Z3JheTtcIj4lbGluayU8L3NwYW4+PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0ucmVzb3VyY2VFZGl0b3IgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBwb3B1cFwiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdCVlZGl0JSBSZXNvdXJjZVxcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiPlxcXHJcblx0XHQ8Zm9ybSBvbnN1Ym1pdD1cInJldHVybiBmYWxzZTtcIj5cXFxyXG5cdFx0XHQ8c2VsZWN0IG5hbWU9XCJ0eXBlXCIgY2xhc3M9XCJmdWxsXCI+XFxcclxuXHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMFwiPkZpbGUgUmVmcmVuY2U8L29wdGlvbj5cXFxyXG5cdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIxXCI+V2ViIExpbms8L29wdGlvbj5cXFxyXG5cdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIyXCI+VmlkZW8gTGluazwvb3B0aW9uPlxcXHJcblx0XHRcdDwvc2VsZWN0PlxcXHJcblx0XHRcdDxiPkRpc3BsYXkgTmFtZTwvYj48YnI+XFxcclxuXHRcdFx0PGlucHV0IG5hbWU9XCJuYW1lXCIgdmFsdWU9XCIlbmFtZSVcIj48YnI+XFxcclxuXHRcdFx0PGIgY2xhc3M9XCJhZGRyZXNzVGFnXCI+TGluayBBZGRyZXNzPC9iPjxicj5cXFxyXG5cdFx0XHQ8aW5wdXQgY2xhc3M9XCJhZGRyZXNzXCIgbmFtZT1cImxpbmtcIiB2YWx1ZT1cIiVsaW5rJVwiPlxcXHJcblx0XHRcdDxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+Q2hvb3NlIEZpbGU8L2J1dHRvbj48YnV0dG9uIGNsYXNzPVwiaGFsZkJ1dHRvblwiPlZpZXcgRmlsZTwvYnV0dG9uPlxcXHJcblx0XHRcdDxzcGFuIGNsYXNzPVwiYWRkcmVzc0luZm9cIj48L3NwYW4+XFxcclxuXHRcdDwvZm9ybT5cXFxyXG5cdFx0PGJyPlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwiaGFsZkJ1dHRvblwiPkNhbmNlbDwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+JWFwcGx5JTwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0udGV4dElucHV0ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3cgcG9wdXBcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHQldGl0bGUlXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCI+XFxcclxuXHRcdDxmb3JtIG9uc3VibWl0PVwicmV0dXJuIGZhbHNlO1wiPlxcXHJcblx0XHRcdDxiPiVwcm9tcHQlPC9iPjxicj5cXFxyXG5cdFx0XHQ8aW5wdXQgbmFtZT1cInRleHRcIiB2YWx1ZT1cIiV2YWx1ZSVcIj48YnI+XFxcclxuXHRcdDwvZm9ybT5cXFxyXG5cdFx0PGJyPlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwiaGFsZkJ1dHRvblwiPkNhbmNlbDwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+JWFwcGx5JTwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0uaW1hZ2VzRWRpdG9yID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3cgaW1hZ2VzXCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0SW1hZ2VzXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCI+XFxcclxuXHRcdDxkaXYgY2xhc3M9XCJpbWFnZUNvbnRlbnRcIj5cXFxyXG5cdFx0PC9kaXY+XFxcclxuXHRcdDxicj5cXFxyXG5cdFx0PGlucHV0IHR5cGU9XCJmaWxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmU7XCIvPlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwidGhpcmRCdXR0b25cIj5DbG9zZTwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJ0aGlyZEJ1dHRvblwiPlVwbG9hZCBJbWFnZTwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJ0aGlyZEJ1dHRvblwiPkltcG9ydCBJbWFnZTwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0uaW1hZ2UgPSAnXFxcclxuPGRpdiBjbGFzcz1cImltYWdlXCI+XFxcclxuXHQ8aW1nIHNyYz0laW1hZ2UlIC8+XFxcclxuXHQ8aW1nIHNyYz1cIi4uL2ltZy9pY29uQ2xvc2UucG5nXCIgY2xhc3M9XCJkZWxldGVcIi8+XFxcclxuPC9kaXY+XFxcclxuJzsiLCJcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0udGFza1dpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93XCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0VGFza1xcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiIHN0eWxlPVwib3ZlcmZsb3cteTogc2Nyb2xsO2hlaWdodDozMHZoO1wiPlxcXHJcblx0XHQ8aDM+PGI+UXVlc3Rpb24gTmFtZTwvYj48L2gzPlxcXHJcblx0XHQ8aDM+PGI+PGRpdiBjbGFzcz1cInRleHQtYm94XCIgY29udGVudGVkaXRhYmxlPiV0aXRsZSU8L2Rpdj48L2I+PC9oMz48YnI+XFxcclxuXHRcdDxwPkluc3RydWN0aW9uczwvcD5cXFxyXG5cdFx0PHA+PGRpdiBjbGFzcz1cInRleHQtYm94IGxhcmdlXCIgY29udGVudGVkaXRhYmxlPiVpbnN0cnVjdGlvbnMlPC9kaXY+PC9wPlxcXHJcblx0XHQ8aHI+XFxcclxuXHRcdDxwPjxiPlF1ZXN0aW9uPC9iPjwvcD5cXFxyXG5cdFx0PHA+PGI+PGRpdiBjbGFzcz1cInRleHQtYm94IGxhcmdlXCIgY29udGVudGVkaXRhYmxlPiVxdWVzdGlvbiU8L2Rpdj48L2I+PC9wPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcblxyXG5tLnJlc291cmNlV2luZG93ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRSZXNvdXJjZVxcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiIHN0eWxlPVwib3ZlcmZsb3cteTogc2Nyb2xsOyBoZWlnaHQ6MjB2aDtcIj5cXFxyXG5cdFx0PGRpdiBjbGFzcz1cInJlc291cmNlQ29udGVudFwiPlxcXHJcblx0XHQ8L2Rpdj5cXFxyXG5cdFx0PGJyPlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwiZnVsbFwiPkFkZCBSZXNvdXJjZTwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0ucmVzb3VyY2UgPSAnXFxcclxuPGRpdiBjbGFzcz1cInJlc291cmNlSXRlbVwiPlxcXHJcbiAgPGltZyBzcmM9XCIlaWNvbiVcIiBjbGFzcz1cImljb25cIi8+XFxcclxuICA8aW1nIHNyYz1cIi4uL2ltZy9pY29uQ2xvc2UucG5nXCIgY2xhc3M9XCJkZWxldGVcIi8+XFxcclxuICA8ZGl2IGNsYXNzPVwicmVzb3VyY2VUZXh0XCI+JXRpdGxlJTwvZGl2PlxcXHJcbiAgPGEgaHJlZj1cIiVsaW5rJVwiIHRhcmdldD1cIl9ibGFua1wiPlxcXHJcbiAgICA8ZGl2IGNsYXNzPVwiY2VudGVyXCI+XFxcclxuICAgICAgT3BlblxcXHJcbiAgICAgIDxpbWcgc3JjPVwiLi4vaW1nL2ljb25MYXVuY2gucG5nXCIvPlxcXHJcbiAgICA8L2Rpdj5cXFxyXG4gIDwvYT5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5hbnN3ZXJXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyByaWdodFwiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdEFuc3dlcnNcXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIiBzdHlsZT1cIm1pbi1oZWlnaHQ6MjB2aDtcIj5cXFxyXG5cdFx0PHNlbGVjdD5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMlwiPjI8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiM1wiPjM8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiNFwiPjQ8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiNVwiPjU8L29wdGlvbj5cXFxyXG5cdFx0PC9zZWxlY3Q+XFxcclxuXHRcdGFuc3dlcnMuIFNlbGVjdCBjb3JyZWN0IGFuc3dlciB3aXRoIHJhZGlvIGJ1dHRvbi5cXFxyXG5cdFx0PGZvcm0gb25zdWJtaXQ9XCJyZXR1cm4gZmFsc2U7XCI+XFxcclxuXHRcdFxcXHJcblx0XHQ8L2Zvcm0+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5hbnN3ZXIgPSdcXFxyXG48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cImFuc3dlclwiIHZhbHVlPVwiJW51bSVcIiBjbGFzcz1cImFuc3dlclJhZGlvXCI+XFxcclxuPGRpdiBjbGFzcz1cImFuc3dlcklucHV0c1wiPlxcXHJcblx0PGI+Q2hvaWNlICVudW0lPC9iPjxicj5cXFxyXG5cdDxpbnB1dCBuYW1lPVwiYW5zd2VyJW51bSVcIiB2YWx1ZT1cIiVhbnN3ZXIlXCI+PGJyPlxcXHJcblx0RmVlZGJhY2s8YnI+XFxcclxuXHQ8aW5wdXQgbmFtZT1cImZlZWRiYWNrJW51bSVcIiB2YWx1ZT1cIiVmZWVkYmFjayVcIj48YnI+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0ubWVzc2FnZVdpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93XCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0TWVzc2FnZVxcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiIHN0eWxlPVwiaGVpZ2h0OjYwdmg7b3ZlcmZsb3cteTpzY3JvbGw7XCI+XFxcclxuXHRcdDxwPjxiPkZyb20gPC9iPlxcXHJcblx0XHQ8ZGl2IGNsYXNzPVwidGV4dC1ib3hcIiBjb250ZW50ZWRpdGFibGU+JXRpdGxlJTwvZGl2PjwvcD5cXFxyXG5cdFx0PGhyPlxcXHJcblx0XHQ8cD48Yj5TdWJqZWN0IDwvYj5cXFxyXG5cdFx0PGRpdiBjbGFzcz1cInRleHQtYm94XCIgY29udGVudGVkaXRhYmxlPiVpbnN0cnVjdGlvbnMlPC9kaXY+PC9wPlxcXHJcblx0XHQ8aHI+XFxcclxuXHRcdDxwPk1lc3NhZ2U8L3A+XFxcclxuXHRcdDxwPjxkaXYgY2xhc3M9XCJ0ZXh0LWJveCB0YWxsXCIgY29udGVudGVkaXRhYmxlPiVxdWVzdGlvbiU8L2Rpdj48L3A+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5xdWVzdGlvblR5cGVXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvd1wiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdFF1ZXN0aW9uIFR5cGVcXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIj5cXFxyXG5cdFx0PHNlbGVjdCBjbGFzcz1cImZ1bGxcIj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMVwiPkp1c3RpZmljYXRpb24gTXVsdGlwbGUgQ2hvaWNlPC9vcHRpb24+XFxcclxuXHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjJcIj5TdGFuZGFyZCBNdWx0aXBsZSBDaG9pY2U8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiM1wiPlNob3J0IFJlc3BvbnNlPC9vcHRpb24+XFxcclxuXHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjRcIj5GaWxlIFN1Ym1pc3Nvbjwvb3B0aW9uPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCI1XCI+TWVzc2FnZTwvb3B0aW9uPlxcXHJcblx0XHQ8L3NlbGVjdD5cXFxyXG5cdFx0PGJ1dHRvbiBjbGFzcz1cImltYWdlQnV0dG9uXCI+XFxcclxuXHRcdCAgPGRpdj48aW1nIHNyYz1cIi4uL2ltZy9wbGFjZWhvbGRlci5wbmdcIi8+PC9kaXY+XFxcclxuXHRcdCAgPGRpdj4gU2VsZWN0IEltYWdlIDwvZGl2PlxcXHJcblx0XHQ8L2J1dHRvbj5cXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0J1dHRvbnNcIj5cXFxyXG5cdFx0PGJ1dHRvbj5TYXZlPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nOyIsInZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi9oZWxwZXIvdXRpbGl0aWVzLmpzJyk7XHJcblxyXG4vLyBIVE1MXHJcbnZhciBzZWN0aW9uO1xyXG5cclxuLy9FbGVtZW50c1xyXG52YXIgbmFtZUlucHV0LCBkZXNjcmlwdGlvbklucHV0LCBjYXQxSW5wdXQ7XHJcbnZhciBjcmVhdGUsIGJhY2s7XHJcblxyXG4vLyBUaGUgY3VyIGNhc2VcclxudmFyIGNhc2VGaWxlO1xyXG5cclxuLy8gVGhlIG5leHQgcGFnZSB0byBvcGVuIHdoZW4gdGhpcyBvbmUgY2xvc2VzXHJcbnZhciBuZXh0O1xyXG5cclxudmFyIE5FWFQgPSBPYmplY3QuZnJlZXplKHtOT05FOiAwLCBUSVRMRTogMSwgQk9BUkQ6IDJ9KTtcclxuXHJcbmZ1bmN0aW9uIENyZWF0ZU1lbnUocFNlY3Rpb24pe1xyXG5cdHNlY3Rpb24gPSBwU2VjdGlvbjtcclxuXHRuZXh0ID0gTkVYVC5OT05FO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgaHRtbCBlbGVtZW50c1xyXG5cdG5hbWVJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjaW5wdXQtbmFtZScpO1xyXG5cdGRlc2NyaXB0aW9uSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2lucHV0LWRlc2NyaXB0aW9uJyk7XHJcblx0Y29uY2x1c2lvbklucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNpbnB1dC1jb25jbHVzaW9uJyk7XHJcblx0Y2F0MUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNpbnB1dC1jYXQxJyk7XHJcblx0Y3JlYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNjcmVhdGUtYnV0dG9uJyk7XHJcblx0YmFjayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYmFjay1idXR0b24nKTtcclxuICAgIFxyXG5cdC8vIFNldHVwIHRoZSBidXR0b25zXHJcblx0YmFjay5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0cGFnZS5uZXh0ID0gTkVYVC5USVRMRTtcclxuICAgIFx0cGFnZS5jbG9zZSgpO1xyXG4gICAgfTtcclxuXHR2YXIgcGFnZSA9IHRoaXM7XHJcbiAgICBjcmVhdGUub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdFxyXG4gICAgXHRwYWdlLm5leHQgPSBORVhULkJPQVJEO1xyXG4gICAgXHRjcmVhdGUuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgXHRiYWNrLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIFx0XHJcbiAgICBcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICBcdHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xyXG4gICAgXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHQgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuICAgIFx0XHQgIFx0XHJcbiAgICBcdFx0XHQvLyBDcmVhdGUgYSB3b3JrZXIgZm9yIHVuemlwcGluZyB0aGUgZmlsZVxyXG4gICAgXHRcdFx0dmFyIHppcFdvcmtlciA9IG5ldyBXb3JrZXIoXCIuLi9saWIvdW56aXAuanNcIik7XHJcbiAgICBcdFx0XHR6aXBXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgXHRcdFx0XHRcclxuICAgIFx0XHRcdFx0Ly8gR2V0IHRoZSBjYXNlXHJcbiAgICBcdFx0XHRcdHZhciBjYXNlRGF0YSA9IG1lc3NhZ2UuZGF0YTtcclxuICAgIFx0XHRcdFx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcbiAgICBcdFx0ICAgIFx0XHJcbiAgICBcdFx0ICAgIFx0Ly8gU2V0IHRoZSBpbnB1dHMgdG8gdGhlIGN1cnJlbnQgY2FzZVxyXG4gICAgXHRcdCAgICBcdHZhciBjdXJDYXNlID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdO1xyXG4gICAgXHRcdCAgICBcdGN1ckNhc2Uuc2V0QXR0cmlidXRlKCdjYXNlTmFtZScsIG5hbWVJbnB1dC52YWx1ZSk7XHJcbiAgICBcdFx0ICAgIFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoJ2Rlc2NyaXB0aW9uJywgZGVzY3JpcHRpb25JbnB1dC5pbm5lckhUTUwpO1xyXG4gICAgXHRcdCAgICBcdGN1ckNhc2Uuc2V0QXR0cmlidXRlKCdjb25jbHVzaW9uJywgY29uY2x1c2lvbklucHV0LmlubmVySFRNTCk7XHJcbiAgICBcdFx0ICAgIFx0dmFyIGNhdExpc3QgPSBjdXJDYXNlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjYXRlZ29yeUxpc3QnKVswXTtcclxuICAgIFx0XHQgICAgXHRjYXRMaXN0LnNldEF0dHJpYnV0ZSgnY2F0ZWdvcnlDb3VudCcsICcxJyk7XHJcbiAgICBcdFx0ICAgIFx0Y2F0TGlzdC5pbm5lckhUTUwgPSAnPGVsZW1lbnQ+JytjYXQxSW5wdXQudmFsdWUrJzwvZWxlbWVudD4nO1xyXG4gICAgXHRcdCAgICBcdHZhciBjYXQxID0gY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgnY2F0ZWdvcnknKTtcclxuICAgIFx0XHQgICAgXHRjYXQxLnNldEF0dHJpYnV0ZSgnY2F0ZWdvcnlEZXNpZ25hdGlvbicsICcwJyk7XHJcbiAgICBcdFx0ICAgIFx0Y2F0MS5zZXRBdHRyaWJ1dGUoJ3F1ZXN0aW9uQ291bnQnLCAnMCcpO1xyXG4gICAgXHRcdCAgICBcdGN1ckNhc2UuYXBwZW5kQ2hpbGQoY2F0MSk7XHJcbiAgICBcdFx0ICAgIFx0XHJcbiAgICBcdFx0ICAgIFx0Ly8gU2F2ZSB0aGUgY2hhbmdlcyB0byBsb2NhbCBzdG9yYWdlXHJcbiAgICBcdFx0ICAgIFx0bG9jYWxTdG9yYWdlWydjYXNlTmFtZSddID0gbmFtZUlucHV0LnZhbHVlK1wiLmlwYXJcIjtcclxuICAgIFx0XHQgICAgXHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG4gICAgXHRcdFx0XHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblxyXG4gICAgXHRcdCAgICBcdHBhZ2UuY2xvc2UoKTtcclxuICAgIFx0XHQgICAgXHRcclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFxyXG4gICAgXHRcdFx0Ly8gU3RhcnQgdGhlIHdvcmtlclxyXG4gICAgXHRcdFx0emlwV29ya2VyLnBvc3RNZXNzYWdlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgXHQgIH1cclxuICAgIFx0fTtcclxuICAgIFx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIFwiYmFzZS5pcGFyXCIsIHRydWUpO1xyXG4gICAgXHRyZXF1ZXN0LnNlbmQoKTtcclxuICAgIH07XHJcbn1cclxuXHJcbnZhciBwID0gQ3JlYXRlTWVudS5wcm90b3R5cGU7XHJcblxyXG5wLm9wZW4gPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIE1ha2UgdGhlIG1lbnUgdmlzaWJsZVxyXG5cdHNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cclxuXHQvLyBNYWtlIGl0IHNvIHRoYXQgY3JlYXRlIGlzIGRpc2FibGVkIHVudGlsIHlvdSBhdCBsZWFzdCBoYXZlIGEgbmFtZSBhbmQgMXN0IGNhdFxyXG5cdHZhciBjaGVja1Byb2NlZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0aWYobmFtZUlucHV0LnZhbHVlPT1cIlwiIHx8XHJcblx0XHRcdGNhdDFJbnB1dC52YWx1ZT09XCJcIilcclxuXHRcdFx0Y3JlYXRlLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdGVsc2VcclxuXHRcdFx0Y3JlYXRlLmRpc2FibGVkID0gZmFsc2U7XHJcblx0fTtcclxuXHRuYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgY2hlY2tQcm9jZWVkKTtcclxuXHRjYXQxSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgY2hlY2tQcm9jZWVkKTtcclxuXHRjaGVja1Byb2NlZWQoKTtcclxuXHRcclxufVxyXG5cclxucC5jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcblx0c2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdGlmKHRoaXMub25jbG9zZSlcclxuXHRcdHRoaXMub25jbG9zZSgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENyZWF0ZU1lbnU7XHJcbm1vZHVsZS5leHBvcnRzLk5FWFQgPSBORVhUOyIsInZhciBXaW5kb3dzID0gcmVxdWlyZSgnLi4vaHRtbC9wb3B1cFdpbmRvd3MuanMnKTtcclxuXHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG5tLmVkaXRJbmZvID0gZnVuY3Rpb24od2luZG93RGl2LCBjYXNlRmlsZSwgY2FsbGJhY2spe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgcG9wdXAgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MuZWRpdEluZm87XHJcbiAgICB2YXIgZWRpdEluZm8gPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIC8vIEZpbGwgaXQgd2l0aCB0aGUgZ2l2ZW4gaW5mb1xyXG4gICAgdmFyIGNhc2VJbmZvID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdO1xyXG4gICAgZWRpdEluZm8uaW5uZXJIVE1MID0gZWRpdEluZm8uaW5uZXJIVE1MLnJlcGxhY2UoLyVjYXNlTmFtZSUvZywgY2FzZUluZm8uZ2V0QXR0cmlidXRlKFwiY2FzZU5hbWVcIikpLnJlcGxhY2UoLyVkZXNjcmlwdGlvbiUvZywgY2FzZUluZm8uZ2V0QXR0cmlidXRlKFwiZGVzY3JpcHRpb25cIikpLnJlcGxhY2UoLyVjb25jbHVzaW9uJS9nLCBjYXNlSW5mby5nZXRBdHRyaWJ1dGUoXCJjb25jbHVzaW9uXCIpKTtcclxuICAgIFxyXG4gICAgLy8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuICAgIHZhciBidXR0b25zID0gZWRpdEluZm8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIik7XHJcbiAgICBidXR0b25zWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHR3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBcdGNhbGxiYWNrKGNhc2VGaWxlLCBjYXNlSW5mby5nZXRBdHRyaWJ1dGUoXCJjYXNlTmFtZVwiKSk7XHJcbiAgICB9XHJcbiAgICBidXR0b25zWzFdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHR3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBcdHZhciBmb3JtID0gZWRpdEluZm8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xyXG4gICAgXHR2YXIgZGl2cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJkaXZcIik7XHJcbiAgICBcdGNhc2VJbmZvLnNldEF0dHJpYnV0ZShcImNhc2VOYW1lXCIsIGZvcm0uZWxlbWVudHNbXCJjYXNlTmFtZVwiXS52YWx1ZSk7XHJcbiAgICBcdGNhc2VJbmZvLnNldEF0dHJpYnV0ZShcImRlc2NyaXB0aW9uXCIsIGRpdnNbMF0uaW5uZXJIVE1MKTtcclxuICAgIFx0Y2FzZUluZm8uc2V0QXR0cmlidXRlKFwiY29uY2x1c2lvblwiLCBkaXZzWzFdLmlubmVySFRNTCk7XHJcbiAgICBcdGNhbGxiYWNrKGNhc2VGaWxlLCBmb3JtLmVsZW1lbnRzW1wiY2FzZU5hbWVcIl0udmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpc3BsYXkgdGhlIHdpbmRvd1xyXG4gICAgd2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgd2luZG93RGl2LmFwcGVuZENoaWxkKGVkaXRJbmZvKTtcclxuICAgIFxyXG4gICAgXHJcbn1cclxuXHJcbm0ucHJvbXB0ID0gZnVuY3Rpb24od2luZG93RGl2LCB0aXRsZSwgcHJvbXB0LCBkZWZhdWx0VmFsdWUsIGFwcGx5VGV4dCwgY2FsbGJhY2spe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgcG9wdXAgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MudGV4dElucHV0O1xyXG4gICAgdmFyIHByb21wdFdpbmRvdyA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIFxyXG4gICAgLy8gRmlsbCBpdCB3aXRoIHRoZSBnaXZlbiBpbmZvXHJcbiAgICBwcm9tcHRXaW5kb3cuaW5uZXJIVE1MID0gcHJvbXB0V2luZG93LmlubmVySFRNTC5yZXBsYWNlKC8ldGl0bGUlL2csIHRpdGxlKS5yZXBsYWNlKC8lcHJvbXB0JS9nLCBwcm9tcHQpLnJlcGxhY2UoLyV2YWx1ZSUvZywgZGVmYXVsdFZhbHVlKS5yZXBsYWNlKC8lYXBwbHklL2csIGFwcGx5VGV4dCk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRoZSBidXR0b25zXHJcbiAgICB2YXIgYnV0dG9ucyA9IHByb21wdFdpbmRvdy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcclxuICAgIGJ1dHRvbnNbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0Y2FsbGJhY2soKTtcclxuICAgIH1cclxuICAgIGJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0Y2FsbGJhY2socHJvbXB0V2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9ybVwiKVswXS5lbGVtZW50c1tcInRleHRcIl0udmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpc3BsYXkgdGhlIHdpbmRvd1xyXG4gICAgd2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgd2luZG93RGl2LmFwcGVuZENoaWxkKHByb21wdFdpbmRvdyk7XHJcblx0XHJcbn0iLCJcclxuLy8gSFRNTFxyXG52YXIgc2VjdGlvbjtcclxuXHJcbi8vIFBhcnRzIG9mIHRoZSBodG1sXHJcbnZhciBsb2FkSW5wdXQsIGxvYWRCdXR0b24sIGNyZWF0ZUJ1dHRvbiwgY29udGludWVCdXR0b24sIG1lbnVCdXR0b247XHJcblxyXG4vLyBUaGUgbmV4dCBwYWdlIHRvIG9wZW4gd2hlbiB0aGlzIG9uZSBjbG9zZXNcclxudmFyIG5leHQ7XHJcblxyXG52YXIgTkVYVCA9IE9iamVjdC5mcmVlemUoe05PTkU6IDAsIEJPQVJEOiAxLCBDUkVBVEU6IDJ9KTtcclxuXHJcbmZ1bmN0aW9uIFRpdGxlTWVudShwU2VjdGlvbil7XHJcblx0c2VjdGlvbiA9IHBTZWN0aW9uO1xyXG5cdG5leHQgPSBORVhULk5PTkU7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBsb2FkIGJ1dHRvbiBhbmQgaW5wdXRcclxuXHRsb2FkSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2xvYWQtaW5wdXQnKTtcclxuXHRsb2FkQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNsb2FkLWJ1dHRvbicpO1xyXG5cdGNyZWF0ZUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjY3JlYXRlLWJ1dHRvbicpO1xyXG5cdGNvbnRpbnVlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNjb250aW51ZS1idXR0b24nKTtcclxuXHRtZW51QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNtZW51LWJ1dHRvbicpO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRoZSBidXR0b25zXHJcblx0Y3JlYXRlQnV0dG9uLm9uY2xpY2sgPSB0aGlzLmNyZWF0ZS5iaW5kKHRoaXMpO1xyXG5cdGxvYWRCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0XHRpZihsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gJiYgIWNvbmZpcm0oXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gc3RhcnQgYSBuZXcgY2FzZT8gWW91ciBhdXRvc2F2ZSBkYXRhIHdpbGwgYmUgbG9zdCFcIikpXHJcblx0XHRcdHJldHVybjtcclxuXHRcdGxvYWRJbnB1dC5jbGljaygpO1xyXG5cdH1cclxuXHRsb2FkSW5wdXQub25jaGFuZ2UgPSB0aGlzLmxvYWRGaWxlLmJpbmQodGhpcyk7XHJcblx0Y29udGludWVCdXR0b24ub25jbGljayA9IHRoaXMuY2xvc2UuYmluZCh0aGlzKTtcclxuXHRtZW51QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbigpe3dpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9pbmRleC5odG1sXCI7fTtcclxufVxyXG5cclxudmFyIHAgPSBUaXRsZU1lbnUucHJvdG90eXBlO1xyXG5cclxucC5vcGVuID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBEaXNwbGF5IHRoZSBzZWN0aW9uIGhvbGRpbmcgdGhlIG1lbnVcclxuXHRzZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHRcclxuXHQvLyBTZXR1cCBjb250aW51ZSBidXR0b24gYmFzZWQgb24gbG9jYWwgc3RvYXJnZVxyXG5cdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSlcclxuXHRcdGNvbnRpbnVlQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcblx0ZWxzZVxyXG5cdFx0Y29udGludWVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdHRoaXMubmV4dCA9IE5FWFQuQk9BUkQ7XHJcblx0XHJcblx0Ly8gU2V0IHRoZSBidXR0b24gdG8gbm90IGRpc2FibGVkIGluIGNhc2UgY29taW5nIGJhY2sgdG8gdGhpcyBtZW51XHJcblx0bG9hZEJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdGxvYWRJbnB1dC5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdG1lbnVCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRjcmVhdGVCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcclxufVxyXG5cclxucC5jcmVhdGUgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRpZihsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gJiYgIWNvbmZpcm0oXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gc3RhcnQgYSBuZXcgY2FzZT8gWW91ciBhdXRvc2F2ZSBkYXRhIHdpbGwgYmUgbG9zdCFcIikpXHJcblx0XHRyZXR1cm47XHJcblx0XHJcblx0Ly8gZ28gdG8gdGhlIG5leHQgcGFnZVxyXG5cdHRoaXMubmV4dCA9IE5FWFQuQ1JFQVRFO1xyXG5cdHRoaXMuY2xvc2UoKTtcclxuXHRcclxufVxyXG5cclxucC5sb2FkRmlsZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcclxuXHQvLyBNYWtlIHN1cmUgYSBpcGFyIGZpbGUgd2FzIGNob29zZW5cclxuXHRpZighbG9hZElucHV0LnZhbHVlLmVuZHNXaXRoKFwiaXBhclwiKSl7XHJcblx0XHRhbGVydChcIllvdSBkaWRuJ3QgY2hvb3NlIGFuIGlwYXIgZmlsZSEgeW91IGNhbiBvbmx5IGxvYWQgaXBhciBmaWxlcyFcIik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGxvY2FsU3RvcmFnZVsnY2FzZU5hbWUnXSA9IGV2ZW50LnRhcmdldC5maWxlc1swXS5uYW1lO1xyXG5cclxuXHQvLyBTZXQgdGhlIGJ1dHRvbiB0byBkaXNhYmxlZCBzbyB0aGF0IGl0IGNhbid0IGJlIHByZXNzZWQgd2hpbGUgbG9hZGluZ1xyXG5cdGxvYWRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdGxvYWRJbnB1dC5kaXNhYmxlZCA9IHRydWU7XHJcblx0bWVudUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0Y3JlYXRlQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRjb250aW51ZUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIGEgcmVhZGVyIGFuZCByZWFkIHRoZSB6aXBcclxuXHR2YXIgcGFnZSA9IHRoaXM7XHJcblx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcclxuXHRcdC8vIHNpbmNlIHRoZSB1c2VyIGlzIGxvYWRpbmcgYSBmcmVzaCBmaWxlLCBjbGVhciB0aGUgYXV0b3NhdmUgKHNvb24gd2Ugd29uJ3QgdXNlIHRoaXMgYXQgYWxsKVxyXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJhdXRvc2F2ZVwiLFwiXCIpO1xyXG5cdFx0XHJcblx0XHQvLyBDcmVhdGUgYSB3b3JrZXIgZm9yIHVuemlwcGluZyB0aGUgZmlsZVxyXG5cdFx0dmFyIHppcFdvcmtlciA9IG5ldyBXb3JrZXIoXCJsaWIvdW56aXAuanNcIik7XHJcblx0XHR6aXBXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gU2F2ZSB0aGUgYmFzZSB1cmwgdG8gbG9jYWwgc3RvcmFnZVxyXG5cdFx0XHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlLmRhdGEpO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gUmVkaXJlY3QgdG8gdGhlIG5leHQgcGFnZVxyXG5cdFx0XHRwYWdlLm5leHQgPSBORVhULkJPQVJEO1xyXG5cdFx0XHRwYWdlLmNsb3NlKCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBTdGFydCB0aGUgd29ya2VyXHJcblx0XHR6aXBXb3JrZXIucG9zdE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XHJcblx0XHRcclxuXHR9O1xyXG5cdHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihldmVudC50YXJnZXQuZmlsZXNbMF0pO1xyXG5cdFxyXG59XHJcblxyXG5wLmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRzZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0aWYodGhpcy5vbmNsb3NlKVxyXG5cdFx0dGhpcy5vbmNsb3NlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGl0bGVNZW51O1xyXG5tb2R1bGUuZXhwb3J0cy5ORVhUID0gTkVYVDsiXX0=

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
		if(resources.newLink==null){
			var newLink = form.elements["link"].value;
			if(!newLink.match(/^https?:\/\/.*/))
				newLink = "http://"+newLink;
			newResource.setAttribute("link", newLink);
		}
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlZGl0b3IvanMvbWFpbi5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2Nhc2UvY2F0ZWdvcnkuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9jYXNlL3F1ZXN0aW9uLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvY2FzZS9yZXNvdXJjZXMuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2JvYXJkLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvZ2FtZS9jb25zdGFudHMuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2dhbWUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9nYW1lL2xlc3Nvbk5vZGUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvZHJhd2xpYi5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9maWxlTWFuYWdlci5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9pcGFyRGF0YVBhcnNlci5qcyIsImVkaXRvci9qcy9tb2R1bGVzL2hlbHBlci9rZXlib2FyZFN0YXRlLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvaGVscGVyL21vdXNlU3RhdGUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvcG9pbnQuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9oZWxwZXIvdXRpbGl0aWVzLmpzIiwiZWRpdG9yL2pzL21vZHVsZXMvaHRtbC9wb3B1cFdpbmRvd3MuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9odG1sL3F1ZXN0aW9uV2luZG93cy5qcyIsImVkaXRvci9qcy9tb2R1bGVzL21lbnVzL2NyZWF0ZU1lbnUuanMiLCJlZGl0b3IvanMvbW9kdWxlcy9tZW51cy9wb3B1cC5qcyIsImVkaXRvci9qcy9tb2R1bGVzL21lbnVzL3RpdGxlTWVudS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3VCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbiA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbiB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuO1xyXG5cclxuLy9pbXBvcnRzXHJcbnZhciBHYW1lID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dhbWUvZ2FtZS5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL21vZHVsZXMvaGVscGVyL3BvaW50LmpzJyk7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL21vZHVsZXMvZ2FtZS9jb25zdGFudHMuanMnKTtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9oZWxwZXIvdXRpbGl0aWVzLmpzJyk7XHJcbnZhciBUaXRsZU1lbnUgPSByZXF1aXJlKCcuL21vZHVsZXMvbWVudXMvdGl0bGVNZW51LmpzJyk7XHJcbnZhciBDcmVhdGVNZW51ID0gcmVxdWlyZSgnLi9tb2R1bGVzL21lbnVzL2NyZWF0ZU1lbnUuanMnKTtcclxuXHJcbi8vIFRoZSBjdXJyZW50IGdhbWVcclxudmFyIGdhbWU7XHJcblxyXG4vLyBUaGUgc2VjdGlvbiBob2xkaW5nIHRoZSBib2FyZFxyXG52YXIgYm9hcmRTZWN0aW9uO1xyXG5cclxuLy8gVGhlIGN1cnJlbnQgcGFnZSB0aGUgd2Vic2l0ZSBpcyBvblxyXG52YXIgY3VyUGFnZTtcclxudmFyIG1lbnVzID0gW107XHJcbnZhciBQQUdFID0gT2JqZWN0LmZyZWV6ZSh7VElUTEU6IDAsIENSRUFURTogMSwgQk9BUkQ6IDJ9KTtcclxuXHJcbi8vZmlyZXMgd2hlbiB0aGUgd2luZG93IGxvYWRzXHJcbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbihlKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHNlY3Rpb25zXHJcblx0Ym9hcmRTZWN0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJib2FyZFwiKTtcclxuXHRcclxuXHQvLyBTZXR1cCB0aXRsZSBtZW51XHJcblx0bWVudXNbUEFHRS5USVRMRV0gPSBuZXcgVGl0bGVNZW51KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGl0bGVNZW51XCIpKTtcclxuXHRtZW51c1tQQUdFLlRJVExFXS5vbmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRcdHN3aXRjaCh0aGlzLm5leHQpe1xyXG5cdFx0Y2FzZSBUaXRsZU1lbnUuTkVYVC5CT0FSRDpcclxuXHRcdFx0Y3VyUGFnZSA9IFBBR0UuQk9BUkQ7XHJcblx0XHRcdGNyZWF0ZUNhc2UoKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlIFRpdGxlTWVudS5ORVhULkNSRUFURTpcclxuXHRcdFx0Y3VyUGFnZSA9IFBBR0UuQ1JFQVRFO1xyXG5cdFx0XHRtZW51c1tjdXJQYWdlXS5vcGVuKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHJcblx0Ly8gU2V0dXAgY3JlYXRlIG1lbnVcclxuXHRtZW51c1tQQUdFLkNSRUFURV0gPSBuZXcgQ3JlYXRlTWVudShkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNyZWF0ZU1lbnVcIikpO1xyXG5cdG1lbnVzW1BBR0UuQ1JFQVRFXS5vbmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRcdHN3aXRjaCh0aGlzLm5leHQpe1xyXG5cdFx0Y2FzZSBDcmVhdGVNZW51Lk5FWFQuQk9BUkQ6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLkJPQVJEO1xyXG5cdFx0XHRjcmVhdGVDYXNlKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSBDcmVhdGVNZW51Lk5FWFQuVElUTEU6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLlRJVExFO1xyXG5cdFx0XHRtZW51c1tjdXJQYWdlXS5vcGVuKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHQvLyBPcGVuIHRoZSB0aXRsZSBtZW51XHJcbiAgICBjdXJQYWdlID0gUEFHRS5USVRMRTtcclxuICAgIG1lbnVzW1BBR0UuVElUTEVdLm9wZW4oKTtcclxuICAgIFxyXG59XHJcblxyXG4vLyBjcmVhdGUgdGhlIGdhbWUgb2JqZWN0IGFuZCBzdGFydCB0aGUgbG9vcCB3aXRoIGEgZHRcclxuZnVuY3Rpb24gY3JlYXRlQ2FzZSgpe1xyXG5cdC8vIFNob3cgdGhlIHNlY3Rpb24gZm9yIHRoZSBnYW1lXHJcblx0Ym9hcmRTZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFxyXG4gICAgLy8gQ3JlYXRlIHRoZSBnYW1lXHJcbiAgICBnYW1lID0gbmV3IEdhbWUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJib2FyZFwiKSwgVXRpbGl0aWVzLmdldFNjYWxlKENvbnN0YW50cy5ib2FyZFNpemUsIG5ldyBQb2ludCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KSkpO1xyXG4gICAgXHJcbiAgICAvLyBTdGFydCB0aGUgZ2FtZSBsb29wXHJcbiAgICBnYW1lTG9vcChEYXRlLm5vdygpKTtcclxuICAgIFxyXG59XHJcblxyXG4vL2ZpcmVzIG9uY2UgcGVyIGZyYW1lIGZvciB0aGUgZ2FtZVxyXG5mdW5jdGlvbiBnYW1lTG9vcChwcmV2VGltZSl7XHJcbiAgICBcclxuICAgIC8vIHVwZGF0ZSBnYW1lXHJcbiAgICBnYW1lLnVwZGF0ZShEYXRlLm5vdygpIC0gcHJldlRpbWUpO1xyXG4gICAgXHJcblx0Ly8gbG9vcFxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShnYW1lTG9vcC5iaW5kKHRoaXMsIERhdGUubm93KCkpKTtcclxuICAgIFxyXG59XHJcblxyXG4vL2xpc3RlbnMgZm9yIGNoYW5nZXMgaW4gc2l6ZSBvZiB3aW5kb3cgYW5kIHNjYWxlcyB0aGUgZ2FtZSBhY2NvcmRpbmdseVxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbihlKXtcclxuXHRcclxuXHQvLyBTY2FsZSB0aGUgZ2FtZSB0byB0aGUgbmV3IHNpemVcclxuXHRpZihjdXJQYWdlPT1QQUdFLkJPQVJEKVxyXG5cdFx0Z2FtZS5zZXRTY2FsZShVdGlsaXRpZXMuZ2V0U2NhbGUoQ29uc3RhbnRzLmJvYXJkU2l6ZSwgbmV3IFBvaW50KHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpKSk7XHJcblx0XHJcbn0pO1xyXG5cclxuLy8gTGlzdGVuIGZvciB0b3VjaCBmb3IgZnVsbHNjcmVlbiB3aGlsZSBpbiBnYW1lIG9uIG1vYmlsZVxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcclxuXHRpZihjdXJQYWdlPT1QQUdFLkJPQVJEICYmIHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2MHB4KVwiKSlcclxuXHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG5cdFxyXG59LCBmYWxzZSk7XHJcblxyXG4vLyBTdG9wIHRoZSBkZWZhdWx0IGNvbnRleHQgbWVudSBmcm9tIHdvcmtpbmdcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCBmdW5jdGlvbihlKXtcclxuXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcbn0pOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcclxuXHJcbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcclxuZnVuY3Rpb24gQ2F0ZWdvcnkobmFtZSwgeG1sLCByZXNvdXJjZXMsIHdpbmRvd0Rpdil7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgbmFtZVxyXG5cdHRoaXMubmFtZSA9IG5hbWU7XHJcblx0XHJcblx0Ly8gTG9hZCBhbGwgdGhlIHF1ZXN0aW9uc1xyXG5cdHZhciBxdWVzdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG5cdHRoaXMucXVlc3Rpb25zID0gW107XHJcblx0Ly8gY3JlYXRlIHF1ZXN0aW9uc1xyXG5cdGZvciAodmFyIGk9MDsgaTxxdWVzdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBcclxuXHR7XHJcblx0XHQvLyBjcmVhdGUgYSBxdWVzdGlvbiBvYmplY3RcclxuXHRcdHRoaXMucXVlc3Rpb25zW2ldID0gbmV3IFF1ZXN0aW9uKHF1ZXN0aW9uRWxlbWVudHNbaV0sIHJlc291cmNlcywgd2luZG93RGl2LCBpKTtcclxuXHR9XHJcbiAgICBcclxufVxyXG5cclxudmFyIHAgPSBDYXRlZ29yeS5wcm90b3R5cGU7XHJcblxyXG5wLnhtbCA9IGZ1bmN0aW9uKHhtbERvYywgY2F0RGVzKXtcclxuXHR2YXIgeG1sID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoXCJjYXRlZ29yeVwiKTtcclxuXHR4bWwuc2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiLCBjYXREZXMpO1xyXG5cdHhtbC5zZXRBdHRyaWJ1dGUoXCJxdWVzdGlvbkNvdW50XCIsIHRoaXMucXVlc3Rpb25zLmxlbmd0aCk7XHJcblx0Zm9yICh2YXIgaT0wOyBpPHRoaXMucXVlc3Rpb25zLmxlbmd0aDsgaSsrKSBcclxuXHRcdHhtbC5hcHBlbmRDaGlsZCh0aGlzLnF1ZXN0aW9uc1tpXS54bWwpO1xyXG5cdHJldHVybiB4bWw7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2F0ZWdvcnk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi9oZWxwZXIvdXRpbGl0aWVzLmpzJyk7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9nYW1lL2NvbnN0YW50cy5qcycpO1xyXG52YXIgV2luZG93cyA9IHJlcXVpcmUoJy4uL2h0bWwvcXVlc3Rpb25XaW5kb3dzLmpzJyk7XHJcbnZhciBQb3B1cCA9IHJlcXVpcmUoJy4uL21lbnVzL3BvcHVwLmpzJyk7XHJcbnZhciBQb3B1cFdpbmRvd3MgPSByZXF1aXJlKCcuLi9odG1sL3BvcHVwV2luZG93cy5qcycpO1xyXG5cclxudmFyIFNPTFZFX1NUQVRFID0gT2JqZWN0LmZyZWV6ZSh7SElEREVOOiAwLCBVTlNPTFZFRDogMSwgU09MVkVEOiAyfSk7XHJcbnZhciBRVUVTVElPTl9UWVBFID0gT2JqZWN0LmZyZWV6ZSh7SlVTVElGSUNBVElPTjogMSwgTVVMVElQTEVfQ0hPSUNFOiAyLCBTSE9SVF9SRVNQT05TRTogMywgRklMRTogNCwgTUVTU0FHRTogNX0pO1xyXG5cclxuLyogUXVlc3Rpb24gcHJvcGVydGllczpcclxuY3VycmVudFN0YXRlOiBTT0xWRV9TVEFURVxyXG53aW5kb3dEaXY6IGVsZW1lbnRcclxuY29ycmVjdDogaW50XHJcbnBvc2l0aW9uUGVyY2VudFg6IGZsb2F0XHJcbnBvc2l0aW9uUGVyY2VudFk6IGZsb2F0XHJcbnJldmVhbFRocmVzaG9sZDogaW50XHJcbmltYWdlTGluazogc3RyaW5nXHJcbmZlZWRiYWNrczogc3RyaW5nW11cclxuY29ubmVjdGlvbkVsZW1lbnRzOiBlbGVtZW50W11cclxuY29ubmVjdGlvbnM6IGludFtdXHJcbnF1ZXN0aW9uVHlwZTogU09MVkVfU1RBVEVcclxuanVzdGlmaWNhdGlvbjogc3RyaW5nXHJcbndyb25nQW5zd2VyOiBzdHJpbmdcclxuY29ycmVjdEFuc3dlcjogc3RyaW5nXHJcbiovXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIFF1ZXN0aW9uKHhtbCwgcmVzb3VyY2VzLCB3aW5kb3dEaXYsIG51bSl7XHJcblx0XHJcblx0Ly8gU2V0IHRoZSBjdXJyZW50IHN0YXRlIHRvIGRlZmF1bHQgYXQgaGlkZGVuIGFuZCBzdG9yZSB0aGUgd2luZG93IGRpdlxyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSBTT0xWRV9TVEFURS5ISURERU47XHJcbiAgICB0aGlzLndpbmRvd0RpdiA9IHdpbmRvd0RpdjtcclxuICAgIHRoaXMubnVtID0gbnVtO1xyXG4gICAgdGhpcy54bWwgPSB4bWw7XHJcbiAgICB0aGlzLnJlc291cmNlcyA9IHJlc291cmNlcztcclxuICAgIFxyXG4gICAgdGhpcy5yZWZyZXNoKCk7XHJcbiAgICBcclxufVxyXG5cclxudmFyIHAgPSBRdWVzdGlvbi5wcm90b3R5cGU7XHJcblxyXG5wLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBHZXQgYW5kIHNhdmUgdGhlIGdpdmVuIGluZGV4LCBjb3JyZWN0IGFuc3dlciwgcG9zaXRpb24sIHJldmVhbCB0aHJlc2hvbGQsIGltYWdlIGxpbmssIGZlZWRiYWNrLCBhbmQgY29ubmVjdGlvbnNcclxuICAgIHRoaXMuY29ycmVjdCA9IHBhcnNlSW50KHRoaXMueG1sLmdldEF0dHJpYnV0ZShcImNvcnJlY3RBbnN3ZXJcIikpO1xyXG4gICAgdGhpcy5wb3NpdGlvblBlcmNlbnRYID0gTnVtYmVyKHRoaXMueG1sLmdldEF0dHJpYnV0ZShcInhQb3NpdGlvblBlcmNlbnRcIikpO1xyXG4gICAgdGhpcy5wb3NpdGlvblBlcmNlbnRZID0gTnVtYmVyKHRoaXMueG1sLmdldEF0dHJpYnV0ZShcInlQb3NpdGlvblBlcmNlbnRcIikpO1xyXG4gICAgdGhpcy5yZXZlYWxUaHJlc2hvbGQgPSBwYXJzZUludCh0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJyZXZlYWxUaHJlc2hvbGRcIikpO1xyXG4gICAgLy9jb25zb2xlLmxvZyh4bWwpO1xyXG4gICAgdGhpcy5pbWFnZUxpbmsgPSB0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJpbWFnZUxpbmtcIik7XHJcbiAgICB0aGlzLmZlZWRiYWNrcyA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZmVlZGJhY2tcIik7XHJcbiAgICB2YXIgc2NhbGUgPSB0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJzY2FsZVwiKTtcclxuICAgIGlmKHNjYWxlPT09XCJcIiB8fCAhc2NhbGUpXHJcbiAgICBcdHRoaXMuc2NhbGUgPSAxO1xyXG4gICAgZWxzZVxyXG4gICAgXHR0aGlzLnNjYWxlID0gTnVtYmVyKHNjYWxlKTtcclxuICAgIHRoaXMuc2F2ZSA9IGZhbHNlO1xyXG4gICAgdmFyIGNvbm5lY3Rpb25FbGVtZW50cyA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY29ubmVjdGlvbnNcIik7XHJcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0gW107XHJcbiAgICBmb3IodmFyIGk9MDtpPGNvbm5lY3Rpb25FbGVtZW50cy5sZW5ndGg7aSsrKVxyXG4gICAgXHR0aGlzLmNvbm5lY3Rpb25zW2ldID0gcGFyc2VJbnQoY29ubmVjdGlvbkVsZW1lbnRzW2ldLmlubmVySFRNTCk7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB0aGUgd2luZG93cyBmb3IgdGhpcyBxdWVzdGlvbiBiYXNlZCBvbiB0aGUgcXVlc3Rpb24gdHlwZVxyXG4gICAgdGhpcy5xdWVzdGlvblR5cGUgPSBwYXJzZUludCh0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJxdWVzdGlvblR5cGVcIikpO1xyXG4gICAgdGhpcy5jcmVhdGVXaW5kb3dzKCk7XHJcblx0dGhpcy5jcmVhdGVUeXBlV2luZG93KCk7XHJcbn1cclxuXHJcbnAuc2F2ZVhNTCA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy54bWwuc2V0QXR0cmlidXRlKFwieFBvc2l0aW9uUGVyY2VudFwiLCB0aGlzLnBvc2l0aW9uUGVyY2VudFgpO1xyXG5cdHRoaXMueG1sLnNldEF0dHJpYnV0ZShcInlQb3NpdGlvblBlcmNlbnRcIiwgdGhpcy5wb3NpdGlvblBlcmNlbnRZKTtcclxuXHR0aGlzLnhtbC5zZXRBdHRyaWJ1dGUoXCJyZXZlYWxUaHJlc2hvbGRcIiwgdGhpcy5yZXZlYWxUaHJlc2hvbGQpO1xyXG5cdHRoaXMueG1sLnNldEF0dHJpYnV0ZShcInNjYWxlXCIsIHRoaXMuc2NhbGUpO1xyXG5cdHRoaXMueG1sLnNldEF0dHJpYnV0ZShcImNvcnJlY3RBbnN3ZXJcIiwgdGhpcy5jb3JyZWN0KTtcclxuXHR0aGlzLnhtbC5zZXRBdHRyaWJ1dGUoXCJxdWVzdGlvblR5cGVcIiwgdGhpcy5xdWVzdGlvblR5cGUpO1xyXG5cdHZhciBjb25uZWN0aW9uRWxlbWVudCA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY29ubmVjdGlvbnNcIilbMF07XHJcblx0d2hpbGUoY29ubmVjdGlvbkVsZW1lbnQhPW51bGwpe1xyXG5cdFx0dGhpcy54bWwucmVtb3ZlQ2hpbGQoY29ubmVjdGlvbkVsZW1lbnQpO1xyXG5cdFx0Y29ubmVjdGlvbkVsZW1lbnQgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvbm5lY3Rpb25zXCIpWzBdO1xyXG5cdH1cclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuY29ubmVjdGlvbnMubGVuZ3RoO2krKyl7XHJcblx0XHR2YXIgY29ubmVjdGlvbiA9IHRoaXMueG1sLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvbm5lY3Rpb25zXCIpO1xyXG5cdFx0Y29ubmVjdGlvbi5pbm5lckhUTUwgPSB0aGlzLmNvbm5lY3Rpb25zW2ldO1xyXG5cdFx0dGhpcy54bWwuYXBwZW5kQ2hpbGQoY29ubmVjdGlvbik7XHJcblx0fVxyXG59XHJcblxyXG5wLmNyZWF0ZVdpbmRvd3MgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuanVzdGlmaWNhdGlvbiA9IHRoaXMucXVlc3Rpb25UeXBlPT0xIHx8IHRoaXMucXVlc3Rpb25UeXBlPT0zO1xyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlIT01KXtcclxuXHRcdHRoaXMuY3JlYXRlVGFza1dpbmRvdygpO1xyXG5cdFx0dGhpcy5jcmVhdGVSZXNvdXJjZVdpbmRvdyh0aGlzLnJlc291cmNlcyk7XHJcblx0XHRpZih0aGlzLnF1ZXN0aW9uVHlwZTw9MilcclxuXHRcdFx0dGhpcy5jcmVhdGVBbnN3ZXJXaW5kb3coKTtcclxuXHR9XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5jcmVhdGVNZXNzYWdlV2luZG93KCk7XHJcbn1cclxuXHJcbnAuZGlzcGxheVdpbmRvd3MgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIEFkZCB0aGUgd2luZG93cyB0byB0aGUgd2luZG93IGRpdlxyXG5cdHRoaXMud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG5cdHZhciB3aW5kb3dOb2RlID0gdGhpcy53aW5kb3dEaXY7XHJcblx0dmFyIGV4aXRCdXR0b24gPSBuZXcgSW1hZ2UoKTtcclxuXHRleGl0QnV0dG9uLnNyYyA9IFwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIjtcclxuXHRleGl0QnV0dG9uLmNsYXNzTmFtZSA9IFwiZXhpdC1idXR0b25cIjtcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdGV4aXRCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCkgeyBxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7IH07XHJcblx0XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU8PTIpe1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmFuc3dlcik7XHJcblx0XHR0aGlzLnR5cGVXaW5kb3cuY2xhc3NOYW1lID0gXCJ3aW5kb3cgbGVmdFwiO1xyXG5cdFx0dGhpcy50YXNrLmNsYXNzTmFtZSA9IFwid2luZG93IGxlZnRcIjtcclxuXHRcdHRoaXMucmVzb3VyY2UuY2xhc3NOYW1lID0gXCJ3aW5kb3cgbGVmdFwiO1xyXG5cdFx0ZXhpdEJ1dHRvbi5zdHlsZS5yaWdodCA9IFwiNXZ3XCI7XHJcblx0fVxyXG5cdFxyXG5cdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy50eXBlV2luZG93KTtcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTUpe1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm1lc3NhZ2UpO1xyXG5cdFx0ZXhpdEJ1dHRvbi5zdHlsZS5yaWdodCA9IFwiMjV2d1wiO1xyXG5cdFx0dGhpcy50eXBlV2luZG93LmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHRpZih0aGlzLnF1ZXN0aW9uVHlwZT4yKXtcclxuXHRcdFx0dGhpcy50eXBlV2luZG93LmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0XHRcdHRoaXMudGFzay5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdFx0XHR0aGlzLnJlc291cmNlLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0XHRcdGV4aXRCdXR0b24uc3R5bGUucmlnaHQgPSBcIjI1dndcIjtcclxuXHRcdH1cclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy50YXNrKTtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5yZXNvdXJjZSk7XHJcblx0fVxyXG5cdFxyXG5cdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQoZXhpdEJ1dHRvbik7XHJcblx0XHJcbn1cclxuXHJcbnAuY3JlYXRlVHlwZVdpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSB0YXNrIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLnF1ZXN0aW9uVHlwZVdpbmRvdztcclxuICAgIHRoaXMudHlwZVdpbmRvdyA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIFxyXG4gICAgdGhpcy50eXBlV2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpWzBdLnNyYyA9IHRoaXMuaW1hZ2VMaW5rO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0aGUgaW1hZ2UgYnV0dG9uXHJcbiAgICB2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG4gICAgdmFyIGJ1dHRvbiA9IHRoaXMudHlwZVdpbmRvdy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaW1hZ2VCdXR0b25cIilbMF07XHJcbiAgICB2YXIgaWNvbiA9IGJ1dHRvbi5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKVswXTtcclxuICAgIGJ1dHRvbi5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0XHJcbiAgICBcdHF1ZXN0aW9uLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0cXVlc3Rpb24ud2luZG93RGl2LmFwcGVuZENoaWxkKHF1ZXN0aW9uLmltYWdlc1dpbmRvdyk7XHJcbiAgICAgICAgdmFyIGJ1dHRvbnMgPSBxdWVzdGlvbi5pbWFnZXNXaW5kb3cuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIik7XHJcbiAgICAgICAgdmFyIGltYWdlcyA9IHF1ZXN0aW9uLmltYWdlc1dpbmRvdy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKTtcclxuICAgICAgICB2YXIgaW5wdXQgPSBxdWVzdGlvbi5pbWFnZXNXaW5kb3cuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKVswXTtcclxuICAgICAgICB2YXIgaW1hZ2VDb250ZW50ID0gcXVlc3Rpb24uaW1hZ2VzV2luZG93LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJpbWFnZUNvbnRlbnRcIilbMF07XHJcbiAgICAgICAgdmFyIGNsb3NlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBcdGJ1dHRvbnNbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7fTtcclxuICAgICAgICBcdGJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7fTtcclxuICAgICAgICBcdGZvcih2YXIgaSA9MDtpPGltYWdlcy5sZW5ndGg7aSsrKVxyXG4gICAgICAgIFx0XHRpbWFnZXNbaV0ub25jbGljayA9IGZ1bmN0aW9uKCl7fTtcclxuICAgICAgICBcdHF1ZXN0aW9uLmRpc3BsYXlXaW5kb3dzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJ1dHRvbnNbMF0ub25jbGljayA9IGNsb3NlO1xyXG4gICAgICAgIGJ1dHRvbnNbMV0ub25jbGljayA9IGlucHV0LmNsaWNrLmJpbmQoaW5wdXQpO1xyXG4gICAgICAgIGJ1dHRvbnNbMl0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgXHRQb3B1cC5wcm9tcHQocXVlc3Rpb24ud2luZG93RGl2LCBcIlNlbGVjdCBJbWFnZVwiLCBcIkltYWdlIFVSTDpcIiwgXCJcIiwgXCJMb2FkIEltYWdlXCIsIGZ1bmN0aW9uKG5ld0ltYWdlKXtcclxuICAgICAgICBcdFx0aWYobmV3SW1hZ2UpXHJcbiAgICAgICAgXHRcdFx0aW1hZ2VDb250ZW50LmlubmVySFRNTCArPSBQb3B1cFdpbmRvd3MuaW1hZ2UucmVwbGFjZSgvJWltYWdlJS9nLCBuZXdJbWFnZSk7XHJcbiAgICAgICAgXHRcdGNsb3NlKCk7XHJcbiAgICAgICAgXHRcdGJ1dHRvbi5jbGljaygpO1xyXG4gICAgICAgIFx0fSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8aW1hZ2VzLmxlbmd0aDtpKz0yKXtcclxuICAgICAgICAoZnVuY3Rpb24oaSl7XHJcbiAgICAgICAgXHRpbWFnZXNbaV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgXHRcdHF1ZXN0aW9uLmltYWdlTGluayA9IGltYWdlc1tpXS5zcmM7XHJcbiAgICBcdFx0XHRxdWVzdGlvbi54bWwuc2V0QXR0cmlidXRlKFwiaW1hZ2VMaW5rXCIsIGltYWdlc1tpXS5zcmMpO1xyXG4gICAgXHRcdFx0aWNvbi5zcmMgPSBpbWFnZXNbaV0uc3JjO1xyXG4gICAgICAgIFx0XHRjbG9zZSgpO1xyXG4gICAgICAgIFx0fVxyXG4gICAgICAgIFx0aW1hZ2VzW2krMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgXHRcdGlmKGNvbmZpcm0oXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcmVtb3ZlIHRoaXMgaW1hZ2UgZnJvbSB5b3VyIGRhdGEgYmFuaz8gVGhpcyBjYW4gbm90IGJlIHVuZG9uZSFcIikpe1xyXG4gICAgICAgIFx0XHRcdHZhciB0b1JlbW92ZSA9IHF1ZXN0aW9uLmltYWdlc1dpbmRvdy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaW1hZ2VcIilbaS8yXTtcclxuICAgICAgICBcdFx0XHR0b1JlbW92ZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRvUmVtb3ZlKTtcclxuICAgICAgICAgICAgXHRcdGNsb3NlKCk7XHJcbiAgICAgICAgICAgIFx0XHRidXR0b24uY2xpY2soKTtcclxuICAgICAgICBcdFx0fVxyXG4gICAgICAgIFx0fVxyXG4gICAgICAgIH0pKGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5wdXQub25jaGFuZ2UgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIFx0aWYoaW5wdXQuZmlsZXMubGVuZ3RoPjAgJiYgaW5wdXQuZmlsZXNbMF0udHlwZS5tYXRjaCgvXmltYWdlLiovKSl7XHJcblx0XHRcdFx0Zm9yKHZhciBpPTA7aTxidXR0b25zLmxlbmd0aDtpKyspXHJcblx0XHRcdFx0XHRidXR0b25zW2ldLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0XHR2YXIgaW1hZ2VEYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcblx0XHRcdFx0aW1hZ2VEYXRhLmFwcGVuZCgnaW1hZ2UnLCBpbnB1dC5maWxlc1swXSwgaW5wdXQuZmlsZXNbMF0ubmFtZSk7XHJcblx0XHRcdFx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0XHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0aWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG5cdFx0XHRcdFx0XHRmb3IodmFyIGk9MDtpPGJ1dHRvbnMubGVuZ3RoO2krKylcclxuXHRcdFx0XHRcdFx0XHRidXR0b25zW2ldLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdGltYWdlQ29udGVudC5pbm5lckhUTUwgKz0gUG9wdXBXaW5kb3dzLmltYWdlLnJlcGxhY2UoLyVpbWFnZSUvZywgd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKDAsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cigwLCB3aW5kb3cubG9jYXRpb24uaHJlZi5sZW5ndGgtMSkubGFzdEluZGV4T2YoXCIvXCIpKStcIi9pbWFnZS9cIityZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XHJcblx0XHQgICAgICAgIFx0XHRjbG9zZSgpO1xyXG5cdFx0ICAgICAgICBcdFx0YnV0dG9uLmNsaWNrKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZXF1ZXN0Lm9wZW4oXCJQT1NUXCIsIFwiLi4vaW1hZ2UucGhwXCIsIHRydWUpO1xyXG5cdFx0XHRcdHJlcXVlc3Quc2VuZChpbWFnZURhdGEpO1xyXG5cdFx0XHR9XHJcbiAgICAgICAgfVxyXG4gICAgXHRcclxuICAgIFx0XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRoZSBjb21ibyBib3hcclxuICAgIHZhciB0eXBlQ29tYm8gPSB0aGlzLnR5cGVXaW5kb3cuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzZWxlY3RcIilbMF07XHJcbiAgICB0eXBlQ29tYm8udmFsdWUgPSB0aGlzLnF1ZXN0aW9uVHlwZTtcclxuICAgIHR5cGVDb21iby5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHF1ZXN0aW9uLnF1ZXN0aW9uVHlwZSA9IE51bWJlcih0aGlzLnZhbHVlKTtcclxuICAgIFx0cXVlc3Rpb24uY3JlYXRlV2luZG93cygpO1xyXG5cdFx0cXVlc3Rpb24uZGlzcGxheVdpbmRvd3MoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU2V0dXAgdGhlIHNhdmUgYnV0dG9uXHJcbiAgICB0aGlzLnR5cGVXaW5kb3cuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0J1dHRvbnNcIilbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIilbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHF1ZXN0aW9uLnNhdmUgPSB0cnVlO1xyXG4gICAgXHRxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbnAuY3JlYXRlVGFza1dpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy5wcm9jZWVkRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvY2VlZENvbnRhaW5lclwiKTtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIHRhc2sgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MudGFza1dpbmRvdztcclxuICAgIHRoaXMudGFzayA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIHRoaXMudGFzay5pbm5lckhUTUwgPSB0aGlzLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIldGl0bGUlXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25OYW1lXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy50YXNrLmlubmVySFRNTCA9IHRoaXMudGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5zdHJ1Y3Rpb25zXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy50YXNrLmlubmVySFRNTCA9IHRoaXMudGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVxdWVzdGlvbiVcIiwgdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblRleHRcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRvIHVwZGF0ZSB4bWwgb24gY2hhbmdpbmdcclxuICAgIHZhciB0ZXh0Qm94ZXMgPSB0aGlzLnRhc2suZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInRleHQtYm94XCIpO1xyXG4gICAgZm9yKHZhciBpPTA7aTx0ZXh0Qm94ZXMubGVuZ3RoO2krKylcclxuICAgIFx0dGV4dEJveGVzW2ldLm9uYmx1ciA9IHRoaXMudXBkYXRlWE1MLmJpbmQodGhpcywgdGV4dEJveGVzKTtcclxufVxyXG5cclxucC51cGRhdGVYTUwgPSBmdW5jdGlvbih0ZXh0Qm94ZXMpe1xyXG5cdHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25OYW1lXCIpWzBdLmlubmVySFRNTCA9IHRleHRCb3hlc1swXS5pbm5lckhUTUw7XHJcblx0dGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnN0cnVjdGlvbnNcIilbMF0uaW5uZXJIVE1MID0gdGV4dEJveGVzWzFdLmlubmVySFRNTDtcclxuXHR0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uVGV4dFwiKVswXS5pbm5lckhUTUwgPSB0ZXh0Qm94ZXNbMl0uaW5uZXJIVE1MO1xyXG59XHJcblxyXG5wLmNyZWF0ZVJlc291cmNlV2luZG93ID0gZnVuY3Rpb24ocmVzb3VyY2VGaWxlcyl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSByZXNvdXJjZSB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5yZXNvdXJjZVdpbmRvdztcclxuICAgIHRoaXMucmVzb3VyY2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB0aGUgYmFzaWMgcmVzb3VyY2VzIGZyb20gc2F2ZVxyXG5cdHRoaXMucmVzb3VyY2VEaXYgPSB0aGlzLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyZXNvdXJjZUNvbnRlbnRcIilbMF07XHJcblx0dGhpcy51cGRhdGVSZXNvdXJjZXMocmVzb3VyY2VGaWxlcyk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRoZSBhZGQgYnV0dG9uXHJcbiAgICB2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG4gICAgdGhpcy5yZXNvdXJjZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0cmVzb3VyY2VGaWxlcy5vcGVuV2luZG93KHF1ZXN0aW9uLndpbmRvd0RpdiwgdHJ1ZSwgZnVuY3Rpb24oc2VsZWN0ZWRSZXNvdXJjZSl7XHJcbiAgICBcdFx0aWYoc2VsZWN0ZWRSZXNvdXJjZSE9bnVsbCl7XHJcbiAgICBcdFx0XHR2YXIgbmV3UmVzb3VyY2UgPSBxdWVzdGlvbi54bWwub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicmVzb3VyY2VJbmRleFwiKTtcclxuICAgIFx0XHRcdG5ld1Jlc291cmNlLmlubmVySFRNTCA9IHNlbGVjdGVkUmVzb3VyY2U7XHJcbiAgICBcdFx0XHRxdWVzdGlvbi54bWwuYXBwZW5kQ2hpbGQobmV3UmVzb3VyY2UpO1xyXG4gICAgXHRcdFx0cXVlc3Rpb24udXBkYXRlUmVzb3VyY2VzKHRoaXMpO1xyXG4gICAgXHRcdH1cclxuICAgIFx0XHRxdWVzdGlvbi5kaXNwbGF5V2luZG93cygpO1xyXG4gICAgXHR9KTtcclxuICAgIH1cclxufVxyXG5cclxucC51cGRhdGVSZXNvdXJjZXMgPSBmdW5jdGlvbihyZXNvdXJjZUZpbGVzKXtcclxuXHRcclxuXHR2YXIgcmVzb3VyY2VzID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJyZXNvdXJjZUluZGV4XCIpO1xyXG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcblx0XHJcblx0aWYocmVzb3VyY2VzLmxlbmd0aD09MCl7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNvbG9yID0gXCJncmV5XCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNsYXNzTmFtZSA9IFwicmVzb3VyY2VDb250ZW50IGNlbnRlclwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5pbm5lckhUTUwgPSBcIk5vIHJlc291cmNlcyBoYXZlIGJlZW4gYWRkZWQuXCI7XHJcblx0fWVsc2V7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNvbG9yID0gXCJcIjtcclxuXHRcdHRoaXMucmVzb3VyY2VEaXYuY2xhc3NOYW1lID0gXCJyZXNvdXJjZUNvbnRlbnRcIjtcclxuXHRcdHRoaXMucmVzb3VyY2VEaXYuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR2YXIgdXNlZCA9IFtdO1xyXG5cdFx0Zm9yKHZhciBpPTA7aTxyZXNvdXJjZXMubGVuZ3RoO2krKyl7XHJcblx0XHRcdCAgICBcdFxyXG5cdFx0XHQgICAgXHRpZih1c2VkLmluZGV4T2YocmVzb3VyY2VzW2ldLmlubmVySFRNTCk9PS0xKVxyXG5cdFx0XHQgICAgXHRcdHVzZWQucHVzaChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKTtcclxuXHRcdFx0ICAgIFx0ZWxzZXtcclxuXHRcdFx0ICAgIFx0XHR0aGlzLnhtbC5yZW1vdmVDaGlsZChyZXNvdXJjZXNbaV0pO1xyXG5cdFx0XHQgICAgXHRcdGkgPSAwO1xyXG5cdFx0XHQgICAgXHRcdHJlc291cmNlcyA9IHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VJbmRleFwiKTtcclxuXHRcdFx0ICAgIFx0fVxyXG5cdFx0fVxyXG5cdCAgICBmb3IodmFyIGk9MDtpPHJlc291cmNlcy5sZW5ndGg7aSsrKXtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIGN1cnJlbnQgcmVzb3VyY2UgZWxlbWVudFxyXG4gICAgXHRcdHZhciBjdXJSZXNvdXJjZSA9IFdpbmRvd3MucmVzb3VyY2UucmVwbGFjZShcIiVpY29uJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS5pY29uKTtcclxuXHQgICAgXHRjdXJSZXNvdXJjZSA9IGN1clJlc291cmNlLnJlcGxhY2UoXCIldGl0bGUlXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLnRpdGxlKTtcclxuXHQgICAgXHRjdXJSZXNvdXJjZSA9IGN1clJlc291cmNlLnJlcGxhY2UoXCIlbGluayVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0ubGluayk7XHJcblx0ICAgIFx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdCAgICBcdHRlbXBEaXYuaW5uZXJIVE1MID0gY3VyUmVzb3VyY2U7XHJcblx0ICAgICAgICBjdXJSZXNvdXJjZSA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuXHQgICAgXHR0aGlzLnJlc291cmNlRGl2LmFwcGVuZENoaWxkKGN1clJlc291cmNlKTtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBTZXR1cCBkZWxldGUgYnV0dG9uXHJcblx0ICAgIFx0KGZ1bmN0aW9uKHJlc291cmNlWG1sKXtcclxuXHQgICAgXHRcdGN1clJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJkZWxldGVcIilbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0ICAgIFx0XHRcdHF1ZXN0aW9uLnhtbC5yZW1vdmVDaGlsZChyZXNvdXJjZVhtbCk7XHJcblx0ICAgIFx0XHRcdHF1ZXN0aW9uLnVwZGF0ZVJlc291cmNlcyhyZXNvdXJjZUZpbGVzKTtcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9KShyZXNvdXJjZXNbaV0pO1xyXG5cdCAgICB9XHJcblx0fVxyXG59XHJcblxyXG5wLmNyZWF0ZUFuc3dlcldpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBhbnN3ZXIgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MuYW5zd2VyV2luZG93O1xyXG4gICAgdGhpcy5hbnN3ZXIgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIHRoZSBjb21ib3ggZm9yIG51bWJlciBvZiBhbnN3ZXJzXHJcbiAgICB2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG4gICAgdGhpcy5hbnN3ZXJGb3JtID0gdGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xyXG4gICAgdmFyIHNlbGVjdCA9IHRoaXMuYW5zd2VyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2VsZWN0XCIpWzBdO1xyXG4gICAgc2VsZWN0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcclxuICAgIFx0cXVlc3Rpb24uc2V0TnVtYmVyQW5zd2VycyhOdW1iZXIodGhpcy52YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZXROdW1iZXJBbnN3ZXJzKE51bWJlcih0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJudW1BbnN3ZXJzXCIpKSk7XHJcbiAgICBzZWxlY3QudmFsdWUgPSB0aGlzLnhtbC5nZXRBdHRyaWJ1dGUoXCJudW1BbnN3ZXJzXCIpO1xyXG5cdHRoaXMuYW5zd2VyRm9ybS5lbGVtZW50c1tcImFuc3dlclwiXS52YWx1ZSA9IHRoaXMuY29ycmVjdCsxO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRoZSBmcm9tIHRvIHVwZGF0ZSB0aGUgeG1sXHJcblx0dGhpcy5hbnN3ZXJGb3JtLm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcclxuXHJcblx0ICAgIC8vIFNldHVwIHRoZSByYWRpbyBidXR0b25zIGZvciB0aGUgZm9ybSBpZiBqdXN0aWZpY2F0aW9uXHJcblx0XHRpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uICYmIE51bWJlcih0aGlzLmVsZW1lbnRzW1wiYW5zd2VyXCJdLnZhbHVlKS0xIT1xdWVzdGlvbi5jb3JyZWN0KXtcclxuXHRcdFx0Zm9yKHZhciBpPTA7aTx0aGlzLmVsZW1lbnRzLmxlbmd0aDtpKyspXHJcblx0XHRcdFx0dGhpcy5lbGVtZW50c1tpXS5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLmVsZW1lbnRzW1wiZmVlZGJhY2tcIit0aGlzLmVsZW1lbnRzW1wiYW5zd2VyXCJdLnZhbHVlXS5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdHF1ZXN0aW9uLmNvcnJlY3QgPSBOdW1iZXIodGhpcy5lbGVtZW50c1tcImFuc3dlclwiXS52YWx1ZSktMTtcclxuXHRcdHZhciBhbnN3ZXJzID0gcXVlc3Rpb24ueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYW5zd2VyXCIpO1xyXG5cdFx0dmFyIGZlZWRiYWNrID0gcXVlc3Rpb24ueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZmVlZGJhY2tcIik7XHJcblx0XHRmb3IodmFyIGk9MDtpPGFuc3dlcnMubGVuZ3RoO2krKyl7XHJcblx0XHRcdGFuc3dlcnNbaV0uaW5uZXJIVE1MID0gdGhpcy5lbGVtZW50c1tcImFuc3dlclwiKyhpKzEpXS52YWx1ZTtcclxuXHRcdFx0ZmVlZGJhY2tbaV0uaW5uZXJIVE1MID0gdGhpcy5lbGVtZW50c1tcImZlZWRiYWNrXCIrKGkrMSldLnZhbHVlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR0aGlzLmNvcnJlY3QgPSAtMTtcclxuXHR0aGlzLmFuc3dlckZvcm0ub25jaGFuZ2UoKTtcclxuXHRcclxuICAgIFxyXG59XHJcblxyXG5wLnNldE51bWJlckFuc3dlcnMgPSBmdW5jdGlvbihudW0pe1xyXG5cclxuICAgIHZhciBhbnN3ZXJzWG1sID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhbnN3ZXJcIik7XHJcbiAgICB2YXIgZmVlZGJhY2tYbWwgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZlZWRiYWNrXCIpO1xyXG5cdHZhciBhbnN3ZXJzID0gdGhpcy5hbnN3ZXJGb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZGl2XCIpO1xyXG5cdGZvcih2YXIgaT0wO2k8YW5zd2Vycy5sZW5ndGg7aSsrKXtcclxuXHRcdHZhciBpbnB1dHMgPSBhbnN3ZXJzW2ldLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIik7XHJcblx0XHRhbnN3ZXJzWG1sW2ldLmlubmVySFRNTCA9IGlucHV0c1swXS52YWx1ZTtcclxuXHRcdGZlZWRiYWNrWG1sW2ldLmlubmVySFRNTCA9IGlucHV0c1sxXS52YWx1ZTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy54bWwuc2V0QXR0cmlidXRlKFwibnVtQW5zd2Vyc1wiLCBudW0pO1xyXG5cdFxyXG5cdGlmKGFuc3dlcnNYbWwubGVuZ3RoPG51bSl7XHJcblx0XHRmb3IodmFyIGk9YW5zd2Vyc1htbC5sZW5ndGg7aTxudW07aSsrKXtcclxuXHRcdFx0dGhpcy54bWwuYXBwZW5kQ2hpbGQodGhpcy54bWwub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYW5zd2VyXCIpKTtcclxuXHRcdFx0dGhpcy54bWwuYXBwZW5kQ2hpbGQodGhpcy54bWwub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZmVlZGJhY2tcIikpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRlbHNlIGlmKGFuc3dlcnNYbWwubGVuZ3RoPm51bSl7XHJcblx0XHR3aGlsZShhbnN3ZXJzWG1sLmxlbmd0aD5udW0pe1xyXG5cdFx0XHR0aGlzLnhtbC5yZW1vdmVDaGlsZChhbnN3ZXJzWG1sW2Fuc3dlcnNYbWwubGVuZ3RoLTFdKTtcclxuXHRcdFx0dGhpcy54bWwucmVtb3ZlQ2hpbGQoZmVlZGJhY2tYbWxbZmVlZGJhY2tYbWwubGVuZ3RoLTFdKTtcclxuXHRcdCAgICB2YXIgZmVlZGJhY2tYbWwgPSB0aGlzLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZlZWRiYWNrXCIpO1xyXG5cdFx0XHRhbnN3ZXJzWG1sID0gdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhbnN3ZXJcIik7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR0aGlzLmFuc3dlckZvcm0uaW5uZXJIVE1MID0gJyc7XHJcblx0Zm9yKHZhciBpPTA7aTxhbnN3ZXJzWG1sLmxlbmd0aDtpKyspXHJcblx0XHR0aGlzLmFuc3dlckZvcm0uaW5uZXJIVE1MICs9IFdpbmRvd3MuYW5zd2VyLnJlcGxhY2UoLyVudW0lL2csIGkrMSkucmVwbGFjZSgvJWFuc3dlciUvZywgYW5zd2Vyc1htbFtpXS5pbm5lckhUTUwpLnJlcGxhY2UoLyVmZWVkYmFjayUvZywgZmVlZGJhY2tYbWxbaV0uaW5uZXJIVE1MKTtcclxuXHRpZih0aGlzLmNvcnJlY3Q8YW5zd2Vyc1htbC5sZW5ndGgpXHJcblx0XHR0aGlzLmFuc3dlckZvcm0uZWxlbWVudHNbXCJhbnN3ZXJcIl0udmFsdWUgPSB0aGlzLmNvcnJlY3QrMTtcclxuXHRlbHNle1xyXG5cdFx0dGhpcy5hbnN3ZXJGb3JtLmVsZW1lbnRzW1wiYW5zd2VyXCJdLnZhbHVlID0gMTtcclxuXHRcdHRoaXMuY29ycmVjdD0wO1xyXG5cdH1cclxufVxyXG5cclxucC5jcmVhdGVGaWxlV2luZG93ID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGZpbGUgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MuZmlsZVdpbmRvdztcclxuICAgIHRoaXMuYW5zd2VyID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgdGhpcy5maWxlSW5wdXQgPSB0aGlzLmFuc3dlci5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpWzBdO1xyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHRoaXMuZmlsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgXHRxdWVzdGlvbi5uZXdGaWxlcyA9IHRydWU7XHJcbiAgICBcdHF1ZXN0aW9uLmZpbGVzID0gW107XHJcbiAgICBcdGZvcih2YXIgaT0wO2k8ZXZlbnQudGFyZ2V0LmZpbGVzLmxlbmd0aDtpKyspXHJcbiAgICBcdFx0cXVlc3Rpb24uZmlsZXNbaV0gPSBldmVudC50YXJnZXQuZmlsZXNbaV0ubmFtZTtcclxuXHQgICAgcXVlc3Rpb24uY29ycmVjdEFuc3dlcigpO1xyXG4gICAgfSk7XHJcbiAgICBcclxufVxyXG5cclxucC5jcmVhdGVNZXNzYWdlV2luZG93ID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIG1lc3NhZ2Ugd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MubWVzc2FnZVdpbmRvdztcclxuICAgIHRoaXMubWVzc2FnZSA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIHRoaXMubWVzc2FnZS5pbm5lckhUTUwgPSB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIldGl0bGUlXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25OYW1lXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy5tZXNzYWdlLmlubmVySFRNTCA9IHRoaXMubWVzc2FnZS5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHRoaXMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5zdHJ1Y3Rpb25zXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy5tZXNzYWdlLmlubmVySFRNTCA9IHRoaXMubWVzc2FnZS5pbm5lckhUTUwucmVwbGFjZShcIiVxdWVzdGlvbiVcIiwgdGhpcy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblRleHRcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblxyXG4gICAgLy8gU2V0dXAgdG8gdXBkYXRlIHhtbCBvbiBjaGFuZ2luZ1xyXG4gICAgdmFyIHRleHRCb3hlcyA9IHRoaXMubWVzc2FnZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwidGV4dC1ib3hcIik7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRleHRCb3hlcy5sZW5ndGg7aSsrKVxyXG4gICAgXHR0ZXh0Qm94ZXNbaV0ub25ibHVyID0gdGhpcy51cGRhdGVYTUwuYmluZCh0aGlzLCB0ZXh0Qm94ZXMpO1xyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbjtcclxubW9kdWxlLmV4cG9ydHMuU09MVkVfU1RBVEUgPSBTT0xWRV9TVEFURTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFdpbmRvd3MgPSByZXF1aXJlKCcuLi9odG1sL3BvcHVwV2luZG93cy5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG5cclxuXHJcbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcclxuZnVuY3Rpb24gUmVzb3VyY2UoeG1sKXtcclxuXHRcclxuXHQvLyBGaXJzdCBnZXQgdGhlIGljb25cclxuXHR0aGlzLnhtbCA9IHhtbDtcclxuXHR2YXIgdHlwZSA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKTtcclxuXHR0aGlzLnR5cGUgPSB0eXBlO1xyXG5cdHN3aXRjaCh0eXBlKXtcclxuXHQgIGNhc2UgMDpcclxuXHQgICAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VGaWxlLnBuZyc7XHJcblx0ICAgIGJyZWFrO1xyXG5cdCAgY2FzZSAxOlxyXG5cdCAgICB0aGlzLmljb24gPSAnLi4vaW1nL2ljb25SZXNvdXJjZUxpbmsucG5nJztcclxuXHQgICAgYnJlYWs7XHJcblx0ICBjYXNlIDI6XHJcbiAgICBcdHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlVmlkZW8ucG5nJztcclxuXHQgICAgYnJlYWs7XHJcblx0ICBkZWZhdWx0OlxyXG5cdCAgICB0aGlzLmljb24gPSAnJztcclxuXHQgICAgYnJlYWs7XHJcblx0fVxyXG5cclxuXHQvLyBOZXh0IGdldCB0aGUgdGl0bGVcclxuXHR0aGlzLnRpdGxlID0geG1sLmdldEF0dHJpYnV0ZShcInRleHRcIik7XHJcblxyXG5cdC8vIExhc3QgZ2V0IHRoZSBsaW5rXHJcblx0dGhpcy5saW5rID0geG1sLmdldEF0dHJpYnV0ZShcImxpbmtcIik7XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gUmVzb3VyY2VzKHJlc291cmNlRWxlbWVudHMsIGRvYyl7XHJcblx0Zm9yICh2YXIgaT0wOyBpPHJlc291cmNlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdC8vIExvYWQgZWFjaCByZXNvdXJjZVxyXG5cdFx0dGhpc1tpXSA9IG5ldyBSZXNvdXJjZShyZXNvdXJjZUVsZW1lbnRzW2ldKTtcclxuXHR9XHJcblx0dGhpcy5sZW5ndGggPSByZXNvdXJjZUVsZW1lbnRzLmxlbmd0aDtcclxuXHR0aGlzLmRvYyA9IGRvYztcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIHJlc291cmNlIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLnJlc291cmNlc1dpbmRvdztcclxuICAgIHRoaXMucmVzb3VyY2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcblx0dGhpcy5yZXNvdXJjZURpdiA9IHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJlc291cmNlQ29udGVudFwiKVswXTtcclxuXHR0aGlzLnVwZGF0ZVJlc291cmNlcygpO1xyXG5cdFxyXG5cdC8vIFN0b3JlIHRoZSBidXR0b25zXHJcblx0dGhpcy5idXR0b25zID0gdGhpcy5yZXNvdXJjZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcclxuXHRcclxufVxyXG5cclxudmFyIHAgPSBSZXNvdXJjZXMucHJvdG90eXBlO1xyXG5cclxucC5vcGVuV2luZG93ID0gZnVuY3Rpb24od2luZG93RGl2LCBzZWxlY3QsIGNhbGxiYWNrKXtcclxuXHRcclxuXHQvLyBTZXR1cCB0aGUgYnV0dG9uc1xyXG5cdHZhciByZXNvdXJjZXMgPSB0aGlzO1xyXG4gICAgdGhpcy5idXR0b25zWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHR3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBcdHJlc291cmNlcy53aW5kb3dEaXYgPSBudWxsO1xyXG4gICAgXHRjYWxsYmFjaygpO1xyXG4gICAgfVxyXG5cdHRoaXMuYnV0dG9uc1sxXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHRcdHJlc291cmNlcy5lZGl0KG51bGwsIGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJlc291cmNlcy51cGRhdGVSZXNvdXJjZXMoKTtcclxuXHRcdFx0aWYocmVzb3VyY2VzLndpbmRvd0RpdilcclxuXHRcdFx0XHRyZXNvdXJjZXMub3BlbldpbmRvdyhyZXNvdXJjZXMud2luZG93RGl2LCByZXNvdXJjZXMuc2VsZWN0LCByZXNvdXJjZXMub25jbG9zZSk7XHJcblx0XHR9KTtcclxuXHR9XHJcbiAgICB0aGlzLm9uY2xvc2UgPSBjYWxsYmFjaztcclxuICAgIHRoaXMud2luZG93RGl2ID0gd2luZG93RGl2O1xyXG4gICAgdGhpcy5zZWxlY3QgPSBzZWxlY3Q7XHJcblx0XHJcblx0dmFyIGljb25zID0gdGhpcy5yZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaWNvblwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGljb25zLmxlbmd0aDtpKyspe1xyXG5cdFx0aWYodGhpcy5zZWxlY3QpXHJcblx0XHRcdGljb25zW2ldLmNsYXNzTmFtZSA9IFwiaWNvblNlbGVjdCBpY29uXCI7XHJcblx0XHRlbHNlXHJcblx0XHRcdGljb25zW2ldLmNsYXNzTmFtZSA9IFwiaWNvblwiO1xyXG5cdH1cclxuICAgIFxyXG5cdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuXHR3aW5kb3dEaXYuYXBwZW5kQ2hpbGQodGhpcy5yZXNvdXJjZSk7XHJcblx0XHJcbn1cclxuXHJcbnAudXBkYXRlUmVzb3VyY2VzID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHRpZih0aGlzLmxlbmd0aD09MCl7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNvbG9yID0gXCJncmV5XCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNsYXNzTmFtZSA9IFwicmVzb3VyY2VDb250ZW50IGNlbnRlclwiO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5pbm5lckhUTUwgPSBcIk5vIFJlc291cmNlcyBMb2FkZWRcIjtcclxuXHR9ZWxzZXtcclxuXHRcdHZhciByZXNvdXJjZXMgPSB0aGlzO1xyXG5cdFx0dGhpcy5yZXNvdXJjZURpdi5jb2xvciA9IFwiXCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmNsYXNzTmFtZSA9IFwicmVzb3VyY2VDb250ZW50XCI7XHJcblx0XHR0aGlzLnJlc291cmNlRGl2LmlubmVySFRNTCA9ICcnO1xyXG5cdCAgICBmb3IodmFyIGk9MDtpPHRoaXMubGVuZ3RoO2krKyl7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSBjdXJyZW50IHJlc291cmNlIGVsZW1lbnRcclxuICAgIFx0XHR2YXIgY3VyUmVzb3VyY2UgPSBXaW5kb3dzLnJlc291cmNlLnJlcGxhY2UoXCIlaWNvbiVcIiwgdGhpc1tpXS5pY29uKTtcclxuXHQgICAgXHRjdXJSZXNvdXJjZSA9IGN1clJlc291cmNlLnJlcGxhY2UoXCIldGl0bGUlXCIsIHRoaXNbaV0udGl0bGUpO1xyXG5cdCAgICBcdGN1clJlc291cmNlID0gY3VyUmVzb3VyY2UucmVwbGFjZShcIiVsaW5rJVwiLCB0aGlzW2ldLmxpbmspO1xyXG5cdCAgICBcdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHQgICAgXHR0ZW1wRGl2LmlubmVySFRNTCA9IGN1clJlc291cmNlO1xyXG5cdCAgICAgICAgY3VyUmVzb3VyY2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcblx0ICAgIFx0dGhpcy5yZXNvdXJjZURpdi5hcHBlbmRDaGlsZChjdXJSZXNvdXJjZSk7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gU2V0dXAgZGVsZXRlIGFuZCBlZGl0IGJ1dHRvbnNcclxuXHQgICAgXHQoZnVuY3Rpb24oaW5kZXgpe1xyXG5cdCAgICBcdFx0Y3VyUmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImRlbGV0ZVwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHQgICAgXHRcdFx0Zm9yKHZhciBpPWluZGV4O2k8cmVzb3VyY2VzLmxlbmd0aC0xO2krKylcclxuXHQgICAgXHRcdFx0XHRyZXNvdXJjZXNbaV0gPSByZXNvdXJjZXNbaSsxXTtcclxuXHQgICAgXHRcdFx0ZGVsZXRlIHJlc291cmNlc1stLXJlc291cmNlcy5sZW5ndGhdO1xyXG5cdCAgICBcdFx0XHRyZXNvdXJjZXMudXBkYXRlUmVzb3VyY2VzKCk7XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0XHRjdXJSZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiZWRpdFwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHQgICAgXHRcdFx0cmVzb3VyY2VzLmVkaXQoaW5kZXgsIGZ1bmN0aW9uKCl7XHJcblx0ICAgIFx0XHRcdFx0cmVzb3VyY2VzLnVwZGF0ZVJlc291cmNlcygpO1xyXG5cdCAgICBcdFx0XHRcdGlmKHJlc291cmNlcy53aW5kb3dEaXYpXHJcblx0ICAgIFx0XHRcdFx0XHRyZXNvdXJjZXMub3BlbldpbmRvdyhyZXNvdXJjZXMud2luZG93RGl2LCByZXNvdXJjZXMuc2VsZWN0LCByZXNvdXJjZXMub25jbG9zZSk7XHJcblx0ICAgIFx0XHRcdH0pO1xyXG5cdCAgICBcdFx0fVxyXG5cdCAgICBcdFx0XHJcblx0ICAgIFx0ICAgIC8vIElmIHNlbGVjdCBzZXR1cCB0aGUgcmVzb3VyY2VzIGFzIGJ1dHRvbnNcclxuXHQgICAgXHRcdGN1clJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJpY29uXCIpWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdFx0ICAgIFx0ICAgIGlmKHJlc291cmNlcy53aW5kb3dEaXYgJiYgcmVzb3VyY2VzLnNlbGVjdCl7XHJcblx0XHQgICAgXHQgICAgXHRyZXNvdXJjZXMud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG5cdFx0ICAgIFx0ICAgIFx0cmVzb3VyY2VzLndpbmRvd0RpdiA9IG51bGw7XHJcblx0XHQgICAgXHQgICAgXHRyZXNvdXJjZXMub25jbG9zZShpbmRleCk7XHJcblx0XHQgICAgXHQgICAgXHRcclxuXHRcdCAgICBcdCAgICB9XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0XHRcclxuXHQgICAgXHR9KShpKTtcclxuXHQgICAgfVxyXG5cdH1cclxuXHRcclxufVxyXG5cclxucC5lZGl0ID0gZnVuY3Rpb24oaW5kZXgsIGNhbGxiYWNrKXtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIHBvcHVwIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLnJlc291cmNlRWRpdG9yO1xyXG4gICAgdmFyIGVkaXRJbmZvID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgdmFyIGZvcm0gPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XHJcblxyXG5cdHZhciByZXNvdXJjZXMgPSB0aGlzO1xyXG4gICAgdmFyIHR5cGUgPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNlbGVjdFwiKVswXTtcclxuXHR2YXIgYnV0dG9ucyA9IGVkaXRJbmZvLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG4gICAgXHJcbiAgICBcclxuXHRpZihpbmRleD09bnVsbCl7XHJcblx0XHRlZGl0SW5mby5pbm5lckhUTUwgPSBlZGl0SW5mby5pbm5lckhUTUwucmVwbGFjZSgvJWVkaXQlL2csIFwiQ3JlYXRlXCIpLnJlcGxhY2UoLyVhcHBseSUvZywgXCJDcmVhdGUgUmVzb3VyY2VcIikucmVwbGFjZSgvJW5hbWUlL2csICcnKS5yZXBsYWNlKC8lbGluayUvZywgJycpO1xyXG5cdH1cclxuXHRlbHNle1xyXG5cdFx0ZWRpdEluZm8uaW5uZXJIVE1MID0gZWRpdEluZm8uaW5uZXJIVE1MLnJlcGxhY2UoLyVlZGl0JS9nLCBcIkVkaXRcIikucmVwbGFjZSgvJWFwcGx5JS9nLCBcIkFwcGx5IENoYW5nZXNcIikucmVwbGFjZSgvJW5hbWUlL2csIHRoaXNbaW5kZXhdLnRpdGxlKS5yZXBsYWNlKC8lbGluayUvZywgdGhpc1tpbmRleF0ubGluayk7XHJcblx0XHR0eXBlLnZhbHVlID0gdGhpc1tpbmRleF0udHlwZTtcclxuXHRcdHRoaXMubmV3TGluayA9IHRoaXNbaW5kZXhdLmxpbms7XHJcblx0fVxyXG5cdFxyXG5cdC8vIFNldHVwIGNvbWJvIGJveFxyXG5cdHRoaXMudXBkYXRlRWRpdEluZm8odHlwZSwgYnV0dG9ucywgZWRpdEluZm8uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZHJlc3NUYWdcIilbMF0sIGVkaXRJbmZvLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJhZGRyZXNzSW5mb1wiKVswXSwgZWRpdEluZm8uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZHJlc3NcIilbMF0sIGluZGV4KTtcclxuXHRlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNlbGVjdFwiKVswXS5vbmNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRyZXNvdXJjZXMudXBkYXRlRWRpdEluZm8ocmVzb3VyY2VzLndpbmRvd0Rpdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNlbGVjdFwiKVswXSwgcmVzb3VyY2VzLndpbmRvd0Rpdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKSwgcmVzb3VyY2VzLndpbmRvd0Rpdi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYWRkcmVzc1RhZ1wiKVswXSwgcmVzb3VyY2VzLndpbmRvd0Rpdi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYWRkcmVzc0luZm9cIilbMF0sIHJlc291cmNlcy53aW5kb3dEaXYuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImFkZHJlc3NcIilbMF0sIGluZGV4KTtcclxuXHR9O1xyXG5cdFxyXG5cdC8vIFNldHVwIGNhbmNlbCBidXR0b25cclxuXHRidXR0b25zWzJdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmVzb3VyY2VzLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0Y2FsbGJhY2soKTtcclxuXHR9XHJcblx0XHJcblx0Ly8gU2V0dXAgY29uZmlybSBidXR0b25cclxuXHRidXR0b25zWzNdLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdFx0aWYoaW5kZXg9PW51bGwpXHJcblx0XHRcdGluZGV4ID0gcmVzb3VyY2VzLmxlbmd0aCsrO1xyXG5cdFx0dmFyIG5ld1Jlc291cmNlID0gcmVzb3VyY2VzLmRvYy5jcmVhdGVFbGVtZW50KFwicmVzb3VyY2VcIik7XHJcblx0XHR2YXIgZm9ybSA9IGVkaXRJbmZvLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9ybVwiKVswXTtcclxuXHRcdG5ld1Jlc291cmNlLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgZm9ybS5lbGVtZW50c1tcInR5cGVcIl0udmFsdWUpO1xyXG5cdFx0bmV3UmVzb3VyY2Uuc2V0QXR0cmlidXRlKFwidGV4dFwiLCBmb3JtLmVsZW1lbnRzW1wibmFtZVwiXS52YWx1ZSk7XHJcblx0XHRpZihyZXNvdXJjZXMubmV3TGluaz09bnVsbCl7XHJcblx0XHRcdHZhciBuZXdMaW5rID0gZm9ybS5lbGVtZW50c1tcImxpbmtcIl0udmFsdWU7XHJcblx0XHRcdGlmKCFuZXdMaW5rLm1hdGNoKC9eaHR0cHM/OlxcL1xcLy4qLykpXHJcblx0XHRcdFx0bmV3TGluayA9IFwiaHR0cDovL1wiK25ld0xpbms7XHJcblx0XHRcdG5ld1Jlc291cmNlLnNldEF0dHJpYnV0ZShcImxpbmtcIiwgbmV3TGluayk7XHJcblx0XHR9XHJcblx0XHRlbHNlXHJcblx0XHRcdG5ld1Jlc291cmNlLnNldEF0dHJpYnV0ZShcImxpbmtcIiwgcmVzb3VyY2VzLm5ld0xpbmspO1xyXG5cdFx0cmVzb3VyY2VzW2luZGV4XSA9IG5ldyBSZXNvdXJjZShuZXdSZXNvdXJjZSk7XHJcblx0XHRyZXNvdXJjZXMud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgXHRjYWxsYmFjaygpO1xyXG5cdH1cclxuXHRcclxuXHJcblx0Ly8gRGlzcGxheSB0aGUgZWRpdCB3aW5kb3dcclxuXHR0aGlzLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuXHR0aGlzLndpbmRvd0Rpdi5hcHBlbmRDaGlsZChlZGl0SW5mbyk7XHJcbn1cclxuXHJcbnAudXBkYXRlRWRpdEluZm8gPSBmdW5jdGlvbih0eXBlLCBidXR0b25zLCBhZGRyZXNzVGFnLCBhZGRyZXNzSW5mbywgYWRkcmVzcywgaW5kZXgpe1xyXG5cclxuXHRpZighdGhpcy5uZXdMaW5rKVxyXG5cdFx0dGhpcy5uZXdMaW5rID0gXCJcIjtcclxuXHRcclxuXHRpZihOdW1iZXIodHlwZS52YWx1ZSk9PTApe1xyXG5cdFx0YWRkcmVzc1RhZy5pbm5lckhUTUwgPSBcIlJlZnJlbmNlIEZpbGVcIjtcclxuXHRcdGFkZHJlc3MudmFsdWUgPSBcIlwiO1xyXG5cdFx0YWRkcmVzcy50eXBlID0gXCJmaWxlXCI7XHJcblx0XHRhZGRyZXNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGFkZHJlc3NJbmZvLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cdFx0YWRkcmVzc0luZm8uaW5uZXJIVE1MID0gdGhpcy5uZXdMaW5rO1xyXG5cdFx0YnV0dG9uc1swXS5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHRcdGJ1dHRvbnNbMV0uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblx0XHR2YXIgcmVzb3VyY2VzID0gdGhpcztcclxuXHRcdFxyXG5cdFx0Ly8gU2V0dXAgVmlldyBidXR0b25cclxuXHRcdGJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdGNvbnNvbGUubG9nKHJlc291cmNlcy5uZXdMaW5rKTtcclxuXHRcdFx0aWYocmVzb3VyY2VzLm5ld0xpbmsgJiYgcmVzb3VyY2VzLm5ld0xpbmshPVwiXCIpXHJcblx0XHRcdFx0d2luZG93Lm9wZW4ocmVzb3VyY2VzLm5ld0xpbmssJ19ibGFuaycpO1xyXG5cdFx0fTtcclxuXHRcdFxyXG5cdFx0Ly8gU2V0dXAgaW5wdXQgYnV0dG9uXHJcblx0XHRidXR0b25zWzBdLm9uY2xpY2sgPSBhZGRyZXNzLmNsaWNrLmJpbmQoYWRkcmVzcyk7XHJcblx0XHRhZGRyZXNzLm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYoYWRkcmVzcy5maWxlcy5sZW5ndGg+MCl7XHJcblx0XHRcdFx0Zm9yKHZhciBpPTA7aTxidXR0b25zLmxlbmd0aDtpKyspXHJcblx0XHRcdFx0XHRidXR0b25zW2ldLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0XHR2YXIgcmVzb3VyY2VEYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcblx0XHRcdFx0cmVzb3VyY2VEYXRhLmFwcGVuZCgncmVzb3VyY2UnLCBhZGRyZXNzLmZpbGVzWzBdLCBhZGRyZXNzLmZpbGVzWzBdLm5hbWUpO1xyXG5cdFx0XHRcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdFx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHRcdFx0XHRcdFx0Zm9yKHZhciBpPTA7aTxidXR0b25zLmxlbmd0aDtpKyspXHJcblx0XHRcdFx0XHRcdFx0YnV0dG9uc1tpXS5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRpZihyZXF1ZXN0LnJlc3BvbnNlVGV4dC5tYXRjaCgvXmVycm9yLiovaSkpXHJcblx0XHRcdFx0XHRcdFx0YWRkcmVzc0luZm8uaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0XHRcdFx0XHRcdGVsc2V7XHJcblx0XHRcdFx0XHRcdFx0cmVzb3VyY2VzLm5ld0xpbmsgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zdWJzdHIoMCwgd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKDAsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmxlbmd0aC0xKS5sYXN0SW5kZXhPZihcIi9cIikpK1wiL3Jlc291cmNlL1wiK3JlcXVlc3QucmVzcG9uc2VUZXh0O1xyXG5cdFx0XHRcdFx0XHRcdGFkZHJlc3NJbmZvLmlubmVySFRNTCA9IHJlc291cmNlcy5uZXdMaW5rO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZXF1ZXN0Lm9wZW4oXCJQT1NUXCIsIFwiLi4vcmVzb3VyY2UucGhwXCIsIHRydWUpO1xyXG5cdFx0XHRcdHJlcXVlc3Quc2VuZChyZXNvdXJjZURhdGEpO1xyXG5cdFx0XHRcdGFkZHJlc3NJbmZvLmlubmVySFRNTCA9IFwiVXBsb2FkaW5nLi4uXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZXtcclxuXHRcdFx0XHRyZXNvdXJjZXMubmV3TGluayA9IFwiXCI7XHJcblx0XHRcdFx0YWRkcmVzc0luZm8uaW5uZXJIVE1MID0gcmVzb3VyY2VzLm5ld0xpbms7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZXtcclxuXHRcdGFkZHJlc3NUYWcuaW5uZXJIVE1MID0gXCJMaW5rIEFkZHJlc3NcIjtcclxuXHRcdGFkZHJlc3MudmFsdWUgPSBcIlwiO1xyXG5cdFx0YWRkcmVzcy50eXBlID0gXCJ0ZXh0XCI7XHJcblx0XHRhZGRyZXNzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cdFx0YWRkcmVzcy52YWx1ZSA9IHRoaXMubmV3TGluaztcclxuXHRcdHRoaXMubmV3TGluayA9IG51bGw7XHJcblx0XHRhZGRyZXNzLm9uY2hhbmdlID0gZnVuY3Rpb24oKXt9O1xyXG5cdFx0YWRkcmVzc0luZm8uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0YnV0dG9uc1swXS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRidXR0b25zWzFdLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGJ1dHRvbnNbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7fTtcclxuXHRcdGJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7fTtcclxuXHR9XHJcbn1cclxuXHJcbnAueG1sID0gZnVuY3Rpb24oeG1sRG9jKXtcclxuXHR2YXIgeG1sID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoXCJyZXNvdXJjZUxpc3RcIik7XHJcblx0eG1sLnNldEF0dHJpYnV0ZShcInJlc291cmNlQ291bnRcIiwgdGhpcy5sZW5ndGgpO1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5sZW5ndGg7aSsrKVxyXG5cdFx0eG1sLmFwcGVuZENoaWxkKHRoaXNbaV0ueG1sKTtcclxuXHRyZXR1cm4geG1sO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlc291cmNlczsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuLi9jYXNlL3F1ZXN0aW9uLmpzXCIpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZShcIi4vY29uc3RhbnRzLmpzXCIpO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoXCIuLi9oZWxwZXIvZHJhd2xpYi5qc1wiKTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIGJvYXJkKHNlY3Rpb24sIGJvYXJkQ29udGV4dCwgbm9kZUNvbnRleHQsIG1vdXNlU3RhdGUsIHN0YXJ0UG9zaXRpb24sIGxlc3Nvbk5vZGVzLCBzYXZlKXtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGNhbnZhcyBmb3IgdGhpcyBib2FyZCBhbmQgYWRkIGl0IHRvIHRoZSBzZWN0aW9uXHJcblx0dGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG5cdHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHR0aGlzLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcblx0dGhpcy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cdHRoaXMuc2F2ZSA9IHNhdmU7XHJcblx0bW91c2VTdGF0ZS5hZGRDYW52YXModGhpcy5jYW52YXMpO1xyXG5cdHNlY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xyXG5cdFxyXG5cdHZhciBib2FyZCA9IHRoaXM7XHJcblx0dGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgZnVuY3Rpb24oKXtcclxuXHRcdGlmKGJvYXJkLmxvYWRlZClcclxuXHRcdFx0Ym9hcmQubG9hZGVkKCk7XHJcblx0fSwgZmFsc2UpO1xyXG5cdFxyXG5cdHRoaXMuYm9hcmRDb250ZXh0ID0gYm9hcmRDb250ZXh0O1xyXG5cdHRoaXMubm9kZUNvbnRleHQgPSBub2RlQ29udGV4dDtcclxuICAgIHRoaXMubGVzc29uTm9kZUFycmF5ID0gbGVzc29uTm9kZXM7XHJcbiAgICB0aGlzLmJvYXJkT2Zmc2V0ID0gc3RhcnRQb3NpdGlvbjtcclxuICAgIHRoaXMucHJldkJvYXJkT2Zmc2V0ID0ge3g6MCx5OjB9O1xyXG4gICAgdGhpcy56b29tID0gQ29uc3RhbnRzLnN0YXJ0Wm9vbTtcclxuICAgIHRoaXMuc3RhZ2UgPSAwO1xyXG4gICAgdGhpcy5sYXN0U2F2ZVRpbWUgPSAwOyAvLyBhc3N1bWUgbm8gY29va2llXHJcbiAgICB0aGlzLmxhc3RRdWVzdGlvbiA9IG51bGw7XHJcbiAgICB0aGlzLmxhc3RRdWVzdGlvbk51bSA9IC0xO1xyXG4gICAgXHJcbiAgICAvL2lmIChkb2N1bWVudC5jb29raWUpIHRoaXMubG9hZENvb2tpZSgpOyBcclxuXHJcblx0Ly8gQ2hlY2sgaWYgYWxsIG5vZGVzIGFyZSBzb2x2ZWRcclxuXHR2YXIgZG9uZSA9IHRydWU7XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGggJiYgZG9uZTtpKyspXHJcblx0XHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5jdXJyZW50U3RhdGUhPVF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRClcclxuXHRcdFx0ZG9uZSA9IGZhbHNlO1xyXG5cdGlmKGRvbmUpXHJcblx0XHR0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuXHRlbHNlXHJcblx0XHR0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbn1cclxuXHJcbi8vcHJvdG90eXBlXHJcbnZhciBwID0gYm9hcmQucHJvdG90eXBlO1xyXG5cclxucC5hY3QgPSBmdW5jdGlvbihnYW1lU2NhbGUsIHBNb3VzZVN0YXRlLCBkdCkge1xyXG4gICAgXHJcbiAgICAvLyBDaGVjayBtb3VzZSBldmVudHMgaWYgZ2l2ZW4gYSBtb3VzZSBzdGF0ZVxyXG4gICAgaWYocE1vdXNlU3RhdGUpIHtcclxuXHQgICAgXHJcblx0XHRcclxuXHQgICAgaWYgKCFwTW91c2VTdGF0ZS5tb3VzZURvd24gJiYgdGhpcy50YXJnZXQpIHtcclxuXHRcdFx0dGhpcy50YXJnZXQuZHJhZ1Bvc2l0aW9uID0gdW5kZWZpbmVkOyAvLyBjbGVhciBkcmFnIGJlaGF2aW9yXHJcblx0XHRcdHRoaXMudGFyZ2V0LmRyYWdnaW5nID0gZmFsc2U7XHJcblx0XHRcdHRoaXMudGFyZ2V0ID0gbnVsbDtcclxuXHRcdH1cclxuXHQgICAgXHJcblx0ICAgIGlmKHBNb3VzZVN0YXRlLm1vdXNlRG93bil7XHJcblx0XHRcdHZhciBib3VuZHMgPSB0aGlzLmJvYXJkQ29udGV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0aWYoYm91bmRzLmxlZnQgPj0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi54IHx8IGJvdW5kcy5yaWdodCA8PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnggfHwgYm91bmRzLnRvcCA+PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnkgfHwgYm91bmRzLmJvdHRvbSA8PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnkpXHJcblx0XHRcdFx0dGhpcy5ib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFx0XHRib3VuZHMgPSB0aGlzLm5vZGVDb250ZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRpZihib3VuZHMubGVmdCA+PSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnggfHwgYm91bmRzLnJpZ2h0IDw9IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueCB8fCBib3VuZHMudG9wID49IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueSB8fCBib3VuZHMuYm90dG9tIDw9IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueSlcclxuXHRcdFx0XHR0aGlzLm5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHQgICAgfVxyXG5cdCAgICBcclxuXHRcdGZvciAodmFyIGk9dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoLTEsIG5vZGVDaG9zZW47IGk+PTAgJiYgdGhpcy50YXJnZXQ9PW51bGw7IGktLSkge1xyXG5cdFx0XHR2YXIgbE5vZGUgPSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXTtcclxuXHRcdFx0XHJcblx0XHRcdGxOb2RlLm1vdXNlT3ZlciA9IGZhbHNlO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIm5vZGUgdXBkYXRlXCIpO1xyXG5cdFx0XHQvLyBpZiBob3ZlcmluZywgc2hvdyBob3ZlciBnbG93XHJcblx0XHRcdC8qaWYgKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA+IGxOb2RlLnBvc2l0aW9uLngtbE5vZGUud2lkdGgvMiBcclxuXHRcdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IDwgbE5vZGUucG9zaXRpb24ueCtsTm9kZS53aWR0aC8yXHJcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA+IGxOb2RlLnBvc2l0aW9uLnktbE5vZGUuaGVpZ2h0LzJcclxuXHRcdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IDwgbE5vZGUucG9zaXRpb24ueStsTm9kZS5oZWlnaHQvMikgeyovXHJcblx0XHRcdGlmIChVdGlsaXRpZXMubW91c2VJbnRlcnNlY3QocE1vdXNlU3RhdGUsbE5vZGUsdGhpcy5ib2FyZE9mZnNldCkpIHtcclxuXHRcdFx0XHRsTm9kZS5tb3VzZU92ZXIgPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0ID0gbE5vZGU7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwTW91c2VTdGF0ZS5oYXNUYXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG4gICAgXHRpZih0aGlzLmFkZENvbil7XHJcblxyXG4gICAgXHRcdGlmKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCl7XHJcbiAgICBcdFx0XHR0aGlzLmFkZENvbiA9IGZhbHNlO1xyXG4gICAgXHRcdFx0aWYodGhpcy50YXJnZXQgJiYgdGhpcy50YXJnZXQhPXRoaXMuc3RhcnRDb24pe1xyXG4gICAgXHRcdFx0XHRpZighdGhpcy5zdWJDb25uZWN0aW9uKHRoaXMudGFyZ2V0LnF1ZXN0aW9uLCB0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uKSl7XHJcbiAgICBcdFx0XHRcdFx0dGhpcy50YXJnZXQucXVlc3Rpb24ucmV2ZWFsVGhyZXNob2xkKys7XHJcbiAgICAgICAgXHRcdFx0XHR0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLnB1c2godGhpcy50YXJnZXQucXVlc3Rpb24ubnVtKzEpO1xyXG4gICAgICAgIFx0XHRcdFx0dGhpcy5zYXZlKCk7XHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9XHJcbiAgICBcdFx0aWYodGhpcy50YXJnZXQ9PW51bGwpXHJcbiAgICBcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIFx0XHRcclxuICAgIFx0fVxyXG4gICAgXHRlbHNlIGlmKHRoaXMuaGlkZUNvbil7XHJcbiAgICBcdFx0aWYocE1vdXNlU3RhdGUubW91c2VDbGlja2VkKXtcclxuICAgIFx0XHRcdHRoaXMuaGlkZUNvbiA9IGZhbHNlO1xyXG4gICAgXHRcdFx0aWYodGhpcy50YXJnZXQgJiYgdGhpcy50YXJnZXQhPXRoaXMuc3RhcnRDb24pe1xyXG4gICAgXHRcdFx0XHR2YXIgY29udGFpbnMgPSAwO1xyXG4gICAgXHRcdFx0XHRmb3IodmFyIGk9MDtpPHRoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoICYmIGNvbnRhaW5zID09IDA7aSsrKVxyXG4gICAgXHRcdFx0XHRcdGlmKHRoaXMubGVzc29uTm9kZUFycmF5W01hdGguYWJzKHRoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnNbaV0pLTFdPT10aGlzLnRhcmdldClcclxuICAgIFx0XHRcdFx0XHRcdGNvbnRhaW5zID0gdGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9uc1tpXTtcclxuICAgIFx0XHRcdFx0aWYoY29udGFpbnMhPTApe1xyXG4gICAgXHRcdFx0XHRcdGNvbnNvbGUubG9nKGNvbnRhaW5zKTtcclxuICAgIFx0XHRcdFx0XHR0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLnNwbGljZSh0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmluZGV4T2YoY29udGFpbnMpLCAxKTtcclxuICAgICAgICBcdFx0XHRcdHRoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnMucHVzaCgtY29udGFpbnMpO1xyXG4gICAgXHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG4gICAgXHRcdFx0XHR9XHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0fVxyXG4gICAgXHRcdGlmKHRoaXMudGFyZ2V0PT1udWxsKVxyXG4gICAgXHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICBcdH1cclxuICAgIFx0ZWxzZSBpZih0aGlzLnJlbW92ZUNvbil7XHJcbiAgICBcdFx0aWYocE1vdXNlU3RhdGUubW91c2VDbGlja2VkKXtcclxuICAgIFx0XHRcdHRoaXMucmVtb3ZlQ29uID0gZmFsc2U7XHJcbiAgICBcdFx0XHRpZih0aGlzLnRhcmdldCAmJiB0aGlzLnRhcmdldCE9dGhpcy5zdGFydENvbiAmJiBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGNvbm5lY3Rpb24/IFRoaXMgYWN0aW9uIGNhbid0IGJlIHVuZG9uZSFcIikpe1xyXG4gICAgXHRcdFx0XHR2YXIgY29udGFpbnMgPSAtMTtcclxuICAgIFx0XHRcdFx0Zm9yKHZhciBpPTA7aTx0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aCAmJiBjb250YWlucyA9PSAtMTtpKyspXHJcbiAgICBcdFx0XHRcdFx0aWYodGhpcy5sZXNzb25Ob2RlQXJyYXlbdGhpcy5zdGFydENvbi5xdWVzdGlvbi5jb25uZWN0aW9uc1tpXS0xXT09dGhpcy50YXJnZXQpXHJcbiAgICBcdFx0XHRcdFx0XHRjb250YWlucyA9IHRoaXMuc3RhcnRDb24ucXVlc3Rpb24uY29ubmVjdGlvbnNbaV07XHJcbiAgICBcdFx0XHRcdGlmKGNvbnRhaW5zPj0wKXtcclxuICAgIFx0XHRcdFx0XHR0aGlzLnRhcmdldC5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQtLTtcclxuICAgIFx0XHRcdFx0XHR0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLnNwbGljZSh0aGlzLnN0YXJ0Q29uLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmluZGV4T2YoY29udGFpbnMpLCAxKTtcclxuICAgIFx0XHRcdFx0XHR0aGlzLnNhdmUoKTtcclxuICAgIFx0XHRcdFx0fVxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdH1cclxuICAgIFx0XHRpZih0aGlzLnRhcmdldD09bnVsbClcclxuICAgIFx0XHRcdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgXHR9XHJcbiAgICBcdGVsc2UgaWYodGhpcy50YXJnZXQpe1xyXG5cdFxyXG5cdFx0XHRpZighdGhpcy50YXJnZXQuZHJhZ2dpbmcpe1xyXG5cdFx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHRcdC8vIGRyYWdcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmRyYWdnaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmRyYWdQb3NpdGlvbiA9IG5ldyBQb2ludChcclxuXHRcdFx0XHRcdHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54IC0gdGhpcy50YXJnZXQucG9zaXRpb24ueCxcclxuXHRcdFx0XHRcdHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IC0gdGhpcy50YXJnZXQucG9zaXRpb24ueVxyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCkge1xyXG5cdFx0XHRcdFx0Ly8gaGFuZGxlIGNsaWNrIGNvZGVcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmNsaWNrKHBNb3VzZVN0YXRlKTtcclxuXHRcdFx0XHRcdHRoaXMubGFzdFF1ZXN0aW9uID0gdGhpcy50YXJnZXQucXVlc3Rpb247XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChwTW91c2VTdGF0ZS5sZWZ0TW91c2VDbGlja2VkKCkpIHtcclxuXHRcdFx0XHRcdC8vIGhhbmRsZSBsZWZ0IGNsaWNrIGNvZGVcclxuXHRcdFx0XHRcdHRoaXMubm9kZUNvbnRleHQuc3R5bGUudG9wID0gcE1vdXNlU3RhdGUubW91c2VQb3NpdGlvbi55K1wicHhcIjtcclxuXHRcdFx0XHRcdHRoaXMubm9kZUNvbnRleHQuc3R5bGUubGVmdCA9IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueCtcInB4XCI7XHJcblx0XHRcdFx0XHR0aGlzLm5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdFx0dGhpcy5ub2RlQ29udGV4dC52aXJ0dWFsUG9zaXRpb24gPSBwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb247XHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRleHROb2RlID0gdGhpcy50YXJnZXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2V7XHJcblx0XHRcdFx0dmFyIG5hdHVyYWxYID0gcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggLSB0aGlzLnRhcmdldC5kcmFnUG9zaXRpb24ueDtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5wb3NpdGlvbi54ID0gTWF0aC5tYXgoQ29uc3RhbnRzLmJvYXJkT3V0bGluZSxNYXRoLm1pbihuYXR1cmFsWCxDb25zdGFudHMuYm9hcmRTaXplLnggLSBDb25zdGFudHMuYm9hcmRPdXRsaW5lKSk7XHJcblx0XHRcdFx0dmFyIG5hdHVyYWxZID0gcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgLSB0aGlzLnRhcmdldC5kcmFnUG9zaXRpb24ueTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5wb3NpdGlvbi55ID0gTWF0aC5tYXgoQ29uc3RhbnRzLmJvYXJkT3V0bGluZSxNYXRoLm1pbihuYXR1cmFsWSxDb25zdGFudHMuYm9hcmRTaXplLnkgLSBDb25zdGFudHMuYm9hcmRPdXRsaW5lKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0ICB9XHJcblx0XHRcclxuXHRcdC8vIGRyYWcgdGhlIGJvYXJkIGFyb3VuZFxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnLXdlYmtpdC1ncmFiYmluZyc7XHJcblx0XHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJy1tb3otZ3JhYmJpbmcnO1xyXG5cdFx0XHRcdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcblx0XHRcdFx0aWYgKCF0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQpIHtcclxuXHRcdFx0XHRcdHRoaXMubW91c2VTdGFydERyYWdCb2FyZCA9IHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbjtcclxuXHRcdFx0XHRcdHRoaXMucHJldkJvYXJkT2Zmc2V0LnggPSB0aGlzLmJvYXJkT2Zmc2V0Lng7XHJcblx0XHRcdFx0XHR0aGlzLnByZXZCb2FyZE9mZnNldC55ID0gdGhpcy5ib2FyZE9mZnNldC55O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueCA9IHRoaXMucHJldkJvYXJkT2Zmc2V0LnggLSAocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueCk7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC54ID4gdGhpcy5tYXhCb2FyZFdpZHRoLzIpIHRoaXMuYm9hcmRPZmZzZXQueCA9IHRoaXMubWF4Qm9hcmRXaWR0aC8yO1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA8IC0xKnRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSAtMSp0aGlzLm1heEJvYXJkV2lkdGgvMjtcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueSA9IHRoaXMucHJldkJvYXJkT2Zmc2V0LnkgLSAocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueSk7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC55ID4gdGhpcy5tYXhCb2FyZEhlaWdodC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnkgPSB0aGlzLm1heEJvYXJkSGVpZ2h0LzI7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC55IDwgLTEqdGhpcy5tYXhCb2FyZEhlaWdodC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnkgPSAtMSp0aGlzLm1heEJvYXJkSGVpZ2h0LzI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMubW91c2VTdGFydERyYWdCb2FyZCA9IHVuZGVmaW5lZDtcclxuXHRcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnJztcclxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubGVmdE1vdXNlQ2xpY2tlZCgpKSB7XHJcblx0XHRcdFx0XHQvLyBoYW5kbGUgbGVmdCBjbGljayBjb2RlXHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkQ29udGV4dC5zdHlsZS50b3AgPSBwTW91c2VTdGF0ZS5tb3VzZVBvc2l0aW9uLnkrXCJweFwiO1xyXG5cdFx0XHRcdFx0dGhpcy5ib2FyZENvbnRleHQuc3R5bGUubGVmdCA9IHBNb3VzZVN0YXRlLm1vdXNlUG9zaXRpb24ueCtcInB4XCI7XHJcblx0XHRcdFx0XHR0aGlzLmJvYXJkQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRDb250ZXh0LnZpcnR1YWxQb3NpdGlvbiA9IHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbjtcclxuXHRcdFx0XHRcdHRoaXMubm9kZUNvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdCAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnAuc3ViQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHF1ZXN0aW9uLCBzZWFyY2hRdWVzKXtcclxuXHR2YXIgZm91bmQgPSBmYWxzZTtcclxuXHRmb3IodmFyIGk9MDtpPHF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aCAmJiAhZm91bmQ7aSsrKXtcclxuXHRcdHZhciBjdXIgPSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtxdWVzdGlvbi5jb25uZWN0aW9uc1tpXS0xXS5xdWVzdGlvbjtcclxuXHRcdGlmKGN1cj09c2VhcmNoUXVlcylcclxuXHRcdFx0Zm91bmQgPSB0cnVlO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRmb3VuZCA9IHRoaXMuc3ViQ29ubmVjdGlvbihjdXIsIHNlYXJjaFF1ZXMpO1xyXG5cdH1cclxuXHRyZXR1cm4gZm91bmQ7XHJcbn1cclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGdhbWVTY2FsZSwgcE1vdXNlU3RhdGUpe1xyXG4gICAgXHJcbiAgICAvLyBzYXZlIGNhbnZhcyBzdGF0ZSBiZWNhdXNlIHdlIGFyZSBhYm91dCB0byBhbHRlciBwcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7ICAgXHJcbiAgICBcclxuICAgIC8vIENsZWFyIGJlZm9yZSBkcmF3aW5nIG5ldyBzdHVmZlxyXG5cdERyYXdMaWIucmVjdCh0aGlzLmN0eCwgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCwgXCIjMTU3MThGXCIpO1xyXG5cclxuXHRcclxuXHQvLyBTY2FsZSB0aGUgZ2FtZVxyXG4gICAgdGhpcy5jdHguc2F2ZSgpO1xyXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKHRoaXMuY2FudmFzLndpZHRoLzIsIHRoaXMuY2FudmFzLmhlaWdodC8yKTtcclxuXHR0aGlzLmN0eC5zY2FsZShnYW1lU2NhbGUsIGdhbWVTY2FsZSk7XHJcblx0dGhpcy5jdHgudHJhbnNsYXRlKC10aGlzLmNhbnZhcy53aWR0aC8yLCAtdGhpcy5jYW52YXMuaGVpZ2h0LzIpO1xyXG5cclxuICAgIC8vIFRyYW5zbGF0ZSB0byBjZW50ZXIgb2Ygc2NyZWVuIGFuZCBzY2FsZSBmb3Igem9vbSB0aGVuIHRyYW5zbGF0ZSBiYWNrXHJcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5jYW52YXMud2lkdGgvMiwgdGhpcy5jYW52YXMuaGVpZ2h0LzIpO1xyXG4gICAgdGhpcy5jdHguc2NhbGUodGhpcy56b29tLCB0aGlzLnpvb20pO1xyXG4gICAgdGhpcy5jdHgudHJhbnNsYXRlKC10aGlzLmNhbnZhcy53aWR0aC8yLCAtdGhpcy5jYW52YXMuaGVpZ2h0LzIpO1xyXG4gICAgLy8gbW92ZSB0aGUgYm9hcmQgdG8gd2hlcmUgdGhlIHVzZXIgZHJhZ2dlZCBpdFxyXG4gICAgLy90cmFuc2xhdGUgdG8gdGhlIGNlbnRlciBvZiB0aGUgYm9hcmRcclxuICAgIC8vY29uc29sZS5sb2codGhpcyk7XHJcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5jYW52YXMud2lkdGgvMiAtIHRoaXMuYm9hcmRPZmZzZXQueCwgdGhpcy5jYW52YXMuaGVpZ2h0LzIgLSB0aGlzLmJvYXJkT2Zmc2V0LnkpO1xyXG4gICAgXHJcblx0XHJcbiAgICAvLyBEcmF3IHRoZSBiYWNrZ3JvdW5kIG9mIHRoZSBib2FyZFxyXG4gICAgRHJhd0xpYi5yZWN0KHRoaXMuY3R4LCAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngsIENvbnN0YW50cy5ib2FyZFNpemUueSwgXCIjRDNCMTg1XCIpO1xyXG4gICAgRHJhd0xpYi5zdHJva2VSZWN0KHRoaXMuY3R4LCAtQ29uc3RhbnRzLmJvYXJkT3V0bGluZS8yLCAtQ29uc3RhbnRzLmJvYXJkT3V0bGluZS8yLCBDb25zdGFudHMuYm9hcmRTaXplLngrQ29uc3RhbnRzLmJvYXJkT3V0bGluZS8yLCBDb25zdGFudHMuYm9hcmRTaXplLnkrQ29uc3RhbnRzLmJvYXJkT3V0bGluZS8yLCBDb25zdGFudHMuYm9hcmRPdXRsaW5lLCBcIiNDQjk5NjZcIik7XHJcbiAgICBcclxuXHJcblxyXG5cdC8vIGRyYXcgdGhlIG5vZGVzIGl0c2VsZlxyXG5cdGZvcih2YXIgaT0wOyBpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHRoaXMubGVzc29uTm9kZUFycmF5W2ldLmRyYXcodGhpcy5jdHgsIHRoaXMuY2FudmFzKTtcclxuICAgIFxyXG5cdC8vIGRyYXcgdGhlIGxpbmVzXHJcblx0Zm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHJcblx0XHQvLyBnZXQgdGhlIHBpbiBwb3NpdGlvblxyXG4gICAgICAgIHZhciBvUG9zID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uZ2V0Tm9kZVBvaW50KCk7XHJcbiAgICAgICAgXHJcblx0XHQvLyBzZXQgbGluZSBzdHlsZVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGRyYXcgbGluZXNcclxuICAgICAgICBmb3IgKHZhciBqPTA7IGo8dGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICBcdHZhciBjb25uZWN0aW9uID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbTWF0aC5hYnModGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal0pIC0gMV07XHJcbiAgICAgICAgXHRcclxuICAgICAgICBcdHZhciBjb2xvciA9IFwicmdiYSgyNTUsIDAsIDAsIFwiLCBcclxuICAgICAgICBcdFx0c2l6ZSA9IENvbnN0YW50cy5hcnJvd1NpemU7XHJcbiAgICAgICAgXHRcclxuICAgICAgICBcdGlmKCghdGhpcy5yZW1vdmVDb24gJiYgIXRoaXMuaGlkZUNvbiAmJiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXT09dGhpcy50YXJnZXQpIHx8IFxyXG4gICAgICAgIFx0XHRcdCgodGhpcy5yZW1vdmVDb24gfHwgdGhpcy5oaWRlQ29uKSAmJiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXT09dGhpcy5zdGFydENvbiAmJiBjb25uZWN0aW9uPT10aGlzLnRhcmdldCkpe1xyXG4gICAgICAgIFx0XHRzaXplICo9IDI7XHJcbiAgICAgICAgXHRcdGNvbG9yID0gIFwicmdiYSgwLCAwLCAyNTUsIFwiO1xyXG4gICAgICAgIFx0fVxyXG5cclxuICAgICAgICBcdGlmKHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2pdPDApXHJcbiAgICAgICAgXHRcdGNvbG9yICs9IFwiMC4yNSlcIjtcclxuICAgICAgICBcdGVsc2VcclxuICAgICAgICBcdFx0Y29sb3IgKz0gXCIxKVwiO1xyXG5cclxuICAgICAgICBcdC8vIC0xIGJlY2FzZSBub2RlIGNvbm5lY3Rpb24gaW5kZXggdmFsdWVzIGFyZSAxLWluZGV4ZWQgYnV0IGNvbm5lY3Rpb25zIGlzIDAtaW5kZXhlZFxyXG4gICAgICAgIFx0Ly8gZ28gdG8gdGhlIGluZGV4IGluIHRoZSBhcnJheSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBjb25uZWN0ZWQgbm9kZSBvbiB0aGlzIGJvYXJkIGFuZCBzYXZlIGl0cyBwb3NpdGlvblxyXG4gICAgICAgIFx0Ly8gY29ubmVjdGlvbiBpbmRleCBzYXZlZCBpbiB0aGUgbGVzc29uTm9kZSdzIHF1ZXN0aW9uXHJcbiAgICAgICAgXHR2YXIgY1BvcyA9IGNvbm5lY3Rpb24uZ2V0Tm9kZVBvaW50KCk7XHJcbiAgICAgICAgICAgIERyYXdMaWIuYXJyb3codGhpcy5jdHgsIG9Qb3MsIGNQb3MsIENvbnN0YW50cy5hcnJvd0hlYWRTaXplLCBzaXplLCBjb2xvcik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblx0aWYodGhpcy5hZGRDb24pXHJcbiAgICAgICAgRHJhd0xpYi5hcnJvdyh0aGlzLmN0eCwgdGhpcy5zdGFydENvbi5nZXROb2RlUG9pbnQoKSwgbmV3IFBvaW50KHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54K3RoaXMuYm9hcmRPZmZzZXQueCwgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkrdGhpcy5ib2FyZE9mZnNldC55KSwgQ29uc3RhbnRzLmFycm93SGVhZFNpemUsIENvbnN0YW50cy5hcnJvd1NpemUsIFwiZGFya1JlZFwiKTtcclxuXHRcclxuXHR0aGlzLmN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG4vLyBHZXRzIGEgZnJlZSBub2RlIGluIHRoaXMgYm9hcmQgKGkuZS4gbm90IHVuc29sdmVkKSByZXR1cm5zIG51bGwgaWYgbm9uZVxyXG5wLmdldEZyZWVOb2RlID0gZnVuY3Rpb24oKSB7XHJcblx0Zm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspXHJcblx0XHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5jdXJyZW50U3RhdGUgPT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuVU5TT0xWRUQpXHJcblx0XHRcdHJldHVybiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXTtcclxuXHRyZXR1cm4gbnVsbDtcclxufVxyXG5cclxuLy8gTW92ZXMgdGhpcyBib2FyZCB0b3dhcmRzIHRoZSBnaXZlbiBwb2ludFxyXG5wLm1vdmVUb3dhcmRzID0gZnVuY3Rpb24ocG9pbnQsIGR0LCBzcGVlZCl7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSB2ZWN0b3IgdG93YXJkcyB0aGUgZ2l2ZW4gcG9pbnRcclxuXHR2YXIgdG9Qb2ludCA9IG5ldyBQb2ludChwb2ludC54LXRoaXMuYm9hcmRPZmZzZXQueCwgcG9pbnQueS10aGlzLmJvYXJkT2Zmc2V0LnkpO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgZGlzdGFuY2Ugb2Ygc2FpZCB2ZWN0b3JcclxuXHR2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQodG9Qb2ludC54KnRvUG9pbnQueCt0b1BvaW50LnkqdG9Qb2ludC55KTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIG5ldyBvZmZzZXQgb2YgdGhlIGJvYXJkIGFmdGVyIG1vdmluZyB0b3dhcmRzIHRoZSBwb2ludFxyXG5cdHZhciBuZXdPZmZzZXQgPSBuZXcgUG9pbnQoIHRoaXMuYm9hcmRPZmZzZXQueCArIHRvUG9pbnQueC9kaXN0YW5jZSpkdCpzcGVlZCxcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueSArIHRvUG9pbnQueS9kaXN0YW5jZSpkdCpzcGVlZCk7XHJcblx0XHJcblx0Ly8gQ2hlY2sgaWYgcGFzc2VkIHBvaW50IG9uIHggYXhpcyBhbmQgaWYgc28gc2V0IHRvIHBvaW50J3MgeFxyXG5cdGlmKHRoaXMuYm9hcmRPZmZzZXQueCAhPXBvaW50LnggJiZcclxuXHRcdE1hdGguYWJzKHBvaW50LngtbmV3T2Zmc2V0LngpLyhwb2ludC54LW5ld09mZnNldC54KT09TWF0aC5hYnMocG9pbnQueC10aGlzLmJvYXJkT2Zmc2V0LngpLyhwb2ludC54LXRoaXMuYm9hcmRPZmZzZXQueCkpXHJcblx0XHR0aGlzLmJvYXJkT2Zmc2V0LnggPSBuZXdPZmZzZXQueDtcclxuXHRlbHNlXHJcblx0XHR0aGlzLmJvYXJkT2Zmc2V0LnggPSBwb2ludC54O1xyXG5cdFxyXG5cclxuXHQvLyBDaGVjayBpZiBwYXNzZWQgcG9pbnQgb24geSBheGlzIGFuZCBpZiBzbyBzZXQgdG8gcG9pbnQncyB5XHJcblx0aWYodGhpcy5ib2FyZE9mZnNldC55ICE9IHBvaW50LnkgJiZcclxuXHRcdE1hdGguYWJzKHBvaW50LnktbmV3T2Zmc2V0LnkpLyhwb2ludC55LW5ld09mZnNldC55KT09TWF0aC5hYnMocG9pbnQueS10aGlzLmJvYXJkT2Zmc2V0LnkpLyhwb2ludC55LXRoaXMuYm9hcmRPZmZzZXQueSkpXHJcblx0XHR0aGlzLmJvYXJkT2Zmc2V0LnkgPSBuZXdPZmZzZXQueTtcclxuXHRlbHNlXHJcblx0XHR0aGlzLmJvYXJkT2Zmc2V0LnkgPSBwb2ludC55O1xyXG59XHJcblxyXG5wLndpbmRvd0Nsb3NlZCA9IGZ1bmN0aW9uKCl7XHJcblx0dmFyIHhtbDtcclxuXHRpZih0aGlzLmxhc3RRdWVzdGlvbil7XHJcblx0XHR2YXIgcXVlc3Rpb24gPSB0aGlzLmxhc3RRdWVzdGlvbjtcclxuXHRcdHRoaXMubGFzdFF1ZXN0aW9uID0gbnVsbDtcclxuXHRcdGlmKHF1ZXN0aW9uLnNhdmUpe1xyXG5cdFx0XHRxdWVzdGlvbi5zYXZlID0gZmFsc2U7XHJcblx0XHRcdHhtbCA9IHF1ZXN0aW9uLnhtbDtcclxuXHRcdFx0Zm9yKHZhciBpPTA7aTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7aSsrKVxyXG5cdFx0XHRcdHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnVwZGF0ZUltYWdlKCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4ge3htbDp4bWwsIG51bTpxdWVzdGlvbi5udW19O1xyXG5cdH1cclxuXHRyZXR1cm4gbnVsbDtcclxufVxyXG5cclxucC5hZGRDb25uZWN0aW9uID0gZnVuY3Rpb24oc3RhcnQpe1xyXG5cdHRoaXMuYWRkQ29uID0gdHJ1ZTtcclxuXHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuXHR0aGlzLnN0YXJ0Q29uID0gc3RhcnQ7XHJcbn1cclxuXHJcbnAucmVtb3ZlQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHN0YXJ0KXtcclxuXHR0aGlzLnJlbW92ZUNvbiA9IHRydWU7XHJcblx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcblx0dGhpcy5zdGFydENvbiA9IHN0YXJ0O1xyXG59XHJcblxyXG5wLmhpZGVDb25uZWN0aW9uID0gZnVuY3Rpb24oc3RhcnQpe1xyXG5cdHRoaXMuaGlkZUNvbiA9IHRydWU7XHJcblx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcblx0dGhpcy5zdGFydENvbiA9IHN0YXJ0O1xyXG59XHJcblxyXG5wLnNob3cgPSBmdW5jdGlvbihkaXIpe1xyXG5cdGlmKGRpciE9bnVsbClcclxuXHRcdHRoaXMuY2FudmFzLnN0eWxlLmFuaW1hdGlvbiA9ICdjYW52YXNFbnRlcicgKyAoZGlyID8gJ0wnIDogJ1InKSArICcgMXMnO1xyXG5cdHRoaXMuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcclxufVxyXG5cclxucC5oaWRlID0gZnVuY3Rpb24oZGlyKXtcclxuXHRpZihkaXIhPW51bGwpe1xyXG5cdFx0dGhpcy5jYW52YXMuc3R5bGUuYW5pbWF0aW9uID0gJ2NhbnZhc0xlYXZlJyArIChkaXIgPyAnUicgOiAnTCcpICsgJyAxcyc7XHJcblx0XHR2YXIgYm9hcmQgPSB0aGlzO1xyXG5cdFx0dGhpcy5sb2FkZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHRib2FyZC5jYW52YXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZXtcclxuXHRcdGJvYXJkLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdH1cclxufVxyXG5cclxucC51cGRhdGVTaXplID0gZnVuY3Rpb24oKXtcclxuXHR0aGlzLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG5cdHRoaXMuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib2FyZDsgICAgXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9oZWxwZXIvcG9pbnQuanMnKTtcclxuXHJcbi8vTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gVGhlIHNpemUgb2YgdGhlIGJvYXJkIGluIGdhbWUgdW5pdHMgYXQgMTAwJSB6b29tXHJcbm0uYm9hcmRTaXplID0gbmV3IFBvaW50KDE5MjAsIDEwODApO1xyXG5tLmJvdW5kU2l6ZSA9IDM7XHJcblxyXG4vL1RoZSBzaXplIG9mIHRoZSBib2FyZCBvdXRsaW5lIGluIGdhbWUgdW5pdHMgYXQgMTAwJSB6b29tXHJcbm0uYm9hcmRPdXRsaW5lID0gbS5ib2FyZFNpemUueCA+IG0uYm9hcmRTaXplLnkgPyBtLmJvYXJkU2l6ZS54LzIwIDogbS5ib2FyZFNpemUueS8yMDtcclxuXHJcbi8vIFRoZSB6b29tIHZhbHVlcyBhdCBzdGFydCBhbmQgZW5kIG9mIGFuaW1hdGlvblxyXG5tLnN0YXJ0Wm9vbSA9IDAuNTtcclxubS5lbmRab29tID0gMS41O1xyXG5cclxuLy8gVGhlIHNwZWVkIG9mIHRoZSB6b29tIGFuaW1hdGlvblxyXG5tLnpvb21TcGVlZCA9IDAuMDAxO1xyXG5tLnpvb21Nb3ZlU3BlZWQgPSAwLjc1O1xyXG5cclxuLy8gVGhlIHNwZWVkIG9mIHRoZSBsaW5lIGFuaW1hdGlvblxyXG5tLmxpbmVTcGVlZCA9IDAuMDAyO1xyXG5cclxuLy8gVGhlIHRpbWUgYmV0d2VlbiB6b29tIGNoZWNrc1xyXG5tLnBpbmNoU3BlZWQgPSAuMDAyNTtcclxuXHJcbi8vIFVzZWQgZm9yIHJlc2l6aW5nIG5vZGVzXHJcbm0ubm9kZVN0ZXAgPSAwLjE7XHJcbm0ubWF4Tm9kZVNjYWxlID0gMjtcclxubS5taW5Ob2RlU2NhbGUgPSAwLjU7XHJcbm0ubm9kZUVkZ2VXaWR0aCA9IDI1O1xyXG5cclxuLy8gVXNlZCBmb3IgZHJhd2luZyBhcnJvd3NcclxubS5hcnJvd0hlYWRTaXplID0gNTA7XHJcbm0uYXJyb3dTaXplID0gNTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEJvYXJkID0gcmVxdWlyZSgnLi9ib2FyZC5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9oZWxwZXIvcG9pbnQuanMnKTtcclxudmFyIExlc3Nvbk5vZGUgPSByZXF1aXJlKCcuL2xlc3Nvbk5vZGUuanMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzLmpzJyk7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi4vaGVscGVyL2RyYXdsaWIuanMnKTtcclxudmFyIERhdGFQYXJzZXIgPSByZXF1aXJlKCcuLi9oZWxwZXIvaXBhckRhdGFQYXJzZXIuanMnKTtcclxudmFyIE1vdXNlU3RhdGUgPSByZXF1aXJlKCcuLi9oZWxwZXIvbW91c2VTdGF0ZS5qcycpO1xyXG52YXIgS2V5Ym9hcmRTdGF0ZSA9IHJlcXVpcmUoJy4uL2hlbHBlci9rZXlib2FyZFN0YXRlLmpzJyk7XHJcbnZhciBGaWxlTWFuYWdlciA9IHJlcXVpcmUoJy4uL2hlbHBlci9maWxlTWFuYWdlci5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKCcuLi9jYXNlL3F1ZXN0aW9uLmpzJyk7XHJcbnZhciBDYXRlZ29yeSA9IHJlcXVpcmUoJy4uL2Nhc2UvY2F0ZWdvcnkuanMnKTtcclxudmFyIFBvcHVwID0gcmVxdWlyZSgnLi4vbWVudXMvcG9wdXAuanMnKTtcclxudmFyIFBvcHVwV2luZG93cyA9IHJlcXVpcmUoJy4uL2h0bWwvcG9wdXBXaW5kb3dzLmpzJyk7XHJcblxyXG4vL21vdXNlICYga2V5Ym9hcmQgbWFuYWdlbWVudFxyXG52YXIgcHJldmlvdXNNb3VzZVN0YXRlO1xyXG52YXIgZHJhZ2dpbmdEaXNhYmxlZDtcclxudmFyIG1vdXNlVGFyZ2V0O1xyXG52YXIgbW91c2VTdXN0YWluZWREb3duO1xyXG5cclxuLy8gSFRNTCBlbGVtZW50c1xyXG52YXIgem9vbVNsaWRlcjtcclxudmFyIHdpbmRvd0RpdjtcclxudmFyIHdpbmRvd0ZpbG07XHJcblxyXG4vLyBVc2VkIGZvciBwaW5jaCB6b29tXHJcbnZhciBwaW5jaFN0YXJ0O1xyXG5cclxuLy8gVXNlZCBmb3Igd2FpdGluZyBhIHNlY29uZCB0byBjbG9zZSB3aW5kb3dzXHJcbnZhciBwYXVzZWRUaW1lID0gMDtcclxuXHJcbi8vcGhhc2UgaGFuZGxpbmdcclxudmFyIHBoYXNlT2JqZWN0O1xyXG5cclxuZnVuY3Rpb24gZ2FtZShzZWN0aW9uLCBiYXNlU2NhbGUpe1xyXG5cdHZhciBnYW1lID0gdGhpcztcclxuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdHRoaXMuc2VjdGlvbiA9IHNlY3Rpb247XHJcblx0dGhpcy5zYXZlRmlsZXMgPSBbXTtcclxuXHRcclxuXHQvLyBHZXQgYW5kIHNldHVwIHRoZSB3aW5kb3cgZWxlbWVudHNcclxuXHR3aW5kb3dEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93Jyk7XHJcblx0d2luZG93RmlsbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3aW5kb3dGbGltJyk7XHJcblx0XHJcblx0Ly8gR2V0IGFuZCBzZXR1cCB0aGUgem9vbSBzbGlkZXJcclxuXHR6b29tU2xpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICN6b29tLXNsaWRlcicpO1xyXG5cdHpvb21TbGlkZXIub25pbnB1dCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRnYW1lLnNldFpvb20oLXBhcnNlRmxvYXQoem9vbVNsaWRlci52YWx1ZSkpO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICN6b29tLWluJykub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHR6b29tU2xpZGVyLnN0ZXBEb3duKCk7XHJcblx0XHRnYW1lLnNldFpvb20oLXBhcnNlRmxvYXQoem9vbVNsaWRlci52YWx1ZSkpO1xyXG4gICAgfTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjem9vbS1vdXQnKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IFxyXG5cdFx0em9vbVNsaWRlci5zdGVwVXAoKTsgXHJcblx0XHRnYW1lLnNldFpvb20oLXBhcnNlRmxvYXQoem9vbVNsaWRlci52YWx1ZSkpO1xyXG5cdH07XHJcblx0XHJcblx0Ly8gR2V0IGFuZCBzZXR1cCB0aGUgYm9hcmQgY29udGV4dCBtZW51XHJcblx0dmFyIGJvYXJkQ29udGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCcpO1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjYWRkLXF1ZXN0aW9uJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0dmFyIGJvYXJkID0gZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0XHRnYW1lLmFkZFF1ZXN0aW9uKChib2FyZENvbnRleHQudmlydHVhbFBvc2l0aW9uLngrQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzIpL0NvbnN0YW50cy5ib2FyZFNpemUueCoxMDAsXHJcblx0XHRcdFx0KGJvYXJkQ29udGV4dC52aXJ0dWFsUG9zaXRpb24ueStDb25zdGFudHMuYm9hcmRTaXplLnkvMikvQ29uc3RhbnRzLmJvYXJkU2l6ZS55KjEwMCk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblxyXG5cclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2JvYXJkLWNvbnRleHQgI2FkZC1jYXRlZ29yeScpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdFBvcHVwLnByb21wdCh3aW5kb3dEaXYsIFwiQ3JlYXRlIENhdGVnb3J5XCIsIFwiQ2F0ZWdvcnkgTmFtZTpcIiwgXCJcIiwgXCJDcmVhdGVcIiwgZnVuY3Rpb24obmV3TmFtZSl7XHJcbiAgICBcdFx0aWYobmV3TmFtZSlcclxuICAgIFx0XHRcdGdhbWUuYWRkQ2F0ZWdvcnkobmV3TmFtZSk7XHJcbiAgICBcdH0pO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjcmVuYW1lLWNhdGVnb3J5Jykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0UG9wdXAucHJvbXB0KHdpbmRvd0RpdiwgXCJSZW5hbWUgQ2F0ZWdvcnlcIiwgXCJDYXRlZ29yeSBOYW1lOlwiLCBnYW1lLmNhdGVnb3JpZXNbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5uYW1lLCBcIlJlbmFtZVwiLCBmdW5jdGlvbihuZXdOYW1lKXtcclxuICAgIFx0XHRpZihuZXdOYW1lKXtcclxuICAgIFx0XHRcdGdhbWUuY2F0ZWdvcmllc1tnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLm5hbWUgPSBuZXdOYW1lO1xyXG4gICAgXHRcdFx0Z2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uYnV0dG9uLmlubmVySFRNTCA9IG5ld05hbWU7XHJcbiAgICBcdFx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcbiAgICBcdFx0XHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuICAgIFx0XHRcdGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZWxlbWVudFwiKVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmlubmVySFRNTCA9IG5ld05hbWU7XHJcbiAgICBcdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG4gICAgXHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG4gICAgXHRcdH1cclxuICAgIFx0fSk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib2FyZC1jb250ZXh0ICNkZWxldGUtY2F0ZWdvcnknKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRpZihnYW1lLmJvYXJkQXJyYXkubGVuZ3RoPjEgJiYgY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGN1cnJlbnQgY2F0ZWdvcnkgWW91IGNhbid0IHVuZG8gdGhpcyBhY3Rpb24hXCIpKVxyXG5cdFx0XHRnYW1lLmRlbGV0ZUNhdGVnb3J5KCk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib2FyZC1jb250ZXh0ICNmb3J3YXJkLWNhdGVnb3J5Jykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoZ2FtZS5hY3RpdmVCb2FyZEluZGV4KzE8Z2FtZS5jYXRlZ29yaWVzLmxlbmd0aClcclxuXHRcdFx0Z2FtZS5tb3ZlQ2F0ZWdvcnkoMSk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib2FyZC1jb250ZXh0ICNiYWNrd2FyZC1jYXRlZ29yeScpLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcclxuXHRcdGlmKGdhbWUuYWN0aXZlQm9hcmRJbmRleC0xPj0wKVxyXG5cdFx0XHRnYW1lLm1vdmVDYXRlZ29yeSgtMSk7XHJcblx0XHRib2FyZENvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0XHJcblx0XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib2FyZC1jb250ZXh0ICNlZGl0LWluZm8nKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHRQb3B1cC5lZGl0SW5mbyh3aW5kb3dEaXYsIFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpLCBmdW5jdGlvbihuZXdDYXNlRmlsZSwgbmFtZSl7XHJcblx0ICAgIFx0bG9jYWxTdG9yYWdlWydjYXNlTmFtZSddID1uYW1lK1wiLmlwYXJcIjtcclxuXHRcdFx0Y2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHRcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhuZXdDYXNlRmlsZSk7XHJcblx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcdH0pO1xyXG5cdFx0Ym9hcmRDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYm9hcmQtY29udGV4dCAjZWRpdC1yZXNvdXJjZXMnKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRnYW1lLnJlc291cmNlcy5vcGVuV2luZG93KHdpbmRvd0RpdiwgZmFsc2UsIGZ1bmN0aW9uKCl7XHJcblx0XHRcdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHRcdFx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0XHRcdHZhciByZXNvdXJjZUxpc3QgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlTGlzdFwiKVswXTtcclxuXHRcdFx0cmVzb3VyY2VMaXN0LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGdhbWUucmVzb3VyY2VzLnhtbChjYXNlRmlsZSksIHJlc291cmNlTGlzdCk7XHJcblx0XHRcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHR9KTtcclxuXHRcdGJvYXJkQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRcclxuXHJcblx0Ly8gR2V0IGFuZCBzZXR1cCB0aGUgbm9kZSBjb250ZXh0IG1lbnVcclxuXHR2YXIgbm9kZUNvbnRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyt0aGlzLnNlY3Rpb24uaWQrJyAjbm9kZS1jb250ZXh0Jyk7XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNub2RlLWNvbnRleHQgI2FkZC1jb25uZWN0aW9uJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0Z2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uYWRkQ29ubmVjdGlvbihnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5jb250ZXh0Tm9kZSk7XHJcblx0XHRnYW1lLnNhdmUoKTtcclxuXHRcdG5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbm9kZS1jb250ZXh0ICNoaWRlLWNvbm5lY3Rpb24nKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRpZihnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5jb250ZXh0Tm9kZS5xdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGg+MCl7XHJcblx0XHRcdGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmhpZGVDb25uZWN0aW9uKGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmNvbnRleHROb2RlKTtcclxuXHRcdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHR9XHJcblx0XHRub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI25vZGUtY29udGV4dCAjcmVtb3ZlLWNvbm5lY3Rpb24nKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRpZihnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5jb250ZXh0Tm9kZS5xdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGg+MCl7XHJcblx0XHRcdGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLnJlbW92ZUNvbm5lY3Rpb24oZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUpO1xyXG5cdFx0XHRnYW1lLnNhdmUoKTtcclxuXHRcdH1cclxuXHRcdG5vZGVDb250ZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHR9O1xyXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbm9kZS1jb250ZXh0ICNkZWxldGUtcXVlc3Rpb24nKS5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XHJcblx0XHRpZihjb25maXJtKFwiQXJlIHlvdSBzdXJlIHdhbnQgdG8gZGVsZXRlIHRoaXMgcXVlc3Rpb24/IFlvdSBjYW4ndCB1bmRvIHRoaXMgYWN0aW9uIVwiKSl7XHJcblx0XHRcdHZhciBib2FyZCA9IGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLFxyXG5cdFx0XHRcdGNhdCA9IGdhbWUuY2F0ZWdvcmllc1tnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0XHRmb3IodmFyIGk9MDtpPGNhdC5xdWVzdGlvbnMubGVuZ3RoO2krKyl7XHJcblx0XHRcdFx0aWYoY2F0LnF1ZXN0aW9uc1tpXS5udW0+Ym9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtKVxyXG5cdFx0XHRcdFx0Y2F0LnF1ZXN0aW9uc1tpXS5udW0tLTtcclxuXHRcdFx0XHR2YXIgY29uID0gY2F0LnF1ZXN0aW9uc1tpXS5jb25uZWN0aW9ucy5pbmRleE9mKGJvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bSsxKTtcclxuXHRcdFx0XHR3aGlsZShjb24hPS0xKXtcclxuXHRcdFx0XHRcdGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMuc3BsaWNlKGNvbiwgMSk7XHJcblx0XHRcdFx0XHRjb24gPSBjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zLmluZGV4T2YoYm9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtKzEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmb3IodmFyIGo9MDtqPGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMubGVuZ3RoO2orKylcclxuXHRcdFx0XHRcdGlmKGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnNbal0tMT5ib2FyZC5jb250ZXh0Tm9kZS5xdWVzdGlvbi5udW0pXHJcblx0XHRcdFx0XHRcdGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnNbal0tLTtcclxuXHRcdFx0fVxyXG5cdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXkuc3BsaWNlKGJvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bSwgMSk7XHJcblx0XHRcdGNhdC5xdWVzdGlvbnMuc3BsaWNlKGJvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bSwgMSk7XHJcblx0XHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0fVxyXG5cdFx0bm9kZUNvbnRleHQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdH07XHJcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNub2RlLWNvbnRleHQgI21ha2UtbGFyZ2VyJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0dmFyIGJvYXJkID0gZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0XHRpZihib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtXS5xdWVzdGlvbi5zY2FsZTxDb25zdGFudHMubWF4Tm9kZVNjYWxlKXtcclxuXHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGUgKz0gQ29uc3RhbnRzLm5vZGVTdGVwO1xyXG5cdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtXS51cGRhdGVJbWFnZSgpO1xyXG5cdFx0fVxyXG5cdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHRub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI25vZGUtY29udGV4dCAjbWFrZS1zbWFsbGVyJykub25jbGljayA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0dmFyIGJvYXJkID0gZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0XHRpZihib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtXS5xdWVzdGlvbi5zY2FsZT5Db25zdGFudHMubWluTm9kZVNjYWxlKXtcclxuXHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5W2JvYXJkLmNvbnRleHROb2RlLnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGUgLT0gQ29uc3RhbnRzLm5vZGVTdGVwO1xyXG5cdFx0XHRib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQuY29udGV4dE5vZGUucXVlc3Rpb24ubnVtXS51cGRhdGVJbWFnZSgpO1xyXG5cdFx0fVxyXG5cdFx0Z2FtZS5zYXZlKCk7XHJcblx0XHRub2RlQ29udGV4dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fTtcclxuXHRcclxuXHRcclxuXHRcclxuXHQvLyBTYXZlIHRoZSBnaXZlbiBzY2FsZVxyXG5cdHRoaXMuc2NhbGUgPSBiYXNlU2NhbGU7XHJcblx0XHJcblx0Ly8gTG9hZCB0aGUgY2FzZSBmaWxlXHJcblx0dmFyIGxvYWREYXRhID0gRmlsZU1hbmFnZXIubG9hZENhc2UoSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3dpbmRvdycpKTtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGJvYXJkc1xyXG5cdHRoaXMucmVzb3VyY2VzID0gbG9hZERhdGEucmVzb3VyY2VzO1xyXG5cdHRoaXMuY2F0ZWdvcmllcyA9IGxvYWREYXRhLmNhdGVnb3JpZXM7XHJcblx0dGhpcy5ub2RlQ29udGV4dCA9IG5vZGVDb250ZXh0O1xyXG5cdHRoaXMuYm9hcmRDb250ZXh0ID0gYm9hcmRDb250ZXh0O1xyXG5cdHRoaXMuY3JlYXRlTGVzc29uTm9kZXMoKTtcclxuXHRcclxuXHQvLyBEaXNwbGF5IHRoZSBjdXJyZW50IGJvYXJkXHJcblx0dGhpcy5hY3RpdmVCb2FyZEluZGV4ID0gbG9hZERhdGEuY2F0ZWdvcnk7XHJcblx0dGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnNob3coKTtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uY2xhc3NOYW1lID0gXCJhY3RpdmVcIjtcclxuXHR6b29tU2xpZGVyLnZhbHVlID0gLXRoaXMuZ2V0Wm9vbSgpO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRoZSBzYXZlIGJ1dHRvblxyXG5cdEZpbGVNYW5hZ2VyLnByZXBhcmVaaXAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNibG9iJykpO1xyXG5cdFxyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgaW1hZ2VzIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBQb3B1cFdpbmRvd3MuaW1hZ2VzRWRpdG9yO1xyXG4gICAgdGhpcy5pbWFnZXNXaW5kb3cgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIC8vIEZpbGwgaXQgd2l0aCB0aGUgY3VycmVudCBpbWFnZXNcclxuICAgIHZhciBjb250ZW50ID0gdGhpcy5pbWFnZXNXaW5kb3cuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImltYWdlQ29udGVudFwiKVswXTtcclxuICAgIGZvcih2YXIgaT0wO2k8bG9hZERhdGEuaW1hZ2VzLmxlbmd0aDtpKyspXHJcbiAgICBcdGNvbnRlbnQuaW5uZXJIVE1MICs9IFBvcHVwV2luZG93cy5pbWFnZS5yZXBsYWNlKC8laW1hZ2UlL2csIGxvYWREYXRhLmltYWdlc1tpXSk7XHJcblxyXG5cdC8vIEFkZCBpdCB0byBhbGwgdGhlIHF1ZXN0aW9uc1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5jYXRlZ29yaWVzLmxlbmd0aDtpKyspXHJcblx0XHRmb3IodmFyIGo9MDtqPHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnMubGVuZ3RoO2orKylcclxuXHRcdFx0dGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXS5pbWFnZXNXaW5kb3cgPSB0aGlzLmltYWdlc1dpbmRvdztcclxufVxyXG5cclxudmFyIHAgPSBnYW1lLnByb3RvdHlwZTtcclxuXHJcbnAuYWRkQ2F0ZWdvcnkgPSBmdW5jdGlvbihuYW1lKXtcclxuXHRcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0dmFyIGNhdCA9IGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoXCJjYXRlZ29yeVwiKTtcclxuXHRjYXQuc2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiLCB0aGlzLmNhdGVnb3JpZXMubGVuZ3RoKTtcclxuXHRjYXQuc2V0QXR0cmlidXRlKFwicXVlc3Rpb25Db3VudFwiLCAwKTtcclxuXHRjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uYXBwZW5kQ2hpbGQoY2F0KTtcclxuXHR0aGlzLmNhdGVnb3JpZXMucHVzaChuZXcgQ2F0ZWdvcnkobmFtZSwgY2F0LCB0aGlzLnJlc291cmNlcywgd2luZG93RGl2KSk7XHJcblx0dGhpcy5jcmVhdGVCb2FyZCh0aGlzLmNhdGVnb3JpZXNbdGhpcy5jYXRlZ29yaWVzLmxlbmd0aC0xXSwgdGhpcy5jYXRlZ29yaWVzLmxlbmd0aC0xKTtcclxuXHRcclxuXHRjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uYXBwZW5kQ2hpbGQoY2F0KTtcclxuXHR2YXIgbGlzdCA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdO1xyXG5cdGxpc3Quc2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlDb3VudFwiLCB0aGlzLmNhdGVnb3JpZXMubGVuZ3RoKTtcclxuXHR2YXIgbmV3RWxlbWVudCA9IGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoXCJlbGVtZW50XCIpO1xyXG5cdG5ld0VsZW1lbnQuaW5uZXJIVE1MID0gbmFtZTtcclxuXHRsaXN0LmFwcGVuZENoaWxkKG5ld0VsZW1lbnQpO1xyXG5cdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFxyXG59XHJcblxyXG5wLm1vdmVDYXRlZ29yeSA9IGZ1bmN0aW9uKGRpcil7XHJcblx0XHJcblx0Ly8gRmxpcCB0aGUgY2F0ZWdvcmllcyBmaXJzdFxyXG5cdHZhciB0ZW1wID0gdGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0dGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0gPSB0aGlzLmNhdGVnb3JpZXNbZGlyK3RoaXMuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0dGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdID0gdGVtcDtcclxuXHRcclxuXHQvLyBOZXh0IGZsaXAgdGhlIGJ1dHRvbiBuYW1lc1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5pbm5lckhUTUwgPSB0aGlzLmNhdGVnb3JpZXNbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5uYW1lO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5idXR0b24uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdLm5hbWU7XHJcblx0XHJcblx0Ly8gVGhlbiBmbGlwIHRoZSBidXR0b25zXHJcblx0dGVtcCA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5idXR0b247XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdLmJ1dHRvbiA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbjtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24gPSB0ZW1wO1xyXG5cdFxyXG5cdC8vIFRoZW4sIGZsaXAgdGhlIGJvYXJkc1xyXG5cdHRlbXAgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4K2Rpcl07XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0gPSB0ZW1wO1xyXG5cdFxyXG5cdC8vIEZpbmFsbHksIGZsaXAgdGhlIGRhdGEgaW4gdGhlIHhtbCBhbmQgc2F2ZVxyXG5cdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHR2YXIgbGlzdCA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZWxlbWVudFwiKTtcclxuXHRsaXN0W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubmFtZTtcclxuXHRsaXN0W3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdLmlubmVySFRNTCA9IHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyXS5uYW1lO1xyXG5cdHZhciBjYXRzID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGNhdHMubGVuZ3RoO2krKyl7XHJcblx0XHRpZihOdW1iZXIoY2F0c1tpXS5nZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIpKT09dGhpcy5hY3RpdmVCb2FyZEluZGV4KVxyXG5cdFx0XHRjYXRzW2ldLnNldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIiwgdGhpcy5hY3RpdmVCb2FyZEluZGV4K2Rpcik7XHJcblx0XHRlbHNlIGlmKE51bWJlcihjYXRzW2ldLmdldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIikpPT10aGlzLmFjdGl2ZUJvYXJkSW5kZXgrZGlyKVxyXG5cdFx0XHRjYXRzW2ldLnNldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIiwgdGhpcy5hY3RpdmVCb2FyZEluZGV4KTtcclxuXHR9XHJcblx0Y2FzZURhdGEuY2FzZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGNhc2VGaWxlKTtcclxuXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0XHJcblx0XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleCtkaXJdLmJ1dHRvbi5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5jbGFzc05hbWUgPSBcIlwiO1xyXG5cdHRoaXMuYWN0aXZlQm9hcmRJbmRleCArPSBkaXI7XHJcbn1cclxuXHJcbnAuZGVsZXRlQ2F0ZWdvcnkgPSBmdW5jdGlvbigpIHtcclxuXHRcclxuXHQvLyBSZW1vdmUgdGhlIGJ1dHRvbiwgYm9hcmQsIGFuZCBjYXQgZmlyc3RcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5ib2FyZEFycmF5Lmxlbmd0aC0xXS5idXR0b24ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmJvYXJkQXJyYXlbdGhpcy5ib2FyZEFycmF5Lmxlbmd0aC0xXS5idXR0b24pO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmNhbnZhcyk7XHJcblx0Zm9yKHZhciBpPXRoaXMuYm9hcmRBcnJheS5sZW5ndGgtMTtpPnRoaXMuYWN0aXZlQm9hcmRJbmRleDtpLS0pe1xyXG5cdFx0dGhpcy5ib2FyZEFycmF5W2ldLmJ1dHRvbiA9IHRoaXMuYm9hcmRBcnJheVtpLTFdLmJ1dHRvbjtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtpXS5idXR0b24uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW2ldLm5hbWU7XHJcblx0fVxyXG5cdGZvcih2YXIgaT10aGlzLmFjdGl2ZUJvYXJkSW5kZXgrMTtpPHRoaXMuYm9hcmRBcnJheS5sZW5ndGg7aSsrKXtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtpLTFdID0gdGhpcy5ib2FyZEFycmF5W2ldO1xyXG5cdFx0dGhpcy5jYXRlZ29yaWVzW2ktMV0gPSB0aGlzLmNhdGVnb3JpZXNbaV07XHJcblx0fVxyXG5cdHRoaXMuYm9hcmRBcnJheS5wb3AoKTtcclxuXHR0aGlzLmNhdGVnb3JpZXMucG9wKCk7XHJcblx0XHJcblx0Ly8gVGhlbiByZW1vdmUgaXQgZnJvbSB0aGUgeG1sXHJcblx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdHZhciBsaXN0ID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeUxpc3RcIilbMF07XHJcblx0bGlzdC5zZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeUNvdW50XCIsIHRoaXMuY2F0ZWdvcmllcy5sZW5ndGgpO1xyXG5cdGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIilbdGhpcy5hY3RpdmVCb2FyZEluZGV4XSk7XHJcblx0dmFyIGNhdHMgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5XCIpO1xyXG5cdGZvcih2YXIgaT0wO2k8Y2F0cy5sZW5ndGg7aSsrKXtcclxuXHRcdGlmKE51bWJlcihjYXRzW2ldLmdldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIikpPT10aGlzLmFjdGl2ZUJvYXJkSW5kZXgpe1xyXG5cdFx0XHRjYXRzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2F0c1tpXSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRjYXRzID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGNhdHMubGVuZ3RoO2krKylcclxuXHRcdGlmKE51bWJlcihjYXRzW2ldLmdldEF0dHJpYnV0ZShcImNhdGVnb3J5RGVzaWduYXRpb25cIikpPnRoaXMuYWN0aXZlQm9hcmRJbmRleClcclxuXHRcdFx0Y2F0c1tpXS5zZXRBdHRyaWJ1dGUoXCJjYXRlZ29yeURlc2lnbmF0aW9uXCIsIHRoaXMuYWN0aXZlQm9hcmRJbmRleC0xKTtcclxuXHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHRcclxuXHRpZih0aGlzLmFjdGl2ZUJvYXJkSW5kZXg+PXRoaXMuYm9hcmRBcnJheS5sZW5ndGgpXHJcblx0XHR0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPSB0aGlzLmJvYXJkQXJyYXkubGVuZ3RoLTE7XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYnV0dG9uLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XHJcblx0dGhpcy5uZXdCb2FyZCA9IHRoaXMuYWN0aXZlQm9hcmRJbmRleDtcclxuXHR0aGlzLnpvb21vdXQgPSB0cnVlO1xyXG59XHJcblxyXG5wLmNyZWF0ZUxlc3Nvbk5vZGVzID0gZnVuY3Rpb24oKXtcclxuXHR0aGlzLmJvYXJkQXJyYXkgPSBbXTtcclxuXHR0aGlzLmJvdHRvbUJhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3RoaXMuc2VjdGlvbi5pZCsnICNib3R0b21CYXInKTtcclxuXHR0aGlzLm1vdXNlU3RhdGUgPSBuZXcgTW91c2VTdGF0ZSgpO1xyXG5cdHRoaXMua2V5Ym9hcmRTdGF0ZSA9IG5ldyBLZXlib2FyZFN0YXRlKHRoaXMpO1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5jYXRlZ29yaWVzLmxlbmd0aDtpKyspXHJcblx0XHR0aGlzLmNyZWF0ZUJvYXJkKHRoaXMuY2F0ZWdvcmllc1tpXSwgaSk7XHJcblx0XHJcbn1cclxuXHJcbnAuY3JlYXRlQm9hcmQgPSBmdW5jdGlvbihjYXQsIG51bSl7XHJcblx0dGhpcy5sZXNzb25Ob2RlcyA9IFtdO1xyXG5cdC8vIGFkZCBhIG5vZGUgcGVyIHF1ZXN0aW9uXHJcblx0Zm9yICh2YXIgaiA9IDA7IGogPCBjYXQucXVlc3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcblx0XHQvLyBjcmVhdGUgYSBuZXcgbGVzc29uIG5vZGVcclxuXHRcdHRoaXMubGVzc29uTm9kZXMucHVzaChuZXcgTGVzc29uTm9kZSggY2F0LnF1ZXN0aW9uc1tqXSApICk7XHJcblx0XHQvLyBhdHRhY2ggcXVlc3Rpb24gb2JqZWN0IHRvIGxlc3NvbiBub2RlXHJcblx0XHR0aGlzLmxlc3Nvbk5vZGVzW3RoaXMubGVzc29uTm9kZXMubGVuZ3RoLTFdLnF1ZXN0aW9uID0gY2F0LnF1ZXN0aW9uc1tqXTtcclxuXHRcclxuXHR9XHJcblxyXG5cdC8vIGNyZWF0ZSBhIGJvYXJkXHJcblx0dGhpcy5ib2FyZEFycmF5W251bV0gPSBuZXcgQm9hcmQodGhpcy5zZWN0aW9uLCB0aGlzLmJvYXJkQ29udGV4dCwgdGhpcy5ub2RlQ29udGV4dCwgdGhpcy5tb3VzZVN0YXRlLCBuZXcgUG9pbnQoQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzIsIENvbnN0YW50cy5ib2FyZFNpemUueS8yKSwgdGhpcy5sZXNzb25Ob2RlcywgdGhpcy5zYXZlLmJpbmQodGhpcykpO1xyXG5cdHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiQlVUVE9OXCIpO1xyXG5cdGJ1dHRvbi5pbm5lckhUTUwgPSBjYXQubmFtZTtcclxuXHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0YnV0dG9uLm9uY2xpY2sgPSAoZnVuY3Rpb24oaSl7IFxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZihnYW1lLmFjdGl2ZSl7XHJcblx0XHRcdFx0Z2FtZS5jaGFuZ2VCb2FyZChpKTtcclxuXHRcdFx0fVxyXG5cdH19KShudW0pO1xyXG5cdHRoaXMuYm90dG9tQmFyLmFwcGVuZENoaWxkKGJ1dHRvbik7XHJcblx0dGhpcy5ib2FyZEFycmF5W251bV0uYnV0dG9uID0gYnV0dG9uO1xyXG59XHJcblxyXG5wLnVwZGF0ZSA9IGZ1bmN0aW9uKGR0KXtcclxuXHJcbiAgICBpZih0aGlzLmFjdGl2ZSl7XHJcbiAgICBcclxuICAgIFx0Ly8gcGVyZm9ybSBnYW1lIGFjdGlvbnNcclxuICAgIFx0dGhpcy5hY3QoZHQpO1xyXG4gICAgXHRcclxuXHQgICAgLy8gZHJhdyBzdHVmZlxyXG5cdCAgICB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5kcmF3KHRoaXMuc2NhbGUsIHRoaXMubW91c2VTdGF0ZSk7XHJcblx0ICAgIFxyXG4gICAgfVxyXG4gICAgZWxzZSBpZihwYXVzZWRUaW1lIT0wICYmIHdpbmRvd0Rpdi5pbm5lckhUTUw9PScnKVxyXG4gICAgXHR0aGlzLndpbmRvd0Nsb3NlZCgpO1xyXG4gICAgXHJcbn1cclxuXHJcbnAuYWN0ID0gZnVuY3Rpb24oZHQpe1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbW91c2UgYW5kIGtleWJvYXJkIHN0YXRlc1xyXG5cdHRoaXMubW91c2VTdGF0ZS51cGRhdGUoZHQsIHRoaXMuc2NhbGUqdGhpcy5nZXRab29tKCkpO1xyXG5cdHRoaXMua2V5Ym9hcmRTdGF0ZS51cGRhdGUoKTtcclxuXHRcclxuXHQvLyBIYW5kbGUga2V5Ym9hcmQgc2hvcnRjdXRzXHJcblx0dGhpcy5jaGVja0tleWJvYXJkKCk7XHJcblx0XHJcblx0XHJcbiAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgYm9hcmQgKGdpdmUgaXQgdGhlIG1vdXNlIG9ubHkgaWYgbm90IHpvb21pbmcpXHJcbiAgICB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5hY3QodGhpcy5zY2FsZSwgKHRoaXMuem9vbW91dCA/IG51bGwgOiB0aGlzLm1vdXNlU3RhdGUpLCBkdCk7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIG5ldyBib2FyZCBhdmFpbGFibGVcclxuICAgIGlmKHRoaXMuYWN0aXZlQm9hcmRJbmRleCA8IHRoaXMuYm9hcmRBcnJheS5sZW5ndGgtMSAmJlxyXG4gICAgXHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrMV0uYnV0dG9uLmRpc2FibGVkICYmIFxyXG4gICAgXHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmZpbmlzaGVkKXtcclxuICAgIFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleCsxXS5idXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHRcclxuXHJcblx0Ly8gSWYgdGhlIG5lZWRzIHRvIHpvb20gb3V0IHRvIGNlbnRlclxyXG5cdGlmKHRoaXMuem9vbW91dCl7XHJcblx0XHRcclxuXHRcdC8vIEdldCB0aGUgY3VycmVudCBib2FyZFxyXG5cdFx0dmFyIGJvYXJkID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0XHRcclxuXHRcdC8vIFpvb20gb3V0IGFuZCBtb3ZlIHRvd2FyZHMgY2VudGVyXHJcblx0XHRpZih0aGlzLmdldFpvb20oKT5Db25zdGFudHMuc3RhcnRab29tKVxyXG5cdFx0XHRib2FyZC56b29tIC09IGR0KkNvbnN0YW50cy56b29tU3BlZWQ7XHJcblx0XHRlbHNlIGlmKHRoaXMuZ2V0Wm9vbSgpPENvbnN0YW50cy5zdGFydFpvb20pXHJcblx0XHRcdGJvYXJkLnpvb20gPSBDb25zdGFudHMuc3RhcnRab29tO1xyXG5cdFx0Ym9hcmQubW92ZVRvd2FyZHMobmV3IFBvaW50KENvbnN0YW50cy5ib2FyZFNpemUueC8yLCBDb25zdGFudHMuYm9hcmRTaXplLnkvMiksIGR0LCBDb25zdGFudHMuem9vbU1vdmVTcGVlZCk7XHJcblx0XHRcclxuXHRcdC8vIFVwZGF0ZSB0aGUgem9vbSBzbGlkZXJcclxuXHRcdHpvb21TbGlkZXIudmFsdWUgPSAtdGhpcy5nZXRab29tKCk7XHJcblx0XHRcclxuXHRcdC8vIElmIGZ1bGx5IHpvb21lZCBvdXQgYW5kIGluIGNlbnRlciBzdG9wXHJcblx0XHRpZih0aGlzLmdldFpvb20oKT09Q29uc3RhbnRzLnN0YXJ0Wm9vbSAmJiBib2FyZC5ib2FyZE9mZnNldC54PT1Db25zdGFudHMuYm9hcmRTaXplLngvMiAmJiBib2FyZC5ib2FyZE9mZnNldC55PT1Db25zdGFudHMuYm9hcmRTaXplLnkvMil7XHRcdFx0XHRcclxuXHRcdFx0dGhpcy56b29tb3V0ID0gZmFsc2U7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBJZiBjaGFuZ2luZyBib2FyZCBzdGFydCB0aGF0IHByb2Nlc3NcclxuXHRcdFx0aWYodGhpcy5uZXdCb2FyZCE9bnVsbCl7XHJcblx0XHRcdFx0dmFyIGRpciA9IHRoaXMubmV3Qm9hcmQgPCB0aGlzLmFjdGl2ZUJvYXJkSW5kZXg7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uaGlkZShkaXIpO1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlQm9hcmRJbmRleCA9IHRoaXMubmV3Qm9hcmQ7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uc2hvdyhkaXIpO1xyXG5cdFx0XHRcdHpvb21TbGlkZXIudmFsdWUgPSAtdGhpcy5nZXRab29tKCk7XHJcblx0XHRcdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuXHRcdFx0XHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubG9hZGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdGdhbWUuYWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGdhbWUubmV3Qm9hcmQgPSBudWxsO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRlbHNleyAvLyBPbmx5IGhhbmRsZSB6b29taW5nIGlmIG5vdCBwZXJmb3JtaW5nIGFuaW1hdGlvbiB6b29tXHJcblx0XHJcblx0XHQvLyBIYW5kbGUgcGluY2ggem9vbVxyXG5cdCAgICBpZih0aGlzLm1vdXNlU3RhdGUuem9vbURpZmYhPTApe1xyXG5cdCAgICBcdHpvb21TbGlkZXIudmFsdWUgPSBwaW5jaFN0YXJ0ICsgdGhpcy5tb3VzZVN0YXRlLnpvb21EaWZmICogQ29uc3RhbnRzLnBpbmNoU3BlZWQ7XHJcblx0ICAgIFx0dGhpcy51cGRhdGVab29tKC1wYXJzZUZsb2F0KHpvb21TbGlkZXIudmFsdWUpKTsgXHJcblx0ICAgIH1cclxuXHQgICAgZWxzZVxyXG5cdCAgICBcdHBpbmNoU3RhcnQgPSBOdW1iZXIoem9vbVNsaWRlci52YWx1ZSk7XHJcblx0ICAgIFxyXG5cdCAgICAvLyBIYW5kbGUgbW91c2Ugem9vbVxyXG5cdCAgICBpZih0aGlzLm1vdXNlU3RhdGUubW91c2VXaGVlbERZIT0wKVxyXG5cdCAgICBcdHRoaXMuem9vbSh0aGlzLm1vdXNlU3RhdGUubW91c2VXaGVlbERZPDApO1xyXG5cdH1cclxuXHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIHNob3VsZCBwYXVzZVxyXG4gICAgaWYod2luZG93RGl2LmlubmVySFRNTCE9JycgJiYgcGF1c2VkVGltZSsrPjMpe1xyXG4gICAgXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgXHR3aW5kb3dGaWxtLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbnAuZ2V0Wm9vbSA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnpvb207XHJcbn1cclxuXHJcbnAuc2V0Wm9vbSA9IGZ1bmN0aW9uKHpvb20pe1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnpvb20gPSB6b29tO1xyXG59XHJcblxyXG5wLnpvb20gPSBmdW5jdGlvbihkaXIpe1xyXG5cdGlmKGRpcilcclxuICAgIFx0em9vbVNsaWRlci5zdGVwRG93bigpO1xyXG4gICAgZWxzZVxyXG4gICAgXHR6b29tU2xpZGVyLnN0ZXBVcCgpO1xyXG5cdHRoaXMuc2V0Wm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7XHJcbn1cclxuXHJcbnAuc2V0U2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmJvYXJkQXJyYXkubGVuZ3RoO2krKylcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtpXS51cGRhdGVTaXplKCk7XHJcblx0dGhpcy5zY2FsZSA9IHNjYWxlO1xyXG59XHJcblxyXG5wLmNoYW5nZUJvYXJkID0gZnVuY3Rpb24obnVtKXtcclxuXHRpZihudW0hPXRoaXMuYWN0aXZlQm9hcmRJbmRleCl7XHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbbnVtXS5idXR0b24uY2xhc3NOYW1lID0gXCJhY3RpdmVcIjtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5jbGFzc05hbWUgPSBcIlwiO1xyXG5cdFx0dGhpcy5uZXdCb2FyZCA9IG51bTtcclxuXHRcdHRoaXMuem9vbW91dCA9IHRydWU7XHJcblx0fVxyXG59XHJcblxyXG5wLndpbmRvd0Nsb3NlZCA9IGZ1bmN0aW9uKCkge1xyXG5cdFxyXG5cdC8vIFVucGF1c2UgdGhlIGdhbWUgYW5kIGZ1bGx5IGNsb3NlIHRoZSB3aW5kb3dcclxuXHRwYXVzZWRUaW1lID0gMDtcclxuXHR0aGlzLmFjdGl2ZSA9IHRydWU7XHJcblx0d2luZG93RmlsbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFxyXG5cdHZhciBzYXZlID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ud2luZG93Q2xvc2VkKCk7XHJcblx0XHJcblx0aWYoc2F2ZSl7XHJcblx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHRcdGlmKHNhdmUueG1sKXtcclxuXHRcdFx0dmFyIGNhdCA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjYXRlZ29yeScpW3RoaXMuYWN0aXZlQm9hcmRJbmRleF07XHJcblx0XHRcdGNhdC5yZXBsYWNlQ2hpbGQoc2F2ZS54bWwsIGNhdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylbc2F2ZS5udW1dKTtcclxuXHRcdFx0Y2FzZURhdGEuY2FzZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGNhc2VGaWxlKTtcclxuXHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZXtcclxuXHRcdFx0dGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ucXVlc3Rpb25zW3NhdmUubnVtXS54bWwgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY2F0ZWdvcnknKVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKVtzYXZlLm51bV07XHJcblx0XHRcdHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnF1ZXN0aW9uc1tzYXZlLm51bV0ucmVmcmVzaCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHR0aGlzLnNhdmUoKTtcclxuXHRcclxufVxyXG5cclxucC5zYXZlID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHR2YXIgbGVzc29uTm9kZXMgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5sZXNzb25Ob2RlQXJyYXk7XHJcblx0Zm9yKHZhciBpPTA7aTxsZXNzb25Ob2Rlcy5sZW5ndGg7aSsrKVxyXG5cdFx0bGVzc29uTm9kZXNbaV0uc2F2ZSgpO1xyXG5cdFxyXG5cdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuXHR2YXIgY2FzZU5vZGUgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF07XHJcblx0dmFyIGNhdCA9IGNhc2VOb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIilbMF07XHJcblx0d2hpbGUoY2F0KXtcclxuXHRcdGNhc2VOb2RlLnJlbW92ZUNoaWxkKGNhdCk7XHJcblx0XHRjYXQgPSBjYXNlTm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5XCIpWzBdO1xyXG5cdH1cclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGg7aSsrKVxyXG5cdFx0Y2FzZU5vZGUuYXBwZW5kQ2hpbGQodGhpcy5jYXRlZ29yaWVzW2ldLnhtbChjYXNlRmlsZSwgaSkpO1xyXG5cdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFxyXG59XHJcblxyXG5wLmFkZFF1ZXN0aW9uID0gZnVuY3Rpb24oeCwgeSl7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBjYXNlIHRvIGFkZCB0aGUgcXVlc3Rpb25cclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0dmFyIG5ld1F1ZXN0aW9uID0gY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCd4UG9zaXRpb25QZXJjZW50JywgeCk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCd5UG9zaXRpb25QZXJjZW50JywgeSk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdzY2FsZScsICcxJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdudW1Db25uZWN0aW9ucycsICcwJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdudW1BbnN3ZXJzJywgJzMnKTtcclxuXHRuZXdRdWVzdGlvbi5zZXRBdHRyaWJ1dGUoJ2NvcnJlY3RBbnN3ZXInLCAnMCcpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgnaW1hZ2VMaW5rJywgd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKDAsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cigwLCB3aW5kb3cubG9jYXRpb24uaHJlZi5sZW5ndGgtMSkubGFzdEluZGV4T2YoXCIvXCIpKStcIi9pbWFnZS9cIisnZWIxODMyYTgwZmE0MWUzOTU0OTE1NzFkNDkzMDExOWIucG5nJyk7XHJcblx0bmV3UXVlc3Rpb24uc2V0QXR0cmlidXRlKCdyZXZlYWxUaHJlc2hvbGQnLCAnMCcpO1xyXG5cdG5ld1F1ZXN0aW9uLnNldEF0dHJpYnV0ZSgncXVlc3Rpb25UeXBlJywgJzInKTtcclxuXHRuZXdRdWVzdGlvbi5zZXRBdHRyaWJ1dGUoJ3Jlc291cmNlQ291bnQnLCAnMCcpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ3F1ZXN0aW9uTmFtZScpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdpbnN0cnVjdGlvbnMnKSk7XHJcblx0bmV3UXVlc3Rpb24uYXBwZW5kQ2hpbGQoY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgncXVlc3Rpb25UZXh0JykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2Fuc3dlcicpKTtcclxuXHRuZXdRdWVzdGlvbi5hcHBlbmRDaGlsZChjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdhbnN3ZXInKSk7XHJcblx0bmV3UXVlc3Rpb24uYXBwZW5kQ2hpbGQoY2FzZUZpbGUuY3JlYXRlRWxlbWVudCgnYW5zd2VyJykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2ZlZWRiYWNrJykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2ZlZWRiYWNrJykpO1xyXG5cdG5ld1F1ZXN0aW9uLmFwcGVuZENoaWxkKGNhc2VGaWxlLmNyZWF0ZUVsZW1lbnQoJ2ZlZWRiYWNrJykpO1xyXG5cdHZhciBjYXRzID0gY2FzZUZpbGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NhdGVnb3J5Jyk7XHJcblx0Zm9yKHZhciBpPTA7aTxjYXRzLmxlbmd0aDtpKyspe1xyXG5cdFx0aWYoTnVtYmVyKGNhdHNbaV0uZ2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiKSk9PXRoaXMuYWN0aXZlQm9hcmRJbmRleClcclxuXHRcdHtcclxuXHRcdFx0Y2F0c1tpXS5hcHBlbmRDaGlsZChuZXdRdWVzdGlvbik7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHR2YXIgcXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24obmV3UXVlc3Rpb24sIHRoaXMucmVzb3VyY2VzLCB3aW5kb3dEaXYsIHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnF1ZXN0aW9ucy5sZW5ndGgpO1xyXG5cdHF1ZXN0aW9uLmltYWdlc1dpbmRvdyA9IHRoaXMuaW1hZ2VzV2luZG93O1xyXG5cdHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnF1ZXN0aW9ucy5wdXNoKHF1ZXN0aW9uKTtcclxuXHR2YXIgbGVzc29uTm9kZXMgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5sZXNzb25Ob2RlQXJyYXk7XHJcblx0bGVzc29uTm9kZXMucHVzaChuZXcgTGVzc29uTm9kZSggcXVlc3Rpb24gKSApO1xyXG5cdC8vIGF0dGFjaCBxdWVzdGlvbiBvYmplY3QgdG8gbGVzc29uIG5vZGVcclxuXHRsZXNzb25Ob2Rlc1tsZXNzb25Ob2Rlcy5sZW5ndGgtMV0ucXVlc3Rpb24gPSBxdWVzdGlvbjtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5sZXNzb25Ob2RlQXJyYXkgPSBsZXNzb25Ob2RlcztcclxuXHRcclxuXHQvLyBTYXZlIHRoZSBjaGFuZ2VzIHRvIGxvY2FsIHN0b3JhZ2VcclxuXHR0aGlzLnNhdmUoKTtcclxuXHRcclxufVxyXG5cclxucC5jaGVja0tleWJvYXJkID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs0Nl0peyAvLyBEZWxldGUgLSBEZWxldGUgQ2F0ZWdvcnlcclxuXHRcdGlmKHRoaXMuYm9hcmRBcnJheS5sZW5ndGg+MSAmJiBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgY3VycmVudCBjYXRlZ29yeSBZb3UgY2FuJ3QgdW5kbyB0aGlzIGFjdGlvbiFcIikpXHJcblx0XHRcdHRoaXMuZGVsZXRlQ2F0ZWdvcnkoKTtcclxuXHR9XHJcblx0XHJcblx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVsxN10peyAvLyBDdHJsXHJcblx0XHRcclxuXHRcdHZhciBib2FyZCA9IHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0dmFyIGdhbWUgPSB0aGlzO1xyXG5cdFx0XHJcblx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs2N10peyAvLyBDIC0gQWRkIENhdGVnb3J5XHJcblx0XHRcdFBvcHVwLnByb21wdCh3aW5kb3dEaXYsIFwiQ3JlYXRlIENhdGVnb3J5XCIsIFwiQ2F0ZWdvcnkgTmFtZTpcIiwgXCJcIiwgXCJDcmVhdGVcIiwgZnVuY3Rpb24obmV3TmFtZSl7XHJcblx0ICAgIFx0XHRpZihuZXdOYW1lKVxyXG5cdCAgICBcdFx0XHRnYW1lLmFkZENhdGVnb3J5KG5ld05hbWUpO1xyXG5cdCAgICBcdH0pO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs4Nl0peyAvLyBWIC0gUmVuYW1lIENhdGVnb3J5XHJcblx0XHRcdFBvcHVwLnByb21wdCh3aW5kb3dEaXYsIFwiUmVuYW1lIENhdGVnb3J5XCIsIFwiQ2F0ZWdvcnkgTmFtZTpcIiwgdGhpcy5jYXRlZ29yaWVzW3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubmFtZSwgXCJSZW5hbWVcIiwgZnVuY3Rpb24obmV3TmFtZSl7XHJcblx0ICAgIFx0XHRpZihuZXdOYW1lKXtcclxuXHQgICAgXHRcdFx0Z2FtZS5jYXRlZ29yaWVzW2dhbWUuYWN0aXZlQm9hcmRJbmRleF0ubmFtZSA9IG5ld05hbWU7XHJcblx0ICAgIFx0XHRcdGdhbWUuYm9hcmRBcnJheVtnYW1lLmFjdGl2ZUJvYXJkSW5kZXhdLmJ1dHRvbi5pbm5lckhUTUwgPSBuZXdOYW1lO1xyXG5cdCAgICBcdFx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0ICAgIFx0XHRcdHZhciBjYXNlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdCAgICBcdFx0XHRjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIilbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5pbm5lckhUTUwgPSBuZXdOYW1lO1xyXG5cdCAgICBcdFx0XHRjYXNlRGF0YS5jYXNlRmlsZSA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoY2FzZUZpbGUpO1xyXG5cdCAgICBcdFx0XHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzg4XSl7IC8vIFggLSBNb3ZlIENhdGVnb3J5IGZvcndhcmRcclxuXHRcdFx0aWYodGhpcy5hY3RpdmVCb2FyZEluZGV4KzE8dGhpcy5jYXRlZ29yaWVzLmxlbmd0aClcclxuXHRcdFx0XHR0aGlzLm1vdmVDYXRlZ29yeSgxKTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbOTBdKXsgLy8gWiAtIE1vdmUgQ2F0ZWdvcnkgYmFja3dhcmRcclxuXHRcdFx0aWYodGhpcy5hY3RpdmVCb2FyZEluZGV4LTE+PTApXHJcblx0XHRcdFx0dGhpcy5tb3ZlQ2F0ZWdvcnkoLTEpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs3MF0peyAvLyBGIC0gRWRpdCBDYXNlIEluZm9cclxuXHRcdFx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0XHRQb3B1cC5lZGl0SW5mbyh3aW5kb3dEaXYsIFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpLCBmdW5jdGlvbihuZXdDYXNlRmlsZSwgbmFtZSl7XHJcblx0XHQgICAgXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VOYW1lJ10gPW5hbWUrXCIuaXBhclwiO1xyXG5cdFx0XHRcdGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhQ3JlYXRlJ10pO1xyXG5cdFx0XHRcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhuZXdDYXNlRmlsZSk7XHJcblx0XHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbODJdKXsgLy8gUiAtIEVkaXQgcmVzb3VyY2VzXHJcblx0XHRcdHRoaXMucmVzb3VyY2VzLm9wZW5XaW5kb3cod2luZG93RGl2LCBmYWxzZSwgZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSk7XHJcblx0XHRcdFx0dmFyIGNhc2VGaWxlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0XHRcdFx0dmFyIHJlc291cmNlTGlzdCA9IGNhc2VGaWxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VMaXN0XCIpWzBdO1xyXG5cdFx0XHRcdHJlc291cmNlTGlzdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChnYW1lLnJlc291cmNlcy54bWwoY2FzZUZpbGUpLCByZXNvdXJjZUxpc3QpO1xyXG5cdFx0XHRcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcblx0XHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG5cdFx0XHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYoYm9hcmQudGFyZ2V0KXtcclxuXHJcblx0XHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlbMTZdKXsgLy8gU2hpZnRcclxuXHRcdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs2NV0peyAvLyBBIC0gQWRkIGNvbm5lY3Rpb25cclxuXHRcdFx0XHRcdGJvYXJkLmFkZENvbm5lY3Rpb24oYm9hcmQudGFyZ2V0KTtcclxuXHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs2OF0peyAvLyBEIC0gUmVtb3ZlIGNvbm5lY3Rpb25cclxuXHRcdFx0XHRcdGlmKGJvYXJkLnRhcmdldC5xdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGg+MCl7XHJcblx0XHRcdFx0XHRcdGJvYXJkLnJlbW92ZUNvbm5lY3Rpb24oYm9hcmQudGFyZ2V0KTtcclxuXHRcdFx0XHRcdFx0dGhpcy5zYXZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzgzXSl7IC8vIFMgLSBTaG93L0hpZGUgY29ubmVjdGlvblxyXG5cdFx0XHRcdFx0aWYoZ2FtZS5ib2FyZEFycmF5W2dhbWUuYWN0aXZlQm9hcmRJbmRleF0uY29udGV4dE5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoPjApe1xyXG5cdFx0XHRcdFx0XHRnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5oaWRlQ29ubmVjdGlvbihnYW1lLmJvYXJkQXJyYXlbZ2FtZS5hY3RpdmVCb2FyZEluZGV4XS5jb250ZXh0Tm9kZSk7XHJcblx0XHRcdFx0XHRcdGdhbWUuc2F2ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNle1xyXG5cdFx0XHRcclxuXHRcdFx0XHRpZih0aGlzLmtleWJvYXJkU3RhdGUua2V5UHJlc3NlZFs2NV0peyAvLyBBIC0gTWFrZSBxdWVzdGlvbiBzbWFsbGVyXHJcblx0XHRcdFx0XHRpZihib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGU+Q29uc3RhbnRzLm1pbk5vZGVTY2FsZSl7XHJcblx0XHRcdFx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtXS5xdWVzdGlvbi5zY2FsZSAtPSBDb25zdGFudHMubm9kZVN0ZXA7XHJcblx0XHRcdFx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtXS51cGRhdGVJbWFnZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dGhpcy5zYXZlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdFx0aWYodGhpcy5rZXlib2FyZFN0YXRlLmtleVByZXNzZWRbODNdKXsgLy8gUyAtIE1ha2UgcXVlc3Rpb24gbGFyZ2VyXHJcblx0XHRcdFx0XHRpZihib2FyZC5sZXNzb25Ob2RlQXJyYXlbYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bV0ucXVlc3Rpb24uc2NhbGU8Q29uc3RhbnRzLm1heE5vZGVTY2FsZSl7XHJcblx0XHRcdFx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtXS5xdWVzdGlvbi5zY2FsZSArPSBDb25zdGFudHMubm9kZVN0ZXA7XHJcblx0XHRcdFx0XHRcdGJvYXJkLmxlc3Nvbk5vZGVBcnJheVtib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtXS51cGRhdGVJbWFnZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dGhpcy5zYXZlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzY4XSl7IC8vIEQgLSBEZWxldGUgcXVlc3Rpb25cclxuXHRcdFx0XHRcdGlmKGNvbmZpcm0oXCJBcmUgeW91IHN1cmUgd2FudCB0byBkZWxldGUgdGhpcyBxdWVzdGlvbj8gWW91IGNhbid0IHVuZG8gdGhpcyBhY3Rpb24hXCIpKXtcclxuXHRcdFx0XHRcdFx0dmFyIGNhdCA9IHRoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdO1xyXG5cdFx0XHRcdFx0XHRmb3IodmFyIGk9MDtpPGNhdC5xdWVzdGlvbnMubGVuZ3RoO2krKyl7XHJcblx0XHRcdFx0XHRcdFx0aWYoY2F0LnF1ZXN0aW9uc1tpXS5udW0+Ym9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSlcclxuXHRcdFx0XHRcdFx0XHRcdGNhdC5xdWVzdGlvbnNbaV0ubnVtLS07XHJcblx0XHRcdFx0XHRcdFx0dmFyIGNvbiA9IGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMuaW5kZXhPZihib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtKzEpO1xyXG5cdFx0XHRcdFx0XHRcdHdoaWxlKGNvbiE9LTEpe1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2F0LnF1ZXN0aW9uc1tpXS5jb25uZWN0aW9ucy5zcGxpY2UoY29uLCAxKTtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbiA9IGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMuaW5kZXhPZihib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtKzEpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGo9MDtqPGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnMubGVuZ3RoO2orKylcclxuXHRcdFx0XHRcdFx0XHRcdGlmKGNhdC5xdWVzdGlvbnNbaV0uY29ubmVjdGlvbnNbal0tMT5ib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRjYXQucXVlc3Rpb25zW2ldLmNvbm5lY3Rpb25zW2pdLS07XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0Ym9hcmQubGVzc29uTm9kZUFycmF5LnNwbGljZShib2FyZC50YXJnZXQucXVlc3Rpb24ubnVtLCAxKTtcclxuXHRcdFx0XHRcdFx0Y2F0LnF1ZXN0aW9ucy5zcGxpY2UoYm9hcmQudGFyZ2V0LnF1ZXN0aW9uLm51bSwgMSk7XHJcblx0XHRcdFx0XHRcdHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHRcdGVsc2V7XHJcblx0XHRcdGlmKHRoaXMua2V5Ym9hcmRTdGF0ZS5rZXlQcmVzc2VkWzgxXSl7IC8vIFEgLSBBZGQgUXVlc3Rpb25cclxuXHRcdFx0XHR0aGlzLmFkZFF1ZXN0aW9uKCh0aGlzLm1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLngrQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzIpL0NvbnN0YW50cy5ib2FyZFNpemUueCoxMDAsXHJcblx0XHRcdFx0XHRcdCh0aGlzLm1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkrQ29uc3RhbnRzLmJvYXJkU2l6ZS55LzIpL0NvbnN0YW50cy5ib2FyZFNpemUueSoxMDApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4uL2hlbHBlci9kcmF3bGliLmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuLi9jYXNlL3F1ZXN0aW9uLmpzXCIpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZShcIi4vY29uc3RhbnRzLmpzXCIpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9oZWxwZXIvcG9pbnQuanMnKTtcclxuXHJcbnZhciBDSEVDS19JTUFHRSA9IFwiLi4vaW1nL2ljb25Qb3N0SXRDaGVjay5wbmdcIjtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIGxlc3Nvbk5vZGUocFF1ZXN0aW9uKXtcclxuICAgIFxyXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludChwUXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WC8xMDAqQ29uc3RhbnRzLmJvYXJkU2l6ZS54LCBwUXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WS8xMDAqQ29uc3RhbnRzLmJvYXJkU2l6ZS55KTtcclxuICAgIHRoaXMuZHJhZ0xvY2F0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgIHRoaXMudHlwZSA9IFwibGVzc29uTm9kZVwiO1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5jaGVjayA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy53aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0O1xyXG4gICAgdGhpcy5xdWVzdGlvbiA9IHBRdWVzdGlvbjtcclxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSAwO1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSAwO1xyXG4gICAgdGhpcy5saW5lUGVyY2VudCA9IDA7XHJcbiAgICBcclxuICAgIC8vIHNraXAgYW5pbWF0aW9ucyBmb3Igc29sdmVkXHJcbiAgICBpZiAocFF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9PSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpIHRoaXMubGluZVBlcmNlbnQgPSAxO1xyXG4gICAgXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvL2ltYWdlIGxvYWRpbmcgYW5kIHJlc2l6aW5nXHJcbiAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoYXQud2lkdGggPSB0aGF0LmltYWdlLm5hdHVyYWxXaWR0aDtcclxuICAgICAgICB0aGF0LmhlaWdodCA9IHRoYXQuaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuICAgICAgICB2YXIgbWF4RGltZW5zaW9uID0gQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzEwO1xyXG4gICAgICAgIC8vdG9vIHNtYWxsP1xyXG4gICAgICAgIGlmKHRoYXQud2lkdGggPCBtYXhEaW1lbnNpb24gJiYgdGhhdC5oZWlnaHQgPCBtYXhEaW1lbnNpb24pe1xyXG4gICAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcclxuICAgICAgICAgICAgICAgIHggPSBtYXhEaW1lbnNpb24gLyB0aGF0LndpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhhdC5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC53aWR0aCA9IHRoYXQud2lkdGggKiB4ICogdGhhdC5xdWVzdGlvbi5zY2FsZTtcclxuICAgICAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmhlaWdodCAqIHggKiB0aGF0LnF1ZXN0aW9uLnNjYWxlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGF0LndpZHRoID4gbWF4RGltZW5zaW9uIHx8IHRoYXQuaGVpZ2h0ID4gbWF4RGltZW5zaW9uKXtcclxuICAgICAgICAgICAgdmFyIHg7XHJcbiAgICAgICAgICAgIGlmKHRoYXQud2lkdGggPiB0aGF0LmhlaWdodCl7XHJcbiAgICAgICAgICAgICAgICB4ID0gdGhhdC53aWR0aCAvIG1heERpbWVuc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IHRoYXQuaGVpZ2h0IC8gbWF4RGltZW5zaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQud2lkdGggPSB0aGF0LndpZHRoIC8geCAqIHRoYXQucXVlc3Rpb24uc2NhbGU7XHJcbiAgICAgICAgICAgIHRoYXQuaGVpZ2h0ID0gdGhhdC5oZWlnaHQgLyB4ICogdGhhdC5xdWVzdGlvbi5zY2FsZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IHRoaXMucXVlc3Rpb24uaW1hZ2VMaW5rO1xyXG4gICAgdGhpcy5jaGVjay5zcmMgPSBDSEVDS19JTUFHRTtcclxufVxyXG5cclxudmFyIHAgPSBsZXNzb25Ob2RlLnByb3RvdHlwZTtcclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgY2FudmFzKXtcclxuXHJcbiAgICAvL2xlc3Nvbk5vZGUuZHJhd0xpYi5jaXJjbGUoY3R4LCB0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSwgMTAsIFwicmVkXCIpO1xyXG4gICAgLy9kcmF3IHRoZSBpbWFnZSwgc2hhZG93IGlmIGhvdmVyZWRcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBpZih0aGlzLmRyYWdnaW5nKSB7XHJcbiAgICBcdGN0eC5zaGFkb3dDb2xvciA9ICd5ZWxsb3cnO1xyXG4gICAgICAgIGN0eC5zaGFkb3dCbHVyID0gNTtcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnLXdlYmtpdC1ncmFiYmluZyc7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy1tb3otZ3JhYmJpbmcnO1xyXG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHRoaXMubW91c2VPdmVyKXtcclxuICAgICAgICBjdHguc2hhZG93Q29sb3IgPSAnZG9kZ2VyQmx1ZSc7XHJcbiAgICAgICAgY3R4LnNoYWRvd0JsdXIgPSA1O1xyXG4gICAgICAgIGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgICB9XHJcbiAgICAvL2RyYXdpbmcgdGhlIGJ1dHRvbiBpbWFnZVxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy9kcmF3aW5nIHRoZSBwaW5cclxuXHRjdHguZmlsbFN0eWxlID0gXCJibHVlXCI7XHJcblx0Y3R4LnN0cm9rZVN0eWxlID0gXCJjeWFuXCI7XHJcblx0dmFyIHNtYWxsZXIgPSB0aGlzLndpZHRoIDwgdGhpcy5oZWlnaHQgPyB0aGlzLndpZHRoIDogdGhpcy5oZWlnaHQ7XHJcblx0Y3R4LmxpbmVXaWR0aCA9IHNtYWxsZXIvMzI7XHJcblxyXG5cdGN0eC5iZWdpblBhdGgoKTtcclxuXHR2YXIgbm9kZVBvaW50ID0gdGhpcy5nZXROb2RlUG9pbnQoKTtcclxuXHRjdHguYXJjKG5vZGVQb2ludC54LCBub2RlUG9pbnQueSwgc21hbGxlciozLzMyLCAwLCAyKk1hdGguUEkpO1xyXG5cdGN0eC5jbG9zZVBhdGgoKTtcclxuXHRjdHguZmlsbCgpO1xyXG5cdGN0eC5zdHJva2UoKTtcclxuICAgIFxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbnAuZ2V0Tm9kZVBvaW50ID0gZnVuY3Rpb24oKXtcclxuXHR2YXIgc21hbGxlciA9IHRoaXMud2lkdGggPCB0aGlzLmhlaWdodCA/IHRoaXMud2lkdGggOiB0aGlzLmhlaWdodDtcclxuXHRyZXR1cm4gbmV3IFBvaW50KHRoaXMucG9zaXRpb24ueCAtIHRoaXMud2lkdGgvMiArIHNtYWxsZXIqMy8xNiwgdGhpcy5wb3NpdGlvbi55IC0gdGhpcy5oZWlnaHQvMiArIHNtYWxsZXIqMy8xNik7XHJcbn1cclxuXHJcbnAuY2xpY2sgPSBmdW5jdGlvbihtb3VzZVN0YXRlKXtcclxuICAgIHRoaXMucXVlc3Rpb24uZGlzcGxheVdpbmRvd3MoKTtcclxufVxyXG5cclxucC51cGRhdGVJbWFnZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IHRoaXMucXVlc3Rpb24uaW1hZ2VMaW5rO1xyXG59XHJcblxyXG5wLnNhdmUgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMucXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WCA9IHRoaXMucG9zaXRpb24ueC9Db25zdGFudHMuYm9hcmRTaXplLngqMTAwO1xyXG5cdHRoaXMucXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WSA9IHRoaXMucG9zaXRpb24ueS9Db25zdGFudHMuYm9hcmRTaXplLnkqMTAwO1xyXG5cdHRoaXMucXVlc3Rpb24uc2F2ZVhNTCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGxlc3Nvbk5vZGU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy9Nb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG5tLmNsZWFyID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoKSB7XHJcbiAgICBjdHguY2xlYXJSZWN0KHgsIHksIHcsIGgpO1xyXG59XHJcblxyXG5tLnJlY3QgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIGNvbCwgY2VudGVyT3JpZ2luKSB7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbDtcclxuICAgIGlmKGNlbnRlck9yaWdpbil7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KHggLSAodyAvIDIpLCB5IC0gKGggLyAyKSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm0uc3Ryb2tlUmVjdCA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgbGluZSwgY29sLCBjZW50ZXJPcmlnaW4pIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2w7XHJcbiAgICBjdHgubGluZVdpZHRoID0gbGluZTtcclxuICAgIGlmKGNlbnRlck9yaWdpbil7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QoeCAtICh3IC8gMiksIHkgLSAoaCAvIDIpLCB3LCBoKTtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5tLmxpbmUgPSBmdW5jdGlvbihjdHgsIHgxLCB5MSwgeDIsIHkyLCB0aGlja25lc3MsIGNvbG9yKSB7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4Lm1vdmVUbyh4MSwgeTEpO1xyXG4gICAgY3R4LmxpbmVUbyh4MiwgeTIpO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHRoaWNrbmVzcztcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubS5jaXJjbGUgPSBmdW5jdGlvbihjdHgsIHgsIHksIHJhZGl1cywgY29sb3Ipe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGN0eC5hcmMoeCx5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbiAgICBjdHguZmlsbCgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MDg4MjYvZHJhdy1hcnJvdy1vbi1jYW52YXMtdGFnIFxyXG5tLmFycm93ID0gZnVuY3Rpb24oY3R4LCBzdGFydCwgZW5kLCBoZWFkbGVuLCB0aGlja25lc3MsIGNvbG9yKXtcclxuXHJcbiAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKGVuZC55LXN0YXJ0LnksIGVuZC54LXN0YXJ0LngpO1xyXG5cdFxyXG4gICAgY3R4LnNhdmUoKTtcclxuXHRjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0LngsIHN0YXJ0LnkpO1xyXG4gICAgY3R4LmxpbmVUbyhlbmQueCwgZW5kLnkpO1xyXG4gICAgY3R4LmxpbmVUbyhlbmQueC1oZWFkbGVuKk1hdGguY29zKGFuZ2xlLU1hdGguUEkvNiksIGVuZC55LWhlYWRsZW4qTWF0aC5zaW4oYW5nbGUtTWF0aC5QSS82KSk7XHJcbiAgICBjdHgubW92ZVRvKGVuZC54LCBlbmQueSk7XHJcbiAgICBjdHgubGluZVRvKGVuZC54LWhlYWRsZW4qTWF0aC5jb3MoYW5nbGUrTWF0aC5QSS82KSwgZW5kLnktaGVhZGxlbipNYXRoLnNpbihhbmdsZStNYXRoLlBJLzYpKVxyXG4gICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHRoaWNrbmVzcztcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYm9hcmRCdXR0b24oY3R4LCBwb3NpdGlvbiwgd2lkdGgsIGhlaWdodCwgaG92ZXJlZCl7XHJcbiAgICAvL2N0eC5zYXZlKCk7XHJcbiAgICBpZihob3ZlcmVkKXtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJkb2RnZXJibHVlXCI7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImxpZ2h0Ymx1ZVwiO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3IHJvdW5kZWQgY29udGFpbmVyXHJcbiAgICBjdHgucmVjdChwb3NpdGlvbi54IC0gd2lkdGgvMiwgcG9zaXRpb24ueSAtIGhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgIGN0eC5saW5lV2lkdGggPSA1O1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIC8vY3R4LnJlc3RvcmUoKTtcclxufSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgQ2F0ZWdvcnkgPSByZXF1aXJlKFwiLi4vY2FzZS9jYXRlZ29yeS5qc1wiKTtcclxudmFyIFJlc291cmNlID0gcmVxdWlyZShcIi4uL2Nhc2UvcmVzb3VyY2VzLmpzXCIpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxudmFyIFBhcnNlciA9IHJlcXVpcmUoJy4vaXBhckRhdGFQYXJzZXIuanMnKTtcclxuXHJcbi8vIE1vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbi8vICoqKioqKioqKioqKioqKioqKioqKiogTE9BRElORyAqKioqKioqKioqKioqKioqKioqKioqKipcclxuXHJcbi8vIGxvYWQgdGhlIGZpbGUgZW50cnkgYW5kIHBhcnNlIHRoZSB4bWxcclxubS5sb2FkQ2FzZSA9IGZ1bmN0aW9uKGNhc2VEYXRhLCB3aW5kb3dEaXYpIHtcclxuICAgIFxyXG4gICAgdGhpcy5jYXRlZ29yaWVzID0gW107XHJcbiAgICB0aGlzLnF1ZXN0aW9ucyA9IFtdO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgeG1sIGRhdGFcclxuXHR2YXIgeG1sRGF0YSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuY2FzZUZpbGUpO1xyXG5cdHZhciByZXNvdXJjZXMgPSBQYXJzZXIuZ2V0UmVzb3VyY2VzKHhtbERhdGEpO1xyXG5cdHZhciBjYXRlZ29yaWVzID0gUGFyc2VyLmdldENhdGVnb3JpZXNBbmRRdWVzdGlvbnMoeG1sRGF0YSwgcmVzb3VyY2VzLCB3aW5kb3dEaXYpO1xyXG5cdHZhciBpbWFnZXMgPSBbXTtcclxuXHRmb3IodmFyIGk9MDtpPGNhdGVnb3JpZXMubGVuZ3RoO2krKylcclxuXHRcdGZvcih2YXIgaj0wO2o8Y2F0ZWdvcmllc1tpXS5xdWVzdGlvbnMubGVuZ3RoO2orKylcclxuXHRcdFx0aWYoaW1hZ2VzLmluZGV4T2YoY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0uaW1hZ2VMaW5rKT09LTEpXHJcblx0XHRcdFx0aW1hZ2VzLnB1c2goY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0uaW1hZ2VMaW5rKTtcclxuXHRcclxuXHQvLyBsb2FkIHRoZSBtb3N0IHJlY2VudCBwcm9ncmVzcyBmcm9tIHNhdmVGaWxlLmlwYXJkYXRhXHJcblx0dmFyIHF1ZXN0aW9ucyA9IFtdO1xyXG4gICAgXHJcblx0Ly8gR2V0IHRoZSBzYXZlIGRhdGFcclxuXHR2YXIgc2F2ZURhdGEgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLnNhdmVGaWxlKTtcclxuXHQvLyBhbGVydCB1c2VyIGlmIHRoZXJlIGlzIGFuIGVycm9yXHJcblx0aWYgKCFzYXZlRGF0YSkgeyBhbGVydCAoXCJFUlJPUiBubyBzYXZlIGRhdGEgZm91bmQsIG9yIHNhdmUgZGF0YSB3YXMgdW5yZWFkYWJsZVwiKTsgcmV0dXJuOyB9XHJcblx0Ly8gcHJvZ3Jlc3NcclxuXHR2YXIgc3RhZ2UgPSBzYXZlRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uZ2V0QXR0cmlidXRlKFwiY2FzZVN0YXR1c1wiKTtcclxuXHRcclxuXHQvLyBwYXJzZSB0aGUgc2F2ZSBkYXRhIGlmIG5vdCBuZXdcclxuXHRpZihzdGFnZT4wKXtcclxuXHRcdGZvcih2YXIgZmlsZSBpbiBjYXNlRGF0YS5zdWJtaXR0ZWQpe1xyXG5cdFx0XHRpZiAoIWNhc2VEYXRhLnN1Ym1pdHRlZC5oYXNPd25Qcm9wZXJ0eShmaWxlKSkgY29udGludWU7XHJcblx0XHRcdGZpbGUgPSBmaWxlLnN1YnN0cihmaWxlLmxhc3RJbmRleE9mKFwiL1wiKSsxKTtcclxuXHRcdFx0dmFyIGNhdCA9IGZpbGUuaW5kZXhPZihcIi1cIiksXHJcblx0XHRcdFx0cXVlID0gZmlsZS5pbmRleE9mKFwiLVwiLCBjYXQrMSksXHJcblx0XHRcdFx0ZmlsID0gZmlsZS5pbmRleE9mKFwiLVwiLCBxdWUrMSk7XHJcblx0XHRcdGNhdGVnb3JpZXNbTnVtYmVyKGZpbGUuc3Vic3RyKDAsIGNhdCkpXS5cclxuXHRcdFx0XHRxdWVzdGlvbnNbTnVtYmVyKGZpbGUuc3Vic3RyKGNhdCsxLCBxdWUtY2F0LTEpKV0uXHJcblx0XHRcdFx0ZmlsZXNbTnVtYmVyKGZpbGUuc3Vic3RyKHF1ZSsxLCBmaWwtcXVlLTEpKV0gPSBcclxuXHRcdFx0XHRcdGZpbGUuc3Vic3RyKGZpbGUuaW5kZXhPZkF0KFwiLVwiLCAzKSsxKTtcclxuXHRcdH1cclxuXHRcdFBhcnNlci5hc3NpZ25RdWVzdGlvblN0YXRlcyhjYXRlZ29yaWVzLCBzYXZlRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uXCIpKTtcclxuXHR9XHJcblx0ZWxzZVxyXG5cdFx0c3RhZ2UgPSAxO1xyXG5cdFxyXG5cdC8vIHJldHVybiByZXN1bHRzXHJcblx0cmV0dXJuIHtjYXRlZ29yaWVzOiBjYXRlZ29yaWVzLCBjYXRlZ29yeTpzdGFnZS0xLCByZXNvdXJjZXM6cmVzb3VyY2VzLCBpbWFnZXM6aW1hZ2VzfTsgLy8gbWF5YmUgc3RhZ2UgKyAxIHdvdWxkIGJlIGJldHRlciBiZWNhdXNlIHRoZXkgYXJlIG5vdCB6ZXJvIGluZGV4ZWQ/XHJcblx0XHRcdCAgIFxyXG59XHJcblx0XHRcdFx0XHQgXHJcbi8vICoqKioqKioqKioqKioqKioqKioqKiogU0FWSU5HICoqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLyogaGVyZSdzIHRoZSBnZW5lcmFsIG91dGxpbmUgb2Ygd2hhdCBpcyBoYXBwZW5pbmc6XHJcbnNlbGVjdFNhdmVMb2NhdGlvbiB3YXMgdGhlIG9sZCB3YXkgb2YgZG9pbmcgdGhpbmdzXHJcbm5vdyB3ZSB1c2UgY3JlYXRlWmlwXHJcbiAtIHdoZW4gdGhpcyB3aG9sZSB0aGluZyBzdGFydHMsIHdlIHJlcXVlc3QgYSBmaWxlIHN5c3RlbSBhbmQgc2F2ZSBhbGwgdGhlIGVudHJpZXMgKGRpcmVjdG9yaWVzIGFuZCBmaWxlcykgdG8gdGhlIGFsbEVudHJpZXMgdmFyaWFibGVcclxuIC0gdGhlbiB3ZSBnZXQgdGhlIGJsb2JzIHVzaW5nIHJlYWRBc0JpbmFyeVN0cmluZyBhbmQgc3RvcmUgdGhvc2UgaW4gYW4gYXJyYXkgd2hlbiB3ZSBhcmUgc2F2aW5nIFxyXG4gIC0gLSBjb3VsZCBkbyB0aGF0IG9uIHBhZ2UgbG9hZCB0byBzYXZlIHRpbWUgbGF0ZXIuLj9cclxuIC0gYW55d2F5LCB0aGVuIHdlIC0gaW4gdGhlb3J5IC0gdGFrZSB0aGUgYmxvYnMgYW5kIHVzZSB6aXAuZmlsZShlbnRyeS5uYW1lLCBibG9iKSB0byByZWNyZWF0ZSB0aGUgc3RydWN0dXJlXHJcbiAtIGFuZCBmaW5hbGx5IHdlIGRvd25sb2FkIHRoZSB6aXAgd2l0aCBkb3dubG9hZCgpXHJcbiBcclxuKi9cclxuXHJcbi8vIGNhbGxlZCB3aGVuIHRoZSBnYW1lIGlzIGxvYWRlZCwgYWRkIG9uY2xpY2sgdG8gc2F2ZSBidXR0b24gdGhhdCBhY3R1YWxseSBkb2VzIHRoZSBzYXZpbmdcclxubS5wcmVwYXJlWmlwID0gZnVuY3Rpb24oc2F2ZUJ1dHRvbikge1xyXG5cdC8vdmFyIGNvbnRlbnQgPSB6aXAuZ2VuZXJhdGUoKTtcclxuXHRcclxuXHQvL2NvbnNvbGUubG9nKFwicHJlcGFyZSB6aXBcIik7XHJcblx0XHJcblx0Ly8gY29kZSBmcm9tIEpTWmlwIHNpdGVcclxuXHRpZiAoSlNaaXAuc3VwcG9ydC5ibG9iKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKFwic3VwcG9ydHMgYmxvYlwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gbGluayBkb3dubG9hZCB0byBjbGlja1xyXG5cdFx0c2F2ZUJ1dHRvbi5vbmNsaWNrID0gc2F2ZUlQQVI7XHJcbiAgXHR9XHJcbn1cclxuXHJcbi8vIGNyZWF0ZSBJUEFSIGZpbGUgYW5kIGRvd25sb2FkIGl0XHJcbmZ1bmN0aW9uIHNhdmVJUEFSKCkge1xyXG5cdFxyXG5cdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKTtcclxuXHRcclxuXHR2YXIgemlwID0gbmV3IEpTWmlwKCk7XHJcblx0emlwLmZpbGUoXCJjYXNlRmlsZS5pcGFyZGF0YVwiLCBjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0emlwLmZpbGUoXCJzYXZlRmlsZS5pcGFyZGF0YVwiLCBjYXNlRGF0YS5zYXZlRmlsZSk7XHJcblx0dmFyIHN1Ym1pdHRlZCA9IHppcC5mb2xkZXIoJ3N1Ym1pdHRlZCcpO1xyXG5cdGZvciAodmFyIGZpbGUgaW4gY2FzZURhdGEuc3VibWl0dGVkKSB7XHJcblx0XHRpZiAoIWNhc2VEYXRhLnN1Ym1pdHRlZC5oYXNPd25Qcm9wZXJ0eShmaWxlKSkgY29udGludWU7XHJcblx0XHR2YXIgc3RhcnQgPSBjYXNlRGF0YS5zdWJtaXR0ZWRbZmlsZV0uaW5kZXhPZihcImJhc2U2NCxcIikrXCJiYXNlNjQsXCIubGVuZ3RoO1xyXG5cdFx0c3VibWl0dGVkLmZpbGUoZmlsZSwgY2FzZURhdGEuc3VibWl0dGVkW2ZpbGVdLnN1YnN0cihzdGFydCksIHtiYXNlNjQ6IHRydWV9KTtcclxuXHR9XHJcblxyXG5cdFxyXG5cdHppcC5nZW5lcmF0ZUFzeW5jKHt0eXBlOlwiYmFzZTY0XCJ9KS50aGVuKGZ1bmN0aW9uIChiYXNlNjQpIHtcclxuXHRcdHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcblx0XHRhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRhLmhyZWYgPSBcImRhdGE6YXBwbGljYXRpb24vemlwO2Jhc2U2NCxcIiArIGJhc2U2NDtcclxuXHRcdGEuZG93bmxvYWQgPSBsb2NhbFN0b3JhZ2VbJ2Nhc2VOYW1lJ107XHJcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG5cdFx0YS5jbGljaygpO1xyXG5cdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcclxuXHR9KTtcclxuXHRcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqIENBQ0hJTkcgKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbm0ucmVtb3ZlRmlsZXNGb3IgPSBmdW5jdGlvbihjYXNlRGF0YSwgdG9SZW1vdmUpe1xyXG5cclxuXHR2YXIgcXVlc3Rpb25EYXRhID0gdG9SZW1vdmUuYm9hcmQrXCItXCIrdG9SZW1vdmUucXVlc3Rpb24rXCItXCI7XHJcblx0Zm9yKHZhciBmaWxlIGluIGNhc2VEYXRhLnN1Ym1pdHRlZCl7XHJcblx0XHRpZiAoIWNhc2VEYXRhLnN1Ym1pdHRlZC5oYXNPd25Qcm9wZXJ0eShmaWxlKSB8fCAhZmlsZS5zdGFydHNXaXRoKHF1ZXN0aW9uRGF0YSkpIGNvbnRpbnVlO1xyXG5cdFx0ZGVsZXRlIGNhc2VEYXRhLnN1Ym1pdHRlZFtmaWxlXTtcclxuXHR9XHJcblx0XHJcbn1cclxuXHJcbi8vIEFkZHMgYSBzdWJtaXR0ZWQgZmlsZSB0byB0aGUgbG9jYWwgc3RvYXJnZVxyXG5tLmFkZE5ld0ZpbGVzVG9TeXN0ZW0gPSBmdW5jdGlvbihjYXNlRGF0YSwgdG9TdG9yZSwgY2FsbGJhY2spe1xyXG5cclxuXHQvLyBVc2VkIGZvciBjYWxsYmFja1xyXG5cdHZhciB0b3RhbENCID0gMSwgY3VyQ0IgPSAwO1xyXG5cdHZhciBmaW5pc2hlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRpZigrK2N1ckNCPj10b3RhbENCKXtcclxuXHRcdFx0Y2FsbGJhY2soY2FzZURhdGEpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHRmb3IodmFyIGk9MDtpPHRvU3RvcmUuZmlsZXMubGVuZ3RoO2krKyl7XHJcblx0XHQoZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0XHR2YXIgZmlsZW5hbWUgPSB0b1N0b3JlLmJvYXJkK1wiLVwiK3RvU3RvcmUucXVlc3Rpb24rXCItXCIraStcIi1cIit0b1N0b3JlLmZpbGVzW2ldLm5hbWU7XHJcblx0XHRcdHRvdGFsQ0IrKztcclxuXHRcdFx0ZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuXHRcdFx0XHRjYXNlRGF0YS5zdWJtaXR0ZWRbZmlsZW5hbWVdID0gIGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcblx0XHRcdFx0ZmluaXNoZWQoKTtcclxuXHRcdCAgICB9O1xyXG5cdFx0ICAgIGZpbGVSZWFkZXIucmVhZEFzRGF0YVVSTCh0b1N0b3JlLmZpbGVzW2ldKTtcclxuXHRcdH0pKCk7XHJcblx0fVxyXG5cdFxyXG5cdGZpbmlzaGVkKCk7XHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIENhdGVnb3J5ID0gcmVxdWlyZShcIi4uL2Nhc2UvY2F0ZWdvcnkuanNcIik7XHJcbnZhciBSZXNvdXJjZXMgPSByZXF1aXJlKFwiLi4vY2FzZS9yZXNvdXJjZXMuanNcIik7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vZ2FtZS9jb25zdGFudHMuanMnKTtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZSgnLi4vY2FzZS9xdWVzdGlvbi5qcycpO1xyXG5cclxuLy8gUGFyc2VzIHRoZSB4bWwgY2FzZSBmaWxlc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIGtub3duIHRhZ3NcclxuLypcclxuYW5zd2VyXHJcbmJ1dHRvblxyXG5jYXRlZ29yeUxpc3RcclxuY29ubmVjdGlvbnNcclxuZWxlbWVudFxyXG5mZWVkYmFja1xyXG5pbnN0cnVjdGlvbnNcclxucmVzb3VyY2VcclxucmVzb3VyY2VMaXN0XHJcbnJlc291cmNlSW5kZXhcclxuc29mdHdhcmVMaXN0XHJcbnF1ZXN0aW9uXHJcbnF1ZXN0aW9uVGV4dFxyXG5xdXN0aW9uTmFtZVxyXG4qL1xyXG5cclxuLy8gY29udmVyc2lvblxyXG52YXIgc3RhdGVDb252ZXJ0ZXIgPSB7XHJcblx0XCJoaWRkZW5cIiA6IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLkhJRERFTixcclxuXHRcInVuc29sdmVkXCIgOiAgUXVlc3Rpb24uU09MVkVfU1RBVEUuVU5TT0xWRUQsXHJcblx0XCJjb3JyZWN0XCIgOiAgUXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEXHJcbn1cclxuLy8gY29udmVyc2lvblxyXG52YXIgcmV2ZXJzZVN0YXRlQ29udmVydGVyID0gW1wiaGlkZGVuXCIsIFwidW5zb2x2ZWRcIiwgXCJjb3JyZWN0XCJdO1xyXG5cclxudmFyIGZpcnN0TmFtZSA9IFwidW5hc3NpZ25lZFwiO1xyXG52YXIgbGFzdE5hbWUgPSBcInVuYXNzaWduZWRcIjtcclxudmFyIGVtYWlsID0gXCJlbWFpbFwiO1xyXG5cclxuLy8gTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cdFx0XHRcdFxyXG4vLyAqKioqKioqKioqKioqKioqKioqKioqIExPQURJTkcgKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4vLyBzZXQgdGhlIHF1ZXN0aW9uIHN0YXRlc1xyXG5tLmFzc2lnblF1ZXN0aW9uU3RhdGVzID0gZnVuY3Rpb24oY2F0ZWdvcmllcywgcXVlc3Rpb25FbGVtcykge1xyXG5cclxuXHR2YXIgdGFsbHkgPSAwOyAvLyB0cmFjayB0b3RhbCBpbmRleCBpbiBuZXN0ZWQgbG9vcFxyXG5cdFxyXG5cdC8vIGFsbCBxdWVzdGlvbnNcclxuXHRmb3IgKHZhciBpPTA7IGk8Y2F0ZWdvcmllcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgaj0wOyBqPGNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zLmxlbmd0aDsgaisrLCB0YWxseSsrKSB7XHJcblx0XHRcdC8vIHN0b3JlIHF1ZXN0aW9uICBmb3IgZWFzeSByZWZlcmVuY2VcclxuXHRcdFx0dmFyIHEgPSBjYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIHN0b3JlIHRhZyBmb3IgZWFzeSByZWZlcmVuY2VcclxuXHRcdFx0dmFyIHFFbGVtID0gcXVlc3Rpb25FbGVtc1t0YWxseV07XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBzdGF0ZVxyXG5cdFx0XHRxLmN1cnJlbnRTdGF0ZSA9IHN0YXRlQ29udmVydGVyW3FFbGVtLmdldEF0dHJpYnV0ZShcInF1ZXN0aW9uU3RhdGVcIildO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8ganVzdGlmaWNhdGlvblxyXG5cdFx0XHRpZihxLmp1c3RpZmljYXRpb24pXHJcblx0XHRcdFx0cS5qdXN0aWZpY2F0aW9uLnZhbHVlID0gcUVsZW0uZ2V0QXR0cmlidXRlKFwianVzdGlmaWNhdGlvblwiKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIENhbGwgY29ycmVjdCBhbnN3ZXIgaWYgc3RhdGUgaXMgY29ycmVjdFxyXG5cdFx0XHRpZihxLmN1cnJlbnRTdGF0ZT09UXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEKVxyXG5cdFx0XHQgIHEuY29ycmVjdEFuc3dlcigpO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHQvLyB4cG9zXHJcblx0XHRcdHEucG9zaXRpb25QZXJjZW50WCA9IFV0aWxpdGllcy5tYXAocGFyc2VJbnQocUVsZW0uZ2V0QXR0cmlidXRlKFwicG9zaXRpb25QZXJjZW50WFwiKSksIDAsIDEwMCwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS54KTtcclxuXHRcdFx0Ly8geXBvc1xyXG5cdFx0XHRxLnBvc2l0aW9uUGVyY2VudFkgPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHFFbGVtLmdldEF0dHJpYnV0ZShcInBvc2l0aW9uUGVyY2VudFlcIikpLCAwLCAxMDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueSk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxubS5nZXRSZXNvdXJjZXMgPSBmdW5jdGlvbih4bWxEYXRhKXtcclxuXHR2YXIgcmVzb3VyY2VFbGVtZW50cyA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJyZXNvdXJjZUxpc3RcIilbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJyZXNvdXJjZVwiKTtcclxuXHRyZXR1cm4gbmV3IFJlc291cmNlcyhyZXNvdXJjZUVsZW1lbnRzLCB4bWxEYXRhKTtcclxufVxyXG5cclxuLy8gdGFrZXMgdGhlIHhtbCBzdHJ1Y3R1cmUgYW5kIGZpbGxzIGluIHRoZSBkYXRhIGZvciB0aGUgcXVlc3Rpb24gb2JqZWN0XHJcbm0uZ2V0Q2F0ZWdvcmllc0FuZFF1ZXN0aW9ucyA9IGZ1bmN0aW9uKHhtbERhdGEsIHJlc291cmNlcywgd2luZG93RGl2KSB7XHJcblx0Ly8gaWYgdGhlcmUgaXMgYSBjYXNlIGZpbGVcclxuXHRpZiAoeG1sRGF0YSAhPSBudWxsKSB7XHJcblx0XHRcclxuXHRcdC8vIEdldCBwbGF5ZXIgZGF0YSBcclxuXHRcdGZpcnN0TmFtZSA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmdldEF0dHJpYnV0ZShcInByb2ZpbGVGaXJzdFwiKTtcclxuXHRcdGxhc3ROYW1lID0geG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uZ2V0QXR0cmlidXRlKFwicHJvZmlsZUxhc3RcIik7XHJcblx0XHR4bWxEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FzZVwiKVswXS5nZXRBdHRyaWJ1dGUoXCJwcm9maWxlTWFpbFwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gVGhlbiBsb2FkIHRoZSBjYXRlZ29yaWVzXHJcblx0XHR2YXIgY2F0ZWdvcnlFbGVtZW50cyA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKTtcclxuXHRcdHZhciBjYXRlZ29yeU5hbWVzID0geG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIik7XHJcblx0XHR2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGNhdGVnb3J5RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Ly8gTG9hZCBlYWNoIGNhdGVnb3J5ICh3aGljaCBsb2FkcyBlYWNoIHF1ZXN0aW9uKVxyXG5cdFx0XHRjYXRlZ29yaWVzW3BhcnNlSW50KGNhdGVnb3J5RWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKFwiY2F0ZWdvcnlEZXNpZ25hdGlvblwiKSldID0gbmV3IENhdGVnb3J5KGNhdGVnb3J5TmFtZXNbaV0uaW5uZXJIVE1MLCBjYXRlZ29yeUVsZW1lbnRzW2ldLCByZXNvdXJjZXMsIHdpbmRvd0Rpdik7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2F0ZWdvcmllcztcclxuXHR9XHJcblx0cmV0dXJuIG51bGxcclxufVxyXG5cclxuLy8gY3JlYXRlcyBhIGNhc2UgZmlsZSBmb3IgemlwcGluZ1xyXG5tLnJlY3JlYXRlQ2FzZUZpbGUgPSBmdW5jdGlvbihib2FyZHMpIHtcclxuXHJcblx0Ly8gY3JlYXRlIHNhdmUgZmlsZSB0ZXh0XHJcblx0dmFyIGRhdGFUb1NhdmUgPSBtLmNyZWF0ZVhNTFNhdmVGaWxlKGJvYXJkcywgdHJ1ZSk7XHJcblx0XHJcblx0Ly9pZiAoY2FsbGJhY2spIGNhbGxiYWNrKGRhdGFUb1NhdmUpO1xyXG5cdHJldHVybiBkYXRhVG9TYXZlO1xyXG5cdFxyXG59XHJcblxyXG4vLyBjcmVhdGVzIHRoZSB4bWxcclxubS5jcmVhdGVYTUxTYXZlRmlsZSA9IGZ1bmN0aW9uKGFjdGl2ZUluZGV4LCBib2FyZHMsIGluY2x1ZGVOZXdsaW5lKSB7XHJcblx0Ly8gbmV3bGluZVxyXG5cdHZhciBubDtcclxuXHRpbmNsdWRlTmV3bGluZSA/IG5sID0gXCJcXG5cIiA6IG5sID0gXCJcIjtcclxuXHQvLyBoZWFkZXJcclxuXHR2YXIgb3V0cHV0ID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cInV0Zi04XCI/PicgKyBubDtcclxuXHQvLyBjYXNlIGRhdGFcclxuXHRvdXRwdXQgKz0gJzxjYXNlIGNhdGVnb3J5SW5kZXg9XCIzXCIgY2FzZVN0YXR1cz1cIicrKGFjdGl2ZUluZGV4KzEpKydcIiBwcm9maWxlRmlyc3Q9XCInKyBmaXJzdE5hbWUgKydcIiBwcm9maWxlTGFzdD1cIicgKyBsYXN0TmFtZSArICdcIiBwcm9maWxlTWFpbD1cIicrIGVtYWlsICsnXCI+JyArIG5sO1xyXG5cdC8vIHF1ZXN0aW9ucyBoZWFkZXJcclxuXHRvdXRwdXQgKz0gJzxxdWVzdGlvbnM+JyArIG5sO1xyXG5cdFxyXG5cdC8vIGxvb3AgdGhyb3VnaCBxdWVzdGlvbnNcclxuXHRmb3IgKHZhciBpPTA7IGk8Ym9hcmRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRmb3IgKHZhciBqPTA7IGo8Ym9hcmRzW2ldLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGorKykge1xyXG5cdFx0XHQvLyBzaG9ydGhhbmRcclxuXHRcdFx0dmFyIHEgPSBib2FyZHNbaV0ubGVzc29uTm9kZUFycmF5W2pdLnF1ZXN0aW9uO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gdGFnIHN0YXJ0XHJcblx0XHRcdG91dHB1dCArPSAnPHF1ZXN0aW9uICc7XHJcblxyXG5cdFx0XHQvLyBxdWVzdGlvblN0YXRlXHJcblx0XHRcdG91dHB1dCArPSAncXVlc3Rpb25TdGF0ZT1cIicgKyByZXZlcnNlU3RhdGVDb252ZXJ0ZXJbcS5jdXJyZW50U3RhdGVdICsgJ1wiICc7XHJcblx0XHRcdC8vIGp1c3RpZmljYXRpb25cclxuXHRcdFx0dmFyIG5ld0p1c3RpZmljYXRpb24gPSBxLmp1c3RpZmljYXRpb24udmFsdWU7XHJcblx0XHRcdHZhciBqdXN0aWZpY2F0aW9uO1xyXG5cdFx0XHRuZXdKdXN0aWZpY2F0aW9uID8ganVzdGlmaWNhdGlvbiA9IG5ld0p1c3RpZmljYXRpb24gOiBqdXN0aWZpY2F0aW9uID0gcS5qdXN0aWZpY2F0aW9uU3RyaW5nO1xyXG5cdFx0XHQvLyBoYW5kbGUgdW5kZWZpbmVkXHJcblx0XHRcdGlmICghanVzdGlmaWNhdGlvbikganVzdGlmaWNhdGlvbiA9IFwiXCI7XHJcblx0XHRcdG91dHB1dCArPSAnanVzdGlmaWNhdGlvbj1cIicgKyBqdXN0aWZpY2F0aW9uICsgJ1wiICc7XHJcblx0XHRcdC8vIGFuaW1hdGVkXHJcblx0XHRcdG91dHB1dCArPSAnYW5pbWF0ZWQ9XCInICsgKHEuY3VycmVudFN0YXRlID09IDIpICsgJ1wiICc7IC8vIG1pZ2h0IGhhdmUgdG8gZml4IHRoaXMgbGF0ZXJcclxuXHRcdFx0Ly8gbGluZXNUcmFuY2VkXHJcblx0XHRcdG91dHB1dCArPSAnbGluZXNUcmFjZWQ9XCIwXCIgJzsgLy8gbWlnaHQgaGF2ZSB0byBmaXggdGhpcyB0b29cclxuXHRcdFx0Ly8gcmV2ZWFsVGhyZXNob2xkXHJcblx0XHRcdG91dHB1dCArPSAncmV2ZWFsVGhyZXNob2xkICA9XCInICsgcS5yZXZlYWxUaHJlc2hvbGQgICsnXCIgJzsgLy8gYW5kIHRoaXNcclxuXHRcdFx0Ly8gcG9zaXRpb25QZXJjZW50WFxyXG5cdFx0XHRvdXRwdXQgKz0gJ3Bvc2l0aW9uUGVyY2VudFg9XCInICsgVXRpbGl0aWVzLm1hcChxLnBvc2l0aW9uUGVyY2VudFgsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueCwgMCwgMTAwKSArICdcIiAnO1xyXG5cdFx0XHQvLyBwb3NpdGlvblBlcmNlbnRZXHJcblx0XHRcdG91dHB1dCArPSAncG9zaXRpb25QZXJjZW50WT1cIicgKyBVdGlsaXRpZXMubWFwKHEucG9zaXRpb25QZXJjZW50WSwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55LCAwLCAxMDApICsgJ1wiICc7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyB0YWcgZW5kXHJcblx0XHRcdG91dHB1dCArPSAnLz4nICsgbmw7XHJcblx0XHR9XHJcblx0fVxyXG5cdG91dHB1dCArPSBcIjwvcXVlc3Rpb25zPlwiICsgbmw7XHJcblx0b3V0cHV0ICs9IFwiPC9jYXNlPlwiICsgbmw7XHJcblx0cmV0dXJuIG91dHB1dDtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmZ1bmN0aW9uIEtleWJvYXJkU3RhdGUoZ2FtZSl7XHJcblx0dGhpcy5rZXkgPSBbXTtcclxuXHR0aGlzLnByZUtleSA9IFtdO1xyXG5cdHRoaXMua2V5UHJlc3NlZCA9IFtdO1xyXG5cdHRoaXMua2V5UmVsZWFzZWQgPSBbXTtcclxuICAgIHZhciBrZXlib2FyZFN0YXRlID0gdGhpcztcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0aWYoZ2FtZS5hY3RpdmUpXHJcbiAgICBcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRrZXlib2FyZFN0YXRlLmtleVtlLmtleUNvZGVdID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0aWYoZ2FtZS5hY3RpdmUpXHJcbiAgICBcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRrZXlib2FyZFN0YXRlLmtleVtlLmtleUNvZGVdID0gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIHAgPSBLZXlib2FyZFN0YXRlLnByb3RvdHlwZTtcclxuXHJcbi8vVXBkYXRlIHRoZSBtb3VzZSB0byB0aGUgY3VycmVudCBzdGF0ZVxyXG5wLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5rZXlQcmVzc2VkLmxlbmd0aDtpKyspXHJcblx0XHRpZih0aGlzLmtleVByZXNzZWRbaV0pXHJcblx0XHRcdHRoaXMua2V5UHJlc3NlZFtpXSA9IGZhbHNlO1xyXG5cclxuXHRmb3IodmFyIGk9MDtpPHRoaXMua2V5UmVsZWFzZWQubGVuZ3RoO2krKylcclxuXHRcdGlmKHRoaXMua2V5UmVsZWFzZWRbaV0pXHJcblx0XHRcdHRoaXMua2V5UmVsZWFzZWRbaV0gPSBmYWxzZTtcclxuXHRcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMua2V5Lmxlbmd0aDtpKyspe1xyXG5cdFx0aWYodGhpcy5wcmVLZXlbaV0gJiYgIXRoaXMua2V5W2ldKVxyXG5cdFx0XHR0aGlzLmtleVJlbGVhc2VkW2ldID0gdHJ1ZTtcclxuXHRcdGlmKCF0aGlzLnByZUtleVtpXSAmJiB0aGlzLmtleVtpXSlcclxuXHRcdFx0dGhpcy5rZXlQcmVzc2VkW2ldID0gdHJ1ZTtcclxuXHRcdHRoaXMucHJlS2V5W2ldID0gdGhpcy5rZXlbaV07XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkU3RhdGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxuXHJcbi8vIHByaXZhdGUgdmFyaWFibGVzXHJcbnZhciByZWxhdGl2ZU1vdXNlUG9zaXRpb247XHJcbnZhciBtb3VzZURvd25UaW1lciwgbGVmdE1vdXNlQ2xpY2tlZCwgbWF4Q2xpY2tEdXJhdGlvbjtcclxudmFyIG1vdXNlV2hlZWxWYWw7XHJcbnZhciBwcmV2VGltZTtcclxudmFyIGRlbHRhWTtcclxudmFyIHNjYWxpbmcsIHRvdWNoWm9vbSwgc3RhcnRUb3VjaFpvb207XHJcblxyXG5mdW5jdGlvbiBtb3VzZVN0YXRlKCl7XHJcblx0dGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcclxuICAgIHRoaXMudmlydHVhbFBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICBcclxuICAgIC8vIFNldCB2YXJpYWJsZSBkZWZhdWx0c1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgIHRoaXMubW91c2VJbiA9IGZhbHNlO1xyXG4gICAgbW91c2VEb3duVGltZXIgPSAwO1xyXG4gICAgZGVsdGFZID0gMDtcclxuICAgIHRoaXMubW91c2VXaGVlbERZID0gMDtcclxuICAgIHRoaXMuem9vbURpZmYgPSAwO1xyXG4gICAgdG91Y2hab29tID0gMDtcclxuICAgIHRoaXMubW91c2VDbGlja2VkID0gZmFsc2U7XHJcbiAgICBsZWZ0TW91c2VDbGlja2VkID0gZmFsc2U7XHJcbiAgICBtYXhDbGlja0R1cmF0aW9uID0gMjAwO1xyXG5cdFxyXG59XHJcblxyXG52YXIgcCA9IG1vdXNlU3RhdGUucHJvdG90eXBlO1xyXG5cclxuLy9ldmVudCBsaXN0ZW5lcnMgZm9yIG1vdXNlIGludGVyYWN0aW9ucyB3aXRoIHRoZSBjYW52YXNlc1xyXG5wLmFkZENhbnZhcyA9IGZ1bmN0aW9uKGNhbnZhcyl7XHJcbiAgICB2YXIgbW91c2VTdGF0ZSA9IHRoaXM7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRtb3VzZVN0YXRlLnVwZGF0ZVBvc2l0aW9uKGUpO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRpZihzY2FsaW5nKVxyXG4gICAgXHRcdG1vdXNlU3RhdGUudXBkYXRlVG91Y2hQb3NpdGlvbnMoZSk7XHJcbiAgICBcdGVsc2VcclxuICAgIFx0XHRtb3VzZVN0YXRlLnVwZGF0ZVBvc2l0aW9uKGUudG91Y2hlc1swXSk7XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBcdGlmIChlLndoaWNoICYmIGUud2hpY2ghPTMgfHwgZS5idXR0b24gJiYgZS5idXR0b24hPTIpXHJcblx0ICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgXHRsZWZ0TW91c2VDbGlja2VkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBcdGlmKGUudG91Y2hlcy5sZW5ndGggPT0gMSAmJiAhc2NhbGluZyl7XHJcbiAgICBcdFx0bW91c2VTdGF0ZS51cGRhdGVQb3NpdGlvbihlLnRvdWNoZXNbMF0pO1xyXG5cdCAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdCAgICAgICAgXHRtb3VzZVN0YXRlLm1vdXNlRG93biA9IHRydWU7XHJcblx0ICAgICAgICB9KTtcclxuICAgIFx0fVxyXG4gICAgXHRlbHNlIGlmKGUudG91Y2hlcy5sZW5ndGggPT0gMil7XHJcbiAgICBcdFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgIFx0XHRzY2FsaW5nID0gdHJ1ZTtcclxuICAgIFx0XHRtb3VzZVN0YXRlLnVwZGF0ZVRvdWNoUG9zaXRpb25zKGUpO1xyXG4gICAgXHRcdHN0YXJ0VG91Y2hab29tID0gdG91Y2hab29tO1xyXG4gICAgXHR9XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHRpZiAoZS53aGljaCAmJiBlLndoaWNoIT0zIHx8IGUuYnV0dG9uICYmIGUuYnV0dG9uIT0yKVxyXG5cdCAgICBcdG1vdXNlU3RhdGUubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFx0aWYoc2NhbGluZyl7XHJcbiAgICBcdFx0c2NhbGluZyA9IGZhbHNlO1xyXG4gICAgXHQgICAgdG91Y2hab29tID0gMDtcclxuICAgIFx0ICAgIHN0YXJ0VG91Y2hab29tID0gMDtcclxuICAgIFx0fVxyXG4gICAgXHRtb3VzZVN0YXRlLm1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0bW91c2VTdGF0ZS5tb3VzZUluID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCBmdW5jdGlvbihlKXtcclxuICAgIFx0bW91c2VTdGF0ZS5tb3VzZUluID0gZmFsc2U7XHJcbiAgICBcdG1vdXNlU3RhdGUubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJyxmdW5jdGlvbihldmVudCl7XHJcbiAgICBcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZGVsdGFZICs9IGV2ZW50LmRlbHRhWTtcclxuICAgIH0sIGZhbHNlKTtcclxufVxyXG5cclxucC51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgIHJlbGF0aXZlTW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCh0aGlzLm1vdXNlUG9zaXRpb24ueCAtICh3aW5kb3cuaW5uZXJXaWR0aC8yLjApLCB0aGlzLm1vdXNlUG9zaXRpb24ueSAtICh3aW5kb3cuaW5uZXJIZWlnaHQvMi4wKSk7XHJcbn1cclxuXHJcbnAudXBkYXRlVG91Y2hQb3NpdGlvbnMgPSBmdW5jdGlvbihlKXtcclxuXHR2YXIgY3VyVG91Y2hlcyA9IFtcclxuXHQgICAgICAgICAgICAgICBuZXcgUG9pbnQoZS50b3VjaGVzWzBdLmNsaWVudFgsIGUudG91Y2hlc1swXS5jbGllbnRZKSxcclxuXHQgICAgICAgICAgICAgICBuZXcgUG9pbnQoZS50b3VjaGVzWzFdLmNsaWVudFgsIGUudG91Y2hlc1sxXS5jbGllbnRZKVxyXG5cdF07XHJcblx0dG91Y2hab29tID0gTWF0aC5zcXJ0KE1hdGgucG93KGN1clRvdWNoZXNbMF0ueC1jdXJUb3VjaGVzWzFdLngsIDIpK01hdGgucG93KGN1clRvdWNoZXNbMF0ueS1jdXJUb3VjaGVzWzFdLnksIDIpKTtcclxufVxyXG5cclxuLy8gVXBkYXRlIHRoZSBtb3VzZSB0byB0aGUgY3VycmVudCBzdGF0ZVxyXG5wLnVwZGF0ZSA9IGZ1bmN0aW9uKGR0LCBzY2FsZSl7XHJcbiAgICBcclxuXHQvLyBTYXZlIHRoZSBjdXJyZW50IHZpcnR1YWwgcG9zaXRpb24gZnJvbSBzY2FsZVxyXG5cdHRoaXMudmlydHVhbFBvc2l0aW9uID0gbmV3IFBvaW50KHJlbGF0aXZlTW91c2VQb3NpdGlvbi54L3NjYWxlLCByZWxhdGl2ZU1vdXNlUG9zaXRpb24ueS9zY2FsZSk7O1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgY3VycnRlbmwgZGVsdGEgeSBmb3IgdGhlIG1vdXNlIHdoZWVsXHJcbiAgICB0aGlzLm1vdXNlV2hlZWxEWSA9IGRlbHRhWTtcclxuICAgIGRlbHRhWSA9IDA7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgem9vbSBkaWZmIGFuZCBwcmV2IHpvb21cclxuXHRpZihzY2FsaW5nKVxyXG5cdFx0dGhpcy56b29tRGlmZiA9IHN0YXJ0VG91Y2hab29tIC0gdG91Y2hab29tO1xyXG5cdGVsc2VcclxuXHRcdHRoaXMuem9vbURpZmYgPSAwO1xyXG4gICAgXHJcbiAgICAvLyBjaGVjayBtb3VzZSBjbGlja1xyXG4gICAgdGhpcy5tb3VzZUNsaWNrZWQgPSBmYWxzZTtcclxuICAgIGlmICh0aGlzLm1vdXNlRG93bilcclxuICAgIFx0bW91c2VEb3duVGltZXIgKz0gZHQ7XHJcbiAgICBlbHNle1xyXG4gICAgXHRpZiAobW91c2VEb3duVGltZXIgPiAwICYmIG1vdXNlRG93blRpbWVyIDwgbWF4Q2xpY2tEdXJhdGlvbilcclxuICAgIFx0XHR0aGlzLm1vdXNlQ2xpY2tlZCA9IHRydWU7XHJcbiAgICBcdG1vdXNlRG93blRpbWVyID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5wcmV2TW91c2VEb3duID0gdGhpcy5tb3VzZURvd247XHJcbiAgICB0aGlzLmhhc1RhcmdldCA9IGZhbHNlO1xyXG4gICAgXHJcbn1cclxuXHJcbnAubGVmdE1vdXNlQ2xpY2tlZCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciB0ZW1wID0gbGVmdE1vdXNlQ2xpY2tlZDtcclxuXHRsZWZ0TW91c2VDbGlja2VkID0gZmFsc2U7XHJcblx0cmV0dXJuIHRlbXA7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbW91c2VTdGF0ZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuZnVuY3Rpb24gUG9pbnQocFgsIHBZKXtcclxuICAgIHRoaXMueCA9IHBYO1xyXG4gICAgdGhpcy55ID0gcFk7XHJcbn1cclxuXHJcbnZhciBwID0gUG9pbnQucHJvdG90eXBlO1xyXG5cclxucC5hZGQgPSBmdW5jdGlvbihwWCwgcFkpe1xyXG5cdGlmKHBZKVxyXG5cdFx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLngrcFgsIHRoaXMueStwWSk7XHJcblx0ZWxzZVxyXG5cdFx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLngrcFgueCwgdGhpcy55K3BYLnkpO1xyXG59XHJcblxyXG5wLm11bHQgPSBmdW5jdGlvbihwWCwgcFkpe1xyXG5cdGlmKHBZKVxyXG5cdFx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLngqcFgsIHRoaXMueSpwWSk7XHJcblx0ZWxzZVxyXG5cdFx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLngqcFgueCwgdGhpcy55KnBYLnkpO1xyXG59XHJcblxyXG5wLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xyXG5cdHJldHVybiBuZXcgUG9pbnQodGhpcy54KnNjYWxlLCB0aGlzLnkqc2NhbGUpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50OyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbi8vIHJldHVybnMgbW91c2UgcG9zaXRpb24gaW4gbG9jYWwgY29vcmRpbmF0ZSBzeXN0ZW0gb2YgZWxlbWVudFxyXG5tLmdldE1vdXNlID0gZnVuY3Rpb24oZSl7XHJcbiAgICByZXR1cm4gbmV3IFBvaW50KChlLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCksIChlLnBhZ2VZIC0gZS50YXJnZXQub2Zmc2V0VG9wKSk7XHJcbn1cclxuXHJcbi8vcmV0dXJucyBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSByYXRpbyBpdCBoYXMgd2l0aCBhIHNwZWNpZmljIHJhbmdlIFwibWFwcGVkXCIgdG8gYSBkaWZmZXJlbnQgcmFuZ2VcclxubS5tYXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluMSwgbWF4MSwgbWluMiwgbWF4Mil7XHJcbiAgICByZXR1cm4gbWluMiArIChtYXgyIC0gbWluMikgKiAoKHZhbHVlIC0gbWluMSkgLyAobWF4MSAtIG1pbjEpKTtcclxufVxyXG5cclxuLy9pZiBhIHZhbHVlIGlzIGhpZ2hlciBvciBsb3dlciB0aGFuIHRoZSBtaW4gYW5kIG1heCwgaXQgaXMgXCJjbGFtcGVkXCIgdG8gdGhhdCBvdXRlciBsaW1pdFxyXG5tLmNsYW1wID0gZnVuY3Rpb24odmFsdWUsIG1pbiwgbWF4KXtcclxuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcclxufVxyXG5cclxuLy9kZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vdXNlIGlzIGludGVyc2VjdGluZyB0aGUgYXJlYVxyXG5tLm1vdXNlSW50ZXJzZWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUsIGFyZWEsIHBPZmZzZXR0ZXIpe1xyXG4gICAgaWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPiBhcmVhLnBvc2l0aW9uLnggLSBhcmVhLndpZHRoLzIgLSBwT2Zmc2V0dGVyLnggJiYgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPCBhcmVhLnBvc2l0aW9uLnggKyBhcmVhLndpZHRoLzIgLSBwT2Zmc2V0dGVyLnggJiZcclxuICAgIFx0XHRwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSA+IGFyZWEucG9zaXRpb24ueSAtIGFyZWEuaGVpZ2h0LzIgLSBwT2Zmc2V0dGVyLnkgJiYgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPCBhcmVhLnBvc2l0aW9uLnkgKyBhcmVhLmhlaWdodC8yIC0gcE9mZnNldHRlci55KVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIGVsc2VcclxuICAgIFx0cmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vL2RldGVybWluZXMgd2hldGhlciB0aGUgbW91c2UgaXMgaW50ZXJzZWN0aW5nIHRoZSBhcmVhIGFyb3VuZCB0aGUgZ2l2ZW4gYXJlYSBhbmQgYXQgd2hhdCBzaWRlIChyZXN1bHQgaXMgc2lkZSBuIC0gbm9ydGgsIHcgLSB3ZXN0LCBzIC0gc291dGgsIGUgLSBlYXN0LCBudyAtIG5vcnRod2VzdCwgZXRjLilcclxubS5tb3VzZUludGVyc2VjdEVkZ2UgPSBmdW5jdGlvbihwTW91c2VTdGF0ZSwgYXJlYSwgb3V0bGluZSwgcE9mZnNldHRlcil7XHJcblx0dmFyIGJvdW5kcyA9IHtsZWZ0OiBhcmVhLnBvc2l0aW9uLnggLSBhcmVhLndpZHRoLzIgLSBwT2Zmc2V0dGVyLngsXHJcblx0XHRcdFx0XHRyaWdodDogYXJlYS5wb3NpdGlvbi54ICsgYXJlYS53aWR0aC8yIC0gcE9mZnNldHRlci54LFxyXG5cdFx0XHRcdFx0dG9wOiBhcmVhLnBvc2l0aW9uLnkgLSBhcmVhLmhlaWdodC8yIC0gcE9mZnNldHRlci55LFxyXG5cdFx0XHRcdFx0Ym90dG9tOiBhcmVhLnBvc2l0aW9uLnkgKyBhcmVhLmhlaWdodC8yIC0gcE9mZnNldHRlci55fTtcclxuICAgIGlmIChwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueCA+IGJvdW5kcy5sZWZ0IC0gb3V0bGluZSAmJiBwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueCA8IGJvdW5kcy5yaWdodCArIG91dGxpbmUgJiZcclxuICAgIFx0XHRwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSA+IGJvdW5kcy50b3AgLSBvdXRsaW5lICYmIHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IDwgYm91bmRzLmJvdHRvbSArIG91dGxpbmUpe1xyXG4gICAgXHR2YXIgc2lkZSA9ICcnO1xyXG4gICAgXHRpZihwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSA8PSBib3VuZHMudG9wKVxyXG4gICAgXHRcdHNpZGUgKz0gJ24nO1xyXG4gICAgXHRpZihwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueSA+PSBib3VuZHMuYm90dG9tKVxyXG4gICAgXHRcdHNpZGUgKz0gJ3MnO1xyXG4gICAgXHRpZihwTW91c2VTdGF0ZS52aXJ0dWFsUG9zaXRpb24ueCA8PSBib3VuZHMubGVmdClcclxuICAgIFx0XHRzaWRlICs9ICd3JztcclxuICAgIFx0aWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPj0gYm91bmRzLnJpZ2h0KVxyXG4gICAgXHRcdHNpZGUgKz0gJ2UnO1xyXG4gICAgXHRpZihzaWRlIT0xKVxyXG4gICAgXHRcdHJldHVybiBzaWRlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuXHJcbi8vIGdldHMgdGhlIHhtbCBvYmplY3Qgb2YgYSBzdHJpbmdcclxubS5nZXRYbWwgPSBmdW5jdGlvbih4bWwpe1xyXG5cdFxyXG5cdC8vIENsZWFuIHVwIHRoZSB4bWxcclxuXHR4bWwgPSB4bWwudHJpbSgpO1xyXG5cdHdoaWxlKHhtbC5jaGFyQ29kZUF0KDApPD0zMilcclxuXHRcdHhtbCA9IHhtbC5zdWJzdHIoMSk7XHJcblx0eG1sID0geG1sLnRyaW0oKTtcclxuXHRcclxuXHR2YXIgeG1sRG9jO1xyXG5cdGlmICh3aW5kb3cuRE9NUGFyc2VyKXtcclxuXHRcdHZhciBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHR4bWxEb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcclxuXHR9XHJcblx0ZWxzZXsgLy8gSUVcclxuXHRcdHhtbERvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTERPTVwiKTtcclxuXHRcdHhtbERvYy5hc3luYyA9IGZhbHNlO1xyXG5cdFx0eG1sRG9jLmxvYWRYTUwoeG1sKTtcclxuXHR9XHJcblx0cmV0dXJuIHhtbERvYztcclxufVxyXG5cclxuLy8gZ2V0cyB0aGUgc2NhbGUgb2YgdGhlIGZpcnN0IHBhcmFtZXRlciB0byB0aGUgc2Vjb25kICh3aXRoIHRoZSBzZWNvbmQgZml0dGluZyBpbnNpZGUgdGhlIGZpcnN0KVxyXG5tLmdldFNjYWxlID0gZnVuY3Rpb24odmlydHVhbCwgYWN0dWFsKXtcclxuXHRyZXR1cm4gYWN0dWFsLnkvdmlydHVhbC54KnZpcnR1YWwueSA8IGFjdHVhbC54ID8gYWN0dWFsLnkvdmlydHVhbC55IDogYWN0dWFsLngvdmlydHVhbC54O1xyXG59XHJcblxyXG5tLnJlcGxhY2VBbGwgPSBmdW5jdGlvbiAoc3RyLCB0YXJnZXQsIHJlcGxhY2VtZW50KSB7XHJcblx0d2hpbGUgKHN0ci5pbmRleE9mKHRhcmdldCkgPiAtMSkge1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UodGFyZ2V0LHJlcGxhY2VtZW50KTtcclxuXHR9XHJcblx0cmV0dXJuIHN0cjtcclxufVxyXG5cclxuLy8gR2V0cyB0aGUgaW5kZXggb2YgdGhlIG50aCBzZWFyY2ggc3RyaW5nIChzdGFydGluZyBhdCAxLCAwIHdpbGwgYWx3YXlzIHJldHVybiAwKVxyXG5TdHJpbmcucHJvdG90eXBlLmluZGV4T2ZBdCA9IGZ1bmN0aW9uKHNlYXJjaCwgbnVtKXtcclxuXHR2YXIgY3VySW5kZXggPSAwO1xyXG5cdGZvcih2YXIgaT0wO2k8bnVtICYmIGN1ckluZGV4IT0tMTtpKyspXHJcblx0XHRjdXJJbmRleCA9IHRoaXMuaW5kZXhPZihzZWFyY2gsIGN1ckluZGV4KzEpO1xyXG5cdHJldHVybiBjdXJJbmRleDtcclxufVxyXG4iLCJcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0uZWRpdEluZm8gPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBwb3B1cFwiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdENhc2UgSW5mb1xcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiIHN0eWxlPVwibWluLWhlaWdodDozNXZoO1wiPlxcXHJcblx0XHQ8Zm9ybSBvbnN1Ym1pdD1cInJldHVybiBmYWxzZTtcIj5cXFxyXG5cdFx0XHQ8Yj5OYW1lPC9iPjxicj5cXFxyXG5cdFx0XHQ8aW5wdXQgbmFtZT1cImNhc2VOYW1lXCIgdmFsdWU9XCIlY2FzZU5hbWUlXCI+PGJyPlxcXHJcblx0XHRcdDxiPkRlc2NyaXB0aW9uPC9iPjxicj5cXFxyXG5cdFx0IFx0PHA+PGRpdiBjbGFzcz1cInRleHQtYm94IGxhcmdlXCIgY29udGVudGVkaXRhYmxlPiVkZXNjcmlwdGlvbiU8L2Rpdj48L3A+XFxcclxuXHRcdFx0PGI+Q29uY2x1c2lvbjwvYj48YnI+XFxcclxuXHQgXHRcdDxwPjxkaXYgY2xhc3M9XCJ0ZXh0LWJveCBsYXJnZVwiIGNvbnRlbnRlZGl0YWJsZT4lY29uY2x1c2lvbiU8L2Rpdj48L3A+XFxcclxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj5CYWNrPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj5BcHBseSBDaGFuZ2VzPC9idXR0b24+XFxcclxuXHRcdDwvZm9ybT5cXFxyXG5cdDwvZGl2PlxcXHJcbjwvZGl2PlxcXHJcbic7XHJcblxyXG5tLnJlc291cmNlc1dpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93IHBvcHVwXCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0UmVzb3VyY2VzXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCI+XFxcclxuXHRcdDxkaXYgY2xhc3M9XCJyZXNvdXJjZUNvbnRlbnRcIiBzdHlsZT1cIm92ZXJmbG93LXk6c2Nyb2xsO2hlaWdodDozNXZoO1wiPlxcXHJcblx0XHQ8L2Rpdj5cXFxyXG5cdFx0PGJyPlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwiaGFsZkJ1dHRvblwiPkJhY2s8L2J1dHRvbj48YnV0dG9uIGNsYXNzPVwiaGFsZkJ1dHRvblwiPkNyZWF0ZSBOZXcgUmVzb3VyY2VzPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5yZXNvdXJjZSA9ICdcXFxyXG48ZGl2IGNsYXNzPVwicmVzb3VyY2VJdGVtXCI+XFxcclxuICA8aW1nIHNyYz1cIiVpY29uJVwiIGNsYXNzPVwiaWNvblwiLz5cXFxyXG4gIDxpbWcgc3JjPVwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIiBjbGFzcz1cImRlbGV0ZVwiLz5cXFxyXG4gIDxpbWcgc3JjPVwiLi4vaW1nL2ljb25Ub29scy5wbmdcIiBjbGFzcz1cImVkaXRcIi8+XFxcclxuICA8ZGl2IGNsYXNzPVwicmVzb3VyY2VUZXh0XCI+JXRpdGxlJVxcXHJcbiAgPGJyPlxcXHJcbiAgPHNwYW4gc3R5bGU9XCJjb2xvcjpncmF5O1wiPiVsaW5rJTwvc3Bhbj48L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5yZXNvdXJjZUVkaXRvciA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93IHBvcHVwXCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0JWVkaXQlIFJlc291cmNlXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCI+XFxcclxuXHRcdDxmb3JtIG9uc3VibWl0PVwicmV0dXJuIGZhbHNlO1wiPlxcXHJcblx0XHRcdDxzZWxlY3QgbmFtZT1cInR5cGVcIiBjbGFzcz1cImZ1bGxcIj5cXFxyXG5cdFx0XHRcdDxvcHRpb24gdmFsdWU9XCIwXCI+RmlsZSBSZWZyZW5jZTwvb3B0aW9uPlxcXHJcblx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjFcIj5XZWIgTGluazwvb3B0aW9uPlxcXHJcblx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjJcIj5WaWRlbyBMaW5rPC9vcHRpb24+XFxcclxuXHRcdFx0PC9zZWxlY3Q+XFxcclxuXHRcdFx0PGI+RGlzcGxheSBOYW1lPC9iPjxicj5cXFxyXG5cdFx0XHQ8aW5wdXQgbmFtZT1cIm5hbWVcIiB2YWx1ZT1cIiVuYW1lJVwiPjxicj5cXFxyXG5cdFx0XHQ8YiBjbGFzcz1cImFkZHJlc3NUYWdcIj5MaW5rIEFkZHJlc3M8L2I+PGJyPlxcXHJcblx0XHRcdDxpbnB1dCBjbGFzcz1cImFkZHJlc3NcIiBuYW1lPVwibGlua1wiIHZhbHVlPVwiJWxpbmslXCI+XFxcclxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj5DaG9vc2UgRmlsZTwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+VmlldyBGaWxlPC9idXR0b24+XFxcclxuXHRcdFx0PHNwYW4gY2xhc3M9XCJhZGRyZXNzSW5mb1wiPjwvc3Bhbj5cXFxyXG5cdFx0PC9mb3JtPlxcXHJcblx0XHQ8YnI+XFxcclxuXHRcdDxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+Q2FuY2VsPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj4lYXBwbHklPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS50ZXh0SW5wdXQgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBwb3B1cFwiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdCV0aXRsZSVcXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIj5cXFxyXG5cdFx0PGZvcm0gb25zdWJtaXQ9XCJyZXR1cm4gZmFsc2U7XCI+XFxcclxuXHRcdFx0PGI+JXByb21wdCU8L2I+PGJyPlxcXHJcblx0XHRcdDxpbnB1dCBuYW1lPVwidGV4dFwiIHZhbHVlPVwiJXZhbHVlJVwiPjxicj5cXFxyXG5cdFx0PC9mb3JtPlxcXHJcblx0XHQ8YnI+XFxcclxuXHRcdDxidXR0b24gY2xhc3M9XCJoYWxmQnV0dG9uXCI+Q2FuY2VsPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cImhhbGZCdXR0b25cIj4lYXBwbHklPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5pbWFnZXNFZGl0b3IgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBpbWFnZXNcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRJbWFnZXNcXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIj5cXFxyXG5cdFx0PGRpdiBjbGFzcz1cImltYWdlQ29udGVudFwiPlxcXHJcblx0XHQ8L2Rpdj5cXFxyXG5cdFx0PGJyPlxcXHJcblx0XHQ8aW5wdXQgdHlwZT1cImZpbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIi8+XFxcclxuXHRcdDxidXR0b24gY2xhc3M9XCJ0aGlyZEJ1dHRvblwiPkNsb3NlPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cInRoaXJkQnV0dG9uXCI+VXBsb2FkIEltYWdlPC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cInRoaXJkQnV0dG9uXCI+SW1wb3J0IEltYWdlPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5pbWFnZSA9ICdcXFxyXG48ZGl2IGNsYXNzPVwiaW1hZ2VcIj5cXFxyXG5cdDxpbWcgc3JjPSVpbWFnZSUgLz5cXFxyXG5cdDxpbWcgc3JjPVwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIiBjbGFzcz1cImRlbGV0ZVwiLz5cXFxyXG48L2Rpdj5cXFxyXG4nOyIsIlxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxubS50YXNrV2luZG93ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRUYXNrXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJvdmVyZmxvdy15OiBzY3JvbGw7aGVpZ2h0OjMwdmg7XCI+XFxcclxuXHRcdDxoMz48Yj5RdWVzdGlvbiBOYW1lPC9iPjwvaDM+XFxcclxuXHRcdDxoMz48Yj48ZGl2IGNsYXNzPVwidGV4dC1ib3hcIiBjb250ZW50ZWRpdGFibGU+JXRpdGxlJTwvZGl2PjwvYj48L2gzPjxicj5cXFxyXG5cdFx0PHA+SW5zdHJ1Y3Rpb25zPC9wPlxcXHJcblx0XHQ8cD48ZGl2IGNsYXNzPVwidGV4dC1ib3ggbGFyZ2VcIiBjb250ZW50ZWRpdGFibGU+JWluc3RydWN0aW9ucyU8L2Rpdj48L3A+XFxcclxuXHRcdDxocj5cXFxyXG5cdFx0PHA+PGI+UXVlc3Rpb248L2I+PC9wPlxcXHJcblx0XHQ8cD48Yj48ZGl2IGNsYXNzPVwidGV4dC1ib3ggbGFyZ2VcIiBjb250ZW50ZWRpdGFibGU+JXF1ZXN0aW9uJTwvZGl2PjwvYj48L3A+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxuXHJcbm0ucmVzb3VyY2VXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvd1wiPlxcXHJcblx0PGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuXHRcdFJlc291cmNlXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJvdmVyZmxvdy15OiBzY3JvbGw7IGhlaWdodDoyMHZoO1wiPlxcXHJcblx0XHQ8ZGl2IGNsYXNzPVwicmVzb3VyY2VDb250ZW50XCI+XFxcclxuXHRcdDwvZGl2PlxcXHJcblx0XHQ8YnI+XFxcclxuXHRcdDxidXR0b24gY2xhc3M9XCJmdWxsXCI+QWRkIFJlc291cmNlPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5yZXNvdXJjZSA9ICdcXFxyXG48ZGl2IGNsYXNzPVwicmVzb3VyY2VJdGVtXCI+XFxcclxuICA8aW1nIHNyYz1cIiVpY29uJVwiIGNsYXNzPVwiaWNvblwiLz5cXFxyXG4gIDxpbWcgc3JjPVwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIiBjbGFzcz1cImRlbGV0ZVwiLz5cXFxyXG4gIDxkaXYgY2xhc3M9XCJyZXNvdXJjZVRleHRcIj4ldGl0bGUlPC9kaXY+XFxcclxuICA8YSBocmVmPVwiJWxpbmslXCIgdGFyZ2V0PVwiX2JsYW5rXCI+XFxcclxuICAgIDxkaXYgY2xhc3M9XCJjZW50ZXJcIj5cXFxyXG4gICAgICBPcGVuXFxcclxuICAgICAgPGltZyBzcmM9XCIuLi9pbWcvaWNvbkxhdW5jaC5wbmdcIi8+XFxcclxuICAgIDwvZGl2PlxcXHJcbiAgPC9hPlxcXHJcbjwvZGl2PlxcXHJcbic7XHJcblxyXG5tLmFuc3dlcldpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93IHJpZ2h0XCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0QW5zd2Vyc1xcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiIHN0eWxlPVwibWluLWhlaWdodDoyMHZoO1wiPlxcXHJcblx0XHQ8c2VsZWN0PlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCIyXCI+Mjwvb3B0aW9uPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCIzXCI+Mzwvb3B0aW9uPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCI0XCI+NDwvb3B0aW9uPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCI1XCI+NTwvb3B0aW9uPlxcXHJcblx0XHQ8L3NlbGVjdD5cXFxyXG5cdFx0YW5zd2Vycy4gU2VsZWN0IGNvcnJlY3QgYW5zd2VyIHdpdGggcmFkaW8gYnV0dG9uLlxcXHJcblx0XHQ8Zm9ybSBvbnN1Ym1pdD1cInJldHVybiBmYWxzZTtcIj5cXFxyXG5cdFx0XFxcclxuXHRcdDwvZm9ybT5cXFxyXG5cdDwvZGl2PlxcXHJcbjwvZGl2PlxcXHJcbic7XHJcblxyXG5tLmFuc3dlciA9J1xcXHJcbjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiYW5zd2VyXCIgdmFsdWU9XCIlbnVtJVwiIGNsYXNzPVwiYW5zd2VyUmFkaW9cIj5cXFxyXG48ZGl2IGNsYXNzPVwiYW5zd2VySW5wdXRzXCI+XFxcclxuXHQ8Yj5DaG9pY2UgJW51bSU8L2I+PGJyPlxcXHJcblx0PGlucHV0IG5hbWU9XCJhbnN3ZXIlbnVtJVwiIHZhbHVlPVwiJWFuc3dlciVcIj48YnI+XFxcclxuXHRGZWVkYmFjazxicj5cXFxyXG5cdDxpbnB1dCBuYW1lPVwiZmVlZGJhY2slbnVtJVwiIHZhbHVlPVwiJWZlZWRiYWNrJVwiPjxicj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5tZXNzYWdlV2luZG93ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRNZXNzYWdlXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJoZWlnaHQ6NjB2aDtvdmVyZmxvdy15OnNjcm9sbDtcIj5cXFxyXG5cdFx0PHA+PGI+RnJvbSA8L2I+XFxcclxuXHRcdDxkaXYgY2xhc3M9XCJ0ZXh0LWJveFwiIGNvbnRlbnRlZGl0YWJsZT4ldGl0bGUlPC9kaXY+PC9wPlxcXHJcblx0XHQ8aHI+XFxcclxuXHRcdDxwPjxiPlN1YmplY3QgPC9iPlxcXHJcblx0XHQ8ZGl2IGNsYXNzPVwidGV4dC1ib3hcIiBjb250ZW50ZWRpdGFibGU+JWluc3RydWN0aW9ucyU8L2Rpdj48L3A+XFxcclxuXHRcdDxocj5cXFxyXG5cdFx0PHA+TWVzc2FnZTwvcD5cXFxyXG5cdFx0PHA+PGRpdiBjbGFzcz1cInRleHQtYm94IHRhbGxcIiBjb250ZW50ZWRpdGFibGU+JXF1ZXN0aW9uJTwvZGl2PjwvcD5cXFxyXG5cdDwvZGl2PlxcXHJcbjwvZGl2PlxcXHJcbic7XHJcblxyXG5tLnF1ZXN0aW9uVHlwZVdpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93XCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0UXVlc3Rpb24gVHlwZVxcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93Q29udGVudFwiPlxcXHJcblx0XHQ8c2VsZWN0IGNsYXNzPVwiZnVsbFwiPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCIxXCI+SnVzdGlmaWNhdGlvbiBNdWx0aXBsZSBDaG9pY2U8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiMlwiPlN0YW5kYXJkIE11bHRpcGxlIENob2ljZTwvb3B0aW9uPlxcXHJcblx0XHRcdDxvcHRpb24gdmFsdWU9XCIzXCI+U2hvcnQgUmVzcG9uc2U8L29wdGlvbj5cXFxyXG5cdFx0XHQ8b3B0aW9uIHZhbHVlPVwiNFwiPkZpbGUgU3VibWlzc29uPC9vcHRpb24+XFxcclxuXHRcdFx0PG9wdGlvbiB2YWx1ZT1cIjVcIj5NZXNzYWdlPC9vcHRpb24+XFxcclxuXHRcdDwvc2VsZWN0PlxcXHJcblx0XHQ8YnV0dG9uIGNsYXNzPVwiaW1hZ2VCdXR0b25cIj5cXFxyXG5cdFx0ICA8ZGl2PjxpbWcgc3JjPVwiLi4vaW1nL3BsYWNlaG9sZGVyLnBuZ1wiLz48L2Rpdj5cXFxyXG5cdFx0ICA8ZGl2PiBTZWxlY3QgSW1hZ2UgPC9kaXY+XFxcclxuXHRcdDwvYnV0dG9uPlxcXHJcblx0PC9kaXY+XFxcclxuXHQ8ZGl2IGNsYXNzPVwid2luZG93QnV0dG9uc1wiPlxcXHJcblx0XHQ8YnV0dG9uPlNhdmU8L2J1dHRvbj5cXFxyXG5cdDwvZGl2PlxcXHJcbjwvZGl2PlxcXHJcbic7IiwidmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxuXHJcbi8vIEhUTUxcclxudmFyIHNlY3Rpb247XHJcblxyXG4vL0VsZW1lbnRzXHJcbnZhciBuYW1lSW5wdXQsIGRlc2NyaXB0aW9uSW5wdXQsIGNhdDFJbnB1dDtcclxudmFyIGNyZWF0ZSwgYmFjaztcclxuXHJcbi8vIFRoZSBjdXIgY2FzZVxyXG52YXIgY2FzZUZpbGU7XHJcblxyXG4vLyBUaGUgbmV4dCBwYWdlIHRvIG9wZW4gd2hlbiB0aGlzIG9uZSBjbG9zZXNcclxudmFyIG5leHQ7XHJcblxyXG52YXIgTkVYVCA9IE9iamVjdC5mcmVlemUoe05PTkU6IDAsIFRJVExFOiAxLCBCT0FSRDogMn0pO1xyXG5cclxuZnVuY3Rpb24gQ3JlYXRlTWVudShwU2VjdGlvbil7XHJcblx0c2VjdGlvbiA9IHBTZWN0aW9uO1xyXG5cdG5leHQgPSBORVhULk5PTkU7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBodG1sIGVsZW1lbnRzXHJcblx0bmFtZUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNpbnB1dC1uYW1lJyk7XHJcblx0ZGVzY3JpcHRpb25JbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjaW5wdXQtZGVzY3JpcHRpb24nKTtcclxuXHRjb25jbHVzaW9uSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2lucHV0LWNvbmNsdXNpb24nKTtcclxuXHRjYXQxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2lucHV0LWNhdDEnKTtcclxuXHRjcmVhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2NyZWF0ZS1idXR0b24nKTtcclxuXHRiYWNrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNiYWNrLWJ1dHRvbicpO1xyXG4gICAgXHJcblx0Ly8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuXHRiYWNrLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRwYWdlLm5leHQgPSBORVhULlRJVExFO1xyXG4gICAgXHRwYWdlLmNsb3NlKCk7XHJcbiAgICB9O1xyXG5cdHZhciBwYWdlID0gdGhpcztcclxuICAgIGNyZWF0ZS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0XHJcbiAgICBcdHBhZ2UubmV4dCA9IE5FWFQuQk9BUkQ7XHJcbiAgICBcdGNyZWF0ZS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBcdGJhY2suZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgXHRcclxuICAgIFx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgIFx0cmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcbiAgICBcdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICBcdCAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG4gICAgXHRcdCAgXHRcclxuICAgIFx0XHRcdC8vIENyZWF0ZSBhIHdvcmtlciBmb3IgdW56aXBwaW5nIHRoZSBmaWxlXHJcbiAgICBcdFx0XHR2YXIgemlwV29ya2VyID0gbmV3IFdvcmtlcihcIi4uL2xpYi91bnppcC5qc1wiKTtcclxuICAgIFx0XHRcdHppcFdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBcdFx0XHRcdFxyXG4gICAgXHRcdFx0XHQvLyBHZXQgdGhlIGNhc2VcclxuICAgIFx0XHRcdFx0dmFyIGNhc2VEYXRhID0gbWVzc2FnZS5kYXRhO1xyXG4gICAgXHRcdFx0XHR2YXIgY2FzZUZpbGUgPSBVdGlsaXRpZXMuZ2V0WG1sKGNhc2VEYXRhLmNhc2VGaWxlKTtcclxuICAgIFx0XHQgICAgXHRcclxuICAgIFx0XHQgICAgXHQvLyBTZXQgdGhlIGlucHV0cyB0byB0aGUgY3VycmVudCBjYXNlXHJcbiAgICBcdFx0ICAgIFx0dmFyIGN1ckNhc2UgPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF07XHJcbiAgICBcdFx0ICAgIFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoJ2Nhc2VOYW1lJywgbmFtZUlucHV0LnZhbHVlKTtcclxuICAgIFx0XHQgICAgXHRjdXJDYXNlLnNldEF0dHJpYnV0ZSgnZGVzY3JpcHRpb24nLCBkZXNjcmlwdGlvbklucHV0LmlubmVySFRNTCk7XHJcbiAgICBcdFx0ICAgIFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoJ2NvbmNsdXNpb24nLCBjb25jbHVzaW9uSW5wdXQuaW5uZXJIVE1MKTtcclxuICAgIFx0XHQgICAgXHR2YXIgY2F0TGlzdCA9IGN1ckNhc2UuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NhdGVnb3J5TGlzdCcpWzBdO1xyXG4gICAgXHRcdCAgICBcdGNhdExpc3Quc2V0QXR0cmlidXRlKCdjYXRlZ29yeUNvdW50JywgJzEnKTtcclxuICAgIFx0XHQgICAgXHRjYXRMaXN0LmlubmVySFRNTCA9ICc8ZWxlbWVudD4nK2NhdDFJbnB1dC52YWx1ZSsnPC9lbGVtZW50Pic7XHJcbiAgICBcdFx0ICAgIFx0dmFyIGNhdDEgPSBjYXNlRmlsZS5jcmVhdGVFbGVtZW50KCdjYXRlZ29yeScpO1xyXG4gICAgXHRcdCAgICBcdGNhdDEuc2V0QXR0cmlidXRlKCdjYXRlZ29yeURlc2lnbmF0aW9uJywgJzAnKTtcclxuICAgIFx0XHQgICAgXHRjYXQxLnNldEF0dHJpYnV0ZSgncXVlc3Rpb25Db3VudCcsICcwJyk7XHJcbiAgICBcdFx0ICAgIFx0Y3VyQ2FzZS5hcHBlbmRDaGlsZChjYXQxKTtcclxuICAgIFx0XHQgICAgXHRcclxuICAgIFx0XHQgICAgXHQvLyBTYXZlIHRoZSBjaGFuZ2VzIHRvIGxvY2FsIHN0b3JhZ2VcclxuICAgIFx0XHQgICAgXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VOYW1lJ10gPSBuYW1lSW5wdXQudmFsdWUrXCIuaXBhclwiO1xyXG4gICAgXHRcdCAgICBcdGNhc2VEYXRhLmNhc2VGaWxlID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhjYXNlRmlsZSk7XHJcbiAgICBcdFx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KGNhc2VEYXRhKTtcclxuXHJcbiAgICBcdFx0ICAgIFx0cGFnZS5jbG9zZSgpO1xyXG4gICAgXHRcdCAgICBcdFxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdFx0XHJcbiAgICBcdFx0XHQvLyBTdGFydCB0aGUgd29ya2VyXHJcbiAgICBcdFx0XHR6aXBXb3JrZXIucG9zdE1lc3NhZ2UocmVxdWVzdC5yZXNwb25zZSk7XHJcbiAgICBcdCAgfVxyXG4gICAgXHR9O1xyXG4gICAgXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJiYXNlLmlwYXJcIiwgdHJ1ZSk7XHJcbiAgICBcdHJlcXVlc3Quc2VuZCgpO1xyXG4gICAgfTtcclxufVxyXG5cclxudmFyIHAgPSBDcmVhdGVNZW51LnByb3RvdHlwZTtcclxuXHJcbnAub3BlbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gTWFrZSB0aGUgbWVudSB2aXNpYmxlXHJcblx0c2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblxyXG5cdC8vIE1ha2UgaXQgc28gdGhhdCBjcmVhdGUgaXMgZGlzYWJsZWQgdW50aWwgeW91IGF0IGxlYXN0IGhhdmUgYSBuYW1lIGFuZCAxc3QgY2F0XHJcblx0dmFyIGNoZWNrUHJvY2VlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRpZihuYW1lSW5wdXQudmFsdWU9PVwiXCIgfHxcclxuXHRcdFx0Y2F0MUlucHV0LnZhbHVlPT1cIlwiKVxyXG5cdFx0XHRjcmVhdGUuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRjcmVhdGUuZGlzYWJsZWQgPSBmYWxzZTtcclxuXHR9O1xyXG5cdG5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGVja1Byb2NlZWQpO1xyXG5cdGNhdDFJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGVja1Byb2NlZWQpO1xyXG5cdGNoZWNrUHJvY2VlZCgpO1xyXG5cdFxyXG59XHJcblxyXG5wLmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRzZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0aWYodGhpcy5vbmNsb3NlKVxyXG5cdFx0dGhpcy5vbmNsb3NlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ3JlYXRlTWVudTtcclxubW9kdWxlLmV4cG9ydHMuTkVYVCA9IE5FWFQ7IiwidmFyIFdpbmRvd3MgPSByZXF1aXJlKCcuLi9odG1sL3BvcHVwV2luZG93cy5qcycpO1xyXG5cclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0uZWRpdEluZm8gPSBmdW5jdGlvbih3aW5kb3dEaXYsIGNhc2VGaWxlLCBjYWxsYmFjayl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBwb3B1cCB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5lZGl0SW5mbztcclxuICAgIHZhciBlZGl0SW5mbyA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIFxyXG4gICAgLy8gRmlsbCBpdCB3aXRoIHRoZSBnaXZlbiBpbmZvXHJcbiAgICB2YXIgY2FzZUluZm8gPSBjYXNlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF07XHJcbiAgICBlZGl0SW5mby5pbm5lckhUTUwgPSBlZGl0SW5mby5pbm5lckhUTUwucmVwbGFjZSgvJWNhc2VOYW1lJS9nLCBjYXNlSW5mby5nZXRBdHRyaWJ1dGUoXCJjYXNlTmFtZVwiKSkucmVwbGFjZSgvJWRlc2NyaXB0aW9uJS9nLCBjYXNlSW5mby5nZXRBdHRyaWJ1dGUoXCJkZXNjcmlwdGlvblwiKSkucmVwbGFjZSgvJWNvbmNsdXNpb24lL2csIGNhc2VJbmZvLmdldEF0dHJpYnV0ZShcImNvbmNsdXNpb25cIikpO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCB0aGUgYnV0dG9uc1xyXG4gICAgdmFyIGJ1dHRvbnMgPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcclxuICAgIGJ1dHRvbnNbMF0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0Y2FsbGJhY2soY2FzZUZpbGUsIGNhc2VJbmZvLmdldEF0dHJpYnV0ZShcImNhc2VOYW1lXCIpKTtcclxuICAgIH1cclxuICAgIGJ1dHRvbnNbMV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuICAgIFx0dmFyIGZvcm0gPSBlZGl0SW5mby5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XHJcbiAgICBcdHZhciBkaXZzID0gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImRpdlwiKTtcclxuICAgIFx0Y2FzZUluZm8uc2V0QXR0cmlidXRlKFwiY2FzZU5hbWVcIiwgZm9ybS5lbGVtZW50c1tcImNhc2VOYW1lXCJdLnZhbHVlKTtcclxuICAgIFx0Y2FzZUluZm8uc2V0QXR0cmlidXRlKFwiZGVzY3JpcHRpb25cIiwgZGl2c1swXS5pbm5lckhUTUwpO1xyXG4gICAgXHRjYXNlSW5mby5zZXRBdHRyaWJ1dGUoXCJjb25jbHVzaW9uXCIsIGRpdnNbMV0uaW5uZXJIVE1MKTtcclxuICAgIFx0Y2FsbGJhY2soY2FzZUZpbGUsIGZvcm0uZWxlbWVudHNbXCJjYXNlTmFtZVwiXS52YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlzcGxheSB0aGUgd2luZG93XHJcbiAgICB3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB3aW5kb3dEaXYuYXBwZW5kQ2hpbGQoZWRpdEluZm8pO1xyXG4gICAgXHJcbiAgICBcclxufVxyXG5cclxubS5wcm9tcHQgPSBmdW5jdGlvbih3aW5kb3dEaXYsIHRpdGxlLCBwcm9tcHQsIGRlZmF1bHRWYWx1ZSwgYXBwbHlUZXh0LCBjYWxsYmFjayl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBwb3B1cCB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy50ZXh0SW5wdXQ7XHJcbiAgICB2YXIgcHJvbXB0V2luZG93ID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgXHJcbiAgICAvLyBGaWxsIGl0IHdpdGggdGhlIGdpdmVuIGluZm9cclxuICAgIHByb21wdFdpbmRvdy5pbm5lckhUTUwgPSBwcm9tcHRXaW5kb3cuaW5uZXJIVE1MLnJlcGxhY2UoLyV0aXRsZSUvZywgdGl0bGUpLnJlcGxhY2UoLyVwcm9tcHQlL2csIHByb21wdCkucmVwbGFjZSgvJXZhbHVlJS9nLCBkZWZhdWx0VmFsdWUpLnJlcGxhY2UoLyVhcHBseSUvZywgYXBwbHlUZXh0KTtcclxuICAgIFxyXG4gICAgLy8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuICAgIHZhciBidXR0b25zID0gcHJvbXB0V2luZG93LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG4gICAgYnV0dG9uc1swXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0d2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgXHRjYWxsYmFjaygpO1xyXG4gICAgfVxyXG4gICAgYnV0dG9uc1sxXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0d2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgXHRjYWxsYmFjayhwcm9tcHRXaW5kb3cuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdLmVsZW1lbnRzW1widGV4dFwiXS52YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlzcGxheSB0aGUgd2luZG93XHJcbiAgICB3aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB3aW5kb3dEaXYuYXBwZW5kQ2hpbGQocHJvbXB0V2luZG93KTtcclxuXHRcclxufSIsIlxyXG4vLyBIVE1MXHJcbnZhciBzZWN0aW9uO1xyXG5cclxuLy8gUGFydHMgb2YgdGhlIGh0bWxcclxudmFyIGxvYWRJbnB1dCwgbG9hZEJ1dHRvbiwgY3JlYXRlQnV0dG9uLCBjb250aW51ZUJ1dHRvbiwgbWVudUJ1dHRvbjtcclxuXHJcbi8vIFRoZSBuZXh0IHBhZ2UgdG8gb3BlbiB3aGVuIHRoaXMgb25lIGNsb3Nlc1xyXG52YXIgbmV4dDtcclxuXHJcbnZhciBORVhUID0gT2JqZWN0LmZyZWV6ZSh7Tk9ORTogMCwgQk9BUkQ6IDEsIENSRUFURTogMn0pO1xyXG5cclxuZnVuY3Rpb24gVGl0bGVNZW51KHBTZWN0aW9uKXtcclxuXHRzZWN0aW9uID0gcFNlY3Rpb247XHJcblx0bmV4dCA9IE5FWFQuTk9ORTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIGxvYWQgYnV0dG9uIGFuZCBpbnB1dFxyXG5cdGxvYWRJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbG9hZC1pbnB1dCcpO1xyXG5cdGxvYWRCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2xvYWQtYnV0dG9uJyk7XHJcblx0Y3JlYXRlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNjcmVhdGUtYnV0dG9uJyk7XHJcblx0Y29udGludWVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2NvbnRpbnVlLWJ1dHRvbicpO1xyXG5cdG1lbnVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI21lbnUtYnV0dG9uJyk7XHJcblx0XHJcblx0Ly8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuXHRjcmVhdGVCdXR0b24ub25jbGljayA9IHRoaXMuY3JlYXRlLmJpbmQodGhpcyk7XHJcblx0bG9hZEJ1dHRvbi5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuXHRcdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSAmJiAhY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBzdGFydCBhIG5ldyBjYXNlPyBZb3VyIGF1dG9zYXZlIGRhdGEgd2lsbCBiZSBsb3N0IVwiKSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0bG9hZElucHV0LmNsaWNrKCk7XHJcblx0fVxyXG5cdGxvYWRJbnB1dC5vbmNoYW5nZSA9IHRoaXMubG9hZEZpbGUuYmluZCh0aGlzKTtcclxuXHRjb250aW51ZUJ1dHRvbi5vbmNsaWNrID0gdGhpcy5jbG9zZS5iaW5kKHRoaXMpO1xyXG5cdG1lbnVCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCl7d2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL2luZGV4Lmh0bWxcIjt9O1xyXG59XHJcblxyXG52YXIgcCA9IFRpdGxlTWVudS5wcm90b3R5cGU7XHJcblxyXG5wLm9wZW4gPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIERpc3BsYXkgdGhlIHNlY3Rpb24gaG9sZGluZyB0aGUgbWVudVxyXG5cdHNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFxyXG5cdC8vIFNldHVwIGNvbnRpbnVlIGJ1dHRvbiBiYXNlZCBvbiBsb2NhbCBzdG9hcmdlXHJcblx0aWYobG9jYWxTdG9yYWdlWydjYXNlRGF0YUNyZWF0ZSddKVxyXG5cdFx0Y29udGludWVCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRlbHNlXHJcblx0XHRjb250aW51ZUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0dGhpcy5uZXh0ID0gTkVYVC5CT0FSRDtcclxuXHRcclxuXHQvLyBTZXQgdGhlIGJ1dHRvbiB0byBub3QgZGlzYWJsZWQgaW4gY2FzZSBjb21pbmcgYmFjayB0byB0aGlzIG1lbnVcclxuXHRsb2FkQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcblx0bG9hZElucHV0LmRpc2FibGVkID0gZmFsc2U7XHJcblx0bWVudUJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdGNyZWF0ZUJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFxyXG59XHJcblxyXG5wLmNyZWF0ZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSAmJiAhY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBzdGFydCBhIG5ldyBjYXNlPyBZb3VyIGF1dG9zYXZlIGRhdGEgd2lsbCBiZSBsb3N0IVwiKSlcclxuXHRcdHJldHVybjtcclxuXHRcclxuXHQvLyBnbyB0byB0aGUgbmV4dCBwYWdlXHJcblx0dGhpcy5uZXh0ID0gTkVYVC5DUkVBVEU7XHJcblx0dGhpcy5jbG9zZSgpO1xyXG5cdFxyXG59XHJcblxyXG5wLmxvYWRGaWxlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFxyXG5cdC8vIE1ha2Ugc3VyZSBhIGlwYXIgZmlsZSB3YXMgY2hvb3NlblxyXG5cdGlmKCFsb2FkSW5wdXQudmFsdWUuZW5kc1dpdGgoXCJpcGFyXCIpKXtcclxuXHRcdGFsZXJ0KFwiWW91IGRpZG4ndCBjaG9vc2UgYW4gaXBhciBmaWxlISB5b3UgY2FuIG9ubHkgbG9hZCBpcGFyIGZpbGVzIVwiKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0bG9jYWxTdG9yYWdlWydjYXNlTmFtZSddID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdLm5hbWU7XHJcblxyXG5cdC8vIFNldCB0aGUgYnV0dG9uIHRvIGRpc2FibGVkIHNvIHRoYXQgaXQgY2FuJ3QgYmUgcHJlc3NlZCB3aGlsZSBsb2FkaW5nXHJcblx0bG9hZEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0bG9hZElucHV0LmRpc2FibGVkID0gdHJ1ZTtcclxuXHRtZW51QnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRjcmVhdGVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdGNvbnRpbnVlQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcclxuXHQvLyBDcmVhdGUgYSByZWFkZXIgYW5kIHJlYWQgdGhlIHppcFxyXG5cdHZhciBwYWdlID0gdGhpcztcclxuXHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuXHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFxyXG5cdFx0Ly8gc2luY2UgdGhlIHVzZXIgaXMgbG9hZGluZyBhIGZyZXNoIGZpbGUsIGNsZWFyIHRoZSBhdXRvc2F2ZSAoc29vbiB3ZSB3b24ndCB1c2UgdGhpcyBhdCBhbGwpXHJcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImF1dG9zYXZlXCIsXCJcIik7XHJcblx0XHRcclxuXHRcdC8vIENyZWF0ZSBhIHdvcmtlciBmb3IgdW56aXBwaW5nIHRoZSBmaWxlXHJcblx0XHR2YXIgemlwV29ya2VyID0gbmV3IFdvcmtlcihcImxpYi91bnppcC5qc1wiKTtcclxuXHRcdHppcFdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBTYXZlIHRoZSBiYXNlIHVybCB0byBsb2NhbCBzdG9yYWdlXHJcblx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZURhdGFDcmVhdGUnXSA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UuZGF0YSk7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBSZWRpcmVjdCB0byB0aGUgbmV4dCBwYWdlXHJcblx0XHRcdHBhZ2UubmV4dCA9IE5FWFQuQk9BUkQ7XHJcblx0XHRcdHBhZ2UuY2xvc2UoKTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIFN0YXJ0IHRoZSB3b3JrZXJcclxuXHRcdHppcFdvcmtlci5wb3N0TWVzc2FnZShldmVudC50YXJnZXQucmVzdWx0KTtcclxuXHRcdFxyXG5cdH07XHJcblx0cmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGV2ZW50LnRhcmdldC5maWxlc1swXSk7XHJcblx0XHJcbn1cclxuXHJcbnAuY2xvc2UgPSBmdW5jdGlvbigpe1xyXG5cdHNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRpZih0aGlzLm9uY2xvc2UpXHJcblx0XHR0aGlzLm9uY2xvc2UoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaXRsZU1lbnU7XHJcbm1vZHVsZS5leHBvcnRzLk5FWFQgPSBORVhUOyJdfQ==

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Game = require('./modules/game/game.js');
var Point = require('./modules/helper/point.js');
var Constants = require('./modules/game/constants.js');
var Utilities = require('./modules/helper/utilities.js');
var TitleMenu = require('./modules/menus/titleMenu.js');
var CaseMenu = require('./modules/menus/caseMenu.js');
var ProfileMenu = require('./modules/menus/profileMenu.js');

// The current game
var game;

// The section holding the board
var boardSection;

// The current page the website is on
var curPage;
var menus = [];
var PAGE = Object.freeze({TITLE: 0, CASE: 1, PROFILE: 2, BOARD: 3});

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
			createGame();
			break;
		case TitleMenu.NEXT.CASE:
			curPage = PAGE.CASE;
			menus[PAGE.CASE].open();
			break;
		}
	}
	
	// Setup case menu
	menus[PAGE.CASE] = new CaseMenu(document.getElementById("caseMenu"));
	menus[PAGE.CASE].onclose = function(){
		switch(this.next){
		case CaseMenu.NEXT.NEW_PROFILE:
			console.log("LOADING NEW PROFILE MENU");
			curPage = PAGE.PROFILE;
			menus[PAGE.PROFILE].open(true);
			break;
		case CaseMenu.NEXT.OLD_PROFILE:
			console.log("LOADING OLD PROFILE MENU");
			curPage = PAGE.PROFILE;
			menus[PAGE.PROFILE].open(false);
			break;
		case CaseMenu.NEXT.TITLE:
			curPage = PAGE.TITLE;
			menus[PAGE.TITLE].open();
			break;
		}
	}
	
	//Setup profile menu
	menus[PAGE.PROFILE] = new ProfileMenu(document.getElementById("profileMenu"));
	menus[PAGE.PROFILE].onclose = function(){
		switch(this.next){
		case ProfileMenu.NEXT.BOARD:
			curPage = PAGE.BOARD;
			createGame();
			break;
		case ProfileMenu.NEXT.CASE:
			curPage = PAGE.CASE;
			menus[PAGE.CASE].open();
			break;
		}
	}
	
	
	// Open the title menu
    curPage = PAGE.TITLE;
    menus[PAGE.TITLE].open();
    
}

// create the game object and start the loop with a dt
function createGame(){
	
	// Show the section for the game
	boardSection.style.display = 'block';
	
    // Create the game
    game = new Game(document.getElementById("board"), Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
    
    // Start the game loop
    gameLoop(Date.now());
    
}

//fires once per frame for the game
function gameLoop(prevTime){
	
    
	// get delta time
    var dt = Date.now() - prevTime;
    
    // update game
    game.update(dt);
    
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
},{"./modules/game/constants.js":6,"./modules/game/game.js":7,"./modules/helper/point.js":13,"./modules/helper/utilities.js":14,"./modules/menus/caseMenu.js":16,"./modules/menus/profileMenu.js":17,"./modules/menus/titleMenu.js":18}],2:[function(require,module,exports){
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

module.exports = Category;
},{"./question.js":3}],3:[function(require,module,exports){
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
    //console.log(xml);
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
											this.feedbacks[num].innerHTML+'</span><br/>';
	if(this.taskContent)
		this.taskContent.scrollTop = this.taskContent.scrollHeight;
}

p.correctAnswer = function(){
	
	// Disable all the answer buttons
	if(this.answers)
		for(var i=0;i<this.answers.length;i++)
			this.answers[i].disabled = true;
	if(this.taskContent)
		this.taskContent.scrollTop = this.taskContent.scrollHeight;
	
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
	    	this.answers[i].innerHTML = String.fromCharCode(i + "A".charCodeAt())+". "+answersXml[i].innerHTML;
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
    	console.log("FILE BUTTON CLICKED!");
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
},{"../game/constants.js":6,"../helper/utilities.js":14,"../html/questionWindows.js":15}],4:[function(require,module,exports){
"use strict";
var Question = require("./question.js");

// Creates a category with the given name and from the given xml
function Resource(xml){
	
	// First get the icon
	  var type = parseInt(xml.getAttribute("type"));
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

module.exports = Resource;
},{"./question.js":3}],5:[function(require,module,exports){
"use strict";
var Utilities = require('../helper/utilities.js');
var Point = require('../helper/point.js');
var Question = require("../case/question.js");
var Constants = require("./constants.js");
var DrawLib = require("../helper/drawlib.js");

//parameter is a point that denotes starting position
function board(section, startPosition, lessonNodes){
	
	// Create the canvas for this board and add it to the section
	this.canvas = document.createElement("canvas");
	this.ctx = this.canvas.getContext('2d');
	this.canvas.style.display = 'none';
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	section.appendChild(this.canvas);
	
	var board = this;
	this.canvas.addEventListener('animationend', function(){
		if(board.loaded)
			board.loaded();
	}, false);
	
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
	
	// for each  node
    for(var i=0; i<this.lessonNodeArray.length; i++){
    	var activeNode = this.lessonNodeArray[i]; 
		// handle solved question
		if (activeNode.currentState != Question.SOLVE_STATE.SOLVED && activeNode.question.currentState == Question.SOLVE_STATE.SOLVED) {
			
			// update each connection's connection number
			for (var j = 0; j < activeNode.question.connections.length; j++)
				this.lessonNodeArray[Math.abs(activeNode.question.connections[j]) - 1].connections++;
			
			// Update the node's state
			activeNode.currentState = activeNode.question.currentState;
			
			// Check if all node's are solved
			var done = true;
			for(var i=0;i<this.lessonNodeArray.length && done;i++)
				if(this.lessonNodeArray[i].currentState!=Question.SOLVE_STATE.SOLVED)
					done = false;
			if(done)
				this.finished = true;
			
			// If there is a listener for updating nodes, call it.
			if(this.updateNode)
				this.updateNode();
			
		}

		// update the node's transition progress
		if (activeNode.question.currentState == Question.SOLVE_STATE.SOLVED)
			activeNode.linePercent = Math.min(1,dt*Constants.lineSpeed + activeNode.linePercent);
	}
    
    // Check mouse events if given a mouse state
    if(pMouseState) {
	    
	    // hover states
		//for(var i = 0; i < boardArray.length; i++){
			// loop through lesson nodes to check for hover
			// update board
		
	    if (!pMouseState.mouseDown && this.target) {
			this.target.dragPosition = undefined; // clear drag behavior
			this.target.dragging = false;
			this.target = null;
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
		if(this.target){
	
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
			}
			else{
				var naturalX = pMouseState.virtualPosition.x - this.target.dragPosition.x;
				this.target.position.x = Math.max(Constants.boardOutline,Math.min(naturalX,Constants.boardSize.x - Constants.boardOutline));
				this.target.question.positionPercentX = this.target.position.x;
				var naturalY = pMouseState.virtualPosition.y - this.target.dragPosition.y;
				this.target.position.y = Math.max(Constants.boardOutline,Math.min(naturalY,Constants.boardSize.y - Constants.boardOutline));
				this.target.question.positionPercentY = this.target.position.y;
			}
			
	  }
		
		// drag the board around
		if (this.target==null) {
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
			}
	    }
    }
}

p.draw = function(gameScale){
    
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
    
	// draw the nodes
    for(var i = 0; i < this.lessonNodeArray.length; i++){
    
    	// temporarily hide all but the first question						// something is wrong here, linksAwayFromOrigin does not exist anymore
		//if (this.lessonNodeArray[i].question.revealThreshold > this.lessonNodeArray[i].linksAwayFromOrigin) continue;
    	
    	// draw the node itself
        this.lessonNodeArray[i].draw(this.ctx, this.canvas);
    }

	// draw the lines
	for(var i=0; i<this.lessonNodeArray.length; i++){
		
		// only show lines from solved questions
		if (this.lessonNodeArray[i].question.currentState!=Question.SOLVE_STATE.SOLVED) continue;
		
		// get the pin position
        var oPos = this.lessonNodeArray[i].getNodePoint();
        
		// set line style
        this.ctx.strokeStyle = "rgba(0,0,105,0.2)";
        this.ctx.lineWidth = 1;
        
        // draw lines
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	
        	// Don't draw negative connections
        	if(this.lessonNodeArray[i].question.connections[j]<0)continue;
        	
        	// -1 becase node connection index values are 1-indexed but connections is 0-indexed
			if (this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1].question.currentState==Question.SOLVE_STATE.HIDDEN) continue;
        	
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var connection = this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1];
        	var cPos = connection.getNodePoint();
        	
        	// draw the line
        	this.ctx.beginPath();
        	// translate to start (pin)
        	this.ctx.moveTo(oPos.x, oPos.y);
        	this.ctx.lineTo(oPos.x + (cPos.x - oPos.x)*this.lessonNodeArray[i].linePercent, oPos.y + (cPos.y - oPos.y)*this.lessonNodeArray[i].linePercent);
        	this.ctx.closePath();
        	this.ctx.stroke();
        }
    }
    
	this.ctx.restore();
};

// Gets a free node in this board (i.e. not unsolved) returns null if none
p.getFreeNode = function() {
	for(var i=0; i<this.lessonNodeArray.length; i++){
		if(this.lessonNodeArray[i].question.currentState == Question.SOLVE_STATE.UNSOLVED)
			return this.lessonNodeArray[i];}
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
	console.log("window closed:"+this.lastQuestion.newFiles);
	// if it is file type
	if (this.lastQuestion.newFiles) {
		// add a file to the file system
		this.lastQuestion.newFiles = false;
		return { 
			files: this.lastQuestion.fileInput.files, 
			question: this.lastQuestion.num
		}
	}
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

},{"../case/question.js":3,"../helper/drawlib.js":9,"../helper/point.js":13,"../helper/utilities.js":14,"./constants.js":6}],6:[function(require,module,exports){
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
},{"../helper/point.js":13}],7:[function(require,module,exports){
"use strict";
var Board = require('./board.js');
var Point = require('../helper/point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('../helper/drawlib.js');
var DataParser = require('../helper/iparDataParser.js');
var MouseState = require('../helper/mouseState.js');
var FileManager = require('../helper/fileManager.js');

//mouse management
var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

// HTML elements
var zoomSlider;
var windowDiv;
var windowWrapper;
var windowFilm;
var proceedContainer;
var proceedLong;
var proceedRound;

// Used for pinch zoom
var pinchStart;

// Used for waiting a second to close windows
var pausedTime = 0;

//phase handling
var phaseObject;

function game(section, baseScale){
	var game = this;
	this.active = false;
	this.saveFiles = [];
	
	// Get and setup the window elements
	windowDiv = document.getElementById('window');
	windowWrapper = document.getElementById('windowWrapper');
    proceedContainer = document.getElementById('proceedContainer');
    proceedLong = document.getElementById('proceedBtnLong');
    proceedRound = document.getElementById('proceedBtnRound');
	windowFilm = document.getElementById('windowFlim');
	windowFilm.onclick = function(e) {
		var window = false;
		var windows = document.getElementsByClassName("windowContent");
		for(var i=0;i<windows.length && !window;i++){
			var bounds = windows[i].getBoundingClientRect();
			if(bounds.left < e.clientX && bounds.right > e.clientX && bounds.top < e.clientY && bounds.bottom > e.clientY)
				window = true;
		}
		windows = document.getElementsByClassName("title");
		for(var i=0;i<windows.length && !window;i++){
			var bounds = windows[i].getBoundingClientRect();
			if(bounds.left < e.clientX && bounds.right > e.clientX && bounds.top < e.clientY && bounds.bottom > e.clientY)
				window = true;
		}
		if(!window)
			windowDiv.innerHTML = ''; 
	};
	
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
	
	// Save the given scale
	this.scale = baseScale;
	
	// Load the case file
	var loadData = FileManager.loadCase(JSON.parse(localStorage['caseData']), document.querySelector('#'+section.id+' #window'));
	
	// Create the boards
	this.categories = loadData.categories;
	this.createLessonNodes(section);
	
	// Create the final button
	var finalButton = document.createElement("button");
	finalButton.innerHTML = "Close Case";
	if(!this.boardArray[this.boardArray.length-1].finished)
		finalButton.disabled = true;
	finalButton.onclick = function(){
		game.submit();
	};
	this.bottomBar.appendChild(finalButton);
	
	// Display the current board
	this.activeBoardIndex = loadData.category;
	this.active = true;
	this.boardArray[this.activeBoardIndex].show();
	this.boardArray[this.activeBoardIndex].button.className = "active";
	this.updateNode();
	zoomSlider.value = -this.getZoom();
	
	// Setup the save button
	FileManager.prepareZip(document.querySelector('#'+section.id+' #blob'));
}

var p = game.prototype;

p.createLessonNodes = function(section){
	this.boardArray = [];
	this.bottomBar = document.querySelector('#'+section.id+' #bottomBar');
	for(var i=0;i<this.categories.length;i++){
		// initialize empty
		
		this.lessonNodes = [];
		// add a node per question
		for (var j = 0; j < this.categories[i].questions.length; j++) {
			// create a new lesson node
			this.lessonNodes.push(new LessonNode(new Point(this.categories[i].questions[j].positionPercentX, this.categories[i].questions[j].positionPercentY), this.categories[i].questions[j].imageLink, this.categories[i].questions[j] ) );
			// attach question object to lesson node
			this.lessonNodes[this.lessonNodes.length-1].question = this.categories[i].questions[j];
		
		}

		// create a board
		this.boardArray[i] = new Board(section, new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), this.lessonNodes);
		var button = document.createElement("BUTTON");
		button.innerHTML = this.categories[i].name;
		var game = this;
		button.onclick = (function(i){ 
			return function() {
				if(game.active && !game.zoomout && !game.zoomin){
					game.changeBoard(i);
				}
		}})(i);
		if(i!=0 && !this.boardArray[i-1].finished)
			button.disabled = true;
		this.bottomBar.appendChild(button);
		this.boardArray[i].button = button;
		var game = this;
		this.boardArray[i].updateNode = function(){game.updateNode();};
	}
	
	this.mouseState = new MouseState(this.boardArray);
	
}

p.update = function(dt){
	
    if(this.active){
    
    	// perform game actions
    	this.act(dt);
    	
	    // draw stuff
	    this.boardArray[this.activeBoardIndex].draw(this.scale);
	    
    }
    else if(pausedTime!=0 && windowDiv.innerHTML=='')
    	this.windowClosed();
    
}

p.act = function(dt){

    // Update the mouse state
	this.mouseState.update(dt, this.scale*this.getZoom());
	
	/*if (this.mouseState.mouseClicked) {
		//localStorage.setItem("autosave",DataParser.createXMLSaveFile(this.boardArray, false));
		//console.log(localStorage.getItem("autosave"));
	}*/
	
    // Update the current board (give it the mouse only if not zooming)
    this.boardArray[this.activeBoardIndex].act(this.scale, (this.zoomin || this.zoomout ? null : this.mouseState), dt);
    
    // Check if new board available
    if(this.activeBoardIndex < this.boardArray.length-1 &&
    		this.boardArray[this.activeBoardIndex+1].button.disabled && 
    		this.boardArray[this.activeBoardIndex].finished){
    	this.boardArray[this.activeBoardIndex+1].button.disabled = false;
    	this.prompt = true;
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
			
			if(this.prompt){
				proceedContainer.style.display = 'none';
		    	windowDiv.innerHTML = '<div class="windowPrompt"><div><h1>The "'+this.categories[this.activeBoardIndex+1].name+'" category is now available!</h1></div></div>';
		    	var windowPrompt = windowDiv.getElementsByClassName("windowPrompt")[0];
		    	var zoomin = function(){
		    		windowPrompt.removeEventListener('animationend', zoomin);
					setTimeout(function(){
						windowPrompt.style.animation = 'promptFade 1s';
						var fadeout = function(){
							windowPrompt.style.animation = '';
							windowPrompt.removeEventListener('animationend', fadeout);
							windowDiv.innerHTML = '';
							windowDiv.style.animation = '';
						}
						windowPrompt.addEventListener('animationend', fadeout, false);
					}, 500);
				};
				windowDiv.style.animation = 'none';
				windowPrompt.style.animation = 'openWindow 0.5s';
				windowPrompt.addEventListener('animationend', zoomin, false);
		    	this.prompt = false;
			}
			
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
					game.updateNode();
				}
			}
		}
	} // If there is a new node zoom into it
	else if(this.zoomin){ 
		
		// Get the current board
		var board = this.boardArray[this.activeBoardIndex];
		
		// If board is not finished look for next node
		if(!board.finished && this.targetNode==null){
			this.targetNode = board.getFreeNode();
		}
		else if(board.finished){
			this.zoomin = false;
			this.zoomout = true;
		}
		
		// Start moving and zooming if target found
		if(this.zoomin && this.targetNode){
	
			// Zoom in and move towards target node
			if(this.getZoom()<Constants.endZoom)
				board.zoom += dt*Constants.zoomSpeed;
			else if(this.getZoom()>Constants.endZoom)
				board.zoom = Constants.endZoom;
			board.moveTowards(this.targetNode.position, dt, Constants.zoomMoveSpeed);

			// Update the zoom slider
			zoomSlider.value = -this.getZoom();
			
			// If reached the node and zoomed in stop and get rid of the target
			if(this.getZoom()==Constants.endZoom && board.boardOffset.x==this.targetNode.position.x && board.boardOffset.y==this.targetNode.position.y){
				this.zoomin = false;
				this.targetNode = null;
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

p.updateNode = function(){
	this.zoomin = true;
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
	proceedContainer.style.display = 'none';
	
	this.save();
	
}

p.save = function(){
	
	// Get the current case data
	var caseData = JSON.parse(localStorage['caseData']);
	caseData.saveFile = DataParser.createXMLSaveFile(this.activeBoardIndex, this.boardArray, true);
	
	// Autosave on window close
	var filesToStore = this.boardArray[this.activeBoardIndex].windowClosed();
	if (filesToStore){
		filesToStore.board = this.activeBoardIndex;
		this.saveFiles.push(filesToStore);
		this.nextFileInSaveStack(caseData);
	}
	localStorage['caseData'] = JSON.stringify(caseData);
	
}

p.nextFileInSaveStack = function(caseData){
	
	var curData = JSON.parse(localStorage['caseData']);
	curData.submitted = caseData.submitted;
	localStorage['caseData'] = JSON.stringify(curData);
	
	if(this.saveFiles.length>0){
		FileManager.removeFilesFor(caseData, this.saveFiles[0]);
		FileManager.addNewFilesToSystem(caseData, this.saveFiles[0], this.nextFileInSaveStack.bind(this));
	}
	this.saveFiles.shift();
}

p.submit = function(){
	
}

module.exports = game;

},{"../helper/drawlib.js":9,"../helper/fileManager.js":10,"../helper/iparDataParser.js":11,"../helper/mouseState.js":12,"../helper/point.js":13,"./board.js":5,"./constants.js":6,"./lessonNode.js":8}],8:[function(require,module,exports){
"use strict";
var DrawLib = require('../helper/drawlib.js');
var Question = require("../case/question.js");
var Constants = require("./constants.js");
var Point = require('../helper/point.js');

var CHECK_IMAGE = "../img/iconPostItCheck.png";

//parameter is a point that denotes starting position
function lessonNode(startPosition, imagePath, pQuestion){
    
    this.position = startPosition;
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
            that.width = that.width / x;
            that.height = that.height / x;
        }
        

        that.position.x += that.width/2 * that.question.scale;
        that.position.y += that.height/2 * that.question.scale;
    };
    
    this.image.src = imagePath;
    this.check.src = CHECK_IMAGE;
}

var p = lessonNode.prototype;

p.draw = function(ctx, canvas){

	// Check if question is visible
	if(this.question.currentState==Question.SOLVE_STATE.HIDDEN){
		if(this.question.revealThreshold <= this.connections){
			this.question.currentState = Question.SOLVE_STATE.UNSOLVED;
			this.currentState = this.question.currentState;
		}
		else
			return;
	}
	
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
    switch (this.question.currentState) {
    	case 1:
    		ctx.fillStyle = "blue";
			ctx.strokeStyle = "cyan";
			break;
     	case 2:
     		ctx.drawImage(this.check, this.position.x + this.width/2 - Constants.boardSize.x/50, this.position.y + this.height/2 - Constants.boardSize.x/50, Constants.boardSize.x/50, Constants.boardSize.x/50);
    		ctx.fillStyle = "green";
			ctx.strokeStyle = "yellow";
			break;
    }
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

module.exports = lessonNode;

},{"../case/question.js":3,"../helper/drawlib.js":9,"../helper/point.js":13,"./constants.js":6}],9:[function(require,module,exports){
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
	var categories = Parser.getCategoriesAndQuestions(xmlData, windowDiv);
	
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
		console.log(categories[1].questions[4].files);
		console.log(categories[1].questions[4].imageLink);
		Parser.assignQuestionStates(categories, saveData.getElementsByTagName("question"));
	}
	else
		stage = 1;
	
	// return results
	return {categories: categories, category:stage-1}; // maybe stage + 1 would be better because they are not zero indexed?
			   
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
	
	var caseData = JSON.parse(localStorage['caseData']);
	
	var zip = new JSZip();
	zip.file("caseFile.ipardata", caseData.caseFile);
	zip.file("saveFile.ipardata", caseData.saveFile);
	var submitted = zip.folder('submitted');
	console.log(caseData.submitted);
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
},{"../case/category.js":2,"../case/resources.js":4,"./iparDataParser.js":11,"./utilities.js":14}],11:[function(require,module,exports){
"use strict";
var Category = require("../case/category.js");
var Resource = require("../case/resources.js");
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
	console.log("qelems: " + questionElems.length);
	var tally = 0; // track total index in nested loop
	
	// all questions
	for (var i=0; i<categories.length; i++) {
		console.log("CATEGORY " + i);
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

// takes the xml structure and fills in the data for the question object
m.getCategoriesAndQuestions = function(xmlData, windowDiv) {
	// if there is a case file
	if (xmlData != null) {
		
		// Get player data 
		firstName = xmlData.getElementsByTagName("case")[0].getAttribute("profileFirst");
		lastName = xmlData.getElementsByTagName("case")[0].getAttribute("profileLast");
		xmlData.getElementsByTagName("case")[0].getAttribute("profileMail");
		
		// First load the resources
		var resourceElements = xmlData.getElementsByTagName("resourceList")[0].getElementsByTagName("resource");
		var resources = [];
		for (var i=0; i<resourceElements.length; i++) {
			// Load each resource
			resources[i] = new Resource(resourceElements[i]);
		}
		
		// Then load the categories
		var categoryElements = xmlData.getElementsByTagName("category");
		var categoryNames = xmlData.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
		var categories = [];
		for (var i=0; i<categoryElements.length; i++) {
			// Load each category (which loads each question)
			categories[i] = new Category(categoryNames[i].innerHTML, categoryElements[i], resources, windowDiv);
		}
		return categories;
	}
	return null
}

// creates a case file for zipping
m.recreateCaseFile = function(boards) {

	// create save file text
	var dataToSave = m.createXMLSaveFile(boards, true);
	
	console.log ("saveData.ipar data created");
	
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

},{"../case/category.js":2,"../case/question.js":3,"../case/resources.js":4,"../game/constants.js":6,"./utilities.js":14}],12:[function(require,module,exports){
"use strict";
var Point = require('./point.js');

// private variables
var mousePosition, relativeMousePosition;
var mouseDownTimer, maxClickDuration;
var mouseWheelVal;
var prevTime;
var deltaY;
var scaling, touchZoom, startTouchZoom;

function mouseState(boards){
	mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    this.virtualPosition = new Point(0,0);
    
    //event listeners for mouse interactions with the canvases
    var mouseState = this;
    for(var i=0;i<boards.length;i++){
    	var canvas = boards[i].canvas;
	    canvas.addEventListener("mousemove", function(e){
	    	e.preventDefault();
	        updatePosition(e);
	    });
	    canvas.addEventListener("touchmove", function(e){
	    	e.preventDefault();
	    	if(scaling)
	    		updateTouchPositions(e);
	    	else
	    		updatePosition(e.touches[0]);
	    });
	    canvas.addEventListener("mousedown", function(e){
	    	e.preventDefault();
	    	mouseState.mouseDown = true;
	    });
	    canvas.addEventListener("touchstart", function(e){
	    	e.preventDefault();
	    	if(e.touches.length == 1 && !scaling){
		        updatePosition(e.touches[0]);
		        setTimeout(function(){
		        	mouseState.mouseDown = true;
		        });
	    	}
	    	else if(e.touches.length == 2){
	    		mouseState.mouseDown = false;
	    		scaling = true;
	    		updateTouchPositions(e);
	    		startTouchZoom = touchZoom;
	    	}
	    });
	    canvas.addEventListener("mouseup", function(e){
	    	e.preventDefault();
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
    
    // Set variable defaults
    this.mouseDown = false;
    this.mouseIn = false;
    mouseDownTimer = 0;
    deltaY = 0;
    this.mouseWheelDY = 0;
    this.zoomDiff = 0;
    touchZoom = 0;
    this.mouseClicked = false;
    maxClickDuration = 200;
	
}

function updatePosition(e){
    mousePosition = new Point(e.clientX, e.clientY);
    relativeMousePosition = new Point(mousePosition.x - (window.innerWidth/2.0), mousePosition.y - (window.innerHeight/2.0));
}

function updateTouchPositions(e){
	var curTouches = [
	               new Point(e.touches[0].clientX, e.touches[0].clientY),
	               new Point(e.touches[1].clientX, e.touches[1].clientY)
	];
	touchZoom = Math.sqrt(Math.pow(curTouches[0].x-curTouches[1].x, 2)+Math.pow(curTouches[0].y-curTouches[1].y, 2));
}

var p = mouseState.prototype;

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

module.exports = mouseState;
},{"./point.js":13}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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

//determines whether the mouse is intersecting the active element
m.mouseIntersect = function(pMouseState, pElement, pOffsetter){
    if(pMouseState.virtualPosition.x > pElement.position.x - pElement.width/2 - pOffsetter.x && pMouseState.virtualPosition.x < pElement.position.x + pElement.width/2 - pOffsetter.x){
        if(pMouseState.virtualPosition.y > pElement.position.y - pElement.height/2 - pOffsetter.y && pMouseState.virtualPosition.y < pElement.position.y + pElement.height/2 - pOffsetter.y){
            //pElement.mouseOver = true;
            return true;
            pMouseState.hasTarget = true;
        }
        else{
            //pElement.mouseOver = false;
            return false;
        }
    }
    else{
    	return false;
        //pElement.mouseOver = false;
    }
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

},{"./point.js":13}],15:[function(require,module,exports){

var m = module.exports;

m.taskWindow = '\
<div class="window left">\
	<div class="title">\
		Task\
	</div>\
	<div class="windowContent" style="overflow-y: scroll;height:35vh;">\
		<h3><b>%title%</b></h3>\
		<p>%instructions%</p>\
		<hr>\
		<p><b>%question%</b></p>\
		<hr>\
		<p class="feedback"></p>\
	</div>\
</div>\
';


m.resourceWindow = '\
<div class="window left">\
	<div class="title">\
		Resource\
	</div>\
	<div class="windowContent" style="overflow-y: scroll; height:20vh;">\
		%resources%\
	</div>\
</div>\
';

m.resource = '\
<div class="resourceItem">\
  <img src="%icon%"/>\
  %title%\
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
	\
	</div>\
</div>\
';

m.fileWindow = '\
<div class="window right">\
  <div class="title">\
    Files\
  </div>\
  <div class="windowContent" style="height:25vh;min-height: 100px;">\
	<div class="fileButton full">\
		<img src="../img/iconFileSubmit.png"/><br>\
		Browse And Submit\
	</div>\
    <input type="file" style="display:none;" multiple/>\
  </div>\
</div>\
';

m.messageWindow = '\
<div class="window">\
	<div class="title">\
		Message\
	</div>\
	<div class="windowContent" style="height:80vh;overflow-y:scroll;">\
		<p><b>From </b>%title%</p>\
		<hr>\
		<p><b>Subject </b>%instructions%</p>\
		<hr>\
		<p>%question%</p>\
	  <button class="answer">Mark as Read</button>\
	</div>\
</div>\
';
},{}],16:[function(require,module,exports){
var Utilities = require('../helper/utilities.js');

// HTML
var section;

// Elements
var title, description;
var resume, start, back;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, TITLE: 1, NEW_PROFILE: 2, OLD_PROFILE: 3});

function CaseMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	title = document.querySelector('#'+section.id+' #title');
	description = document.querySelector('#'+section.id+' #description');
	resume = document.querySelector('#'+section.id+' #resume-button');
	start = document.querySelector('#'+section.id+' #start-button');
	back = document.querySelector('#'+section.id+' #back-button');
	
	// Setup the buttons
    var page = this;
    resume.onclick = function(){
    	page.next = NEXT.OLD_PROFILE;
    	page.close();
    };
    start.onclick = function(){
    	page.next = NEXT.NEW_PROFILE;
    	page.close();
    };
    back.onclick = function(){
    	page.next = NEXT.TITLE;
    	page.close();
    };
}

var p = CaseMenu.prototype;

p.open = function(){
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Get the current case data from local storage
	var caseData = JSON.parse(localStorage['caseData']);
	
	// Get the case name and description from the xml
	var curCase = Utilities.getXml(caseData.caseFile).getElementsByTagName("case")[0];
	title.innerHTML = curCase.getAttribute("caseName");
	description.innerHTML = curCase.getAttribute("description");
	
	// Get the case save status
	caseStatus = Utilities.getXml(caseData.saveFile).getElementsByTagName("case")[0].getAttribute("caseStatus");
	var statusMessage = "";
	switch(caseStatus){
		case '0':
			statusMessage = "";
			resume.disabled = true;
			break;
		case '1':
			statusMessage = " [In Progress]";
			break;
		case '2':
			statusMessage = " [Completed]";
			break;
	}
    title.innerHTML += statusMessage;
    
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = CaseMenu;
module.exports.NEXT = NEXT;
},{"../helper/utilities.js":14}],17:[function(require,module,exports){
var Utilities = require('../helper/utilities.js');

// HTML
var section;

//Elements
var title;
var firstName, lastName, email;
var firstNameInput, lastNameInput, emailInput;
var proceed, back;

// If making a new profile or not
var newProfile;

// The cur case
var curCase;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, CASE: 1, BOARD: 2});

function ProfileMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	title = document.querySelector('#'+section.id+' #title');
	firstName = document.querySelector('#'+section.id+' #first-name');
	lastName = document.querySelector('#'+section.id+' #last-name');
	email = document.querySelector('#'+section.id+' #email');
	firstNameInput = document.querySelector('#'+section.id+' #input-first-name');
	lastNameInput = document.querySelector('#'+section.id+' #input-last-name');
	emailInput = document.querySelector('#'+section.id+' #input-email');
	proceed = document.querySelector('#'+section.id+' #proceed-button');
	back = document.querySelector('#'+section.id+' #back-button');
    
	// Setup the buttons
	back.onclick = function(){
    	page.next = NEXT.CASE;
    	page.close();
    };
	var page = this;
    proceed.onclick = function(){
    	page.next = NEXT.BOARD;
    	if(newProfile){
			curCase.setAttribute("profileFirst", firstNameInput.value);
			curCase.setAttribute("profileLast", lastNameInput.value);
			curCase.setAttribute("profileMail", emailInput.value);
			curCase.setAttribute("caseStatus", "0");
    	}
    	else
			curCase.setAttribute("caseStatus", "1");
    	var caseData = JSON.parse(localStorage['caseData']);
    	caseData.saveFile = new XMLSerializer().serializeToString(curCase);
		localStorage['caseData'] = JSON.stringify(caseData);
    	page.close();
    };
}

var p = ProfileMenu.prototype;

p.open = function(pNewProfile){

	
	// Save the status of new profile for the procceed button
	newProfile = pNewProfile;
	
	// Make the menu visible
	section.style.display = '';
	
	// The case data and the title element
	var caseData = JSON.parse(localStorage['caseData']);
	
	// Get the case
	var saveFile = Utilities.getXml(caseData.saveFile);
	curCase = saveFile.getElementsByTagName("case")[0];
	
	// Set up the page for a new profile
	if(newProfile){
		
		// Update the title
		title.innerHTML = "Enter Profile Information";
		
		// Display the inputs and clear the names
		email.style.display = '';
		firstNameInput.style.display = '';
		lastNameInput.style.display = '';
		firstName.innerHTML = '';
		lastName.innerHTML = '';
		
		
		// Make it so that proceed is disabled until all three inputs have values
		var checkProceed = function(){
			if(firstNameInput.value=="" ||
				lastNameInput.value=="" ||
				emailInput.value=="")
				proceed.disabled = true;
			else
				proceed.disabled = false;
		};
		firstNameInput.addEventListener('change', checkProceed);
		lastNameInput.addEventListener('change', checkProceed);
		emailInput.addEventListener('change', checkProceed);
		checkProceed();
		
	}
	// Set up the page for an old profile
	else{
		
		// Update the title
		title.innerHTML = "Confirm Profile Information";
		
		// Hide the email and textboxes and display the current name
		email.style.display = 'none';
		firstNameInput.style.display = 'none';
		lastNameInput.style.display = 'none';
		firstName.innerHTML = curCase.getAttribute("profileFirst");
		firstName.style.fontWeight = 'bold';
		lastName.innerHTML = curCase.getAttribute("profileLast");
		lastName.style.fontWeight = 'bold';
		
		// Make procceed not disabled
		proceed.disabled = false;
		
	}
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = ProfileMenu;
module.exports.NEXT = NEXT;
},{"../helper/utilities.js":14}],18:[function(require,module,exports){

// HTML
var section;

// Parts of the html
var loadInput, loadButton, demoButton, continueButton, menuButton;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, BOARD: 1, CASE: 2});

function TitleMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the load button and input
	loadInput = document.querySelector('#'+section.id+' #load-input');
	loadButton = document.querySelector('#'+section.id+' #load-button');
	demoButton = document.querySelector('#'+section.id+' #demo-button');
	continueButton = document.querySelector('#'+section.id+' #continue-button');
	menuButton = document.querySelector('#'+section.id+' #menu-button');
	
	// Setup the buttons
	demoButton.onclick = this.demo.bind(this);
	loadButton.onclick = loadInput.click.bind(loadInput);
	loadInput.addEventListener('change', this.loadFile.bind(this), false);
	continueButton.onclick = this.close.bind(this);
	menuButton.onclick = function(){window.location.href = "../index.html";};
}

var p = TitleMenu.prototype;

p.open = function(){
	
	// Setup continue button based on local stoarge
	if(localStorage['caseData'])
		continueButton.disabled = false;
	else
		continueButton.disabled = true;
	this.next = NEXT.BOARD;
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Set the button to not disabled in case coming back to this menu
	loadButton.disabled = false;
	loadInput.disabled = false;
	demoButton.disabled = false;
	menuButton.disabled = false;
	
}

p.demo = function(){

	if(localStorage['caseData'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
		
	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	demoButton.disabled = true;
	continueButton.disabled = true;
	menuButton.disabled = true;
	
	var page = this;
	var request = new XMLHttpRequest();
	request.responseType = "arraybuffer";
	request.onreadystatechange = function() {
	  if (request.readyState == 4 && request.status == 200) {
		  	
		 	// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
			localStorage.setItem("autosave","");
			localStorage['caseName'] = "demo.ipar";
			
			// Create a worker for unzipping the file
			var zipWorker = new Worker("../lib/unzip.js");
			zipWorker.onmessage = function(message) {
				
				// Save the base url to local storage
				localStorage['caseData'] = JSON.stringify(message.data);
				
				// call the callback
				page.next = NEXT.BOARD;
				console.log(message.data);
				page.close();
			}
			
			// Start the worker
			zipWorker.postMessage(request.response);
	  }
	};
	request.open("GET", "demo.ipar", true);
	request.send();
	
}

p.loadFile = function(event){
	
	if(localStorage['caseData'] && !confirm("Are you sure you want to start a new case? Your autosave data will be lost!"))
		return;
	
	// Make sure a ipar file was choosen
	if(!loadInput.value.endsWith("ipar")){
		alert("You didn't choose an ipar file! you can only load ipar files!");
		return;
	}
	localStorage['caseName'] = event.target.files[0].name;

	// Set the button to disabled so that it can't be pressed while loading
	loadButton.disabled = true;
	loadInput.disabled = true;
	demoButton.disabled = true;
	continueButton.disabled = true;
	menuButton.disabled = true;
	
	// Create a reader and read the zip
	var page = this;
	var reader = new FileReader();
	reader.onload = function(event){
	
		// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
		localStorage.setItem("autosave","");
		
		// Create a worker for unzipping the file
		var zipWorker = new Worker("../lib/unzip.js");
		zipWorker.onmessage = function(message) {
			
			// Save the base url to local storage
			localStorage['caseData'] = JSON.stringify(message.data);
			
			// Redirect to the next page
			page.next = NEXT.CASE;
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
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJnYW1lL2pzL21haW4uanMiLCJnYW1lL2pzL21vZHVsZXMvY2FzZS9jYXRlZ29yeS5qcyIsImdhbWUvanMvbW9kdWxlcy9jYXNlL3F1ZXN0aW9uLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2Nhc2UvcmVzb3VyY2VzLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2dhbWUvYm9hcmQuanMiLCJnYW1lL2pzL21vZHVsZXMvZ2FtZS9jb25zdGFudHMuanMiLCJnYW1lL2pzL21vZHVsZXMvZ2FtZS9nYW1lLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2dhbWUvbGVzc29uTm9kZS5qcyIsImdhbWUvanMvbW9kdWxlcy9oZWxwZXIvZHJhd2xpYi5qcyIsImdhbWUvanMvbW9kdWxlcy9oZWxwZXIvZmlsZU1hbmFnZXIuanMiLCJnYW1lL2pzL21vZHVsZXMvaGVscGVyL2lwYXJEYXRhUGFyc2VyLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2hlbHBlci9tb3VzZVN0YXRlLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2hlbHBlci9wb2ludC5qcyIsImdhbWUvanMvbW9kdWxlcy9oZWxwZXIvdXRpbGl0aWVzLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL2h0bWwvcXVlc3Rpb25XaW5kb3dzLmpzIiwiZ2FtZS9qcy9tb2R1bGVzL21lbnVzL2Nhc2VNZW51LmpzIiwiZ2FtZS9qcy9tb2R1bGVzL21lbnVzL3Byb2ZpbGVNZW51LmpzIiwiZ2FtZS9qcy9tb2R1bGVzL21lbnVzL3RpdGxlTWVudS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4gfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbjtcclxuXHJcbi8vaW1wb3J0c1xyXG52YXIgR2FtZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9nYW1lL2dhbWUuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2hlbHBlci9wb2ludC5qcycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dhbWUvY29uc3RhbnRzLmpzJyk7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG52YXIgVGl0bGVNZW51ID0gcmVxdWlyZSgnLi9tb2R1bGVzL21lbnVzL3RpdGxlTWVudS5qcycpO1xyXG52YXIgQ2FzZU1lbnUgPSByZXF1aXJlKCcuL21vZHVsZXMvbWVudXMvY2FzZU1lbnUuanMnKTtcclxudmFyIFByb2ZpbGVNZW51ID0gcmVxdWlyZSgnLi9tb2R1bGVzL21lbnVzL3Byb2ZpbGVNZW51LmpzJyk7XHJcblxyXG4vLyBUaGUgY3VycmVudCBnYW1lXHJcbnZhciBnYW1lO1xyXG5cclxuLy8gVGhlIHNlY3Rpb24gaG9sZGluZyB0aGUgYm9hcmRcclxudmFyIGJvYXJkU2VjdGlvbjtcclxuXHJcbi8vIFRoZSBjdXJyZW50IHBhZ2UgdGhlIHdlYnNpdGUgaXMgb25cclxudmFyIGN1clBhZ2U7XHJcbnZhciBtZW51cyA9IFtdO1xyXG52YXIgUEFHRSA9IE9iamVjdC5mcmVlemUoe1RJVExFOiAwLCBDQVNFOiAxLCBQUk9GSUxFOiAyLCBCT0FSRDogM30pO1xyXG5cclxuLy9maXJlcyB3aGVuIHRoZSB3aW5kb3cgbG9hZHNcclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgc2VjdGlvbnNcclxuXHRib2FyZFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvYXJkXCIpO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRpdGxlIG1lbnVcclxuXHRtZW51c1tQQUdFLlRJVExFXSA9IG5ldyBUaXRsZU1lbnUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aXRsZU1lbnVcIikpO1xyXG5cdG1lbnVzW1BBR0UuVElUTEVdLm9uY2xvc2UgPSBmdW5jdGlvbigpe1xyXG5cdFx0c3dpdGNoKHRoaXMubmV4dCl7XHJcblx0XHRjYXNlIFRpdGxlTWVudS5ORVhULkJPQVJEOlxyXG5cdFx0XHRjdXJQYWdlID0gUEFHRS5CT0FSRDtcclxuXHRcdFx0Y3JlYXRlR2FtZSgpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgVGl0bGVNZW51Lk5FWFQuQ0FTRTpcclxuXHRcdFx0Y3VyUGFnZSA9IFBBR0UuQ0FTRTtcclxuXHRcdFx0bWVudXNbUEFHRS5DQVNFXS5vcGVuKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHQvLyBTZXR1cCBjYXNlIG1lbnVcclxuXHRtZW51c1tQQUdFLkNBU0VdID0gbmV3IENhc2VNZW51KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FzZU1lbnVcIikpO1xyXG5cdG1lbnVzW1BBR0UuQ0FTRV0ub25jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRzd2l0Y2godGhpcy5uZXh0KXtcclxuXHRcdGNhc2UgQ2FzZU1lbnUuTkVYVC5ORVdfUFJPRklMRTpcclxuXHRcdFx0Y29uc29sZS5sb2coXCJMT0FESU5HIE5FVyBQUk9GSUxFIE1FTlVcIik7XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLlBST0ZJTEU7XHJcblx0XHRcdG1lbnVzW1BBR0UuUFJPRklMRV0ub3Blbih0cnVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlIENhc2VNZW51Lk5FWFQuT0xEX1BST0ZJTEU6XHJcblx0XHRcdGNvbnNvbGUubG9nKFwiTE9BRElORyBPTEQgUFJPRklMRSBNRU5VXCIpO1xyXG5cdFx0XHRjdXJQYWdlID0gUEFHRS5QUk9GSUxFO1xyXG5cdFx0XHRtZW51c1tQQUdFLlBST0ZJTEVdLm9wZW4oZmFsc2UpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgQ2FzZU1lbnUuTkVYVC5USVRMRTpcclxuXHRcdFx0Y3VyUGFnZSA9IFBBR0UuVElUTEU7XHJcblx0XHRcdG1lbnVzW1BBR0UuVElUTEVdLm9wZW4oKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdC8vU2V0dXAgcHJvZmlsZSBtZW51XHJcblx0bWVudXNbUEFHRS5QUk9GSUxFXSA9IG5ldyBQcm9maWxlTWVudShkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2ZpbGVNZW51XCIpKTtcclxuXHRtZW51c1tQQUdFLlBST0ZJTEVdLm9uY2xvc2UgPSBmdW5jdGlvbigpe1xyXG5cdFx0c3dpdGNoKHRoaXMubmV4dCl7XHJcblx0XHRjYXNlIFByb2ZpbGVNZW51Lk5FWFQuQk9BUkQ6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLkJPQVJEO1xyXG5cdFx0XHRjcmVhdGVHYW1lKCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSBQcm9maWxlTWVudS5ORVhULkNBU0U6XHJcblx0XHRcdGN1clBhZ2UgPSBQQUdFLkNBU0U7XHJcblx0XHRcdG1lbnVzW1BBR0UuQ0FTRV0ub3BlbigpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0XHJcblx0Ly8gT3BlbiB0aGUgdGl0bGUgbWVudVxyXG4gICAgY3VyUGFnZSA9IFBBR0UuVElUTEU7XHJcbiAgICBtZW51c1tQQUdFLlRJVExFXS5vcGVuKCk7XHJcbiAgICBcclxufVxyXG5cclxuLy8gY3JlYXRlIHRoZSBnYW1lIG9iamVjdCBhbmQgc3RhcnQgdGhlIGxvb3Agd2l0aCBhIGR0XHJcbmZ1bmN0aW9uIGNyZWF0ZUdhbWUoKXtcclxuXHRcclxuXHQvLyBTaG93IHRoZSBzZWN0aW9uIGZvciB0aGUgZ2FtZVxyXG5cdGJvYXJkU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcclxuICAgIC8vIENyZWF0ZSB0aGUgZ2FtZVxyXG4gICAgZ2FtZSA9IG5ldyBHYW1lKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRcIiksIFV0aWxpdGllcy5nZXRTY2FsZShDb25zdGFudHMuYm9hcmRTaXplLCBuZXcgUG9pbnQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCkpKTtcclxuICAgIFxyXG4gICAgLy8gU3RhcnQgdGhlIGdhbWUgbG9vcFxyXG4gICAgZ2FtZUxvb3AoRGF0ZS5ub3coKSk7XHJcbiAgICBcclxufVxyXG5cclxuLy9maXJlcyBvbmNlIHBlciBmcmFtZSBmb3IgdGhlIGdhbWVcclxuZnVuY3Rpb24gZ2FtZUxvb3AocHJldlRpbWUpe1xyXG5cdFxyXG4gICAgXHJcblx0Ly8gZ2V0IGRlbHRhIHRpbWVcclxuICAgIHZhciBkdCA9IERhdGUubm93KCkgLSBwcmV2VGltZTtcclxuICAgIFxyXG4gICAgLy8gdXBkYXRlIGdhbWVcclxuICAgIGdhbWUudXBkYXRlKGR0KTtcclxuICAgIFxyXG5cdC8vIGxvb3BcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZ2FtZUxvb3AuYmluZCh0aGlzLCBEYXRlLm5vdygpKSk7XHJcbiAgICBcclxufVxyXG5cclxuLy9saXN0ZW5zIGZvciBjaGFuZ2VzIGluIHNpemUgb2Ygd2luZG93IGFuZCBzY2FsZXMgdGhlIGdhbWUgYWNjb3JkaW5nbHlcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHJcblx0Ly8gU2NhbGUgdGhlIGdhbWUgdG8gdGhlIG5ldyBzaXplXHJcblx0aWYoY3VyUGFnZT09UEFHRS5CT0FSRClcclxuXHRcdGdhbWUuc2V0U2NhbGUoVXRpbGl0aWVzLmdldFNjYWxlKENvbnN0YW50cy5ib2FyZFNpemUsIG5ldyBQb2ludCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KSkpO1xyXG5cdFxyXG59KTtcclxuXHJcbi8vIExpc3RlbiBmb3IgdG91Y2ggZm9yIGZ1bGxzY3JlZW4gd2hpbGUgaW4gZ2FtZSBvbiBtb2JpbGVcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihldmVudCl7XHJcblx0XHJcblx0aWYoY3VyUGFnZT09UEFHRS5CT0FSRCAmJiB3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjBweClcIikpXHJcblx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcclxuXHRcclxufSwgZmFsc2UpOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcclxuXHJcbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcclxuZnVuY3Rpb24gQ2F0ZWdvcnkobmFtZSwgeG1sLCByZXNvdXJjZXMsIHdpbmRvd0Rpdil7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgbmFtZVxyXG5cdHRoaXMubmFtZSA9IG5hbWU7XHJcblx0XHJcblx0Ly8gTG9hZCBhbGwgdGhlIHF1ZXN0aW9uc1xyXG5cdHZhciBxdWVzdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG5cdHRoaXMucXVlc3Rpb25zID0gW107XHJcblx0Ly8gY3JlYXRlIHF1ZXN0aW9uc1xyXG5cdGZvciAodmFyIGk9MDsgaTxxdWVzdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBcclxuXHR7XHJcblx0XHQvLyBjcmVhdGUgYSBxdWVzdGlvbiBvYmplY3RcclxuXHRcdHRoaXMucXVlc3Rpb25zW2ldID0gbmV3IFF1ZXN0aW9uKHF1ZXN0aW9uRWxlbWVudHNbaV0sIHJlc291cmNlcywgd2luZG93RGl2LCBpKTtcclxuXHR9XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYXRlZ29yeTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2dhbWUvY29uc3RhbnRzLmpzJyk7XHJcbnZhciBXaW5kb3dzID0gcmVxdWlyZSgnLi4vaHRtbC9xdWVzdGlvbldpbmRvd3MuanMnKTtcclxuXHJcbnZhciBTT0xWRV9TVEFURSA9IE9iamVjdC5mcmVlemUoe0hJRERFTjogMCwgVU5TT0xWRUQ6IDEsIFNPTFZFRDogMn0pO1xyXG52YXIgUVVFU1RJT05fVFlQRSA9IE9iamVjdC5mcmVlemUoe0pVU1RJRklDQVRJT046IDEsIE1VTFRJUExFX0NIT0lDRTogMiwgU0hPUlRfUkVTUE9OU0U6IDMsIEZJTEU6IDQsIE1FU1NBR0U6IDV9KTtcclxuXHJcbi8qIFF1ZXN0aW9uIHByb3BlcnRpZXM6XHJcbmN1cnJlbnRTdGF0ZTogU09MVkVfU1RBVEVcclxud2luZG93RGl2OiBlbGVtZW50XHJcbmNvcnJlY3Q6IGludFxyXG5wb3NpdGlvblBlcmNlbnRYOiBmbG9hdFxyXG5wb3NpdGlvblBlcmNlbnRZOiBmbG9hdFxyXG5yZXZlYWxUaHJlc2hvbGQ6IGludFxyXG5pbWFnZUxpbms6IHN0cmluZ1xyXG5mZWVkYmFja3M6IHN0cmluZ1tdXHJcbmNvbm5lY3Rpb25FbGVtZW50czogZWxlbWVudFtdXHJcbmNvbm5lY3Rpb25zOiBpbnRbXVxyXG5xdWVzdGlvblR5cGU6IFNPTFZFX1NUQVRFXHJcbmp1c3RpZmljYXRpb246IHN0cmluZ1xyXG53cm9uZ0Fuc3dlcjogc3RyaW5nXHJcbmNvcnJlY3RBbnN3ZXI6IHN0cmluZ1xyXG4qL1xyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBRdWVzdGlvbih4bWwsIHJlc291cmNlcywgd2luZG93RGl2LCBudW0pe1xyXG5cdFxyXG5cdC8vIFNldCB0aGUgY3VycmVudCBzdGF0ZSB0byBkZWZhdWx0IGF0IGhpZGRlbiBhbmQgc3RvcmUgdGhlIHdpbmRvdyBkaXZcclxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuSElEREVOO1xyXG4gICAgdGhpcy53aW5kb3dEaXYgPSB3aW5kb3dEaXY7XHJcbiAgICB0aGlzLm51bSA9IG51bTtcclxuICAgIFxyXG4gICAgLy8gR2V0IGFuZCBzYXZlIHRoZSBnaXZlbiBpbmRleCwgY29ycmVjdCBhbnN3ZXIsIHBvc2l0aW9uLCByZXZlYWwgdGhyZXNob2xkLCBpbWFnZSBsaW5rLCBmZWVkYmFjaywgYW5kIGNvbm5lY3Rpb25zXHJcbiAgICB0aGlzLmNvcnJlY3QgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwiY29ycmVjdEFuc3dlclwiKSk7XHJcbiAgICB0aGlzLnBvc2l0aW9uUGVyY2VudFggPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJ4UG9zaXRpb25QZXJjZW50XCIpKSwgMCwgMTAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngpO1xyXG4gICAgdGhpcy5wb3NpdGlvblBlcmNlbnRZID0gVXRpbGl0aWVzLm1hcChwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwieVBvc2l0aW9uUGVyY2VudFwiKSksIDAsIDEwMCwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55KTtcclxuICAgIHRoaXMucmV2ZWFsVGhyZXNob2xkID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInJldmVhbFRocmVzaG9sZFwiKSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKHhtbCk7XHJcbiAgICB0aGlzLmltYWdlTGluayA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJpbWFnZUxpbmtcIik7XHJcbiAgICB0aGlzLmZlZWRiYWNrcyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZlZWRiYWNrXCIpO1xyXG4gICAgdmFyIHNjYWxlID0geG1sLmdldEF0dHJpYnV0ZShcInNjYWxlXCIpO1xyXG4gICAgaWYoc2NhbGU9PT1cIlwiIHx8ICFzY2FsZSlcclxuICAgIFx0dGhpcy5zY2FsZSA9IDE7XHJcbiAgICBlbHNlXHJcbiAgICBcdHRoaXMuc2NhbGUgPSBOdW1iZXIoc2NhbGUpO1xyXG4gICAgdGhpcy5uZXdGaWxlcyA9IGZhbHNlO1xyXG4gICAgdGhpcy5maWxlcyA9IFtdO1xyXG4gICAgdmFyIGNvbm5lY3Rpb25FbGVtZW50cyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvbm5lY3Rpb25zXCIpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IFtdO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjb25uZWN0aW9uRWxlbWVudHMubGVuZ3RoO2krKylcclxuICAgIFx0dGhpcy5jb25uZWN0aW9uc1tpXSA9IHBhcnNlSW50KGNvbm5lY3Rpb25FbGVtZW50c1tpXS5pbm5lckhUTUwpO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdGhlIHdpbmRvd3MgZm9yIHRoaXMgcXVlc3Rpb24gYmFzZWQgb24gdGhlIHF1ZXN0aW9uIHR5cGVcclxuICAgIHRoaXMucXVlc3Rpb25UeXBlID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInF1ZXN0aW9uVHlwZVwiKSk7XHJcbiAgICB0aGlzLmp1c3RpZmljYXRpb24gPSB0aGlzLnF1ZXN0aW9uVHlwZT09MSB8fCB0aGlzLnF1ZXN0aW9uVHlwZT09MztcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZSE9NSl7XHJcblx0XHR0aGlzLmNyZWF0ZVRhc2tXaW5kb3coeG1sKTtcclxuXHRcdHRoaXMuY3JlYXRlUmVzb3VyY2VXaW5kb3coeG1sLCByZXNvdXJjZXMpO1xyXG5cdH1cclxuXHRzd2l0Y2godGhpcy5xdWVzdGlvblR5cGUpe1xyXG5cdFx0Y2FzZSA1OlxyXG5cdFx0XHR0aGlzLmNyZWF0ZU1lc3NhZ2VXaW5kb3coeG1sKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlIDQ6XHJcblx0XHRcdHRoaXMuY3JlYXRlRmlsZVdpbmRvdygpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgMzpcclxuXHRcdGNhc2UgMjpcclxuXHRcdGNhc2UgMTpcclxuXHRcdFx0dGhpcy5jcmVhdGVBbnN3ZXJXaW5kb3coeG1sLCB0aGlzLnF1ZXN0aW9uVHlwZSE9Myk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdH1cclxuICAgIFxyXG59XHJcblxyXG52YXIgcCA9IFF1ZXN0aW9uLnByb3RvdHlwZTtcclxuXHJcbnAuc2hvd1ByZXZTdWJtaXR0ZWRGaWxlcyA9IGZ1bmN0aW9uKGZpbGVzKSB7XHJcblx0Ly8gYWNrbm93bGVkZ2Ugc3VibWl0dGVkIGZpbGVzIGluIHRhc2sgd2luZG93XHJcblx0aWYoZmlsZXMubGVuZ3RoPjApXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdTdWJtaXR0ZWQgRmlsZXM6PGJyLz4nO1xyXG5cdGVsc2VcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJyc7XHJcblx0Zm9yKHZhciBpPTA7aTxmaWxlcztpKyspXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCArPSAnPHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK2ZpbGVzW2ldLm5hbWUrJzwvc3Bhbj48YnIvPic7XHJcbn1cclxuXHJcbnAud3JvbmdBbnN3ZXIgPSBmdW5jdGlvbihudW0pe1xyXG5cclxuICAvLyBJZiBmZWViYWNrIGRpc3BsYXkgaXRcclxuXHRpZih0aGlzLmZlZWRiYWNrcy5sZW5ndGg+MClcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1wiJytTdHJpbmcuZnJvbUNoYXJDb2RlKG51bSArIFwiQVwiLmNoYXJDb2RlQXQoKSkrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnXCIgaXMgbm90IGNvcnJlY3QgPGJyLz4mbmJzcDs8c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmZlZWRiYWNrc1tudW1dLmlubmVySFRNTCsnPC9zcGFuPjxici8+JztcclxuXHRpZih0aGlzLnRhc2tDb250ZW50KVxyXG5cdFx0dGhpcy50YXNrQ29udGVudC5zY3JvbGxUb3AgPSB0aGlzLnRhc2tDb250ZW50LnNjcm9sbEhlaWdodDtcclxufVxyXG5cclxucC5jb3JyZWN0QW5zd2VyID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBEaXNhYmxlIGFsbCB0aGUgYW5zd2VyIGJ1dHRvbnNcclxuXHRpZih0aGlzLmFuc3dlcnMpXHJcblx0XHRmb3IodmFyIGk9MDtpPHRoaXMuYW5zd2Vycy5sZW5ndGg7aSsrKVxyXG5cdFx0XHR0aGlzLmFuc3dlcnNbaV0uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdGlmKHRoaXMudGFza0NvbnRlbnQpXHJcblx0XHR0aGlzLnRhc2tDb250ZW50LnNjcm9sbFRvcCA9IHRoaXMudGFza0NvbnRlbnQuc2Nyb2xsSGVpZ2h0O1xyXG5cdFxyXG5cdC8vIElmIGZlZWRiYWNrIGRpc3BsYXkgaXRcclxuXHRpZih0aGlzLmZlZWRiYWNrcy5sZW5ndGg+MClcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1wiJytTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMuY29ycmVjdCArIFwiQVwiLmNoYXJDb2RlQXQoKSkrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnXCIgaXMgdGhlIGNvcnJlY3QgcmVzcG9uc2UgPGJyLz48c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmZlZWRiYWNrc1t0aGlzLmNvcnJlY3RdLmlubmVySFRNTCsnPC9zcGFuPjxici8+JztcclxuXHRcclxuXHRcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTMgJiYgdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlICE9ICcnKVxyXG5cdFx0dGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSAnU3VibWl0dGVkIFRleHQ6PGJyLz48c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlKyc8L3NwYW4+PGJyLz4nO1xyXG5cdFxyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPT09MSAmJiB0aGlzLmp1c3RpZmljYXRpb24udmFsdWUgIT0gJycpXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCArPSAnU3VibWl0dGVkIFRleHQ6PGJyLz48c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlKyc8L3NwYW4+PGJyLz4nO1xyXG5cdFxyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPT09NCl7XHJcblx0XHRpZih0aGlzLmZpbGVzLmxlbmd0aD4wKVxyXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdTdWJtaXR0ZWQgRmlsZXM6PGJyLz4nO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0Zm9yKHZhciBpPTA7aTx0aGlzLmZpbGVzLmxlbmd0aDtpKyspXHJcblx0XHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MICs9ICc8c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrdGhpcy5maWxlc1tpXSsnPC9zcGFuPjxici8+JztcclxuXHR9XHJcbiAgXHJcbiAgaWYodGhpcy5jdXJyZW50U3RhdGUhPVNPTFZFX1NUQVRFLlNPTFZFRCAmJiBcclxuICAgICAoKCh0aGlzLnF1ZXN0aW9uVHlwZT09PTMgfHwgdGhpcy5xdWVzdGlvblR5cGU9PT0xKSAmJiB0aGlzLmp1c3RpZmljYXRpb24udmFsdWUgIT0gJycpIHx8XHJcbiAgICAgICh0aGlzLnF1ZXN0aW9uVHlwZT09PTQgJiYgdGhpcy5maWxlSW5wdXQuZmlsZXMubGVuZ3RoPjApIHx8XHJcbiAgICAgICB0aGlzLnF1ZXN0aW9uVHlwZT09PTIpKXsgXHJcbiAgICAvLyBTZXQgdGhlIHN0YXRlIG9mIHRoZSBxdWVzdGlvbiB0byBjb3JyZWN0XHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0ZSA9IFNPTFZFX1NUQVRFLlNPTFZFRDtcclxuICAgIC8vIGlmIHRoZXJlIGlzIGEgcHJvY2VlZCBidXR0b25cclxuICAgIGlmICh0aGlzLnByb2NlZWRFbGVtZW50KSB7IFxyXG5cdFx0dGhpcy5wcm9jZWVkRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiOyAvLyBhbmltYXRlIHByb2NlZWQgYnV0dG9uXHJcblx0fVxyXG4gIH1cclxuXHRcclxufVxyXG5cclxucC5kaXNwbGF5V2luZG93cyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQWRkIHRoZSB3aW5kb3dzIHRvIHRoZSB3aW5kb3cgZGl2XHJcblx0dmFyIHdpbmRvd05vZGUgPSB0aGlzLndpbmRvd0RpdjtcclxuXHR2YXIgZXhpdEJ1dHRvbiA9IG5ldyBJbWFnZSgpO1xyXG5cdGV4aXRCdXR0b24uc3JjID0gXCIuLi9pbWcvaWNvbkNsb3NlLnBuZ1wiO1xyXG5cdGV4aXRCdXR0b24uY2xhc3NOYW1lID0gXCJleGl0LWJ1dHRvblwiO1xyXG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcblx0ZXhpdEJ1dHRvbi5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHF1ZXN0aW9uLndpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJzsgfTtcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTUpe1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm1lc3NhZ2UpO1xyXG5cdCAgICBleGl0QnV0dG9uLnN0eWxlLmxlZnQgPSBcIjc1dndcIjtcclxuXHR9XHJcblx0ZWxzZXtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy50YXNrKTtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5hbnN3ZXIpO1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLnJlc291cmNlKTtcclxuXHRcdGV4aXRCdXR0b24uc3R5bGUubGVmdCA9IFwiODV2d1wiO1xyXG5cdH1cclxuXHRpZih0aGlzLmN1cnJlbnRTdGF0ZSA9PT0gU09MVkVfU1RBVEUuU09MVkVEICYmIHRoaXMucXVlc3Rpb25UeXBlICE9IFFVRVNUSU9OX1RZUEUuTUVTU0FHRSkgIHtcclxuXHRcdC8vIGlmIHRoZXJlIGlzIGEgcHJvY2VlZCBidXR0b25cclxuXHRcdGlmICh0aGlzLnByb2NlZWRFbGVtZW50KSB7IFxyXG5cdFx0XHR0aGlzLnByb2NlZWRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7IC8vIGFuaW1hdGUgcHJvY2VlZCBidXR0b25cclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZChleGl0QnV0dG9uKTtcclxuXHRcclxufVxyXG5cclxucC5jcmVhdGVUYXNrV2luZG93ID0gZnVuY3Rpb24oeG1sKXtcclxuXHR0aGlzLnByb2NlZWRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9jZWVkQ29udGFpbmVyXCIpO1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgdGFzayB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy50YXNrV2luZG93O1xyXG4gICAgdGhpcy50YXNrID0gdGVtcERpdi5maXJzdENoaWxkO1xyXG4gICAgdGhpcy50YXNrLmlubmVySFRNTCA9IHRoaXMudGFzay5pbm5lckhUTUwucmVwbGFjZShcIiV0aXRsZSVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25OYW1lXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy50YXNrLmlubmVySFRNTCA9IHRoaXMudGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMudGFzay5pbm5lckhUTUwgPSB0aGlzLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlcXVlc3Rpb24lXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uVGV4dFwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuICAgIHRoaXMuZmVlZGJhY2sgPSB0aGlzLnRhc2suZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImZlZWRiYWNrXCIpWzBdO1xyXG4gICAgdGhpcy50YXNrQ29udGVudCA9IHRoaXMudGFzay5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXTtcclxufVxyXG5cclxucC5jcmVhdGVSZXNvdXJjZVdpbmRvdyA9IGZ1bmN0aW9uKHhtbCwgcmVzb3VyY2VGaWxlcyl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSByZXNvdXJjZSB3aW5kb3cgXHJcblx0dmFyIHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdHRlbXBEaXYuaW5uZXJIVE1MID0gV2luZG93cy5yZXNvdXJjZVdpbmRvdztcclxuICAgIHRoaXMucmVzb3VyY2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgaW5kaXZpZHVhbCByZXNvdWNlcyBpZiBhbnlcclxuXHR2YXIgcmVzb3VyY2VzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VJbmRleFwiKTtcclxuICAgIGlmKHJlc291cmNlcy5sZW5ndGggPiAwKXtcclxuICAgIFx0XHJcbiAgICBcdC8vIEdldCB0aGUgaHRtbCBmb3IgZWFjaCByZXNvdXJjZSBhbmQgdGhlbiBhZGQgdGhlIHJlc3VsdCB0byB0aGUgd2luZG93XHJcbiAgICBcdHZhciByZXNvdXJjZUhUTUwgPSAnJztcclxuXHQgICAgZm9yKHZhciBpPTA7aTxyZXNvdXJjZXMubGVuZ3RoO2krKyl7XHJcbiAgICBcdFx0dmFyIGN1clJlc291cmNlID0gV2luZG93cy5yZXNvdXJjZS5yZXBsYWNlKFwiJWljb24lXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLmljb24pO1xyXG5cdCAgICBcdGN1clJlc291cmNlID0gY3VyUmVzb3VyY2UucmVwbGFjZShcIiV0aXRsZSVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0udGl0bGUpO1xyXG5cdCAgICBcdGN1clJlc291cmNlID0gY3VyUmVzb3VyY2UucmVwbGFjZShcIiVsaW5rJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS5saW5rKTtcclxuXHQgICAgXHRyZXNvdXJjZUhUTUwgKz0gY3VyUmVzb3VyY2U7XHJcblx0ICAgIH1cclxuXHQgIFx0dGhpcy5yZXNvdXJjZS5pbm5lckhUTUwgPSB0aGlzLnJlc291cmNlLmlubmVySFRNTC5yZXBsYWNlKFwiJXJlc291cmNlcyVcIiwgcmVzb3VyY2VIVE1MKTtcclxuXHRcdCAgICAgICAgXHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHQvLyBEaXNwbGF5IHRoYXQgdGhlcmUgYXJlbid0IGFueSByZXNvdXJjZXNcclxuXHRcdHRoaXMucmVzb3VyY2UuaW5uZXJIVE1MID0gdGhpcy5yZXNvdXJjZS5pbm5lckhUTUwucmVwbGFjZShcIiVyZXNvdXJjZXMlXCIsIFwiTm8gcmVzb3VyY2VzIGhhdmUgYmVlbiBwcm92aWRlZCBmb3IgdGhpcyB0YXNrLlwiKTtcclxuXHRcdHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uc3R5bGUuY29sb3IgPSBcImdyZXlcIjtcclxuXHRcdHRoaXMucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkZGRkZGXCI7XHJcblx0XHR0aGlzLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLmNsYXNzTmFtZSArPSBcIiwgY2VudGVyXCI7XHJcblx0fVxyXG59XHJcblxyXG5wLmNyZWF0ZUFuc3dlcldpbmRvdyA9IGZ1bmN0aW9uKHhtbCwgYW5zd2Vycyl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBhbnN3ZXIgd2luZG93IFxyXG5cdHZhciB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHR0ZW1wRGl2LmlubmVySFRNTCA9IFdpbmRvd3MuYW5zd2VyV2luZG93O1xyXG4gICAgdGhpcy5hbnN3ZXIgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB0aGUgdGV4dCBlbGVtZW50IGlmIGFueVxyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHZhciBzdWJtaXQ7XHJcbiAgICBpZih0aGlzLmp1c3RpZmljYXRpb24pe1xyXG4gICAgXHR0aGlzLmp1c3RpZmljYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGV4dGFyZWFcIik7XHJcbiAgICBcdHRoaXMuanVzdGlmaWNhdGlvbi5zdWJtaXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgXHR0aGlzLmp1c3RpZmljYXRpb24uc3VibWl0LmNsYXNzTmFtZSA9IFwiYW5zd2VyIHN1Ym1pdFwiO1xyXG4gICAgXHR0aGlzLmp1c3RpZmljYXRpb24uc3VibWl0LmlubmVySFRNTCA9IFwiU3VibWl0XCI7XHJcbiAgICAgICAgdGhpcy5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHRxdWVzdGlvbi5jb3JyZWN0QW5zd2VyKCk7XHJcbiAgICBcdH07XHJcbiAgICBcdHRoaXMuanVzdGlmaWNhdGlvbi5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgXHRcdGlmKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24udmFsdWUubGVuZ3RoID4gMClcclxuICAgIFx0XHRcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBcdFx0ZWxzZVxyXG4gICAgXHRcdFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgXHR9LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBhbmQgZ2V0IGFsbCB0aGUgYW5zd2VyIGVsZW1lbnRzXHJcbiAgICBpZihhbnN3ZXJzKXtcclxuXHQgICAgdGhpcy5hbnN3ZXJzID0gW107XHJcblx0ICAgIHZhciBhbnN3ZXJzWG1sID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYW5zd2VyXCIpO1xyXG5cdCAgICB2YXIgY29ycmVjdCA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJjb3JyZWN0QW5zd2VyXCIpKTtcclxuXHQgICAgZm9yKHZhciBpPTA7aTxhbnN3ZXJzWG1sLmxlbmd0aDtpKyspe1xyXG5cdCAgICBcdGlmKHRoaXMuanVzdGlmaWNhdGlvbilcclxuXHQgICAgXHRcdHRoaXMuanVzdGlmaWNhdGlvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0ICAgIFx0dGhpcy5hbnN3ZXJzW2ldID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuXHQgICAgXHRpZihjb3JyZWN0PT09aSlcclxuXHQgICAgXHRcdHRoaXMuYW5zd2Vyc1tpXS5jbGFzc05hbWUgPSBcImFuc3dlciBjb3JyZWN0XCI7XHJcblx0ICAgIFx0ZWxzZVxyXG5cdCAgICBcdFx0dGhpcy5hbnN3ZXJzW2ldLmNsYXNzTmFtZSA9IFwiYW5zd2VyIHdyb25nXCI7XHJcblx0ICAgIFx0dGhpcy5hbnN3ZXJzW2ldLmlubmVySFRNTCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSArIFwiQVwiLmNoYXJDb2RlQXQoKSkrXCIuIFwiK2Fuc3dlcnNYbWxbaV0uaW5uZXJIVE1MO1xyXG5cdCAgICB9XHJcblx0ICAgIFxyXG5cdCAgICAvLyBDcmVhdGUgdGhlIGV2ZW50cyBmb3IgdGhlIGFuc3dlcnNcclxuXHQgICAgZm9yKHZhciBpPTA7aTx0aGlzLmFuc3dlcnMubGVuZ3RoO2krKyl7XHJcblx0XHQgIGlmKHRoaXMuYW5zd2Vyc1tpXS5jbGFzc05hbWUgPT0gXCJhbnN3ZXIgd3JvbmdcIil7XHJcblx0XHRcdHRoaXMuYW5zd2Vyc1tpXS5udW0gPSBpO1xyXG5cdCAgICAgICAgdGhpcy5hbnN3ZXJzW2ldLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdCAgICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0ICBxdWVzdGlvbi53cm9uZ0Fuc3dlcih0aGlzLm51bSk7XHJcblx0XHQgICAgfTtcclxuXHQgICAgICB9XHJcblx0ICAgICAgZWxzZXtcclxuXHQgICAgXHR0aGlzLmFuc3dlcnNbaV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcblx0XHQgICAgICBpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKVxyXG5cdFx0ICAgICAgICBxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHQgICAgICBxdWVzdGlvbi5jb3JyZWN0QW5zd2VyKCk7XHJcblx0XHQgICAgfTtcclxuXHQgICAgICB9XHJcblx0ICAgIH1cclxuXHQgICAgXHJcblx0ICAgIC8vIEFkZCB0aGUgYW5zd2VycyB0byB0aGUgd2luZG93XHJcblx0ICAgIGZvcih2YXIgaT0wO2k8dGhpcy5hbnN3ZXJzLmxlbmd0aDtpKyspXHJcblx0ICAgICAgdGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uYXBwZW5kQ2hpbGQodGhpcy5hbnN3ZXJzW2ldKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYodGhpcy5qdXN0aWZpY2F0aW9uKXtcclxuICAgIFx0dGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uYXBwZW5kQ2hpbGQodGhpcy5qdXN0aWZpY2F0aW9uKTtcclxuICAgIFx0dGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uYXBwZW5kQ2hpbGQodGhpcy5qdXN0aWZpY2F0aW9uLnN1Ym1pdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbnAuY3JlYXRlRmlsZVdpbmRvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBmaWxlIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLmZpbGVXaW5kb3c7XHJcbiAgICB0aGlzLmFuc3dlciA9IHRlbXBEaXYuZmlyc3RDaGlsZDtcclxuICAgIHRoaXMuZmlsZUlucHV0ID0gdGhpcy5hbnN3ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKVswXTtcclxuICAgIHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcbiAgICB0aGlzLmFuc3dlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiZmlsZUJ1dHRvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0Y29uc29sZS5sb2coXCJGSUxFIEJVVFRPTiBDTElDS0VEIVwiKTtcclxuICAgIFx0cXVlc3Rpb24uZmlsZUlucHV0LmNsaWNrKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIFx0cXVlc3Rpb24ubmV3RmlsZXMgPSB0cnVlO1xyXG4gICAgXHRxdWVzdGlvbi5maWxlcyA9IFtdO1xyXG4gICAgXHRmb3IodmFyIGk9MDtpPGV2ZW50LnRhcmdldC5maWxlcy5sZW5ndGg7aSsrKVxyXG4gICAgXHRcdHF1ZXN0aW9uLmZpbGVzW2ldID0gZXZlbnQudGFyZ2V0LmZpbGVzW2ldLm5hbWU7XHJcblx0ICAgIHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbnAuY3JlYXRlTWVzc2FnZVdpbmRvdyA9IGZ1bmN0aW9uKHhtbCl7XHJcblx0XHJcblx0Ly8gQ3JlYXRlIHRoZSBtZXNzYWdlIHdpbmRvdyBcclxuXHR2YXIgdGVtcERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0dGVtcERpdi5pbm5lckhUTUwgPSBXaW5kb3dzLm1lc3NhZ2VXaW5kb3c7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSB0ZW1wRGl2LmZpcnN0Q2hpbGQ7XHJcbiAgICB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvbk5hbWVcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcbiAgICB0aGlzLm1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJWluc3RydWN0aW9ucyVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5zdHJ1Y3Rpb25zXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdGhpcy5tZXNzYWdlLmlubmVySFRNTCA9IHRoaXMubWVzc2FnZS5pbm5lckhUTUwucmVwbGFjZShcIiVxdWVzdGlvbiVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25UZXh0XCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG4gICAgdmFyIHF1ZXN0aW9uID0gdGhpcztcclxuICAgIHRoaXMubWVzc2FnZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICBcdHF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9IFNPTFZFX1NUQVRFLlNPTFZFRDtcclxuICAgIFx0cXVlc3Rpb24ud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XHJcbm1vZHVsZS5leHBvcnRzLlNPTFZFX1NUQVRFID0gU09MVkVfU1RBVEU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL3F1ZXN0aW9uLmpzXCIpO1xyXG5cclxuLy8gQ3JlYXRlcyBhIGNhdGVnb3J5IHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIGZyb20gdGhlIGdpdmVuIHhtbFxyXG5mdW5jdGlvbiBSZXNvdXJjZSh4bWwpe1xyXG5cdFxyXG5cdC8vIEZpcnN0IGdldCB0aGUgaWNvblxyXG5cdCAgdmFyIHR5cGUgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSk7XHJcblx0ICBzd2l0Y2godHlwZSl7XHJcblx0ICAgIGNhc2UgMDpcclxuXHQgICAgICB0aGlzLmljb24gPSAnLi4vaW1nL2ljb25SZXNvdXJjZUZpbGUucG5nJztcclxuXHQgICAgICBicmVhaztcclxuXHQgICAgY2FzZSAxOlxyXG5cdCAgICAgIHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlTGluay5wbmcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgICBjYXNlIDI6XHJcbiAgICBcdCAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VWaWRlby5wbmcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgICBkZWZhdWx0OlxyXG5cdCAgICAgIHRoaXMuaWNvbiA9ICcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgfVxyXG5cclxuXHQgIC8vIE5leHQgZ2V0IHRoZSB0aXRsZVxyXG5cdCAgdGhpcy50aXRsZSA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJ0ZXh0XCIpO1xyXG5cclxuXHQgIC8vIExhc3QgZ2V0IHRoZSBsaW5rXHJcblx0ICB0aGlzLmxpbmsgPSB4bWwuZ2V0QXR0cmlidXRlKFwibGlua1wiKTtcclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlc291cmNlOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vaGVscGVyL3V0aWxpdGllcy5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9oZWxwZXIvcG9pbnQuanMnKTtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4uL2Nhc2UvcXVlc3Rpb24uanNcIik7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKFwiLi9jb25zdGFudHMuanNcIik7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZShcIi4uL2hlbHBlci9kcmF3bGliLmpzXCIpO1xyXG5cclxuLy9wYXJhbWV0ZXIgaXMgYSBwb2ludCB0aGF0IGRlbm90ZXMgc3RhcnRpbmcgcG9zaXRpb25cclxuZnVuY3Rpb24gYm9hcmQoc2VjdGlvbiwgc3RhcnRQb3NpdGlvbiwgbGVzc29uTm9kZXMpe1xyXG5cdFxyXG5cdC8vIENyZWF0ZSB0aGUgY2FudmFzIGZvciB0aGlzIGJvYXJkIGFuZCBhZGQgaXQgdG8gdGhlIHNlY3Rpb25cclxuXHR0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcblx0dGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cdHRoaXMuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0dGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuXHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0c2VjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XHJcblx0XHJcblx0dmFyIGJvYXJkID0gdGhpcztcclxuXHR0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCBmdW5jdGlvbigpe1xyXG5cdFx0aWYoYm9hcmQubG9hZGVkKVxyXG5cdFx0XHRib2FyZC5sb2FkZWQoKTtcclxuXHR9LCBmYWxzZSk7XHJcblx0XHJcbiAgICB0aGlzLmxlc3Nvbk5vZGVBcnJheSA9IGxlc3Nvbk5vZGVzO1xyXG4gICAgdGhpcy5ib2FyZE9mZnNldCA9IHN0YXJ0UG9zaXRpb247XHJcbiAgICB0aGlzLnByZXZCb2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxuICAgIHRoaXMuem9vbSA9IENvbnN0YW50cy5zdGFydFpvb207XHJcbiAgICB0aGlzLnN0YWdlID0gMDtcclxuICAgIHRoaXMubGFzdFNhdmVUaW1lID0gMDsgLy8gYXNzdW1lIG5vIGNvb2tpZVxyXG4gICAgdGhpcy5sYXN0UXVlc3Rpb24gPSBudWxsO1xyXG4gICAgdGhpcy5sYXN0UXVlc3Rpb25OdW0gPSAtMTtcclxuICAgIFxyXG4gICAgLy9pZiAoZG9jdW1lbnQuY29va2llKSB0aGlzLmxvYWRDb29raWUoKTsgXHJcblxyXG5cdC8vIENoZWNrIGlmIGFsbCBub2RlcyBhcmUgc29sdmVkXHJcblx0dmFyIGRvbmUgPSB0cnVlO1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoICYmIGRvbmU7aSsrKVxyXG5cdFx0aWYodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY3VycmVudFN0YXRlIT1RdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpXHJcblx0XHRcdGRvbmUgPSBmYWxzZTtcclxuXHRpZihkb25lKVxyXG5cdFx0dGhpcy5maW5pc2hlZCA9IHRydWU7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG59XHJcblxyXG4vL3Byb3RvdHlwZVxyXG52YXIgcCA9IGJvYXJkLnByb3RvdHlwZTtcclxuXHJcbnAuYWN0ID0gZnVuY3Rpb24oZ2FtZVNjYWxlLCBwTW91c2VTdGF0ZSwgZHQpIHtcclxuXHRcclxuXHQvLyBmb3IgZWFjaCAgbm9kZVxyXG4gICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG4gICAgXHR2YXIgYWN0aXZlTm9kZSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldOyBcclxuXHRcdC8vIGhhbmRsZSBzb2x2ZWQgcXVlc3Rpb25cclxuXHRcdGlmIChhY3RpdmVOb2RlLmN1cnJlbnRTdGF0ZSAhPSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQgJiYgYWN0aXZlTm9kZS5xdWVzdGlvbi5jdXJyZW50U3RhdGUgPT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEKSB7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyB1cGRhdGUgZWFjaCBjb25uZWN0aW9uJ3MgY29ubmVjdGlvbiBudW1iZXJcclxuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBhY3RpdmVOb2RlLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKVxyXG5cdFx0XHRcdHRoaXMubGVzc29uTm9kZUFycmF5W01hdGguYWJzKGFjdGl2ZU5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnNbal0pIC0gMV0uY29ubmVjdGlvbnMrKztcclxuXHRcdFx0XHJcblx0XHRcdC8vIFVwZGF0ZSB0aGUgbm9kZSdzIHN0YXRlXHJcblx0XHRcdGFjdGl2ZU5vZGUuY3VycmVudFN0YXRlID0gYWN0aXZlTm9kZS5xdWVzdGlvbi5jdXJyZW50U3RhdGU7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBDaGVjayBpZiBhbGwgbm9kZSdzIGFyZSBzb2x2ZWRcclxuXHRcdFx0dmFyIGRvbmUgPSB0cnVlO1xyXG5cdFx0XHRmb3IodmFyIGk9MDtpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aCAmJiBkb25lO2krKylcclxuXHRcdFx0XHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5jdXJyZW50U3RhdGUhPVF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRClcclxuXHRcdFx0XHRcdGRvbmUgPSBmYWxzZTtcclxuXHRcdFx0aWYoZG9uZSlcclxuXHRcdFx0XHR0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIElmIHRoZXJlIGlzIGEgbGlzdGVuZXIgZm9yIHVwZGF0aW5nIG5vZGVzLCBjYWxsIGl0LlxyXG5cdFx0XHRpZih0aGlzLnVwZGF0ZU5vZGUpXHJcblx0XHRcdFx0dGhpcy51cGRhdGVOb2RlKCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHVwZGF0ZSB0aGUgbm9kZSdzIHRyYW5zaXRpb24gcHJvZ3Jlc3NcclxuXHRcdGlmIChhY3RpdmVOb2RlLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9PSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpXHJcblx0XHRcdGFjdGl2ZU5vZGUubGluZVBlcmNlbnQgPSBNYXRoLm1pbigxLGR0KkNvbnN0YW50cy5saW5lU3BlZWQgKyBhY3RpdmVOb2RlLmxpbmVQZXJjZW50KTtcclxuXHR9XHJcbiAgICBcclxuICAgIC8vIENoZWNrIG1vdXNlIGV2ZW50cyBpZiBnaXZlbiBhIG1vdXNlIHN0YXRlXHJcbiAgICBpZihwTW91c2VTdGF0ZSkge1xyXG5cdCAgICBcclxuXHQgICAgLy8gaG92ZXIgc3RhdGVzXHJcblx0XHQvL2Zvcih2YXIgaSA9IDA7IGkgPCBib2FyZEFycmF5Lmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIGxlc3NvbiBub2RlcyB0byBjaGVjayBmb3IgaG92ZXJcclxuXHRcdFx0Ly8gdXBkYXRlIGJvYXJkXHJcblx0XHRcclxuXHQgICAgaWYgKCFwTW91c2VTdGF0ZS5tb3VzZURvd24gJiYgdGhpcy50YXJnZXQpIHtcclxuXHRcdFx0dGhpcy50YXJnZXQuZHJhZ1Bvc2l0aW9uID0gdW5kZWZpbmVkOyAvLyBjbGVhciBkcmFnIGJlaGF2aW9yXHJcblx0XHRcdHRoaXMudGFyZ2V0LmRyYWdnaW5nID0gZmFsc2U7XHJcblx0XHRcdHRoaXMudGFyZ2V0ID0gbnVsbDtcclxuXHRcdH1cclxuXHQgICAgXHJcblx0XHRmb3IgKHZhciBpPXRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aC0xLCBub2RlQ2hvc2VuOyBpPj0wICYmIHRoaXMudGFyZ2V0PT1udWxsOyBpLS0pIHtcclxuXHRcdFx0dmFyIGxOb2RlID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07XHJcblx0XHRcdFxyXG5cdFx0XHRsTm9kZS5tb3VzZU92ZXIgPSBmYWxzZTtcclxuXHRcdFx0XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJub2RlIHVwZGF0ZVwiKTtcclxuXHRcdFx0Ly8gaWYgaG92ZXJpbmcsIHNob3cgaG92ZXIgZ2xvd1xyXG5cdFx0XHQvKmlmIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPiBsTm9kZS5wb3NpdGlvbi54LWxOb2RlLndpZHRoLzIgXHJcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA8IGxOb2RlLnBvc2l0aW9uLngrbE5vZGUud2lkdGgvMlxyXG5cdFx0XHQmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgPiBsTm9kZS5wb3NpdGlvbi55LWxOb2RlLmhlaWdodC8yXHJcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA8IGxOb2RlLnBvc2l0aW9uLnkrbE5vZGUuaGVpZ2h0LzIpIHsqL1xyXG5cdFx0XHRpZiAoVXRpbGl0aWVzLm1vdXNlSW50ZXJzZWN0KHBNb3VzZVN0YXRlLGxOb2RlLHRoaXMuYm9hcmRPZmZzZXQpKSB7XHJcblx0XHRcdFx0bE5vZGUubW91c2VPdmVyID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldCA9IGxOb2RlO1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2cocE1vdXNlU3RhdGUuaGFzVGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYodGhpcy50YXJnZXQpe1xyXG5cdFxyXG5cdFx0XHRpZighdGhpcy50YXJnZXQuZHJhZ2dpbmcpe1xyXG5cdFx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHRcdC8vIGRyYWdcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmRyYWdnaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmRyYWdQb3NpdGlvbiA9IG5ldyBQb2ludChcclxuXHRcdFx0XHRcdHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54IC0gdGhpcy50YXJnZXQucG9zaXRpb24ueCxcclxuXHRcdFx0XHRcdHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi55IC0gdGhpcy50YXJnZXQucG9zaXRpb24ueVxyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCkge1xyXG5cdFx0XHRcdFx0Ly8gaGFuZGxlIGNsaWNrIGNvZGVcclxuXHRcdFx0XHRcdHRoaXMudGFyZ2V0LmNsaWNrKHBNb3VzZVN0YXRlKTtcclxuXHRcdFx0XHRcdHRoaXMubGFzdFF1ZXN0aW9uID0gdGhpcy50YXJnZXQucXVlc3Rpb247XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2V7XHJcblx0XHRcdFx0dmFyIG5hdHVyYWxYID0gcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggLSB0aGlzLnRhcmdldC5kcmFnUG9zaXRpb24ueDtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5wb3NpdGlvbi54ID0gTWF0aC5tYXgoQ29uc3RhbnRzLmJvYXJkT3V0bGluZSxNYXRoLm1pbihuYXR1cmFsWCxDb25zdGFudHMuYm9hcmRTaXplLnggLSBDb25zdGFudHMuYm9hcmRPdXRsaW5lKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQucXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WCA9IHRoaXMudGFyZ2V0LnBvc2l0aW9uLng7XHJcblx0XHRcdFx0dmFyIG5hdHVyYWxZID0gcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgLSB0aGlzLnRhcmdldC5kcmFnUG9zaXRpb24ueTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5wb3NpdGlvbi55ID0gTWF0aC5tYXgoQ29uc3RhbnRzLmJvYXJkT3V0bGluZSxNYXRoLm1pbihuYXR1cmFsWSxDb25zdGFudHMuYm9hcmRTaXplLnkgLSBDb25zdGFudHMuYm9hcmRPdXRsaW5lKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQucXVlc3Rpb24ucG9zaXRpb25QZXJjZW50WSA9IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0ICB9XHJcblx0XHRcclxuXHRcdC8vIGRyYWcgdGhlIGJvYXJkIGFyb3VuZFxyXG5cdFx0aWYgKHRoaXMudGFyZ2V0PT1udWxsKSB7XHJcblx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnLXdlYmtpdC1ncmFiYmluZyc7XHJcblx0XHRcdFx0dGhpcy5jYW52YXMuc3R5bGUuY3Vyc29yID0gJy1tb3otZ3JhYmJpbmcnO1xyXG5cdFx0XHRcdHRoaXMuY2FudmFzLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcblx0XHRcdFx0aWYgKCF0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQpIHtcclxuXHRcdFx0XHRcdHRoaXMubW91c2VTdGFydERyYWdCb2FyZCA9IHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbjtcclxuXHRcdFx0XHRcdHRoaXMucHJldkJvYXJkT2Zmc2V0LnggPSB0aGlzLmJvYXJkT2Zmc2V0Lng7XHJcblx0XHRcdFx0XHR0aGlzLnByZXZCb2FyZE9mZnNldC55ID0gdGhpcy5ib2FyZE9mZnNldC55O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueCA9IHRoaXMucHJldkJvYXJkT2Zmc2V0LnggLSAocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueCk7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC54ID4gdGhpcy5tYXhCb2FyZFdpZHRoLzIpIHRoaXMuYm9hcmRPZmZzZXQueCA9IHRoaXMubWF4Qm9hcmRXaWR0aC8yO1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA8IC0xKnRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSAtMSp0aGlzLm1heEJvYXJkV2lkdGgvMjtcclxuXHRcdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueSA9IHRoaXMucHJldkJvYXJkT2Zmc2V0LnkgLSAocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueSk7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC55ID4gdGhpcy5tYXhCb2FyZEhlaWdodC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnkgPSB0aGlzLm1heEJvYXJkSGVpZ2h0LzI7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC55IDwgLTEqdGhpcy5tYXhCb2FyZEhlaWdodC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnkgPSAtMSp0aGlzLm1heEJvYXJkSGVpZ2h0LzI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMubW91c2VTdGFydERyYWdCb2FyZCA9IHVuZGVmaW5lZDtcclxuXHRcdFx0XHR0aGlzLmNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnJztcclxuXHRcdFx0fVxyXG5cdCAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGdhbWVTY2FsZSl7XHJcbiAgICBcclxuICAgIC8vIHNhdmUgY2FudmFzIHN0YXRlIGJlY2F1c2Ugd2UgYXJlIGFib3V0IHRvIGFsdGVyIHByb3BlcnRpZXNcclxuICAgIHRoaXMuY3R4LnNhdmUoKTsgICBcclxuICAgIFxyXG4gICAgLy8gQ2xlYXIgYmVmb3JlIGRyYXdpbmcgbmV3IHN0dWZmXHJcblx0RHJhd0xpYi5yZWN0KHRoaXMuY3R4LCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0LCBcIiMxNTcxOEZcIik7XHJcblxyXG5cdC8vIFNjYWxlIHRoZSBnYW1lXHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5jYW52YXMud2lkdGgvMiwgdGhpcy5jYW52YXMuaGVpZ2h0LzIpO1xyXG5cdHRoaXMuY3R4LnNjYWxlKGdhbWVTY2FsZSwgZ2FtZVNjYWxlKTtcclxuXHR0aGlzLmN0eC50cmFuc2xhdGUoLXRoaXMuY2FudmFzLndpZHRoLzIsIC10aGlzLmNhbnZhcy5oZWlnaHQvMik7XHJcblxyXG4gICAgLy8gVHJhbnNsYXRlIHRvIGNlbnRlciBvZiBzY3JlZW4gYW5kIHNjYWxlIGZvciB6b29tIHRoZW4gdHJhbnNsYXRlIGJhY2tcclxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh0aGlzLmNhbnZhcy53aWR0aC8yLCB0aGlzLmNhbnZhcy5oZWlnaHQvMik7XHJcbiAgICB0aGlzLmN0eC5zY2FsZSh0aGlzLnpvb20sIHRoaXMuem9vbSk7XHJcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUoLXRoaXMuY2FudmFzLndpZHRoLzIsIC10aGlzLmNhbnZhcy5oZWlnaHQvMik7XHJcbiAgICAvLyBtb3ZlIHRoZSBib2FyZCB0byB3aGVyZSB0aGUgdXNlciBkcmFnZ2VkIGl0XHJcbiAgICAvL3RyYW5zbGF0ZSB0byB0aGUgY2VudGVyIG9mIHRoZSBib2FyZFxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzKTtcclxuICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh0aGlzLmNhbnZhcy53aWR0aC8yIC0gdGhpcy5ib2FyZE9mZnNldC54LCB0aGlzLmNhbnZhcy5oZWlnaHQvMiAtIHRoaXMuYm9hcmRPZmZzZXQueSk7XHJcbiAgICBcclxuXHRcclxuICAgIC8vIERyYXcgdGhlIGJhY2tncm91bmQgb2YgdGhlIGJvYXJkXHJcbiAgICBEcmF3TGliLnJlY3QodGhpcy5jdHgsIDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55LCBcIiNEM0IxODVcIik7XHJcbiAgICBEcmF3TGliLnN0cm9rZVJlY3QodGhpcy5jdHgsIC1Db25zdGFudHMuYm9hcmRPdXRsaW5lLzIsIC1Db25zdGFudHMuYm9hcmRPdXRsaW5lLzIsIENvbnN0YW50cy5ib2FyZFNpemUueCtDb25zdGFudHMuYm9hcmRPdXRsaW5lLzIsIENvbnN0YW50cy5ib2FyZFNpemUueStDb25zdGFudHMuYm9hcmRPdXRsaW5lLzIsIENvbnN0YW50cy5ib2FyZE91dGxpbmUsIFwiI0NCOTk2NlwiKTtcclxuICAgIFxyXG5cdC8vIGRyYXcgdGhlIG5vZGVzXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG4gICAgXHJcbiAgICBcdC8vIHRlbXBvcmFyaWx5IGhpZGUgYWxsIGJ1dCB0aGUgZmlyc3QgcXVlc3Rpb25cdFx0XHRcdFx0XHQvLyBzb21ldGhpbmcgaXMgd3JvbmcgaGVyZSwgbGlua3NBd2F5RnJvbU9yaWdpbiBkb2VzIG5vdCBleGlzdCBhbnltb3JlXHJcblx0XHQvL2lmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQgPiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5saW5rc0F3YXlGcm9tT3JpZ2luKSBjb250aW51ZTtcclxuICAgIFx0XHJcbiAgICBcdC8vIGRyYXcgdGhlIG5vZGUgaXRzZWxmXHJcbiAgICAgICAgdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uZHJhdyh0aGlzLmN0eCwgdGhpcy5jYW52YXMpO1xyXG4gICAgfVxyXG5cclxuXHQvLyBkcmF3IHRoZSBsaW5lc1xyXG5cdGZvcih2YXIgaT0wOyBpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKXtcclxuXHRcdFxyXG5cdFx0Ly8gb25seSBzaG93IGxpbmVzIGZyb20gc29sdmVkIHF1ZXN0aW9uc1xyXG5cdFx0aWYgKHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSE9UXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEKSBjb250aW51ZTtcclxuXHRcdFxyXG5cdFx0Ly8gZ2V0IHRoZSBwaW4gcG9zaXRpb25cclxuICAgICAgICB2YXIgb1BvcyA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldLmdldE5vZGVQb2ludCgpO1xyXG4gICAgICAgIFxyXG5cdFx0Ly8gc2V0IGxpbmUgc3R5bGVcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IFwicmdiYSgwLDAsMTA1LDAuMilcIjtcclxuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGRyYXcgbGluZXNcclxuICAgICAgICBmb3IgKHZhciBqPTA7IGo8dGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICBcdFxyXG4gICAgICAgIFx0Ly8gRG9uJ3QgZHJhdyBuZWdhdGl2ZSBjb25uZWN0aW9uc1xyXG4gICAgICAgIFx0aWYodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal08MCljb250aW51ZTtcclxuICAgICAgICBcdFxyXG4gICAgICAgIFx0Ly8gLTEgYmVjYXNlIG5vZGUgY29ubmVjdGlvbiBpbmRleCB2YWx1ZXMgYXJlIDEtaW5kZXhlZCBidXQgY29ubmVjdGlvbnMgaXMgMC1pbmRleGVkXHJcblx0XHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVt0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5jb25uZWN0aW9uc1tqXSAtIDFdLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZT09UXVlc3Rpb24uU09MVkVfU1RBVEUuSElEREVOKSBjb250aW51ZTtcclxuICAgICAgICBcdFxyXG4gICAgICAgIFx0Ly8gZ28gdG8gdGhlIGluZGV4IGluIHRoZSBhcnJheSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBjb25uZWN0ZWQgbm9kZSBvbiB0aGlzIGJvYXJkIGFuZCBzYXZlIGl0cyBwb3NpdGlvblxyXG4gICAgICAgIFx0Ly8gY29ubmVjdGlvbiBpbmRleCBzYXZlZCBpbiB0aGUgbGVzc29uTm9kZSdzIHF1ZXN0aW9uXHJcbiAgICAgICAgXHR2YXIgY29ubmVjdGlvbiA9IHRoaXMubGVzc29uTm9kZUFycmF5W3RoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2pdIC0gMV07XHJcbiAgICAgICAgXHR2YXIgY1BvcyA9IGNvbm5lY3Rpb24uZ2V0Tm9kZVBvaW50KCk7XHJcbiAgICAgICAgXHRcclxuICAgICAgICBcdC8vIGRyYXcgdGhlIGxpbmVcclxuICAgICAgICBcdHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIFx0Ly8gdHJhbnNsYXRlIHRvIHN0YXJ0IChwaW4pXHJcbiAgICAgICAgXHR0aGlzLmN0eC5tb3ZlVG8ob1Bvcy54LCBvUG9zLnkpO1xyXG4gICAgICAgIFx0dGhpcy5jdHgubGluZVRvKG9Qb3MueCArIChjUG9zLnggLSBvUG9zLngpKnRoaXMubGVzc29uTm9kZUFycmF5W2ldLmxpbmVQZXJjZW50LCBvUG9zLnkgKyAoY1Bvcy55IC0gb1Bvcy55KSp0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5saW5lUGVyY2VudCk7XHJcbiAgICAgICAgXHR0aGlzLmN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICBcdHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG5cdHRoaXMuY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbi8vIEdldHMgYSBmcmVlIG5vZGUgaW4gdGhpcyBib2FyZCAoaS5lLiBub3QgdW5zb2x2ZWQpIHJldHVybnMgbnVsbCBpZiBub25lXHJcbnAuZ2V0RnJlZU5vZGUgPSBmdW5jdGlvbigpIHtcclxuXHRmb3IodmFyIGk9MDsgaTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGkrKyl7XHJcblx0XHRpZih0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5jdXJyZW50U3RhdGUgPT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuVU5TT0xWRUQpXHJcblx0XHRcdHJldHVybiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXTt9XHJcblx0cmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8vIE1vdmVzIHRoaXMgYm9hcmQgdG93YXJkcyB0aGUgZ2l2ZW4gcG9pbnRcclxucC5tb3ZlVG93YXJkcyA9IGZ1bmN0aW9uKHBvaW50LCBkdCwgc3BlZWQpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgdmVjdG9yIHRvd2FyZHMgdGhlIGdpdmVuIHBvaW50XHJcblx0dmFyIHRvUG9pbnQgPSBuZXcgUG9pbnQocG9pbnQueC10aGlzLmJvYXJkT2Zmc2V0LngsIHBvaW50LnktdGhpcy5ib2FyZE9mZnNldC55KTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIGRpc3RhbmNlIG9mIHNhaWQgdmVjdG9yXHJcblx0dmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KHRvUG9pbnQueCp0b1BvaW50LngrdG9Qb2ludC55KnRvUG9pbnQueSk7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBuZXcgb2Zmc2V0IG9mIHRoZSBib2FyZCBhZnRlciBtb3ZpbmcgdG93YXJkcyB0aGUgcG9pbnRcclxuXHR2YXIgbmV3T2Zmc2V0ID0gbmV3IFBvaW50KCB0aGlzLmJvYXJkT2Zmc2V0LnggKyB0b1BvaW50LngvZGlzdGFuY2UqZHQqc3BlZWQsXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnkgKyB0b1BvaW50LnkvZGlzdGFuY2UqZHQqc3BlZWQpO1xyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHBhc3NlZCBwb2ludCBvbiB4IGF4aXMgYW5kIGlmIHNvIHNldCB0byBwb2ludCdzIHhcclxuXHRpZih0aGlzLmJvYXJkT2Zmc2V0LnggIT1wb2ludC54ICYmXHJcblx0XHRNYXRoLmFicyhwb2ludC54LW5ld09mZnNldC54KS8ocG9pbnQueC1uZXdPZmZzZXQueCk9PU1hdGguYWJzKHBvaW50LngtdGhpcy5ib2FyZE9mZnNldC54KS8ocG9pbnQueC10aGlzLmJvYXJkT2Zmc2V0LngpKVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC54ID0gbmV3T2Zmc2V0Lng7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC54ID0gcG9pbnQueDtcclxuXHRcclxuXHJcblx0Ly8gQ2hlY2sgaWYgcGFzc2VkIHBvaW50IG9uIHkgYXhpcyBhbmQgaWYgc28gc2V0IHRvIHBvaW50J3MgeVxyXG5cdGlmKHRoaXMuYm9hcmRPZmZzZXQueSAhPSBwb2ludC55ICYmXHJcblx0XHRNYXRoLmFicyhwb2ludC55LW5ld09mZnNldC55KS8ocG9pbnQueS1uZXdPZmZzZXQueSk9PU1hdGguYWJzKHBvaW50LnktdGhpcy5ib2FyZE9mZnNldC55KS8ocG9pbnQueS10aGlzLmJvYXJkT2Zmc2V0LnkpKVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gbmV3T2Zmc2V0Lnk7XHJcblx0ZWxzZVxyXG5cdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gcG9pbnQueTtcclxufVxyXG5cclxucC53aW5kb3dDbG9zZWQgPSBmdW5jdGlvbigpe1xyXG5cdGNvbnNvbGUubG9nKFwid2luZG93IGNsb3NlZDpcIit0aGlzLmxhc3RRdWVzdGlvbi5uZXdGaWxlcyk7XHJcblx0Ly8gaWYgaXQgaXMgZmlsZSB0eXBlXHJcblx0aWYgKHRoaXMubGFzdFF1ZXN0aW9uLm5ld0ZpbGVzKSB7XHJcblx0XHQvLyBhZGQgYSBmaWxlIHRvIHRoZSBmaWxlIHN5c3RlbVxyXG5cdFx0dGhpcy5sYXN0UXVlc3Rpb24ubmV3RmlsZXMgPSBmYWxzZTtcclxuXHRcdHJldHVybiB7IFxyXG5cdFx0XHRmaWxlczogdGhpcy5sYXN0UXVlc3Rpb24uZmlsZUlucHV0LmZpbGVzLCBcclxuXHRcdFx0cXVlc3Rpb246IHRoaXMubGFzdFF1ZXN0aW9uLm51bVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxucC5zaG93ID0gZnVuY3Rpb24oZGlyKXtcclxuXHRpZihkaXIhPW51bGwpXHJcblx0XHR0aGlzLmNhbnZhcy5zdHlsZS5hbmltYXRpb24gPSAnY2FudmFzRW50ZXInICsgKGRpciA/ICdMJyA6ICdSJykgKyAnIDFzJztcclxuXHR0aGlzLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XHJcbn1cclxuXHJcbnAuaGlkZSA9IGZ1bmN0aW9uKGRpcil7XHJcblx0aWYoZGlyIT1udWxsKXtcclxuXHRcdHRoaXMuY2FudmFzLnN0eWxlLmFuaW1hdGlvbiA9ICdjYW52YXNMZWF2ZScgKyAoZGlyID8gJ1InIDogJ0wnKSArICcgMXMnO1xyXG5cdFx0dmFyIGJvYXJkID0gdGhpcztcclxuXHRcdHRoaXMubG9hZGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0Ym9hcmQuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHR9XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHRib2FyZC5jYW52YXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHR9XHJcbn1cclxuXHJcbnAudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuXHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYm9hcmQ7ICAgIFxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbi8vIFRoZSBzaXplIG9mIHRoZSBib2FyZCBpbiBnYW1lIHVuaXRzIGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkU2l6ZSA9IG5ldyBQb2ludCgxOTIwLCAxMDgwKTtcclxubS5ib3VuZFNpemUgPSAzO1xyXG5cclxuLy9UaGUgc2l6ZSBvZiB0aGUgYm9hcmQgb3V0bGluZSBpbiBnYW1lIHVuaXRzIGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkT3V0bGluZSA9IG0uYm9hcmRTaXplLnggPiBtLmJvYXJkU2l6ZS55ID8gbS5ib2FyZFNpemUueC8yMCA6IG0uYm9hcmRTaXplLnkvMjA7XHJcblxyXG4vLyBUaGUgem9vbSB2YWx1ZXMgYXQgc3RhcnQgYW5kIGVuZCBvZiBhbmltYXRpb25cclxubS5zdGFydFpvb20gPSAwLjU7XHJcbm0uZW5kWm9vbSA9IDEuNTtcclxuXHJcbi8vIFRoZSBzcGVlZCBvZiB0aGUgem9vbSBhbmltYXRpb25cclxubS56b29tU3BlZWQgPSAwLjAwMTtcclxubS56b29tTW92ZVNwZWVkID0gMC43NTtcclxuXHJcbi8vIFRoZSBzcGVlZCBvZiB0aGUgbGluZSBhbmltYXRpb25cclxubS5saW5lU3BlZWQgPSAwLjAwMjtcclxuXHJcbi8vIFRoZSB0aW1lIGJldHdlZW4gem9vbSBjaGVja3NcclxubS5waW5jaFNwZWVkID0gLjAwMjU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBCb2FyZCA9IHJlcXVpcmUoJy4vYm9hcmQuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vaGVscGVyL3BvaW50LmpzJyk7XHJcbnZhciBMZXNzb25Ob2RlID0gcmVxdWlyZSgnLi9sZXNzb25Ob2RlLmpzJyk7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cy5qcycpO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4uL2hlbHBlci9kcmF3bGliLmpzJyk7XHJcbnZhciBEYXRhUGFyc2VyID0gcmVxdWlyZSgnLi4vaGVscGVyL2lwYXJEYXRhUGFyc2VyLmpzJyk7XHJcbnZhciBNb3VzZVN0YXRlID0gcmVxdWlyZSgnLi4vaGVscGVyL21vdXNlU3RhdGUuanMnKTtcclxudmFyIEZpbGVNYW5hZ2VyID0gcmVxdWlyZSgnLi4vaGVscGVyL2ZpbGVNYW5hZ2VyLmpzJyk7XHJcblxyXG4vL21vdXNlIG1hbmFnZW1lbnRcclxudmFyIG1vdXNlU3RhdGU7XHJcbnZhciBwcmV2aW91c01vdXNlU3RhdGU7XHJcbnZhciBkcmFnZ2luZ0Rpc2FibGVkO1xyXG52YXIgbW91c2VUYXJnZXQ7XHJcbnZhciBtb3VzZVN1c3RhaW5lZERvd247XHJcblxyXG4vLyBIVE1MIGVsZW1lbnRzXHJcbnZhciB6b29tU2xpZGVyO1xyXG52YXIgd2luZG93RGl2O1xyXG52YXIgd2luZG93V3JhcHBlcjtcclxudmFyIHdpbmRvd0ZpbG07XHJcbnZhciBwcm9jZWVkQ29udGFpbmVyO1xyXG52YXIgcHJvY2VlZExvbmc7XHJcbnZhciBwcm9jZWVkUm91bmQ7XHJcblxyXG4vLyBVc2VkIGZvciBwaW5jaCB6b29tXHJcbnZhciBwaW5jaFN0YXJ0O1xyXG5cclxuLy8gVXNlZCBmb3Igd2FpdGluZyBhIHNlY29uZCB0byBjbG9zZSB3aW5kb3dzXHJcbnZhciBwYXVzZWRUaW1lID0gMDtcclxuXHJcbi8vcGhhc2UgaGFuZGxpbmdcclxudmFyIHBoYXNlT2JqZWN0O1xyXG5cclxuZnVuY3Rpb24gZ2FtZShzZWN0aW9uLCBiYXNlU2NhbGUpe1xyXG5cdHZhciBnYW1lID0gdGhpcztcclxuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdHRoaXMuc2F2ZUZpbGVzID0gW107XHJcblx0XHJcblx0Ly8gR2V0IGFuZCBzZXR1cCB0aGUgd2luZG93IGVsZW1lbnRzXHJcblx0d2luZG93RGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvdycpO1xyXG5cdHdpbmRvd1dyYXBwZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93V3JhcHBlcicpO1xyXG4gICAgcHJvY2VlZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9jZWVkQ29udGFpbmVyJyk7XHJcbiAgICBwcm9jZWVkTG9uZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9jZWVkQnRuTG9uZycpO1xyXG4gICAgcHJvY2VlZFJvdW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2NlZWRCdG5Sb3VuZCcpO1xyXG5cdHdpbmRvd0ZpbG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93RmxpbScpO1xyXG5cdHdpbmRvd0ZpbG0ub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdHZhciB3aW5kb3cgPSBmYWxzZTtcclxuXHRcdHZhciB3aW5kb3dzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIik7XHJcblx0XHRmb3IodmFyIGk9MDtpPHdpbmRvd3MubGVuZ3RoICYmICF3aW5kb3c7aSsrKXtcclxuXHRcdFx0dmFyIGJvdW5kcyA9IHdpbmRvd3NbaV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGlmKGJvdW5kcy5sZWZ0IDwgZS5jbGllbnRYICYmIGJvdW5kcy5yaWdodCA+IGUuY2xpZW50WCAmJiBib3VuZHMudG9wIDwgZS5jbGllbnRZICYmIGJvdW5kcy5ib3R0b20gPiBlLmNsaWVudFkpXHJcblx0XHRcdFx0d2luZG93ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHdpbmRvd3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwidGl0bGVcIik7XHJcblx0XHRmb3IodmFyIGk9MDtpPHdpbmRvd3MubGVuZ3RoICYmICF3aW5kb3c7aSsrKXtcclxuXHRcdFx0dmFyIGJvdW5kcyA9IHdpbmRvd3NbaV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGlmKGJvdW5kcy5sZWZ0IDwgZS5jbGllbnRYICYmIGJvdW5kcy5yaWdodCA+IGUuY2xpZW50WCAmJiBib3VuZHMudG9wIDwgZS5jbGllbnRZICYmIGJvdW5kcy5ib3R0b20gPiBlLmNsaWVudFkpXHJcblx0XHRcdFx0d2luZG93ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdGlmKCF3aW5kb3cpXHJcblx0XHRcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJzsgXHJcblx0fTtcclxuXHRcclxuXHQvLyBHZXQgYW5kIHNldHVwIHRoZSB6b29tIHNsaWRlclxyXG5cdHpvb21TbGlkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3pvb20tc2xpZGVyJyk7XHJcblx0em9vbVNsaWRlci5vbmlucHV0ID0gZnVuY3Rpb24oKXtcclxuXHRcdGdhbWUuc2V0Wm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7XHJcblx0fTtcclxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3pvb20taW4nKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICBcdHpvb21TbGlkZXIuc3RlcERvd24oKTtcclxuXHRcdGdhbWUuc2V0Wm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7XHJcbiAgICB9O1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICN6b29tLW91dCcpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgXHJcblx0XHR6b29tU2xpZGVyLnN0ZXBVcCgpOyBcclxuXHRcdGdhbWUuc2V0Wm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7XHJcblx0fTtcclxuXHRcclxuXHQvLyBTYXZlIHRoZSBnaXZlbiBzY2FsZVxyXG5cdHRoaXMuc2NhbGUgPSBiYXNlU2NhbGU7XHJcblx0XHJcblx0Ly8gTG9hZCB0aGUgY2FzZSBmaWxlXHJcblx0dmFyIGxvYWREYXRhID0gRmlsZU1hbmFnZXIubG9hZENhc2UoSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhJ10pLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3dpbmRvdycpKTtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGJvYXJkc1xyXG5cdHRoaXMuY2F0ZWdvcmllcyA9IGxvYWREYXRhLmNhdGVnb3JpZXM7XHJcblx0dGhpcy5jcmVhdGVMZXNzb25Ob2RlcyhzZWN0aW9uKTtcclxuXHRcclxuXHQvLyBDcmVhdGUgdGhlIGZpbmFsIGJ1dHRvblxyXG5cdHZhciBmaW5hbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcblx0ZmluYWxCdXR0b24uaW5uZXJIVE1MID0gXCJDbG9zZSBDYXNlXCI7XHJcblx0aWYoIXRoaXMuYm9hcmRBcnJheVt0aGlzLmJvYXJkQXJyYXkubGVuZ3RoLTFdLmZpbmlzaGVkKVxyXG5cdFx0ZmluYWxCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdGZpbmFsQnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG5cdFx0Z2FtZS5zdWJtaXQoKTtcclxuXHR9O1xyXG5cdHRoaXMuYm90dG9tQmFyLmFwcGVuZENoaWxkKGZpbmFsQnV0dG9uKTtcclxuXHRcclxuXHQvLyBEaXNwbGF5IHRoZSBjdXJyZW50IGJvYXJkXHJcblx0dGhpcy5hY3RpdmVCb2FyZEluZGV4ID0gbG9hZERhdGEuY2F0ZWdvcnk7XHJcblx0dGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLnNob3coKTtcclxuXHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5idXR0b24uY2xhc3NOYW1lID0gXCJhY3RpdmVcIjtcclxuXHR0aGlzLnVwZGF0ZU5vZGUoKTtcclxuXHR6b29tU2xpZGVyLnZhbHVlID0gLXRoaXMuZ2V0Wm9vbSgpO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRoZSBzYXZlIGJ1dHRvblxyXG5cdEZpbGVNYW5hZ2VyLnByZXBhcmVaaXAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNibG9iJykpO1xyXG59XHJcblxyXG52YXIgcCA9IGdhbWUucHJvdG90eXBlO1xyXG5cclxucC5jcmVhdGVMZXNzb25Ob2RlcyA9IGZ1bmN0aW9uKHNlY3Rpb24pe1xyXG5cdHRoaXMuYm9hcmRBcnJheSA9IFtdO1xyXG5cdHRoaXMuYm90dG9tQmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNib3R0b21CYXInKTtcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGg7aSsrKXtcclxuXHRcdC8vIGluaXRpYWxpemUgZW1wdHlcclxuXHRcdFxyXG5cdFx0dGhpcy5sZXNzb25Ob2RlcyA9IFtdO1xyXG5cdFx0Ly8gYWRkIGEgbm9kZSBwZXIgcXVlc3Rpb25cclxuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9ucy5sZW5ndGg7IGorKykge1xyXG5cdFx0XHQvLyBjcmVhdGUgYSBuZXcgbGVzc29uIG5vZGVcclxuXHRcdFx0dGhpcy5sZXNzb25Ob2Rlcy5wdXNoKG5ldyBMZXNzb25Ob2RlKG5ldyBQb2ludCh0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLnBvc2l0aW9uUGVyY2VudFgsIHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0ucG9zaXRpb25QZXJjZW50WSksIHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0uaW1hZ2VMaW5rLCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdICkgKTtcclxuXHRcdFx0Ly8gYXR0YWNoIHF1ZXN0aW9uIG9iamVjdCB0byBsZXNzb24gbm9kZVxyXG5cdFx0XHR0aGlzLmxlc3Nvbk5vZGVzW3RoaXMubGVzc29uTm9kZXMubGVuZ3RoLTFdLnF1ZXN0aW9uID0gdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXTtcclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNyZWF0ZSBhIGJvYXJkXHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbaV0gPSBuZXcgQm9hcmQoc2VjdGlvbiwgbmV3IFBvaW50KENvbnN0YW50cy5ib2FyZFNpemUueC8yLCBDb25zdGFudHMuYm9hcmRTaXplLnkvMiksIHRoaXMubGVzc29uTm9kZXMpO1xyXG5cdFx0dmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJCVVRUT05cIik7XHJcblx0XHRidXR0b24uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW2ldLm5hbWU7XHJcblx0XHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0XHRidXR0b24ub25jbGljayA9IChmdW5jdGlvbihpKXsgXHJcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZihnYW1lLmFjdGl2ZSAmJiAhZ2FtZS56b29tb3V0ICYmICFnYW1lLnpvb21pbil7XHJcblx0XHRcdFx0XHRnYW1lLmNoYW5nZUJvYXJkKGkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdH19KShpKTtcclxuXHRcdGlmKGkhPTAgJiYgIXRoaXMuYm9hcmRBcnJheVtpLTFdLmZpbmlzaGVkKVxyXG5cdFx0XHRidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0dGhpcy5ib3R0b21CYXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtpXS5idXR0b24gPSBidXR0b247XHJcblx0XHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0XHR0aGlzLmJvYXJkQXJyYXlbaV0udXBkYXRlTm9kZSA9IGZ1bmN0aW9uKCl7Z2FtZS51cGRhdGVOb2RlKCk7fTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5tb3VzZVN0YXRlID0gbmV3IE1vdXNlU3RhdGUodGhpcy5ib2FyZEFycmF5KTtcclxuXHRcclxufVxyXG5cclxucC51cGRhdGUgPSBmdW5jdGlvbihkdCl7XHJcblx0XHJcbiAgICBpZih0aGlzLmFjdGl2ZSl7XHJcbiAgICBcclxuICAgIFx0Ly8gcGVyZm9ybSBnYW1lIGFjdGlvbnNcclxuICAgIFx0dGhpcy5hY3QoZHQpO1xyXG4gICAgXHRcclxuXHQgICAgLy8gZHJhdyBzdHVmZlxyXG5cdCAgICB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5kcmF3KHRoaXMuc2NhbGUpO1xyXG5cdCAgICBcclxuICAgIH1cclxuICAgIGVsc2UgaWYocGF1c2VkVGltZSE9MCAmJiB3aW5kb3dEaXYuaW5uZXJIVE1MPT0nJylcclxuICAgIFx0dGhpcy53aW5kb3dDbG9zZWQoKTtcclxuICAgIFxyXG59XHJcblxyXG5wLmFjdCA9IGZ1bmN0aW9uKGR0KXtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG1vdXNlIHN0YXRlXHJcblx0dGhpcy5tb3VzZVN0YXRlLnVwZGF0ZShkdCwgdGhpcy5zY2FsZSp0aGlzLmdldFpvb20oKSk7XHJcblx0XHJcblx0LyppZiAodGhpcy5tb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCkge1xyXG5cdFx0Ly9sb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImF1dG9zYXZlXCIsRGF0YVBhcnNlci5jcmVhdGVYTUxTYXZlRmlsZSh0aGlzLmJvYXJkQXJyYXksIGZhbHNlKSk7XHJcblx0XHQvL2NvbnNvbGUubG9nKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiYXV0b3NhdmVcIikpO1xyXG5cdH0qL1xyXG5cdFxyXG4gICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGJvYXJkIChnaXZlIGl0IHRoZSBtb3VzZSBvbmx5IGlmIG5vdCB6b29taW5nKVxyXG4gICAgdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYWN0KHRoaXMuc2NhbGUsICh0aGlzLnpvb21pbiB8fCB0aGlzLnpvb21vdXQgPyBudWxsIDogdGhpcy5tb3VzZVN0YXRlKSwgZHQpO1xyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBuZXcgYm9hcmQgYXZhaWxhYmxlXHJcbiAgICBpZih0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPCB0aGlzLmJvYXJkQXJyYXkubGVuZ3RoLTEgJiZcclxuICAgIFx0XHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4KzFdLmJ1dHRvbi5kaXNhYmxlZCAmJiBcclxuICAgIFx0XHR0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5maW5pc2hlZCl7XHJcbiAgICBcdHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrMV0uYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBcdHRoaXMucHJvbXB0ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBcclxuXHQvLyBJZiB0aGUgbmVlZHMgdG8gem9vbSBvdXQgdG8gY2VudGVyXHJcblx0aWYodGhpcy56b29tb3V0KXtcclxuXHRcdFxyXG5cdFx0Ly8gR2V0IHRoZSBjdXJyZW50IGJvYXJkXHJcblx0XHR2YXIgYm9hcmQgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XTtcclxuXHRcdFxyXG5cdFx0Ly8gWm9vbSBvdXQgYW5kIG1vdmUgdG93YXJkcyBjZW50ZXJcclxuXHRcdGlmKHRoaXMuZ2V0Wm9vbSgpPkNvbnN0YW50cy5zdGFydFpvb20pXHJcblx0XHRcdGJvYXJkLnpvb20gLT0gZHQqQ29uc3RhbnRzLnpvb21TcGVlZDtcclxuXHRcdGVsc2UgaWYodGhpcy5nZXRab29tKCk8Q29uc3RhbnRzLnN0YXJ0Wm9vbSlcclxuXHRcdFx0Ym9hcmQuem9vbSA9IENvbnN0YW50cy5zdGFydFpvb207XHJcblx0XHRib2FyZC5tb3ZlVG93YXJkcyhuZXcgUG9pbnQoQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzIsIENvbnN0YW50cy5ib2FyZFNpemUueS8yKSwgZHQsIENvbnN0YW50cy56b29tTW92ZVNwZWVkKTtcclxuXHRcdFxyXG5cdFx0Ly8gVXBkYXRlIHRoZSB6b29tIHNsaWRlclxyXG5cdFx0em9vbVNsaWRlci52YWx1ZSA9IC10aGlzLmdldFpvb20oKTtcclxuXHRcdFxyXG5cdFx0Ly8gSWYgZnVsbHkgem9vbWVkIG91dCBhbmQgaW4gY2VudGVyIHN0b3BcclxuXHRcdGlmKHRoaXMuZ2V0Wm9vbSgpPT1Db25zdGFudHMuc3RhcnRab29tICYmIGJvYXJkLmJvYXJkT2Zmc2V0Lng9PUNvbnN0YW50cy5ib2FyZFNpemUueC8yICYmIGJvYXJkLmJvYXJkT2Zmc2V0Lnk9PUNvbnN0YW50cy5ib2FyZFNpemUueS8yKXtcdFx0XHRcdFxyXG5cdFx0XHR0aGlzLnpvb21vdXQgPSBmYWxzZTtcclxuXHRcdFx0XHJcblx0XHRcdGlmKHRoaXMucHJvbXB0KXtcclxuXHRcdFx0XHRwcm9jZWVkQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHQgICAgXHR3aW5kb3dEaXYuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJ3aW5kb3dQcm9tcHRcIj48ZGl2PjxoMT5UaGUgXCInK3RoaXMuY2F0ZWdvcmllc1t0aGlzLmFjdGl2ZUJvYXJkSW5kZXgrMV0ubmFtZSsnXCIgY2F0ZWdvcnkgaXMgbm93IGF2YWlsYWJsZSE8L2gxPjwvZGl2PjwvZGl2Pic7XHJcblx0XHQgICAgXHR2YXIgd2luZG93UHJvbXB0ID0gd2luZG93RGl2LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dQcm9tcHRcIilbMF07XHJcblx0XHQgICAgXHR2YXIgem9vbWluID0gZnVuY3Rpb24oKXtcclxuXHRcdCAgICBcdFx0d2luZG93UHJvbXB0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIHpvb21pbik7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdHdpbmRvd1Byb21wdC5zdHlsZS5hbmltYXRpb24gPSAncHJvbXB0RmFkZSAxcyc7XHJcblx0XHRcdFx0XHRcdHZhciBmYWRlb3V0ID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHR3aW5kb3dQcm9tcHQuc3R5bGUuYW5pbWF0aW9uID0gJyc7XHJcblx0XHRcdFx0XHRcdFx0d2luZG93UHJvbXB0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGZhZGVvdXQpO1xyXG5cdFx0XHRcdFx0XHRcdHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0XHRcdFx0XHR3aW5kb3dEaXYuc3R5bGUuYW5pbWF0aW9uID0gJyc7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0d2luZG93UHJvbXB0LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGZhZGVvdXQsIGZhbHNlKTtcclxuXHRcdFx0XHRcdH0sIDUwMCk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR3aW5kb3dEaXYuc3R5bGUuYW5pbWF0aW9uID0gJ25vbmUnO1xyXG5cdFx0XHRcdHdpbmRvd1Byb21wdC5zdHlsZS5hbmltYXRpb24gPSAnb3BlbldpbmRvdyAwLjVzJztcclxuXHRcdFx0XHR3aW5kb3dQcm9tcHQuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgem9vbWluLCBmYWxzZSk7XHJcblx0XHQgICAgXHR0aGlzLnByb21wdCA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBJZiBjaGFuZ2luZyBib2FyZCBzdGFydCB0aGF0IHByb2Nlc3NcclxuXHRcdFx0aWYodGhpcy5uZXdCb2FyZCE9bnVsbCl7XHJcblx0XHRcdFx0dmFyIGRpciA9IHRoaXMubmV3Qm9hcmQgPCB0aGlzLmFjdGl2ZUJvYXJkSW5kZXg7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uaGlkZShkaXIpO1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlQm9hcmRJbmRleCA9IHRoaXMubmV3Qm9hcmQ7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uc2hvdyhkaXIpO1xyXG5cdFx0XHRcdHpvb21TbGlkZXIudmFsdWUgPSAtdGhpcy5nZXRab29tKCk7XHJcblx0XHRcdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuXHRcdFx0XHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ubG9hZGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdGdhbWUuYWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGdhbWUubmV3Qm9hcmQgPSBudWxsO1xyXG5cdFx0XHRcdFx0Z2FtZS51cGRhdGVOb2RlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSAvLyBJZiB0aGVyZSBpcyBhIG5ldyBub2RlIHpvb20gaW50byBpdFxyXG5cdGVsc2UgaWYodGhpcy56b29taW4peyBcclxuXHRcdFxyXG5cdFx0Ly8gR2V0IHRoZSBjdXJyZW50IGJvYXJkXHJcblx0XHR2YXIgYm9hcmQgPSB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XTtcclxuXHRcdFxyXG5cdFx0Ly8gSWYgYm9hcmQgaXMgbm90IGZpbmlzaGVkIGxvb2sgZm9yIG5leHQgbm9kZVxyXG5cdFx0aWYoIWJvYXJkLmZpbmlzaGVkICYmIHRoaXMudGFyZ2V0Tm9kZT09bnVsbCl7XHJcblx0XHRcdHRoaXMudGFyZ2V0Tm9kZSA9IGJvYXJkLmdldEZyZWVOb2RlKCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmKGJvYXJkLmZpbmlzaGVkKXtcclxuXHRcdFx0dGhpcy56b29taW4gPSBmYWxzZTtcclxuXHRcdFx0dGhpcy56b29tb3V0ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gU3RhcnQgbW92aW5nIGFuZCB6b29taW5nIGlmIHRhcmdldCBmb3VuZFxyXG5cdFx0aWYodGhpcy56b29taW4gJiYgdGhpcy50YXJnZXROb2RlKXtcclxuXHRcclxuXHRcdFx0Ly8gWm9vbSBpbiBhbmQgbW92ZSB0b3dhcmRzIHRhcmdldCBub2RlXHJcblx0XHRcdGlmKHRoaXMuZ2V0Wm9vbSgpPENvbnN0YW50cy5lbmRab29tKVxyXG5cdFx0XHRcdGJvYXJkLnpvb20gKz0gZHQqQ29uc3RhbnRzLnpvb21TcGVlZDtcclxuXHRcdFx0ZWxzZSBpZih0aGlzLmdldFpvb20oKT5Db25zdGFudHMuZW5kWm9vbSlcclxuXHRcdFx0XHRib2FyZC56b29tID0gQ29uc3RhbnRzLmVuZFpvb207XHJcblx0XHRcdGJvYXJkLm1vdmVUb3dhcmRzKHRoaXMudGFyZ2V0Tm9kZS5wb3NpdGlvbiwgZHQsIENvbnN0YW50cy56b29tTW92ZVNwZWVkKTtcclxuXHJcblx0XHRcdC8vIFVwZGF0ZSB0aGUgem9vbSBzbGlkZXJcclxuXHRcdFx0em9vbVNsaWRlci52YWx1ZSA9IC10aGlzLmdldFpvb20oKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIElmIHJlYWNoZWQgdGhlIG5vZGUgYW5kIHpvb21lZCBpbiBzdG9wIGFuZCBnZXQgcmlkIG9mIHRoZSB0YXJnZXRcclxuXHRcdFx0aWYodGhpcy5nZXRab29tKCk9PUNvbnN0YW50cy5lbmRab29tICYmIGJvYXJkLmJvYXJkT2Zmc2V0Lng9PXRoaXMudGFyZ2V0Tm9kZS5wb3NpdGlvbi54ICYmIGJvYXJkLmJvYXJkT2Zmc2V0Lnk9PXRoaXMudGFyZ2V0Tm9kZS5wb3NpdGlvbi55KXtcclxuXHRcdFx0XHR0aGlzLnpvb21pbiA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZXsgLy8gT25seSBoYW5kbGUgem9vbWluZyBpZiBub3QgcGVyZm9ybWluZyBhbmltYXRpb24gem9vbVxyXG5cdFxyXG5cdFx0Ly8gSGFuZGxlIHBpbmNoIHpvb21cclxuXHQgICAgaWYodGhpcy5tb3VzZVN0YXRlLnpvb21EaWZmIT0wKXtcclxuXHQgICAgXHR6b29tU2xpZGVyLnZhbHVlID0gcGluY2hTdGFydCArIHRoaXMubW91c2VTdGF0ZS56b29tRGlmZiAqIENvbnN0YW50cy5waW5jaFNwZWVkO1xyXG5cdCAgICBcdHRoaXMudXBkYXRlWm9vbSgtcGFyc2VGbG9hdCh6b29tU2xpZGVyLnZhbHVlKSk7IFxyXG5cdCAgICB9XHJcblx0ICAgIGVsc2VcclxuXHQgICAgXHRwaW5jaFN0YXJ0ID0gTnVtYmVyKHpvb21TbGlkZXIudmFsdWUpO1xyXG5cdCAgICBcclxuXHQgICAgLy8gSGFuZGxlIG1vdXNlIHpvb21cclxuXHQgICAgaWYodGhpcy5tb3VzZVN0YXRlLm1vdXNlV2hlZWxEWSE9MClcclxuXHQgICAgXHR0aGlzLnpvb20odGhpcy5tb3VzZVN0YXRlLm1vdXNlV2hlZWxEWTwwKTtcclxuXHR9XHJcblxyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBzaG91bGQgcGF1c2VcclxuICAgIGlmKHdpbmRvd0Rpdi5pbm5lckhUTUwhPScnICYmIHBhdXNlZFRpbWUrKz4zKXtcclxuICAgIFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIFx0d2luZG93RmlsbS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5wLnVwZGF0ZU5vZGUgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuem9vbWluID0gdHJ1ZTtcclxufVxyXG5cclxucC5nZXRab29tID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uem9vbTtcclxufVxyXG5cclxucC5zZXRab29tID0gZnVuY3Rpb24oem9vbSl7XHJcblx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uem9vbSA9IHpvb207XHJcbn1cclxuXHJcbnAuem9vbSA9IGZ1bmN0aW9uKGRpcil7XHJcblx0aWYoZGlyKVxyXG4gICAgXHR6b29tU2xpZGVyLnN0ZXBEb3duKCk7XHJcbiAgICBlbHNlXHJcbiAgICBcdHpvb21TbGlkZXIuc3RlcFVwKCk7XHJcblx0dGhpcy5zZXRab29tKC1wYXJzZUZsb2F0KHpvb21TbGlkZXIudmFsdWUpKTtcclxufVxyXG5cclxucC5zZXRTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcclxuXHRmb3IodmFyIGk9MDtpPHRoaXMuYm9hcmRBcnJheS5sZW5ndGg7aSsrKVxyXG5cdFx0dGhpcy5ib2FyZEFycmF5W2ldLnVwZGF0ZVNpemUoKTtcclxuXHR0aGlzLnNjYWxlID0gc2NhbGU7XHJcbn1cclxuXHJcbnAuY2hhbmdlQm9hcmQgPSBmdW5jdGlvbihudW0pe1xyXG5cdGlmKG51bSE9dGhpcy5hY3RpdmVCb2FyZEluZGV4KXtcclxuXHRcdHRoaXMuYm9hcmRBcnJheVtudW1dLmJ1dHRvbi5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xyXG5cdFx0dGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uYnV0dG9uLmNsYXNzTmFtZSA9IFwiXCI7XHJcblx0XHR0aGlzLm5ld0JvYXJkID0gbnVtO1xyXG5cdFx0dGhpcy56b29tb3V0ID0gdHJ1ZTtcclxuXHR9XHJcbn1cclxuXHJcbnAud2luZG93Q2xvc2VkID0gZnVuY3Rpb24oKSB7XHJcblx0XHJcblx0Ly8gVW5wYXVzZSB0aGUgZ2FtZSBhbmQgZnVsbHkgY2xvc2UgdGhlIHdpbmRvd1xyXG5cdHBhdXNlZFRpbWUgPSAwO1xyXG5cdHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuXHR3aW5kb3dGaWxtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0cHJvY2VlZENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFxyXG5cdHRoaXMuc2F2ZSgpO1xyXG5cdFxyXG59XHJcblxyXG5wLnNhdmUgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgY3VycmVudCBjYXNlIGRhdGFcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGEnXSk7XHJcblx0Y2FzZURhdGEuc2F2ZUZpbGUgPSBEYXRhUGFyc2VyLmNyZWF0ZVhNTFNhdmVGaWxlKHRoaXMuYWN0aXZlQm9hcmRJbmRleCwgdGhpcy5ib2FyZEFycmF5LCB0cnVlKTtcclxuXHRcclxuXHQvLyBBdXRvc2F2ZSBvbiB3aW5kb3cgY2xvc2VcclxuXHR2YXIgZmlsZXNUb1N0b3JlID0gdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0ud2luZG93Q2xvc2VkKCk7XHJcblx0aWYgKGZpbGVzVG9TdG9yZSl7XHJcblx0XHRmaWxlc1RvU3RvcmUuYm9hcmQgPSB0aGlzLmFjdGl2ZUJvYXJkSW5kZXg7XHJcblx0XHR0aGlzLnNhdmVGaWxlcy5wdXNoKGZpbGVzVG9TdG9yZSk7XHJcblx0XHR0aGlzLm5leHRGaWxlSW5TYXZlU3RhY2soY2FzZURhdGEpO1xyXG5cdH1cclxuXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhJ10gPSBKU09OLnN0cmluZ2lmeShjYXNlRGF0YSk7XHJcblx0XHJcbn1cclxuXHJcbnAubmV4dEZpbGVJblNhdmVTdGFjayA9IGZ1bmN0aW9uKGNhc2VEYXRhKXtcclxuXHRcclxuXHR2YXIgY3VyRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YSddKTtcclxuXHRjdXJEYXRhLnN1Ym1pdHRlZCA9IGNhc2VEYXRhLnN1Ym1pdHRlZDtcclxuXHRsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhJ10gPSBKU09OLnN0cmluZ2lmeShjdXJEYXRhKTtcclxuXHRcclxuXHRpZih0aGlzLnNhdmVGaWxlcy5sZW5ndGg+MCl7XHJcblx0XHRGaWxlTWFuYWdlci5yZW1vdmVGaWxlc0ZvcihjYXNlRGF0YSwgdGhpcy5zYXZlRmlsZXNbMF0pO1xyXG5cdFx0RmlsZU1hbmFnZXIuYWRkTmV3RmlsZXNUb1N5c3RlbShjYXNlRGF0YSwgdGhpcy5zYXZlRmlsZXNbMF0sIHRoaXMubmV4dEZpbGVJblNhdmVTdGFjay5iaW5kKHRoaXMpKTtcclxuXHR9XHJcblx0dGhpcy5zYXZlRmlsZXMuc2hpZnQoKTtcclxufVxyXG5cclxucC5zdWJtaXQgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4uL2hlbHBlci9kcmF3bGliLmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuLi9jYXNlL3F1ZXN0aW9uLmpzXCIpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZShcIi4vY29uc3RhbnRzLmpzXCIpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9oZWxwZXIvcG9pbnQuanMnKTtcclxuXHJcbnZhciBDSEVDS19JTUFHRSA9IFwiLi4vaW1nL2ljb25Qb3N0SXRDaGVjay5wbmdcIjtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIGxlc3Nvbk5vZGUoc3RhcnRQb3NpdGlvbiwgaW1hZ2VQYXRoLCBwUXVlc3Rpb24pe1xyXG4gICAgXHJcbiAgICB0aGlzLnBvc2l0aW9uID0gc3RhcnRQb3NpdGlvbjtcclxuICAgIHRoaXMuZHJhZ0xvY2F0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgIHRoaXMudHlwZSA9IFwibGVzc29uTm9kZVwiO1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5jaGVjayA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy53aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0O1xyXG4gICAgdGhpcy5xdWVzdGlvbiA9IHBRdWVzdGlvbjtcclxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSAwO1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSAwO1xyXG4gICAgdGhpcy5saW5lUGVyY2VudCA9IDA7XHJcbiAgICBcclxuICAgIC8vIHNraXAgYW5pbWF0aW9ucyBmb3Igc29sdmVkXHJcbiAgICBpZiAocFF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9PSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpIHRoaXMubGluZVBlcmNlbnQgPSAxO1xyXG4gICAgXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvL2ltYWdlIGxvYWRpbmcgYW5kIHJlc2l6aW5nXHJcbiAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoYXQud2lkdGggPSB0aGF0LmltYWdlLm5hdHVyYWxXaWR0aDtcclxuICAgICAgICB0aGF0LmhlaWdodCA9IHRoYXQuaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuICAgICAgICB2YXIgbWF4RGltZW5zaW9uID0gQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzEwO1xyXG4gICAgICAgIC8vdG9vIHNtYWxsP1xyXG4gICAgICAgIGlmKHRoYXQud2lkdGggPCBtYXhEaW1lbnNpb24gJiYgdGhhdC5oZWlnaHQgPCBtYXhEaW1lbnNpb24pe1xyXG4gICAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcclxuICAgICAgICAgICAgICAgIHggPSBtYXhEaW1lbnNpb24gLyB0aGF0LndpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhhdC5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC53aWR0aCA9IHRoYXQud2lkdGggKiB4ICogdGhhdC5xdWVzdGlvbi5zY2FsZTtcclxuICAgICAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmhlaWdodCAqIHggKiB0aGF0LnF1ZXN0aW9uLnNjYWxlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGF0LndpZHRoID4gbWF4RGltZW5zaW9uIHx8IHRoYXQuaGVpZ2h0ID4gbWF4RGltZW5zaW9uKXtcclxuICAgICAgICAgICAgdmFyIHg7XHJcbiAgICAgICAgICAgIGlmKHRoYXQud2lkdGggPiB0aGF0LmhlaWdodCl7XHJcbiAgICAgICAgICAgICAgICB4ID0gdGhhdC53aWR0aCAvIG1heERpbWVuc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IHRoYXQuaGVpZ2h0IC8gbWF4RGltZW5zaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQud2lkdGggPSB0aGF0LndpZHRoIC8geDtcclxuICAgICAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmhlaWdodCAvIHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB0aGF0LnBvc2l0aW9uLnggKz0gdGhhdC53aWR0aC8yICogdGhhdC5xdWVzdGlvbi5zY2FsZTtcclxuICAgICAgICB0aGF0LnBvc2l0aW9uLnkgKz0gdGhhdC5oZWlnaHQvMiAqIHRoYXQucXVlc3Rpb24uc2NhbGU7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IGltYWdlUGF0aDtcclxuICAgIHRoaXMuY2hlY2suc3JjID0gQ0hFQ0tfSU1BR0U7XHJcbn1cclxuXHJcbnZhciBwID0gbGVzc29uTm9kZS5wcm90b3R5cGU7XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgsIGNhbnZhcyl7XHJcblxyXG5cdC8vIENoZWNrIGlmIHF1ZXN0aW9uIGlzIHZpc2libGVcclxuXHRpZih0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZT09UXVlc3Rpb24uU09MVkVfU1RBVEUuSElEREVOKXtcclxuXHRcdGlmKHRoaXMucXVlc3Rpb24ucmV2ZWFsVGhyZXNob2xkIDw9IHRoaXMuY29ubmVjdGlvbnMpe1xyXG5cdFx0XHR0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlVOU09MVkVEO1xyXG5cdFx0XHR0aGlzLmN1cnJlbnRTdGF0ZSA9IHRoaXMucXVlc3Rpb24uY3VycmVudFN0YXRlO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG4gICAgLy9sZXNzb25Ob2RlLmRyYXdMaWIuY2lyY2xlKGN0eCwgdGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnksIDEwLCBcInJlZFwiKTtcclxuICAgIC8vZHJhdyB0aGUgaW1hZ2UsIHNoYWRvdyBpZiBob3ZlcmVkXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgaWYodGhpcy5kcmFnZ2luZykge1xyXG4gICAgXHRjdHguc2hhZG93Q29sb3IgPSAneWVsbG93JztcclxuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xyXG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZih0aGlzLm1vdXNlT3Zlcil7XHJcbiAgICAgICAgY3R4LnNoYWRvd0NvbG9yID0gJ2RvZGdlckJsdWUnO1xyXG4gICAgICAgIGN0eC5zaGFkb3dCbHVyID0gNTtcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgICB9XHJcbiAgICAvL2RyYXdpbmcgdGhlIGJ1dHRvbiBpbWFnZVxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy9kcmF3aW5nIHRoZSBwaW5cclxuICAgIHN3aXRjaCAodGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGUpIHtcclxuICAgIFx0Y2FzZSAxOlxyXG4gICAgXHRcdGN0eC5maWxsU3R5bGUgPSBcImJsdWVcIjtcclxuXHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJjeWFuXCI7XHJcblx0XHRcdGJyZWFrO1xyXG4gICAgIFx0Y2FzZSAyOlxyXG4gICAgIFx0XHRjdHguZHJhd0ltYWdlKHRoaXMuY2hlY2ssIHRoaXMucG9zaXRpb24ueCArIHRoaXMud2lkdGgvMiAtIENvbnN0YW50cy5ib2FyZFNpemUueC81MCwgdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5oZWlnaHQvMiAtIENvbnN0YW50cy5ib2FyZFNpemUueC81MCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS54LzUwLCBDb25zdGFudHMuYm9hcmRTaXplLngvNTApO1xyXG4gICAgXHRcdGN0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XHJcblx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IFwieWVsbG93XCI7XHJcblx0XHRcdGJyZWFrO1xyXG4gICAgfVxyXG5cdHZhciBzbWFsbGVyID0gdGhpcy53aWR0aCA8IHRoaXMuaGVpZ2h0ID8gdGhpcy53aWR0aCA6IHRoaXMuaGVpZ2h0O1xyXG5cdGN0eC5saW5lV2lkdGggPSBzbWFsbGVyLzMyO1xyXG5cclxuXHRjdHguYmVnaW5QYXRoKCk7XHJcblx0dmFyIG5vZGVQb2ludCA9IHRoaXMuZ2V0Tm9kZVBvaW50KCk7XHJcblx0Y3R4LmFyYyhub2RlUG9pbnQueCwgbm9kZVBvaW50LnksIHNtYWxsZXIqMy8zMiwgMCwgMipNYXRoLlBJKTtcclxuXHRjdHguY2xvc2VQYXRoKCk7XHJcblx0Y3R4LmZpbGwoKTtcclxuXHRjdHguc3Ryb2tlKCk7XHJcbiAgICBcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5wLmdldE5vZGVQb2ludCA9IGZ1bmN0aW9uKCl7XHJcblx0dmFyIHNtYWxsZXIgPSB0aGlzLndpZHRoIDwgdGhpcy5oZWlnaHQgPyB0aGlzLndpZHRoIDogdGhpcy5oZWlnaHQ7XHJcblx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIgKyBzbWFsbGVyKjMvMTYsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIgKyBzbWFsbGVyKjMvMTYpO1xyXG59XHJcblxyXG5wLmNsaWNrID0gZnVuY3Rpb24obW91c2VTdGF0ZSl7XHJcbiAgICB0aGlzLnF1ZXN0aW9uLmRpc3BsYXlXaW5kb3dzKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbGVzc29uTm9kZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0uY2xlYXIgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgpIHtcclxuICAgIGN0eC5jbGVhclJlY3QoeCwgeSwgdywgaCk7XHJcbn1cclxuXHJcbm0ucmVjdCA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgY29sLCBjZW50ZXJPcmlnaW4pIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sO1xyXG4gICAgaWYoY2VudGVyT3JpZ2luKXtcclxuICAgICAgICBjdHguZmlsbFJlY3QoeCAtICh3IC8gMiksIHkgLSAoaCAvIDIpLCB3LCBoKTtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubS5zdHJva2VSZWN0ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoLCBsaW5lLCBjb2wsIGNlbnRlck9yaWdpbikge1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbDtcclxuICAgIGN0eC5saW5lV2lkdGggPSBsaW5lO1xyXG4gICAgaWYoY2VudGVyT3JpZ2luKXtcclxuICAgICAgICBjdHguc3Ryb2tlUmVjdCh4IC0gKHcgLyAyKSwgeSAtIChoIC8gMiksIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjdHguc3Ryb2tlUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm0ubGluZSA9IGZ1bmN0aW9uKGN0eCwgeDEsIHkxLCB4MiwgeTIsIHRoaWNrbmVzcywgY29sb3IpIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgubW92ZVRvKHgxLCB5MSk7XHJcbiAgICBjdHgubGluZVRvKHgyLCB5Mik7XHJcbiAgICBjdHgubGluZVdpZHRoID0gdGhpY2tuZXNzO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XHJcbiAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5tLmNpcmNsZSA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgcmFkaXVzLCBjb2xvcil7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4LmFyYyh4LHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcclxuICAgIGN0eC5maWxsKCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBib2FyZEJ1dHRvbihjdHgsIHBvc2l0aW9uLCB3aWR0aCwgaGVpZ2h0LCBob3ZlcmVkKXtcclxuICAgIC8vY3R4LnNhdmUoKTtcclxuICAgIGlmKGhvdmVyZWQpe1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImRvZGdlcmJsdWVcIjtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwibGlnaHRibHVlXCI7XHJcbiAgICB9XHJcbiAgICAvL2RyYXcgcm91bmRlZCBjb250YWluZXJcclxuICAgIGN0eC5yZWN0KHBvc2l0aW9uLnggLSB3aWR0aC8yLCBwb3NpdGlvbi55IC0gaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IDU7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICBjdHguZmlsbCgpO1xyXG4gICAgLy9jdHgucmVzdG9yZSgpO1xyXG59IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBDYXRlZ29yeSA9IHJlcXVpcmUoXCIuLi9jYXNlL2NhdGVnb3J5LmpzXCIpO1xyXG52YXIgUmVzb3VyY2UgPSByZXF1aXJlKFwiLi4vY2FzZS9yZXNvdXJjZXMuanNcIik7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xyXG52YXIgUGFyc2VyID0gcmVxdWlyZSgnLi9pcGFyRGF0YVBhcnNlci5qcycpO1xyXG5cclxuLy8gTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gKioqKioqKioqKioqKioqKioqKioqKiBMT0FESU5HICoqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLy8gbG9hZCB0aGUgZmlsZSBlbnRyeSBhbmQgcGFyc2UgdGhlIHhtbFxyXG5tLmxvYWRDYXNlID0gZnVuY3Rpb24oY2FzZURhdGEsIHdpbmRvd0Rpdikge1xyXG4gICAgXHJcbiAgICB0aGlzLmNhdGVnb3JpZXMgPSBbXTtcclxuICAgIHRoaXMucXVlc3Rpb25zID0gW107XHJcblx0XHJcblx0Ly8gR2V0IHRoZSB4bWwgZGF0YVxyXG5cdHZhciB4bWxEYXRhID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0dmFyIGNhdGVnb3JpZXMgPSBQYXJzZXIuZ2V0Q2F0ZWdvcmllc0FuZFF1ZXN0aW9ucyh4bWxEYXRhLCB3aW5kb3dEaXYpO1xyXG5cdFxyXG5cdC8vIGxvYWQgdGhlIG1vc3QgcmVjZW50IHByb2dyZXNzIGZyb20gc2F2ZUZpbGUuaXBhcmRhdGFcclxuXHR2YXIgcXVlc3Rpb25zID0gW107XHJcbiAgICBcclxuXHQvLyBHZXQgdGhlIHNhdmUgZGF0YVxyXG5cdHZhciBzYXZlRGF0YSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuc2F2ZUZpbGUpO1xyXG5cdC8vIGFsZXJ0IHVzZXIgaWYgdGhlcmUgaXMgYW4gZXJyb3JcclxuXHRpZiAoIXNhdmVEYXRhKSB7IGFsZXJ0IChcIkVSUk9SIG5vIHNhdmUgZGF0YSBmb3VuZCwgb3Igc2F2ZSBkYXRhIHdhcyB1bnJlYWRhYmxlXCIpOyByZXR1cm47IH1cclxuXHQvLyBwcm9ncmVzc1xyXG5cdHZhciBzdGFnZSA9IHNhdmVEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FzZVwiKVswXS5nZXRBdHRyaWJ1dGUoXCJjYXNlU3RhdHVzXCIpO1xyXG5cdFxyXG5cdC8vIHBhcnNlIHRoZSBzYXZlIGRhdGEgaWYgbm90IG5ld1xyXG5cdGlmKHN0YWdlPjApe1xyXG5cdFx0Zm9yKHZhciBmaWxlIGluIGNhc2VEYXRhLnN1Ym1pdHRlZCl7XHJcblx0XHRcdGlmICghY2FzZURhdGEuc3VibWl0dGVkLmhhc093blByb3BlcnR5KGZpbGUpKSBjb250aW51ZTtcclxuXHRcdFx0ZmlsZSA9IGZpbGUuc3Vic3RyKGZpbGUubGFzdEluZGV4T2YoXCIvXCIpKzEpO1xyXG5cdFx0XHR2YXIgY2F0ID0gZmlsZS5pbmRleE9mKFwiLVwiKSxcclxuXHRcdFx0XHRxdWUgPSBmaWxlLmluZGV4T2YoXCItXCIsIGNhdCsxKSxcclxuXHRcdFx0XHRmaWwgPSBmaWxlLmluZGV4T2YoXCItXCIsIHF1ZSsxKTtcclxuXHRcdFx0Y2F0ZWdvcmllc1tOdW1iZXIoZmlsZS5zdWJzdHIoMCwgY2F0KSldLlxyXG5cdFx0XHRcdHF1ZXN0aW9uc1tOdW1iZXIoZmlsZS5zdWJzdHIoY2F0KzEsIHF1ZS1jYXQtMSkpXS5cclxuXHRcdFx0XHRmaWxlc1tOdW1iZXIoZmlsZS5zdWJzdHIocXVlKzEsIGZpbC1xdWUtMSkpXSA9IFxyXG5cdFx0XHRcdFx0ZmlsZS5zdWJzdHIoZmlsZS5pbmRleE9mQXQoXCItXCIsIDMpKzEpO1xyXG5cdFx0fVxyXG5cdFx0Y29uc29sZS5sb2coY2F0ZWdvcmllc1sxXS5xdWVzdGlvbnNbNF0uZmlsZXMpO1xyXG5cdFx0Y29uc29sZS5sb2coY2F0ZWdvcmllc1sxXS5xdWVzdGlvbnNbNF0uaW1hZ2VMaW5rKTtcclxuXHRcdFBhcnNlci5hc3NpZ25RdWVzdGlvblN0YXRlcyhjYXRlZ29yaWVzLCBzYXZlRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uXCIpKTtcclxuXHR9XHJcblx0ZWxzZVxyXG5cdFx0c3RhZ2UgPSAxO1xyXG5cdFxyXG5cdC8vIHJldHVybiByZXN1bHRzXHJcblx0cmV0dXJuIHtjYXRlZ29yaWVzOiBjYXRlZ29yaWVzLCBjYXRlZ29yeTpzdGFnZS0xfTsgLy8gbWF5YmUgc3RhZ2UgKyAxIHdvdWxkIGJlIGJldHRlciBiZWNhdXNlIHRoZXkgYXJlIG5vdCB6ZXJvIGluZGV4ZWQ/XHJcblx0XHRcdCAgIFxyXG59XHJcblx0XHRcdFx0XHQgXHJcbi8vICoqKioqKioqKioqKioqKioqKioqKiogU0FWSU5HICoqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLyogaGVyZSdzIHRoZSBnZW5lcmFsIG91dGxpbmUgb2Ygd2hhdCBpcyBoYXBwZW5pbmc6XHJcbnNlbGVjdFNhdmVMb2NhdGlvbiB3YXMgdGhlIG9sZCB3YXkgb2YgZG9pbmcgdGhpbmdzXHJcbm5vdyB3ZSB1c2UgY3JlYXRlWmlwXHJcbiAtIHdoZW4gdGhpcyB3aG9sZSB0aGluZyBzdGFydHMsIHdlIHJlcXVlc3QgYSBmaWxlIHN5c3RlbSBhbmQgc2F2ZSBhbGwgdGhlIGVudHJpZXMgKGRpcmVjdG9yaWVzIGFuZCBmaWxlcykgdG8gdGhlIGFsbEVudHJpZXMgdmFyaWFibGVcclxuIC0gdGhlbiB3ZSBnZXQgdGhlIGJsb2JzIHVzaW5nIHJlYWRBc0JpbmFyeVN0cmluZyBhbmQgc3RvcmUgdGhvc2UgaW4gYW4gYXJyYXkgd2hlbiB3ZSBhcmUgc2F2aW5nIFxyXG4gIC0gLSBjb3VsZCBkbyB0aGF0IG9uIHBhZ2UgbG9hZCB0byBzYXZlIHRpbWUgbGF0ZXIuLj9cclxuIC0gYW55d2F5LCB0aGVuIHdlIC0gaW4gdGhlb3J5IC0gdGFrZSB0aGUgYmxvYnMgYW5kIHVzZSB6aXAuZmlsZShlbnRyeS5uYW1lLCBibG9iKSB0byByZWNyZWF0ZSB0aGUgc3RydWN0dXJlXHJcbiAtIGFuZCBmaW5hbGx5IHdlIGRvd25sb2FkIHRoZSB6aXAgd2l0aCBkb3dubG9hZCgpXHJcbiBcclxuKi9cclxuXHJcbi8vIGNhbGxlZCB3aGVuIHRoZSBnYW1lIGlzIGxvYWRlZCwgYWRkIG9uY2xpY2sgdG8gc2F2ZSBidXR0b24gdGhhdCBhY3R1YWxseSBkb2VzIHRoZSBzYXZpbmdcclxubS5wcmVwYXJlWmlwID0gZnVuY3Rpb24oc2F2ZUJ1dHRvbikge1xyXG5cdC8vdmFyIGNvbnRlbnQgPSB6aXAuZ2VuZXJhdGUoKTtcclxuXHRcclxuXHQvL2NvbnNvbGUubG9nKFwicHJlcGFyZSB6aXBcIik7XHJcblx0XHJcblx0Ly8gY29kZSBmcm9tIEpTWmlwIHNpdGVcclxuXHRpZiAoSlNaaXAuc3VwcG9ydC5ibG9iKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKFwic3VwcG9ydHMgYmxvYlwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gbGluayBkb3dubG9hZCB0byBjbGlja1xyXG5cdFx0c2F2ZUJ1dHRvbi5vbmNsaWNrID0gc2F2ZUlQQVI7XHJcbiAgXHR9XHJcbn1cclxuXHJcbi8vIGNyZWF0ZSBJUEFSIGZpbGUgYW5kIGRvd25sb2FkIGl0XHJcbmZ1bmN0aW9uIHNhdmVJUEFSKCkge1xyXG5cdFxyXG5cdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YSddKTtcclxuXHRcclxuXHR2YXIgemlwID0gbmV3IEpTWmlwKCk7XHJcblx0emlwLmZpbGUoXCJjYXNlRmlsZS5pcGFyZGF0YVwiLCBjYXNlRGF0YS5jYXNlRmlsZSk7XHJcblx0emlwLmZpbGUoXCJzYXZlRmlsZS5pcGFyZGF0YVwiLCBjYXNlRGF0YS5zYXZlRmlsZSk7XHJcblx0dmFyIHN1Ym1pdHRlZCA9IHppcC5mb2xkZXIoJ3N1Ym1pdHRlZCcpO1xyXG5cdGNvbnNvbGUubG9nKGNhc2VEYXRhLnN1Ym1pdHRlZCk7XHJcblx0Zm9yICh2YXIgZmlsZSBpbiBjYXNlRGF0YS5zdWJtaXR0ZWQpIHtcclxuXHRcdGlmICghY2FzZURhdGEuc3VibWl0dGVkLmhhc093blByb3BlcnR5KGZpbGUpKSBjb250aW51ZTtcclxuXHRcdHZhciBzdGFydCA9IGNhc2VEYXRhLnN1Ym1pdHRlZFtmaWxlXS5pbmRleE9mKFwiYmFzZTY0LFwiKStcImJhc2U2NCxcIi5sZW5ndGg7XHJcblx0XHRzdWJtaXR0ZWQuZmlsZShmaWxlLCBjYXNlRGF0YS5zdWJtaXR0ZWRbZmlsZV0uc3Vic3RyKHN0YXJ0KSwge2Jhc2U2NDogdHJ1ZX0pO1xyXG5cdH1cclxuXHJcblx0XHJcblx0emlwLmdlbmVyYXRlQXN5bmMoe3R5cGU6XCJiYXNlNjRcIn0pLnRoZW4oZnVuY3Rpb24gKGJhc2U2NCkge1xyXG5cdFx0dmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuXHRcdGEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdGEuaHJlZiA9IFwiZGF0YTphcHBsaWNhdGlvbi96aXA7YmFzZTY0LFwiICsgYmFzZTY0O1xyXG5cdFx0YS5kb3dubG9hZCA9IGxvY2FsU3RvcmFnZVsnY2FzZU5hbWUnXTtcclxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XHJcblx0XHRhLmNsaWNrKCk7XHJcblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xyXG5cdH0pO1xyXG5cdFxyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKiogQ0FDSElORyAqKioqKioqKioqKioqKioqKioqL1xyXG5cclxubS5yZW1vdmVGaWxlc0ZvciA9IGZ1bmN0aW9uKGNhc2VEYXRhLCB0b1JlbW92ZSl7XHJcblxyXG5cdHZhciBxdWVzdGlvbkRhdGEgPSB0b1JlbW92ZS5ib2FyZCtcIi1cIit0b1JlbW92ZS5xdWVzdGlvbitcIi1cIjtcclxuXHRmb3IodmFyIGZpbGUgaW4gY2FzZURhdGEuc3VibWl0dGVkKXtcclxuXHRcdGlmICghY2FzZURhdGEuc3VibWl0dGVkLmhhc093blByb3BlcnR5KGZpbGUpIHx8ICFmaWxlLnN0YXJ0c1dpdGgocXVlc3Rpb25EYXRhKSkgY29udGludWU7XHJcblx0XHRkZWxldGUgY2FzZURhdGEuc3VibWl0dGVkW2ZpbGVdO1xyXG5cdH1cclxuXHRcclxufVxyXG5cclxuLy8gQWRkcyBhIHN1Ym1pdHRlZCBmaWxlIHRvIHRoZSBsb2NhbCBzdG9hcmdlXHJcbm0uYWRkTmV3RmlsZXNUb1N5c3RlbSA9IGZ1bmN0aW9uKGNhc2VEYXRhLCB0b1N0b3JlLCBjYWxsYmFjayl7XHJcblxyXG5cdC8vIFVzZWQgZm9yIGNhbGxiYWNrXHJcblx0dmFyIHRvdGFsQ0IgPSAxLCBjdXJDQiA9IDA7XHJcblx0dmFyIGZpbmlzaGVkID0gZnVuY3Rpb24oKXtcclxuXHRcdGlmKCsrY3VyQ0I+PXRvdGFsQ0Ipe1xyXG5cdFx0XHRjYWxsYmFjayhjYXNlRGF0YSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdGZvcih2YXIgaT0wO2k8dG9TdG9yZS5maWxlcy5sZW5ndGg7aSsrKXtcclxuXHRcdChmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcdHZhciBmaWxlbmFtZSA9IHRvU3RvcmUuYm9hcmQrXCItXCIrdG9TdG9yZS5xdWVzdGlvbitcIi1cIitpK1wiLVwiK3RvU3RvcmUuZmlsZXNbaV0ubmFtZTtcclxuXHRcdFx0dG90YWxDQisrO1xyXG5cdFx0XHRmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG5cdFx0XHRcdGNhc2VEYXRhLnN1Ym1pdHRlZFtmaWxlbmFtZV0gPSAgZXZlbnQudGFyZ2V0LnJlc3VsdDtcclxuXHRcdFx0XHRmaW5pc2hlZCgpO1xyXG5cdFx0ICAgIH07XHJcblx0XHQgICAgZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKHRvU3RvcmUuZmlsZXNbaV0pO1xyXG5cdFx0fSkoKTtcclxuXHR9XHJcblx0XHJcblx0ZmluaXNoZWQoKTtcclxufSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgQ2F0ZWdvcnkgPSByZXF1aXJlKFwiLi4vY2FzZS9jYXRlZ29yeS5qc1wiKTtcclxudmFyIFJlc291cmNlID0gcmVxdWlyZShcIi4uL2Nhc2UvcmVzb3VyY2VzLmpzXCIpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2dhbWUvY29uc3RhbnRzLmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoJy4uL2Nhc2UvcXVlc3Rpb24uanMnKTtcclxuXHJcbi8vIFBhcnNlcyB0aGUgeG1sIGNhc2UgZmlsZXNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBrbm93biB0YWdzXHJcbi8qXHJcbmFuc3dlclxyXG5idXR0b25cclxuY2F0ZWdvcnlMaXN0XHJcbmNvbm5lY3Rpb25zXHJcbmVsZW1lbnRcclxuZmVlZGJhY2tcclxuaW5zdHJ1Y3Rpb25zXHJcbnJlc291cmNlXHJcbnJlc291cmNlTGlzdFxyXG5yZXNvdXJjZUluZGV4XHJcbnNvZnR3YXJlTGlzdFxyXG5xdWVzdGlvblxyXG5xdWVzdGlvblRleHRcclxucXVzdGlvbk5hbWVcclxuKi9cclxuXHJcbi8vIGNvbnZlcnNpb25cclxudmFyIHN0YXRlQ29udmVydGVyID0ge1xyXG5cdFwiaGlkZGVuXCIgOiBRdWVzdGlvbi5TT0xWRV9TVEFURS5ISURERU4sXHJcblx0XCJ1bnNvbHZlZFwiIDogIFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlVOU09MVkVELFxyXG5cdFwiY29ycmVjdFwiIDogIFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRFxyXG59XHJcbi8vIGNvbnZlcnNpb25cclxudmFyIHJldmVyc2VTdGF0ZUNvbnZlcnRlciA9IFtcImhpZGRlblwiLCBcInVuc29sdmVkXCIsIFwiY29ycmVjdFwiXTtcclxuXHJcbnZhciBmaXJzdE5hbWUgPSBcInVuYXNzaWduZWRcIjtcclxudmFyIGxhc3ROYW1lID0gXCJ1bmFzc2lnbmVkXCI7XHJcbnZhciBlbWFpbCA9IFwiZW1haWxcIjtcclxuXHJcbi8vIE1vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHRcdFx0XHRcclxuLy8gKioqKioqKioqKioqKioqKioqKioqKiBMT0FESU5HICoqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLy8gc2V0IHRoZSBxdWVzdGlvbiBzdGF0ZXNcclxubS5hc3NpZ25RdWVzdGlvblN0YXRlcyA9IGZ1bmN0aW9uKGNhdGVnb3JpZXMsIHF1ZXN0aW9uRWxlbXMpIHtcclxuXHRjb25zb2xlLmxvZyhcInFlbGVtczogXCIgKyBxdWVzdGlvbkVsZW1zLmxlbmd0aCk7XHJcblx0dmFyIHRhbGx5ID0gMDsgLy8gdHJhY2sgdG90YWwgaW5kZXggaW4gbmVzdGVkIGxvb3BcclxuXHRcclxuXHQvLyBhbGwgcXVlc3Rpb25zXHJcblx0Zm9yICh2YXIgaT0wOyBpPGNhdGVnb3JpZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiQ0FURUdPUlkgXCIgKyBpKTtcclxuXHRcdGZvciAodmFyIGo9MDsgajxjYXRlZ29yaWVzW2ldLnF1ZXN0aW9ucy5sZW5ndGg7IGorKywgdGFsbHkrKykge1xyXG5cdFx0XHQvLyBzdG9yZSBxdWVzdGlvbiAgZm9yIGVhc3kgcmVmZXJlbmNlXHJcblx0XHRcdHZhciBxID0gY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal07XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBzdG9yZSB0YWcgZm9yIGVhc3kgcmVmZXJlbmNlXHJcblx0XHRcdHZhciBxRWxlbSA9IHF1ZXN0aW9uRWxlbXNbdGFsbHldO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gc3RhdGVcclxuXHRcdFx0cS5jdXJyZW50U3RhdGUgPSBzdGF0ZUNvbnZlcnRlcltxRWxlbS5nZXRBdHRyaWJ1dGUoXCJxdWVzdGlvblN0YXRlXCIpXTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIGp1c3RpZmljYXRpb25cclxuXHRcdFx0aWYocS5qdXN0aWZpY2F0aW9uKVxyXG5cdFx0XHRcdHEuanVzdGlmaWNhdGlvbi52YWx1ZSA9IHFFbGVtLmdldEF0dHJpYnV0ZShcImp1c3RpZmljYXRpb25cIik7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBDYWxsIGNvcnJlY3QgYW5zd2VyIGlmIHN0YXRlIGlzIGNvcnJlY3RcclxuXHRcdFx0aWYocS5jdXJyZW50U3RhdGU9PVF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRClcclxuXHRcdFx0ICBxLmNvcnJlY3RBbnN3ZXIoKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0Ly8geHBvc1xyXG5cdFx0XHRxLnBvc2l0aW9uUGVyY2VudFggPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHFFbGVtLmdldEF0dHJpYnV0ZShcInBvc2l0aW9uUGVyY2VudFhcIikpLCAwLCAxMDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueCk7XHJcblx0XHRcdC8vIHlwb3NcclxuXHRcdFx0cS5wb3NpdGlvblBlcmNlbnRZID0gVXRpbGl0aWVzLm1hcChwYXJzZUludChxRWxlbS5nZXRBdHRyaWJ1dGUoXCJwb3NpdGlvblBlcmNlbnRZXCIpKSwgMCwgMTAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLnkpO1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbi8vIHRha2VzIHRoZSB4bWwgc3RydWN0dXJlIGFuZCBmaWxscyBpbiB0aGUgZGF0YSBmb3IgdGhlIHF1ZXN0aW9uIG9iamVjdFxyXG5tLmdldENhdGVnb3JpZXNBbmRRdWVzdGlvbnMgPSBmdW5jdGlvbih4bWxEYXRhLCB3aW5kb3dEaXYpIHtcclxuXHQvLyBpZiB0aGVyZSBpcyBhIGNhc2UgZmlsZVxyXG5cdGlmICh4bWxEYXRhICE9IG51bGwpIHtcclxuXHRcdFxyXG5cdFx0Ly8gR2V0IHBsYXllciBkYXRhIFxyXG5cdFx0Zmlyc3ROYW1lID0geG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF0uZ2V0QXR0cmlidXRlKFwicHJvZmlsZUZpcnN0XCIpO1xyXG5cdFx0bGFzdE5hbWUgPSB4bWxEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FzZVwiKVswXS5nZXRBdHRyaWJ1dGUoXCJwcm9maWxlTGFzdFwiKTtcclxuXHRcdHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmdldEF0dHJpYnV0ZShcInByb2ZpbGVNYWlsXCIpO1xyXG5cdFx0XHJcblx0XHQvLyBGaXJzdCBsb2FkIHRoZSByZXNvdXJjZXNcclxuXHRcdHZhciByZXNvdXJjZUVsZW1lbnRzID0geG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlTGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlXCIpO1xyXG5cdFx0dmFyIHJlc291cmNlcyA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wOyBpPHJlc291cmNlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Ly8gTG9hZCBlYWNoIHJlc291cmNlXHJcblx0XHRcdHJlc291cmNlc1tpXSA9IG5ldyBSZXNvdXJjZShyZXNvdXJjZUVsZW1lbnRzW2ldKTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gVGhlbiBsb2FkIHRoZSBjYXRlZ29yaWVzXHJcblx0XHR2YXIgY2F0ZWdvcnlFbGVtZW50cyA9IHhtbERhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeVwiKTtcclxuXHRcdHZhciBjYXRlZ29yeU5hbWVzID0geG1sRGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5TGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImVsZW1lbnRcIik7XHJcblx0XHR2YXIgY2F0ZWdvcmllcyA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGNhdGVnb3J5RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Ly8gTG9hZCBlYWNoIGNhdGVnb3J5ICh3aGljaCBsb2FkcyBlYWNoIHF1ZXN0aW9uKVxyXG5cdFx0XHRjYXRlZ29yaWVzW2ldID0gbmV3IENhdGVnb3J5KGNhdGVnb3J5TmFtZXNbaV0uaW5uZXJIVE1MLCBjYXRlZ29yeUVsZW1lbnRzW2ldLCByZXNvdXJjZXMsIHdpbmRvd0Rpdik7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2F0ZWdvcmllcztcclxuXHR9XHJcblx0cmV0dXJuIG51bGxcclxufVxyXG5cclxuLy8gY3JlYXRlcyBhIGNhc2UgZmlsZSBmb3IgemlwcGluZ1xyXG5tLnJlY3JlYXRlQ2FzZUZpbGUgPSBmdW5jdGlvbihib2FyZHMpIHtcclxuXHJcblx0Ly8gY3JlYXRlIHNhdmUgZmlsZSB0ZXh0XHJcblx0dmFyIGRhdGFUb1NhdmUgPSBtLmNyZWF0ZVhNTFNhdmVGaWxlKGJvYXJkcywgdHJ1ZSk7XHJcblx0XHJcblx0Y29uc29sZS5sb2cgKFwic2F2ZURhdGEuaXBhciBkYXRhIGNyZWF0ZWRcIik7XHJcblx0XHJcblx0Ly9pZiAoY2FsbGJhY2spIGNhbGxiYWNrKGRhdGFUb1NhdmUpO1xyXG5cdHJldHVybiBkYXRhVG9TYXZlO1xyXG5cdFxyXG59XHJcblxyXG4vLyBjcmVhdGVzIHRoZSB4bWxcclxubS5jcmVhdGVYTUxTYXZlRmlsZSA9IGZ1bmN0aW9uKGFjdGl2ZUluZGV4LCBib2FyZHMsIGluY2x1ZGVOZXdsaW5lKSB7XHJcblx0Ly8gbmV3bGluZVxyXG5cdHZhciBubDtcclxuXHRpbmNsdWRlTmV3bGluZSA/IG5sID0gXCJcXG5cIiA6IG5sID0gXCJcIjtcclxuXHQvLyBoZWFkZXJcclxuXHR2YXIgb3V0cHV0ID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cInV0Zi04XCI/PicgKyBubDtcclxuXHQvLyBjYXNlIGRhdGFcclxuXHRvdXRwdXQgKz0gJzxjYXNlIGNhdGVnb3J5SW5kZXg9XCIzXCIgY2FzZVN0YXR1cz1cIicrKGFjdGl2ZUluZGV4KzEpKydcIiBwcm9maWxlRmlyc3Q9XCInKyBmaXJzdE5hbWUgKydcIiBwcm9maWxlTGFzdD1cIicgKyBsYXN0TmFtZSArICdcIiBwcm9maWxlTWFpbD1cIicrIGVtYWlsICsnXCI+JyArIG5sO1xyXG5cdC8vIHF1ZXN0aW9ucyBoZWFkZXJcclxuXHRvdXRwdXQgKz0gJzxxdWVzdGlvbnM+JyArIG5sO1xyXG5cdFxyXG5cdC8vIGxvb3AgdGhyb3VnaCBxdWVzdGlvbnNcclxuXHRmb3IgKHZhciBpPTA7IGk8Ym9hcmRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRmb3IgKHZhciBqPTA7IGo8Ym9hcmRzW2ldLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGorKykge1xyXG5cdFx0XHQvLyBzaG9ydGhhbmRcclxuXHRcdFx0dmFyIHEgPSBib2FyZHNbaV0ubGVzc29uTm9kZUFycmF5W2pdLnF1ZXN0aW9uO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gdGFnIHN0YXJ0XHJcblx0XHRcdG91dHB1dCArPSAnPHF1ZXN0aW9uICc7XHJcblxyXG5cdFx0XHQvLyBxdWVzdGlvblN0YXRlXHJcblx0XHRcdG91dHB1dCArPSAncXVlc3Rpb25TdGF0ZT1cIicgKyByZXZlcnNlU3RhdGVDb252ZXJ0ZXJbcS5jdXJyZW50U3RhdGVdICsgJ1wiICc7XHJcblx0XHRcdC8vIGp1c3RpZmljYXRpb25cclxuXHRcdFx0dmFyIG5ld0p1c3RpZmljYXRpb24gPSBxLmp1c3RpZmljYXRpb24udmFsdWU7XHJcblx0XHRcdHZhciBqdXN0aWZpY2F0aW9uO1xyXG5cdFx0XHRuZXdKdXN0aWZpY2F0aW9uID8ganVzdGlmaWNhdGlvbiA9IG5ld0p1c3RpZmljYXRpb24gOiBqdXN0aWZpY2F0aW9uID0gcS5qdXN0aWZpY2F0aW9uU3RyaW5nO1xyXG5cdFx0XHQvLyBoYW5kbGUgdW5kZWZpbmVkXHJcblx0XHRcdGlmICghanVzdGlmaWNhdGlvbikganVzdGlmaWNhdGlvbiA9IFwiXCI7XHJcblx0XHRcdG91dHB1dCArPSAnanVzdGlmaWNhdGlvbj1cIicgKyBqdXN0aWZpY2F0aW9uICsgJ1wiICc7XHJcblx0XHRcdC8vIGFuaW1hdGVkXHJcblx0XHRcdG91dHB1dCArPSAnYW5pbWF0ZWQ9XCInICsgKHEuY3VycmVudFN0YXRlID09IDIpICsgJ1wiICc7IC8vIG1pZ2h0IGhhdmUgdG8gZml4IHRoaXMgbGF0ZXJcclxuXHRcdFx0Ly8gbGluZXNUcmFuY2VkXHJcblx0XHRcdG91dHB1dCArPSAnbGluZXNUcmFjZWQ9XCIwXCIgJzsgLy8gbWlnaHQgaGF2ZSB0byBmaXggdGhpcyB0b29cclxuXHRcdFx0Ly8gcmV2ZWFsVGhyZXNob2xkXHJcblx0XHRcdG91dHB1dCArPSAncmV2ZWFsVGhyZXNob2xkICA9XCInICsgcS5yZXZlYWxUaHJlc2hvbGQgICsnXCIgJzsgLy8gYW5kIHRoaXNcclxuXHRcdFx0Ly8gcG9zaXRpb25QZXJjZW50WFxyXG5cdFx0XHRvdXRwdXQgKz0gJ3Bvc2l0aW9uUGVyY2VudFg9XCInICsgVXRpbGl0aWVzLm1hcChxLnBvc2l0aW9uUGVyY2VudFgsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueCwgMCwgMTAwKSArICdcIiAnO1xyXG5cdFx0XHQvLyBwb3NpdGlvblBlcmNlbnRZXHJcblx0XHRcdG91dHB1dCArPSAncG9zaXRpb25QZXJjZW50WT1cIicgKyBVdGlsaXRpZXMubWFwKHEucG9zaXRpb25QZXJjZW50WSwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55LCAwLCAxMDApICsgJ1wiICc7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyB0YWcgZW5kXHJcblx0XHRcdG91dHB1dCArPSAnLz4nICsgbmw7XHJcblx0XHR9XHJcblx0fVxyXG5cdG91dHB1dCArPSBcIjwvcXVlc3Rpb25zPlwiICsgbmw7XHJcblx0b3V0cHV0ICs9IFwiPC9jYXNlPlwiICsgbmw7XHJcblx0cmV0dXJuIG91dHB1dDtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9wb2ludC5qcycpO1xyXG5cclxuLy8gcHJpdmF0ZSB2YXJpYWJsZXNcclxudmFyIG1vdXNlUG9zaXRpb24sIHJlbGF0aXZlTW91c2VQb3NpdGlvbjtcclxudmFyIG1vdXNlRG93blRpbWVyLCBtYXhDbGlja0R1cmF0aW9uO1xyXG52YXIgbW91c2VXaGVlbFZhbDtcclxudmFyIHByZXZUaW1lO1xyXG52YXIgZGVsdGFZO1xyXG52YXIgc2NhbGluZywgdG91Y2hab29tLCBzdGFydFRvdWNoWm9vbTtcclxuXHJcbmZ1bmN0aW9uIG1vdXNlU3RhdGUoYm9hcmRzKXtcclxuXHRtb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcclxuICAgIHRoaXMudmlydHVhbFBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICBcclxuICAgIC8vZXZlbnQgbGlzdGVuZXJzIGZvciBtb3VzZSBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgY2FudmFzZXNcclxuICAgIHZhciBtb3VzZVN0YXRlID0gdGhpcztcclxuICAgIGZvcih2YXIgaT0wO2k8Ym9hcmRzLmxlbmd0aDtpKyspe1xyXG4gICAgXHR2YXIgY2FudmFzID0gYm9hcmRzW2ldLmNhbnZhcztcclxuXHQgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZSl7XHJcblx0ICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdCAgICAgICAgdXBkYXRlUG9zaXRpb24oZSk7XHJcblx0ICAgIH0pO1xyXG5cdCAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCBmdW5jdGlvbihlKXtcclxuXHQgICAgXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0ICAgIFx0aWYoc2NhbGluZylcclxuXHQgICAgXHRcdHVwZGF0ZVRvdWNoUG9zaXRpb25zKGUpO1xyXG5cdCAgICBcdGVsc2VcclxuXHQgICAgXHRcdHVwZGF0ZVBvc2l0aW9uKGUudG91Y2hlc1swXSk7XHJcblx0ICAgIH0pO1xyXG5cdCAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcclxuXHQgICAgXHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0ICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSB0cnVlO1xyXG5cdCAgICB9KTtcclxuXHQgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGZ1bmN0aW9uKGUpe1xyXG5cdCAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHQgICAgXHRpZihlLnRvdWNoZXMubGVuZ3RoID09IDEgJiYgIXNjYWxpbmcpe1xyXG5cdFx0ICAgICAgICB1cGRhdGVQb3NpdGlvbihlLnRvdWNoZXNbMF0pO1xyXG5cdFx0ICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHQgICAgICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSB0cnVlO1xyXG5cdFx0ICAgICAgICB9KTtcclxuXHQgICAgXHR9XHJcblx0ICAgIFx0ZWxzZSBpZihlLnRvdWNoZXMubGVuZ3RoID09IDIpe1xyXG5cdCAgICBcdFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSBmYWxzZTtcclxuXHQgICAgXHRcdHNjYWxpbmcgPSB0cnVlO1xyXG5cdCAgICBcdFx0dXBkYXRlVG91Y2hQb3NpdGlvbnMoZSk7XHJcblx0ICAgIFx0XHRzdGFydFRvdWNoWm9vbSA9IHRvdWNoWm9vbTtcclxuXHQgICAgXHR9XHJcblx0ICAgIH0pO1xyXG5cdCAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgZnVuY3Rpb24oZSl7XHJcblx0ICAgIFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdCAgICBcdG1vdXNlU3RhdGUubW91c2VEb3duID0gZmFsc2U7XHJcblx0ICAgIH0pO1xyXG5cdCAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdCAgICBcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHQgICAgXHRpZihzY2FsaW5nKXtcclxuXHQgICAgXHRcdHNjYWxpbmcgPSBmYWxzZTtcclxuXHQgICAgXHQgICAgdG91Y2hab29tID0gMDtcclxuXHQgICAgXHQgICAgc3RhcnRUb3VjaFpvb20gPSAwO1xyXG5cdCAgICBcdH1cclxuXHQgICAgXHRtb3VzZVN0YXRlLm1vdXNlRG93biA9IGZhbHNlO1xyXG5cdCAgICB9KTtcclxuXHQgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZSl7XHJcblx0ICAgIFx0bW91c2VTdGF0ZS5tb3VzZUluID0gdHJ1ZTtcclxuXHQgICAgfSk7XHJcblx0ICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZSl7XHJcblx0ICAgIFx0bW91c2VTdGF0ZS5tb3VzZUluID0gZmFsc2U7XHJcblx0ICAgIFx0bW91c2VTdGF0ZS5tb3VzZURvd24gPSBmYWxzZTtcclxuXHQgICAgfSk7XHJcblx0ICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJyxmdW5jdGlvbihldmVudCl7XHJcblx0ICAgIFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHQgICAgICAgIGRlbHRhWSArPSBldmVudC5kZWx0YVk7XHJcblx0ICAgIH0sIGZhbHNlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU2V0IHZhcmlhYmxlIGRlZmF1bHRzXHJcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgdGhpcy5tb3VzZUluID0gZmFsc2U7XHJcbiAgICBtb3VzZURvd25UaW1lciA9IDA7XHJcbiAgICBkZWx0YVkgPSAwO1xyXG4gICAgdGhpcy5tb3VzZVdoZWVsRFkgPSAwO1xyXG4gICAgdGhpcy56b29tRGlmZiA9IDA7XHJcbiAgICB0b3VjaFpvb20gPSAwO1xyXG4gICAgdGhpcy5tb3VzZUNsaWNrZWQgPSBmYWxzZTtcclxuICAgIG1heENsaWNrRHVyYXRpb24gPSAyMDA7XHJcblx0XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVBvc2l0aW9uKGUpe1xyXG4gICAgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQobW91c2VQb3NpdGlvbi54IC0gKHdpbmRvdy5pbm5lcldpZHRoLzIuMCksIG1vdXNlUG9zaXRpb24ueSAtICh3aW5kb3cuaW5uZXJIZWlnaHQvMi4wKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVRvdWNoUG9zaXRpb25zKGUpe1xyXG5cdHZhciBjdXJUb3VjaGVzID0gW1xyXG5cdCAgICAgICAgICAgICAgIG5ldyBQb2ludChlLnRvdWNoZXNbMF0uY2xpZW50WCwgZS50b3VjaGVzWzBdLmNsaWVudFkpLFxyXG5cdCAgICAgICAgICAgICAgIG5ldyBQb2ludChlLnRvdWNoZXNbMV0uY2xpZW50WCwgZS50b3VjaGVzWzFdLmNsaWVudFkpXHJcblx0XTtcclxuXHR0b3VjaFpvb20gPSBNYXRoLnNxcnQoTWF0aC5wb3coY3VyVG91Y2hlc1swXS54LWN1clRvdWNoZXNbMV0ueCwgMikrTWF0aC5wb3coY3VyVG91Y2hlc1swXS55LWN1clRvdWNoZXNbMV0ueSwgMikpO1xyXG59XHJcblxyXG52YXIgcCA9IG1vdXNlU3RhdGUucHJvdG90eXBlO1xyXG5cclxuLy8gVXBkYXRlIHRoZSBtb3VzZSB0byB0aGUgY3VycmVudCBzdGF0ZVxyXG5wLnVwZGF0ZSA9IGZ1bmN0aW9uKGR0LCBzY2FsZSl7XHJcbiAgICBcclxuXHQvLyBTYXZlIHRoZSBjdXJyZW50IHZpcnR1YWwgcG9zaXRpb24gZnJvbSBzY2FsZVxyXG5cdHRoaXMudmlydHVhbFBvc2l0aW9uID0gbmV3IFBvaW50KHJlbGF0aXZlTW91c2VQb3NpdGlvbi54L3NjYWxlLCByZWxhdGl2ZU1vdXNlUG9zaXRpb24ueS9zY2FsZSk7O1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgY3VycnRlbmwgZGVsdGEgeSBmb3IgdGhlIG1vdXNlIHdoZWVsXHJcbiAgICB0aGlzLm1vdXNlV2hlZWxEWSA9IGRlbHRhWTtcclxuICAgIGRlbHRhWSA9IDA7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgem9vbSBkaWZmIGFuZCBwcmV2IHpvb21cclxuXHRpZihzY2FsaW5nKVxyXG5cdFx0dGhpcy56b29tRGlmZiA9IHN0YXJ0VG91Y2hab29tIC0gdG91Y2hab29tO1xyXG5cdGVsc2VcclxuXHRcdHRoaXMuem9vbURpZmYgPSAwO1xyXG5cdFxyXG4gICAgLy8gY2hlY2sgbW91c2UgY2xpY2tcclxuICAgIHRoaXMubW91c2VDbGlja2VkID0gZmFsc2U7XHJcbiAgICBpZiAodGhpcy5tb3VzZURvd24pXHJcbiAgICBcdG1vdXNlRG93blRpbWVyICs9IGR0O1xyXG4gICAgZWxzZXtcclxuICAgIFx0aWYgKG1vdXNlRG93blRpbWVyID4gMCAmJiBtb3VzZURvd25UaW1lciA8IG1heENsaWNrRHVyYXRpb24pXHJcbiAgICBcdFx0dGhpcy5tb3VzZUNsaWNrZWQgPSB0cnVlO1xyXG4gICAgXHRtb3VzZURvd25UaW1lciA9IDA7XHJcbiAgICB9XHJcbiAgICB0aGlzLnByZXZNb3VzZURvd24gPSB0aGlzLm1vdXNlRG93bjtcclxuICAgIHRoaXMuaGFzVGFyZ2V0ID0gZmFsc2U7XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtb3VzZVN0YXRlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5mdW5jdGlvbiBQb2ludChwWCwgcFkpe1xyXG4gICAgdGhpcy54ID0gcFg7XHJcbiAgICB0aGlzLnkgPSBwWTtcclxufVxyXG5cclxudmFyIHAgPSBQb2ludC5wcm90b3R5cGU7XHJcblxyXG5wLmFkZCA9IGZ1bmN0aW9uKHBYLCBwWSl7XHJcblx0aWYocFkpXHJcblx0XHRyZXR1cm4gbmV3IFBvaW50KHRoaXMueCtwWCwgdGhpcy55K3BZKTtcclxuXHRlbHNlXHJcblx0XHRyZXR1cm4gbmV3IFBvaW50KHRoaXMueCtwWC54LCB0aGlzLnkrcFgueSk7XHJcbn1cclxuXHJcbnAubXVsdCA9IGZ1bmN0aW9uKHBYLCBwWSl7XHJcblx0aWYocFkpXHJcblx0XHRyZXR1cm4gbmV3IFBvaW50KHRoaXMueCpwWCwgdGhpcy55KnBZKTtcclxuXHRlbHNlXHJcblx0XHRyZXR1cm4gbmV3IFBvaW50KHRoaXMueCpwWC54LCB0aGlzLnkqcFgueSk7XHJcbn1cclxuXHJcbnAuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XHJcblx0cmV0dXJuIG5ldyBQb2ludCh0aGlzLngqc2NhbGUsIHRoaXMueSpzY2FsZSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxuXHJcbi8vTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gcmV0dXJucyBtb3VzZSBwb3NpdGlvbiBpbiBsb2NhbCBjb29yZGluYXRlIHN5c3RlbSBvZiBlbGVtZW50XHJcbm0uZ2V0TW91c2UgPSBmdW5jdGlvbihlKXtcclxuICAgIHJldHVybiBuZXcgUG9pbnQoKGUucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0KSwgKGUucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3ApKTtcclxufVxyXG5cclxuLy9yZXR1cm5zIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIHJhdGlvIGl0IGhhcyB3aXRoIGEgc3BlY2lmaWMgcmFuZ2UgXCJtYXBwZWRcIiB0byBhIGRpZmZlcmVudCByYW5nZVxyXG5tLm1hcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4xLCBtYXgxLCBtaW4yLCBtYXgyKXtcclxuICAgIHJldHVybiBtaW4yICsgKG1heDIgLSBtaW4yKSAqICgodmFsdWUgLSBtaW4xKSAvIChtYXgxIC0gbWluMSkpO1xyXG59XHJcblxyXG4vL2lmIGEgdmFsdWUgaXMgaGlnaGVyIG9yIGxvd2VyIHRoYW4gdGhlIG1pbiBhbmQgbWF4LCBpdCBpcyBcImNsYW1wZWRcIiB0byB0aGF0IG91dGVyIGxpbWl0XHJcbm0uY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xyXG59XHJcblxyXG4vL2RldGVybWluZXMgd2hldGhlciB0aGUgbW91c2UgaXMgaW50ZXJzZWN0aW5nIHRoZSBhY3RpdmUgZWxlbWVudFxyXG5tLm1vdXNlSW50ZXJzZWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUsIHBFbGVtZW50LCBwT2Zmc2V0dGVyKXtcclxuICAgIGlmKHBNb3VzZVN0YXRlLnZpcnR1YWxQb3NpdGlvbi54ID4gcEVsZW1lbnQucG9zaXRpb24ueCAtIHBFbGVtZW50LndpZHRoLzIgLSBwT2Zmc2V0dGVyLnggJiYgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnggPCBwRWxlbWVudC5wb3NpdGlvbi54ICsgcEVsZW1lbnQud2lkdGgvMiAtIHBPZmZzZXR0ZXIueCl7XHJcbiAgICAgICAgaWYocE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPiBwRWxlbWVudC5wb3NpdGlvbi55IC0gcEVsZW1lbnQuaGVpZ2h0LzIgLSBwT2Zmc2V0dGVyLnkgJiYgcE1vdXNlU3RhdGUudmlydHVhbFBvc2l0aW9uLnkgPCBwRWxlbWVudC5wb3NpdGlvbi55ICsgcEVsZW1lbnQuaGVpZ2h0LzIgLSBwT2Zmc2V0dGVyLnkpe1xyXG4gICAgICAgICAgICAvL3BFbGVtZW50Lm1vdXNlT3ZlciA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBwTW91c2VTdGF0ZS5oYXNUYXJnZXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAvL3BFbGVtZW50Lm1vdXNlT3ZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgIFx0cmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIGdldHMgdGhlIHhtbCBvYmplY3Qgb2YgYSBzdHJpbmdcclxubS5nZXRYbWwgPSBmdW5jdGlvbih4bWwpe1xyXG5cdFxyXG5cdC8vIENsZWFuIHVwIHRoZSB4bWxcclxuXHR4bWwgPSB4bWwudHJpbSgpO1xyXG5cdHdoaWxlKHhtbC5jaGFyQ29kZUF0KDApPD0zMilcclxuXHRcdHhtbCA9IHhtbC5zdWJzdHIoMSk7XHJcblx0eG1sID0geG1sLnRyaW0oKTtcclxuXHRcclxuXHR2YXIgeG1sRG9jO1xyXG5cdGlmICh3aW5kb3cuRE9NUGFyc2VyKXtcclxuXHRcdHZhciBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHR4bWxEb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcclxuXHR9XHJcblx0ZWxzZXsgLy8gSUVcclxuXHRcdHhtbERvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTERPTVwiKTtcclxuXHRcdHhtbERvYy5hc3luYyA9IGZhbHNlO1xyXG5cdFx0eG1sRG9jLmxvYWRYTUwoeG1sKTtcclxuXHR9XHJcblx0cmV0dXJuIHhtbERvYztcclxufVxyXG5cclxuLy8gZ2V0cyB0aGUgc2NhbGUgb2YgdGhlIGZpcnN0IHBhcmFtZXRlciB0byB0aGUgc2Vjb25kICh3aXRoIHRoZSBzZWNvbmQgZml0dGluZyBpbnNpZGUgdGhlIGZpcnN0KVxyXG5tLmdldFNjYWxlID0gZnVuY3Rpb24odmlydHVhbCwgYWN0dWFsKXtcclxuXHRyZXR1cm4gYWN0dWFsLnkvdmlydHVhbC54KnZpcnR1YWwueSA8IGFjdHVhbC54ID8gYWN0dWFsLnkvdmlydHVhbC55IDogYWN0dWFsLngvdmlydHVhbC54O1xyXG59XHJcblxyXG5tLnJlcGxhY2VBbGwgPSBmdW5jdGlvbiAoc3RyLCB0YXJnZXQsIHJlcGxhY2VtZW50KSB7XHJcblx0d2hpbGUgKHN0ci5pbmRleE9mKHRhcmdldCkgPiAtMSkge1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UodGFyZ2V0LHJlcGxhY2VtZW50KTtcclxuXHR9XHJcblx0cmV0dXJuIHN0cjtcclxufVxyXG5cclxuLy8gR2V0cyB0aGUgaW5kZXggb2YgdGhlIG50aCBzZWFyY2ggc3RyaW5nIChzdGFydGluZyBhdCAxLCAwIHdpbGwgYWx3YXlzIHJldHVybiAwKVxyXG5TdHJpbmcucHJvdG90eXBlLmluZGV4T2ZBdCA9IGZ1bmN0aW9uKHNlYXJjaCwgbnVtKXtcclxuXHR2YXIgY3VySW5kZXggPSAwO1xyXG5cdGZvcih2YXIgaT0wO2k8bnVtICYmIGN1ckluZGV4IT0tMTtpKyspXHJcblx0XHRjdXJJbmRleCA9IHRoaXMuaW5kZXhPZihzZWFyY2gsIGN1ckluZGV4KzEpO1xyXG5cdHJldHVybiBjdXJJbmRleDtcclxufVxyXG4iLCJcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0udGFza1dpbmRvdyA9ICdcXFxyXG48ZGl2IGNsYXNzPVwid2luZG93IGxlZnRcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRUYXNrXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJvdmVyZmxvdy15OiBzY3JvbGw7aGVpZ2h0OjM1dmg7XCI+XFxcclxuXHRcdDxoMz48Yj4ldGl0bGUlPC9iPjwvaDM+XFxcclxuXHRcdDxwPiVpbnN0cnVjdGlvbnMlPC9wPlxcXHJcblx0XHQ8aHI+XFxcclxuXHRcdDxwPjxiPiVxdWVzdGlvbiU8L2I+PC9wPlxcXHJcblx0XHQ8aHI+XFxcclxuXHRcdDxwIGNsYXNzPVwiZmVlZGJhY2tcIj48L3A+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxuXHJcbm0ucmVzb3VyY2VXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyBsZWZ0XCI+XFxcclxuXHQ8ZGl2IGNsYXNzPVwidGl0bGVcIj5cXFxyXG5cdFx0UmVzb3VyY2VcXFxyXG5cdDwvZGl2PlxcXHJcblx0PGRpdiBjbGFzcz1cIndpbmRvd0NvbnRlbnRcIiBzdHlsZT1cIm92ZXJmbG93LXk6IHNjcm9sbDsgaGVpZ2h0OjIwdmg7XCI+XFxcclxuXHRcdCVyZXNvdXJjZXMlXFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5yZXNvdXJjZSA9ICdcXFxyXG48ZGl2IGNsYXNzPVwicmVzb3VyY2VJdGVtXCI+XFxcclxuICA8aW1nIHNyYz1cIiVpY29uJVwiLz5cXFxyXG4gICV0aXRsZSVcXFxyXG4gIDxhIGhyZWY9XCIlbGluayVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cXFxyXG4gICAgPGRpdiBjbGFzcz1cImNlbnRlclwiPlxcXHJcbiAgICAgIE9wZW5cXFxyXG4gICAgICA8aW1nIHNyYz1cIi4uL2ltZy9pY29uTGF1bmNoLnBuZ1wiLz5cXFxyXG4gICAgPC9kaXY+XFxcclxuICA8L2E+XFxcclxuPC9kaXY+XFxcclxuJztcclxuXHJcbm0uYW5zd2VyV2luZG93ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3cgcmlnaHRcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRBbnN3ZXJzXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJtaW4taGVpZ2h0OjIwdmg7XCI+XFxcclxuXHRcXFxyXG5cdDwvZGl2PlxcXHJcbjwvZGl2PlxcXHJcbic7XHJcblxyXG5tLmZpbGVXaW5kb3cgPSAnXFxcclxuPGRpdiBjbGFzcz1cIndpbmRvdyByaWdodFwiPlxcXHJcbiAgPGRpdiBjbGFzcz1cInRpdGxlXCI+XFxcclxuICAgIEZpbGVzXFxcclxuICA8L2Rpdj5cXFxyXG4gIDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJoZWlnaHQ6MjV2aDttaW4taGVpZ2h0OiAxMDBweDtcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJmaWxlQnV0dG9uIGZ1bGxcIj5cXFxyXG5cdFx0PGltZyBzcmM9XCIuLi9pbWcvaWNvbkZpbGVTdWJtaXQucG5nXCIvPjxicj5cXFxyXG5cdFx0QnJvd3NlIEFuZCBTdWJtaXRcXFxyXG5cdDwvZGl2PlxcXHJcbiAgICA8aW5wdXQgdHlwZT1cImZpbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIiBtdWx0aXBsZS8+XFxcclxuICA8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nO1xyXG5cclxubS5tZXNzYWdlV2luZG93ID0gJ1xcXHJcbjxkaXYgY2xhc3M9XCJ3aW5kb3dcIj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ0aXRsZVwiPlxcXHJcblx0XHRNZXNzYWdlXFxcclxuXHQ8L2Rpdj5cXFxyXG5cdDxkaXYgY2xhc3M9XCJ3aW5kb3dDb250ZW50XCIgc3R5bGU9XCJoZWlnaHQ6ODB2aDtvdmVyZmxvdy15OnNjcm9sbDtcIj5cXFxyXG5cdFx0PHA+PGI+RnJvbSA8L2I+JXRpdGxlJTwvcD5cXFxyXG5cdFx0PGhyPlxcXHJcblx0XHQ8cD48Yj5TdWJqZWN0IDwvYj4laW5zdHJ1Y3Rpb25zJTwvcD5cXFxyXG5cdFx0PGhyPlxcXHJcblx0XHQ8cD4lcXVlc3Rpb24lPC9wPlxcXHJcblx0ICA8YnV0dG9uIGNsYXNzPVwiYW5zd2VyXCI+TWFyayBhcyBSZWFkPC9idXR0b24+XFxcclxuXHQ8L2Rpdj5cXFxyXG48L2Rpdj5cXFxyXG4nOyIsInZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi9oZWxwZXIvdXRpbGl0aWVzLmpzJyk7XHJcblxyXG4vLyBIVE1MXHJcbnZhciBzZWN0aW9uO1xyXG5cclxuLy8gRWxlbWVudHNcclxudmFyIHRpdGxlLCBkZXNjcmlwdGlvbjtcclxudmFyIHJlc3VtZSwgc3RhcnQsIGJhY2s7XHJcblxyXG4vLyBUaGUgbmV4dCBwYWdlIHRvIG9wZW4gd2hlbiB0aGlzIG9uZSBjbG9zZXNcclxudmFyIG5leHQ7XHJcblxyXG52YXIgTkVYVCA9IE9iamVjdC5mcmVlemUoe05PTkU6IDAsIFRJVExFOiAxLCBORVdfUFJPRklMRTogMiwgT0xEX1BST0ZJTEU6IDN9KTtcclxuXHJcbmZ1bmN0aW9uIENhc2VNZW51KHBTZWN0aW9uKXtcclxuXHRzZWN0aW9uID0gcFNlY3Rpb247XHJcblx0bmV4dCA9IE5FWFQuTk9ORTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIGh0bWwgZWxlbWVudHNcclxuXHR0aXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjdGl0bGUnKTtcclxuXHRkZXNjcmlwdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjZGVzY3JpcHRpb24nKTtcclxuXHRyZXN1bWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI3Jlc3VtZS1idXR0b24nKTtcclxuXHRzdGFydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjc3RhcnQtYnV0dG9uJyk7XHJcblx0YmFjayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjYmFjay1idXR0b24nKTtcclxuXHRcclxuXHQvLyBTZXR1cCB0aGUgYnV0dG9uc1xyXG4gICAgdmFyIHBhZ2UgPSB0aGlzO1xyXG4gICAgcmVzdW1lLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRwYWdlLm5leHQgPSBORVhULk9MRF9QUk9GSUxFO1xyXG4gICAgXHRwYWdlLmNsb3NlKCk7XHJcbiAgICB9O1xyXG4gICAgc3RhcnQub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBcdHBhZ2UubmV4dCA9IE5FWFQuTkVXX1BST0ZJTEU7XHJcbiAgICBcdHBhZ2UuY2xvc2UoKTtcclxuICAgIH07XHJcbiAgICBiYWNrLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRwYWdlLm5leHQgPSBORVhULlRJVExFO1xyXG4gICAgXHRwYWdlLmNsb3NlKCk7XHJcbiAgICB9O1xyXG59XHJcblxyXG52YXIgcCA9IENhc2VNZW51LnByb3RvdHlwZTtcclxuXHJcbnAub3BlbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gRGlzcGxheSB0aGUgc2VjdGlvbiBob2xkaW5nIHRoZSBtZW51XHJcblx0c2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBjdXJyZW50IGNhc2UgZGF0YSBmcm9tIGxvY2FsIHN0b3JhZ2VcclxuXHR2YXIgY2FzZURhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVsnY2FzZURhdGEnXSk7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSBjYXNlIG5hbWUgYW5kIGRlc2NyaXB0aW9uIGZyb20gdGhlIHhtbFxyXG5cdHZhciBjdXJDYXNlID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5jYXNlRmlsZSkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdO1xyXG5cdHRpdGxlLmlubmVySFRNTCA9IGN1ckNhc2UuZ2V0QXR0cmlidXRlKFwiY2FzZU5hbWVcIik7XHJcblx0ZGVzY3JpcHRpb24uaW5uZXJIVE1MID0gY3VyQ2FzZS5nZXRBdHRyaWJ1dGUoXCJkZXNjcmlwdGlvblwiKTtcclxuXHRcclxuXHQvLyBHZXQgdGhlIGNhc2Ugc2F2ZSBzdGF0dXNcclxuXHRjYXNlU3RhdHVzID0gVXRpbGl0aWVzLmdldFhtbChjYXNlRGF0YS5zYXZlRmlsZSkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXNlXCIpWzBdLmdldEF0dHJpYnV0ZShcImNhc2VTdGF0dXNcIik7XHJcblx0dmFyIHN0YXR1c01lc3NhZ2UgPSBcIlwiO1xyXG5cdHN3aXRjaChjYXNlU3RhdHVzKXtcclxuXHRcdGNhc2UgJzAnOlxyXG5cdFx0XHRzdGF0dXNNZXNzYWdlID0gXCJcIjtcclxuXHRcdFx0cmVzdW1lLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICcxJzpcclxuXHRcdFx0c3RhdHVzTWVzc2FnZSA9IFwiIFtJbiBQcm9ncmVzc11cIjtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICcyJzpcclxuXHRcdFx0c3RhdHVzTWVzc2FnZSA9IFwiIFtDb21wbGV0ZWRdXCI7XHJcblx0XHRcdGJyZWFrO1xyXG5cdH1cclxuICAgIHRpdGxlLmlubmVySFRNTCArPSBzdGF0dXNNZXNzYWdlO1xyXG4gICAgXHJcbn1cclxuXHJcbnAuY2xvc2UgPSBmdW5jdGlvbigpe1xyXG5cdHNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRpZih0aGlzLm9uY2xvc2UpXHJcblx0XHR0aGlzLm9uY2xvc2UoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYXNlTWVudTtcclxubW9kdWxlLmV4cG9ydHMuTkVYVCA9IE5FWFQ7IiwidmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL2hlbHBlci91dGlsaXRpZXMuanMnKTtcclxuXHJcbi8vIEhUTUxcclxudmFyIHNlY3Rpb247XHJcblxyXG4vL0VsZW1lbnRzXHJcbnZhciB0aXRsZTtcclxudmFyIGZpcnN0TmFtZSwgbGFzdE5hbWUsIGVtYWlsO1xyXG52YXIgZmlyc3ROYW1lSW5wdXQsIGxhc3ROYW1lSW5wdXQsIGVtYWlsSW5wdXQ7XHJcbnZhciBwcm9jZWVkLCBiYWNrO1xyXG5cclxuLy8gSWYgbWFraW5nIGEgbmV3IHByb2ZpbGUgb3Igbm90XHJcbnZhciBuZXdQcm9maWxlO1xyXG5cclxuLy8gVGhlIGN1ciBjYXNlXHJcbnZhciBjdXJDYXNlO1xyXG5cclxuLy8gVGhlIG5leHQgcGFnZSB0byBvcGVuIHdoZW4gdGhpcyBvbmUgY2xvc2VzXHJcbnZhciBuZXh0O1xyXG5cclxudmFyIE5FWFQgPSBPYmplY3QuZnJlZXplKHtOT05FOiAwLCBDQVNFOiAxLCBCT0FSRDogMn0pO1xyXG5cclxuZnVuY3Rpb24gUHJvZmlsZU1lbnUocFNlY3Rpb24pe1xyXG5cdHNlY3Rpb24gPSBwU2VjdGlvbjtcclxuXHRuZXh0ID0gTkVYVC5OT05FO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgaHRtbCBlbGVtZW50c1xyXG5cdHRpdGxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICN0aXRsZScpO1xyXG5cdGZpcnN0TmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjZmlyc3QtbmFtZScpO1xyXG5cdGxhc3ROYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNsYXN0LW5hbWUnKTtcclxuXHRlbWFpbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjZW1haWwnKTtcclxuXHRmaXJzdE5hbWVJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjaW5wdXQtZmlyc3QtbmFtZScpO1xyXG5cdGxhc3ROYW1lSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2lucHV0LWxhc3QtbmFtZScpO1xyXG5cdGVtYWlsSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJytzZWN0aW9uLmlkKycgI2lucHV0LWVtYWlsJyk7XHJcblx0cHJvY2VlZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjcHJvY2VlZC1idXR0b24nKTtcclxuXHRiYWNrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNiYWNrLWJ1dHRvbicpO1xyXG4gICAgXHJcblx0Ly8gU2V0dXAgdGhlIGJ1dHRvbnNcclxuXHRiYWNrLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgXHRwYWdlLm5leHQgPSBORVhULkNBU0U7XHJcbiAgICBcdHBhZ2UuY2xvc2UoKTtcclxuICAgIH07XHJcblx0dmFyIHBhZ2UgPSB0aGlzO1xyXG4gICAgcHJvY2VlZC5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgIFx0cGFnZS5uZXh0ID0gTkVYVC5CT0FSRDtcclxuICAgIFx0aWYobmV3UHJvZmlsZSl7XHJcblx0XHRcdGN1ckNhc2Uuc2V0QXR0cmlidXRlKFwicHJvZmlsZUZpcnN0XCIsIGZpcnN0TmFtZUlucHV0LnZhbHVlKTtcclxuXHRcdFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoXCJwcm9maWxlTGFzdFwiLCBsYXN0TmFtZUlucHV0LnZhbHVlKTtcclxuXHRcdFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoXCJwcm9maWxlTWFpbFwiLCBlbWFpbElucHV0LnZhbHVlKTtcclxuXHRcdFx0Y3VyQ2FzZS5zZXRBdHRyaWJ1dGUoXCJjYXNlU3RhdHVzXCIsIFwiMFwiKTtcclxuICAgIFx0fVxyXG4gICAgXHRlbHNlXHJcblx0XHRcdGN1ckNhc2Uuc2V0QXR0cmlidXRlKFwiY2FzZVN0YXR1c1wiLCBcIjFcIik7XHJcbiAgICBcdHZhciBjYXNlRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlWydjYXNlRGF0YSddKTtcclxuICAgIFx0Y2FzZURhdGEuc2F2ZUZpbGUgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGN1ckNhc2UpO1xyXG5cdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YSddID0gSlNPTi5zdHJpbmdpZnkoY2FzZURhdGEpO1xyXG4gICAgXHRwYWdlLmNsb3NlKCk7XHJcbiAgICB9O1xyXG59XHJcblxyXG52YXIgcCA9IFByb2ZpbGVNZW51LnByb3RvdHlwZTtcclxuXHJcbnAub3BlbiA9IGZ1bmN0aW9uKHBOZXdQcm9maWxlKXtcclxuXHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgc3RhdHVzIG9mIG5ldyBwcm9maWxlIGZvciB0aGUgcHJvY2NlZWQgYnV0dG9uXHJcblx0bmV3UHJvZmlsZSA9IHBOZXdQcm9maWxlO1xyXG5cdFxyXG5cdC8vIE1ha2UgdGhlIG1lbnUgdmlzaWJsZVxyXG5cdHNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFxyXG5cdC8vIFRoZSBjYXNlIGRhdGEgYW5kIHRoZSB0aXRsZSBlbGVtZW50XHJcblx0dmFyIGNhc2VEYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbJ2Nhc2VEYXRhJ10pO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgY2FzZVxyXG5cdHZhciBzYXZlRmlsZSA9IFV0aWxpdGllcy5nZXRYbWwoY2FzZURhdGEuc2F2ZUZpbGUpO1xyXG5cdGN1ckNhc2UgPSBzYXZlRmlsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhc2VcIilbMF07XHJcblx0XHJcblx0Ly8gU2V0IHVwIHRoZSBwYWdlIGZvciBhIG5ldyBwcm9maWxlXHJcblx0aWYobmV3UHJvZmlsZSl7XHJcblx0XHRcclxuXHRcdC8vIFVwZGF0ZSB0aGUgdGl0bGVcclxuXHRcdHRpdGxlLmlubmVySFRNTCA9IFwiRW50ZXIgUHJvZmlsZSBJbmZvcm1hdGlvblwiO1xyXG5cdFx0XHJcblx0XHQvLyBEaXNwbGF5IHRoZSBpbnB1dHMgYW5kIGNsZWFyIHRoZSBuYW1lc1xyXG5cdFx0ZW1haWwuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFx0Zmlyc3ROYW1lSW5wdXQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cdFx0bGFzdE5hbWVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0XHRmaXJzdE5hbWUuaW5uZXJIVE1MID0gJyc7XHJcblx0XHRsYXN0TmFtZS5pbm5lckhUTUwgPSAnJztcclxuXHRcdFxyXG5cdFx0XHJcblx0XHQvLyBNYWtlIGl0IHNvIHRoYXQgcHJvY2VlZCBpcyBkaXNhYmxlZCB1bnRpbCBhbGwgdGhyZWUgaW5wdXRzIGhhdmUgdmFsdWVzXHJcblx0XHR2YXIgY2hlY2tQcm9jZWVkID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYoZmlyc3ROYW1lSW5wdXQudmFsdWU9PVwiXCIgfHxcclxuXHRcdFx0XHRsYXN0TmFtZUlucHV0LnZhbHVlPT1cIlwiIHx8XHJcblx0XHRcdFx0ZW1haWxJbnB1dC52YWx1ZT09XCJcIilcclxuXHRcdFx0XHRwcm9jZWVkLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHByb2NlZWQuZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdH07XHJcblx0XHRmaXJzdE5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGVja1Byb2NlZWQpO1xyXG5cdFx0bGFzdE5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGVja1Byb2NlZWQpO1xyXG5cdFx0ZW1haWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGVja1Byb2NlZWQpO1xyXG5cdFx0Y2hlY2tQcm9jZWVkKCk7XHJcblx0XHRcclxuXHR9XHJcblx0Ly8gU2V0IHVwIHRoZSBwYWdlIGZvciBhbiBvbGQgcHJvZmlsZVxyXG5cdGVsc2V7XHJcblx0XHRcclxuXHRcdC8vIFVwZGF0ZSB0aGUgdGl0bGVcclxuXHRcdHRpdGxlLmlubmVySFRNTCA9IFwiQ29uZmlybSBQcm9maWxlIEluZm9ybWF0aW9uXCI7XHJcblx0XHRcclxuXHRcdC8vIEhpZGUgdGhlIGVtYWlsIGFuZCB0ZXh0Ym94ZXMgYW5kIGRpc3BsYXkgdGhlIGN1cnJlbnQgbmFtZVxyXG5cdFx0ZW1haWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdGZpcnN0TmFtZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRsYXN0TmFtZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRmaXJzdE5hbWUuaW5uZXJIVE1MID0gY3VyQ2FzZS5nZXRBdHRyaWJ1dGUoXCJwcm9maWxlRmlyc3RcIik7XHJcblx0XHRmaXJzdE5hbWUuc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJztcclxuXHRcdGxhc3ROYW1lLmlubmVySFRNTCA9IGN1ckNhc2UuZ2V0QXR0cmlidXRlKFwicHJvZmlsZUxhc3RcIik7XHJcblx0XHRsYXN0TmFtZS5zdHlsZS5mb250V2VpZ2h0ID0gJ2JvbGQnO1xyXG5cdFx0XHJcblx0XHQvLyBNYWtlIHByb2NjZWVkIG5vdCBkaXNhYmxlZFxyXG5cdFx0cHJvY2VlZC5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHJcblx0fVxyXG5cdFxyXG59XHJcblxyXG5wLmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRzZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0aWYodGhpcy5vbmNsb3NlKVxyXG5cdFx0dGhpcy5vbmNsb3NlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvZmlsZU1lbnU7XHJcbm1vZHVsZS5leHBvcnRzLk5FWFQgPSBORVhUOyIsIlxyXG4vLyBIVE1MXHJcbnZhciBzZWN0aW9uO1xyXG5cclxuLy8gUGFydHMgb2YgdGhlIGh0bWxcclxudmFyIGxvYWRJbnB1dCwgbG9hZEJ1dHRvbiwgZGVtb0J1dHRvbiwgY29udGludWVCdXR0b24sIG1lbnVCdXR0b247XHJcblxyXG4vLyBUaGUgbmV4dCBwYWdlIHRvIG9wZW4gd2hlbiB0aGlzIG9uZSBjbG9zZXNcclxudmFyIG5leHQ7XHJcblxyXG52YXIgTkVYVCA9IE9iamVjdC5mcmVlemUoe05PTkU6IDAsIEJPQVJEOiAxLCBDQVNFOiAyfSk7XHJcblxyXG5mdW5jdGlvbiBUaXRsZU1lbnUocFNlY3Rpb24pe1xyXG5cdHNlY3Rpb24gPSBwU2VjdGlvbjtcclxuXHRuZXh0ID0gTkVYVC5OT05FO1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgbG9hZCBidXR0b24gYW5kIGlucHV0XHJcblx0bG9hZElucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNsb2FkLWlucHV0Jyk7XHJcblx0bG9hZEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnK3NlY3Rpb24uaWQrJyAjbG9hZC1idXR0b24nKTtcclxuXHRkZW1vQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNkZW1vLWJ1dHRvbicpO1xyXG5cdGNvbnRpbnVlQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNjb250aW51ZS1idXR0b24nKTtcclxuXHRtZW51QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycrc2VjdGlvbi5pZCsnICNtZW51LWJ1dHRvbicpO1xyXG5cdFxyXG5cdC8vIFNldHVwIHRoZSBidXR0b25zXHJcblx0ZGVtb0J1dHRvbi5vbmNsaWNrID0gdGhpcy5kZW1vLmJpbmQodGhpcyk7XHJcblx0bG9hZEJ1dHRvbi5vbmNsaWNrID0gbG9hZElucHV0LmNsaWNrLmJpbmQobG9hZElucHV0KTtcclxuXHRsb2FkSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5sb2FkRmlsZS5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcblx0Y29udGludWVCdXR0b24ub25jbGljayA9IHRoaXMuY2xvc2UuYmluZCh0aGlzKTtcclxuXHRtZW51QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbigpe3dpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9pbmRleC5odG1sXCI7fTtcclxufVxyXG5cclxudmFyIHAgPSBUaXRsZU1lbnUucHJvdG90eXBlO1xyXG5cclxucC5vcGVuID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBTZXR1cCBjb250aW51ZSBidXR0b24gYmFzZWQgb24gbG9jYWwgc3RvYXJnZVxyXG5cdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGEnXSlcclxuXHRcdGNvbnRpbnVlQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcblx0ZWxzZVxyXG5cdFx0Y29udGludWVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdHRoaXMubmV4dCA9IE5FWFQuQk9BUkQ7XHJcblx0XHJcblx0Ly8gRGlzcGxheSB0aGUgc2VjdGlvbiBob2xkaW5nIHRoZSBtZW51XHJcblx0c2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0XHJcblx0Ly8gU2V0IHRoZSBidXR0b24gdG8gbm90IGRpc2FibGVkIGluIGNhc2UgY29taW5nIGJhY2sgdG8gdGhpcyBtZW51XHJcblx0bG9hZEJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdGxvYWRJbnB1dC5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdGRlbW9CdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRtZW51QnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHJcbn1cclxuXHJcbnAuZGVtbyA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGEnXSAmJiAhY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBzdGFydCBhIG5ldyBjYXNlPyBZb3VyIGF1dG9zYXZlIGRhdGEgd2lsbCBiZSBsb3N0IVwiKSlcclxuXHRcdHJldHVybjtcclxuXHRcdFxyXG5cdC8vIFNldCB0aGUgYnV0dG9uIHRvIGRpc2FibGVkIHNvIHRoYXQgaXQgY2FuJ3QgYmUgcHJlc3NlZCB3aGlsZSBsb2FkaW5nXHJcblx0bG9hZEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0bG9hZElucHV0LmRpc2FibGVkID0gdHJ1ZTtcclxuXHRkZW1vQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRjb250aW51ZUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0bWVudUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHJcblx0dmFyIHBhZ2UgPSB0aGlzO1xyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHQgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHRcdCAgXHRcclxuXHRcdCBcdC8vIHNpbmNlIHRoZSB1c2VyIGlzIGxvYWRpbmcgYSBmcmVzaCBmaWxlLCBjbGVhciB0aGUgYXV0b3NhdmUgKHNvb24gd2Ugd29uJ3QgdXNlIHRoaXMgYXQgYWxsKVxyXG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImF1dG9zYXZlXCIsXCJcIik7XHJcblx0XHRcdGxvY2FsU3RvcmFnZVsnY2FzZU5hbWUnXSA9IFwiZGVtby5pcGFyXCI7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBDcmVhdGUgYSB3b3JrZXIgZm9yIHVuemlwcGluZyB0aGUgZmlsZVxyXG5cdFx0XHR2YXIgemlwV29ya2VyID0gbmV3IFdvcmtlcihcIi4uL2xpYi91bnppcC5qc1wiKTtcclxuXHRcdFx0emlwV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHQvLyBTYXZlIHRoZSBiYXNlIHVybCB0byBsb2NhbCBzdG9yYWdlXHJcblx0XHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YSddID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZS5kYXRhKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHQvLyBjYWxsIHRoZSBjYWxsYmFja1xyXG5cdFx0XHRcdHBhZ2UubmV4dCA9IE5FWFQuQk9BUkQ7XHJcblx0XHRcdFx0Y29uc29sZS5sb2cobWVzc2FnZS5kYXRhKTtcclxuXHRcdFx0XHRwYWdlLmNsb3NlKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdC8vIFN0YXJ0IHRoZSB3b3JrZXJcclxuXHRcdFx0emlwV29ya2VyLnBvc3RNZXNzYWdlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG5cdCAgfVxyXG5cdH07XHJcblx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIFwiZGVtby5pcGFyXCIsIHRydWUpO1xyXG5cdHJlcXVlc3Quc2VuZCgpO1xyXG5cdFxyXG59XHJcblxyXG5wLmxvYWRGaWxlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFxyXG5cdGlmKGxvY2FsU3RvcmFnZVsnY2FzZURhdGEnXSAmJiAhY29uZmlybShcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBzdGFydCBhIG5ldyBjYXNlPyBZb3VyIGF1dG9zYXZlIGRhdGEgd2lsbCBiZSBsb3N0IVwiKSlcclxuXHRcdHJldHVybjtcclxuXHRcclxuXHQvLyBNYWtlIHN1cmUgYSBpcGFyIGZpbGUgd2FzIGNob29zZW5cclxuXHRpZighbG9hZElucHV0LnZhbHVlLmVuZHNXaXRoKFwiaXBhclwiKSl7XHJcblx0XHRhbGVydChcIllvdSBkaWRuJ3QgY2hvb3NlIGFuIGlwYXIgZmlsZSEgeW91IGNhbiBvbmx5IGxvYWQgaXBhciBmaWxlcyFcIik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGxvY2FsU3RvcmFnZVsnY2FzZU5hbWUnXSA9IGV2ZW50LnRhcmdldC5maWxlc1swXS5uYW1lO1xyXG5cclxuXHQvLyBTZXQgdGhlIGJ1dHRvbiB0byBkaXNhYmxlZCBzbyB0aGF0IGl0IGNhbid0IGJlIHByZXNzZWQgd2hpbGUgbG9hZGluZ1xyXG5cdGxvYWRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdGxvYWRJbnB1dC5kaXNhYmxlZCA9IHRydWU7XHJcblx0ZGVtb0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0Y29udGludWVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdG1lbnVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFxyXG5cdC8vIENyZWF0ZSBhIHJlYWRlciBhbmQgcmVhZCB0aGUgemlwXHJcblx0dmFyIHBhZ2UgPSB0aGlzO1xyXG5cdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldmVudCl7XHJcblx0XHJcblx0XHQvLyBzaW5jZSB0aGUgdXNlciBpcyBsb2FkaW5nIGEgZnJlc2ggZmlsZSwgY2xlYXIgdGhlIGF1dG9zYXZlIChzb29uIHdlIHdvbid0IHVzZSB0aGlzIGF0IGFsbClcclxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiYXV0b3NhdmVcIixcIlwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gQ3JlYXRlIGEgd29ya2VyIGZvciB1bnppcHBpbmcgdGhlIGZpbGVcclxuXHRcdHZhciB6aXBXb3JrZXIgPSBuZXcgV29ya2VyKFwiLi4vbGliL3VuemlwLmpzXCIpO1xyXG5cdFx0emlwV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuXHRcdFx0XHJcblx0XHRcdC8vIFNhdmUgdGhlIGJhc2UgdXJsIHRvIGxvY2FsIHN0b3JhZ2VcclxuXHRcdFx0bG9jYWxTdG9yYWdlWydjYXNlRGF0YSddID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZS5kYXRhKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIFJlZGlyZWN0IHRvIHRoZSBuZXh0IHBhZ2VcclxuXHRcdFx0cGFnZS5uZXh0ID0gTkVYVC5DQVNFO1xyXG5cdFx0XHRwYWdlLmNsb3NlKCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBTdGFydCB0aGUgd29ya2VyXHJcblx0XHR6aXBXb3JrZXIucG9zdE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XHJcblx0XHRcclxuXHR9O1xyXG5cdHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihldmVudC50YXJnZXQuZmlsZXNbMF0pO1xyXG5cdFxyXG59XHJcblxyXG5wLmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRzZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0aWYodGhpcy5vbmNsb3NlKVxyXG5cdFx0dGhpcy5vbmNsb3NlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGl0bGVNZW51O1xyXG5tb2R1bGUuZXhwb3J0cy5ORVhUID0gTkVYVDsiXX0=

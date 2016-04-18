(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
//imports
var Game = require('./modules/game.js');
var Point = require('./modules/point.js');
var MouseState = require('./modules/mouseState.js');

//game objects
var game;
var canvas;
var ctx;

// window div and if paused
var windowDiv;
var windowFilm;
var pausedTime = 0;

//responsiveness
var center;

//mouse handling
var mousePosition;
var relativeMousePosition;
var mouseDown;
var mouseIn;
var mouseDownTimer;
var mouseClicked;
var maxClickDuration; // milliseconds

//persistent utilities
var prevTime; // date in milliseconds
var dt; // delta time in milliseconds

//fires when the window loads
window.onload = function(e){
    initializeVariables();
    loop();
}

//initialization, mouse events, and game instantiation
function initializeVariables(){
	windowDiv = document.getElementById('window');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    console.log("Canvas Dimensions: " + canvas.width + ", " + canvas.height);
    
	windowFilm = document.getElementById('windowFlim');
	windowFilm.onclick = function() { windowDiv.innerHTML = ''; };
    
    mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    
    //event listeners for mouse interactions with the canvas
    canvas.addEventListener("mousemove", function(e){
        var boundRect = canvas.getBoundingClientRect();
        mousePosition = new Point(e.clientX - boundRect.left, e.clientY - boundRect.top);
        relativeMousePosition = new Point(mousePosition.x - (canvas.offsetWidth/2.0), mousePosition.y - (canvas.offsetHeight/2.0));        
    });
    mouseDown = false;
    canvas.addEventListener("mousedown", function(e){
        mouseDown = true;
    });
    canvas.addEventListener("mouseup", function(e){
        mouseDown = false;
    });
    mouseIn = false;
    mouseDownTimer = 0;
    mouseClicked = false;
    maxClickDuration = 200;
    canvas.addEventListener("mouseover", function(e){
        mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
        mouseIn = false;
        mouseDown = false;
    });
    
    prevTime = Date.now();
    dt = 0;
    
    game = new Game(localStorage['caseFiles'], windowDiv);
}

//fires once per frame
function loop(){
	// loop
    window.requestAnimationFrame(loop.bind(this));
    
    // update delta time
    dt = Date.now() - prevTime;
    prevTime = Date.now();
    
    // check mouse click
    mouseClicked = false;
    if (mouseDown) { mouseDownTimer += dt; }
    else { if (mouseDownTimer > 0 && mouseDownTimer < maxClickDuration) { mouseClicked = true; } mouseDownTimer = 0; }
    
    // update game
    game.update(ctx, canvas, dt, new MouseState(mousePosition, relativeMousePosition, mouseDown, mouseIn, mouseClicked));
    
    // Check if should pause
    if(game.active && windowDiv.innerHTML!='' && pausedTime++>3){
    	game.active = false;
    	windowFilm.style.display = 'block';
    }
    else if(pausedTime!=0 && windowDiv.innerHTML==''){
    	pausedTime = 0;
    	game.active = true;
    	windowFilm.style.display = 'none';
    }
}

//listens for changes in size of window and adjusts variables accordingly
window.addEventListener("resize", function(e){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    center = new Point(canvas.width / 2, canvas.height / 2);
    
    console.log("Canvas Dimensions: " + canvas.width + ", " + canvas.height);
});




},{"./modules/game.js":8,"./modules/mouseState.js":11,"./modules/point.js":13}],2:[function(require,module,exports){
"use strict";
var Utilities = require('./utilities.js');
var Point = require('./point.js');
var Question = require("./question.js");

//parameter is a point that denotes starting position
function board(startPosition, lessonNodes){
    this.position = startPosition;
    this.lessonNodeArray = lessonNodes;
    this.boardOffset = {x:0,y:0};
    this.prevBoardOffset = {x:0,y:0};
}

board.drawLib = undefined;

//prototype
var p = board.prototype;

p.move = function(pX, pY){
    this.position.x += pX;
    this.position.y += pY;
    this.boardOffset = {x:0,y:0};
    this.prevBoardOffset = {x:0,y:0};
};

p.act = function(pMouseState) {
	
	// for each  node
    for(var i=0; i<this.lessonNodeArray.length; i++){
    	var activeNode = this.lessonNodeArray[i]; 
		// handle solved question
		if (activeNode.currentState != Question.SOLVE_STATE.SOLVED && activeNode.question.currentState == Question.SOLVE_STATE.SOLVED) {
			
			// update each connection's connection number
			for (var j = 0; j < activeNode.question.connections.length; j++)
				this.lessonNodeArray[activeNode.question.connections[j] - 1].connections++;
			
			// Update the node's state
			activeNode.currentState = activeNode.question.currentState;
			
		}
	}
    
    // hover states
	//for(var i = 0; i < boardArray.length; i++){
		// loop through lesson nodes to check for hover
		// update board
		
	var nodeChosen = false;
	for (var i=this.lessonNodeArray.length-1; i>=0; i--) {
		if (this.lessonNodeArray[i].dragging) {
			//nodeChosen = true;
			pMouseState.hasTarget = true;
		}
	}
	
	
	for (var i=this.lessonNodeArray.length-1; i>=0; i--) {
		var lNode = this.lessonNodeArray[i];
		
		if (!pMouseState.mouseDown) {
			lNode.dragPosition = undefined; // clear drag behavior
			lNode.dragging = false;
		} 
		
		lNode.mouseOver = false;
		
		// if there is already a selected node, do not try to select another
		if (nodeChosen) {  continue; }
		
		//console.log("node update");
		// if hovering, show hover glow
		/*if (pMouseState.relativePosition.x > lNode.position.x-lNode.width/2 
		&& pMouseState.relativePosition.x < lNode.position.x+lNode.width/2
		&& pMouseState.relativePosition.y > lNode.position.y-lNode.height/2
		&& pMouseState.relativePosition.y < lNode.position.y+lNode.height/2) {*/
		
		
		if (Utilities.mouseIntersect(pMouseState,lNode,this.boardOffset,1)) {
			lNode.mouseOver = true;
			nodeChosen = true;
			pMouseState.hasTarget = true;
			//console.log(pMouseState.hasTarget);
			
			if (pMouseState.mouseDown && !this.prevMouseState.mouseDown) {
				// drag
				lNode.dragging = true;
				lNode.dragPosition = new Point(
				pMouseState.relativePosition.x - lNode.position.x,
				pMouseState.relativePosition.y - lNode.position.y
				);
			}
			if (pMouseState.mouseClicked) {
				// handle click code
				lNode.click(pMouseState);
			}
		}
		// if the user is dragging a node, allow the mouse to control its movement
		if (lNode.dragging) {
			lNode.position.x = pMouseState.relativePosition.x - lNode.dragPosition.x;
			lNode.position.y = pMouseState.relativePosition.y - lNode.dragPosition.y;
		}
	}
	
	// drag the board around
	if (!pMouseState.hasTarget) {
		if (pMouseState.mouseDown) {
			canvas.style.cursor = '-webkit-grabbing';
			canvas.style.cursor = '-moz-grabbing';
			canvas.style.cursor = 'grabbing';
			if (!this.mouseStartDragBoard) {
				this.mouseStartDragBoard = pMouseState.relativePosition;
				this.prevBoardOffset.x = this.boardOffset.x;
				this.prevBoardOffset.y = this.boardOffset.y;
			}
			else {
				this.boardOffset.x = this.prevBoardOffset.x - (pMouseState.relativePosition.x - this.mouseStartDragBoard.x);
				if (this.boardOffset.x > this.maxBoardWidth/2) this.boardOffset.x = this.maxBoardWidth/2;
				if (this.boardOffset.x < -1*this.maxBoardWidth/2) this.boardOffset.x = -1*this.maxBoardWidth/2;
				this.boardOffset.y = this.prevBoardOffset.y - (pMouseState.relativePosition.y - this.mouseStartDragBoard.y);
				if (this.boardOffset.y > this.maxBoardHeight/2) this.boardOffset.y = this.maxBoardHeight/2;
				if (this.boardOffset.y < -1*this.maxBoardHeight/2) this.boardOffset.y = -1*this.maxBoardHeight/2;
			}
		} else {
			this.mouseStartDragBoard = undefined;
			canvas.style.cursor = '';
		}
    }
    
	this.prevMouseState = pMouseState;
}

p.draw = function(ctx, canvas, center){
    ctx.save();

    this.position = this.boardOffset;
    //translate to the center of the screen
    ctx.translate(center.x - this.position.x, center.y - this.position.y);
    //ctx.translate(this.boardOffset.x,this.boardOffset.y);
	
	// draw the nodes
    for(var i = 0; i < this.lessonNodeArray.length; i++){
    
    	// temporarily hide all but the first question
		if (this.lessonNodeArray[i].question.revealThreshold > this.lessonNodeArray[i].linksAwayFromOrigin) continue;
    	
    	// draw the node itself
        this.lessonNodeArray[i].draw(ctx, canvas);
    }

	// draw the lines
	for(var i=0; i<this.lessonNodeArray.length; i++){
		
		// only show lines from solved questions
		if (this.lessonNodeArray[i].question.currentState!=Question.SOLVE_STATE.SOLVED) continue;
		
		// get the pin poistion in the corner with margin 5,5
        var pinX = this.lessonNodeArray[i].position.x - this.lessonNodeArray[i].width*this.lessonNodeArray[i].scaleFactor/2 + 15;
        var pinY = this.lessonNodeArray[i].position.y - this.lessonNodeArray[i].height*this.lessonNodeArray[i].scaleFactor/2 + 15;
		
		// set line style
		ctx.strokeStyle = "rgba(0,0,105,0.2)";
		ctx.lineWidth = 1;
        
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	
			if (this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1].question.currentState==Question.SOLVE_STATE.HIDDEN) continue;
        	
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var connection = this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1];
        	var cPos = connection.position;
        	var cWidth = connection.width;
        	var cHeight = connection.height;
        	var cScale = connection.scaleFactor;
        	
        	// draw the line
        	ctx.beginPath();
        	// translate to start (pin)
        	ctx.moveTo(pinX,pinY);
        	ctx.lineTo(cPos.x - cWidth*cScale/2 + 15, cPos.y - cHeight*cScale/2 + 15);
        	ctx.closePath();
        	ctx.stroke();
        }
    }
    
    ctx.restore();
};

module.exports = board;

//this is an object named Board and this is its javascript
//var Board = require('./objects/board.js');
//var b = new Board();
    
},{"./point.js":13,"./question.js":14,"./utilities.js":16}],3:[function(require,module,exports){
"use strict";

//parameter is a point that denotes starting position
function button(startPosition, width, height){
    this.position = position;
    this.width = width;
    this.height = height;
    this.clicked = false;
    this.hovered = false;
}
button.drawLib = undefined;

var p = button.prototype;

p.draw = function(ctx){
    ctx.save();
    var col;
    if(this.hovered){
        col = "dodgerblue";
    }
    else{
        col = "lightblue";
    }
    //draw rounded container
    boardButton.drawLib.rect(ctx, this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, col);

    ctx.restore();
};

module.exports = button;
},{}],4:[function(require,module,exports){
"use strict";
var Question = require("./question.js");

// Creates a category with the given name and from the given xml
function Category(name, xml, resources, url, windowDiv){
	
	// Save the name
	this.name = name;
	
	// Load all the questions
	var questionElements = xml.getElementsByTagName("button");
	this.questions = [];
	// create questions
	for (var i=0; i<questionElements.length; i++) 
	{
		// create a question object
		this.questions[i] = new Question(questionElements[i], resources, url, windowDiv);
	}
    
}

module.exports = Category;
},{"./question.js":14}],5:[function(require,module,exports){
"use strict";

//Module export
var m = module.exports;

// The size of the board in game units at 100% zoom
m.boardSize = {x:1920, y:1080};

// The scale of the board to game view at 100% zoom
m.boardScale = 2;
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
"use strict";
var Board = require('./board.js');
var Point = require('./point.js');
var DrawLib = require('./drawLib.js');
var LessonNode = require('./lessonNode.js');
var Utility = require('./utilities.js');
var DataParser = require('./iparDataParser.js');

//mouse management
var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

//phase handling
var phaseObject;


function game(url, windowDiv){
	var game = this;
	this.active = false;
	DataParser.parseData(url, windowDiv, function(categories){
		game.categories = categories;
		game.createLessonNodes();
	});
}

var p = game.prototype;

p.createLessonNodes = function(){
	this.boardArray = [];
	var bottomBar = document.getElementById("bottomBar");
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
		this.boardArray.push(new Board(new Point(0,0), this.lessonNodes));
		var button = document.createElement("BUTTON");
		button.innerHTML = this.categories[i].name;
		var game = this;
		button.onclick = (function(i){ 
			return function() {
				if(game.active)
					game.activeBoardIndex = i;
		}})(i);
		bottomBar.appendChild(button);
	}
	this.activeBoardIndex = 0;
	this.active = true;
}

p.update = function(ctx, canvas, dt, pMouseState){
	
	if(this.active){
	    // mouse
	    previousMouseState = mouseState;
	    mouseState = pMouseState;
	    mouseTarget = 0;
	    if(typeof previousMouseState === 'undefined'){
	        previousMouseState = mouseState;
	    }
	    //draw stuff
	    this.draw(ctx, canvas);
	    
	    // Update the current board
	    this.boardArray[this.activeBoardIndex].act(pMouseState);
	}
}

p.draw = function(ctx, canvas){
	//draw debug background
    ctx.save();
    DrawLib.clear(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    DrawLib.rect(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight, "white", false);
    DrawLib.line(ctx, canvas.offsetWidth/2, 0, canvas.offsetWidth/2, canvas.offsetHeight, 2, "lightgray");
    DrawLib.line(ctx, 0, canvas.offsetHeight/2, canvas.offsetWidth, canvas.offsetHeight/2, 2, "lightGray");
    ctx.restore();
	
    // Draw the current board
    this.boardArray[this.activeBoardIndex].draw(ctx, canvas, {x:canvas.offsetWidth/2, y:canvas.offsetHeight/2});
    
}

module.exports = game;
},{"./board.js":2,"./drawLib.js":6,"./iparDataParser.js":9,"./lessonNode.js":10,"./point.js":13,"./utilities.js":16}],9:[function(require,module,exports){
"use strict";
var Category = require("./category.js");
var Resource = require("./resources.js");
var Utilities = require('./utilities.js');
window.resolveLocalFileSystemURL  = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

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

// Module export
var m = module.exports;

// constructor
m.parseData = function(url, windowDiv, callback) {
    
    this.categories = [];
    this.questions = [];
    
	// get XML
    window.resolveLocalFileSystemURL(url+'active/caseFile.ipardata', function(fileEntry) {
		fileEntry.file(function(file) {
			var reader = new FileReader();
			reader.onloadend = function() {

				// Get the raw data
				var rawData = Utilities.getXml(this.result);
				var categories = getCategoriesAndQuestions(rawData, url, windowDiv);
				callback(categories);
			   
			};
			reader.readAsText(file);
		   
		}, function(e){
			console.log("Error: "+e.message);
		});
	});
}

// takes the xml structure and fills in the data for the question object
function getCategoriesAndQuestions(rawData, url, windowDiv) {
	// if there is a case file
	if (rawData != null) {
		
		// First load the resources
		var resourceElements = rawData.getElementsByTagName("resourceList")[0].getElementsByTagName("resource");
		var resources = [];
		for (var i=0; i<resourceElements.length; i++) {
			// Load each resource
			resources[i] = new Resource(resourceElements[i], url);
		}
		
		// Then load the categories
		var categoryElements = rawData.getElementsByTagName("category");
		var categoryNames = rawData.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
		var categories = [];
		for (var i=0; i<categoryElements.length; i++) {
			// Load each category (which loads each question)
			categories[i] = new Category(categoryNames[i].innerHTML, categoryElements[i], resources, url, windowDiv);
		}
		return categories;
	}
	return null
}
},{"./category.js":4,"./resources.js":15,"./utilities.js":16}],10:[function(require,module,exports){
"use strict";
var DrawLib = require('./drawLib.js');
var Question = require("./question.js");

//parameter is a point that denotes starting position
function lessonNode(startPosition, imagePath, pQuestion){
    
    this.position = startPosition;
    this.dragLocation = undefined;
    this.mouseOver = false;
    this.dragging = false;
    this.scaleFactor = 1;
    this.type = "lessonNode";
    this.image = new Image();
    this.width;
    this.height;
    this.question = pQuestion;
    this.connections = 0;
    this.currentState = this.question.currentState;
    
    var that = this;
    //image loading and resizing
    this.image.onload = function() {
        that.width = that.image.naturalWidth;
        that.height = that.image.naturalHeight;
        var maxDimension = 100;
        //too small?
        if(that.width < maxDimension && that.height < maxDimension){
            var x;
            if(that.width > that.height){
                x = maxDimension / that.width;
            }
            else{
                x = maxDimension / that.height;
            }
            that.width = that.width * x;
            that.height = that.height * x;
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
    };
    
    this.image.src = imagePath;
}

var p = lessonNode.prototype;

p.draw = function(ctx, canvas){

	// Check if question is visible
	if(this.question.currentState==Question.SOLVE_STATE.HIDDEN){
		if(this.question.revealThreshold <= this.connections)
			this.question.currentState = Question.SOLVE_STATE.UNSOLVED;
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
    ctx.drawImage(this.image, this.position.x - (this.width*this.scaleFactor)/2, this.position.y - (this.height*this.scaleFactor)/2, this.width * this.scaleFactor, this.height * this.scaleFactor);
    
    //drawing the pin
    switch (this.question.currentState) {
    	case 1:
    		ctx.fillStyle = "blue";
			ctx.strokeStyle = "cyan";
			break;
     	case 2:
    		ctx.fillStyle = "green";
			ctx.strokeStyle = "yellow";
			break;
    }
	ctx.lineWidth = 2;

	ctx.beginPath();
	ctx.arc(this.position.x - (this.width*this.scaleFactor)/2 + 15,this.position.y - (this.height*this.scaleFactor)/2 + 15,6,0,2*Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    
    ctx.restore();
};

p.click = function(mouseState){
    this.question.displayWindows();
}

module.exports = lessonNode;
},{"./drawLib.js":6,"./question.js":14}],11:[function(require,module,exports){
"use strict";
function mouseState(pPosition, pRelativePosition, pMousedown, pMouseIn, pMouseClicked){
    this.position = pPosition;
    this.relativePosition = pRelativePosition;
    this.mouseDown = pMousedown;
    this.mouseIn = pMouseIn;
    this.prevMouseDown = pMousedown;
    this.mouseClicked = pMouseClicked;
    this.hasTarget = false;
}

var p = mouseState.prototype;

module.exports = mouseState;
},{}],12:[function(require,module,exports){
"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');
var IparDataParser = require('../iparDataParser.js');
var Question = require('../question.js');
var Point = require('../point.js');
var Utilities = require('../utilities.js');

var boardArray;
var maxBoardWidth = 1000;
var maxBoardHeight = 800;
var currentBoard;
var questions;
var activeBoardIndex;
//has everything loaded?
var loadingComplete;
// save the last state of the mouse for checking clicks
var prevMouseState;

var utilities;

// drag the board
var mouseStartDragBoard = undefined;
var boardOffset = {x:0,y:0};
var prevBoardOffset = {x:0,y:0};

function boardPhase(pUrl){
    loadingComplete = false;
    processData(pUrl);
    utilities = new Utilities();
}	


function processData(pUrl){
	// initialize
    boardArray = [];
    // create the parser
    var extractedData = new IparDataParser("./data/mydata.xml", dataLoaded);
}

function dataLoaded(categoryData) {
	//questions = iparParser.getQuestionsArray();
    //createLessonNodesFromQuestions(questions);
    createLessonNodesInBoards(categoryData);
    loadingComplete = true;
}

function createLessonNodesInBoards(categories) {
	categories.forEach(function(cat) {
		// initialize empty
		var lessonNodes = [];
		// add a node per question
		for (var i = 0; i < cat.questions.length; i++) {
			// create a new lesson node
			lessonNodes.push(new LessonNode(new Point(cat.questions[i].positionPercentX, cat.questions[i].positionPercentY), cat.questions[i].imageLink, cat.questions[i] ) );
			// attach question object to lesson node
			lessonNodes[lessonNodes.length-1].question = cat.questions[i];
			//console.log("image: "+lessonNodes[lessonNodes.length-1].image.getAttribute("src"));
		
		}
		// create a board
		boardArray.push(new Board(new Point(0,0), lessonNodes));
		//console.log(boardArray[boardArray.length-1].lessonNodeArray[0].question);
	});
	activeBoardIndex = 3; // start with the first board (actually its the second now so I can debug)
}


var p = boardPhase.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState, boardOffset) {
    p.act(pMouseState);
    p.draw(ctx, canvas, center, activeHeight);
    if (activeBoardIndex) boardArray[activeBoardIndex].update();
}

p.act = function(pMouseState){
	// hover states
	//for(var i = 0; i < boardArray.length; i++){
		// loop through lesson nodes to check for hover
	if (activeBoardIndex != undefined) {
		// update board
		
		var nodeChosen = false;
		for (var i=boardArray[activeBoardIndex].lessonNodeArray.length-1; i>=0; i--) {
			if (boardArray[activeBoardIndex].lessonNodeArray[i].dragging) {
				//nodeChosen = true;
				pMouseState.hasTarget = true;
				
			}
		}
		
		
		for (var i=boardArray[activeBoardIndex].lessonNodeArray.length-1; i>=0; i--) {
			var lNode = boardArray[activeBoardIndex].lessonNodeArray[i];
			
			if (!pMouseState.mouseDown) {
				lNode.dragPosition = undefined; // clear drag behavior
				lNode.dragging = false;
			} 
			
			lNode.mouseOver = false;
			
			// if there is already a selected node, do not try to select another
			if (nodeChosen) {  continue; }
			
			//console.log("node update");
			// if hovering, show hover glow
			/*if (pMouseState.relativePosition.x > lNode.position.x-lNode.width/2 
			&& pMouseState.relativePosition.x < lNode.position.x+lNode.width/2
			&& pMouseState.relativePosition.y > lNode.position.y-lNode.height/2
			&& pMouseState.relativePosition.y < lNode.position.y+lNode.height/2) {*/
			
			
			if (utilities.mouseIntersect(pMouseState,lNode,boardOffset,1)) {
				lNode.mouseOver = true;
				nodeChosen = true;
				pMouseState.hasTarget = true;
				//console.log(pMouseState.hasTarget);
				
				if (pMouseState.mouseDown && !prevMouseState.mouseDown) {
					// drag
					lNode.dragging = true;
					lNode.dragPosition = new Point(
					pMouseState.relativePosition.x - lNode.position.x,
					pMouseState.relativePosition.y - lNode.position.y
					);
				}
				if (pMouseState.mouseClicked) {
					// handle click code
					lNode.click(pMouseState);
				}
			}
			// if the user is dragging a node, allow the mouse to control its movement
			if (lNode.dragging) {
				lNode.position.x = pMouseState.relativePosition.x - lNode.dragPosition.x;
				lNode.position.y = pMouseState.relativePosition.y - lNode.dragPosition.y;
			}
		}
	}
	
	// drag the board around
	if (!pMouseState.hasTarget) {
		if (pMouseState.mouseDown) {
			if (!mouseStartDragBoard) {
				mouseStartDragBoard = pMouseState.relativePosition;
				prevBoardOffset.x = boardOffset.x;
				prevBoardOffset.y = boardOffset.y;
			}
			else {
				boardOffset.x = prevBoardOffset.x - (pMouseState.relativePosition.x - mouseStartDragBoard.x);
				if (boardOffset.x > maxBoardWidth/2) boardOffset.x = maxBoardWidth/2;
				if (boardOffset.x < -1*maxBoardWidth/2) boardOffset.x = -1*maxBoardWidth/2;
				boardOffset.y = prevBoardOffset.y - (pMouseState.relativePosition.y - mouseStartDragBoard.y);
				if (boardOffset.y > maxBoardHeight/2) boardOffset.y = maxBoardHeight/2;
				if (boardOffset.y < -1*maxBoardHeight/2) boardOffset.y = -1*maxBoardHeight/2;
				console.log(boardOffset);
			}
		} else {
			mouseStartDragBoard = undefined;
		}
    }
    
	prevMouseState = pMouseState;
}

p.draw = function(ctx, canvas, center, activeHeight){
	// current board = 0;
	//console.log("draw currentBoard " + currentBoard);
	if (activeBoardIndex != undefined) boardArray[activeBoardIndex].draw(ctx, center, activeHeight, boardOffset);
}


module.exports = boardPhase;
},{"../board.js":2,"../iparDataParser.js":9,"../lessonNode.js":10,"../point.js":13,"../question.js":14,"../utilities.js":16}],13:[function(require,module,exports){
"use strict";
function point(pX, pY){
    this.x = pX;
    this.y = pY;
}

var p = point.prototype;

module.exports = point;
},{}],14:[function(require,module,exports){
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
},{"./constants.js":5,"./utilities.js":16}],15:[function(require,module,exports){
"use strict";
var Question = require("./question.js");

// Creates a category with the given name and from the given xml
function Resource(xml, url){
	
	// First get the icon
	  var type = parseInt(xml.getAttribute("type"));
	  switch(type){
	    case 0:
	      this.icon = '../img/iconResourceFile.png';
	      break;
	    case 1:
	      this.icon = '../img/iconResourceLink.png';
	      break;
	    default:
	      this.icon = '';
	      break;
	  }

	  // Next get the title
	  this.title = xml.getAttribute("text");

	  // Last get the link
	  if(type==1)
	    this.link = xml.getAttribute("link");
	  else
	    this.link = url+'assets/files/'+xml.getAttribute("link").replace(/ /g, '%20');
    
}

module.exports = Resource;
},{"./question.js":14}],16:[function(require,module,exports){
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
m.mouseIntersect = function(pMouseState, pElement, pOffsetter, pScale){
    if(pMouseState.relativePosition.x + pOffsetter.x > (pElement.position.x - (pScale*pElement.width)/2) && pMouseState.relativePosition.x + pOffsetter.x < (pElement.position.x + (pScale*pElement.width)/2)){
        if(pMouseState.relativePosition.y + pOffsetter.y > (pElement.position.y - (pScale*pElement.height)/2) && pMouseState.relativePosition.y + pOffsetter.y < (pElement.position.y + (pScale*pElement.height)/2)){
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
},{"./point.js":13}]},{},[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib2FyZC9qcy9tYWluLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9ib2FyZC5qcyIsImJvYXJkL2pzL21vZHVsZXMvYnV0dG9uLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9jYXRlZ29yeS5qcyIsImJvYXJkL2pzL21vZHVsZXMvY29uc3RhbnRzLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9kcmF3TGliLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9nYW1lLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9pcGFyRGF0YVBhcnNlci5qcyIsImJvYXJkL2pzL21vZHVsZXMvbGVzc29uTm9kZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvbW91c2VTdGF0ZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvcGhhc2VzL2JvYXJkUGhhc2UuanMiLCJib2FyZC9qcy9tb2R1bGVzL3BvaW50LmpzIiwiYm9hcmQvanMvbW9kdWxlcy9xdWVzdGlvbi5qcyIsImJvYXJkL2pzL21vZHVsZXMvcmVzb3VyY2VzLmpzIiwiYm9hcmQvanMvbW9kdWxlcy91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuLy9pbXBvcnRzXHJcbnZhciBHYW1lID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dhbWUuanMnKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL3BvaW50LmpzJyk7XHJcbnZhciBNb3VzZVN0YXRlID0gcmVxdWlyZSgnLi9tb2R1bGVzL21vdXNlU3RhdGUuanMnKTtcclxuXHJcbi8vZ2FtZSBvYmplY3RzXHJcbnZhciBnYW1lO1xyXG52YXIgY2FudmFzO1xyXG52YXIgY3R4O1xyXG5cclxuLy8gd2luZG93IGRpdiBhbmQgaWYgcGF1c2VkXHJcbnZhciB3aW5kb3dEaXY7XHJcbnZhciB3aW5kb3dGaWxtO1xyXG52YXIgcGF1c2VkVGltZSA9IDA7XHJcblxyXG4vL3Jlc3BvbnNpdmVuZXNzXHJcbnZhciBjZW50ZXI7XHJcblxyXG4vL21vdXNlIGhhbmRsaW5nXHJcbnZhciBtb3VzZVBvc2l0aW9uO1xyXG52YXIgcmVsYXRpdmVNb3VzZVBvc2l0aW9uO1xyXG52YXIgbW91c2VEb3duO1xyXG52YXIgbW91c2VJbjtcclxudmFyIG1vdXNlRG93blRpbWVyO1xyXG52YXIgbW91c2VDbGlja2VkO1xyXG52YXIgbWF4Q2xpY2tEdXJhdGlvbjsgLy8gbWlsbGlzZWNvbmRzXHJcblxyXG4vL3BlcnNpc3RlbnQgdXRpbGl0aWVzXHJcbnZhciBwcmV2VGltZTsgLy8gZGF0ZSBpbiBtaWxsaXNlY29uZHNcclxudmFyIGR0OyAvLyBkZWx0YSB0aW1lIGluIG1pbGxpc2Vjb25kc1xyXG5cclxuLy9maXJlcyB3aGVuIHRoZSB3aW5kb3cgbG9hZHNcclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgaW5pdGlhbGl6ZVZhcmlhYmxlcygpO1xyXG4gICAgbG9vcCgpO1xyXG59XHJcblxyXG4vL2luaXRpYWxpemF0aW9uLCBtb3VzZSBldmVudHMsIGFuZCBnYW1lIGluc3RhbnRpYXRpb25cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVZhcmlhYmxlcygpe1xyXG5cdHdpbmRvd0RpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3aW5kb3cnKTtcclxuICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcclxuICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgY2FudmFzLndpZHRoID0gY2FudmFzLm9mZnNldFdpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy5vZmZzZXRIZWlnaHQ7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBEaW1lbnNpb25zOiBcIiArIGNhbnZhcy53aWR0aCArIFwiLCBcIiArIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgXHJcblx0d2luZG93RmlsbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3aW5kb3dGbGltJyk7XHJcblx0d2luZG93RmlsbS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJzsgfTtcclxuICAgIFxyXG4gICAgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLDApO1xyXG4gICAgcmVsYXRpdmVNb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICBcclxuICAgIC8vZXZlbnQgbGlzdGVuZXJzIGZvciBtb3VzZSBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgY2FudmFzXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICB2YXIgYm91bmRSZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIG1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoZS5jbGllbnRYIC0gYm91bmRSZWN0LmxlZnQsIGUuY2xpZW50WSAtIGJvdW5kUmVjdC50b3ApO1xyXG4gICAgICAgIHJlbGF0aXZlTW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChtb3VzZVBvc2l0aW9uLnggLSAoY2FudmFzLm9mZnNldFdpZHRoLzIuMCksIG1vdXNlUG9zaXRpb24ueSAtIChjYW52YXMub2Zmc2V0SGVpZ2h0LzIuMCkpOyAgICAgICAgXHJcbiAgICB9KTtcclxuICAgIG1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgbW91c2VEb3duID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIG1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBtb3VzZUluID0gZmFsc2U7XHJcbiAgICBtb3VzZURvd25UaW1lciA9IDA7XHJcbiAgICBtb3VzZUNsaWNrZWQgPSBmYWxzZTtcclxuICAgIG1heENsaWNrRHVyYXRpb24gPSAyMDA7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBtb3VzZUluID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBtb3VzZUluID0gZmFsc2U7XHJcbiAgICAgICAgbW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcHJldlRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgZHQgPSAwO1xyXG4gICAgXHJcbiAgICBnYW1lID0gbmV3IEdhbWUobG9jYWxTdG9yYWdlWydjYXNlRmlsZXMnXSwgd2luZG93RGl2KTtcclxufVxyXG5cclxuLy9maXJlcyBvbmNlIHBlciBmcmFtZVxyXG5mdW5jdGlvbiBsb29wKCl7XHJcblx0Ly8gbG9vcFxyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wLmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyB1cGRhdGUgZGVsdGEgdGltZVxyXG4gICAgZHQgPSBEYXRlLm5vdygpIC0gcHJldlRpbWU7XHJcbiAgICBwcmV2VGltZSA9IERhdGUubm93KCk7XHJcbiAgICBcclxuICAgIC8vIGNoZWNrIG1vdXNlIGNsaWNrXHJcbiAgICBtb3VzZUNsaWNrZWQgPSBmYWxzZTtcclxuICAgIGlmIChtb3VzZURvd24pIHsgbW91c2VEb3duVGltZXIgKz0gZHQ7IH1cclxuICAgIGVsc2UgeyBpZiAobW91c2VEb3duVGltZXIgPiAwICYmIG1vdXNlRG93blRpbWVyIDwgbWF4Q2xpY2tEdXJhdGlvbikgeyBtb3VzZUNsaWNrZWQgPSB0cnVlOyB9IG1vdXNlRG93blRpbWVyID0gMDsgfVxyXG4gICAgXHJcbiAgICAvLyB1cGRhdGUgZ2FtZVxyXG4gICAgZ2FtZS51cGRhdGUoY3R4LCBjYW52YXMsIGR0LCBuZXcgTW91c2VTdGF0ZShtb3VzZVBvc2l0aW9uLCByZWxhdGl2ZU1vdXNlUG9zaXRpb24sIG1vdXNlRG93biwgbW91c2VJbiwgbW91c2VDbGlja2VkKSk7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIHNob3VsZCBwYXVzZVxyXG4gICAgaWYoZ2FtZS5hY3RpdmUgJiYgd2luZG93RGl2LmlubmVySFRNTCE9JycgJiYgcGF1c2VkVGltZSsrPjMpe1xyXG4gICAgXHRnYW1lLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgXHR3aW5kb3dGaWxtLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZihwYXVzZWRUaW1lIT0wICYmIHdpbmRvd0Rpdi5pbm5lckhUTUw9PScnKXtcclxuICAgIFx0cGF1c2VkVGltZSA9IDA7XHJcbiAgICBcdGdhbWUuYWN0aXZlID0gdHJ1ZTtcclxuICAgIFx0d2luZG93RmlsbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL2xpc3RlbnMgZm9yIGNoYW5nZXMgaW4gc2l6ZSBvZiB3aW5kb3cgYW5kIGFkanVzdHMgdmFyaWFibGVzIGFjY29yZGluZ2x5XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgY2FudmFzLndpZHRoID0gY2FudmFzLm9mZnNldFdpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy5vZmZzZXRIZWlnaHQ7XHJcbiAgICBjZW50ZXIgPSBuZXcgUG9pbnQoY2FudmFzLndpZHRoIC8gMiwgY2FudmFzLmhlaWdodCAvIDIpO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBEaW1lbnNpb25zOiBcIiArIGNhbnZhcy53aWR0aCArIFwiLCBcIiArIGNhbnZhcy5oZWlnaHQpO1xyXG59KTtcclxuXHJcblxyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL3F1ZXN0aW9uLmpzXCIpO1xyXG5cclxuLy9wYXJhbWV0ZXIgaXMgYSBwb2ludCB0aGF0IGRlbm90ZXMgc3RhcnRpbmcgcG9zaXRpb25cclxuZnVuY3Rpb24gYm9hcmQoc3RhcnRQb3NpdGlvbiwgbGVzc29uTm9kZXMpe1xyXG4gICAgdGhpcy5wb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb247XHJcbiAgICB0aGlzLmxlc3Nvbk5vZGVBcnJheSA9IGxlc3Nvbk5vZGVzO1xyXG4gICAgdGhpcy5ib2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxuICAgIHRoaXMucHJldkJvYXJkT2Zmc2V0ID0ge3g6MCx5OjB9O1xyXG59XHJcblxyXG5ib2FyZC5kcmF3TGliID0gdW5kZWZpbmVkO1xyXG5cclxuLy9wcm90b3R5cGVcclxudmFyIHAgPSBib2FyZC5wcm90b3R5cGU7XHJcblxyXG5wLm1vdmUgPSBmdW5jdGlvbihwWCwgcFkpe1xyXG4gICAgdGhpcy5wb3NpdGlvbi54ICs9IHBYO1xyXG4gICAgdGhpcy5wb3NpdGlvbi55ICs9IHBZO1xyXG4gICAgdGhpcy5ib2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxuICAgIHRoaXMucHJldkJvYXJkT2Zmc2V0ID0ge3g6MCx5OjB9O1xyXG59O1xyXG5cclxucC5hY3QgPSBmdW5jdGlvbihwTW91c2VTdGF0ZSkge1xyXG5cdFxyXG5cdC8vIGZvciBlYWNoICBub2RlXHJcbiAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGkrKyl7XHJcbiAgICBcdHZhciBhY3RpdmVOb2RlID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07IFxyXG5cdFx0Ly8gaGFuZGxlIHNvbHZlZCBxdWVzdGlvblxyXG5cdFx0aWYgKGFjdGl2ZU5vZGUuY3VycmVudFN0YXRlICE9IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRCAmJiBhY3RpdmVOb2RlLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9PSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpIHtcclxuXHRcdFx0XHJcblx0XHRcdC8vIHVwZGF0ZSBlYWNoIGNvbm5lY3Rpb24ncyBjb25uZWN0aW9uIG51bWJlclxyXG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGFjdGl2ZU5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoOyBqKyspXHJcblx0XHRcdFx0dGhpcy5sZXNzb25Ob2RlQXJyYXlbYWN0aXZlTm9kZS5xdWVzdGlvbi5jb25uZWN0aW9uc1tqXSAtIDFdLmNvbm5lY3Rpb25zKys7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBVcGRhdGUgdGhlIG5vZGUncyBzdGF0ZVxyXG5cdFx0XHRhY3RpdmVOb2RlLmN1cnJlbnRTdGF0ZSA9IGFjdGl2ZU5vZGUucXVlc3Rpb24uY3VycmVudFN0YXRlO1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9XHJcbiAgICBcclxuICAgIC8vIGhvdmVyIHN0YXRlc1xyXG5cdC8vZm9yKHZhciBpID0gMDsgaSA8IGJvYXJkQXJyYXkubGVuZ3RoOyBpKyspe1xyXG5cdFx0Ly8gbG9vcCB0aHJvdWdoIGxlc3NvbiBub2RlcyB0byBjaGVjayBmb3IgaG92ZXJcclxuXHRcdC8vIHVwZGF0ZSBib2FyZFxyXG5cdFx0XHJcblx0dmFyIG5vZGVDaG9zZW4gPSBmYWxzZTtcclxuXHRmb3IgKHZhciBpPXRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcclxuXHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5kcmFnZ2luZykge1xyXG5cdFx0XHQvL25vZGVDaG9zZW4gPSB0cnVlO1xyXG5cdFx0XHRwTW91c2VTdGF0ZS5oYXNUYXJnZXQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHRcclxuXHRmb3IgKHZhciBpPXRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcclxuXHRcdHZhciBsTm9kZSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldO1xyXG5cdFx0XHJcblx0XHRpZiAoIXBNb3VzZVN0YXRlLm1vdXNlRG93bikge1xyXG5cdFx0XHRsTm9kZS5kcmFnUG9zaXRpb24gPSB1bmRlZmluZWQ7IC8vIGNsZWFyIGRyYWcgYmVoYXZpb3JcclxuXHRcdFx0bE5vZGUuZHJhZ2dpbmcgPSBmYWxzZTtcclxuXHRcdH0gXHJcblx0XHRcclxuXHRcdGxOb2RlLm1vdXNlT3ZlciA9IGZhbHNlO1xyXG5cdFx0XHJcblx0XHQvLyBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgc2VsZWN0ZWQgbm9kZSwgZG8gbm90IHRyeSB0byBzZWxlY3QgYW5vdGhlclxyXG5cdFx0aWYgKG5vZGVDaG9zZW4pIHsgIGNvbnRpbnVlOyB9XHJcblx0XHRcclxuXHRcdC8vY29uc29sZS5sb2coXCJub2RlIHVwZGF0ZVwiKTtcclxuXHRcdC8vIGlmIGhvdmVyaW5nLCBzaG93IGhvdmVyIGdsb3dcclxuXHRcdC8qaWYgKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA+IGxOb2RlLnBvc2l0aW9uLngtbE5vZGUud2lkdGgvMiBcclxuXHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA8IGxOb2RlLnBvc2l0aW9uLngrbE5vZGUud2lkdGgvMlxyXG5cdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ID4gbE5vZGUucG9zaXRpb24ueS1sTm9kZS5oZWlnaHQvMlxyXG5cdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IDwgbE5vZGUucG9zaXRpb24ueStsTm9kZS5oZWlnaHQvMikgeyovXHJcblx0XHRcclxuXHRcdFxyXG5cdFx0aWYgKFV0aWxpdGllcy5tb3VzZUludGVyc2VjdChwTW91c2VTdGF0ZSxsTm9kZSx0aGlzLmJvYXJkT2Zmc2V0LDEpKSB7XHJcblx0XHRcdGxOb2RlLm1vdXNlT3ZlciA9IHRydWU7XHJcblx0XHRcdG5vZGVDaG9zZW4gPSB0cnVlO1xyXG5cdFx0XHRwTW91c2VTdGF0ZS5oYXNUYXJnZXQgPSB0cnVlO1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKHBNb3VzZVN0YXRlLmhhc1RhcmdldCk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duICYmICF0aGlzLnByZXZNb3VzZVN0YXRlLm1vdXNlRG93bikge1xyXG5cdFx0XHRcdC8vIGRyYWdcclxuXHRcdFx0XHRsTm9kZS5kcmFnZ2luZyA9IHRydWU7XHJcblx0XHRcdFx0bE5vZGUuZHJhZ1Bvc2l0aW9uID0gbmV3IFBvaW50KFxyXG5cdFx0XHRcdHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIGxOb2RlLnBvc2l0aW9uLngsXHJcblx0XHRcdFx0cE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IC0gbE5vZGUucG9zaXRpb24ueVxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCkge1xyXG5cdFx0XHRcdC8vIGhhbmRsZSBjbGljayBjb2RlXHJcblx0XHRcdFx0bE5vZGUuY2xpY2socE1vdXNlU3RhdGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvLyBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIG5vZGUsIGFsbG93IHRoZSBtb3VzZSB0byBjb250cm9sIGl0cyBtb3ZlbWVudFxyXG5cdFx0aWYgKGxOb2RlLmRyYWdnaW5nKSB7XHJcblx0XHRcdGxOb2RlLnBvc2l0aW9uLnggPSBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggLSBsTm9kZS5kcmFnUG9zaXRpb24ueDtcclxuXHRcdFx0bE5vZGUucG9zaXRpb24ueSA9IHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSAtIGxOb2RlLmRyYWdQb3NpdGlvbi55O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHQvLyBkcmFnIHRoZSBib2FyZCBhcm91bmRcclxuXHRpZiAoIXBNb3VzZVN0YXRlLmhhc1RhcmdldCkge1xyXG5cdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlRG93bikge1xyXG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xyXG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy1tb3otZ3JhYmJpbmcnO1xyXG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJ2dyYWJiaW5nJztcclxuXHRcdFx0aWYgKCF0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQpIHtcclxuXHRcdFx0XHR0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQgPSBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uO1xyXG5cdFx0XHRcdHRoaXMucHJldkJvYXJkT2Zmc2V0LnggPSB0aGlzLmJvYXJkT2Zmc2V0Lng7XHJcblx0XHRcdFx0dGhpcy5wcmV2Qm9hcmRPZmZzZXQueSA9IHRoaXMuYm9hcmRPZmZzZXQueTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLnByZXZCb2FyZE9mZnNldC54IC0gKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIHRoaXMubW91c2VTdGFydERyYWdCb2FyZC54KTtcclxuXHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC54ID4gdGhpcy5tYXhCb2FyZFdpZHRoLzIpIHRoaXMuYm9hcmRPZmZzZXQueCA9IHRoaXMubWF4Qm9hcmRXaWR0aC8yO1xyXG5cdFx0XHRcdGlmICh0aGlzLmJvYXJkT2Zmc2V0LnggPCAtMSp0aGlzLm1heEJvYXJkV2lkdGgvMikgdGhpcy5ib2FyZE9mZnNldC54ID0gLTEqdGhpcy5tYXhCb2FyZFdpZHRoLzI7XHJcblx0XHRcdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gdGhpcy5wcmV2Qm9hcmRPZmZzZXQueSAtIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueSk7XHJcblx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueSA+IHRoaXMubWF4Qm9hcmRIZWlnaHQvMikgdGhpcy5ib2FyZE9mZnNldC55ID0gdGhpcy5tYXhCb2FyZEhlaWdodC8yO1xyXG5cdFx0XHRcdGlmICh0aGlzLmJvYXJkT2Zmc2V0LnkgPCAtMSp0aGlzLm1heEJvYXJkSGVpZ2h0LzIpIHRoaXMuYm9hcmRPZmZzZXQueSA9IC0xKnRoaXMubWF4Qm9hcmRIZWlnaHQvMjtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkID0gdW5kZWZpbmVkO1xyXG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJyc7XHJcblx0XHR9XHJcbiAgICB9XHJcbiAgICBcclxuXHR0aGlzLnByZXZNb3VzZVN0YXRlID0gcE1vdXNlU3RhdGU7XHJcbn1cclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgY2FudmFzLCBjZW50ZXIpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuXHJcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5ib2FyZE9mZnNldDtcclxuICAgIC8vdHJhbnNsYXRlIHRvIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlblxyXG4gICAgY3R4LnRyYW5zbGF0ZShjZW50ZXIueCAtIHRoaXMucG9zaXRpb24ueCwgY2VudGVyLnkgLSB0aGlzLnBvc2l0aW9uLnkpO1xyXG4gICAgLy9jdHgudHJhbnNsYXRlKHRoaXMuYm9hcmRPZmZzZXQueCx0aGlzLmJvYXJkT2Zmc2V0LnkpO1xyXG5cdFxyXG5cdC8vIGRyYXcgdGhlIG5vZGVzXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG4gICAgXHJcbiAgICBcdC8vIHRlbXBvcmFyaWx5IGhpZGUgYWxsIGJ1dCB0aGUgZmlyc3QgcXVlc3Rpb25cclxuXHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQgPiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5saW5rc0F3YXlGcm9tT3JpZ2luKSBjb250aW51ZTtcclxuICAgIFx0XHJcbiAgICBcdC8vIGRyYXcgdGhlIG5vZGUgaXRzZWxmXHJcbiAgICAgICAgdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uZHJhdyhjdHgsIGNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG5cdC8vIGRyYXcgdGhlIGxpbmVzXHJcblx0Zm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHJcblx0XHQvLyBvbmx5IHNob3cgbGluZXMgZnJvbSBzb2x2ZWQgcXVlc3Rpb25zXHJcblx0XHRpZiAodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY3VycmVudFN0YXRlIT1RdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpIGNvbnRpbnVlO1xyXG5cdFx0XHJcblx0XHQvLyBnZXQgdGhlIHBpbiBwb2lzdGlvbiBpbiB0aGUgY29ybmVyIHdpdGggbWFyZ2luIDUsNVxyXG4gICAgICAgIHZhciBwaW5YID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucG9zaXRpb24ueCAtIHRoaXMubGVzc29uTm9kZUFycmF5W2ldLndpZHRoKnRoaXMubGVzc29uTm9kZUFycmF5W2ldLnNjYWxlRmFjdG9yLzIgKyAxNTtcclxuICAgICAgICB2YXIgcGluWSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnBvc2l0aW9uLnkgLSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5oZWlnaHQqdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uc2NhbGVGYWN0b3IvMiArIDE1O1xyXG5cdFx0XHJcblx0XHQvLyBzZXQgbGluZSBzdHlsZVxyXG5cdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJyZ2JhKDAsMCwxMDUsMC4yKVwiO1xyXG5cdFx0Y3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgXHRcclxuXHRcdFx0aWYgKHRoaXMubGVzc29uTm9kZUFycmF5W3RoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2pdIC0gMV0ucXVlc3Rpb24uY3VycmVudFN0YXRlPT1RdWVzdGlvbi5TT0xWRV9TVEFURS5ISURERU4pIGNvbnRpbnVlO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHQvLyBnbyB0byB0aGUgaW5kZXggaW4gdGhlIGFycmF5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGNvbm5lY3RlZCBub2RlIG9uIHRoaXMgYm9hcmQgYW5kIHNhdmUgaXRzIHBvc2l0aW9uXHJcbiAgICAgICAgXHQvLyBjb25uZWN0aW9uIGluZGV4IHNhdmVkIGluIHRoZSBsZXNzb25Ob2RlJ3MgcXVlc3Rpb25cclxuICAgICAgICBcdHZhciBjb25uZWN0aW9uID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal0gLSAxXTtcclxuICAgICAgICBcdHZhciBjUG9zID0gY29ubmVjdGlvbi5wb3NpdGlvbjtcclxuICAgICAgICBcdHZhciBjV2lkdGggPSBjb25uZWN0aW9uLndpZHRoO1xyXG4gICAgICAgIFx0dmFyIGNIZWlnaHQgPSBjb25uZWN0aW9uLmhlaWdodDtcclxuICAgICAgICBcdHZhciBjU2NhbGUgPSBjb25uZWN0aW9uLnNjYWxlRmFjdG9yO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHQvLyBkcmF3IHRoZSBsaW5lXHJcbiAgICAgICAgXHRjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgXHQvLyB0cmFuc2xhdGUgdG8gc3RhcnQgKHBpbilcclxuICAgICAgICBcdGN0eC5tb3ZlVG8ocGluWCxwaW5ZKTtcclxuICAgICAgICBcdGN0eC5saW5lVG8oY1Bvcy54IC0gY1dpZHRoKmNTY2FsZS8yICsgMTUsIGNQb3MueSAtIGNIZWlnaHQqY1NjYWxlLzIgKyAxNSk7XHJcbiAgICAgICAgXHRjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgXHRjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib2FyZDtcclxuXHJcbi8vdGhpcyBpcyBhbiBvYmplY3QgbmFtZWQgQm9hcmQgYW5kIHRoaXMgaXMgaXRzIGphdmFzY3JpcHRcclxuLy92YXIgQm9hcmQgPSByZXF1aXJlKCcuL29iamVjdHMvYm9hcmQuanMnKTtcclxuLy92YXIgYiA9IG5ldyBCb2FyZCgpO1xyXG4gICAgIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBidXR0b24oc3RhcnRQb3NpdGlvbiwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIHRoaXMuY2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XHJcbn1cclxuYnV0dG9uLmRyYXdMaWIgPSB1bmRlZmluZWQ7XHJcblxyXG52YXIgcCA9IGJ1dHRvbi5wcm90b3R5cGU7XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIHZhciBjb2w7XHJcbiAgICBpZih0aGlzLmhvdmVyZWQpe1xyXG4gICAgICAgIGNvbCA9IFwiZG9kZ2VyYmx1ZVwiO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjb2wgPSBcImxpZ2h0Ymx1ZVwiO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3IHJvdW5kZWQgY29udGFpbmVyXHJcbiAgICBib2FyZEJ1dHRvbi5kcmF3TGliLnJlY3QoY3R4LCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBjb2wpO1xyXG5cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGJ1dHRvbjsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XHJcblxyXG4vLyBDcmVhdGVzIGEgY2F0ZWdvcnkgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgZnJvbSB0aGUgZ2l2ZW4geG1sXHJcbmZ1bmN0aW9uIENhdGVnb3J5KG5hbWUsIHhtbCwgcmVzb3VyY2VzLCB1cmwsIHdpbmRvd0Rpdil7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgbmFtZVxyXG5cdHRoaXMubmFtZSA9IG5hbWU7XHJcblx0XHJcblx0Ly8gTG9hZCBhbGwgdGhlIHF1ZXN0aW9uc1xyXG5cdHZhciBxdWVzdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG5cdHRoaXMucXVlc3Rpb25zID0gW107XHJcblx0Ly8gY3JlYXRlIHF1ZXN0aW9uc1xyXG5cdGZvciAodmFyIGk9MDsgaTxxdWVzdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBcclxuXHR7XHJcblx0XHQvLyBjcmVhdGUgYSBxdWVzdGlvbiBvYmplY3RcclxuXHRcdHRoaXMucXVlc3Rpb25zW2ldID0gbmV3IFF1ZXN0aW9uKHF1ZXN0aW9uRWxlbWVudHNbaV0sIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpO1xyXG5cdH1cclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhdGVnb3J5OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy9Nb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG4vLyBUaGUgc2l6ZSBvZiB0aGUgYm9hcmQgaW4gZ2FtZSB1bml0cyBhdCAxMDAlIHpvb21cclxubS5ib2FyZFNpemUgPSB7eDoxOTIwLCB5OjEwODB9O1xyXG5cclxuLy8gVGhlIHNjYWxlIG9mIHRoZSBib2FyZCB0byBnYW1lIHZpZXcgYXQgMTAwJSB6b29tXHJcbm0uYm9hcmRTY2FsZSA9IDI7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbm0uY2xlYXIgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgpIHtcclxuICAgIGN0eC5jbGVhclJlY3QoeCwgeSwgdywgaCk7XHJcbn1cclxuXHJcbm0ucmVjdCA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgY29sLCBjZW50ZXJPcmlnaW4pIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sO1xyXG4gICAgaWYoY2VudGVyT3JpZ2luKXtcclxuICAgICAgICBjdHguZmlsbFJlY3QoeCAtICh3IC8gMiksIHkgLSAoaCAvIDIpLCB3LCBoKTtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubS5saW5lID0gZnVuY3Rpb24oY3R4LCB4MSwgeTEsIHgyLCB5MiwgdGhpY2tuZXNzLCBjb2xvcikge1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGN0eC5tb3ZlVG8oeDEsIHkxKTtcclxuICAgIGN0eC5saW5lVG8oeDIsIHkyKTtcclxuICAgIGN0eC5saW5lV2lkdGggPSB0aGlja25lc3M7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm0uY2lyY2xlID0gZnVuY3Rpb24oY3R4LCB4LCB5LCByYWRpdXMsIGNvbG9yKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHguYXJjKHgseSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJvYXJkQnV0dG9uKGN0eCwgcG9zaXRpb24sIHdpZHRoLCBoZWlnaHQsIGhvdmVyZWQpe1xyXG4gICAgLy9jdHguc2F2ZSgpO1xyXG4gICAgaWYoaG92ZXJlZCl7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiZG9kZ2VyYmx1ZVwiO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJsaWdodGJsdWVcIjtcclxuICAgIH1cclxuICAgIC8vZHJhdyByb3VuZGVkIGNvbnRhaW5lclxyXG4gICAgY3R4LnJlY3QocG9zaXRpb24ueCAtIHdpZHRoLzIsIHBvc2l0aW9uLnkgLSBoZWlnaHQvMiwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICBjdHgubGluZVdpZHRoID0gNTtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5maWxsKCk7XHJcbiAgICAvL2N0eC5yZXN0b3JlKCk7XHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEJvYXJkID0gcmVxdWlyZSgnLi9ib2FyZC5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi9kcmF3TGliLmpzJyk7XHJcbnZhciBMZXNzb25Ob2RlID0gcmVxdWlyZSgnLi9sZXNzb25Ob2RlLmpzJyk7XHJcbnZhciBVdGlsaXR5ID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxudmFyIERhdGFQYXJzZXIgPSByZXF1aXJlKCcuL2lwYXJEYXRhUGFyc2VyLmpzJyk7XHJcblxyXG4vL21vdXNlIG1hbmFnZW1lbnRcclxudmFyIG1vdXNlU3RhdGU7XHJcbnZhciBwcmV2aW91c01vdXNlU3RhdGU7XHJcbnZhciBkcmFnZ2luZ0Rpc2FibGVkO1xyXG52YXIgbW91c2VUYXJnZXQ7XHJcbnZhciBtb3VzZVN1c3RhaW5lZERvd247XHJcblxyXG4vL3BoYXNlIGhhbmRsaW5nXHJcbnZhciBwaGFzZU9iamVjdDtcclxuXHJcblxyXG5mdW5jdGlvbiBnYW1lKHVybCwgd2luZG93RGl2KXtcclxuXHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuXHREYXRhUGFyc2VyLnBhcnNlRGF0YSh1cmwsIHdpbmRvd0RpdiwgZnVuY3Rpb24oY2F0ZWdvcmllcyl7XHJcblx0XHRnYW1lLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzO1xyXG5cdFx0Z2FtZS5jcmVhdGVMZXNzb25Ob2RlcygpO1xyXG5cdH0pO1xyXG59XHJcblxyXG52YXIgcCA9IGdhbWUucHJvdG90eXBlO1xyXG5cclxucC5jcmVhdGVMZXNzb25Ob2RlcyA9IGZ1bmN0aW9uKCl7XHJcblx0dGhpcy5ib2FyZEFycmF5ID0gW107XHJcblx0dmFyIGJvdHRvbUJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm90dG9tQmFyXCIpO1xyXG5cdGZvcih2YXIgaT0wO2k8dGhpcy5jYXRlZ29yaWVzLmxlbmd0aDtpKyspe1xyXG5cdFx0Ly8gaW5pdGlhbGl6ZSBlbXB0eVxyXG5cdFx0XHJcblx0XHR0aGlzLmxlc3Nvbk5vZGVzID0gW107XHJcblx0XHQvLyBhZGQgYSBub2RlIHBlciBxdWVzdGlvblxyXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcblx0XHRcdC8vIGNyZWF0ZSBhIG5ldyBsZXNzb24gbm9kZVxyXG5cdFx0XHR0aGlzLmxlc3Nvbk5vZGVzLnB1c2gobmV3IExlc3Nvbk5vZGUobmV3IFBvaW50KHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0ucG9zaXRpb25QZXJjZW50WCwgdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXS5wb3NpdGlvblBlcmNlbnRZKSwgdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXS5pbWFnZUxpbmssIHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal0gKSApO1xyXG5cdFx0XHQvLyBhdHRhY2ggcXVlc3Rpb24gb2JqZWN0IHRvIGxlc3NvbiBub2RlXHJcblx0XHRcdHRoaXMubGVzc29uTm9kZXNbdGhpcy5sZXNzb25Ob2Rlcy5sZW5ndGgtMV0ucXVlc3Rpb24gPSB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdO1xyXG5cdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY3JlYXRlIGEgYm9hcmRcclxuXHRcdHRoaXMuYm9hcmRBcnJheS5wdXNoKG5ldyBCb2FyZChuZXcgUG9pbnQoMCwwKSwgdGhpcy5sZXNzb25Ob2RlcykpO1xyXG5cdFx0dmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJCVVRUT05cIik7XHJcblx0XHRidXR0b24uaW5uZXJIVE1MID0gdGhpcy5jYXRlZ29yaWVzW2ldLm5hbWU7XHJcblx0XHR2YXIgZ2FtZSA9IHRoaXM7XHJcblx0XHRidXR0b24ub25jbGljayA9IChmdW5jdGlvbihpKXsgXHJcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZihnYW1lLmFjdGl2ZSlcclxuXHRcdFx0XHRcdGdhbWUuYWN0aXZlQm9hcmRJbmRleCA9IGk7XHJcblx0XHR9fSkoaSk7XHJcblx0XHRib3R0b21CYXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcclxuXHR9XHJcblx0dGhpcy5hY3RpdmVCb2FyZEluZGV4ID0gMDtcclxuXHR0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbn1cclxuXHJcbnAudXBkYXRlID0gZnVuY3Rpb24oY3R4LCBjYW52YXMsIGR0LCBwTW91c2VTdGF0ZSl7XHJcblx0XHJcblx0aWYodGhpcy5hY3RpdmUpe1xyXG5cdCAgICAvLyBtb3VzZVxyXG5cdCAgICBwcmV2aW91c01vdXNlU3RhdGUgPSBtb3VzZVN0YXRlO1xyXG5cdCAgICBtb3VzZVN0YXRlID0gcE1vdXNlU3RhdGU7XHJcblx0ICAgIG1vdXNlVGFyZ2V0ID0gMDtcclxuXHQgICAgaWYodHlwZW9mIHByZXZpb3VzTW91c2VTdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpe1xyXG5cdCAgICAgICAgcHJldmlvdXNNb3VzZVN0YXRlID0gbW91c2VTdGF0ZTtcclxuXHQgICAgfVxyXG5cdCAgICAvL2RyYXcgc3R1ZmZcclxuXHQgICAgdGhpcy5kcmF3KGN0eCwgY2FudmFzKTtcclxuXHQgICAgXHJcblx0ICAgIC8vIFVwZGF0ZSB0aGUgY3VycmVudCBib2FyZFxyXG5cdCAgICB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5hY3QocE1vdXNlU3RhdGUpO1xyXG5cdH1cclxufVxyXG5cclxucC5kcmF3ID0gZnVuY3Rpb24oY3R4LCBjYW52YXMpe1xyXG5cdC8vZHJhdyBkZWJ1ZyBiYWNrZ3JvdW5kXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgRHJhd0xpYi5jbGVhcihjdHgsIDAsIDAsIGNhbnZhcy5vZmZzZXRXaWR0aCwgY2FudmFzLm9mZnNldEhlaWdodCk7XHJcbiAgICBEcmF3TGliLnJlY3QoY3R4LCAwLCAwLCBjYW52YXMub2Zmc2V0V2lkdGgsIGNhbnZhcy5vZmZzZXRIZWlnaHQsIFwid2hpdGVcIiwgZmFsc2UpO1xyXG4gICAgRHJhd0xpYi5saW5lKGN0eCwgY2FudmFzLm9mZnNldFdpZHRoLzIsIDAsIGNhbnZhcy5vZmZzZXRXaWR0aC8yLCBjYW52YXMub2Zmc2V0SGVpZ2h0LCAyLCBcImxpZ2h0Z3JheVwiKTtcclxuICAgIERyYXdMaWIubGluZShjdHgsIDAsIGNhbnZhcy5vZmZzZXRIZWlnaHQvMiwgY2FudmFzLm9mZnNldFdpZHRoLCBjYW52YXMub2Zmc2V0SGVpZ2h0LzIsIDIsIFwibGlnaHRHcmF5XCIpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuXHRcclxuICAgIC8vIERyYXcgdGhlIGN1cnJlbnQgYm9hcmRcclxuICAgIHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmRyYXcoY3R4LCBjYW52YXMsIHt4OmNhbnZhcy5vZmZzZXRXaWR0aC8yLCB5OmNhbnZhcy5vZmZzZXRIZWlnaHQvMn0pO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2FtZTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIENhdGVnb3J5ID0gcmVxdWlyZShcIi4vY2F0ZWdvcnkuanNcIik7XHJcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoXCIuL3Jlc291cmNlcy5qc1wiKTtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vdXRpbGl0aWVzLmpzJyk7XHJcbndpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMICA9IHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMIHx8IHdpbmRvdy53ZWJraXRSZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMO1xyXG5cclxuLy8gUGFyc2VzIHRoZSB4bWwgY2FzZSBmaWxlc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIGtub3duIHRhZ3NcclxuLypcclxuYW5zd2VyXHJcbmJ1dHRvblxyXG5jYXRlZ29yeUxpc3RcclxuY29ubmVjdGlvbnNcclxuZWxlbWVudFxyXG5mZWVkYmFja1xyXG5pbnN0cnVjdGlvbnNcclxucmVzb3VyY2VcclxucmVzb3VyY2VMaXN0XHJcbnJlc291cmNlSW5kZXhcclxuc29mdHdhcmVMaXN0XHJcbnF1ZXN0aW9uXHJcbnF1ZXN0aW9uVGV4dFxyXG5xdXN0aW9uTmFtZVxyXG4qL1xyXG5cclxuLy8gTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gY29uc3RydWN0b3JcclxubS5wYXJzZURhdGEgPSBmdW5jdGlvbih1cmwsIHdpbmRvd0RpdiwgY2FsbGJhY2spIHtcclxuICAgIFxyXG4gICAgdGhpcy5jYXRlZ29yaWVzID0gW107XHJcbiAgICB0aGlzLnF1ZXN0aW9ucyA9IFtdO1xyXG4gICAgXHJcblx0Ly8gZ2V0IFhNTFxyXG4gICAgd2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwodXJsKydhY3RpdmUvY2FzZUZpbGUuaXBhcmRhdGEnLCBmdW5jdGlvbihmaWxlRW50cnkpIHtcclxuXHRcdGZpbGVFbnRyeS5maWxlKGZ1bmN0aW9uKGZpbGUpIHtcclxuXHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcdHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0Ly8gR2V0IHRoZSByYXcgZGF0YVxyXG5cdFx0XHRcdHZhciByYXdEYXRhID0gVXRpbGl0aWVzLmdldFhtbCh0aGlzLnJlc3VsdCk7XHJcblx0XHRcdFx0dmFyIGNhdGVnb3JpZXMgPSBnZXRDYXRlZ29yaWVzQW5kUXVlc3Rpb25zKHJhd0RhdGEsIHVybCwgd2luZG93RGl2KTtcclxuXHRcdFx0XHRjYWxsYmFjayhjYXRlZ29yaWVzKTtcclxuXHRcdFx0ICAgXHJcblx0XHRcdH07XHJcblx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xyXG5cdFx0ICAgXHJcblx0XHR9LCBmdW5jdGlvbihlKXtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJFcnJvcjogXCIrZS5tZXNzYWdlKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG59XHJcblxyXG4vLyB0YWtlcyB0aGUgeG1sIHN0cnVjdHVyZSBhbmQgZmlsbHMgaW4gdGhlIGRhdGEgZm9yIHRoZSBxdWVzdGlvbiBvYmplY3RcclxuZnVuY3Rpb24gZ2V0Q2F0ZWdvcmllc0FuZFF1ZXN0aW9ucyhyYXdEYXRhLCB1cmwsIHdpbmRvd0Rpdikge1xyXG5cdC8vIGlmIHRoZXJlIGlzIGEgY2FzZSBmaWxlXHJcblx0aWYgKHJhd0RhdGEgIT0gbnVsbCkge1xyXG5cdFx0XHJcblx0XHQvLyBGaXJzdCBsb2FkIHRoZSByZXNvdXJjZXNcclxuXHRcdHZhciByZXNvdXJjZUVsZW1lbnRzID0gcmF3RGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlTGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlXCIpO1xyXG5cdFx0dmFyIHJlc291cmNlcyA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wOyBpPHJlc291cmNlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Ly8gTG9hZCBlYWNoIHJlc291cmNlXHJcblx0XHRcdHJlc291cmNlc1tpXSA9IG5ldyBSZXNvdXJjZShyZXNvdXJjZUVsZW1lbnRzW2ldLCB1cmwpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBUaGVuIGxvYWQgdGhlIGNhdGVnb3JpZXNcclxuXHRcdHZhciBjYXRlZ29yeUVsZW1lbnRzID0gcmF3RGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhdGVnb3J5XCIpO1xyXG5cdFx0dmFyIGNhdGVnb3J5TmFtZXMgPSByYXdEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZWxlbWVudFwiKTtcclxuXHRcdHZhciBjYXRlZ29yaWVzID0gW107XHJcblx0XHRmb3IgKHZhciBpPTA7IGk8Y2F0ZWdvcnlFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHQvLyBMb2FkIGVhY2ggY2F0ZWdvcnkgKHdoaWNoIGxvYWRzIGVhY2ggcXVlc3Rpb24pXHJcblx0XHRcdGNhdGVnb3JpZXNbaV0gPSBuZXcgQ2F0ZWdvcnkoY2F0ZWdvcnlOYW1lc1tpXS5pbm5lckhUTUwsIGNhdGVnb3J5RWxlbWVudHNbaV0sIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhdGVnb3JpZXM7XHJcblx0fVxyXG5cdHJldHVybiBudWxsXHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKCcuL2RyYXdMaWIuanMnKTtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBsZXNzb25Ob2RlKHN0YXJ0UG9zaXRpb24sIGltYWdlUGF0aCwgcFF1ZXN0aW9uKXtcclxuICAgIFxyXG4gICAgdGhpcy5wb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb247XHJcbiAgICB0aGlzLmRyYWdMb2NhdGlvbiA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLnNjYWxlRmFjdG9yID0gMTtcclxuICAgIHRoaXMudHlwZSA9IFwibGVzc29uTm9kZVwiO1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy53aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0O1xyXG4gICAgdGhpcy5xdWVzdGlvbiA9IHBRdWVzdGlvbjtcclxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSAwO1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSB0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZTtcclxuICAgIFxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgLy9pbWFnZSBsb2FkaW5nIGFuZCByZXNpemluZ1xyXG4gICAgdGhpcy5pbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGF0LndpZHRoID0gdGhhdC5pbWFnZS5uYXR1cmFsV2lkdGg7XHJcbiAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmltYWdlLm5hdHVyYWxIZWlnaHQ7XHJcbiAgICAgICAgdmFyIG1heERpbWVuc2lvbiA9IDEwMDtcclxuICAgICAgICAvL3RvbyBzbWFsbD9cclxuICAgICAgICBpZih0aGF0LndpZHRoIDwgbWF4RGltZW5zaW9uICYmIHRoYXQuaGVpZ2h0IDwgbWF4RGltZW5zaW9uKXtcclxuICAgICAgICAgICAgdmFyIHg7XHJcbiAgICAgICAgICAgIGlmKHRoYXQud2lkdGggPiB0aGF0LmhlaWdodCl7XHJcbiAgICAgICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhhdC53aWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IG1heERpbWVuc2lvbiAvIHRoYXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQud2lkdGggPSB0aGF0LndpZHRoICogeDtcclxuICAgICAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmhlaWdodCAqIHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoYXQud2lkdGggPiBtYXhEaW1lbnNpb24gfHwgdGhhdC5oZWlnaHQgPiBtYXhEaW1lbnNpb24pe1xyXG4gICAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcclxuICAgICAgICAgICAgICAgIHggPSB0aGF0LndpZHRoIC8gbWF4RGltZW5zaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB4ID0gdGhhdC5oZWlnaHQgLyBtYXhEaW1lbnNpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC53aWR0aCA9IHRoYXQud2lkdGggLyB4O1xyXG4gICAgICAgICAgICB0aGF0LmhlaWdodCA9IHRoYXQuaGVpZ2h0IC8geDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IGltYWdlUGF0aDtcclxufVxyXG5cclxudmFyIHAgPSBsZXNzb25Ob2RlLnByb3RvdHlwZTtcclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgY2FudmFzKXtcclxuXHJcblx0Ly8gQ2hlY2sgaWYgcXVlc3Rpb24gaXMgdmlzaWJsZVxyXG5cdGlmKHRoaXMucXVlc3Rpb24uY3VycmVudFN0YXRlPT1RdWVzdGlvbi5TT0xWRV9TVEFURS5ISURERU4pe1xyXG5cdFx0aWYodGhpcy5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQgPD0gdGhpcy5jb25uZWN0aW9ucylcclxuXHRcdFx0dGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGUgPSBRdWVzdGlvbi5TT0xWRV9TVEFURS5VTlNPTFZFRDtcclxuXHRcdGVsc2VcclxuXHRcdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuICAgIC8vbGVzc29uTm9kZS5kcmF3TGliLmNpcmNsZShjdHgsIHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55LCAxMCwgXCJyZWRcIik7XHJcbiAgICAvL2RyYXcgdGhlIGltYWdlLCBzaGFkb3cgaWYgaG92ZXJlZFxyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGlmKHRoaXMuZHJhZ2dpbmcpIHtcclxuICAgIFx0Y3R4LnNoYWRvd0NvbG9yID0gJ3llbGxvdyc7XHJcbiAgICAgICAgY3R4LnNoYWRvd0JsdXIgPSA1O1xyXG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctd2Via2l0LWdyYWJiaW5nJztcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnLW1vei1ncmFiYmluZyc7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJ2dyYWJiaW5nJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYodGhpcy5tb3VzZU92ZXIpe1xyXG4gICAgICAgIGN0eC5zaGFkb3dDb2xvciA9ICdkb2RnZXJCbHVlJztcclxuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3aW5nIHRoZSBidXR0b24gaW1hZ2VcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5wb3NpdGlvbi54IC0gKHRoaXMud2lkdGgqdGhpcy5zY2FsZUZhY3RvcikvMiwgdGhpcy5wb3NpdGlvbi55IC0gKHRoaXMuaGVpZ2h0KnRoaXMuc2NhbGVGYWN0b3IpLzIsIHRoaXMud2lkdGggKiB0aGlzLnNjYWxlRmFjdG9yLCB0aGlzLmhlaWdodCAqIHRoaXMuc2NhbGVGYWN0b3IpO1xyXG4gICAgXHJcbiAgICAvL2RyYXdpbmcgdGhlIHBpblxyXG4gICAgc3dpdGNoICh0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSkge1xyXG4gICAgXHRjYXNlIDE6XHJcbiAgICBcdFx0Y3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG5cdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSBcImN5YW5cIjtcclxuXHRcdFx0YnJlYWs7XHJcbiAgICAgXHRjYXNlIDI6XHJcbiAgICBcdFx0Y3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuXHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJ5ZWxsb3dcIjtcclxuXHRcdFx0YnJlYWs7XHJcbiAgICB9XHJcblx0Y3R4LmxpbmVXaWR0aCA9IDI7XHJcblxyXG5cdGN0eC5iZWdpblBhdGgoKTtcclxuXHRjdHguYXJjKHRoaXMucG9zaXRpb24ueCAtICh0aGlzLndpZHRoKnRoaXMuc2NhbGVGYWN0b3IpLzIgKyAxNSx0aGlzLnBvc2l0aW9uLnkgLSAodGhpcy5oZWlnaHQqdGhpcy5zY2FsZUZhY3RvcikvMiArIDE1LDYsMCwyKk1hdGguUEkpO1xyXG5cdGN0eC5jbG9zZVBhdGgoKTtcclxuXHRjdHguZmlsbCgpO1xyXG5cdGN0eC5zdHJva2UoKTtcclxuICAgIFxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbnAuY2xpY2sgPSBmdW5jdGlvbihtb3VzZVN0YXRlKXtcclxuICAgIHRoaXMucXVlc3Rpb24uZGlzcGxheVdpbmRvd3MoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXNzb25Ob2RlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5mdW5jdGlvbiBtb3VzZVN0YXRlKHBQb3NpdGlvbiwgcFJlbGF0aXZlUG9zaXRpb24sIHBNb3VzZWRvd24sIHBNb3VzZUluLCBwTW91c2VDbGlja2VkKXtcclxuICAgIHRoaXMucG9zaXRpb24gPSBwUG9zaXRpb247XHJcbiAgICB0aGlzLnJlbGF0aXZlUG9zaXRpb24gPSBwUmVsYXRpdmVQb3NpdGlvbjtcclxuICAgIHRoaXMubW91c2VEb3duID0gcE1vdXNlZG93bjtcclxuICAgIHRoaXMubW91c2VJbiA9IHBNb3VzZUluO1xyXG4gICAgdGhpcy5wcmV2TW91c2VEb3duID0gcE1vdXNlZG93bjtcclxuICAgIHRoaXMubW91c2VDbGlja2VkID0gcE1vdXNlQ2xpY2tlZDtcclxuICAgIHRoaXMuaGFzVGFyZ2V0ID0gZmFsc2U7XHJcbn1cclxuXHJcbnZhciBwID0gbW91c2VTdGF0ZS5wcm90b3R5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1vdXNlU3RhdGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBCb2FyZCA9IHJlcXVpcmUoJy4uL2JvYXJkLmpzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4uL3BvaW50LmpzJyk7XHJcbnZhciBMZXNzb25Ob2RlID0gcmVxdWlyZSgnLi4vbGVzc29uTm9kZS5qcycpO1xyXG52YXIgSXBhckRhdGFQYXJzZXIgPSByZXF1aXJlKCcuLi9pcGFyRGF0YVBhcnNlci5qcycpO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKCcuLi9xdWVzdGlvbi5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9wb2ludC5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzLmpzJyk7XHJcblxyXG52YXIgYm9hcmRBcnJheTtcclxudmFyIG1heEJvYXJkV2lkdGggPSAxMDAwO1xyXG52YXIgbWF4Qm9hcmRIZWlnaHQgPSA4MDA7XHJcbnZhciBjdXJyZW50Qm9hcmQ7XHJcbnZhciBxdWVzdGlvbnM7XHJcbnZhciBhY3RpdmVCb2FyZEluZGV4O1xyXG4vL2hhcyBldmVyeXRoaW5nIGxvYWRlZD9cclxudmFyIGxvYWRpbmdDb21wbGV0ZTtcclxuLy8gc2F2ZSB0aGUgbGFzdCBzdGF0ZSBvZiB0aGUgbW91c2UgZm9yIGNoZWNraW5nIGNsaWNrc1xyXG52YXIgcHJldk1vdXNlU3RhdGU7XHJcblxyXG52YXIgdXRpbGl0aWVzO1xyXG5cclxuLy8gZHJhZyB0aGUgYm9hcmRcclxudmFyIG1vdXNlU3RhcnREcmFnQm9hcmQgPSB1bmRlZmluZWQ7XHJcbnZhciBib2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxudmFyIHByZXZCb2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxuXHJcbmZ1bmN0aW9uIGJvYXJkUGhhc2UocFVybCl7XHJcbiAgICBsb2FkaW5nQ29tcGxldGUgPSBmYWxzZTtcclxuICAgIHByb2Nlc3NEYXRhKHBVcmwpO1xyXG4gICAgdXRpbGl0aWVzID0gbmV3IFV0aWxpdGllcygpO1xyXG59XHRcclxuXHJcblxyXG5mdW5jdGlvbiBwcm9jZXNzRGF0YShwVXJsKXtcclxuXHQvLyBpbml0aWFsaXplXHJcbiAgICBib2FyZEFycmF5ID0gW107XHJcbiAgICAvLyBjcmVhdGUgdGhlIHBhcnNlclxyXG4gICAgdmFyIGV4dHJhY3RlZERhdGEgPSBuZXcgSXBhckRhdGFQYXJzZXIoXCIuL2RhdGEvbXlkYXRhLnhtbFwiLCBkYXRhTG9hZGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGF0YUxvYWRlZChjYXRlZ29yeURhdGEpIHtcclxuXHQvL3F1ZXN0aW9ucyA9IGlwYXJQYXJzZXIuZ2V0UXVlc3Rpb25zQXJyYXkoKTtcclxuICAgIC8vY3JlYXRlTGVzc29uTm9kZXNGcm9tUXVlc3Rpb25zKHF1ZXN0aW9ucyk7XHJcbiAgICBjcmVhdGVMZXNzb25Ob2Rlc0luQm9hcmRzKGNhdGVnb3J5RGF0YSk7XHJcbiAgICBsb2FkaW5nQ29tcGxldGUgPSB0cnVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMZXNzb25Ob2Rlc0luQm9hcmRzKGNhdGVnb3JpZXMpIHtcclxuXHRjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0KSB7XHJcblx0XHQvLyBpbml0aWFsaXplIGVtcHR5XHJcblx0XHR2YXIgbGVzc29uTm9kZXMgPSBbXTtcclxuXHRcdC8vIGFkZCBhIG5vZGUgcGVyIHF1ZXN0aW9uXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNhdC5xdWVzdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Ly8gY3JlYXRlIGEgbmV3IGxlc3NvbiBub2RlXHJcblx0XHRcdGxlc3Nvbk5vZGVzLnB1c2gobmV3IExlc3Nvbk5vZGUobmV3IFBvaW50KGNhdC5xdWVzdGlvbnNbaV0ucG9zaXRpb25QZXJjZW50WCwgY2F0LnF1ZXN0aW9uc1tpXS5wb3NpdGlvblBlcmNlbnRZKSwgY2F0LnF1ZXN0aW9uc1tpXS5pbWFnZUxpbmssIGNhdC5xdWVzdGlvbnNbaV0gKSApO1xyXG5cdFx0XHQvLyBhdHRhY2ggcXVlc3Rpb24gb2JqZWN0IHRvIGxlc3NvbiBub2RlXHJcblx0XHRcdGxlc3Nvbk5vZGVzW2xlc3Nvbk5vZGVzLmxlbmd0aC0xXS5xdWVzdGlvbiA9IGNhdC5xdWVzdGlvbnNbaV07XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJpbWFnZTogXCIrbGVzc29uTm9kZXNbbGVzc29uTm9kZXMubGVuZ3RoLTFdLmltYWdlLmdldEF0dHJpYnV0ZShcInNyY1wiKSk7XHJcblx0XHRcclxuXHRcdH1cclxuXHRcdC8vIGNyZWF0ZSBhIGJvYXJkXHJcblx0XHRib2FyZEFycmF5LnB1c2gobmV3IEJvYXJkKG5ldyBQb2ludCgwLDApLCBsZXNzb25Ob2RlcykpO1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhib2FyZEFycmF5W2JvYXJkQXJyYXkubGVuZ3RoLTFdLmxlc3Nvbk5vZGVBcnJheVswXS5xdWVzdGlvbik7XHJcblx0fSk7XHJcblx0YWN0aXZlQm9hcmRJbmRleCA9IDM7IC8vIHN0YXJ0IHdpdGggdGhlIGZpcnN0IGJvYXJkIChhY3R1YWxseSBpdHMgdGhlIHNlY29uZCBub3cgc28gSSBjYW4gZGVidWcpXHJcbn1cclxuXHJcblxyXG52YXIgcCA9IGJvYXJkUGhhc2UucHJvdG90eXBlO1xyXG5cclxucC51cGRhdGUgPSBmdW5jdGlvbihjdHgsIGNhbnZhcywgZHQsIGNlbnRlciwgYWN0aXZlSGVpZ2h0LCBwTW91c2VTdGF0ZSwgYm9hcmRPZmZzZXQpIHtcclxuICAgIHAuYWN0KHBNb3VzZVN0YXRlKTtcclxuICAgIHAuZHJhdyhjdHgsIGNhbnZhcywgY2VudGVyLCBhY3RpdmVIZWlnaHQpO1xyXG4gICAgaWYgKGFjdGl2ZUJvYXJkSW5kZXgpIGJvYXJkQXJyYXlbYWN0aXZlQm9hcmRJbmRleF0udXBkYXRlKCk7XHJcbn1cclxuXHJcbnAuYWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUpe1xyXG5cdC8vIGhvdmVyIHN0YXRlc1xyXG5cdC8vZm9yKHZhciBpID0gMDsgaSA8IGJvYXJkQXJyYXkubGVuZ3RoOyBpKyspe1xyXG5cdFx0Ly8gbG9vcCB0aHJvdWdoIGxlc3NvbiBub2RlcyB0byBjaGVjayBmb3IgaG92ZXJcclxuXHRpZiAoYWN0aXZlQm9hcmRJbmRleCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdC8vIHVwZGF0ZSBib2FyZFxyXG5cdFx0XHJcblx0XHR2YXIgbm9kZUNob3NlbiA9IGZhbHNlO1xyXG5cdFx0Zm9yICh2YXIgaT1ib2FyZEFycmF5W2FjdGl2ZUJvYXJkSW5kZXhdLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XHJcblx0XHRcdGlmIChib2FyZEFycmF5W2FjdGl2ZUJvYXJkSW5kZXhdLmxlc3Nvbk5vZGVBcnJheVtpXS5kcmFnZ2luZykge1xyXG5cdFx0XHRcdC8vbm9kZUNob3NlbiA9IHRydWU7XHJcblx0XHRcdFx0cE1vdXNlU3RhdGUuaGFzVGFyZ2V0ID0gdHJ1ZTtcclxuXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRcclxuXHRcdGZvciAodmFyIGk9Ym9hcmRBcnJheVthY3RpdmVCb2FyZEluZGV4XS5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xyXG5cdFx0XHR2YXIgbE5vZGUgPSBib2FyZEFycmF5W2FjdGl2ZUJvYXJkSW5kZXhdLmxlc3Nvbk5vZGVBcnJheVtpXTtcclxuXHRcdFx0XHJcblx0XHRcdGlmICghcE1vdXNlU3RhdGUubW91c2VEb3duKSB7XHJcblx0XHRcdFx0bE5vZGUuZHJhZ1Bvc2l0aW9uID0gdW5kZWZpbmVkOyAvLyBjbGVhciBkcmFnIGJlaGF2aW9yXHJcblx0XHRcdFx0bE5vZGUuZHJhZ2dpbmcgPSBmYWxzZTtcclxuXHRcdFx0fSBcclxuXHRcdFx0XHJcblx0XHRcdGxOb2RlLm1vdXNlT3ZlciA9IGZhbHNlO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gaWYgdGhlcmUgaXMgYWxyZWFkeSBhIHNlbGVjdGVkIG5vZGUsIGRvIG5vdCB0cnkgdG8gc2VsZWN0IGFub3RoZXJcclxuXHRcdFx0aWYgKG5vZGVDaG9zZW4pIHsgIGNvbnRpbnVlOyB9XHJcblx0XHRcdFxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwibm9kZSB1cGRhdGVcIik7XHJcblx0XHRcdC8vIGlmIGhvdmVyaW5nLCBzaG93IGhvdmVyIGdsb3dcclxuXHRcdFx0LyppZiAocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54ID4gbE5vZGUucG9zaXRpb24ueC1sTm9kZS53aWR0aC8yIFxyXG5cdFx0XHQmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPCBsTm9kZS5wb3NpdGlvbi54K2xOb2RlLndpZHRoLzJcclxuXHRcdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ID4gbE5vZGUucG9zaXRpb24ueS1sTm9kZS5oZWlnaHQvMlxyXG5cdFx0XHQmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgPCBsTm9kZS5wb3NpdGlvbi55K2xOb2RlLmhlaWdodC8yKSB7Ki9cclxuXHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAodXRpbGl0aWVzLm1vdXNlSW50ZXJzZWN0KHBNb3VzZVN0YXRlLGxOb2RlLGJvYXJkT2Zmc2V0LDEpKSB7XHJcblx0XHRcdFx0bE5vZGUubW91c2VPdmVyID0gdHJ1ZTtcclxuXHRcdFx0XHRub2RlQ2hvc2VuID0gdHJ1ZTtcclxuXHRcdFx0XHRwTW91c2VTdGF0ZS5oYXNUYXJnZXQgPSB0cnVlO1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2cocE1vdXNlU3RhdGUuaGFzVGFyZ2V0KTtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duICYmICFwcmV2TW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHRcdC8vIGRyYWdcclxuXHRcdFx0XHRcdGxOb2RlLmRyYWdnaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGxOb2RlLmRyYWdQb3NpdGlvbiA9IG5ldyBQb2ludChcclxuXHRcdFx0XHRcdHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIGxOb2RlLnBvc2l0aW9uLngsXHJcblx0XHRcdFx0XHRwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSBsTm9kZS5wb3NpdGlvbi55XHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VDbGlja2VkKSB7XHJcblx0XHRcdFx0XHQvLyBoYW5kbGUgY2xpY2sgY29kZVxyXG5cdFx0XHRcdFx0bE5vZGUuY2xpY2socE1vdXNlU3RhdGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIG5vZGUsIGFsbG93IHRoZSBtb3VzZSB0byBjb250cm9sIGl0cyBtb3ZlbWVudFxyXG5cdFx0XHRpZiAobE5vZGUuZHJhZ2dpbmcpIHtcclxuXHRcdFx0XHRsTm9kZS5wb3NpdGlvbi54ID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IC0gbE5vZGUuZHJhZ1Bvc2l0aW9uLng7XHJcblx0XHRcdFx0bE5vZGUucG9zaXRpb24ueSA9IHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSAtIGxOb2RlLmRyYWdQb3NpdGlvbi55O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdC8vIGRyYWcgdGhlIGJvYXJkIGFyb3VuZFxyXG5cdGlmICghcE1vdXNlU3RhdGUuaGFzVGFyZ2V0KSB7XHJcblx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duKSB7XHJcblx0XHRcdGlmICghbW91c2VTdGFydERyYWdCb2FyZCkge1xyXG5cdFx0XHRcdG1vdXNlU3RhcnREcmFnQm9hcmQgPSBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uO1xyXG5cdFx0XHRcdHByZXZCb2FyZE9mZnNldC54ID0gYm9hcmRPZmZzZXQueDtcclxuXHRcdFx0XHRwcmV2Qm9hcmRPZmZzZXQueSA9IGJvYXJkT2Zmc2V0Lnk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Ym9hcmRPZmZzZXQueCA9IHByZXZCb2FyZE9mZnNldC54IC0gKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIG1vdXNlU3RhcnREcmFnQm9hcmQueCk7XHJcblx0XHRcdFx0aWYgKGJvYXJkT2Zmc2V0LnggPiBtYXhCb2FyZFdpZHRoLzIpIGJvYXJkT2Zmc2V0LnggPSBtYXhCb2FyZFdpZHRoLzI7XHJcblx0XHRcdFx0aWYgKGJvYXJkT2Zmc2V0LnggPCAtMSptYXhCb2FyZFdpZHRoLzIpIGJvYXJkT2Zmc2V0LnggPSAtMSptYXhCb2FyZFdpZHRoLzI7XHJcblx0XHRcdFx0Ym9hcmRPZmZzZXQueSA9IHByZXZCb2FyZE9mZnNldC55IC0gKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSAtIG1vdXNlU3RhcnREcmFnQm9hcmQueSk7XHJcblx0XHRcdFx0aWYgKGJvYXJkT2Zmc2V0LnkgPiBtYXhCb2FyZEhlaWdodC8yKSBib2FyZE9mZnNldC55ID0gbWF4Qm9hcmRIZWlnaHQvMjtcclxuXHRcdFx0XHRpZiAoYm9hcmRPZmZzZXQueSA8IC0xKm1heEJvYXJkSGVpZ2h0LzIpIGJvYXJkT2Zmc2V0LnkgPSAtMSptYXhCb2FyZEhlaWdodC8yO1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGJvYXJkT2Zmc2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bW91c2VTdGFydERyYWdCb2FyZCA9IHVuZGVmaW5lZDtcclxuXHRcdH1cclxuICAgIH1cclxuICAgIFxyXG5cdHByZXZNb3VzZVN0YXRlID0gcE1vdXNlU3RhdGU7XHJcbn1cclxuXHJcbnAuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgY2FudmFzLCBjZW50ZXIsIGFjdGl2ZUhlaWdodCl7XHJcblx0Ly8gY3VycmVudCBib2FyZCA9IDA7XHJcblx0Ly9jb25zb2xlLmxvZyhcImRyYXcgY3VycmVudEJvYXJkIFwiICsgY3VycmVudEJvYXJkKTtcclxuXHRpZiAoYWN0aXZlQm9hcmRJbmRleCAhPSB1bmRlZmluZWQpIGJvYXJkQXJyYXlbYWN0aXZlQm9hcmRJbmRleF0uZHJhdyhjdHgsIGNlbnRlciwgYWN0aXZlSGVpZ2h0LCBib2FyZE9mZnNldCk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGJvYXJkUGhhc2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIHBvaW50KHBYLCBwWSl7XHJcbiAgICB0aGlzLnggPSBwWDtcclxuICAgIHRoaXMueSA9IHBZO1xyXG59XHJcblxyXG52YXIgcCA9IHBvaW50LnByb3RvdHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcG9pbnQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMuanMnKTtcclxuXHJcbnZhciBTT0xWRV9TVEFURSA9IE9iamVjdC5mcmVlemUoe0hJRERFTjogMCwgVU5TT0xWRUQ6IDEsIFNPTFZFRDogMn0pO1xyXG52YXIgUVVFU1RJT05fVFlQRSA9IE9iamVjdC5mcmVlemUoe0pVU1RJRklDQVRJT046IDEsIE1VTFRJUExFX0NIT0lDRTogMiwgU0hPUlRfUkVTUE9OU0U6IDMsIEZJTEU6IDQsIE1FU1NBR0U6IDV9KTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIFF1ZXN0aW9uKHhtbCwgcmVzb3VyY2VzLCB1cmwsIHdpbmRvd0Rpdil7XHJcblx0XHJcblx0Ly8gU2V0IHRoZSBjdXJyZW50IHN0YXRlIHRvIGRlZmF1bHQgYXQgaGlkZGVuIGFuZCBzdG9yZSB0aGUgd2luZG93IGRpdlxyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSBTT0xWRV9TVEFURS5ISURERU47XHJcbiAgICB0aGlzLndpbmRvd0RpdiA9IHdpbmRvd0RpdjtcclxuICAgIFxyXG4gICAgLy8gR2V0IGFuZCBzYXZlIHRoZSBnaXZlbiBpbmRleCwgY29ycmVjdCBhbnN3ZXIsIHBvc2l0aW9uLCByZXZlYWwgdGhyZXNob2xkLCBpbWFnZSBsaW5rLCBmZWVkYmFjaywgYW5kIGNvbm5lY3Rpb25zXHJcbiAgICB0aGlzLmNvcnJlY3QgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwiY29ycmVjdEFuc3dlclwiKSk7XHJcbiAgICB0aGlzLnBvc2l0aW9uUGVyY2VudFggPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJ4UG9zaXRpb25QZXJjZW50XCIpKSwgMCwgMTAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngpO1xyXG4gICAgdGhpcy5wb3NpdGlvblBlcmNlbnRZID0gVXRpbGl0aWVzLm1hcChwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwieVBvc2l0aW9uUGVyY2VudFwiKSksIDAsIDEwMCwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS55KTtcclxuICAgIHRoaXMucmV2ZWFsVGhyZXNob2xkID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInJldmVhbFRocmVzaG9sZFwiKSk7XHJcbiAgICB0aGlzLmltYWdlTGluayA9IHVybCt4bWwuZ2V0QXR0cmlidXRlKFwiaW1hZ2VMaW5rXCIpO1xyXG4gICAgdGhpcy5mZWVkYmFja3MgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmZWVkYmFja1wiKTtcclxuICAgIHZhciBjb25uZWN0aW9uRWxlbWVudHMgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjb25uZWN0aW9uc1wiKTtcclxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBbXTtcclxuICAgIGZvcih2YXIgaT0wO2k8Y29ubmVjdGlvbkVsZW1lbnRzLmxlbmd0aDtpKyspXHJcbiAgICBcdHRoaXMuY29ubmVjdGlvbnNbaV0gPSBwYXJzZUludChjb25uZWN0aW9uRWxlbWVudHNbaV0uaW5uZXJIVE1MKTtcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIHRoZSB3aW5kb3dzIGZvciB0aGlzIHF1ZXN0aW9uIGJhc2VkIG9uIHRoZSBxdWVzdGlvbiB0eXBlXHJcbiAgICB0aGlzLnF1ZXN0aW9uVHlwZSA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJxdWVzdGlvblR5cGVcIikpO1xyXG4gICAgdGhpcy5qdXN0aWZpY2F0aW9uID0gdGhpcy5xdWVzdGlvblR5cGU9PTEgfHwgdGhpcy5xdWVzdGlvblR5cGU9PTM7XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGUhPTUpe1xyXG5cdFx0dGhpcy5jcmVhdGVUYXNrV2luZG93KHhtbCk7XHJcblx0XHR0aGlzLmNyZWF0ZVJlc291cmNlV2luZG93KHhtbCwgcmVzb3VyY2VzKTtcclxuXHR9XHJcblx0c3dpdGNoKHRoaXMucXVlc3Rpb25UeXBlKXtcclxuXHRcdGNhc2UgNTpcclxuXHRcdFx0dGhpcy5jcmVhdGVNZXNzYWdlV2luZG93KHhtbCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSA0OlxyXG5cdFx0XHR0aGlzLmNyZWF0ZUZpbGVXaW5kb3coKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlIDM6XHJcblx0XHRjYXNlIDI6XHJcblx0XHRjYXNlIDE6XHJcblx0XHRcdHRoaXMuY3JlYXRlQW5zd2VyV2luZG93KHhtbCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdH1cclxuICAgIFxyXG59XHJcblxyXG52YXIgcCA9IFF1ZXN0aW9uLnByb3RvdHlwZTtcclxuXHJcbnAud3JvbmdBbnN3ZXIgPSBmdW5jdGlvbihudW0pe1xyXG5cclxuICAvLyBJZiBmZWViYWNrIGRpc3BsYXkgaXRcclxuXHRpZih0aGlzLmZlZWRiYWNrcy5sZW5ndGg+MClcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1wiJytTdHJpbmcuZnJvbUNoYXJDb2RlKG51bSArIFwiQVwiLmNoYXJDb2RlQXQoKSkrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnXCIgaXMgbm90IGNvcnJlY3QgPGJyLz4mbmJzcDs8c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmZlZWRiYWNrc1tudW1dLmlubmVySFRNTCsnPC9zcGFuPjxici8+JztcclxuXHRcclxufVxyXG5cclxucC5jb3JyZWN0QW5zd2VyID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBJZiBmZWVkYmFjayBkaXNwbGF5IGl0XHJcblx0aWYodGhpcy5mZWVkYmFja3MubGVuZ3RoPjApXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdcIicrU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmNvcnJlY3QgKyBcIkFcIi5jaGFyQ29kZUF0KCkpK1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0J1wiIGlzIHRoZSBjb3JyZWN0IHJlc3BvbnNlIDxici8+PHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5mZWVkYmFja3NbdGhpcy5jb3JyZWN0XS5pbm5lckhUTUwrJzwvc3Bhbj48YnIvPic7XHJcblx0XHJcblx0XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT0zICYmIHRoaXMuanVzdGlmaWNhdGlvbi52YWx1ZSAhPSAnJylcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1N1Ym1pdHRlZCBUZXh0Ojxici8+PHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK3RoaXMuanVzdGlmaWNhdGlvbi52YWx1ZSsnPC9zcGFuPjxici8+JztcclxuXHRcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTEgJiYgdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlICE9ICcnKVxyXG5cdFx0dGhpcy5mZWVkYmFjay5pbm5lckhUTUwgKz0gJ1N1Ym1pdHRlZCBUZXh0Ojxici8+PHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK3RoaXMuanVzdGlmaWNhdGlvbi52YWx1ZSsnPC9zcGFuPjxici8+JztcclxuXHRcclxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTQpe1xyXG5cdFx0aWYodGhpcy5maWxlSW5wdXQuZmlsZXMubGVuZ3RoPjApXHJcblx0XHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1N1Ym1pdHRlZCBGaWxlczo8YnIvPic7XHJcblx0XHRlbHNlXHJcblx0XHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJyc7XHJcblx0XHRmb3IodmFyIGk9MDtpPHRoaXMuZmlsZUlucHV0LmZpbGVzLmxlbmd0aDtpKyspXHJcblx0XHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MICs9ICc8c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrdGhpcy5maWxlSW5wdXQuZmlsZXNbaV0ubmFtZSsnPC9zcGFuPjxici8+JztcclxuXHR9XHJcbiAgXHJcbiAgaWYodGhpcy5jdXJyZW50U3RhdGUhPVNPTFZFX1NUQVRFLlNPTFZFRCAmJiBcclxuICAgICAoKCh0aGlzLnF1ZXN0aW9uVHlwZT09PTMgfHwgdGhpcy5xdWVzdGlvblR5cGU9PT0xKSAmJiB0aGlzLmp1c3RpZmljYXRpb24udmFsdWUgIT0gJycpIHx8XHJcbiAgICAgICh0aGlzLnF1ZXN0aW9uVHlwZT09PTQgJiYgdGhpcy5maWxlSW5wdXQuZmlsZXMubGVuZ3RoPjApIHx8XHJcbiAgICAgICB0aGlzLnF1ZXN0aW9uVHlwZT09PTIpKXsgXHJcbiAgICAvLyBTZXQgdGhlIHN0YXRlIG9mIHRoZSBxdWVzdGlvbiB0byBjb3JyZWN0XHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0ZSA9IFNPTFZFX1NUQVRFLlNPTFZFRDtcclxuICB9XHJcblx0XHJcbn1cclxuXHJcbnAuZGlzcGxheVdpbmRvd3MgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIEFkZCB0aGUgd2luZG93cyB0byB0aGUgd2luZG93IGRpdlxyXG5cdHZhciB3aW5kb3dOb2RlID0gdGhpcy53aW5kb3dEaXY7XHJcblx0dmFyIGV4aXRCdXR0b24gPSBuZXcgSW1hZ2UoKTtcclxuXHRleGl0QnV0dG9uLnNyYyA9IFwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIjtcclxuXHRleGl0QnV0dG9uLmNsYXNzTmFtZSA9IFwiZXhpdC1idXR0b25cIjtcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdGV4aXRCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCkgeyBxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7IH07XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT01KXtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5tZXNzYWdlKTtcclxuXHQgICAgZXhpdEJ1dHRvbi5zdHlsZS5sZWZ0ID0gXCI3NXZ3XCI7XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMudGFzayk7XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMuYW5zd2VyKTtcclxuXHRcdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQodGhpcy5yZXNvdXJjZSk7XHJcblx0XHRleGl0QnV0dG9uLnN0eWxlLmxlZnQgPSBcIjg1dndcIjtcclxuXHR9XHJcblx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZChleGl0QnV0dG9uKTtcclxuXHRcclxufVxyXG5cclxucC5jcmVhdGVUYXNrV2luZG93ID0gZnVuY3Rpb24oeG1sKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciB0YXNrIHdpbmRvd3NcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgdGFzayB3aW5kb3cgXHJcblx0ICAgIFx0cXVlc3Rpb24udGFzayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLnN0eWxlLnRvcCA9IFwiMTB2aFwiO1xyXG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5zdHlsZS5sZWZ0ID0gXCI1dndcIjtcclxuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIldGl0bGUlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uTmFtZVwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MID0gcXVlc3Rpb24udGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MID0gcXVlc3Rpb24udGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVxdWVzdGlvbiVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25UZXh0XCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG5cdCAgICAgICAgcXVlc3Rpb24uZmVlZGJhY2sgPSBxdWVzdGlvbi50YXNrLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJmZWVkYmFja1wiKVswXTtcclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJ0YXNrV2luZG93Lmh0bWxcIiwgdHJ1ZSk7XHJcblx0cmVxdWVzdC5zZW5kKCk7XHJcbn1cclxuXHJcbnAuY3JlYXRlUmVzb3VyY2VXaW5kb3cgPSBmdW5jdGlvbih4bWwsIHJlc291cmNlRmlsZXMpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgdGVtcGxhdGUgZm9yIHJlc291cmNlIHdpbmRvd3NcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgcmVzb3VyY2Ugd2luZG93IFxyXG5cdCAgICBcdHF1ZXN0aW9uLnJlc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHRcdFx0cXVlc3Rpb24ucmVzb3VyY2UuY2xhc3NOYW1lID0gXCJ3aW5kb3dcIjtcclxuXHRcdFx0cXVlc3Rpb24ucmVzb3VyY2Uuc3R5bGUudG9wID0gXCI1NXZoXCI7XHJcblx0XHRcdHF1ZXN0aW9uLnJlc291cmNlLnN0eWxlLmxlZnQgPSBcIjV2d1wiO1xyXG5cdFx0XHRxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciBpbmRpdmlkdWFsIHJlc291Y2VzIGlmIGFueVxyXG5cdCAgICBcdHZhciByZXNvdXJjZXMgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJyZXNvdXJjZUluZGV4XCIpO1xyXG5cdFx0ICAgIGlmKHJlc291cmNlcy5sZW5ndGggPiAwKXtcclxuXHRcdFx0XHR2YXIgcmVxdWVzdDIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0XHRyZXF1ZXN0Mi5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQgICAgaWYgKHJlcXVlc3QyLnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0Mi5zdGF0dXMgPT0gMjAwKSB7XHJcblx0XHRcdFx0ICAgIFx0XHJcblx0XHRcdFx0ICAgIFx0Ly8gR2V0IHRoZSBodG1sIGZvciBlYWNoIHJlc291cmNlIGFuZCB0aGVuIGFkZCB0aGUgcmVzdWx0IHRvIHRoZSB3aW5kb3dcclxuXHRcdFx0XHQgICAgXHR2YXIgcmVzb3VyY2VIVE1MID0gJyc7XHJcblx0XHRcdFx0XHQgICAgZm9yKHZhciBpPTA7aTxyZXNvdXJjZXMubGVuZ3RoO2krKyl7XHJcblx0XHRcdFx0ICAgIFx0XHR2YXIgY3VyUmVzb3VyY2UgPSByZXF1ZXN0Mi5yZXNwb25zZVRleHQucmVwbGFjZShcIiVpY29uJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS5pY29uKTtcclxuXHRcdFx0XHRcdCAgICBcdGN1clJlc291cmNlID0gY3VyUmVzb3VyY2UucmVwbGFjZShcIiV0aXRsZSVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0udGl0bGUpO1xyXG5cdFx0XHRcdFx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJWxpbmslXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLmxpbmspO1xyXG5cdFx0XHRcdFx0ICAgIFx0cmVzb3VyY2VIVE1MICs9IGN1clJlc291cmNlO1xyXG5cdFx0XHRcdFx0ICAgIH1cclxuXHRcdFx0XHRcdCAgXHRxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwucmVwbGFjZShcIiVyZXNvdXJjZXMlXCIsIHJlc291cmNlSFRNTCk7XHJcblx0XHRcdFx0ICAgICAgICBcclxuXHRcdFx0XHQgICAgfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXF1ZXN0Mi5vcGVuKFwiR0VUXCIsIFwicmVzb3VyY2UuaHRtbFwiLCB0cnVlKTtcclxuXHRcdFx0XHRyZXF1ZXN0Mi5zZW5kKCk7XHJcblx0ICAgIFx0fVxyXG5cdCAgICBcdGVsc2V7XHJcblx0ICAgIFx0XHQvLyBEaXNwbGF5IHRoYXQgdGhlcmUgYXJlbid0IGFueSByZXNvdXJjZXNcclxuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmlubmVySFRNTCA9IHF1ZXN0aW9uLnJlc291cmNlLmlubmVySFRNTC5yZXBsYWNlKFwiJXJlc291cmNlcyVcIiwgXCJObyByZXNvdXJjZXMgaGF2ZSBiZWVuIHByb3ZpZGVkIGZvciB0aGlzIHRhc2suXCIpO1xyXG5cdCAgICBcdFx0cXVlc3Rpb24ucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uc3R5bGUuY29sb3IgPSBcImdyZXlcIjtcclxuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGRkZGRlwiO1xyXG5cdCAgICBcdFx0cXVlc3Rpb24ucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uY2xhc3NOYW1lICs9IFwiLCBjZW50ZXJcIjtcclxuXHQgICAgXHR9XHJcblx0ICAgICAgICBcclxuXHQgICAgfVxyXG5cdH07XHJcblx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIFwicmVzb3VyY2VXaW5kb3cuaHRtbFwiLCB0cnVlKTtcclxuXHRyZXF1ZXN0LnNlbmQoKTtcclxufVxyXG5cclxucC5jcmVhdGVBbnN3ZXJXaW5kb3cgPSBmdW5jdGlvbih4bWwpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgdGVtcGxhdGUgZm9yIGFuc3dlciB3aW5kb3dzXHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIGFuc3dlciB3aW5kb3cgXHJcblx0ICAgIFx0cXVlc3Rpb24uYW5zd2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuY2xhc3NOYW1lID0gXCJ3aW5kb3dcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuc3R5bGUudG9wID0gXCIxMHZoXCI7XHJcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLnN0eWxlLmxlZnQgPSBcIjUwdndcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0ICAgICAgICBcclxuXHQgICAgICAgIC8vIENyZWF0ZSB0aGUgdGV4dCBlbGVtZW50IGlmIGFueVxyXG5cdCAgICAgICAgdmFyIHN1Ym1pdDtcclxuXHQgICAgICAgIGlmKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24pe1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcblx0ICAgICAgICBcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmNsYXNzTmFtZSA9IFwic3VibWl0XCI7XHJcblx0ICAgICAgICBcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmlubmVySFRNTCA9IFwiU3VibWl0XCI7XHJcblx0XHQgICAgICAgIHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdCAgICAgICAgcXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0ICAgICAgICBcdHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcclxuXHRcdCAgICBcdH1cclxuXHRcdCAgICBcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBmdW5jdGlvbigpIHtcclxuXHRcdCAgICBcdFx0aWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbi52YWx1ZS5sZW5ndGggPiAwKVxyXG5cdFx0ICAgIFx0XHRcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHQgICAgXHRcdGVsc2VcclxuXHRcdCAgICBcdFx0XHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHQgICAgXHR9LCBmYWxzZSk7XHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgICBcclxuXHQgICAgICAgIC8vIENyZWF0ZSBhbmQgZ2V0IGFsbCB0aGUgYW5zd2VyIGVsZW1lbnRzXHJcblx0ICAgICAgICB2YXIgYW5zd2VycyA9IFtdO1xyXG5cdCAgICAgICAgdmFyIGFuc3dlcnNYbWwgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhbnN3ZXJcIik7XHJcblx0ICAgICAgICB2YXIgY29ycmVjdCA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJjb3JyZWN0QW5zd2VyXCIpKTtcclxuXHQgICAgICAgIGZvcih2YXIgaT0wO2k8YW5zd2Vyc1htbC5sZW5ndGg7aSsrKXtcclxuXHQgICAgICAgIFx0aWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbilcclxuXHQgICAgICAgIFx0XHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHQgICAgICAgIFx0YW5zd2Vyc1tpXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcblx0ICAgICAgICBcdGlmKGNvcnJlY3Q9PT1pKVxyXG5cdCAgICAgICAgXHRcdGFuc3dlcnNbaV0uY2xhc3NOYW1lID0gXCJjb3JyZWN0XCI7XHJcblx0ICAgICAgICBcdGVsc2VcclxuXHQgICAgICAgIFx0XHRhbnN3ZXJzW2ldLmNsYXNzTmFtZSA9IFwid3JvbmdcIjtcclxuXHQgICAgICAgIFx0YW5zd2Vyc1tpXS5pbm5lckhUTUwgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgKyBcIkFcIi5jaGFyQ29kZUF0KCkpK1wiLiBcIithbnN3ZXJzWG1sW2ldLmlubmVySFRNTDtcclxuXHQgICAgICAgIH1cclxuXHQgICAgICAgIFxyXG5cdCAgICAgICAgLy8gQ3JlYXRlIHRoZSBldmVudHMgZm9yIHRoZSBhbnN3ZXJzXHJcblx0ICAgICAgICBmb3IodmFyIGk9MDtpPGFuc3dlcnMubGVuZ3RoO2krKyl7XHJcblx0ICAgICAgICBcdGlmKGFuc3dlcnNbaV0uY2xhc3NOYW1lID09IFwid3JvbmdcIil7XHJcblx0ICAgICAgICBcdFx0YW5zd2Vyc1tpXS5udW0gPSBpO1xyXG4gICAgICAgICAgICAgIGFuc3dlcnNbaV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcclxuXHQgICAgICAgIFx0XHRcdHF1ZXN0aW9uLndyb25nQW5zd2VyKHRoaXMubnVtKTtcclxuXHQgICAgICAgIFx0XHR9O1xyXG5cdCAgICAgICAgXHR9XHJcblx0ICAgICAgICBcdGVsc2V7XHJcblx0ICAgICAgICBcdFx0YW5zd2Vyc1tpXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8YW5zd2Vycy5sZW5ndGg7aisrKVxyXG4gICAgICAgICAgICAgICAgICBhbnN3ZXJzW2pdLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24pXHJcbiAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgcXVlc3Rpb24uY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgICAgICAgIH07XHJcblx0ICAgICAgICBcdH1cclxuXHQgICAgICAgIH1cclxuXHQgICAgICAgIFxyXG5cdCAgICAgICAgLy8gQWRkIHRoZSBhbnN3ZXJzIHRvIHRoZSB3aW5kb3dcclxuICAgICAgICAgIGZvcih2YXIgaT0wO2k8YW5zd2Vycy5sZW5ndGg7aSsrKVxyXG4gICAgICAgICAgICBxdWVzdGlvbi5hbnN3ZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uYXBwZW5kQ2hpbGQoYW5zd2Vyc1tpXSk7XHJcblx0ICAgICAgICBpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKXtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24uYW5zd2VyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLmFwcGVuZENoaWxkKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24pO1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi5hbnN3ZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uYXBwZW5kQ2hpbGQocXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQpO1xyXG5cdCAgICAgICAgfVxyXG5cdCAgICB9XHJcblx0fVxyXG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcImFuc3dlcldpbmRvdy5odG1sXCIsIHRydWUpO1xyXG5cdHJlcXVlc3Quc2VuZCgpO1xyXG59XHJcblxyXG5wLmNyZWF0ZUZpbGVXaW5kb3cgPSBmdW5jdGlvbigpe1xyXG5cdFxyXG5cdC8vIEdldCB0aGUgdGVtcGxhdGUgZm9yIGZpbGUgd2luZG93c1xyXG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdCAgICBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09IDQgJiYgcmVxdWVzdC5zdGF0dXMgPT0gMjAwKSB7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSBmaWxlIHdpbmRvdyBcclxuXHQgICAgXHRxdWVzdGlvbi5hbnN3ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5zdHlsZS50b3AgPSBcIjEwdmhcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuc3R5bGUubGVmdCA9IFwiNTB2d1wiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuXHRcdCAgICBxdWVzdGlvbi5maWxlSW5wdXQgPSBxdWVzdGlvbi5hbnN3ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKVswXTtcclxuXHRcdCAgICBxdWVzdGlvbi5maWxlSW5wdXQub25jaGFuZ2UgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHQgICAgcXVlc3Rpb24uY29ycmVjdEFuc3dlcigpO1xyXG5cdCAgICAgICAgfTtcclxuXHQgICAgICAgIFxyXG5cdCAgICB9XHJcblx0fVxyXG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcImZpbGVXaW5kb3cuaHRtbFwiLCB0cnVlKTtcclxuXHRyZXF1ZXN0LnNlbmQoKTtcclxufVxyXG5cclxucC5jcmVhdGVNZXNzYWdlV2luZG93ID0gZnVuY3Rpb24oeG1sKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciBmaWxlIHdpbmRvd3NcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgZmlsZSB3aW5kb3cgXHJcblx0ICAgIFx0cXVlc3Rpb24ubWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2Uuc3R5bGUudG9wID0gXCIxMHZoXCI7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5zdHlsZS5sZWZ0ID0gXCI0MHZ3XCI7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuXHRcdCAgICBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTCA9IHF1ZXN0aW9uLm1lc3NhZ2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIldGl0bGUlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uTmFtZVwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuXHRcdCAgICBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTCA9IHF1ZXN0aW9uLm1lc3NhZ2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIlaW5zdHJ1Y3Rpb25zJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnN0cnVjdGlvbnNcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXF1ZXN0aW9uJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblRleHRcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblx0ICAgICAgICBxdWVzdGlvbi5tZXNzYWdlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpWzBdLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24uY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuU09MVkVEO1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XHJcblx0ICAgICAgICB9O1xyXG5cclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJtZXNzYWdlV2luZG93Lmh0bWxcIiwgdHJ1ZSk7XHJcblx0cmVxdWVzdC5zZW5kKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XHJcbm1vZHVsZS5leHBvcnRzLlNPTFZFX1NUQVRFID0gU09MVkVfU1RBVEU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoXCIuL3F1ZXN0aW9uLmpzXCIpO1xyXG5cclxuLy8gQ3JlYXRlcyBhIGNhdGVnb3J5IHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIGZyb20gdGhlIGdpdmVuIHhtbFxyXG5mdW5jdGlvbiBSZXNvdXJjZSh4bWwsIHVybCl7XHJcblx0XHJcblx0Ly8gRmlyc3QgZ2V0IHRoZSBpY29uXHJcblx0ICB2YXIgdHlwZSA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKTtcclxuXHQgIHN3aXRjaCh0eXBlKXtcclxuXHQgICAgY2FzZSAwOlxyXG5cdCAgICAgIHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlRmlsZS5wbmcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgICBjYXNlIDE6XHJcblx0ICAgICAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VMaW5rLnBuZyc7XHJcblx0ICAgICAgYnJlYWs7XHJcblx0ICAgIGRlZmF1bHQ6XHJcblx0ICAgICAgdGhpcy5pY29uID0gJyc7XHJcblx0ICAgICAgYnJlYWs7XHJcblx0ICB9XHJcblxyXG5cdCAgLy8gTmV4dCBnZXQgdGhlIHRpdGxlXHJcblx0ICB0aGlzLnRpdGxlID0geG1sLmdldEF0dHJpYnV0ZShcInRleHRcIik7XHJcblxyXG5cdCAgLy8gTGFzdCBnZXQgdGhlIGxpbmtcclxuXHQgIGlmKHR5cGU9PTEpXHJcblx0ICAgIHRoaXMubGluayA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpO1xyXG5cdCAgZWxzZVxyXG5cdCAgICB0aGlzLmxpbmsgPSB1cmwrJ2Fzc2V0cy9maWxlcy8nK3htbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpLnJlcGxhY2UoLyAvZywgJyUyMCcpO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxuXHJcbi8vTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gcmV0dXJucyBtb3VzZSBwb3NpdGlvbiBpbiBsb2NhbCBjb29yZGluYXRlIHN5c3RlbSBvZiBlbGVtZW50XHJcbm0uZ2V0TW91c2UgPSBmdW5jdGlvbihlKXtcclxuICAgIHJldHVybiBuZXcgUG9pbnQoKGUucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0KSwgKGUucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3ApKTtcclxufVxyXG5cclxuLy9yZXR1cm5zIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIHJhdGlvIGl0IGhhcyB3aXRoIGEgc3BlY2lmaWMgcmFuZ2UgXCJtYXBwZWRcIiB0byBhIGRpZmZlcmVudCByYW5nZVxyXG5tLm1hcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4xLCBtYXgxLCBtaW4yLCBtYXgyKXtcclxuICAgIHJldHVybiBtaW4yICsgKG1heDIgLSBtaW4yKSAqICgodmFsdWUgLSBtaW4xKSAvIChtYXgxIC0gbWluMSkpO1xyXG59XHJcblxyXG4vL2lmIGEgdmFsdWUgaXMgaGlnaGVyIG9yIGxvd2VyIHRoYW4gdGhlIG1pbiBhbmQgbWF4LCBpdCBpcyBcImNsYW1wZWRcIiB0byB0aGF0IG91dGVyIGxpbWl0XHJcbm0uY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xyXG59XHJcblxyXG4vL2RldGVybWluZXMgd2hldGhlciB0aGUgbW91c2UgaXMgaW50ZXJzZWN0aW5nIHRoZSBhY3RpdmUgZWxlbWVudFxyXG5tLm1vdXNlSW50ZXJzZWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUsIHBFbGVtZW50LCBwT2Zmc2V0dGVyLCBwU2NhbGUpe1xyXG4gICAgaWYocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54ICsgcE9mZnNldHRlci54ID4gKHBFbGVtZW50LnBvc2l0aW9uLnggLSAocFNjYWxlKnBFbGVtZW50LndpZHRoKS8yKSAmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggKyBwT2Zmc2V0dGVyLnggPCAocEVsZW1lbnQucG9zaXRpb24ueCArIChwU2NhbGUqcEVsZW1lbnQud2lkdGgpLzIpKXtcclxuICAgICAgICBpZihwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyBwT2Zmc2V0dGVyLnkgPiAocEVsZW1lbnQucG9zaXRpb24ueSAtIChwU2NhbGUqcEVsZW1lbnQuaGVpZ2h0KS8yKSAmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyBwT2Zmc2V0dGVyLnkgPCAocEVsZW1lbnQucG9zaXRpb24ueSArIChwU2NhbGUqcEVsZW1lbnQuaGVpZ2h0KS8yKSl7XHJcbiAgICAgICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIHBNb3VzZVN0YXRlLmhhc1RhcmdldCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgXHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy9wRWxlbWVudC5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gZ2V0cyB0aGUgeG1sIG9iamVjdCBvZiBhIHN0cmluZ1xyXG5tLmdldFhtbCA9IGZ1bmN0aW9uKHhtbCl7XHJcblx0dmFyIHhtbERvYztcclxuXHRpZiAod2luZG93LkRPTVBhcnNlcil7XHJcblx0XHR2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cdFx0eG1sRG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsIFwidGV4dC94bWxcIik7XHJcblx0fVxyXG5cdGVsc2V7IC8vIElFXHJcblx0XHR4bWxEb2MgPSBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxET01cIik7XHJcblx0XHR4bWxEb2MuYXN5bmMgPSBmYWxzZTtcclxuXHRcdHhtbERvYy5sb2FkWE1MKHhtbCk7XHJcblx0fVxyXG5cdHJldHVybiB4bWxEb2M7XHJcbn0iXX0=

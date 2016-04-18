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




},{"./modules/game.js":8,"./modules/mouseState.js":11,"./modules/point.js":12}],2:[function(require,module,exports){
"use strict";
var Utilities = require('./utilities.js');
var Point = require('./point.js');
var Question = require("./question.js");
var Constants = require("./constants.js");
var DrawLib = require("./drawlib.js");

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
	
    // Draw the background of the board
    //DrawLib.rect(ctx, 0, 0, Constants.boardSize.x, Constants.boardSize.y, "#D3B185");
    DrawLib.strokeRect(ctx, -Constants.boardOutline, -Constants.boardOutline, Constants.boardSize.x+Constants.boardOutline, Constants.boardSize.z+Constants.boardOutline, Constants.boardOutline, "#CB9966");
    
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
    
},{"./constants.js":5,"./drawlib.js":7,"./point.js":12,"./question.js":13,"./utilities.js":15}],3:[function(require,module,exports){
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
},{"./question.js":13}],5:[function(require,module,exports){
"use strict";
var Point = require('./point.js');

//Module export
var m = module.exports;

// The size of the board in game units at 100% zoom
m.boardSize = new Point(1920, 1080);

//The size of the board outline in game units at 100% zoom
m.boardOutline = 10;

// The scale of the board to game view at 100% zoom
m.boardScale = 2;

// The max size the of a dimension of a lesson node
m.maxDimension = 100;
},{"./point.js":12}],6:[function(require,module,exports){
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

m.strokeRect = function(ctx, x, y, w, h, col, line, centerOrigin) {
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
},{"./board.js":2,"./drawLib.js":6,"./iparDataParser.js":9,"./lessonNode.js":10,"./point.js":12,"./utilities.js":15}],9:[function(require,module,exports){
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
},{"./category.js":4,"./resources.js":14,"./utilities.js":15}],10:[function(require,module,exports){
"use strict";
var DrawLib = require('./drawLib.js');
var Question = require("./question.js");
var Constants = require("./constants.js");

//parameter is a point that denotes starting position
function lessonNode(startPosition, imagePath, pQuestion){
    
    this.position = startPosition.mult(Constants.boardSize);
    this.dragLocation = undefined;
    this.mouseOver = false;
    this.dragging = false;
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
        //too small?
        if(that.width < Constants.maxDimension && that.height < Constants.maxDimension){
            var x;
            if(that.width > that.height){
                x = Constants.maxDimension / that.width;
            }
            else{
                x = Constants.maxDimension / that.height;
            }
            that.width = that.width * x;
            that.height = that.height * x;
        }
        if(that.width > Constants.maxDimension || that.height > Constants.maxDimension){
            var x;
            if(that.width > that.height){
                x = that.width / Constants.maxDimension;
            }
            else{
                x = that.height / Constants.maxDimension;
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
    ctx.drawImage(this.image, this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
    
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
	ctx.arc(this.position.x - this.width/2 + 15, this.position.y - this.height/2 + 15, 6, 0, 2*Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    
    ctx.restore();
};

p.click = function(mouseState){
    this.question.displayWindows();
}

module.exports = lessonNode;
},{"./constants.js":5,"./drawLib.js":6,"./question.js":13}],11:[function(require,module,exports){
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
function point(pX, pY){
    this.x = pX;
    this.y = pY;
}

var p = point.prototype;

p.add = function(pX, pY){
	if(pY){
		this.x += pX;
		this.y += pY;
	}
	else{
		this.x += pX.x;
		this.y += pX.y;
	}
}

p.mult = function(pX, pY){
	if(pY){
		this.x *= pX;
		this.y *= pY;
	}
	else{
		this.x *= pX.x;
		this.y *= pX.y;
	}
}

p.scale = function(scale){
	this.x *= scale;
	this.y *= scale;
}

module.exports = point;
},{}],13:[function(require,module,exports){
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
},{"./constants.js":5,"./utilities.js":15}],14:[function(require,module,exports){
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
	  if(type>0)
	    this.link = xml.getAttribute("link");
	  else
	    this.link = url+'assets/files/'+xml.getAttribute("link").replace(/ /g, '%20');
    
}

module.exports = Resource;
},{"./question.js":13}],15:[function(require,module,exports){
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
<<<<<<< HEAD
},{"./point.js":12}]},{},[1,2,3,4,5,7,8,9,10,11,12,13,14,15])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib2FyZC9qcy9tYWluLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9ib2FyZC5qcyIsImJvYXJkL2pzL21vZHVsZXMvYnV0dG9uLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9jYXRlZ29yeS5qcyIsImJvYXJkL2pzL21vZHVsZXMvY29uc3RhbnRzLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9kcmF3TGliLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9nYW1lLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9pcGFyRGF0YVBhcnNlci5qcyIsImJvYXJkL2pzL21vZHVsZXMvbGVzc29uTm9kZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvbW91c2VTdGF0ZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvcG9pbnQuanMiLCJib2FyZC9qcy9tb2R1bGVzL3F1ZXN0aW9uLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9yZXNvdXJjZXMuanMiLCJib2FyZC9qcy9tb2R1bGVzL3V0aWxpdGllcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG4vL2ltcG9ydHNcclxudmFyIEdhbWUgPSByZXF1aXJlKCcuL21vZHVsZXMvZ2FtZS5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL21vZHVsZXMvcG9pbnQuanMnKTtcclxudmFyIE1vdXNlU3RhdGUgPSByZXF1aXJlKCcuL21vZHVsZXMvbW91c2VTdGF0ZS5qcycpO1xyXG5cclxuLy9nYW1lIG9iamVjdHNcclxudmFyIGdhbWU7XHJcbnZhciBjYW52YXM7XHJcbnZhciBjdHg7XHJcblxyXG4vLyB3aW5kb3cgZGl2IGFuZCBpZiBwYXVzZWRcclxudmFyIHdpbmRvd0RpdjtcclxudmFyIHdpbmRvd0ZpbG07XHJcbnZhciBwYXVzZWRUaW1lID0gMDtcclxuXHJcbi8vcmVzcG9uc2l2ZW5lc3NcclxudmFyIGNlbnRlcjtcclxuXHJcbi8vbW91c2UgaGFuZGxpbmdcclxudmFyIG1vdXNlUG9zaXRpb247XHJcbnZhciByZWxhdGl2ZU1vdXNlUG9zaXRpb247XHJcbnZhciBtb3VzZURvd247XHJcbnZhciBtb3VzZUluO1xyXG52YXIgbW91c2VEb3duVGltZXI7XHJcbnZhciBtb3VzZUNsaWNrZWQ7XHJcbnZhciBtYXhDbGlja0R1cmF0aW9uOyAvLyBtaWxsaXNlY29uZHNcclxuXHJcbi8vcGVyc2lzdGVudCB1dGlsaXRpZXNcclxudmFyIHByZXZUaW1lOyAvLyBkYXRlIGluIG1pbGxpc2Vjb25kc1xyXG52YXIgZHQ7IC8vIGRlbHRhIHRpbWUgaW4gbWlsbGlzZWNvbmRzXHJcblxyXG4vL2ZpcmVzIHdoZW4gdGhlIHdpbmRvdyBsb2Fkc1xyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oZSl7XHJcbiAgICBpbml0aWFsaXplVmFyaWFibGVzKCk7XHJcbiAgICBsb29wKCk7XHJcbn1cclxuXHJcbi8vaW5pdGlhbGl6YXRpb24sIG1vdXNlIGV2ZW50cywgYW5kIGdhbWUgaW5zdGFudGlhdGlvblxyXG5mdW5jdGlvbiBpbml0aWFsaXplVmFyaWFibGVzKCl7XHJcblx0d2luZG93RGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvdycpO1xyXG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xyXG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXMub2Zmc2V0V2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcclxuICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIERpbWVuc2lvbnM6IFwiICsgY2FudmFzLndpZHRoICsgXCIsIFwiICsgY2FudmFzLmhlaWdodCk7XHJcbiAgICBcclxuXHR3aW5kb3dGaWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvd0ZsaW0nKTtcclxuXHR3aW5kb3dGaWxtLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgd2luZG93RGl2LmlubmVySFRNTCA9ICcnOyB9O1xyXG4gICAgXHJcbiAgICBtb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcclxuICAgIFxyXG4gICAgLy9ldmVudCBsaXN0ZW5lcnMgZm9yIG1vdXNlIGludGVyYWN0aW9ucyB3aXRoIHRoZSBjYW52YXNcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIHZhciBib3VuZFJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChlLmNsaWVudFggLSBib3VuZFJlY3QubGVmdCwgZS5jbGllbnRZIC0gYm91bmRSZWN0LnRvcCk7XHJcbiAgICAgICAgcmVsYXRpdmVNb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KG1vdXNlUG9zaXRpb24ueCAtIChjYW52YXMub2Zmc2V0V2lkdGgvMi4wKSwgbW91c2VQb3NpdGlvbi55IC0gKGNhbnZhcy5vZmZzZXRIZWlnaHQvMi4wKSk7ICAgICAgICBcclxuICAgIH0pO1xyXG4gICAgbW91c2VEb3duID0gZmFsc2U7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBtb3VzZURvd24gPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgbW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIG1vdXNlSW4gPSBmYWxzZTtcclxuICAgIG1vdXNlRG93blRpbWVyID0gMDtcclxuICAgIG1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgbWF4Q2xpY2tEdXJhdGlvbiA9IDIwMDtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIG1vdXNlSW4gPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIG1vdXNlSW4gPSBmYWxzZTtcclxuICAgICAgICBtb3VzZURvd24gPSBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBwcmV2VGltZSA9IERhdGUubm93KCk7XHJcbiAgICBkdCA9IDA7XHJcbiAgICBcclxuICAgIGdhbWUgPSBuZXcgR2FtZShsb2NhbFN0b3JhZ2VbJ2Nhc2VGaWxlcyddLCB3aW5kb3dEaXYpO1xyXG59XHJcblxyXG4vL2ZpcmVzIG9uY2UgcGVyIGZyYW1lXHJcbmZ1bmN0aW9uIGxvb3AoKXtcclxuXHQvLyBsb29wXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3AuYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIHVwZGF0ZSBkZWx0YSB0aW1lXHJcbiAgICBkdCA9IERhdGUubm93KCkgLSBwcmV2VGltZTtcclxuICAgIHByZXZUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgIFxyXG4gICAgLy8gY2hlY2sgbW91c2UgY2xpY2tcclxuICAgIG1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgaWYgKG1vdXNlRG93bikgeyBtb3VzZURvd25UaW1lciArPSBkdDsgfVxyXG4gICAgZWxzZSB7IGlmIChtb3VzZURvd25UaW1lciA+IDAgJiYgbW91c2VEb3duVGltZXIgPCBtYXhDbGlja0R1cmF0aW9uKSB7IG1vdXNlQ2xpY2tlZCA9IHRydWU7IH0gbW91c2VEb3duVGltZXIgPSAwOyB9XHJcbiAgICBcclxuICAgIC8vIHVwZGF0ZSBnYW1lXHJcbiAgICBnYW1lLnVwZGF0ZShjdHgsIGNhbnZhcywgZHQsIG5ldyBNb3VzZVN0YXRlKG1vdXNlUG9zaXRpb24sIHJlbGF0aXZlTW91c2VQb3NpdGlvbiwgbW91c2VEb3duLCBtb3VzZUluLCBtb3VzZUNsaWNrZWQpKTtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgaWYgc2hvdWxkIHBhdXNlXHJcbiAgICBpZihnYW1lLmFjdGl2ZSAmJiB3aW5kb3dEaXYuaW5uZXJIVE1MIT0nJyAmJiBwYXVzZWRUaW1lKys+Myl7XHJcbiAgICBcdGdhbWUuYWN0aXZlID0gZmFsc2U7XHJcbiAgICBcdHdpbmRvd0ZpbG0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHBhdXNlZFRpbWUhPTAgJiYgd2luZG93RGl2LmlubmVySFRNTD09Jycpe1xyXG4gICAgXHRwYXVzZWRUaW1lID0gMDtcclxuICAgIFx0Z2FtZS5hY3RpdmUgPSB0cnVlO1xyXG4gICAgXHR3aW5kb3dGaWxtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vbGlzdGVucyBmb3IgY2hhbmdlcyBpbiBzaXplIG9mIHdpbmRvdyBhbmQgYWRqdXN0cyB2YXJpYWJsZXMgYWNjb3JkaW5nbHlcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXMub2Zmc2V0V2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcclxuICAgIGNlbnRlciA9IG5ldyBQb2ludChjYW52YXMud2lkdGggLyAyLCBjYW52YXMuaGVpZ2h0IC8gMik7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIERpbWVuc2lvbnM6IFwiICsgY2FudmFzLndpZHRoICsgXCIsIFwiICsgY2FudmFzLmhlaWdodCk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vdXRpbGl0aWVzLmpzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKFwiLi9jb25zdGFudHMuanNcIik7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZShcIi4vZHJhd2xpYi5qc1wiKTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIGJvYXJkKHN0YXJ0UG9zaXRpb24sIGxlc3Nvbk5vZGVzKXtcclxuICAgIHRoaXMucG9zaXRpb24gPSBzdGFydFBvc2l0aW9uO1xyXG4gICAgdGhpcy5sZXNzb25Ob2RlQXJyYXkgPSBsZXNzb25Ob2RlcztcclxuICAgIHRoaXMuYm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XHJcbiAgICB0aGlzLnByZXZCb2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxufVxyXG5cclxuYm9hcmQuZHJhd0xpYiA9IHVuZGVmaW5lZDtcclxuXHJcbi8vcHJvdG90eXBlXHJcbnZhciBwID0gYm9hcmQucHJvdG90eXBlO1xyXG5cclxucC5tb3ZlID0gZnVuY3Rpb24ocFgsIHBZKXtcclxuICAgIHRoaXMucG9zaXRpb24ueCArPSBwWDtcclxuICAgIHRoaXMucG9zaXRpb24ueSArPSBwWTtcclxuICAgIHRoaXMuYm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XHJcbiAgICB0aGlzLnByZXZCb2FyZE9mZnNldCA9IHt4OjAseTowfTtcclxufTtcclxuXHJcbnAuYWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUpIHtcclxuXHRcclxuXHQvLyBmb3IgZWFjaCAgbm9kZVxyXG4gICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG4gICAgXHR2YXIgYWN0aXZlTm9kZSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldOyBcclxuXHRcdC8vIGhhbmRsZSBzb2x2ZWQgcXVlc3Rpb25cclxuXHRcdGlmIChhY3RpdmVOb2RlLmN1cnJlbnRTdGF0ZSAhPSBRdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQgJiYgYWN0aXZlTm9kZS5xdWVzdGlvbi5jdXJyZW50U3RhdGUgPT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEKSB7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyB1cGRhdGUgZWFjaCBjb25uZWN0aW9uJ3MgY29ubmVjdGlvbiBudW1iZXJcclxuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBhY3RpdmVOb2RlLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKVxyXG5cdFx0XHRcdHRoaXMubGVzc29uTm9kZUFycmF5W2FjdGl2ZU5vZGUucXVlc3Rpb24uY29ubmVjdGlvbnNbal0gLSAxXS5jb25uZWN0aW9ucysrO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gVXBkYXRlIHRoZSBub2RlJ3Mgc3RhdGVcclxuXHRcdFx0YWN0aXZlTm9kZS5jdXJyZW50U3RhdGUgPSBhY3RpdmVOb2RlLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0fVxyXG4gICAgXHJcbiAgICAvLyBob3ZlciBzdGF0ZXNcclxuXHQvL2Zvcih2YXIgaSA9IDA7IGkgPCBib2FyZEFycmF5Lmxlbmd0aDsgaSsrKXtcclxuXHRcdC8vIGxvb3AgdGhyb3VnaCBsZXNzb24gbm9kZXMgdG8gY2hlY2sgZm9yIGhvdmVyXHJcblx0XHQvLyB1cGRhdGUgYm9hcmRcclxuXHRcdFxyXG5cdHZhciBub2RlQ2hvc2VuID0gZmFsc2U7XHJcblx0Zm9yICh2YXIgaT10aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XHJcblx0XHRpZiAodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uZHJhZ2dpbmcpIHtcclxuXHRcdFx0Ly9ub2RlQ2hvc2VuID0gdHJ1ZTtcclxuXHRcdFx0cE1vdXNlU3RhdGUuaGFzVGFyZ2V0ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0XHJcblx0Zm9yICh2YXIgaT10aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XHJcblx0XHR2YXIgbE5vZGUgPSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXTtcclxuXHRcdFxyXG5cdFx0aWYgKCFwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0bE5vZGUuZHJhZ1Bvc2l0aW9uID0gdW5kZWZpbmVkOyAvLyBjbGVhciBkcmFnIGJlaGF2aW9yXHJcblx0XHRcdGxOb2RlLmRyYWdnaW5nID0gZmFsc2U7XHJcblx0XHR9IFxyXG5cdFx0XHJcblx0XHRsTm9kZS5tb3VzZU92ZXIgPSBmYWxzZTtcclxuXHRcdFxyXG5cdFx0Ly8gaWYgdGhlcmUgaXMgYWxyZWFkeSBhIHNlbGVjdGVkIG5vZGUsIGRvIG5vdCB0cnkgdG8gc2VsZWN0IGFub3RoZXJcclxuXHRcdGlmIChub2RlQ2hvc2VuKSB7ICBjb250aW51ZTsgfVxyXG5cdFx0XHJcblx0XHQvL2NvbnNvbGUubG9nKFwibm9kZSB1cGRhdGVcIik7XHJcblx0XHQvLyBpZiBob3ZlcmluZywgc2hvdyBob3ZlciBnbG93XHJcblx0XHQvKmlmIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPiBsTm9kZS5wb3NpdGlvbi54LWxOb2RlLndpZHRoLzIgXHJcblx0XHQmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPCBsTm9kZS5wb3NpdGlvbi54K2xOb2RlLndpZHRoLzJcclxuXHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA+IGxOb2RlLnBvc2l0aW9uLnktbE5vZGUuaGVpZ2h0LzJcclxuXHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA8IGxOb2RlLnBvc2l0aW9uLnkrbE5vZGUuaGVpZ2h0LzIpIHsqL1xyXG5cdFx0XHJcblx0XHRcclxuXHRcdGlmIChVdGlsaXRpZXMubW91c2VJbnRlcnNlY3QocE1vdXNlU3RhdGUsbE5vZGUsdGhpcy5ib2FyZE9mZnNldCwxKSkge1xyXG5cdFx0XHRsTm9kZS5tb3VzZU92ZXIgPSB0cnVlO1xyXG5cdFx0XHRub2RlQ2hvc2VuID0gdHJ1ZTtcclxuXHRcdFx0cE1vdXNlU3RhdGUuaGFzVGFyZ2V0ID0gdHJ1ZTtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhwTW91c2VTdGF0ZS5oYXNUYXJnZXQpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlRG93biAmJiAhdGhpcy5wcmV2TW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0XHQvLyBkcmFnXHJcblx0XHRcdFx0bE5vZGUuZHJhZ2dpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdGxOb2RlLmRyYWdQb3NpdGlvbiA9IG5ldyBQb2ludChcclxuXHRcdFx0XHRwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggLSBsTm9kZS5wb3NpdGlvbi54LFxyXG5cdFx0XHRcdHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSAtIGxOb2RlLnBvc2l0aW9uLnlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZUNsaWNrZWQpIHtcclxuXHRcdFx0XHQvLyBoYW5kbGUgY2xpY2sgY29kZVxyXG5cdFx0XHRcdGxOb2RlLmNsaWNrKHBNb3VzZVN0YXRlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly8gaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYSBub2RlLCBhbGxvdyB0aGUgbW91c2UgdG8gY29udHJvbCBpdHMgbW92ZW1lbnRcclxuXHRcdGlmIChsTm9kZS5kcmFnZ2luZykge1xyXG5cdFx0XHRsTm9kZS5wb3NpdGlvbi54ID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IC0gbE5vZGUuZHJhZ1Bvc2l0aW9uLng7XHJcblx0XHRcdGxOb2RlLnBvc2l0aW9uLnkgPSBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSBsTm9kZS5kcmFnUG9zaXRpb24ueTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0Ly8gZHJhZyB0aGUgYm9hcmQgYXJvdW5kXHJcblx0aWYgKCFwTW91c2VTdGF0ZS5oYXNUYXJnZXQpIHtcclxuXHRcdGlmIChwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcclxuXHRcdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctd2Via2l0LWdyYWJiaW5nJztcclxuXHRcdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcclxuXHRcdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcblx0XHRcdGlmICghdGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkKSB7XHJcblx0XHRcdFx0dGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbjtcclxuXHRcdFx0XHR0aGlzLnByZXZCb2FyZE9mZnNldC54ID0gdGhpcy5ib2FyZE9mZnNldC54O1xyXG5cdFx0XHRcdHRoaXMucHJldkJvYXJkT2Zmc2V0LnkgPSB0aGlzLmJvYXJkT2Zmc2V0Lnk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5ib2FyZE9mZnNldC54ID0gdGhpcy5wcmV2Qm9hcmRPZmZzZXQueCAtIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueCk7XHJcblx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA+IHRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLm1heEJvYXJkV2lkdGgvMjtcclxuXHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC54IDwgLTEqdGhpcy5tYXhCb2FyZFdpZHRoLzIpIHRoaXMuYm9hcmRPZmZzZXQueCA9IC0xKnRoaXMubWF4Qm9hcmRXaWR0aC8yO1xyXG5cdFx0XHRcdHRoaXMuYm9hcmRPZmZzZXQueSA9IHRoaXMucHJldkJvYXJkT2Zmc2V0LnkgLSAocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IC0gdGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkLnkpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmJvYXJkT2Zmc2V0LnkgPiB0aGlzLm1heEJvYXJkSGVpZ2h0LzIpIHRoaXMuYm9hcmRPZmZzZXQueSA9IHRoaXMubWF4Qm9hcmRIZWlnaHQvMjtcclxuXHRcdFx0XHRpZiAodGhpcy5ib2FyZE9mZnNldC55IDwgLTEqdGhpcy5tYXhCb2FyZEhlaWdodC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnkgPSAtMSp0aGlzLm1heEJvYXJkSGVpZ2h0LzI7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMubW91c2VTdGFydERyYWdCb2FyZCA9IHVuZGVmaW5lZDtcclxuXHRcdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICcnO1xyXG5cdFx0fVxyXG4gICAgfVxyXG4gICAgXHJcblx0dGhpcy5wcmV2TW91c2VTdGF0ZSA9IHBNb3VzZVN0YXRlO1xyXG59XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgsIGNhbnZhcywgY2VudGVyKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBcclxuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLmJvYXJkT2Zmc2V0O1xyXG4gICAgLy90cmFuc2xhdGUgdG8gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuXHJcbiAgICBjdHgudHJhbnNsYXRlKGNlbnRlci54IC0gdGhpcy5wb3NpdGlvbi54LCBjZW50ZXIueSAtIHRoaXMucG9zaXRpb24ueSk7XHJcbiAgICAvL2N0eC50cmFuc2xhdGUodGhpcy5ib2FyZE9mZnNldC54LHRoaXMuYm9hcmRPZmZzZXQueSk7XHJcblx0XHJcbiAgICAvLyBEcmF3IHRoZSBiYWNrZ3JvdW5kIG9mIHRoZSBib2FyZFxyXG4gICAgLy9EcmF3TGliLnJlY3QoY3R4LCAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngsIENvbnN0YW50cy5ib2FyZFNpemUueSwgXCIjRDNCMTg1XCIpO1xyXG4gICAgRHJhd0xpYi5zdHJva2VSZWN0KGN0eCwgLUNvbnN0YW50cy5ib2FyZE91dGxpbmUsIC1Db25zdGFudHMuYm9hcmRPdXRsaW5lLCBDb25zdGFudHMuYm9hcmRTaXplLngrQ29uc3RhbnRzLmJvYXJkT3V0bGluZSwgQ29uc3RhbnRzLmJvYXJkU2l6ZS56K0NvbnN0YW50cy5ib2FyZE91dGxpbmUsIENvbnN0YW50cy5ib2FyZE91dGxpbmUsIFwiI0NCOTk2NlwiKTtcclxuICAgIFxyXG5cdC8vIGRyYXcgdGhlIG5vZGVzXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG4gICAgXHJcbiAgICBcdC8vIHRlbXBvcmFyaWx5IGhpZGUgYWxsIGJ1dCB0aGUgZmlyc3QgcXVlc3Rpb25cclxuXHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQgPiB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5saW5rc0F3YXlGcm9tT3JpZ2luKSBjb250aW51ZTtcclxuICAgIFx0XHJcbiAgICBcdC8vIGRyYXcgdGhlIG5vZGUgaXRzZWxmXHJcbiAgICAgICAgdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uZHJhdyhjdHgsIGNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG5cdC8vIGRyYXcgdGhlIGxpbmVzXHJcblx0Zm9yKHZhciBpPTA7IGk8dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHJcblx0XHQvLyBvbmx5IHNob3cgbGluZXMgZnJvbSBzb2x2ZWQgcXVlc3Rpb25zXHJcblx0XHRpZiAodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY3VycmVudFN0YXRlIT1RdWVzdGlvbi5TT0xWRV9TVEFURS5TT0xWRUQpIGNvbnRpbnVlO1xyXG5cdFx0XHJcblx0XHQvLyBnZXQgdGhlIHBpbiBwb2lzdGlvbiBpbiB0aGUgY29ybmVyIHdpdGggbWFyZ2luIDUsNVxyXG4gICAgICAgIHZhciBwaW5YID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucG9zaXRpb24ueCAtIHRoaXMubGVzc29uTm9kZUFycmF5W2ldLndpZHRoKnRoaXMubGVzc29uTm9kZUFycmF5W2ldLnNjYWxlRmFjdG9yLzIgKyAxNTtcclxuICAgICAgICB2YXIgcGluWSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnBvc2l0aW9uLnkgLSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5oZWlnaHQqdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uc2NhbGVGYWN0b3IvMiArIDE1O1xyXG5cdFx0XHJcblx0XHQvLyBzZXQgbGluZSBzdHlsZVxyXG5cdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJyZ2JhKDAsMCwxMDUsMC4yKVwiO1xyXG5cdFx0Y3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgXHRcclxuXHRcdFx0aWYgKHRoaXMubGVzc29uTm9kZUFycmF5W3RoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zW2pdIC0gMV0ucXVlc3Rpb24uY3VycmVudFN0YXRlPT1RdWVzdGlvbi5TT0xWRV9TVEFURS5ISURERU4pIGNvbnRpbnVlO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHQvLyBnbyB0byB0aGUgaW5kZXggaW4gdGhlIGFycmF5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGNvbm5lY3RlZCBub2RlIG9uIHRoaXMgYm9hcmQgYW5kIHNhdmUgaXRzIHBvc2l0aW9uXHJcbiAgICAgICAgXHQvLyBjb25uZWN0aW9uIGluZGV4IHNhdmVkIGluIHRoZSBsZXNzb25Ob2RlJ3MgcXVlc3Rpb25cclxuICAgICAgICBcdHZhciBjb25uZWN0aW9uID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal0gLSAxXTtcclxuICAgICAgICBcdHZhciBjUG9zID0gY29ubmVjdGlvbi5wb3NpdGlvbjtcclxuICAgICAgICBcdHZhciBjV2lkdGggPSBjb25uZWN0aW9uLndpZHRoO1xyXG4gICAgICAgIFx0dmFyIGNIZWlnaHQgPSBjb25uZWN0aW9uLmhlaWdodDtcclxuICAgICAgICBcdHZhciBjU2NhbGUgPSBjb25uZWN0aW9uLnNjYWxlRmFjdG9yO1xyXG4gICAgICAgIFx0XHJcbiAgICAgICAgXHQvLyBkcmF3IHRoZSBsaW5lXHJcbiAgICAgICAgXHRjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgXHQvLyB0cmFuc2xhdGUgdG8gc3RhcnQgKHBpbilcclxuICAgICAgICBcdGN0eC5tb3ZlVG8ocGluWCxwaW5ZKTtcclxuICAgICAgICBcdGN0eC5saW5lVG8oY1Bvcy54IC0gY1dpZHRoKmNTY2FsZS8yICsgMTUsIGNQb3MueSAtIGNIZWlnaHQqY1NjYWxlLzIgKyAxNSk7XHJcbiAgICAgICAgXHRjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgXHRjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib2FyZDtcclxuXHJcbi8vdGhpcyBpcyBhbiBvYmplY3QgbmFtZWQgQm9hcmQgYW5kIHRoaXMgaXMgaXRzIGphdmFzY3JpcHRcclxuLy92YXIgQm9hcmQgPSByZXF1aXJlKCcuL29iamVjdHMvYm9hcmQuanMnKTtcclxuLy92YXIgYiA9IG5ldyBCb2FyZCgpO1xyXG4gICAgIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBidXR0b24oc3RhcnRQb3NpdGlvbiwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIHRoaXMuY2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XHJcbn1cclxuYnV0dG9uLmRyYXdMaWIgPSB1bmRlZmluZWQ7XHJcblxyXG52YXIgcCA9IGJ1dHRvbi5wcm90b3R5cGU7XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIHZhciBjb2w7XHJcbiAgICBpZih0aGlzLmhvdmVyZWQpe1xyXG4gICAgICAgIGNvbCA9IFwiZG9kZ2VyYmx1ZVwiO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICBjb2wgPSBcImxpZ2h0Ymx1ZVwiO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3IHJvdW5kZWQgY29udGFpbmVyXHJcbiAgICBib2FyZEJ1dHRvbi5kcmF3TGliLnJlY3QoY3R4LCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBjb2wpO1xyXG5cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGJ1dHRvbjsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XHJcblxyXG4vLyBDcmVhdGVzIGEgY2F0ZWdvcnkgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgZnJvbSB0aGUgZ2l2ZW4geG1sXHJcbmZ1bmN0aW9uIENhdGVnb3J5KG5hbWUsIHhtbCwgcmVzb3VyY2VzLCB1cmwsIHdpbmRvd0Rpdil7XHJcblx0XHJcblx0Ly8gU2F2ZSB0aGUgbmFtZVxyXG5cdHRoaXMubmFtZSA9IG5hbWU7XHJcblx0XHJcblx0Ly8gTG9hZCBhbGwgdGhlIHF1ZXN0aW9uc1xyXG5cdHZhciBxdWVzdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xyXG5cdHRoaXMucXVlc3Rpb25zID0gW107XHJcblx0Ly8gY3JlYXRlIHF1ZXN0aW9uc1xyXG5cdGZvciAodmFyIGk9MDsgaTxxdWVzdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBcclxuXHR7XHJcblx0XHQvLyBjcmVhdGUgYSBxdWVzdGlvbiBvYmplY3RcclxuXHRcdHRoaXMucXVlc3Rpb25zW2ldID0gbmV3IFF1ZXN0aW9uKHF1ZXN0aW9uRWxlbWVudHNbaV0sIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpO1xyXG5cdH1cclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhdGVnb3J5OyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XHJcblxyXG4vL01vZHVsZSBleHBvcnRcclxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcclxuXHJcbi8vIFRoZSBzaXplIG9mIHRoZSBib2FyZCBpbiBnYW1lIHVuaXRzIGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkU2l6ZSA9IG5ldyBQb2ludCgxOTIwLCAxMDgwKTtcclxuXHJcbi8vVGhlIHNpemUgb2YgdGhlIGJvYXJkIG91dGxpbmUgaW4gZ2FtZSB1bml0cyBhdCAxMDAlIHpvb21cclxubS5ib2FyZE91dGxpbmUgPSAxMDtcclxuXHJcbi8vIFRoZSBzY2FsZSBvZiB0aGUgYm9hcmQgdG8gZ2FtZSB2aWV3IGF0IDEwMCUgem9vbVxyXG5tLmJvYXJkU2NhbGUgPSAyO1xyXG5cclxuLy8gVGhlIG1heCBzaXplIHRoZSBvZiBhIGRpbWVuc2lvbiBvZiBhIGxlc3NvbiBub2RlXHJcbm0ubWF4RGltZW5zaW9uID0gMTAwOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy9Nb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG5tLmNsZWFyID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoKSB7XHJcbiAgICBjdHguY2xlYXJSZWN0KHgsIHksIHcsIGgpO1xyXG59XHJcblxyXG5tLnJlY3QgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIGNvbCwgY2VudGVyT3JpZ2luKSB7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbDtcclxuICAgIGlmKGNlbnRlck9yaWdpbil7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KHggLSAodyAvIDIpLCB5IC0gKGggLyAyKSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm0uc3Ryb2tlUmVjdCA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgY29sLCBsaW5lLCBjZW50ZXJPcmlnaW4pIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2w7XHJcbiAgICBjdHgubGluZVdpZHRoID0gbGluZTtcclxuICAgIGlmKGNlbnRlck9yaWdpbil7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QoeCAtICh3IC8gMiksIHkgLSAoaCAvIDIpLCB3LCBoKTtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5tLmxpbmUgPSBmdW5jdGlvbihjdHgsIHgxLCB5MSwgeDIsIHkyLCB0aGlja25lc3MsIGNvbG9yKSB7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4Lm1vdmVUbyh4MSwgeTEpO1xyXG4gICAgY3R4LmxpbmVUbyh4MiwgeTIpO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHRoaWNrbmVzcztcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubS5jaXJjbGUgPSBmdW5jdGlvbihjdHgsIHgsIHksIHJhZGl1cywgY29sb3Ipe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGN0eC5hcmMoeCx5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbiAgICBjdHguZmlsbCgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYm9hcmRCdXR0b24oY3R4LCBwb3NpdGlvbiwgd2lkdGgsIGhlaWdodCwgaG92ZXJlZCl7XHJcbiAgICAvL2N0eC5zYXZlKCk7XHJcbiAgICBpZihob3ZlcmVkKXtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJkb2RnZXJibHVlXCI7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImxpZ2h0Ymx1ZVwiO1xyXG4gICAgfVxyXG4gICAgLy9kcmF3IHJvdW5kZWQgY29udGFpbmVyXHJcbiAgICBjdHgucmVjdChwb3NpdGlvbi54IC0gd2lkdGgvMiwgcG9zaXRpb24ueSAtIGhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgIGN0eC5saW5lV2lkdGggPSA1O1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIC8vY3R4LnJlc3RvcmUoKTtcclxufSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgQm9hcmQgPSByZXF1aXJlKCcuL2JvYXJkLmpzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKCcuL2RyYXdMaWIuanMnKTtcclxudmFyIExlc3Nvbk5vZGUgPSByZXF1aXJlKCcuL2xlc3Nvbk5vZGUuanMnKTtcclxudmFyIFV0aWxpdHkgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xyXG52YXIgRGF0YVBhcnNlciA9IHJlcXVpcmUoJy4vaXBhckRhdGFQYXJzZXIuanMnKTtcclxuXHJcbi8vbW91c2UgbWFuYWdlbWVudFxyXG52YXIgbW91c2VTdGF0ZTtcclxudmFyIHByZXZpb3VzTW91c2VTdGF0ZTtcclxudmFyIGRyYWdnaW5nRGlzYWJsZWQ7XHJcbnZhciBtb3VzZVRhcmdldDtcclxudmFyIG1vdXNlU3VzdGFpbmVkRG93bjtcclxuXHJcbi8vcGhhc2UgaGFuZGxpbmdcclxudmFyIHBoYXNlT2JqZWN0O1xyXG5cclxuXHJcbmZ1bmN0aW9uIGdhbWUodXJsLCB3aW5kb3dEaXYpe1xyXG5cdHZhciBnYW1lID0gdGhpcztcclxuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdERhdGFQYXJzZXIucGFyc2VEYXRhKHVybCwgd2luZG93RGl2LCBmdW5jdGlvbihjYXRlZ29yaWVzKXtcclxuXHRcdGdhbWUuY2F0ZWdvcmllcyA9IGNhdGVnb3JpZXM7XHJcblx0XHRnYW1lLmNyZWF0ZUxlc3Nvbk5vZGVzKCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBwID0gZ2FtZS5wcm90b3R5cGU7XHJcblxyXG5wLmNyZWF0ZUxlc3Nvbk5vZGVzID0gZnVuY3Rpb24oKXtcclxuXHR0aGlzLmJvYXJkQXJyYXkgPSBbXTtcclxuXHR2YXIgYm90dG9tQmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJib3R0b21CYXJcIik7XHJcblx0Zm9yKHZhciBpPTA7aTx0aGlzLmNhdGVnb3JpZXMubGVuZ3RoO2krKyl7XHJcblx0XHQvLyBpbml0aWFsaXplIGVtcHR5XHJcblx0XHRcclxuXHRcdHRoaXMubGVzc29uTm9kZXMgPSBbXTtcclxuXHRcdC8vIGFkZCBhIG5vZGUgcGVyIHF1ZXN0aW9uXHJcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0Ly8gY3JlYXRlIGEgbmV3IGxlc3NvbiBub2RlXHJcblx0XHRcdHRoaXMubGVzc29uTm9kZXMucHVzaChuZXcgTGVzc29uTm9kZShuZXcgUG9pbnQodGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXS5wb3NpdGlvblBlcmNlbnRYLCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLnBvc2l0aW9uUGVyY2VudFkpLCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLmltYWdlTGluaywgdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXSApICk7XHJcblx0XHRcdC8vIGF0dGFjaCBxdWVzdGlvbiBvYmplY3QgdG8gbGVzc29uIG5vZGVcclxuXHRcdFx0dGhpcy5sZXNzb25Ob2Rlc1t0aGlzLmxlc3Nvbk5vZGVzLmxlbmd0aC0xXS5xdWVzdGlvbiA9IHRoaXMuY2F0ZWdvcmllc1tpXS5xdWVzdGlvbnNbal07XHJcblx0XHRcclxuXHRcdH1cclxuXHJcblx0XHQvLyBjcmVhdGUgYSBib2FyZFxyXG5cdFx0dGhpcy5ib2FyZEFycmF5LnB1c2gobmV3IEJvYXJkKG5ldyBQb2ludCgwLDApLCB0aGlzLmxlc3Nvbk5vZGVzKSk7XHJcblx0XHR2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkJVVFRPTlwiKTtcclxuXHRcdGJ1dHRvbi5pbm5lckhUTUwgPSB0aGlzLmNhdGVnb3JpZXNbaV0ubmFtZTtcclxuXHRcdHZhciBnYW1lID0gdGhpcztcclxuXHRcdGJ1dHRvbi5vbmNsaWNrID0gKGZ1bmN0aW9uKGkpeyBcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKGdhbWUuYWN0aXZlKVxyXG5cdFx0XHRcdFx0Z2FtZS5hY3RpdmVCb2FyZEluZGV4ID0gaTtcclxuXHRcdH19KShpKTtcclxuXHRcdGJvdHRvbUJhci5hcHBlbmRDaGlsZChidXR0b24pO1xyXG5cdH1cclxuXHR0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPSAwO1xyXG5cdHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxufVxyXG5cclxucC51cGRhdGUgPSBmdW5jdGlvbihjdHgsIGNhbnZhcywgZHQsIHBNb3VzZVN0YXRlKXtcclxuXHRcclxuXHRpZih0aGlzLmFjdGl2ZSl7XHJcblx0ICAgIC8vIG1vdXNlXHJcblx0ICAgIHByZXZpb3VzTW91c2VTdGF0ZSA9IG1vdXNlU3RhdGU7XHJcblx0ICAgIG1vdXNlU3RhdGUgPSBwTW91c2VTdGF0ZTtcclxuXHQgICAgbW91c2VUYXJnZXQgPSAwO1xyXG5cdCAgICBpZih0eXBlb2YgcHJldmlvdXNNb3VzZVN0YXRlID09PSAndW5kZWZpbmVkJyl7XHJcblx0ICAgICAgICBwcmV2aW91c01vdXNlU3RhdGUgPSBtb3VzZVN0YXRlO1xyXG5cdCAgICB9XHJcblx0ICAgIC8vZHJhdyBzdHVmZlxyXG5cdCAgICB0aGlzLmRyYXcoY3R4LCBjYW52YXMpO1xyXG5cdCAgICBcclxuXHQgICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGJvYXJkXHJcblx0ICAgIHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmFjdChwTW91c2VTdGF0ZSk7XHJcblx0fVxyXG59XHJcblxyXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgsIGNhbnZhcyl7XHJcblx0Ly9kcmF3IGRlYnVnIGJhY2tncm91bmRcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBEcmF3TGliLmNsZWFyKGN0eCwgMCwgMCwgY2FudmFzLm9mZnNldFdpZHRoLCBjYW52YXMub2Zmc2V0SGVpZ2h0KTtcclxuICAgIERyYXdMaWIucmVjdChjdHgsIDAsIDAsIGNhbnZhcy5vZmZzZXRXaWR0aCwgY2FudmFzLm9mZnNldEhlaWdodCwgXCJ3aGl0ZVwiLCBmYWxzZSk7XHJcbiAgICBEcmF3TGliLmxpbmUoY3R4LCBjYW52YXMub2Zmc2V0V2lkdGgvMiwgMCwgY2FudmFzLm9mZnNldFdpZHRoLzIsIGNhbnZhcy5vZmZzZXRIZWlnaHQsIDIsIFwibGlnaHRncmF5XCIpO1xyXG4gICAgRHJhd0xpYi5saW5lKGN0eCwgMCwgY2FudmFzLm9mZnNldEhlaWdodC8yLCBjYW52YXMub2Zmc2V0V2lkdGgsIGNhbnZhcy5vZmZzZXRIZWlnaHQvMiwgMiwgXCJsaWdodEdyYXlcIik7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG5cdFxyXG4gICAgLy8gRHJhdyB0aGUgY3VycmVudCBib2FyZFxyXG4gICAgdGhpcy5ib2FyZEFycmF5W3RoaXMuYWN0aXZlQm9hcmRJbmRleF0uZHJhdyhjdHgsIGNhbnZhcywge3g6Y2FudmFzLm9mZnNldFdpZHRoLzIsIHk6Y2FudmFzLm9mZnNldEhlaWdodC8yfSk7XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnYW1lOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgQ2F0ZWdvcnkgPSByZXF1aXJlKFwiLi9jYXRlZ29yeS5qc1wiKTtcclxudmFyIFJlc291cmNlID0gcmVxdWlyZShcIi4vcmVzb3VyY2VzLmpzXCIpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxud2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwgID0gd2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwgfHwgd2luZG93LndlYmtpdFJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkw7XHJcblxyXG4vLyBQYXJzZXMgdGhlIHhtbCBjYXNlIGZpbGVzXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8ga25vd24gdGFnc1xyXG4vKlxyXG5hbnN3ZXJcclxuYnV0dG9uXHJcbmNhdGVnb3J5TGlzdFxyXG5jb25uZWN0aW9uc1xyXG5lbGVtZW50XHJcbmZlZWRiYWNrXHJcbmluc3RydWN0aW9uc1xyXG5yZXNvdXJjZVxyXG5yZXNvdXJjZUxpc3RcclxucmVzb3VyY2VJbmRleFxyXG5zb2Z0d2FyZUxpc3RcclxucXVlc3Rpb25cclxucXVlc3Rpb25UZXh0XHJcbnF1c3Rpb25OYW1lXHJcbiovXHJcblxyXG4vLyBNb2R1bGUgZXhwb3J0XHJcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG4vLyBjb25zdHJ1Y3RvclxyXG5tLnBhcnNlRGF0YSA9IGZ1bmN0aW9uKHVybCwgd2luZG93RGl2LCBjYWxsYmFjaykge1xyXG4gICAgXHJcbiAgICB0aGlzLmNhdGVnb3JpZXMgPSBbXTtcclxuICAgIHRoaXMucXVlc3Rpb25zID0gW107XHJcbiAgICBcclxuXHQvLyBnZXQgWE1MXHJcbiAgICB3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTCh1cmwrJ2FjdGl2ZS9jYXNlRmlsZS5pcGFyZGF0YScsIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0ZmlsZUVudHJ5LmZpbGUoZnVuY3Rpb24oZmlsZSkge1xyXG5cdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuXHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHQvLyBHZXQgdGhlIHJhdyBkYXRhXHJcblx0XHRcdFx0dmFyIHJhd0RhdGEgPSBVdGlsaXRpZXMuZ2V0WG1sKHRoaXMucmVzdWx0KTtcclxuXHRcdFx0XHR2YXIgY2F0ZWdvcmllcyA9IGdldENhdGVnb3JpZXNBbmRRdWVzdGlvbnMocmF3RGF0YSwgdXJsLCB3aW5kb3dEaXYpO1xyXG5cdFx0XHRcdGNhbGxiYWNrKGNhdGVnb3JpZXMpO1xyXG5cdFx0XHQgICBcclxuXHRcdFx0fTtcclxuXHRcdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XHJcblx0XHQgICBcclxuXHRcdH0sIGZ1bmN0aW9uKGUpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhcIkVycm9yOiBcIitlLm1lc3NhZ2UpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbi8vIHRha2VzIHRoZSB4bWwgc3RydWN0dXJlIGFuZCBmaWxscyBpbiB0aGUgZGF0YSBmb3IgdGhlIHF1ZXN0aW9uIG9iamVjdFxyXG5mdW5jdGlvbiBnZXRDYXRlZ29yaWVzQW5kUXVlc3Rpb25zKHJhd0RhdGEsIHVybCwgd2luZG93RGl2KSB7XHJcblx0Ly8gaWYgdGhlcmUgaXMgYSBjYXNlIGZpbGVcclxuXHRpZiAocmF3RGF0YSAhPSBudWxsKSB7XHJcblx0XHRcclxuXHRcdC8vIEZpcnN0IGxvYWQgdGhlIHJlc291cmNlc1xyXG5cdFx0dmFyIHJlc291cmNlRWxlbWVudHMgPSByYXdEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VcIik7XHJcblx0XHR2YXIgcmVzb3VyY2VzID0gW107XHJcblx0XHRmb3IgKHZhciBpPTA7IGk8cmVzb3VyY2VFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHQvLyBMb2FkIGVhY2ggcmVzb3VyY2VcclxuXHRcdFx0cmVzb3VyY2VzW2ldID0gbmV3IFJlc291cmNlKHJlc291cmNlRWxlbWVudHNbaV0sIHVybCk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIFRoZW4gbG9hZCB0aGUgY2F0ZWdvcmllc1xyXG5cdFx0dmFyIGNhdGVnb3J5RWxlbWVudHMgPSByYXdEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIik7XHJcblx0XHR2YXIgY2F0ZWdvcnlOYW1lcyA9IHJhd0RhdGEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXRlZ29yeUxpc3RcIilbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJlbGVtZW50XCIpO1xyXG5cdFx0dmFyIGNhdGVnb3JpZXMgPSBbXTtcclxuXHRcdGZvciAodmFyIGk9MDsgaTxjYXRlZ29yeUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdC8vIExvYWQgZWFjaCBjYXRlZ29yeSAod2hpY2ggbG9hZHMgZWFjaCBxdWVzdGlvbilcclxuXHRcdFx0Y2F0ZWdvcmllc1tpXSA9IG5ldyBDYXRlZ29yeShjYXRlZ29yeU5hbWVzW2ldLmlubmVySFRNTCwgY2F0ZWdvcnlFbGVtZW50c1tpXSwgcmVzb3VyY2VzLCB1cmwsIHdpbmRvd0Rpdik7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2F0ZWdvcmllcztcclxuXHR9XHJcblx0cmV0dXJuIG51bGxcclxufSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4vZHJhd0xpYi5qcycpO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoXCIuL2NvbnN0YW50cy5qc1wiKTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIGxlc3Nvbk5vZGUoc3RhcnRQb3NpdGlvbiwgaW1hZ2VQYXRoLCBwUXVlc3Rpb24pe1xyXG4gICAgXHJcbiAgICB0aGlzLnBvc2l0aW9uID0gc3RhcnRQb3NpdGlvbi5tdWx0KENvbnN0YW50cy5ib2FyZFNpemUpO1xyXG4gICAgdGhpcy5kcmFnTG9jYXRpb24gPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLm1vdXNlT3ZlciA9IGZhbHNlO1xyXG4gICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgdGhpcy50eXBlID0gXCJsZXNzb25Ob2RlXCI7XHJcbiAgICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICB0aGlzLndpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQ7XHJcbiAgICB0aGlzLnF1ZXN0aW9uID0gcFF1ZXN0aW9uO1xyXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IDA7XHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0ZSA9IHRoaXMucXVlc3Rpb24uY3VycmVudFN0YXRlO1xyXG4gICAgXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAvL2ltYWdlIGxvYWRpbmcgYW5kIHJlc2l6aW5nXHJcbiAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoYXQud2lkdGggPSB0aGF0LmltYWdlLm5hdHVyYWxXaWR0aDtcclxuICAgICAgICB0aGF0LmhlaWdodCA9IHRoYXQuaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuICAgICAgICAvL3RvbyBzbWFsbD9cclxuICAgICAgICBpZih0aGF0LndpZHRoIDwgQ29uc3RhbnRzLm1heERpbWVuc2lvbiAmJiB0aGF0LmhlaWdodCA8IENvbnN0YW50cy5tYXhEaW1lbnNpb24pe1xyXG4gICAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcclxuICAgICAgICAgICAgICAgIHggPSBDb25zdGFudHMubWF4RGltZW5zaW9uIC8gdGhhdC53aWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IENvbnN0YW50cy5tYXhEaW1lbnNpb24gLyB0aGF0LmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LndpZHRoID0gdGhhdC53aWR0aCAqIHg7XHJcbiAgICAgICAgICAgIHRoYXQuaGVpZ2h0ID0gdGhhdC5oZWlnaHQgKiB4O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGF0LndpZHRoID4gQ29uc3RhbnRzLm1heERpbWVuc2lvbiB8fCB0aGF0LmhlaWdodCA+IENvbnN0YW50cy5tYXhEaW1lbnNpb24pe1xyXG4gICAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcclxuICAgICAgICAgICAgICAgIHggPSB0aGF0LndpZHRoIC8gQ29uc3RhbnRzLm1heERpbWVuc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgeCA9IHRoYXQuaGVpZ2h0IC8gQ29uc3RhbnRzLm1heERpbWVuc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LndpZHRoID0gdGhhdC53aWR0aCAvIHg7XHJcbiAgICAgICAgICAgIHRoYXQuaGVpZ2h0ID0gdGhhdC5oZWlnaHQgLyB4O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuaW1hZ2Uuc3JjID0gaW1hZ2VQYXRoO1xyXG59XHJcblxyXG52YXIgcCA9IGxlc3Nvbk5vZGUucHJvdG90eXBlO1xyXG5cclxucC5kcmF3ID0gZnVuY3Rpb24oY3R4LCBjYW52YXMpe1xyXG5cclxuXHQvLyBDaGVjayBpZiBxdWVzdGlvbiBpcyB2aXNpYmxlXHJcblx0aWYodGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGU9PVF1ZXN0aW9uLlNPTFZFX1NUQVRFLkhJRERFTil7XHJcblx0XHRpZih0aGlzLnF1ZXN0aW9uLnJldmVhbFRocmVzaG9sZCA8PSB0aGlzLmNvbm5lY3Rpb25zKVxyXG5cdFx0XHR0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlVOU09MVkVEO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG4gICAgLy9sZXNzb25Ob2RlLmRyYXdMaWIuY2lyY2xlKGN0eCwgdGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnksIDEwLCBcInJlZFwiKTtcclxuICAgIC8vZHJhdyB0aGUgaW1hZ2UsIHNoYWRvdyBpZiBob3ZlcmVkXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgaWYodGhpcy5kcmFnZ2luZykge1xyXG4gICAgXHRjdHguc2hhZG93Q29sb3IgPSAneWVsbG93JztcclxuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XHJcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xyXG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZih0aGlzLm1vdXNlT3Zlcil7XHJcbiAgICAgICAgY3R4LnNoYWRvd0NvbG9yID0gJ2RvZGdlckJsdWUnO1xyXG4gICAgICAgIGN0eC5zaGFkb3dCbHVyID0gNTtcclxuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgICB9XHJcbiAgICAvL2RyYXdpbmcgdGhlIGJ1dHRvbiBpbWFnZVxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy9kcmF3aW5nIHRoZSBwaW5cclxuICAgIHN3aXRjaCAodGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGUpIHtcclxuICAgIFx0Y2FzZSAxOlxyXG4gICAgXHRcdGN0eC5maWxsU3R5bGUgPSBcImJsdWVcIjtcclxuXHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJjeWFuXCI7XHJcblx0XHRcdGJyZWFrO1xyXG4gICAgIFx0Y2FzZSAyOlxyXG4gICAgXHRcdGN0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XHJcblx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IFwieWVsbG93XCI7XHJcblx0XHRcdGJyZWFrO1xyXG4gICAgfVxyXG5cdGN0eC5saW5lV2lkdGggPSAyO1xyXG5cclxuXHRjdHguYmVnaW5QYXRoKCk7XHJcblx0Y3R4LmFyYyh0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIgKyAxNSwgdGhpcy5wb3NpdGlvbi55IC0gdGhpcy5oZWlnaHQvMiArIDE1LCA2LCAwLCAyKk1hdGguUEkpO1xyXG5cdGN0eC5jbG9zZVBhdGgoKTtcclxuXHRjdHguZmlsbCgpO1xyXG5cdGN0eC5zdHJva2UoKTtcclxuICAgIFxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbnAuY2xpY2sgPSBmdW5jdGlvbihtb3VzZVN0YXRlKXtcclxuICAgIHRoaXMucXVlc3Rpb24uZGlzcGxheVdpbmRvd3MoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsZXNzb25Ob2RlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5mdW5jdGlvbiBtb3VzZVN0YXRlKHBQb3NpdGlvbiwgcFJlbGF0aXZlUG9zaXRpb24sIHBNb3VzZWRvd24sIHBNb3VzZUluLCBwTW91c2VDbGlja2VkKXtcclxuICAgIHRoaXMucG9zaXRpb24gPSBwUG9zaXRpb247XHJcbiAgICB0aGlzLnJlbGF0aXZlUG9zaXRpb24gPSBwUmVsYXRpdmVQb3NpdGlvbjtcclxuICAgIHRoaXMubW91c2VEb3duID0gcE1vdXNlZG93bjtcclxuICAgIHRoaXMubW91c2VJbiA9IHBNb3VzZUluO1xyXG4gICAgdGhpcy5wcmV2TW91c2VEb3duID0gcE1vdXNlZG93bjtcclxuICAgIHRoaXMubW91c2VDbGlja2VkID0gcE1vdXNlQ2xpY2tlZDtcclxuICAgIHRoaXMuaGFzVGFyZ2V0ID0gZmFsc2U7XHJcbn1cclxuXHJcbnZhciBwID0gbW91c2VTdGF0ZS5wcm90b3R5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1vdXNlU3RhdGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIHBvaW50KHBYLCBwWSl7XHJcbiAgICB0aGlzLnggPSBwWDtcclxuICAgIHRoaXMueSA9IHBZO1xyXG59XHJcblxyXG52YXIgcCA9IHBvaW50LnByb3RvdHlwZTtcclxuXHJcbnAuYWRkID0gZnVuY3Rpb24ocFgsIHBZKXtcclxuXHRpZihwWSl7XHJcblx0XHR0aGlzLnggKz0gcFg7XHJcblx0XHR0aGlzLnkgKz0gcFk7XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHR0aGlzLnggKz0gcFgueDtcclxuXHRcdHRoaXMueSArPSBwWC55O1xyXG5cdH1cclxufVxyXG5cclxucC5tdWx0ID0gZnVuY3Rpb24ocFgsIHBZKXtcclxuXHRpZihwWSl7XHJcblx0XHR0aGlzLnggKj0gcFg7XHJcblx0XHR0aGlzLnkgKj0gcFk7XHJcblx0fVxyXG5cdGVsc2V7XHJcblx0XHR0aGlzLnggKj0gcFgueDtcclxuXHRcdHRoaXMueSAqPSBwWC55O1xyXG5cdH1cclxufVxyXG5cclxucC5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcclxuXHR0aGlzLnggKj0gc2NhbGU7XHJcblx0dGhpcy55ICo9IHNjYWxlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBvaW50OyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzLmpzJyk7XHJcblxyXG52YXIgU09MVkVfU1RBVEUgPSBPYmplY3QuZnJlZXplKHtISURERU46IDAsIFVOU09MVkVEOiAxLCBTT0xWRUQ6IDJ9KTtcclxudmFyIFFVRVNUSU9OX1RZUEUgPSBPYmplY3QuZnJlZXplKHtKVVNUSUZJQ0FUSU9OOiAxLCBNVUxUSVBMRV9DSE9JQ0U6IDIsIFNIT1JUX1JFU1BPTlNFOiAzLCBGSUxFOiA0LCBNRVNTQUdFOiA1fSk7XHJcblxyXG4vL3BhcmFtZXRlciBpcyBhIHBvaW50IHRoYXQgZGVub3RlcyBzdGFydGluZyBwb3NpdGlvblxyXG5mdW5jdGlvbiBRdWVzdGlvbih4bWwsIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpe1xyXG5cdFxyXG5cdC8vIFNldCB0aGUgY3VycmVudCBzdGF0ZSB0byBkZWZhdWx0IGF0IGhpZGRlbiBhbmQgc3RvcmUgdGhlIHdpbmRvdyBkaXZcclxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuSElEREVOO1xyXG4gICAgdGhpcy53aW5kb3dEaXYgPSB3aW5kb3dEaXY7XHJcbiAgICBcclxuICAgIC8vIEdldCBhbmQgc2F2ZSB0aGUgZ2l2ZW4gaW5kZXgsIGNvcnJlY3QgYW5zd2VyLCBwb3NpdGlvbiwgcmV2ZWFsIHRocmVzaG9sZCwgaW1hZ2UgbGluaywgZmVlZGJhY2ssIGFuZCBjb25uZWN0aW9uc1xyXG4gICAgdGhpcy5jb3JyZWN0ID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcImNvcnJlY3RBbnN3ZXJcIikpO1xyXG4gICAgdGhpcy5wb3NpdGlvblBlcmNlbnRYID0gVXRpbGl0aWVzLm1hcChwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwieFBvc2l0aW9uUGVyY2VudFwiKSksIDAsIDEwMCwgMCwgQ29uc3RhbnRzLmJvYXJkU2l6ZS54KTtcclxuICAgIHRoaXMucG9zaXRpb25QZXJjZW50WSA9IFV0aWxpdGllcy5tYXAocGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInlQb3NpdGlvblBlcmNlbnRcIikpLCAwLCAxMDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueSk7XHJcbiAgICB0aGlzLnJldmVhbFRocmVzaG9sZCA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJyZXZlYWxUaHJlc2hvbGRcIikpO1xyXG4gICAgdGhpcy5pbWFnZUxpbmsgPSB1cmwreG1sLmdldEF0dHJpYnV0ZShcImltYWdlTGlua1wiKTtcclxuICAgIHRoaXMuZmVlZGJhY2tzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZmVlZGJhY2tcIik7XHJcbiAgICB2YXIgY29ubmVjdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY29ubmVjdGlvbnNcIik7XHJcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0gW107XHJcbiAgICBmb3IodmFyIGk9MDtpPGNvbm5lY3Rpb25FbGVtZW50cy5sZW5ndGg7aSsrKVxyXG4gICAgXHR0aGlzLmNvbm5lY3Rpb25zW2ldID0gcGFyc2VJbnQoY29ubmVjdGlvbkVsZW1lbnRzW2ldLmlubmVySFRNTCk7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB0aGUgd2luZG93cyBmb3IgdGhpcyBxdWVzdGlvbiBiYXNlZCBvbiB0aGUgcXVlc3Rpb24gdHlwZVxyXG4gICAgdGhpcy5xdWVzdGlvblR5cGUgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwicXVlc3Rpb25UeXBlXCIpKTtcclxuICAgIHRoaXMuanVzdGlmaWNhdGlvbiA9IHRoaXMucXVlc3Rpb25UeXBlPT0xIHx8IHRoaXMucXVlc3Rpb25UeXBlPT0zO1xyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlIT01KXtcclxuXHRcdHRoaXMuY3JlYXRlVGFza1dpbmRvdyh4bWwpO1xyXG5cdFx0dGhpcy5jcmVhdGVSZXNvdXJjZVdpbmRvdyh4bWwsIHJlc291cmNlcyk7XHJcblx0fVxyXG5cdHN3aXRjaCh0aGlzLnF1ZXN0aW9uVHlwZSl7XHJcblx0XHRjYXNlIDU6XHJcblx0XHRcdHRoaXMuY3JlYXRlTWVzc2FnZVdpbmRvdyh4bWwpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgNDpcclxuXHRcdFx0dGhpcy5jcmVhdGVGaWxlV2luZG93KCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAzOlxyXG5cdFx0Y2FzZSAyOlxyXG5cdFx0Y2FzZSAxOlxyXG5cdFx0XHR0aGlzLmNyZWF0ZUFuc3dlcldpbmRvdyh4bWwpO1xyXG5cdFx0XHRicmVhaztcclxuXHR9XHJcbiAgICBcclxufVxyXG5cclxudmFyIHAgPSBRdWVzdGlvbi5wcm90b3R5cGU7XHJcblxyXG5wLndyb25nQW5zd2VyID0gZnVuY3Rpb24obnVtKXtcclxuXHJcbiAgLy8gSWYgZmVlYmFjayBkaXNwbGF5IGl0XHJcblx0aWYodGhpcy5mZWVkYmFja3MubGVuZ3RoPjApXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdcIicrU3RyaW5nLmZyb21DaGFyQ29kZShudW0gKyBcIkFcIi5jaGFyQ29kZUF0KCkpK1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0J1wiIGlzIG5vdCBjb3JyZWN0IDxici8+Jm5ic3A7PHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5mZWVkYmFja3NbbnVtXS5pbm5lckhUTUwrJzwvc3Bhbj48YnIvPic7XHJcblx0XHJcbn1cclxuXHJcbnAuY29ycmVjdEFuc3dlciA9IGZ1bmN0aW9uKCl7XHJcblx0XHJcblx0Ly8gSWYgZmVlZGJhY2sgZGlzcGxheSBpdFxyXG5cdGlmKHRoaXMuZmVlZGJhY2tzLmxlbmd0aD4wKVxyXG5cdFx0dGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSAnXCInK1N0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5jb3JyZWN0ICsgXCJBXCIuY2hhckNvZGVBdCgpKStcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCdcIiBpcyB0aGUgY29ycmVjdCByZXNwb25zZSA8YnIvPjxzcGFuIGNsYXNzPVwiZmVlZGJhY2tJXCI+JytcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZmVlZGJhY2tzW3RoaXMuY29ycmVjdF0uaW5uZXJIVE1MKyc8L3NwYW4+PGJyLz4nO1xyXG5cdFxyXG5cdFxyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPT09MyAmJiB0aGlzLmp1c3RpZmljYXRpb24udmFsdWUgIT0gJycpXHJcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdTdWJtaXR0ZWQgVGV4dDo8YnIvPjxzcGFuIGNsYXNzPVwiZmVlZGJhY2tJXCI+Jyt0aGlzLmp1c3RpZmljYXRpb24udmFsdWUrJzwvc3Bhbj48YnIvPic7XHJcblx0XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT0xICYmIHRoaXMuanVzdGlmaWNhdGlvbi52YWx1ZSAhPSAnJylcclxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MICs9ICdTdWJtaXR0ZWQgVGV4dDo8YnIvPjxzcGFuIGNsYXNzPVwiZmVlZGJhY2tJXCI+Jyt0aGlzLmp1c3RpZmljYXRpb24udmFsdWUrJzwvc3Bhbj48YnIvPic7XHJcblx0XHJcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT00KXtcclxuXHRcdGlmKHRoaXMuZmlsZUlucHV0LmZpbGVzLmxlbmd0aD4wKVxyXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdTdWJtaXR0ZWQgRmlsZXM6PGJyLz4nO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0Zm9yKHZhciBpPTA7aTx0aGlzLmZpbGVJbnB1dC5maWxlcy5sZW5ndGg7aSsrKVxyXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCArPSAnPHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK3RoaXMuZmlsZUlucHV0LmZpbGVzW2ldLm5hbWUrJzwvc3Bhbj48YnIvPic7XHJcblx0fVxyXG4gIFxyXG4gIGlmKHRoaXMuY3VycmVudFN0YXRlIT1TT0xWRV9TVEFURS5TT0xWRUQgJiYgXHJcbiAgICAgKCgodGhpcy5xdWVzdGlvblR5cGU9PT0zIHx8IHRoaXMucXVlc3Rpb25UeXBlPT09MSkgJiYgdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlICE9ICcnKSB8fFxyXG4gICAgICAodGhpcy5xdWVzdGlvblR5cGU9PT00ICYmIHRoaXMuZmlsZUlucHV0LmZpbGVzLmxlbmd0aD4wKSB8fFxyXG4gICAgICAgdGhpcy5xdWVzdGlvblR5cGU9PT0yKSl7IFxyXG4gICAgLy8gU2V0IHRoZSBzdGF0ZSBvZiB0aGUgcXVlc3Rpb24gdG8gY29ycmVjdFxyXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSBTT0xWRV9TVEFURS5TT0xWRUQ7XHJcbiAgfVxyXG5cdFxyXG59XHJcblxyXG5wLmRpc3BsYXlXaW5kb3dzID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBBZGQgdGhlIHdpbmRvd3MgdG8gdGhlIHdpbmRvdyBkaXZcclxuXHR2YXIgd2luZG93Tm9kZSA9IHRoaXMud2luZG93RGl2O1xyXG5cdHZhciBleGl0QnV0dG9uID0gbmV3IEltYWdlKCk7XHJcblx0ZXhpdEJ1dHRvbi5zcmMgPSBcIi4uL2ltZy9pY29uQ2xvc2UucG5nXCI7XHJcblx0ZXhpdEJ1dHRvbi5jbGFzc05hbWUgPSBcImV4aXQtYnV0dG9uXCI7XHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHRleGl0QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbigpIHsgcXVlc3Rpb24ud2luZG93RGl2LmlubmVySFRNTCA9ICcnOyB9O1xyXG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPT09NSl7XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMubWVzc2FnZSk7XHJcblx0ICAgIGV4aXRCdXR0b24uc3R5bGUubGVmdCA9IFwiNzV2d1wiO1xyXG5cdH1cclxuXHRlbHNle1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLnRhc2spO1xyXG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmFuc3dlcik7XHJcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMucmVzb3VyY2UpO1xyXG5cdFx0ZXhpdEJ1dHRvbi5zdHlsZS5sZWZ0ID0gXCI4NXZ3XCI7XHJcblx0fVxyXG5cdHdpbmRvd05vZGUuYXBwZW5kQ2hpbGQoZXhpdEJ1dHRvbik7XHJcblx0XHJcbn1cclxuXHJcbnAuY3JlYXRlVGFza1dpbmRvdyA9IGZ1bmN0aW9uKHhtbCl7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgdGFzayB3aW5kb3dzXHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIHRhc2sgd2luZG93IFxyXG5cdCAgICBcdHF1ZXN0aW9uLnRhc2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xyXG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5zdHlsZS50b3AgPSBcIjEwdmhcIjtcclxuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suc3R5bGUubGVmdCA9IFwiNXZ3XCI7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xyXG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5pbm5lckhUTUwgPSBxdWVzdGlvbi50YXNrLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvbk5hbWVcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlaW5zdHJ1Y3Rpb25zJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnN0cnVjdGlvbnNcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlcXVlc3Rpb24lXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uVGV4dFwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcclxuXHQgICAgICAgIHF1ZXN0aW9uLmZlZWRiYWNrID0gcXVlc3Rpb24udGFzay5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiZmVlZGJhY2tcIilbMF07XHJcblx0ICAgIH1cclxuXHR9XHJcblx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIFwidGFza1dpbmRvdy5odG1sXCIsIHRydWUpO1xyXG5cdHJlcXVlc3Quc2VuZCgpO1xyXG59XHJcblxyXG5wLmNyZWF0ZVJlc291cmNlV2luZG93ID0gZnVuY3Rpb24oeG1sLCByZXNvdXJjZUZpbGVzKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciByZXNvdXJjZSB3aW5kb3dzXHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIHJlc291cmNlIHdpbmRvdyBcclxuXHQgICAgXHRxdWVzdGlvbi5yZXNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0XHRcdHF1ZXN0aW9uLnJlc291cmNlLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0XHRcdHF1ZXN0aW9uLnJlc291cmNlLnN0eWxlLnRvcCA9IFwiNTV2aFwiO1xyXG5cdFx0XHRxdWVzdGlvbi5yZXNvdXJjZS5zdHlsZS5sZWZ0ID0gXCI1dndcIjtcclxuXHRcdFx0cXVlc3Rpb24ucmVzb3VyY2UuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgaW5kaXZpZHVhbCByZXNvdWNlcyBpZiBhbnlcclxuXHQgICAgXHR2YXIgcmVzb3VyY2VzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VJbmRleFwiKTtcclxuXHRcdCAgICBpZihyZXNvdXJjZXMubGVuZ3RoID4gMCl7XHJcblx0XHRcdFx0dmFyIHJlcXVlc3QyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdFx0cmVxdWVzdDIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0ICAgIGlmIChyZXF1ZXN0Mi5yZWFkeVN0YXRlID09IDQgJiYgcmVxdWVzdDIuc3RhdHVzID09IDIwMCkge1xyXG5cdFx0XHRcdCAgICBcdFxyXG5cdFx0XHRcdCAgICBcdC8vIEdldCB0aGUgaHRtbCBmb3IgZWFjaCByZXNvdXJjZSBhbmQgdGhlbiBhZGQgdGhlIHJlc3VsdCB0byB0aGUgd2luZG93XHJcblx0XHRcdFx0ICAgIFx0dmFyIHJlc291cmNlSFRNTCA9ICcnO1xyXG5cdFx0XHRcdFx0ICAgIGZvcih2YXIgaT0wO2k8cmVzb3VyY2VzLmxlbmd0aDtpKyspe1xyXG5cdFx0XHRcdCAgICBcdFx0dmFyIGN1clJlc291cmNlID0gcmVxdWVzdDIucmVzcG9uc2VUZXh0LnJlcGxhY2UoXCIlaWNvbiVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0uaWNvbik7XHJcblx0XHRcdFx0XHQgICAgXHRjdXJSZXNvdXJjZSA9IGN1clJlc291cmNlLnJlcGxhY2UoXCIldGl0bGUlXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLnRpdGxlKTtcclxuXHRcdFx0XHRcdCAgICBcdGN1clJlc291cmNlID0gY3VyUmVzb3VyY2UucmVwbGFjZShcIiVsaW5rJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS5saW5rKTtcclxuXHRcdFx0XHRcdCAgICBcdHJlc291cmNlSFRNTCArPSBjdXJSZXNvdXJjZTtcclxuXHRcdFx0XHRcdCAgICB9XHJcblx0XHRcdFx0XHQgIFx0cXVlc3Rpb24ucmVzb3VyY2UuaW5uZXJIVE1MID0gcXVlc3Rpb24ucmVzb3VyY2UuaW5uZXJIVE1MLnJlcGxhY2UoXCIlcmVzb3VyY2VzJVwiLCByZXNvdXJjZUhUTUwpO1xyXG5cdFx0XHRcdCAgICAgICAgXHJcblx0XHRcdFx0ICAgIH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmVxdWVzdDIub3BlbihcIkdFVFwiLCBcInJlc291cmNlLmh0bWxcIiwgdHJ1ZSk7XHJcblx0XHRcdFx0cmVxdWVzdDIuc2VuZCgpO1xyXG5cdCAgICBcdH1cclxuXHQgICAgXHRlbHNle1xyXG5cdCAgICBcdFx0Ly8gRGlzcGxheSB0aGF0IHRoZXJlIGFyZW4ndCBhbnkgcmVzb3VyY2VzXHJcblx0ICAgIFx0XHRxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwucmVwbGFjZShcIiVyZXNvdXJjZXMlXCIsIFwiTm8gcmVzb3VyY2VzIGhhdmUgYmVlbiBwcm92aWRlZCBmb3IgdGhpcyB0YXNrLlwiKTtcclxuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLnN0eWxlLmNvbG9yID0gXCJncmV5XCI7XHJcblx0ICAgIFx0XHRxdWVzdGlvbi5yZXNvdXJjZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGRkZGRkZcIjtcclxuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLmNsYXNzTmFtZSArPSBcIiwgY2VudGVyXCI7XHJcblx0ICAgIFx0fVxyXG5cdCAgICAgICAgXHJcblx0ICAgIH1cclxuXHR9O1xyXG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcInJlc291cmNlV2luZG93Lmh0bWxcIiwgdHJ1ZSk7XHJcblx0cmVxdWVzdC5zZW5kKCk7XHJcbn1cclxuXHJcbnAuY3JlYXRlQW5zd2VyV2luZG93ID0gZnVuY3Rpb24oeG1sKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciBhbnN3ZXIgd2luZG93c1xyXG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XHJcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdCAgICBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09IDQgJiYgcmVxdWVzdC5zdGF0dXMgPT0gMjAwKSB7XHJcblx0ICAgIFx0XHJcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSBhbnN3ZXIgd2luZG93IFxyXG5cdCAgICBcdHF1ZXN0aW9uLmFuc3dlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XHJcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XHJcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLnN0eWxlLnRvcCA9IFwiMTB2aFwiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5zdHlsZS5sZWZ0ID0gXCI1MHZ3XCI7XHJcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xyXG5cdCAgICAgICAgXHJcblx0ICAgICAgICAvLyBDcmVhdGUgdGhlIHRleHQgZWxlbWVudCBpZiBhbnlcclxuXHQgICAgICAgIHZhciBzdWJtaXQ7XHJcblx0ICAgICAgICBpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKXtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5jbGFzc05hbWUgPSBcInN1Ym1pdFwiO1xyXG5cdCAgICAgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5pbm5lckhUTUwgPSBcIlN1Ym1pdFwiO1xyXG5cdFx0ICAgICAgICBxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XHJcblx0XHQgICAgICAgIHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0Lm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHRcdCAgICAgICAgXHRxdWVzdGlvbi5jb3JyZWN0QW5zd2VyKCk7XHJcblx0XHQgICAgXHR9XHJcblx0XHQgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24oKSB7XHJcblx0XHQgICAgXHRcdGlmKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24udmFsdWUubGVuZ3RoID4gMClcclxuXHRcdCAgICBcdFx0XHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0ICAgIFx0XHRlbHNlXHJcblx0XHQgICAgXHRcdFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0ICAgIFx0fSwgZmFsc2UpO1xyXG5cdCAgICAgICAgfVxyXG5cdCAgICAgICAgXHJcblx0ICAgICAgICAvLyBDcmVhdGUgYW5kIGdldCBhbGwgdGhlIGFuc3dlciBlbGVtZW50c1xyXG5cdCAgICAgICAgdmFyIGFuc3dlcnMgPSBbXTtcclxuXHQgICAgICAgIHZhciBhbnN3ZXJzWG1sID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYW5zd2VyXCIpO1xyXG5cdCAgICAgICAgdmFyIGNvcnJlY3QgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwiY29ycmVjdEFuc3dlclwiKSk7XHJcblx0ICAgICAgICBmb3IodmFyIGk9MDtpPGFuc3dlcnNYbWwubGVuZ3RoO2krKyl7XHJcblx0ICAgICAgICBcdGlmKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24pXHJcblx0ICAgICAgICBcdFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5kaXNhYmxlZCA9IHRydWU7XHJcblx0ICAgICAgICBcdGFuc3dlcnNbaV0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG5cdCAgICAgICAgXHRpZihjb3JyZWN0PT09aSlcclxuXHQgICAgICAgIFx0XHRhbnN3ZXJzW2ldLmNsYXNzTmFtZSA9IFwiY29ycmVjdFwiO1xyXG5cdCAgICAgICAgXHRlbHNlXHJcblx0ICAgICAgICBcdFx0YW5zd2Vyc1tpXS5jbGFzc05hbWUgPSBcIndyb25nXCI7XHJcblx0ICAgICAgICBcdGFuc3dlcnNbaV0uaW5uZXJIVE1MID0gU3RyaW5nLmZyb21DaGFyQ29kZShpICsgXCJBXCIuY2hhckNvZGVBdCgpKStcIi4gXCIrYW5zd2Vyc1htbFtpXS5pbm5lckhUTUw7XHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgICBcclxuXHQgICAgICAgIC8vIENyZWF0ZSB0aGUgZXZlbnRzIGZvciB0aGUgYW5zd2Vyc1xyXG5cdCAgICAgICAgZm9yKHZhciBpPTA7aTxhbnN3ZXJzLmxlbmd0aDtpKyspe1xyXG5cdCAgICAgICAgXHRpZihhbnN3ZXJzW2ldLmNsYXNzTmFtZSA9PSBcIndyb25nXCIpe1xyXG5cdCAgICAgICAgXHRcdGFuc3dlcnNbaV0ubnVtID0gaTtcclxuICAgICAgICAgICAgICBhbnN3ZXJzW2ldLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7XHJcblx0ICAgICAgICBcdFx0XHRxdWVzdGlvbi53cm9uZ0Fuc3dlcih0aGlzLm51bSk7XHJcblx0ICAgICAgICBcdFx0fTtcclxuXHQgICAgICAgIFx0fVxyXG5cdCAgICAgICAgXHRlbHNle1xyXG5cdCAgICAgICAgXHRcdGFuc3dlcnNbaV0ub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGo9MDtqPGFuc3dlcnMubGVuZ3RoO2orKylcclxuICAgICAgICAgICAgICAgICAgYW5zd2Vyc1tqXS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKVxyXG4gICAgICAgICAgICAgICAgICBxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgICAgICAgICB9O1xyXG5cdCAgICAgICAgXHR9XHJcblx0ICAgICAgICB9XHJcblx0ICAgICAgICBcclxuXHQgICAgICAgIC8vIEFkZCB0aGUgYW5zd2VycyB0byB0aGUgd2luZG93XHJcbiAgICAgICAgICBmb3IodmFyIGk9MDtpPGFuc3dlcnMubGVuZ3RoO2krKylcclxuICAgICAgICAgICAgcXVlc3Rpb24uYW5zd2VyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLmFwcGVuZENoaWxkKGFuc3dlcnNbaV0pO1xyXG5cdCAgICAgICAgaWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbil7XHJcblx0ICAgICAgICBcdHF1ZXN0aW9uLmFuc3dlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXS5hcHBlbmRDaGlsZChxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKTtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24uYW5zd2VyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLmFwcGVuZENoaWxkKHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0KTtcclxuXHQgICAgICAgIH1cclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJhbnN3ZXJXaW5kb3cuaHRtbFwiLCB0cnVlKTtcclxuXHRyZXF1ZXN0LnNlbmQoKTtcclxufVxyXG5cclxucC5jcmVhdGVGaWxlV2luZG93ID0gZnVuY3Rpb24oKXtcclxuXHRcclxuXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciBmaWxlIHdpbmRvd3NcclxuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xyXG5cdCAgICBcdFxyXG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgZmlsZSB3aW5kb3cgXHJcblx0ICAgIFx0cXVlc3Rpb24uYW5zd2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuY2xhc3NOYW1lID0gXCJ3aW5kb3dcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuc3R5bGUudG9wID0gXCIxMHZoXCI7XHJcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLnN0eWxlLmxlZnQgPSBcIjUwdndcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5hbnN3ZXIuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0XHQgICAgcXVlc3Rpb24uZmlsZUlucHV0ID0gcXVlc3Rpb24uYW5zd2VyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIilbMF07XHJcblx0XHQgICAgcXVlc3Rpb24uZmlsZUlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0ICAgIHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcclxuXHQgICAgICAgIH07XHJcblx0ICAgICAgICBcclxuXHQgICAgfVxyXG5cdH1cclxuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJmaWxlV2luZG93Lmh0bWxcIiwgdHJ1ZSk7XHJcblx0cmVxdWVzdC5zZW5kKCk7XHJcbn1cclxuXHJcbnAuY3JlYXRlTWVzc2FnZVdpbmRvdyA9IGZ1bmN0aW9uKHhtbCl7XHJcblx0XHJcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgZmlsZSB3aW5kb3dzXHJcblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcclxuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHQgICAgXHRcclxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIGZpbGUgd2luZG93IFxyXG5cdCAgICBcdHF1ZXN0aW9uLm1lc3NhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2UuY2xhc3NOYW1lID0gXCJ3aW5kb3dcIjtcclxuXHRcdCAgICBxdWVzdGlvbi5tZXNzYWdlLnN0eWxlLnRvcCA9IFwiMTB2aFwiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2Uuc3R5bGUubGVmdCA9IFwiNDB2d1wiO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2UuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvbk5hbWVcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XHJcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJWluc3RydWN0aW9ucyVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5zdHJ1Y3Rpb25zXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2UuaW5uZXJIVE1MID0gcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwucmVwbGFjZShcIiVxdWVzdGlvbiVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25UZXh0XCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xyXG5cdCAgICAgICAgcXVlc3Rpb24ubWVzc2FnZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgICAgICBcdHF1ZXN0aW9uLmN1cnJlbnRTdGF0ZSA9IFNPTFZFX1NUQVRFLlNPTFZFRDtcclxuXHQgICAgICAgIFx0cXVlc3Rpb24ud2luZG93RGl2LmlubmVySFRNTCA9ICcnO1xyXG5cdCAgICAgICAgfTtcclxuXHJcblx0ICAgIH1cclxuXHR9XHJcblx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIFwibWVzc2FnZVdpbmRvdy5odG1sXCIsIHRydWUpO1xyXG5cdHJlcXVlc3Quc2VuZCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uO1xyXG5tb2R1bGUuZXhwb3J0cy5TT0xWRV9TVEFURSA9IFNPTFZFX1NUQVRFOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcclxuXHJcbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcclxuZnVuY3Rpb24gUmVzb3VyY2UoeG1sLCB1cmwpe1xyXG5cdFxyXG5cdC8vIEZpcnN0IGdldCB0aGUgaWNvblxyXG5cdCAgdmFyIHR5cGUgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSk7XHJcblx0ICBzd2l0Y2godHlwZSl7XHJcblx0ICAgIGNhc2UgMDpcclxuXHQgICAgICB0aGlzLmljb24gPSAnLi4vaW1nL2ljb25SZXNvdXJjZUZpbGUucG5nJztcclxuXHQgICAgICBicmVhaztcclxuXHQgICAgY2FzZSAxOlxyXG5cdCAgICAgIHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlTGluay5wbmcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgICBjYXNlIDI6XHJcbiAgICBcdCAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VWaWRlby5wbmcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgICBkZWZhdWx0OlxyXG5cdCAgICAgIHRoaXMuaWNvbiA9ICcnO1xyXG5cdCAgICAgIGJyZWFrO1xyXG5cdCAgfVxyXG5cclxuXHQgIC8vIE5leHQgZ2V0IHRoZSB0aXRsZVxyXG5cdCAgdGhpcy50aXRsZSA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJ0ZXh0XCIpO1xyXG5cclxuXHQgIC8vIExhc3QgZ2V0IHRoZSBsaW5rXHJcblx0ICBpZih0eXBlPjApXHJcblx0ICAgIHRoaXMubGluayA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpO1xyXG5cdCAgZWxzZVxyXG5cdCAgICB0aGlzLmxpbmsgPSB1cmwrJ2Fzc2V0cy9maWxlcy8nK3htbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpLnJlcGxhY2UoLyAvZywgJyUyMCcpO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQuanMnKTtcclxuXHJcbi8vTW9kdWxlIGV4cG9ydFxyXG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuLy8gcmV0dXJucyBtb3VzZSBwb3NpdGlvbiBpbiBsb2NhbCBjb29yZGluYXRlIHN5c3RlbSBvZiBlbGVtZW50XHJcbm0uZ2V0TW91c2UgPSBmdW5jdGlvbihlKXtcclxuICAgIHJldHVybiBuZXcgUG9pbnQoKGUucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0KSwgKGUucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3ApKTtcclxufVxyXG5cclxuLy9yZXR1cm5zIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIHJhdGlvIGl0IGhhcyB3aXRoIGEgc3BlY2lmaWMgcmFuZ2UgXCJtYXBwZWRcIiB0byBhIGRpZmZlcmVudCByYW5nZVxyXG5tLm1hcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4xLCBtYXgxLCBtaW4yLCBtYXgyKXtcclxuICAgIHJldHVybiBtaW4yICsgKG1heDIgLSBtaW4yKSAqICgodmFsdWUgLSBtaW4xKSAvIChtYXgxIC0gbWluMSkpO1xyXG59XHJcblxyXG4vL2lmIGEgdmFsdWUgaXMgaGlnaGVyIG9yIGxvd2VyIHRoYW4gdGhlIG1pbiBhbmQgbWF4LCBpdCBpcyBcImNsYW1wZWRcIiB0byB0aGF0IG91dGVyIGxpbWl0XHJcbm0uY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xyXG59XHJcblxyXG4vL2RldGVybWluZXMgd2hldGhlciB0aGUgbW91c2UgaXMgaW50ZXJzZWN0aW5nIHRoZSBhY3RpdmUgZWxlbWVudFxyXG5tLm1vdXNlSW50ZXJzZWN0ID0gZnVuY3Rpb24ocE1vdXNlU3RhdGUsIHBFbGVtZW50LCBwT2Zmc2V0dGVyLCBwU2NhbGUpe1xyXG4gICAgaWYocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54ICsgcE9mZnNldHRlci54ID4gKHBFbGVtZW50LnBvc2l0aW9uLnggLSAocFNjYWxlKnBFbGVtZW50LndpZHRoKS8yKSAmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggKyBwT2Zmc2V0dGVyLnggPCAocEVsZW1lbnQucG9zaXRpb24ueCArIChwU2NhbGUqcEVsZW1lbnQud2lkdGgpLzIpKXtcclxuICAgICAgICBpZihwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyBwT2Zmc2V0dGVyLnkgPiAocEVsZW1lbnQucG9zaXRpb24ueSAtIChwU2NhbGUqcEVsZW1lbnQuaGVpZ2h0KS8yKSAmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyBwT2Zmc2V0dGVyLnkgPCAocEVsZW1lbnQucG9zaXRpb24ueSArIChwU2NhbGUqcEVsZW1lbnQuaGVpZ2h0KS8yKSl7XHJcbiAgICAgICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIHBNb3VzZVN0YXRlLmhhc1RhcmdldCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgXHRyZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy9wRWxlbWVudC5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gZ2V0cyB0aGUgeG1sIG9iamVjdCBvZiBhIHN0cmluZ1xyXG5tLmdldFhtbCA9IGZ1bmN0aW9uKHhtbCl7XHJcblx0dmFyIHhtbERvYztcclxuXHRpZiAod2luZG93LkRPTVBhcnNlcil7XHJcblx0XHR2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cdFx0eG1sRG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsIFwidGV4dC94bWxcIik7XHJcblx0fVxyXG5cdGVsc2V7IC8vIElFXHJcblx0XHR4bWxEb2MgPSBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxET01cIik7XHJcblx0XHR4bWxEb2MuYXN5bmMgPSBmYWxzZTtcclxuXHRcdHhtbERvYy5sb2FkWE1MKHhtbCk7XHJcblx0fVxyXG5cdHJldHVybiB4bWxEb2M7XHJcbn0iXX0=
=======
},{"./point.js":13}]},{},[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib2FyZC9qcy9tYWluLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9ib2FyZC5qcyIsImJvYXJkL2pzL21vZHVsZXMvYnV0dG9uLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9jYXRlZ29yeS5qcyIsImJvYXJkL2pzL21vZHVsZXMvY29uc3RhbnRzLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9kcmF3TGliLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9nYW1lLmpzIiwiYm9hcmQvanMvbW9kdWxlcy9pcGFyRGF0YVBhcnNlci5qcyIsImJvYXJkL2pzL21vZHVsZXMvbGVzc29uTm9kZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvbW91c2VTdGF0ZS5qcyIsImJvYXJkL2pzL21vZHVsZXMvcGhhc2VzL2JvYXJkUGhhc2UuanMiLCJib2FyZC9qcy9tb2R1bGVzL3BvaW50LmpzIiwiYm9hcmQvanMvbW9kdWxlcy9xdWVzdGlvbi5qcyIsImJvYXJkL2pzL21vZHVsZXMvcmVzb3VyY2VzLmpzIiwiYm9hcmQvanMvbW9kdWxlcy91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbi8vaW1wb3J0c1xudmFyIEdhbWUgPSByZXF1aXJlKCcuL21vZHVsZXMvZ2FtZS5qcycpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL3BvaW50LmpzJyk7XG52YXIgTW91c2VTdGF0ZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tb3VzZVN0YXRlLmpzJyk7XG5cbi8vZ2FtZSBvYmplY3RzXG52YXIgZ2FtZTtcbnZhciBjYW52YXM7XG52YXIgY3R4O1xuXG4vLyB3aW5kb3cgZGl2IGFuZCBpZiBwYXVzZWRcbnZhciB3aW5kb3dEaXY7XG52YXIgd2luZG93RmlsbTtcbnZhciBwYXVzZWRUaW1lID0gMDtcblxuLy9yZXNwb25zaXZlbmVzc1xudmFyIGNlbnRlcjtcblxuLy9tb3VzZSBoYW5kbGluZ1xudmFyIG1vdXNlUG9zaXRpb247XG52YXIgcmVsYXRpdmVNb3VzZVBvc2l0aW9uO1xudmFyIG1vdXNlRG93bjtcbnZhciBtb3VzZUluO1xudmFyIG1vdXNlRG93blRpbWVyO1xudmFyIG1vdXNlQ2xpY2tlZDtcbnZhciBtYXhDbGlja0R1cmF0aW9uOyAvLyBtaWxsaXNlY29uZHNcblxuLy9wZXJzaXN0ZW50IHV0aWxpdGllc1xudmFyIHByZXZUaW1lOyAvLyBkYXRlIGluIG1pbGxpc2Vjb25kc1xudmFyIGR0OyAvLyBkZWx0YSB0aW1lIGluIG1pbGxpc2Vjb25kc1xuXG4vL2ZpcmVzIHdoZW4gdGhlIHdpbmRvdyBsb2Fkc1xud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpe1xuICAgIGluaXRpYWxpemVWYXJpYWJsZXMoKTtcbiAgICBsb29wKCk7XG59XG5cbi8vaW5pdGlhbGl6YXRpb24sIG1vdXNlIGV2ZW50cywgYW5kIGdhbWUgaW5zdGFudGlhdGlvblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVZhcmlhYmxlcygpe1xuXHR3aW5kb3dEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93Jyk7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5vZmZzZXRXaWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcbiAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBEaW1lbnNpb25zOiBcIiArIGNhbnZhcy53aWR0aCArIFwiLCBcIiArIGNhbnZhcy5oZWlnaHQpO1xuICAgIFxuXHR3aW5kb3dGaWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvd0ZsaW0nKTtcblx0d2luZG93RmlsbS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7IHdpbmRvd0Rpdi5pbm5lckhUTUwgPSAnJzsgfTtcbiAgICBcbiAgICBtb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgcmVsYXRpdmVNb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgXG4gICAgLy9ldmVudCBsaXN0ZW5lcnMgZm9yIG1vdXNlIGludGVyYWN0aW9ucyB3aXRoIHRoZSBjYW52YXNcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgdmFyIGJvdW5kUmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChlLmNsaWVudFggLSBib3VuZFJlY3QubGVmdCwgZS5jbGllbnRZIC0gYm91bmRSZWN0LnRvcCk7XG4gICAgICAgIHJlbGF0aXZlTW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChtb3VzZVBvc2l0aW9uLnggLSAoY2FudmFzLm9mZnNldFdpZHRoLzIuMCksIG1vdXNlUG9zaXRpb24ueSAtIChjYW52YXMub2Zmc2V0SGVpZ2h0LzIuMCkpOyAgICAgICAgXG4gICAgfSk7XG4gICAgbW91c2VEb3duID0gZmFsc2U7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIG1vdXNlRG93biA9IHRydWU7XG4gICAgfSk7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBtb3VzZURvd24gPSBmYWxzZTtcbiAgICB9KTtcbiAgICBtb3VzZUluID0gZmFsc2U7XG4gICAgbW91c2VEb3duVGltZXIgPSAwO1xuICAgIG1vdXNlQ2xpY2tlZCA9IGZhbHNlO1xuICAgIG1heENsaWNrRHVyYXRpb24gPSAyMDA7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIG1vdXNlSW4gPSB0cnVlO1xuICAgIH0pO1xuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIG1vdXNlSW4gPSBmYWxzZTtcbiAgICAgICAgbW91c2VEb3duID0gZmFsc2U7XG4gICAgfSk7XG4gICAgXG4gICAgcHJldlRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGR0ID0gMDtcbiAgICBcbiAgICBnYW1lID0gbmV3IEdhbWUobG9jYWxTdG9yYWdlWydjYXNlRmlsZXMnXSwgd2luZG93RGl2KTtcbn1cblxuLy9maXJlcyBvbmNlIHBlciBmcmFtZVxuZnVuY3Rpb24gbG9vcCgpe1xuXHQvLyBsb29wXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wLmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIHVwZGF0ZSBkZWx0YSB0aW1lXG4gICAgZHQgPSBEYXRlLm5vdygpIC0gcHJldlRpbWU7XG4gICAgcHJldlRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIC8vIGNoZWNrIG1vdXNlIGNsaWNrXG4gICAgbW91c2VDbGlja2VkID0gZmFsc2U7XG4gICAgaWYgKG1vdXNlRG93bikgeyBtb3VzZURvd25UaW1lciArPSBkdDsgfVxuICAgIGVsc2UgeyBpZiAobW91c2VEb3duVGltZXIgPiAwICYmIG1vdXNlRG93blRpbWVyIDwgbWF4Q2xpY2tEdXJhdGlvbikgeyBtb3VzZUNsaWNrZWQgPSB0cnVlOyB9IG1vdXNlRG93blRpbWVyID0gMDsgfVxuICAgIFxuICAgIC8vIHVwZGF0ZSBnYW1lXG4gICAgZ2FtZS51cGRhdGUoY3R4LCBjYW52YXMsIGR0LCBuZXcgTW91c2VTdGF0ZShtb3VzZVBvc2l0aW9uLCByZWxhdGl2ZU1vdXNlUG9zaXRpb24sIG1vdXNlRG93biwgbW91c2VJbiwgbW91c2VDbGlja2VkKSk7XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgc2hvdWxkIHBhdXNlXG4gICAgaWYoZ2FtZS5hY3RpdmUgJiYgd2luZG93RGl2LmlubmVySFRNTCE9JycgJiYgcGF1c2VkVGltZSsrPjMpe1xuICAgIFx0Z2FtZS5hY3RpdmUgPSBmYWxzZTtcbiAgICBcdHdpbmRvd0ZpbG0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgfVxuICAgIGVsc2UgaWYocGF1c2VkVGltZSE9MCAmJiB3aW5kb3dEaXYuaW5uZXJIVE1MPT0nJyl7XG4gICAgXHRwYXVzZWRUaW1lID0gMDtcbiAgICBcdGdhbWUuYWN0aXZlID0gdHJ1ZTtcbiAgICBcdHdpbmRvd0ZpbG0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG59XG5cbi8vbGlzdGVucyBmb3IgY2hhbmdlcyBpbiBzaXplIG9mIHdpbmRvdyBhbmQgYWRqdXN0cyB2YXJpYWJsZXMgYWNjb3JkaW5nbHlcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uKGUpe1xuICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5vZmZzZXRXaWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcbiAgICBjZW50ZXIgPSBuZXcgUG9pbnQoY2FudmFzLndpZHRoIC8gMiwgY2FudmFzLmhlaWdodCAvIDIpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIERpbWVuc2lvbnM6IFwiICsgY2FudmFzLndpZHRoICsgXCIsIFwiICsgY2FudmFzLmhlaWdodCk7XG59KTtcblxuXG5cbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vdXRpbGl0aWVzLmpzJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcblxuLy9wYXJhbWV0ZXIgaXMgYSBwb2ludCB0aGF0IGRlbm90ZXMgc3RhcnRpbmcgcG9zaXRpb25cbmZ1bmN0aW9uIGJvYXJkKHN0YXJ0UG9zaXRpb24sIGxlc3Nvbk5vZGVzKXtcbiAgICB0aGlzLnBvc2l0aW9uID0gc3RhcnRQb3NpdGlvbjtcbiAgICB0aGlzLmxlc3Nvbk5vZGVBcnJheSA9IGxlc3Nvbk5vZGVzO1xuICAgIHRoaXMuYm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XG4gICAgdGhpcy5wcmV2Qm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XG59XG5cbmJvYXJkLmRyYXdMaWIgPSB1bmRlZmluZWQ7XG5cbi8vcHJvdG90eXBlXG52YXIgcCA9IGJvYXJkLnByb3RvdHlwZTtcblxucC5tb3ZlID0gZnVuY3Rpb24ocFgsIHBZKXtcbiAgICB0aGlzLnBvc2l0aW9uLnggKz0gcFg7XG4gICAgdGhpcy5wb3NpdGlvbi55ICs9IHBZO1xuICAgIHRoaXMuYm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XG4gICAgdGhpcy5wcmV2Qm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XG59O1xuXG5wLmFjdCA9IGZ1bmN0aW9uKHBNb3VzZVN0YXRlKSB7XG5cdFxuXHQvLyBmb3IgZWFjaCAgbm9kZVxuICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICBcdHZhciBhY3RpdmVOb2RlID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07IFxuXHRcdC8vIGhhbmRsZSBzb2x2ZWQgcXVlc3Rpb25cblx0XHRpZiAoYWN0aXZlTm9kZS5jdXJyZW50U3RhdGUgIT0gUXVlc3Rpb24uU09MVkVfU1RBVEUuU09MVkVEICYmIGFjdGl2ZU5vZGUucXVlc3Rpb24uY3VycmVudFN0YXRlID09IFF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRCkge1xuXHRcdFx0XG5cdFx0XHQvLyB1cGRhdGUgZWFjaCBjb25uZWN0aW9uJ3MgY29ubmVjdGlvbiBudW1iZXJcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgYWN0aXZlTm9kZS5xdWVzdGlvbi5jb25uZWN0aW9ucy5sZW5ndGg7IGorKylcblx0XHRcdFx0dGhpcy5sZXNzb25Ob2RlQXJyYXlbYWN0aXZlTm9kZS5xdWVzdGlvbi5jb25uZWN0aW9uc1tqXSAtIDFdLmNvbm5lY3Rpb25zKys7XG5cdFx0XHRcblx0XHRcdC8vIFVwZGF0ZSB0aGUgbm9kZSdzIHN0YXRlXG5cdFx0XHRhY3RpdmVOb2RlLmN1cnJlbnRTdGF0ZSA9IGFjdGl2ZU5vZGUucXVlc3Rpb24uY3VycmVudFN0YXRlO1xuXHRcdFx0XG5cdFx0fVxuXHR9XG4gICAgXG4gICAgLy8gaG92ZXIgc3RhdGVzXG5cdC8vZm9yKHZhciBpID0gMDsgaSA8IGJvYXJkQXJyYXkubGVuZ3RoOyBpKyspe1xuXHRcdC8vIGxvb3AgdGhyb3VnaCBsZXNzb24gbm9kZXMgdG8gY2hlY2sgZm9yIGhvdmVyXG5cdFx0Ly8gdXBkYXRlIGJvYXJkXG5cdFx0XG5cdHZhciBub2RlQ2hvc2VuID0gZmFsc2U7XG5cdGZvciAodmFyIGk9dGhpcy5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuXHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5kcmFnZ2luZykge1xuXHRcdFx0Ly9ub2RlQ2hvc2VuID0gdHJ1ZTtcblx0XHRcdHBNb3VzZVN0YXRlLmhhc1RhcmdldCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdFxuXHRcblx0Zm9yICh2YXIgaT10aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG5cdFx0dmFyIGxOb2RlID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV07XG5cdFx0XG5cdFx0aWYgKCFwTW91c2VTdGF0ZS5tb3VzZURvd24pIHtcblx0XHRcdGxOb2RlLmRyYWdQb3NpdGlvbiA9IHVuZGVmaW5lZDsgLy8gY2xlYXIgZHJhZyBiZWhhdmlvclxuXHRcdFx0bE5vZGUuZHJhZ2dpbmcgPSBmYWxzZTtcblx0XHR9IFxuXHRcdFxuXHRcdGxOb2RlLm1vdXNlT3ZlciA9IGZhbHNlO1xuXHRcdFxuXHRcdC8vIGlmIHRoZXJlIGlzIGFscmVhZHkgYSBzZWxlY3RlZCBub2RlLCBkbyBub3QgdHJ5IHRvIHNlbGVjdCBhbm90aGVyXG5cdFx0aWYgKG5vZGVDaG9zZW4pIHsgIGNvbnRpbnVlOyB9XG5cdFx0XG5cdFx0Ly9jb25zb2xlLmxvZyhcIm5vZGUgdXBkYXRlXCIpO1xuXHRcdC8vIGlmIGhvdmVyaW5nLCBzaG93IGhvdmVyIGdsb3dcblx0XHQvKmlmIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggPiBsTm9kZS5wb3NpdGlvbi54LWxOb2RlLndpZHRoLzIgXG5cdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IDwgbE5vZGUucG9zaXRpb24ueCtsTm9kZS53aWR0aC8yXG5cdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ID4gbE5vZGUucG9zaXRpb24ueS1sTm9kZS5oZWlnaHQvMlxuXHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA8IGxOb2RlLnBvc2l0aW9uLnkrbE5vZGUuaGVpZ2h0LzIpIHsqL1xuXHRcdFxuXHRcdFxuXHRcdGlmIChVdGlsaXRpZXMubW91c2VJbnRlcnNlY3QocE1vdXNlU3RhdGUsbE5vZGUsdGhpcy5ib2FyZE9mZnNldCwxKSkge1xuXHRcdFx0bE5vZGUubW91c2VPdmVyID0gdHJ1ZTtcblx0XHRcdG5vZGVDaG9zZW4gPSB0cnVlO1xuXHRcdFx0cE1vdXNlU3RhdGUuaGFzVGFyZ2V0ID0gdHJ1ZTtcblx0XHRcdC8vY29uc29sZS5sb2cocE1vdXNlU3RhdGUuaGFzVGFyZ2V0KTtcblx0XHRcdFxuXHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlRG93biAmJiAhdGhpcy5wcmV2TW91c2VTdGF0ZS5tb3VzZURvd24pIHtcblx0XHRcdFx0Ly8gZHJhZ1xuXHRcdFx0XHRsTm9kZS5kcmFnZ2luZyA9IHRydWU7XG5cdFx0XHRcdGxOb2RlLmRyYWdQb3NpdGlvbiA9IG5ldyBQb2ludChcblx0XHRcdFx0cE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IC0gbE5vZGUucG9zaXRpb24ueCxcblx0XHRcdFx0cE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IC0gbE5vZGUucG9zaXRpb24ueVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlQ2xpY2tlZCkge1xuXHRcdFx0XHQvLyBoYW5kbGUgY2xpY2sgY29kZVxuXHRcdFx0XHRsTm9kZS5jbGljayhwTW91c2VTdGF0ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGEgbm9kZSwgYWxsb3cgdGhlIG1vdXNlIHRvIGNvbnRyb2wgaXRzIG1vdmVtZW50XG5cdFx0aWYgKGxOb2RlLmRyYWdnaW5nKSB7XG5cdFx0XHRsTm9kZS5wb3NpdGlvbi54ID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IC0gbE5vZGUuZHJhZ1Bvc2l0aW9uLng7XG5cdFx0XHRsTm9kZS5wb3NpdGlvbi55ID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IC0gbE5vZGUuZHJhZ1Bvc2l0aW9uLnk7XG5cdFx0fVxuXHR9XG5cdFxuXHQvLyBkcmFnIHRoZSBib2FyZCBhcm91bmRcblx0aWYgKCFwTW91c2VTdGF0ZS5oYXNUYXJnZXQpIHtcblx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duKSB7XG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy13ZWJraXQtZ3JhYmJpbmcnO1xuXHRcdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctbW96LWdyYWJiaW5nJztcblx0XHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xuXHRcdFx0aWYgKCF0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQpIHtcblx0XHRcdFx0dGhpcy5tb3VzZVN0YXJ0RHJhZ0JvYXJkID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbjtcblx0XHRcdFx0dGhpcy5wcmV2Qm9hcmRPZmZzZXQueCA9IHRoaXMuYm9hcmRPZmZzZXQueDtcblx0XHRcdFx0dGhpcy5wcmV2Qm9hcmRPZmZzZXQueSA9IHRoaXMuYm9hcmRPZmZzZXQueTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLnByZXZCb2FyZE9mZnNldC54IC0gKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIHRoaXMubW91c2VTdGFydERyYWdCb2FyZC54KTtcblx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA+IHRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSB0aGlzLm1heEJvYXJkV2lkdGgvMjtcblx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueCA8IC0xKnRoaXMubWF4Qm9hcmRXaWR0aC8yKSB0aGlzLmJvYXJkT2Zmc2V0LnggPSAtMSp0aGlzLm1heEJvYXJkV2lkdGgvMjtcblx0XHRcdFx0dGhpcy5ib2FyZE9mZnNldC55ID0gdGhpcy5wcmV2Qm9hcmRPZmZzZXQueSAtIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSB0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQueSk7XG5cdFx0XHRcdGlmICh0aGlzLmJvYXJkT2Zmc2V0LnkgPiB0aGlzLm1heEJvYXJkSGVpZ2h0LzIpIHRoaXMuYm9hcmRPZmZzZXQueSA9IHRoaXMubWF4Qm9hcmRIZWlnaHQvMjtcblx0XHRcdFx0aWYgKHRoaXMuYm9hcmRPZmZzZXQueSA8IC0xKnRoaXMubWF4Qm9hcmRIZWlnaHQvMikgdGhpcy5ib2FyZE9mZnNldC55ID0gLTEqdGhpcy5tYXhCb2FyZEhlaWdodC8yO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm1vdXNlU3RhcnREcmFnQm9hcmQgPSB1bmRlZmluZWQ7XG5cdFx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJyc7XG5cdFx0fVxuICAgIH1cbiAgICBcblx0dGhpcy5wcmV2TW91c2VTdGF0ZSA9IHBNb3VzZVN0YXRlO1xufVxuXG5wLmRyYXcgPSBmdW5jdGlvbihjdHgsIGNhbnZhcywgY2VudGVyKXtcbiAgICBjdHguc2F2ZSgpO1xuXG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMuYm9hcmRPZmZzZXQ7XG4gICAgLy90cmFuc2xhdGUgdG8gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuXG4gICAgY3R4LnRyYW5zbGF0ZShjZW50ZXIueCAtIHRoaXMucG9zaXRpb24ueCwgY2VudGVyLnkgLSB0aGlzLnBvc2l0aW9uLnkpO1xuICAgIC8vY3R4LnRyYW5zbGF0ZSh0aGlzLmJvYXJkT2Zmc2V0LngsdGhpcy5ib2FyZE9mZnNldC55KTtcblx0XG5cdC8vIGRyYXcgdGhlIG5vZGVzXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVzc29uTm9kZUFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICBcbiAgICBcdC8vIHRlbXBvcmFyaWx5IGhpZGUgYWxsIGJ1dCB0aGUgZmlyc3QgcXVlc3Rpb25cblx0XHRpZiAodGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24ucmV2ZWFsVGhyZXNob2xkID4gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ubGlua3NBd2F5RnJvbU9yaWdpbikgY29udGludWU7XG4gICAgXHRcbiAgICBcdC8vIGRyYXcgdGhlIG5vZGUgaXRzZWxmXG4gICAgICAgIHRoaXMubGVzc29uTm9kZUFycmF5W2ldLmRyYXcoY3R4LCBjYW52YXMpO1xuICAgIH1cblxuXHQvLyBkcmF3IHRoZSBsaW5lc1xuXHRmb3IodmFyIGk9MDsgaTx0aGlzLmxlc3Nvbk5vZGVBcnJheS5sZW5ndGg7IGkrKyl7XG5cdFx0XG5cdFx0Ly8gb25seSBzaG93IGxpbmVzIGZyb20gc29sdmVkIHF1ZXN0aW9uc1xuXHRcdGlmICh0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5xdWVzdGlvbi5jdXJyZW50U3RhdGUhPVF1ZXN0aW9uLlNPTFZFX1NUQVRFLlNPTFZFRCkgY29udGludWU7XG5cdFx0XG5cdFx0Ly8gZ2V0IHRoZSBwaW4gcG9pc3Rpb24gaW4gdGhlIGNvcm5lciB3aXRoIG1hcmdpbiA1LDVcbiAgICAgICAgdmFyIHBpblggPSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5wb3NpdGlvbi54IC0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ud2lkdGgqdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uc2NhbGVGYWN0b3IvMiArIDE1O1xuICAgICAgICB2YXIgcGluWSA9IHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnBvc2l0aW9uLnkgLSB0aGlzLmxlc3Nvbk5vZGVBcnJheVtpXS5oZWlnaHQqdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0uc2NhbGVGYWN0b3IvMiArIDE1O1xuXHRcdFxuXHRcdC8vIHNldCBsaW5lIHN0eWxlXG5cdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJyZ2JhKDAsMCwxMDUsMC4yKVwiO1xuXHRcdGN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHRoaXMubGVzc29uTm9kZUFycmF5W2ldLnF1ZXN0aW9uLmNvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIFx0XG5cdFx0XHRpZiAodGhpcy5sZXNzb25Ob2RlQXJyYXlbdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal0gLSAxXS5xdWVzdGlvbi5jdXJyZW50U3RhdGU9PVF1ZXN0aW9uLlNPTFZFX1NUQVRFLkhJRERFTikgY29udGludWU7XG4gICAgICAgIFx0XG4gICAgICAgIFx0Ly8gZ28gdG8gdGhlIGluZGV4IGluIHRoZSBhcnJheSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBjb25uZWN0ZWQgbm9kZSBvbiB0aGlzIGJvYXJkIGFuZCBzYXZlIGl0cyBwb3NpdGlvblxuICAgICAgICBcdC8vIGNvbm5lY3Rpb24gaW5kZXggc2F2ZWQgaW4gdGhlIGxlc3Nvbk5vZGUncyBxdWVzdGlvblxuICAgICAgICBcdHZhciBjb25uZWN0aW9uID0gdGhpcy5sZXNzb25Ob2RlQXJyYXlbdGhpcy5sZXNzb25Ob2RlQXJyYXlbaV0ucXVlc3Rpb24uY29ubmVjdGlvbnNbal0gLSAxXTtcbiAgICAgICAgXHR2YXIgY1BvcyA9IGNvbm5lY3Rpb24ucG9zaXRpb247XG4gICAgICAgIFx0dmFyIGNXaWR0aCA9IGNvbm5lY3Rpb24ud2lkdGg7XG4gICAgICAgIFx0dmFyIGNIZWlnaHQgPSBjb25uZWN0aW9uLmhlaWdodDtcbiAgICAgICAgXHR2YXIgY1NjYWxlID0gY29ubmVjdGlvbi5zY2FsZUZhY3RvcjtcbiAgICAgICAgXHRcbiAgICAgICAgXHQvLyBkcmF3IHRoZSBsaW5lXG4gICAgICAgIFx0Y3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBcdC8vIHRyYW5zbGF0ZSB0byBzdGFydCAocGluKVxuICAgICAgICBcdGN0eC5tb3ZlVG8ocGluWCxwaW5ZKTtcbiAgICAgICAgXHRjdHgubGluZVRvKGNQb3MueCAtIGNXaWR0aCpjU2NhbGUvMiArIDE1LCBjUG9zLnkgLSBjSGVpZ2h0KmNTY2FsZS8yICsgMTUpO1xuICAgICAgICBcdGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgXHRjdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY3R4LnJlc3RvcmUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYm9hcmQ7XG5cbi8vdGhpcyBpcyBhbiBvYmplY3QgbmFtZWQgQm9hcmQgYW5kIHRoaXMgaXMgaXRzIGphdmFzY3JpcHRcbi8vdmFyIEJvYXJkID0gcmVxdWlyZSgnLi9vYmplY3RzL2JvYXJkLmpzJyk7XG4vL3ZhciBiID0gbmV3IEJvYXJkKCk7XG4gICAgIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXG5mdW5jdGlvbiBidXR0b24oc3RhcnRQb3NpdGlvbiwgd2lkdGgsIGhlaWdodCl7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLmNsaWNrZWQgPSBmYWxzZTtcbiAgICB0aGlzLmhvdmVyZWQgPSBmYWxzZTtcbn1cbmJ1dHRvbi5kcmF3TGliID0gdW5kZWZpbmVkO1xuXG52YXIgcCA9IGJ1dHRvbi5wcm90b3R5cGU7XG5cbnAuZHJhdyA9IGZ1bmN0aW9uKGN0eCl7XG4gICAgY3R4LnNhdmUoKTtcbiAgICB2YXIgY29sO1xuICAgIGlmKHRoaXMuaG92ZXJlZCl7XG4gICAgICAgIGNvbCA9IFwiZG9kZ2VyYmx1ZVwiO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBjb2wgPSBcImxpZ2h0Ymx1ZVwiO1xuICAgIH1cbiAgICAvL2RyYXcgcm91bmRlZCBjb250YWluZXJcbiAgICBib2FyZEJ1dHRvbi5kcmF3TGliLnJlY3QoY3R4LCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLndpZHRoLzIsIHRoaXMucG9zaXRpb24ueSAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBjb2wpO1xuXG4gICAgY3R4LnJlc3RvcmUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnV0dG9uOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XG5cbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcbmZ1bmN0aW9uIENhdGVnb3J5KG5hbWUsIHhtbCwgcmVzb3VyY2VzLCB1cmwsIHdpbmRvd0Rpdil7XG5cdFxuXHQvLyBTYXZlIHRoZSBuYW1lXG5cdHRoaXMubmFtZSA9IG5hbWU7XG5cdFxuXHQvLyBMb2FkIGFsbCB0aGUgcXVlc3Rpb25zXG5cdHZhciBxdWVzdGlvbkVsZW1lbnRzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xuXHR0aGlzLnF1ZXN0aW9ucyA9IFtdO1xuXHQvLyBjcmVhdGUgcXVlc3Rpb25zXG5cdGZvciAodmFyIGk9MDsgaTxxdWVzdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBcblx0e1xuXHRcdC8vIGNyZWF0ZSBhIHF1ZXN0aW9uIG9iamVjdFxuXHRcdHRoaXMucXVlc3Rpb25zW2ldID0gbmV3IFF1ZXN0aW9uKHF1ZXN0aW9uRWxlbWVudHNbaV0sIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpO1xuXHR9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2F0ZWdvcnk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vTW9kdWxlIGV4cG9ydFxudmFyIG0gPSBtb2R1bGUuZXhwb3J0cztcblxuLy8gVGhlIHNpemUgb2YgdGhlIGJvYXJkIGluIGdhbWUgdW5pdHMgYXQgMTAwJSB6b29tXG5tLmJvYXJkU2l6ZSA9IHt4OjE5MjAsIHk6MTA4MH07XG5cbi8vIFRoZSBzY2FsZSBvZiB0aGUgYm9hcmQgdG8gZ2FtZSB2aWV3IGF0IDEwMCUgem9vbVxubS5ib2FyZFNjYWxlID0gMjsiLCJcInVzZSBzdHJpY3RcIjtcblxuLy9Nb2R1bGUgZXhwb3J0XG52YXIgbSA9IG1vZHVsZS5leHBvcnRzO1xuXG5tLmNsZWFyID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoKSB7XG4gICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKTtcbn1cblxubS5yZWN0ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoLCBjb2wsIGNlbnRlck9yaWdpbikge1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbDtcbiAgICBpZihjZW50ZXJPcmlnaW4pe1xuICAgICAgICBjdHguZmlsbFJlY3QoeCAtICh3IC8gMiksIHkgLSAoaCAvIDIpLCB3LCBoKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHcsIGgpO1xuICAgIH1cbiAgICBjdHgucmVzdG9yZSgpO1xufVxuXG5tLmxpbmUgPSBmdW5jdGlvbihjdHgsIHgxLCB5MSwgeDIsIHkyLCB0aGlja25lc3MsIGNvbG9yKSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyh4MSwgeTEpO1xuICAgIGN0eC5saW5lVG8oeDIsIHkyKTtcbiAgICBjdHgubGluZVdpZHRoID0gdGhpY2tuZXNzO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHgucmVzdG9yZSgpO1xufVxuXG5tLmNpcmNsZSA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgcmFkaXVzLCBjb2xvcil7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LmFyYyh4LHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHgucmVzdG9yZSgpO1xufVxuXG5mdW5jdGlvbiBib2FyZEJ1dHRvbihjdHgsIHBvc2l0aW9uLCB3aWR0aCwgaGVpZ2h0LCBob3ZlcmVkKXtcbiAgICAvL2N0eC5zYXZlKCk7XG4gICAgaWYoaG92ZXJlZCl7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImRvZGdlcmJsdWVcIjtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwibGlnaHRibHVlXCI7XG4gICAgfVxuICAgIC8vZHJhdyByb3VuZGVkIGNvbnRhaW5lclxuICAgIGN0eC5yZWN0KHBvc2l0aW9uLnggLSB3aWR0aC8yLCBwb3NpdGlvbi55IC0gaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQpO1xuICAgIGN0eC5saW5lV2lkdGggPSA1O1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICBjdHguc3Ryb2tlKCk7XG4gICAgY3R4LmZpbGwoKTtcbiAgICAvL2N0eC5yZXN0b3JlKCk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgQm9hcmQgPSByZXF1aXJlKCcuL2JvYXJkLmpzJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL3BvaW50LmpzJyk7XG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4vZHJhd0xpYi5qcycpO1xudmFyIExlc3Nvbk5vZGUgPSByZXF1aXJlKCcuL2xlc3Nvbk5vZGUuanMnKTtcbnZhciBVdGlsaXR5ID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcbnZhciBEYXRhUGFyc2VyID0gcmVxdWlyZSgnLi9pcGFyRGF0YVBhcnNlci5qcycpO1xuXG4vL21vdXNlIG1hbmFnZW1lbnRcbnZhciBtb3VzZVN0YXRlO1xudmFyIHByZXZpb3VzTW91c2VTdGF0ZTtcbnZhciBkcmFnZ2luZ0Rpc2FibGVkO1xudmFyIG1vdXNlVGFyZ2V0O1xudmFyIG1vdXNlU3VzdGFpbmVkRG93bjtcblxuLy9waGFzZSBoYW5kbGluZ1xudmFyIHBoYXNlT2JqZWN0O1xuXG5cbmZ1bmN0aW9uIGdhbWUodXJsLCB3aW5kb3dEaXYpe1xuXHR2YXIgZ2FtZSA9IHRoaXM7XG5cdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdERhdGFQYXJzZXIucGFyc2VEYXRhKHVybCwgd2luZG93RGl2LCBmdW5jdGlvbihjYXRlZ29yaWVzKXtcblx0XHRnYW1lLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzO1xuXHRcdGdhbWUuY3JlYXRlTGVzc29uTm9kZXMoKTtcblx0fSk7XG59XG5cbnZhciBwID0gZ2FtZS5wcm90b3R5cGU7XG5cbnAuY3JlYXRlTGVzc29uTm9kZXMgPSBmdW5jdGlvbigpe1xuXHR0aGlzLmJvYXJkQXJyYXkgPSBbXTtcblx0dmFyIGJvdHRvbUJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm90dG9tQmFyXCIpO1xuXHRmb3IodmFyIGk9MDtpPHRoaXMuY2F0ZWdvcmllcy5sZW5ndGg7aSsrKXtcblx0XHQvLyBpbml0aWFsaXplIGVtcHR5XG5cdFx0XG5cdFx0dGhpcy5sZXNzb25Ob2RlcyA9IFtdO1xuXHRcdC8vIGFkZCBhIG5vZGUgcGVyIHF1ZXN0aW9uXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zLmxlbmd0aDsgaisrKSB7XG5cdFx0XHQvLyBjcmVhdGUgYSBuZXcgbGVzc29uIG5vZGVcblx0XHRcdHRoaXMubGVzc29uTm9kZXMucHVzaChuZXcgTGVzc29uTm9kZShuZXcgUG9pbnQodGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXS5wb3NpdGlvblBlcmNlbnRYLCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLnBvc2l0aW9uUGVyY2VudFkpLCB0aGlzLmNhdGVnb3JpZXNbaV0ucXVlc3Rpb25zW2pdLmltYWdlTGluaywgdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXSApICk7XG5cdFx0XHQvLyBhdHRhY2ggcXVlc3Rpb24gb2JqZWN0IHRvIGxlc3NvbiBub2RlXG5cdFx0XHR0aGlzLmxlc3Nvbk5vZGVzW3RoaXMubGVzc29uTm9kZXMubGVuZ3RoLTFdLnF1ZXN0aW9uID0gdGhpcy5jYXRlZ29yaWVzW2ldLnF1ZXN0aW9uc1tqXTtcblx0XHRcblx0XHR9XG5cblx0XHQvLyBjcmVhdGUgYSBib2FyZFxuXHRcdHRoaXMuYm9hcmRBcnJheS5wdXNoKG5ldyBCb2FyZChuZXcgUG9pbnQoMCwwKSwgdGhpcy5sZXNzb25Ob2RlcykpO1xuXHRcdHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiQlVUVE9OXCIpO1xuXHRcdGJ1dHRvbi5pbm5lckhUTUwgPSB0aGlzLmNhdGVnb3JpZXNbaV0ubmFtZTtcblx0XHR2YXIgZ2FtZSA9IHRoaXM7XG5cdFx0YnV0dG9uLm9uY2xpY2sgPSAoZnVuY3Rpb24oaSl7IFxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZihnYW1lLmFjdGl2ZSlcblx0XHRcdFx0XHRnYW1lLmFjdGl2ZUJvYXJkSW5kZXggPSBpO1xuXHRcdH19KShpKTtcblx0XHRib3R0b21CYXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcblx0fVxuXHR0aGlzLmFjdGl2ZUJvYXJkSW5kZXggPSAwO1xuXHR0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cbnAudXBkYXRlID0gZnVuY3Rpb24oY3R4LCBjYW52YXMsIGR0LCBwTW91c2VTdGF0ZSl7XG5cdFxuXHRpZih0aGlzLmFjdGl2ZSl7XG5cdCAgICAvLyBtb3VzZVxuXHQgICAgcHJldmlvdXNNb3VzZVN0YXRlID0gbW91c2VTdGF0ZTtcblx0ICAgIG1vdXNlU3RhdGUgPSBwTW91c2VTdGF0ZTtcblx0ICAgIG1vdXNlVGFyZ2V0ID0gMDtcblx0ICAgIGlmKHR5cGVvZiBwcmV2aW91c01vdXNlU3RhdGUgPT09ICd1bmRlZmluZWQnKXtcblx0ICAgICAgICBwcmV2aW91c01vdXNlU3RhdGUgPSBtb3VzZVN0YXRlO1xuXHQgICAgfVxuXHQgICAgLy9kcmF3IHN0dWZmXG5cdCAgICB0aGlzLmRyYXcoY3R4LCBjYW52YXMpO1xuXHQgICAgXG5cdCAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgYm9hcmRcblx0ICAgIHRoaXMuYm9hcmRBcnJheVt0aGlzLmFjdGl2ZUJvYXJkSW5kZXhdLmFjdChwTW91c2VTdGF0ZSk7XG5cdH1cbn1cblxucC5kcmF3ID0gZnVuY3Rpb24oY3R4LCBjYW52YXMpe1xuXHQvL2RyYXcgZGVidWcgYmFja2dyb3VuZFxuICAgIGN0eC5zYXZlKCk7XG4gICAgRHJhd0xpYi5jbGVhcihjdHgsIDAsIDAsIGNhbnZhcy5vZmZzZXRXaWR0aCwgY2FudmFzLm9mZnNldEhlaWdodCk7XG4gICAgRHJhd0xpYi5yZWN0KGN0eCwgMCwgMCwgY2FudmFzLm9mZnNldFdpZHRoLCBjYW52YXMub2Zmc2V0SGVpZ2h0LCBcIndoaXRlXCIsIGZhbHNlKTtcbiAgICBEcmF3TGliLmxpbmUoY3R4LCBjYW52YXMub2Zmc2V0V2lkdGgvMiwgMCwgY2FudmFzLm9mZnNldFdpZHRoLzIsIGNhbnZhcy5vZmZzZXRIZWlnaHQsIDIsIFwibGlnaHRncmF5XCIpO1xuICAgIERyYXdMaWIubGluZShjdHgsIDAsIGNhbnZhcy5vZmZzZXRIZWlnaHQvMiwgY2FudmFzLm9mZnNldFdpZHRoLCBjYW52YXMub2Zmc2V0SGVpZ2h0LzIsIDIsIFwibGlnaHRHcmF5XCIpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG5cdFxuICAgIC8vIERyYXcgdGhlIGN1cnJlbnQgYm9hcmRcbiAgICB0aGlzLmJvYXJkQXJyYXlbdGhpcy5hY3RpdmVCb2FyZEluZGV4XS5kcmF3KGN0eCwgY2FudmFzLCB7eDpjYW52YXMub2Zmc2V0V2lkdGgvMiwgeTpjYW52YXMub2Zmc2V0SGVpZ2h0LzJ9KTtcbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIENhdGVnb3J5ID0gcmVxdWlyZShcIi4vY2F0ZWdvcnkuanNcIik7XG52YXIgUmVzb3VyY2UgPSByZXF1aXJlKFwiLi9yZXNvdXJjZXMuanNcIik7XG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi91dGlsaXRpZXMuanMnKTtcbndpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMICA9IHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMIHx8IHdpbmRvdy53ZWJraXRSZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMO1xuXG4vLyBQYXJzZXMgdGhlIHhtbCBjYXNlIGZpbGVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBrbm93biB0YWdzXG4vKlxuYW5zd2VyXG5idXR0b25cbmNhdGVnb3J5TGlzdFxuY29ubmVjdGlvbnNcbmVsZW1lbnRcbmZlZWRiYWNrXG5pbnN0cnVjdGlvbnNcbnJlc291cmNlXG5yZXNvdXJjZUxpc3RcbnJlc291cmNlSW5kZXhcbnNvZnR3YXJlTGlzdFxucXVlc3Rpb25cbnF1ZXN0aW9uVGV4dFxucXVzdGlvbk5hbWVcbiovXG5cbi8vIE1vZHVsZSBleHBvcnRcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XG5cbi8vIGNvbnN0cnVjdG9yXG5tLnBhcnNlRGF0YSA9IGZ1bmN0aW9uKHVybCwgd2luZG93RGl2LCBjYWxsYmFjaykge1xuICAgIFxuICAgIHRoaXMuY2F0ZWdvcmllcyA9IFtdO1xuICAgIHRoaXMucXVlc3Rpb25zID0gW107XG4gICAgXG5cdC8vIGdldCBYTUxcbiAgICB3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTCh1cmwrJ2FjdGl2ZS9jYXNlRmlsZS5pcGFyZGF0YScsIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xuXHRcdGZpbGVFbnRyeS5maWxlKGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIEdldCB0aGUgcmF3IGRhdGFcblx0XHRcdFx0dmFyIHJhd0RhdGEgPSBVdGlsaXRpZXMuZ2V0WG1sKHRoaXMucmVzdWx0KTtcblx0XHRcdFx0dmFyIGNhdGVnb3JpZXMgPSBnZXRDYXRlZ29yaWVzQW5kUXVlc3Rpb25zKHJhd0RhdGEsIHVybCwgd2luZG93RGl2KTtcblx0XHRcdFx0Y2FsbGJhY2soY2F0ZWdvcmllcyk7XG5cdFx0XHQgICBcblx0XHRcdH07XG5cdFx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcblx0XHQgICBcblx0XHR9LCBmdW5jdGlvbihlKXtcblx0XHRcdGNvbnNvbGUubG9nKFwiRXJyb3I6IFwiK2UubWVzc2FnZSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vLyB0YWtlcyB0aGUgeG1sIHN0cnVjdHVyZSBhbmQgZmlsbHMgaW4gdGhlIGRhdGEgZm9yIHRoZSBxdWVzdGlvbiBvYmplY3RcbmZ1bmN0aW9uIGdldENhdGVnb3JpZXNBbmRRdWVzdGlvbnMocmF3RGF0YSwgdXJsLCB3aW5kb3dEaXYpIHtcblx0Ly8gaWYgdGhlcmUgaXMgYSBjYXNlIGZpbGVcblx0aWYgKHJhd0RhdGEgIT0gbnVsbCkge1xuXHRcdFxuXHRcdC8vIEZpcnN0IGxvYWQgdGhlIHJlc291cmNlc1xuXHRcdHZhciByZXNvdXJjZUVsZW1lbnRzID0gcmF3RGF0YS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlTGlzdFwiKVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInJlc291cmNlXCIpO1xuXHRcdHZhciByZXNvdXJjZXMgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7IGk8cmVzb3VyY2VFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Ly8gTG9hZCBlYWNoIHJlc291cmNlXG5cdFx0XHRyZXNvdXJjZXNbaV0gPSBuZXcgUmVzb3VyY2UocmVzb3VyY2VFbGVtZW50c1tpXSwgdXJsKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gVGhlbiBsb2FkIHRoZSBjYXRlZ29yaWVzXG5cdFx0dmFyIGNhdGVnb3J5RWxlbWVudHMgPSByYXdEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlcIik7XG5cdFx0dmFyIGNhdGVnb3J5TmFtZXMgPSByYXdEYXRhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2F0ZWdvcnlMaXN0XCIpWzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZWxlbWVudFwiKTtcblx0XHR2YXIgY2F0ZWdvcmllcyA9IFtdO1xuXHRcdGZvciAodmFyIGk9MDsgaTxjYXRlZ29yeUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHQvLyBMb2FkIGVhY2ggY2F0ZWdvcnkgKHdoaWNoIGxvYWRzIGVhY2ggcXVlc3Rpb24pXG5cdFx0XHRjYXRlZ29yaWVzW2ldID0gbmV3IENhdGVnb3J5KGNhdGVnb3J5TmFtZXNbaV0uaW5uZXJIVE1MLCBjYXRlZ29yeUVsZW1lbnRzW2ldLCByZXNvdXJjZXMsIHVybCwgd2luZG93RGl2KTtcblx0XHR9XG5cdFx0cmV0dXJuIGNhdGVnb3JpZXM7XG5cdH1cblx0cmV0dXJuIG51bGxcbn0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi9kcmF3TGliLmpzJyk7XG52YXIgUXVlc3Rpb24gPSByZXF1aXJlKFwiLi9xdWVzdGlvbi5qc1wiKTtcblxuLy9wYXJhbWV0ZXIgaXMgYSBwb2ludCB0aGF0IGRlbm90ZXMgc3RhcnRpbmcgcG9zaXRpb25cbmZ1bmN0aW9uIGxlc3Nvbk5vZGUoc3RhcnRQb3NpdGlvbiwgaW1hZ2VQYXRoLCBwUXVlc3Rpb24pe1xuICAgIFxuICAgIHRoaXMucG9zaXRpb24gPSBzdGFydFBvc2l0aW9uO1xuICAgIHRoaXMuZHJhZ0xvY2F0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubW91c2VPdmVyID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xuICAgIHRoaXMuc2NhbGVGYWN0b3IgPSAxO1xuICAgIHRoaXMudHlwZSA9IFwibGVzc29uTm9kZVwiO1xuICAgIHRoaXMuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICB0aGlzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0O1xuICAgIHRoaXMucXVlc3Rpb24gPSBwUXVlc3Rpb247XG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IDA7XG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSB0aGlzLnF1ZXN0aW9uLmN1cnJlbnRTdGF0ZTtcbiAgICBcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgLy9pbWFnZSBsb2FkaW5nIGFuZCByZXNpemluZ1xuICAgIHRoaXMuaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQud2lkdGggPSB0aGF0LmltYWdlLm5hdHVyYWxXaWR0aDtcbiAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gICAgICAgIHZhciBtYXhEaW1lbnNpb24gPSAxMDA7XG4gICAgICAgIC8vdG9vIHNtYWxsP1xuICAgICAgICBpZih0aGF0LndpZHRoIDwgbWF4RGltZW5zaW9uICYmIHRoYXQuaGVpZ2h0IDwgbWF4RGltZW5zaW9uKXtcbiAgICAgICAgICAgIHZhciB4O1xuICAgICAgICAgICAgaWYodGhhdC53aWR0aCA+IHRoYXQuaGVpZ2h0KXtcbiAgICAgICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhhdC53aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgeCA9IG1heERpbWVuc2lvbiAvIHRoYXQuaGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC53aWR0aCA9IHRoYXQud2lkdGggKiB4O1xuICAgICAgICAgICAgdGhhdC5oZWlnaHQgPSB0aGF0LmhlaWdodCAqIHg7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhhdC53aWR0aCA+IG1heERpbWVuc2lvbiB8fCB0aGF0LmhlaWdodCA+IG1heERpbWVuc2lvbil7XG4gICAgICAgICAgICB2YXIgeDtcbiAgICAgICAgICAgIGlmKHRoYXQud2lkdGggPiB0aGF0LmhlaWdodCl7XG4gICAgICAgICAgICAgICAgeCA9IHRoYXQud2lkdGggLyBtYXhEaW1lbnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIHggPSB0aGF0LmhlaWdodCAvIG1heERpbWVuc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQud2lkdGggPSB0aGF0LndpZHRoIC8geDtcbiAgICAgICAgICAgIHRoYXQuaGVpZ2h0ID0gdGhhdC5oZWlnaHQgLyB4O1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmltYWdlLnNyYyA9IGltYWdlUGF0aDtcbn1cblxudmFyIHAgPSBsZXNzb25Ob2RlLnByb3RvdHlwZTtcblxucC5kcmF3ID0gZnVuY3Rpb24oY3R4LCBjYW52YXMpe1xuXG5cdC8vIENoZWNrIGlmIHF1ZXN0aW9uIGlzIHZpc2libGVcblx0aWYodGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGU9PVF1ZXN0aW9uLlNPTFZFX1NUQVRFLkhJRERFTil7XG5cdFx0aWYodGhpcy5xdWVzdGlvbi5yZXZlYWxUaHJlc2hvbGQgPD0gdGhpcy5jb25uZWN0aW9ucylcblx0XHRcdHRoaXMucXVlc3Rpb24uY3VycmVudFN0YXRlID0gUXVlc3Rpb24uU09MVkVfU1RBVEUuVU5TT0xWRUQ7XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuO1xuXHR9XG5cdFxuICAgIC8vbGVzc29uTm9kZS5kcmF3TGliLmNpcmNsZShjdHgsIHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55LCAxMCwgXCJyZWRcIik7XG4gICAgLy9kcmF3IHRoZSBpbWFnZSwgc2hhZG93IGlmIGhvdmVyZWRcbiAgICBjdHguc2F2ZSgpO1xuICAgIGlmKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICBcdGN0eC5zaGFkb3dDb2xvciA9ICd5ZWxsb3cnO1xuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICctd2Via2l0LWdyYWJiaW5nJztcblx0XHRjYW52YXMuc3R5bGUuY3Vyc29yID0gJy1tb3otZ3JhYmJpbmcnO1xuXHRcdGNhbnZhcy5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMubW91c2VPdmVyKXtcbiAgICAgICAgY3R4LnNoYWRvd0NvbG9yID0gJ2RvZGdlckJsdWUnO1xuICAgICAgICBjdHguc2hhZG93Qmx1ciA9IDU7XG5cdFx0Y2FudmFzLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICB9XG4gICAgLy9kcmF3aW5nIHRoZSBidXR0b24gaW1hZ2VcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIHRoaXMucG9zaXRpb24ueCAtICh0aGlzLndpZHRoKnRoaXMuc2NhbGVGYWN0b3IpLzIsIHRoaXMucG9zaXRpb24ueSAtICh0aGlzLmhlaWdodCp0aGlzLnNjYWxlRmFjdG9yKS8yLCB0aGlzLndpZHRoICogdGhpcy5zY2FsZUZhY3RvciwgdGhpcy5oZWlnaHQgKiB0aGlzLnNjYWxlRmFjdG9yKTtcbiAgICBcbiAgICAvL2RyYXdpbmcgdGhlIHBpblxuICAgIHN3aXRjaCAodGhpcy5xdWVzdGlvbi5jdXJyZW50U3RhdGUpIHtcbiAgICBcdGNhc2UgMTpcbiAgICBcdFx0Y3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xuXHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gXCJjeWFuXCI7XG5cdFx0XHRicmVhaztcbiAgICAgXHRjYXNlIDI6XG4gICAgXHRcdGN0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XG5cdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSBcInllbGxvd1wiO1xuXHRcdFx0YnJlYWs7XG4gICAgfVxuXHRjdHgubGluZVdpZHRoID0gMjtcblxuXHRjdHguYmVnaW5QYXRoKCk7XG5cdGN0eC5hcmModGhpcy5wb3NpdGlvbi54IC0gKHRoaXMud2lkdGgqdGhpcy5zY2FsZUZhY3RvcikvMiArIDE1LHRoaXMucG9zaXRpb24ueSAtICh0aGlzLmhlaWdodCp0aGlzLnNjYWxlRmFjdG9yKS8yICsgMTUsNiwwLDIqTWF0aC5QSSk7XG5cdGN0eC5jbG9zZVBhdGgoKTtcblx0Y3R4LmZpbGwoKTtcblx0Y3R4LnN0cm9rZSgpO1xuICAgIFxuICAgIGN0eC5yZXN0b3JlKCk7XG59O1xuXG5wLmNsaWNrID0gZnVuY3Rpb24obW91c2VTdGF0ZSl7XG4gICAgdGhpcy5xdWVzdGlvbi5kaXNwbGF5V2luZG93cygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxlc3Nvbk5vZGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBtb3VzZVN0YXRlKHBQb3NpdGlvbiwgcFJlbGF0aXZlUG9zaXRpb24sIHBNb3VzZWRvd24sIHBNb3VzZUluLCBwTW91c2VDbGlja2VkKXtcbiAgICB0aGlzLnBvc2l0aW9uID0gcFBvc2l0aW9uO1xuICAgIHRoaXMucmVsYXRpdmVQb3NpdGlvbiA9IHBSZWxhdGl2ZVBvc2l0aW9uO1xuICAgIHRoaXMubW91c2VEb3duID0gcE1vdXNlZG93bjtcbiAgICB0aGlzLm1vdXNlSW4gPSBwTW91c2VJbjtcbiAgICB0aGlzLnByZXZNb3VzZURvd24gPSBwTW91c2Vkb3duO1xuICAgIHRoaXMubW91c2VDbGlja2VkID0gcE1vdXNlQ2xpY2tlZDtcbiAgICB0aGlzLmhhc1RhcmdldCA9IGZhbHNlO1xufVxuXG52YXIgcCA9IG1vdXNlU3RhdGUucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vdXNlU3RhdGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgQm9hcmQgPSByZXF1aXJlKCcuLi9ib2FyZC5qcycpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vcG9pbnQuanMnKTtcbnZhciBMZXNzb25Ob2RlID0gcmVxdWlyZSgnLi4vbGVzc29uTm9kZS5qcycpO1xudmFyIElwYXJEYXRhUGFyc2VyID0gcmVxdWlyZSgnLi4vaXBhckRhdGFQYXJzZXIuanMnKTtcbnZhciBRdWVzdGlvbiA9IHJlcXVpcmUoJy4uL3F1ZXN0aW9uLmpzJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9wb2ludC5qcycpO1xudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy5qcycpO1xuXG52YXIgYm9hcmRBcnJheTtcbnZhciBtYXhCb2FyZFdpZHRoID0gMTAwMDtcbnZhciBtYXhCb2FyZEhlaWdodCA9IDgwMDtcbnZhciBjdXJyZW50Qm9hcmQ7XG52YXIgcXVlc3Rpb25zO1xudmFyIGFjdGl2ZUJvYXJkSW5kZXg7XG4vL2hhcyBldmVyeXRoaW5nIGxvYWRlZD9cbnZhciBsb2FkaW5nQ29tcGxldGU7XG4vLyBzYXZlIHRoZSBsYXN0IHN0YXRlIG9mIHRoZSBtb3VzZSBmb3IgY2hlY2tpbmcgY2xpY2tzXG52YXIgcHJldk1vdXNlU3RhdGU7XG5cbnZhciB1dGlsaXRpZXM7XG5cbi8vIGRyYWcgdGhlIGJvYXJkXG52YXIgbW91c2VTdGFydERyYWdCb2FyZCA9IHVuZGVmaW5lZDtcbnZhciBib2FyZE9mZnNldCA9IHt4OjAseTowfTtcbnZhciBwcmV2Qm9hcmRPZmZzZXQgPSB7eDowLHk6MH07XG5cbmZ1bmN0aW9uIGJvYXJkUGhhc2UocFVybCl7XG4gICAgbG9hZGluZ0NvbXBsZXRlID0gZmFsc2U7XG4gICAgcHJvY2Vzc0RhdGEocFVybCk7XG4gICAgdXRpbGl0aWVzID0gbmV3IFV0aWxpdGllcygpO1xufVx0XG5cblxuZnVuY3Rpb24gcHJvY2Vzc0RhdGEocFVybCl7XG5cdC8vIGluaXRpYWxpemVcbiAgICBib2FyZEFycmF5ID0gW107XG4gICAgLy8gY3JlYXRlIHRoZSBwYXJzZXJcbiAgICB2YXIgZXh0cmFjdGVkRGF0YSA9IG5ldyBJcGFyRGF0YVBhcnNlcihcIi4vZGF0YS9teWRhdGEueG1sXCIsIGRhdGFMb2FkZWQpO1xufVxuXG5mdW5jdGlvbiBkYXRhTG9hZGVkKGNhdGVnb3J5RGF0YSkge1xuXHQvL3F1ZXN0aW9ucyA9IGlwYXJQYXJzZXIuZ2V0UXVlc3Rpb25zQXJyYXkoKTtcbiAgICAvL2NyZWF0ZUxlc3Nvbk5vZGVzRnJvbVF1ZXN0aW9ucyhxdWVzdGlvbnMpO1xuICAgIGNyZWF0ZUxlc3Nvbk5vZGVzSW5Cb2FyZHMoY2F0ZWdvcnlEYXRhKTtcbiAgICBsb2FkaW5nQ29tcGxldGUgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMZXNzb25Ob2Rlc0luQm9hcmRzKGNhdGVnb3JpZXMpIHtcblx0Y2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uKGNhdCkge1xuXHRcdC8vIGluaXRpYWxpemUgZW1wdHlcblx0XHR2YXIgbGVzc29uTm9kZXMgPSBbXTtcblx0XHQvLyBhZGQgYSBub2RlIHBlciBxdWVzdGlvblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2F0LnF1ZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Ly8gY3JlYXRlIGEgbmV3IGxlc3NvbiBub2RlXG5cdFx0XHRsZXNzb25Ob2Rlcy5wdXNoKG5ldyBMZXNzb25Ob2RlKG5ldyBQb2ludChjYXQucXVlc3Rpb25zW2ldLnBvc2l0aW9uUGVyY2VudFgsIGNhdC5xdWVzdGlvbnNbaV0ucG9zaXRpb25QZXJjZW50WSksIGNhdC5xdWVzdGlvbnNbaV0uaW1hZ2VMaW5rLCBjYXQucXVlc3Rpb25zW2ldICkgKTtcblx0XHRcdC8vIGF0dGFjaCBxdWVzdGlvbiBvYmplY3QgdG8gbGVzc29uIG5vZGVcblx0XHRcdGxlc3Nvbk5vZGVzW2xlc3Nvbk5vZGVzLmxlbmd0aC0xXS5xdWVzdGlvbiA9IGNhdC5xdWVzdGlvbnNbaV07XG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiaW1hZ2U6IFwiK2xlc3Nvbk5vZGVzW2xlc3Nvbk5vZGVzLmxlbmd0aC0xXS5pbWFnZS5nZXRBdHRyaWJ1dGUoXCJzcmNcIikpO1xuXHRcdFxuXHRcdH1cblx0XHQvLyBjcmVhdGUgYSBib2FyZFxuXHRcdGJvYXJkQXJyYXkucHVzaChuZXcgQm9hcmQobmV3IFBvaW50KDAsMCksIGxlc3Nvbk5vZGVzKSk7XG5cdFx0Ly9jb25zb2xlLmxvZyhib2FyZEFycmF5W2JvYXJkQXJyYXkubGVuZ3RoLTFdLmxlc3Nvbk5vZGVBcnJheVswXS5xdWVzdGlvbik7XG5cdH0pO1xuXHRhY3RpdmVCb2FyZEluZGV4ID0gMzsgLy8gc3RhcnQgd2l0aCB0aGUgZmlyc3QgYm9hcmQgKGFjdHVhbGx5IGl0cyB0aGUgc2Vjb25kIG5vdyBzbyBJIGNhbiBkZWJ1Zylcbn1cblxuXG52YXIgcCA9IGJvYXJkUGhhc2UucHJvdG90eXBlO1xuXG5wLnVwZGF0ZSA9IGZ1bmN0aW9uKGN0eCwgY2FudmFzLCBkdCwgY2VudGVyLCBhY3RpdmVIZWlnaHQsIHBNb3VzZVN0YXRlLCBib2FyZE9mZnNldCkge1xuICAgIHAuYWN0KHBNb3VzZVN0YXRlKTtcbiAgICBwLmRyYXcoY3R4LCBjYW52YXMsIGNlbnRlciwgYWN0aXZlSGVpZ2h0KTtcbiAgICBpZiAoYWN0aXZlQm9hcmRJbmRleCkgYm9hcmRBcnJheVthY3RpdmVCb2FyZEluZGV4XS51cGRhdGUoKTtcbn1cblxucC5hY3QgPSBmdW5jdGlvbihwTW91c2VTdGF0ZSl7XG5cdC8vIGhvdmVyIHN0YXRlc1xuXHQvL2Zvcih2YXIgaSA9IDA7IGkgPCBib2FyZEFycmF5Lmxlbmd0aDsgaSsrKXtcblx0XHQvLyBsb29wIHRocm91Z2ggbGVzc29uIG5vZGVzIHRvIGNoZWNrIGZvciBob3ZlclxuXHRpZiAoYWN0aXZlQm9hcmRJbmRleCAhPSB1bmRlZmluZWQpIHtcblx0XHQvLyB1cGRhdGUgYm9hcmRcblx0XHRcblx0XHR2YXIgbm9kZUNob3NlbiA9IGZhbHNlO1xuXHRcdGZvciAodmFyIGk9Ym9hcmRBcnJheVthY3RpdmVCb2FyZEluZGV4XS5sZXNzb25Ob2RlQXJyYXkubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuXHRcdFx0aWYgKGJvYXJkQXJyYXlbYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5W2ldLmRyYWdnaW5nKSB7XG5cdFx0XHRcdC8vbm9kZUNob3NlbiA9IHRydWU7XG5cdFx0XHRcdHBNb3VzZVN0YXRlLmhhc1RhcmdldCA9IHRydWU7XG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRcblx0XHRmb3IgKHZhciBpPWJvYXJkQXJyYXlbYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5Lmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcblx0XHRcdHZhciBsTm9kZSA9IGJvYXJkQXJyYXlbYWN0aXZlQm9hcmRJbmRleF0ubGVzc29uTm9kZUFycmF5W2ldO1xuXHRcdFx0XG5cdFx0XHRpZiAoIXBNb3VzZVN0YXRlLm1vdXNlRG93bikge1xuXHRcdFx0XHRsTm9kZS5kcmFnUG9zaXRpb24gPSB1bmRlZmluZWQ7IC8vIGNsZWFyIGRyYWcgYmVoYXZpb3Jcblx0XHRcdFx0bE5vZGUuZHJhZ2dpbmcgPSBmYWxzZTtcblx0XHRcdH0gXG5cdFx0XHRcblx0XHRcdGxOb2RlLm1vdXNlT3ZlciA9IGZhbHNlO1xuXHRcdFx0XG5cdFx0XHQvLyBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgc2VsZWN0ZWQgbm9kZSwgZG8gbm90IHRyeSB0byBzZWxlY3QgYW5vdGhlclxuXHRcdFx0aWYgKG5vZGVDaG9zZW4pIHsgIGNvbnRpbnVlOyB9XG5cdFx0XHRcblx0XHRcdC8vY29uc29sZS5sb2coXCJub2RlIHVwZGF0ZVwiKTtcblx0XHRcdC8vIGlmIGhvdmVyaW5nLCBzaG93IGhvdmVyIGdsb3dcblx0XHRcdC8qaWYgKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA+IGxOb2RlLnBvc2l0aW9uLngtbE5vZGUud2lkdGgvMiBcblx0XHRcdCYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA8IGxOb2RlLnBvc2l0aW9uLngrbE5vZGUud2lkdGgvMlxuXHRcdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ID4gbE5vZGUucG9zaXRpb24ueS1sTm9kZS5oZWlnaHQvMlxuXHRcdFx0JiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IDwgbE5vZGUucG9zaXRpb24ueStsTm9kZS5oZWlnaHQvMikgeyovXG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0aWYgKHV0aWxpdGllcy5tb3VzZUludGVyc2VjdChwTW91c2VTdGF0ZSxsTm9kZSxib2FyZE9mZnNldCwxKSkge1xuXHRcdFx0XHRsTm9kZS5tb3VzZU92ZXIgPSB0cnVlO1xuXHRcdFx0XHRub2RlQ2hvc2VuID0gdHJ1ZTtcblx0XHRcdFx0cE1vdXNlU3RhdGUuaGFzVGFyZ2V0ID0gdHJ1ZTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwTW91c2VTdGF0ZS5oYXNUYXJnZXQpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKHBNb3VzZVN0YXRlLm1vdXNlRG93biAmJiAhcHJldk1vdXNlU3RhdGUubW91c2VEb3duKSB7XG5cdFx0XHRcdFx0Ly8gZHJhZ1xuXHRcdFx0XHRcdGxOb2RlLmRyYWdnaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRsTm9kZS5kcmFnUG9zaXRpb24gPSBuZXcgUG9pbnQoXG5cdFx0XHRcdFx0cE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54IC0gbE5vZGUucG9zaXRpb24ueCxcblx0XHRcdFx0XHRwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSBsTm9kZS5wb3NpdGlvbi55XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VDbGlja2VkKSB7XG5cdFx0XHRcdFx0Ly8gaGFuZGxlIGNsaWNrIGNvZGVcblx0XHRcdFx0XHRsTm9kZS5jbGljayhwTW91c2VTdGF0ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vIGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGEgbm9kZSwgYWxsb3cgdGhlIG1vdXNlIHRvIGNvbnRyb2wgaXRzIG1vdmVtZW50XG5cdFx0XHRpZiAobE5vZGUuZHJhZ2dpbmcpIHtcblx0XHRcdFx0bE5vZGUucG9zaXRpb24ueCA9IHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCAtIGxOb2RlLmRyYWdQb3NpdGlvbi54O1xuXHRcdFx0XHRsTm9kZS5wb3NpdGlvbi55ID0gcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55IC0gbE5vZGUuZHJhZ1Bvc2l0aW9uLnk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdFxuXHQvLyBkcmFnIHRoZSBib2FyZCBhcm91bmRcblx0aWYgKCFwTW91c2VTdGF0ZS5oYXNUYXJnZXQpIHtcblx0XHRpZiAocE1vdXNlU3RhdGUubW91c2VEb3duKSB7XG5cdFx0XHRpZiAoIW1vdXNlU3RhcnREcmFnQm9hcmQpIHtcblx0XHRcdFx0bW91c2VTdGFydERyYWdCb2FyZCA9IHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb247XG5cdFx0XHRcdHByZXZCb2FyZE9mZnNldC54ID0gYm9hcmRPZmZzZXQueDtcblx0XHRcdFx0cHJldkJvYXJkT2Zmc2V0LnkgPSBib2FyZE9mZnNldC55O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJvYXJkT2Zmc2V0LnggPSBwcmV2Qm9hcmRPZmZzZXQueCAtIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggLSBtb3VzZVN0YXJ0RHJhZ0JvYXJkLngpO1xuXHRcdFx0XHRpZiAoYm9hcmRPZmZzZXQueCA+IG1heEJvYXJkV2lkdGgvMikgYm9hcmRPZmZzZXQueCA9IG1heEJvYXJkV2lkdGgvMjtcblx0XHRcdFx0aWYgKGJvYXJkT2Zmc2V0LnggPCAtMSptYXhCb2FyZFdpZHRoLzIpIGJvYXJkT2Zmc2V0LnggPSAtMSptYXhCb2FyZFdpZHRoLzI7XG5cdFx0XHRcdGJvYXJkT2Zmc2V0LnkgPSBwcmV2Qm9hcmRPZmZzZXQueSAtIChwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgLSBtb3VzZVN0YXJ0RHJhZ0JvYXJkLnkpO1xuXHRcdFx0XHRpZiAoYm9hcmRPZmZzZXQueSA+IG1heEJvYXJkSGVpZ2h0LzIpIGJvYXJkT2Zmc2V0LnkgPSBtYXhCb2FyZEhlaWdodC8yO1xuXHRcdFx0XHRpZiAoYm9hcmRPZmZzZXQueSA8IC0xKm1heEJvYXJkSGVpZ2h0LzIpIGJvYXJkT2Zmc2V0LnkgPSAtMSptYXhCb2FyZEhlaWdodC8yO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhib2FyZE9mZnNldCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1vdXNlU3RhcnREcmFnQm9hcmQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuICAgIH1cbiAgICBcblx0cHJldk1vdXNlU3RhdGUgPSBwTW91c2VTdGF0ZTtcbn1cblxucC5kcmF3ID0gZnVuY3Rpb24oY3R4LCBjYW52YXMsIGNlbnRlciwgYWN0aXZlSGVpZ2h0KXtcblx0Ly8gY3VycmVudCBib2FyZCA9IDA7XG5cdC8vY29uc29sZS5sb2coXCJkcmF3IGN1cnJlbnRCb2FyZCBcIiArIGN1cnJlbnRCb2FyZCk7XG5cdGlmIChhY3RpdmVCb2FyZEluZGV4ICE9IHVuZGVmaW5lZCkgYm9hcmRBcnJheVthY3RpdmVCb2FyZEluZGV4XS5kcmF3KGN0eCwgY2VudGVyLCBhY3RpdmVIZWlnaHQsIGJvYXJkT2Zmc2V0KTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGJvYXJkUGhhc2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBwb2ludChwWCwgcFkpe1xuICAgIHRoaXMueCA9IHBYO1xuICAgIHRoaXMueSA9IHBZO1xufVxuXG52YXIgcCA9IHBvaW50LnByb3RvdHlwZTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2ludDsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL3V0aWxpdGllcy5qcycpO1xudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzLmpzJyk7XG5cbnZhciBTT0xWRV9TVEFURSA9IE9iamVjdC5mcmVlemUoe0hJRERFTjogMCwgVU5TT0xWRUQ6IDEsIFNPTFZFRDogMn0pO1xudmFyIFFVRVNUSU9OX1RZUEUgPSBPYmplY3QuZnJlZXplKHtKVVNUSUZJQ0FUSU9OOiAxLCBNVUxUSVBMRV9DSE9JQ0U6IDIsIFNIT1JUX1JFU1BPTlNFOiAzLCBGSUxFOiA0LCBNRVNTQUdFOiA1fSk7XG5cbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXG5mdW5jdGlvbiBRdWVzdGlvbih4bWwsIHJlc291cmNlcywgdXJsLCB3aW5kb3dEaXYpe1xuXHRcblx0Ly8gU2V0IHRoZSBjdXJyZW50IHN0YXRlIHRvIGRlZmF1bHQgYXQgaGlkZGVuIGFuZCBzdG9yZSB0aGUgd2luZG93IGRpdlxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuSElEREVOO1xuICAgIHRoaXMud2luZG93RGl2ID0gd2luZG93RGl2O1xuICAgIFxuICAgIC8vIEdldCBhbmQgc2F2ZSB0aGUgZ2l2ZW4gaW5kZXgsIGNvcnJlY3QgYW5zd2VyLCBwb3NpdGlvbiwgcmV2ZWFsIHRocmVzaG9sZCwgaW1hZ2UgbGluaywgZmVlZGJhY2ssIGFuZCBjb25uZWN0aW9uc1xuICAgIHRoaXMuY29ycmVjdCA9IHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJjb3JyZWN0QW5zd2VyXCIpKTtcbiAgICB0aGlzLnBvc2l0aW9uUGVyY2VudFggPSBVdGlsaXRpZXMubWFwKHBhcnNlSW50KHhtbC5nZXRBdHRyaWJ1dGUoXCJ4UG9zaXRpb25QZXJjZW50XCIpKSwgMCwgMTAwLCAwLCBDb25zdGFudHMuYm9hcmRTaXplLngpO1xuICAgIHRoaXMucG9zaXRpb25QZXJjZW50WSA9IFV0aWxpdGllcy5tYXAocGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInlQb3NpdGlvblBlcmNlbnRcIikpLCAwLCAxMDAsIDAsIENvbnN0YW50cy5ib2FyZFNpemUueSk7XG4gICAgdGhpcy5yZXZlYWxUaHJlc2hvbGQgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwicmV2ZWFsVGhyZXNob2xkXCIpKTtcbiAgICB0aGlzLmltYWdlTGluayA9IHVybCt4bWwuZ2V0QXR0cmlidXRlKFwiaW1hZ2VMaW5rXCIpO1xuICAgIHRoaXMuZmVlZGJhY2tzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZmVlZGJhY2tcIik7XG4gICAgdmFyIGNvbm5lY3Rpb25FbGVtZW50cyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvbm5lY3Rpb25zXCIpO1xuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBbXTtcbiAgICBmb3IodmFyIGk9MDtpPGNvbm5lY3Rpb25FbGVtZW50cy5sZW5ndGg7aSsrKVxuICAgIFx0dGhpcy5jb25uZWN0aW9uc1tpXSA9IHBhcnNlSW50KGNvbm5lY3Rpb25FbGVtZW50c1tpXS5pbm5lckhUTUwpO1xuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgd2luZG93cyBmb3IgdGhpcyBxdWVzdGlvbiBiYXNlZCBvbiB0aGUgcXVlc3Rpb24gdHlwZVxuICAgIHRoaXMucXVlc3Rpb25UeXBlID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInF1ZXN0aW9uVHlwZVwiKSk7XG4gICAgdGhpcy5qdXN0aWZpY2F0aW9uID0gdGhpcy5xdWVzdGlvblR5cGU9PTEgfHwgdGhpcy5xdWVzdGlvblR5cGU9PTM7XG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlIT01KXtcblx0XHR0aGlzLmNyZWF0ZVRhc2tXaW5kb3coeG1sKTtcblx0XHR0aGlzLmNyZWF0ZVJlc291cmNlV2luZG93KHhtbCwgcmVzb3VyY2VzKTtcblx0fVxuXHRzd2l0Y2godGhpcy5xdWVzdGlvblR5cGUpe1xuXHRcdGNhc2UgNTpcblx0XHRcdHRoaXMuY3JlYXRlTWVzc2FnZVdpbmRvdyh4bWwpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA0OlxuXHRcdFx0dGhpcy5jcmVhdGVGaWxlV2luZG93KCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0Y2FzZSAyOlxuXHRcdGNhc2UgMTpcblx0XHRcdHRoaXMuY3JlYXRlQW5zd2VyV2luZG93KHhtbCk7XG5cdFx0XHRicmVhaztcblx0fVxuICAgIFxufVxuXG52YXIgcCA9IFF1ZXN0aW9uLnByb3RvdHlwZTtcblxucC53cm9uZ0Fuc3dlciA9IGZ1bmN0aW9uKG51bSl7XG5cbiAgLy8gSWYgZmVlYmFjayBkaXNwbGF5IGl0XG5cdGlmKHRoaXMuZmVlZGJhY2tzLmxlbmd0aD4wKVxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gJ1wiJytTdHJpbmcuZnJvbUNoYXJDb2RlKG51bSArIFwiQVwiLmNoYXJDb2RlQXQoKSkrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0J1wiIGlzIG5vdCBjb3JyZWN0IDxici8+Jm5ic3A7PHNwYW4gY2xhc3M9XCJmZWVkYmFja0lcIj4nK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZmVlZGJhY2tzW251bV0uaW5uZXJIVE1MKyc8L3NwYW4+PGJyLz4nO1xuXHRcbn1cblxucC5jb3JyZWN0QW5zd2VyID0gZnVuY3Rpb24oKXtcblx0XG5cdC8vIElmIGZlZWRiYWNrIGRpc3BsYXkgaXRcblx0aWYodGhpcy5mZWVkYmFja3MubGVuZ3RoPjApXG5cdFx0dGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSAnXCInK1N0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5jb3JyZWN0ICsgXCJBXCIuY2hhckNvZGVBdCgpKStcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnXCIgaXMgdGhlIGNvcnJlY3QgcmVzcG9uc2UgPGJyLz48c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5mZWVkYmFja3NbdGhpcy5jb3JyZWN0XS5pbm5lckhUTUwrJzwvc3Bhbj48YnIvPic7XG5cdFxuXHRcblx0aWYodGhpcy5xdWVzdGlvblR5cGU9PT0zICYmIHRoaXMuanVzdGlmaWNhdGlvbi52YWx1ZSAhPSAnJylcblx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICdTdWJtaXR0ZWQgVGV4dDo8YnIvPjxzcGFuIGNsYXNzPVwiZmVlZGJhY2tJXCI+Jyt0aGlzLmp1c3RpZmljYXRpb24udmFsdWUrJzwvc3Bhbj48YnIvPic7XG5cdFxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTEgJiYgdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlICE9ICcnKVxuXHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MICs9ICdTdWJtaXR0ZWQgVGV4dDo8YnIvPjxzcGFuIGNsYXNzPVwiZmVlZGJhY2tJXCI+Jyt0aGlzLmp1c3RpZmljYXRpb24udmFsdWUrJzwvc3Bhbj48YnIvPic7XG5cdFxuXHRpZih0aGlzLnF1ZXN0aW9uVHlwZT09PTQpe1xuXHRcdGlmKHRoaXMuZmlsZUlucHV0LmZpbGVzLmxlbmd0aD4wKVxuXHRcdFx0dGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSAnU3VibWl0dGVkIEZpbGVzOjxici8+Jztcblx0XHRlbHNlXG5cdFx0XHR0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9ICcnO1xuXHRcdGZvcih2YXIgaT0wO2k8dGhpcy5maWxlSW5wdXQuZmlsZXMubGVuZ3RoO2krKylcblx0XHRcdHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MICs9ICc8c3BhbiBjbGFzcz1cImZlZWRiYWNrSVwiPicrdGhpcy5maWxlSW5wdXQuZmlsZXNbaV0ubmFtZSsnPC9zcGFuPjxici8+Jztcblx0fVxuICBcbiAgaWYodGhpcy5jdXJyZW50U3RhdGUhPVNPTFZFX1NUQVRFLlNPTFZFRCAmJiBcbiAgICAgKCgodGhpcy5xdWVzdGlvblR5cGU9PT0zIHx8IHRoaXMucXVlc3Rpb25UeXBlPT09MSkgJiYgdGhpcy5qdXN0aWZpY2F0aW9uLnZhbHVlICE9ICcnKSB8fFxuICAgICAgKHRoaXMucXVlc3Rpb25UeXBlPT09NCAmJiB0aGlzLmZpbGVJbnB1dC5maWxlcy5sZW5ndGg+MCkgfHxcbiAgICAgICB0aGlzLnF1ZXN0aW9uVHlwZT09PTIpKXsgXG4gICAgLy8gU2V0IHRoZSBzdGF0ZSBvZiB0aGUgcXVlc3Rpb24gdG8gY29ycmVjdFxuICAgIHRoaXMuY3VycmVudFN0YXRlID0gU09MVkVfU1RBVEUuU09MVkVEO1xuICB9XG5cdFxufVxuXG5wLmRpc3BsYXlXaW5kb3dzID0gZnVuY3Rpb24oKXtcblx0XG5cdC8vIEFkZCB0aGUgd2luZG93cyB0byB0aGUgd2luZG93IGRpdlxuXHR2YXIgd2luZG93Tm9kZSA9IHRoaXMud2luZG93RGl2O1xuXHR2YXIgZXhpdEJ1dHRvbiA9IG5ldyBJbWFnZSgpO1xuXHRleGl0QnV0dG9uLnNyYyA9IFwiLi4vaW1nL2ljb25DbG9zZS5wbmdcIjtcblx0ZXhpdEJ1dHRvbi5jbGFzc05hbWUgPSBcImV4aXQtYnV0dG9uXCI7XG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XG5cdGV4aXRCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uKCkgeyBxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7IH07XG5cdGlmKHRoaXMucXVlc3Rpb25UeXBlPT09NSl7XG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm1lc3NhZ2UpO1xuXHQgICAgZXhpdEJ1dHRvbi5zdHlsZS5sZWZ0ID0gXCI3NXZ3XCI7XG5cdH1cblx0ZWxzZXtcblx0XHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKHRoaXMudGFzayk7XG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmFuc3dlcik7XG5cdFx0d2luZG93Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLnJlc291cmNlKTtcblx0XHRleGl0QnV0dG9uLnN0eWxlLmxlZnQgPSBcIjg1dndcIjtcblx0fVxuXHR3aW5kb3dOb2RlLmFwcGVuZENoaWxkKGV4aXRCdXR0b24pO1xuXHRcbn1cblxucC5jcmVhdGVUYXNrV2luZG93ID0gZnVuY3Rpb24oeG1sKXtcblx0XG5cdC8vIEdldCB0aGUgdGVtcGxhdGUgZm9yIHRhc2sgd2luZG93c1xuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xuXHQgICAgXHRcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSB0YXNrIHdpbmRvdyBcblx0ICAgIFx0cXVlc3Rpb24udGFzayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suc3R5bGUudG9wID0gXCIxMHZoXCI7XG5cdCAgICAgICAgcXVlc3Rpb24udGFzay5zdHlsZS5sZWZ0ID0gXCI1dndcIjtcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MID0gcXVlc3Rpb24udGFzay5pbm5lckhUTUwucmVwbGFjZShcIiV0aXRsZSVcIiwgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicXVlc3Rpb25OYW1lXCIpWzBdLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJzxici8+JykpO1xuXHQgICAgICAgIHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MID0gcXVlc3Rpb24udGFzay5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcblx0ICAgICAgICBxdWVzdGlvbi50YXNrLmlubmVySFRNTCA9IHF1ZXN0aW9uLnRhc2suaW5uZXJIVE1MLnJlcGxhY2UoXCIlcXVlc3Rpb24lXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInF1ZXN0aW9uVGV4dFwiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcblx0ICAgICAgICBxdWVzdGlvbi5mZWVkYmFjayA9IHF1ZXN0aW9uLnRhc2suZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImZlZWRiYWNrXCIpWzBdO1xuXHQgICAgfVxuXHR9XG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcInRhc2tXaW5kb3cuaHRtbFwiLCB0cnVlKTtcblx0cmVxdWVzdC5zZW5kKCk7XG59XG5cbnAuY3JlYXRlUmVzb3VyY2VXaW5kb3cgPSBmdW5jdGlvbih4bWwsIHJlc291cmNlRmlsZXMpe1xuXHRcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgcmVzb3VyY2Ugd2luZG93c1xuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xuXHQgICAgXHRcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSByZXNvdXJjZSB3aW5kb3cgXG5cdCAgICBcdHF1ZXN0aW9uLnJlc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblx0XHRcdHF1ZXN0aW9uLnJlc291cmNlLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XG5cdFx0XHRxdWVzdGlvbi5yZXNvdXJjZS5zdHlsZS50b3AgPSBcIjU1dmhcIjtcblx0XHRcdHF1ZXN0aW9uLnJlc291cmNlLnN0eWxlLmxlZnQgPSBcIjV2d1wiO1xuXHRcdFx0cXVlc3Rpb24ucmVzb3VyY2UuaW5uZXJIVE1MID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG5cdCAgICBcdFxuXHQgICAgXHQvLyBHZXQgdGhlIHRlbXBsYXRlIGZvciBpbmRpdmlkdWFsIHJlc291Y2VzIGlmIGFueVxuXHQgICAgXHR2YXIgcmVzb3VyY2VzID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicmVzb3VyY2VJbmRleFwiKTtcblx0XHQgICAgaWYocmVzb3VyY2VzLmxlbmd0aCA+IDApe1xuXHRcdFx0XHR2YXIgcmVxdWVzdDIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRcdFx0cmVxdWVzdDIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBpZiAocmVxdWVzdDIucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3QyLnN0YXR1cyA9PSAyMDApIHtcblx0XHRcdFx0ICAgIFx0XG5cdFx0XHRcdCAgICBcdC8vIEdldCB0aGUgaHRtbCBmb3IgZWFjaCByZXNvdXJjZSBhbmQgdGhlbiBhZGQgdGhlIHJlc3VsdCB0byB0aGUgd2luZG93XG5cdFx0XHRcdCAgICBcdHZhciByZXNvdXJjZUhUTUwgPSAnJztcblx0XHRcdFx0XHQgICAgZm9yKHZhciBpPTA7aTxyZXNvdXJjZXMubGVuZ3RoO2krKyl7XG5cdFx0XHRcdCAgICBcdFx0dmFyIGN1clJlc291cmNlID0gcmVxdWVzdDIucmVzcG9uc2VUZXh0LnJlcGxhY2UoXCIlaWNvbiVcIiwgcmVzb3VyY2VGaWxlc1twYXJzZUludChyZXNvdXJjZXNbaV0uaW5uZXJIVE1MKV0uaWNvbik7XG5cdFx0XHRcdFx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJXRpdGxlJVwiLCByZXNvdXJjZUZpbGVzW3BhcnNlSW50KHJlc291cmNlc1tpXS5pbm5lckhUTUwpXS50aXRsZSk7XG5cdFx0XHRcdFx0ICAgIFx0Y3VyUmVzb3VyY2UgPSBjdXJSZXNvdXJjZS5yZXBsYWNlKFwiJWxpbmslXCIsIHJlc291cmNlRmlsZXNbcGFyc2VJbnQocmVzb3VyY2VzW2ldLmlubmVySFRNTCldLmxpbmspO1xuXHRcdFx0XHRcdCAgICBcdHJlc291cmNlSFRNTCArPSBjdXJSZXNvdXJjZTtcblx0XHRcdFx0XHQgICAgfVxuXHRcdFx0XHRcdCAgXHRxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5yZXNvdXJjZS5pbm5lckhUTUwucmVwbGFjZShcIiVyZXNvdXJjZXMlXCIsIHJlc291cmNlSFRNTCk7XG5cdFx0XHRcdCAgICAgICAgXG5cdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVxdWVzdDIub3BlbihcIkdFVFwiLCBcInJlc291cmNlLmh0bWxcIiwgdHJ1ZSk7XG5cdFx0XHRcdHJlcXVlc3QyLnNlbmQoKTtcblx0ICAgIFx0fVxuXHQgICAgXHRlbHNle1xuXHQgICAgXHRcdC8vIERpc3BsYXkgdGhhdCB0aGVyZSBhcmVuJ3QgYW55IHJlc291cmNlc1xuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmlubmVySFRNTCA9IHF1ZXN0aW9uLnJlc291cmNlLmlubmVySFRNTC5yZXBsYWNlKFwiJXJlc291cmNlcyVcIiwgXCJObyByZXNvdXJjZXMgaGF2ZSBiZWVuIHByb3ZpZGVkIGZvciB0aGlzIHRhc2suXCIpO1xuXHQgICAgXHRcdHF1ZXN0aW9uLnJlc291cmNlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3aW5kb3dDb250ZW50XCIpWzBdLnN0eWxlLmNvbG9yID0gXCJncmV5XCI7XG5cdCAgICBcdFx0cXVlc3Rpb24ucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkZGRkZGXCI7XG5cdCAgICBcdFx0cXVlc3Rpb24ucmVzb3VyY2UuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIndpbmRvd0NvbnRlbnRcIilbMF0uY2xhc3NOYW1lICs9IFwiLCBjZW50ZXJcIjtcblx0ICAgIFx0fVxuXHQgICAgICAgIFxuXHQgICAgfVxuXHR9O1xuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJyZXNvdXJjZVdpbmRvdy5odG1sXCIsIHRydWUpO1xuXHRyZXF1ZXN0LnNlbmQoKTtcbn1cblxucC5jcmVhdGVBbnN3ZXJXaW5kb3cgPSBmdW5jdGlvbih4bWwpe1xuXHRcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgYW5zd2VyIHdpbmRvd3Ncblx0dmFyIHF1ZXN0aW9uID0gdGhpcztcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0ICAgIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT0gNCAmJiByZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcblx0ICAgIFx0XG5cdCAgICBcdC8vIENyZWF0ZSB0aGUgYW5zd2VyIHdpbmRvdyBcblx0ICAgIFx0cXVlc3Rpb24uYW5zd2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5zdHlsZS50b3AgPSBcIjEwdmhcIjtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLnN0eWxlLmxlZnQgPSBcIjUwdndcIjtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXHQgICAgICAgIFxuXHQgICAgICAgIC8vIENyZWF0ZSB0aGUgdGV4dCBlbGVtZW50IGlmIGFueVxuXHQgICAgICAgIHZhciBzdWJtaXQ7XG5cdCAgICAgICAgaWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbil7XG5cdCAgICAgICAgXHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xuXHQgICAgICAgIFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXHQgICAgICAgIFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5zdWJtaXQuY2xhc3NOYW1lID0gXCJzdWJtaXRcIjtcblx0ICAgICAgICBcdHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uc3VibWl0LmlubmVySFRNTCA9IFwiU3VibWl0XCI7XG5cdFx0ICAgICAgICBxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XG5cdFx0ICAgICAgICBxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0ICAgICAgICBcdHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcblx0XHQgICAgXHR9XG5cdFx0ICAgIFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uKCkge1xuXHRcdCAgICBcdFx0aWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbi52YWx1ZS5sZW5ndGggPiAwKVxuXHRcdCAgICBcdFx0XHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdCAgICBcdFx0ZWxzZVxuXHRcdCAgICBcdFx0XHRxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XG5cdFx0ICAgIFx0fSwgZmFsc2UpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBcblx0ICAgICAgICAvLyBDcmVhdGUgYW5kIGdldCBhbGwgdGhlIGFuc3dlciBlbGVtZW50c1xuXHQgICAgICAgIHZhciBhbnN3ZXJzID0gW107XG5cdCAgICAgICAgdmFyIGFuc3dlcnNYbWwgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhbnN3ZXJcIik7XG5cdCAgICAgICAgdmFyIGNvcnJlY3QgPSBwYXJzZUludCh4bWwuZ2V0QXR0cmlidXRlKFwiY29ycmVjdEFuc3dlclwiKSk7XG5cdCAgICAgICAgZm9yKHZhciBpPTA7aTxhbnN3ZXJzWG1sLmxlbmd0aDtpKyspe1xuXHQgICAgICAgIFx0aWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbilcblx0ICAgICAgICBcdFx0cXVlc3Rpb24uanVzdGlmaWNhdGlvbi5kaXNhYmxlZCA9IHRydWU7XG5cdCAgICAgICAgXHRhbnN3ZXJzW2ldID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblx0ICAgICAgICBcdGlmKGNvcnJlY3Q9PT1pKVxuXHQgICAgICAgIFx0XHRhbnN3ZXJzW2ldLmNsYXNzTmFtZSA9IFwiY29ycmVjdFwiO1xuXHQgICAgICAgIFx0ZWxzZVxuXHQgICAgICAgIFx0XHRhbnN3ZXJzW2ldLmNsYXNzTmFtZSA9IFwid3JvbmdcIjtcblx0ICAgICAgICBcdGFuc3dlcnNbaV0uaW5uZXJIVE1MID0gU3RyaW5nLmZyb21DaGFyQ29kZShpICsgXCJBXCIuY2hhckNvZGVBdCgpKStcIi4gXCIrYW5zd2Vyc1htbFtpXS5pbm5lckhUTUw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIFxuXHQgICAgICAgIC8vIENyZWF0ZSB0aGUgZXZlbnRzIGZvciB0aGUgYW5zd2Vyc1xuXHQgICAgICAgIGZvcih2YXIgaT0wO2k8YW5zd2Vycy5sZW5ndGg7aSsrKXtcblx0ICAgICAgICBcdGlmKGFuc3dlcnNbaV0uY2xhc3NOYW1lID09IFwid3JvbmdcIil7XG5cdCAgICAgICAgXHRcdGFuc3dlcnNbaV0ubnVtID0gaTtcbiAgICAgICAgICAgICAgYW5zd2Vyc1tpXS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcblx0ICAgICAgICBcdFx0XHRxdWVzdGlvbi53cm9uZ0Fuc3dlcih0aGlzLm51bSk7XG5cdCAgICAgICAgXHRcdH07XG5cdCAgICAgICAgXHR9XG5cdCAgICAgICAgXHRlbHNle1xuXHQgICAgICAgIFx0XHRhbnN3ZXJzW2ldLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8YW5zd2Vycy5sZW5ndGg7aisrKVxuICAgICAgICAgICAgICAgICAgYW5zd2Vyc1tqXS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYocXVlc3Rpb24uanVzdGlmaWNhdGlvbilcbiAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uLmp1c3RpZmljYXRpb24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uLmNvcnJlY3RBbnN3ZXIoKTtcbiAgICAgICAgICAgICAgfTtcblx0ICAgICAgICBcdH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgXG5cdCAgICAgICAgLy8gQWRkIHRoZSBhbnN3ZXJzIHRvIHRoZSB3aW5kb3dcbiAgICAgICAgICBmb3IodmFyIGk9MDtpPGFuc3dlcnMubGVuZ3RoO2krKylcbiAgICAgICAgICAgIHF1ZXN0aW9uLmFuc3dlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXS5hcHBlbmRDaGlsZChhbnN3ZXJzW2ldKTtcblx0ICAgICAgICBpZihxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKXtcblx0ICAgICAgICBcdHF1ZXN0aW9uLmFuc3dlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXS5hcHBlbmRDaGlsZChxdWVzdGlvbi5qdXN0aWZpY2F0aW9uKTtcblx0ICAgICAgICBcdHF1ZXN0aW9uLmFuc3dlci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwid2luZG93Q29udGVudFwiKVswXS5hcHBlbmRDaGlsZChxdWVzdGlvbi5qdXN0aWZpY2F0aW9uLnN1Ym1pdCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9XG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcImFuc3dlcldpbmRvdy5odG1sXCIsIHRydWUpO1xuXHRyZXF1ZXN0LnNlbmQoKTtcbn1cblxucC5jcmVhdGVGaWxlV2luZG93ID0gZnVuY3Rpb24oKXtcblx0XG5cdC8vIEdldCB0aGUgdGVtcGxhdGUgZm9yIGZpbGUgd2luZG93c1xuXHR2YXIgcXVlc3Rpb24gPSB0aGlzO1xuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0ICYmIHJlcXVlc3Quc3RhdHVzID09IDIwMCkge1xuXHQgICAgXHRcblx0ICAgIFx0Ly8gQ3JlYXRlIHRoZSBmaWxlIHdpbmRvdyBcblx0ICAgIFx0cXVlc3Rpb24uYW5zd2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmNsYXNzTmFtZSA9IFwid2luZG93XCI7XG5cdFx0ICAgIHF1ZXN0aW9uLmFuc3dlci5zdHlsZS50b3AgPSBcIjEwdmhcIjtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLnN0eWxlLmxlZnQgPSBcIjUwdndcIjtcblx0XHQgICAgcXVlc3Rpb24uYW5zd2VyLmlubmVySFRNTCA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXHRcdCAgICBxdWVzdGlvbi5maWxlSW5wdXQgPSBxdWVzdGlvbi5hbnN3ZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKVswXTtcblx0XHQgICAgcXVlc3Rpb24uZmlsZUlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oKXtcblx0XHRcdCAgICBxdWVzdGlvbi5jb3JyZWN0QW5zd2VyKCk7XG5cdCAgICAgICAgfTtcblx0ICAgICAgICBcblx0ICAgIH1cblx0fVxuXHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgXCJmaWxlV2luZG93Lmh0bWxcIiwgdHJ1ZSk7XG5cdHJlcXVlc3Quc2VuZCgpO1xufVxuXG5wLmNyZWF0ZU1lc3NhZ2VXaW5kb3cgPSBmdW5jdGlvbih4bWwpe1xuXHRcblx0Ly8gR2V0IHRoZSB0ZW1wbGF0ZSBmb3IgZmlsZSB3aW5kb3dzXG5cdHZhciBxdWVzdGlvbiA9IHRoaXM7XG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdCAgICBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09IDQgJiYgcmVxdWVzdC5zdGF0dXMgPT0gMjAwKSB7XG5cdCAgICBcdFxuXHQgICAgXHQvLyBDcmVhdGUgdGhlIGZpbGUgd2luZG93IFxuXHQgICAgXHRxdWVzdGlvbi5tZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5jbGFzc05hbWUgPSBcIndpbmRvd1wiO1xuXHRcdCAgICBxdWVzdGlvbi5tZXNzYWdlLnN0eWxlLnRvcCA9IFwiMTB2aFwiO1xuXHRcdCAgICBxdWVzdGlvbi5tZXNzYWdlLnN0eWxlLmxlZnQgPSBcIjQwdndcIjtcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXRpdGxlJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvbk5hbWVcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XG5cdFx0ICAgIHF1ZXN0aW9uLm1lc3NhZ2UuaW5uZXJIVE1MID0gcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwucmVwbGFjZShcIiVpbnN0cnVjdGlvbnMlXCIsIHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluc3RydWN0aW9uc1wiKVswXS5pbm5lckhUTUwucmVwbGFjZSgvXFxuL2csICc8YnIvPicpKTtcblx0XHQgICAgcXVlc3Rpb24ubWVzc2FnZS5pbm5lckhUTUwgPSBxdWVzdGlvbi5tZXNzYWdlLmlubmVySFRNTC5yZXBsYWNlKFwiJXF1ZXN0aW9uJVwiLCB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJxdWVzdGlvblRleHRcIilbMF0uaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKSk7XG5cdCAgICAgICAgcXVlc3Rpb24ubWVzc2FnZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKVswXS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgXHRxdWVzdGlvbi5jdXJyZW50U3RhdGUgPSBTT0xWRV9TVEFURS5TT0xWRUQ7XG5cdCAgICAgICAgXHRxdWVzdGlvbi53aW5kb3dEaXYuaW5uZXJIVE1MID0gJyc7XG5cdCAgICAgICAgfTtcblxuXHQgICAgfVxuXHR9XG5cdHJlcXVlc3Qub3BlbihcIkdFVFwiLCBcIm1lc3NhZ2VXaW5kb3cuaHRtbFwiLCB0cnVlKTtcblx0cmVxdWVzdC5zZW5kKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb247XG5tb2R1bGUuZXhwb3J0cy5TT0xWRV9TVEFURSA9IFNPTFZFX1NUQVRFOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFF1ZXN0aW9uID0gcmVxdWlyZShcIi4vcXVlc3Rpb24uanNcIik7XG5cbi8vIENyZWF0ZXMgYSBjYXRlZ29yeSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBmcm9tIHRoZSBnaXZlbiB4bWxcbmZ1bmN0aW9uIFJlc291cmNlKHhtbCwgdXJsKXtcblx0XG5cdC8vIEZpcnN0IGdldCB0aGUgaWNvblxuXHQgIHZhciB0eXBlID0gcGFyc2VJbnQoeG1sLmdldEF0dHJpYnV0ZShcInR5cGVcIikpO1xuXHQgIHN3aXRjaCh0eXBlKXtcblx0ICAgIGNhc2UgMDpcblx0ICAgICAgdGhpcy5pY29uID0gJy4uL2ltZy9pY29uUmVzb3VyY2VGaWxlLnBuZyc7XG5cdCAgICAgIGJyZWFrO1xuXHQgICAgY2FzZSAxOlxuXHQgICAgICB0aGlzLmljb24gPSAnLi4vaW1nL2ljb25SZXNvdXJjZUxpbmsucG5nJztcblx0ICAgICAgYnJlYWs7XG5cdCAgICBjYXNlIDI6XG4gICAgXHQgIHRoaXMuaWNvbiA9ICcuLi9pbWcvaWNvblJlc291cmNlVmlkZW8ucG5nJztcblx0ICAgICAgYnJlYWs7XG5cdCAgICBkZWZhdWx0OlxuXHQgICAgICB0aGlzLmljb24gPSAnJztcblx0ICAgICAgYnJlYWs7XG5cdCAgfVxuXG5cdCAgLy8gTmV4dCBnZXQgdGhlIHRpdGxlXG5cdCAgdGhpcy50aXRsZSA9IHhtbC5nZXRBdHRyaWJ1dGUoXCJ0ZXh0XCIpO1xuXG5cdCAgLy8gTGFzdCBnZXQgdGhlIGxpbmtcblx0ICBpZih0eXBlPjApXG5cdCAgICB0aGlzLmxpbmsgPSB4bWwuZ2V0QXR0cmlidXRlKFwibGlua1wiKTtcblx0ICBlbHNlXG5cdCAgICB0aGlzLmxpbmsgPSB1cmwrJ2Fzc2V0cy9maWxlcy8nK3htbC5nZXRBdHRyaWJ1dGUoXCJsaW5rXCIpLnJlcGxhY2UoLyAvZywgJyUyMCcpO1xuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc291cmNlOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9wb2ludC5qcycpO1xuXG4vL01vZHVsZSBleHBvcnRcbnZhciBtID0gbW9kdWxlLmV4cG9ydHM7XG5cbi8vIHJldHVybnMgbW91c2UgcG9zaXRpb24gaW4gbG9jYWwgY29vcmRpbmF0ZSBzeXN0ZW0gb2YgZWxlbWVudFxubS5nZXRNb3VzZSA9IGZ1bmN0aW9uKGUpe1xuICAgIHJldHVybiBuZXcgUG9pbnQoKGUucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0KSwgKGUucGFnZVkgLSBlLnRhcmdldC5vZmZzZXRUb3ApKTtcbn1cblxuLy9yZXR1cm5zIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIHJhdGlvIGl0IGhhcyB3aXRoIGEgc3BlY2lmaWMgcmFuZ2UgXCJtYXBwZWRcIiB0byBhIGRpZmZlcmVudCByYW5nZVxubS5tYXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluMSwgbWF4MSwgbWluMiwgbWF4Mil7XG4gICAgcmV0dXJuIG1pbjIgKyAobWF4MiAtIG1pbjIpICogKCh2YWx1ZSAtIG1pbjEpIC8gKG1heDEgLSBtaW4xKSk7XG59XG5cbi8vaWYgYSB2YWx1ZSBpcyBoaWdoZXIgb3IgbG93ZXIgdGhhbiB0aGUgbWluIGFuZCBtYXgsIGl0IGlzIFwiY2xhbXBlZFwiIHRvIHRoYXQgb3V0ZXIgbGltaXRcbm0uY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpe1xuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cblxuLy9kZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vdXNlIGlzIGludGVyc2VjdGluZyB0aGUgYWN0aXZlIGVsZW1lbnRcbm0ubW91c2VJbnRlcnNlY3QgPSBmdW5jdGlvbihwTW91c2VTdGF0ZSwgcEVsZW1lbnQsIHBPZmZzZXR0ZXIsIHBTY2FsZSl7XG4gICAgaWYocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54ICsgcE9mZnNldHRlci54ID4gKHBFbGVtZW50LnBvc2l0aW9uLnggLSAocFNjYWxlKnBFbGVtZW50LndpZHRoKS8yKSAmJiBwTW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnggKyBwT2Zmc2V0dGVyLnggPCAocEVsZW1lbnQucG9zaXRpb24ueCArIChwU2NhbGUqcEVsZW1lbnQud2lkdGgpLzIpKXtcbiAgICAgICAgaWYocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ICsgcE9mZnNldHRlci55ID4gKHBFbGVtZW50LnBvc2l0aW9uLnkgLSAocFNjYWxlKnBFbGVtZW50LmhlaWdodCkvMikgJiYgcE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi55ICsgcE9mZnNldHRlci55IDwgKHBFbGVtZW50LnBvc2l0aW9uLnkgKyAocFNjYWxlKnBFbGVtZW50LmhlaWdodCkvMikpe1xuICAgICAgICAgICAgLy9wRWxlbWVudC5tb3VzZU92ZXIgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBwTW91c2VTdGF0ZS5oYXNUYXJnZXQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICAvL3BFbGVtZW50Lm1vdXNlT3ZlciA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2V7XG4gICAgXHRyZXR1cm4gZmFsc2U7XG4gICAgICAgIC8vcEVsZW1lbnQubW91c2VPdmVyID0gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBnZXRzIHRoZSB4bWwgb2JqZWN0IG9mIGEgc3RyaW5nXG5tLmdldFhtbCA9IGZ1bmN0aW9uKHhtbCl7XG5cdHZhciB4bWxEb2M7XG5cdGlmICh3aW5kb3cuRE9NUGFyc2VyKXtcblx0XHR2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXHRcdHhtbERvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCBcInRleHQveG1sXCIpO1xuXHR9XG5cdGVsc2V7IC8vIElFXG5cdFx0eG1sRG9jID0gbmV3IEFjdGl2ZVhPYmplY3QoXCJNaWNyb3NvZnQuWE1MRE9NXCIpO1xuXHRcdHhtbERvYy5hc3luYyA9IGZhbHNlO1xuXHRcdHhtbERvYy5sb2FkWE1MKHhtbCk7XG5cdH1cblx0cmV0dXJuIHhtbERvYztcbn0iXX0=
>>>>>>> 1a728b5637dbb470aa7f5d53853a90618a682fe0

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
    this.boardArray[this.activeBoardIndex].draw(ctx, {x:canvas.offsetWidth/2, y:canvas.offsetHeight/2});
    
}

module.exports = game;
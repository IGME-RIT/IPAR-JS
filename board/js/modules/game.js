"use strict";
var Board = require('./board.js');
var Point = require('./point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('./drawlib.js');
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

p.zoom = function(amount){
	if(this.active){
		var newZoom = this.boardArray[this.activeBoardIndex].zoom+amount;
		if(newZoom >= Constants.minZoom && newZoom <= Constants.maxZoom)
			this.boardArray[this.activeBoardIndex].zoom = newZoom;
	}
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
	    this.boardArray[this.activeBoardIndex].act(pMouseState, this.scale);
	}
}

p.draw = function(ctx, canvas){
	
	// Draw the background
	DrawLib.rect(ctx, 0, 0, canvas.width, canvas.height, "#15718F");
	
	// Scale the game
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	ctx.scale(this.scale, this.scale);
	ctx.translate(-canvas.width/2, -canvas.height/2);
	//ctx.translate(canvas.width*this.scale-canvas.width, canvas.width*this.scale-canvas.width);
	
    // Draw the current board
    this.boardArray[this.activeBoardIndex].draw(ctx, canvas, {x:canvas.offsetWidth/2, y:canvas.offsetHeight/2});

    ctx.restore();
}

module.exports = game;
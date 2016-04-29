"use strict";
var Board = require('./board.js');
var Point = require('./point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('./drawlib.js');
var DataParser = require('./iparDataParser.js');
var MouseState = require('./mouseState.js');

//mouse management
var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

//phase handling
var phaseObject;

function game(url, canvas, windowDiv){
	var game = this;
	this.active = false;
	this.mouseState = new MouseState(canvas);
	DataParser.parseData(url, windowDiv, function(categories, stage){
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
		this.boardArray.push(new Board(new Point(canvas.width/(2*this.scale),canvas.height/(2*this.scale)), this.lessonNodes));
		var button = document.createElement("BUTTON");
		button.innerHTML = this.categories[i].name;
		var game = this;
		button.onclick = (function(i){ 
			return function() {
				if(game.active){
					game.activeBoardIndex = i;
					if(game.onChangeBoard)
						game.onChangeBoard();
					game.updateNode();
				}
		}})(i);
		if(!this.boardArray[this.boardArray.length-1].finished)
			button.disabled = true;
		bottomBar.appendChild(button);
		this.boardArray[this.boardArray.length-1].button = button;
		var game = this;
		this.boardArray[this.boardArray.length-1].updateNode = function(){game.updateNode();};
	}
	this.activeBoardIndex = 0;
	this.active = true;
	this.boardArray[this.activeBoardIndex].button.disabled = false;
	if(game.onChangeBoard)
		game.onChangeBoard();
	this.updateNode();
	
	// ready to save
	DataParser.prepareZip(this.boardArray);
}

p.updateZoom = function(newZoom){
	if(this.active)
		this.boardArray[this.activeBoardIndex].zoom = newZoom;
}

p.getZoom = function(){
	return this.boardArray[this.activeBoardIndex].zoom;
}

p.update = function(ctx, canvas, dt){
	
	if(this.active){
		
	    // Update the mouse state
		this.mouseState.update(dt, this.scale*this.boardArray[this.activeBoardIndex].zoom);
		
		if (this.mouseState.mouseClicked) {document.cookie = "cookieSave=" + DataParser.createXMLSaveFile(this.boardArray, false) + "; expires=Thu, 18 Dec 2222 12:00:00 UTC";
		console.log(document.cookie);
		}
		
	    // Update the current board (give it the mouse only if not zooming)
	    this.boardArray[this.activeBoardIndex].act((this.zoomin || this.zoomout ? null : this.mouseState), dt);
	    
	    // Check if new board available
	    if(this.activeBoardIndex < this.boardArray.length-1 &&
	    		this.boardArray[this.activeBoardIndex+1].button.disabled && 
	    		this.boardArray[this.activeBoardIndex].finished)
	    	this.boardArray[this.activeBoardIndex+1].button.disabled = false;
		

		// If the board is done zoom out to center
		if(this.zoomout){
			
			// Get the current board
			var board = this.boardArray[this.activeBoardIndex];
			
			// Zoom out and move towards center
			if(this.getZoom()>Constants.startZoom)
				board.zoom -= dt*Constants.zoomSpeed;
			else if(this.getZoom()<Constants.startZoom)
				board.zoom = Constants.startZoom;
			board.moveTowards(new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), dt, Constants.zoomMoveSpeed);
			
			// Call the change method
			if(this.onChangeBoard)
				this.onChangeBoard();
			
			// If fully zoomed out and in center stop
			if(this.getZoom()==Constants.startZoom && board.boardOffset.x==Constants.boardSize.x/2 && board.boardOffset.y==Constants.boardSize.y/2){				
				this.zoomout = false;
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
				
				// Call the change method
				if(this.onChangeBoard)
					this.onChangeBoard();
				
				// If reached the node and zoomed in stop and get rid of the target
				if(this.getZoom()==Constants.endZoom && board.boardOffset.x==this.targetNode.position.x && board.boardOffset.y==this.targetNode.position.y){
					this.zoomin = false;
					this.targetNode = null;
				}
			}
		}
	    
	    // draw stuff no matter what
	    this.draw(ctx, canvas);
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
    this.boardArray[this.activeBoardIndex].draw(ctx, canvas);

    ctx.restore();
}

p.updateNode = function(){
	this.zoomin = true;
}

module.exports = game;

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
				this.lessonNodeArray[activeNode.question.connections[j] - 1].connections++;
			
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

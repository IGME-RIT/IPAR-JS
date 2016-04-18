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
    this.zoom = 1;
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

p.act = function(pMouseState, scale) {
	
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
		if(i==0)
			console.log(pMouseState.relativePosition.x+"::"+this.zoom*scale*(lNode.position.x - lNode.width/2 - this.boardOffset.x));
		if (Utilities.mouseIntersect(pMouseState,lNode,this.boardOffset,this.zoom*scale)) {
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
    //translate to the center of the board
    ctx.translate(center.x - this.position.x, center.y - this.position.y);
    
    // Translate to center of screen and scale for zoom then translate back
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-canvas.width/2, -canvas.height/2);
	
    // Draw the background of the board
    DrawLib.rect(ctx, 0, 0, Constants.boardSize.x, Constants.boardSize.y, "#D3B185");
    DrawLib.strokeRect(ctx, -Constants.boardOutline/2, -Constants.boardOutline/2, Constants.boardSize.x+Constants.boardOutline/2, Constants.boardSize.y+Constants.boardOutline/2, Constants.boardOutline, "#CB9966");
    
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
    
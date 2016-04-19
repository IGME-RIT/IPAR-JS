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

p.act = function(pMouseState, dt) {
	
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
			}
		}
		else{
			this.target.position.x = pMouseState.virtualPosition.x - this.target.dragPosition.x;
			this.target.position.y = pMouseState.virtualPosition.y - this.target.dragPosition.y;
		}
		
	}
	
	// drag the board around
	if (this.target==null) {
		if (pMouseState.mouseDown) {
			canvas.style.cursor = '-webkit-grabbing';
			canvas.style.cursor = '-moz-grabbing';
			canvas.style.cursor = 'grabbing';
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
			canvas.style.cursor = '';
		}
    }
}

p.draw = function(ctx, canvas){
    ctx.save();
    

    // Translate to center of screen and scale for zoom then translate back
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    
    this.position = this.boardOffset;
    //translate to the center of the board
    ctx.translate(canvas.width/2 - this.position.x, canvas.height/2 - this.position.y);
    
	
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
		
		// get the pin poistion
        var oPos = this.lessonNodeArray[i].getNodePoint();
        
		// set line style
		ctx.strokeStyle = "rgba(0,0,105,0.2)";
		ctx.lineWidth = 1;
        
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	
			if (this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1].question.currentState==Question.SOLVE_STATE.HIDDEN) continue;
        	
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var connection = this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j] - 1];
        	var cPos = connection.getNodePoint();
        	
        	// draw the line
        	ctx.beginPath();
        	// translate to start (pin)
        	ctx.moveTo(oPos.x, oPos.y);
        	ctx.lineTo(cPos.x, cPos.y);
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
    
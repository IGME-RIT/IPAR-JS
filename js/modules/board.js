"use strict";

//parameter is a point that denotes starting position
function board(startPosition, lessonNodes){
    this.position = startPosition;
    this.lessonNodeArray = lessonNodes;
}

board.drawLib = undefined;

//prototype
var p = board.prototype;

p.move = function(pX, pY){
    this.position.x += pX;
    this.position.y += pY;
};

p.draw = function(ctx, center, activeHeight){
    ctx.save();
    //translate to the center of the screen
    ctx.translate(center.x - this.position.x, center.y - this.position.y);
	ctx.strokeStyle = "rgba(0,0,255,0.2)";
	ctx.lineWidth = 2;
	// draw the lines
	for(var i=0; i<this.lessonNodeArray.length; i++){
        // check to see if the question property is valid
        if (!this.lessonNodeArray[i].question.connections) continue;
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var connectionPos = this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j]].position;
        	// draw the line
        	ctx.beginPath();
        	// translate to start
        	ctx.moveTo(this.lessonNodeArray[i].position.x,this.lessonNodeArray[i].position.y);
        	ctx.lineTo(connectionPos.x,connectionPos.y);
        	ctx.closePath();
        	ctx.stroke();
        	//console.log("line drawn from "+this.lessonNodeArray[i].position.x+", "+this.lessonNodeArray[i].position.y+" to "+connectionPos.x+", "+connectionPos.y);
        }
    }
	
	
	// draw the nodes
    for(var i = 0; i < this.lessonNodeArray.length; i++){
        this.lessonNodeArray[i].draw(ctx);
    }
    ctx.restore();
};

module.exports = board;

//this is an object named Board and this is its javascript
//var Board = require('./objects/board.js');
//var b = new Board();
    
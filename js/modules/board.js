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
	
	// draw the nodes
    for(var i = 0; i < this.lessonNodeArray.length; i++){
    	// draw the node itself
        this.lessonNodeArray[i].draw(ctx);
    }
    
    
   
	// draw the pins and lines
	for(var i=0; i<this.lessonNodeArray.length; i++){
		// draw the pin in the corner with margin 5,5
        var pinX = this.lessonNodeArray[i].position.x - this.lessonNodeArray[i].width*this.lessonNodeArray[i].scaleFactor/2 + 15;
        var pinY = this.lessonNodeArray[i].position.y - this.lessonNodeArray[i].height*this.lessonNodeArray[i].scaleFactor/2 + 15;
		
		// set line style
		ctx.strokeStyle = "rgba(0,0,105,0.2)";
		ctx.lineWidth = 1;
        // check to see if the question property is valid
        if (!this.lessonNodeArray[i].question.connections) continue;
        for (var j=0; j<this.lessonNodeArray[i].question.connections.length; j++) {
        	// go to the index in the array that corresponds to the connected node on this board and save its position
        	// connection index saved in the lessonNode's question
        	var connection = this.lessonNodeArray[this.lessonNodeArray[i].question.connections[j]];
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
        	//console.log("line drawn from "+this.lessonNodeArray[i].position.x+", "+this.lessonNodeArray[i].position.y+" to "+connectionPos.x+", "+connectionPos.y);
        }
    }
    
    ctx.restore();
};

module.exports = board;

//this is an object named Board and this is its javascript
//var Board = require('./objects/board.js');
//var b = new Board();
    
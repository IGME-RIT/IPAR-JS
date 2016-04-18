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
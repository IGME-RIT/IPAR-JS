"use strict";
var Point = require('./point.js');

// private variables
var mousePosition, relativeMousePosition;
var mouseDownTimer, maxClickDuration;
var prevTime, dt;
var scale;

function mouseState(canvas){
	
	mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    this.virtualPosition = new Point(0,0);
    
    //event listeners for mouse interactions with the canvas
    var mouseState = this;
    canvas.addEventListener("mousemove", function(e){
        var boundRect = canvas.getBoundingClientRect();
        mousePosition = new Point(e.clientX - boundRect.left, e.clientY - boundRect.top);
        relativeMousePosition = new Point(mousePosition.x - (canvas.offsetWidth/2.0), mousePosition.y - (canvas.offsetHeight/2.0));        
    });
    this.mouseDown = false;
    canvas.addEventListener("mousedown", function(e){
    	mouseState.mouseDown = true;
    });
    canvas.addEventListener("mouseup", function(e){
    	mouseState.mouseDown = false;
    });
    this.mouseIn = false;
    mouseDownTimer = 0;
    this.mouseClicked = false;
    maxClickDuration = 200;
    canvas.addEventListener("mouseover", function(e){
    	mouseState.mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
    	mouseState.mouseIn = false;
    	mouseState.mouseDown = false;
    });
	
}

var p = mouseState.prototype;

// Update the mouse to the current state
p.update = function(dt, scale){
    
	// Save the current virtual position from scale
	this.virtualPosition = new Point(relativeMousePosition.x/scale, relativeMousePosition.y/scale);;
	
    // check mouse click
    this.mouseClicked = false;
    if (this.mouseDown)
    	mouseDownTimer += dt;
    else{
    	if (mouseDownTimer > 0 && mouseDownTimer < maxClickDuration)
    		this.mouseClicked = true;
    	mouseDownTimer = 0;
    }
    this.prevMouseDown = this.mouseDown;
    this.hasTarget = false;
    
}

module.exports = mouseState;
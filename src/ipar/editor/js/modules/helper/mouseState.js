"use strict";
var Point = require('./point.js');

// private variables
var relativeMousePosition;
var mouseDownTimer, leftMouseClicked, maxClickDuration;
var mouseWheelVal;
var prevTime;
var deltaY;
var scaling, touchZoom, startTouchZoom;

function mouseState(){
	this.mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    this.virtualPosition = new Point(0,0);
    
    // Set variable defaults
    this.mouseDown = false;
    this.mouseIn = false;
    mouseDownTimer = 0;
    deltaY = 0;
    this.mouseWheelDY = 0;
    this.zoomDiff = 0;
    touchZoom = 0;
    this.mouseClicked = false;
    leftMouseClicked = false;
    maxClickDuration = 200;
	
}

var p = mouseState.prototype;

//event listeners for mouse interactions with the canvases
p.addCanvas = function(canvas){
    var mouseState = this;
    canvas.addEventListener("mousemove", function(e){
    	e.preventDefault();
    	mouseState.updatePosition(e);
    });
    canvas.addEventListener("touchmove", function(e){
    	e.preventDefault();
    	if(scaling)
    		mouseState.updateTouchPositions(e);
    	else
    		mouseState.updatePosition(e.touches[0]);
    });
    canvas.addEventListener("mousedown", function(e){
    	e.preventDefault();
    	if (e.which && e.which!=3 || e.button && e.button!=2)
	    	mouseState.mouseDown = true;
    });
    canvas.addEventListener("contextmenu", function(e){
    	leftMouseClicked = true;
    });
    canvas.addEventListener("touchstart", function(e){
    	e.preventDefault();
    	if(e.touches.length == 1 && !scaling){
    		mouseState.updatePosition(e.touches[0]);
	        setTimeout(function(){
	        	mouseState.mouseDown = true;
	        });
    	}
    	else if(e.touches.length == 2){
    		mouseState.mouseDown = false;
    		scaling = true;
    		mouseState.updateTouchPositions(e);
    		startTouchZoom = touchZoom;
    	}
    });
    canvas.addEventListener("mouseup", function(e){
    	e.preventDefault();
    	if (e.which && e.which!=3 || e.button && e.button!=2)
	    	mouseState.mouseDown = false;
    });
    canvas.addEventListener("touchend", function(e){
    	e.preventDefault();
    	if(scaling){
    		scaling = false;
    	    touchZoom = 0;
    	    startTouchZoom = 0;
    	}
    	mouseState.mouseDown = false;
    });
    canvas.addEventListener("mouseover", function(e){
    	mouseState.mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
    	mouseState.mouseIn = false;
    	mouseState.mouseDown = false;
    });
    canvas.addEventListener('mousewheel',function(event){
    	event.preventDefault();
        deltaY += event.deltaY;
    }, false);
}

p.updatePosition = function(e){
    this.mousePosition = new Point(e.clientX, e.clientY);
    relativeMousePosition = new Point(this.mousePosition.x - (window.innerWidth/2.0), this.mousePosition.y - (window.innerHeight/2.0));
}

p.updateTouchPositions = function(e){
	var curTouches = [
	               new Point(e.touches[0].clientX, e.touches[0].clientY),
	               new Point(e.touches[1].clientX, e.touches[1].clientY)
	];
	touchZoom = Math.sqrt(Math.pow(curTouches[0].x-curTouches[1].x, 2)+Math.pow(curTouches[0].y-curTouches[1].y, 2));
}

// Update the mouse to the current state
p.update = function(dt, scale){
    
	// Save the current virtual position from scale
	this.virtualPosition = new Point(relativeMousePosition.x/scale, relativeMousePosition.y/scale);;
	
	// Get the currtenl delta y for the mouse wheel
    this.mouseWheelDY = deltaY;
    deltaY = 0;
	
	// Save the zoom diff and prev zoom
	if(scaling)
		this.zoomDiff = startTouchZoom - touchZoom;
	else
		this.zoomDiff = 0;
    
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

p.leftMouseClicked = function() {
	var temp = leftMouseClicked;
	leftMouseClicked = false;
	return temp;
}

module.exports = mouseState;
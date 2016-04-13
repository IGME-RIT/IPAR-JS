"use strict";
//imports
var Game = require('./modules/game.js');
var Point = require('./modules/point.js');
var MouseState = require('./modules/mouseState.js');
var Utility = require('./modules/utilities.js');
var DrawLib = require('./modules/drawLib.js');
var DOM_interface = require('./modules/DOM_interface.js');

//game objects
var game;
var canvas;
var ctx;
var utility;
var drawLib;

//responsiveness
var header;
var activeHeight;
var center;

//mouse handling
var mousePosition;
var relativeMousePosition;
var mouseDown;
var mouseIn;
var mouseDownTimer;
var mouseClicked;
var maxClickDuration; // milliseconds

// html DOM
var htmlElemHandler;

//persistent utilities
var prevTime; // date in milliseconds
var dt; // delta time in milliseconds

//fires when the window loads
window.onload = function(e){
    initializeVariables();
    loop();
}

//initialization, mouse events, and game instantiation
function initializeVariables(){
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    utility = new Utility();
    drawLib = new DrawLib();
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    console.log("Canvas Dimensions: " + canvas.width + ", " + canvas.height);
    
    htmlElemHandler = new DOM_interface();
    
    header = document.querySelector('header');
    activeHeight = canvas.offsetHeight - header.offsetHeight;
    center = new Point(canvas.width/2, activeHeight/2 + header.offsetHeight);
    
    mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    
    //event listeners for mouse interactions with the canvas
    canvas.addEventListener("mousemove", function(e){
        var boundRect = canvas.getBoundingClientRect();
        mousePosition = new Point(e.clientX - boundRect.left, e.clientY - boundRect.top);
        relativeMousePosition = new Point(mousePosition.x - (canvas.offsetWidth/2.0), mousePosition.y - (header.offsetHeight + activeHeight/2.0));        
    });
    mouseDown = false;
    canvas.addEventListener("mousedown", function(e){
        mouseDown = true;
    });
    canvas.addEventListener("mouseup", function(e){
        mouseDown = false;
    });
    mouseIn = false;
    mouseDownTimer = 0;
    mouseClicked = false;
    maxClickDuration = 200;
    canvas.addEventListener("mouseover", function(e){
        mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
        mouseIn = false;
        mouseDown = false;
    });
    
    prevTime = Date.now();
    dt = 0;
    
    game = new Game(utility, drawLib);
}

//fires once per frame
function loop(){
	// loop
    window.requestAnimationFrame(loop.bind(this));
    
    // update delta time
    dt = Date.now() - prevTime;
    prevTime = Date.now();
    
    // check mouse click
    mouseClicked = false;
    if (mouseDown) { mouseDownTimer += dt; }
    else { if (mouseDownTimer > 0 && mouseDownTimer < maxClickDuration) { mouseClicked = true; } mouseDownTimer = 0; }
    
    // update game
    game.update(ctx, canvas, dt, center, activeHeight, new MouseState(mousePosition, relativeMousePosition, mouseDown, mouseIn, mouseClicked));
}

//listens for changes in size of window and adjusts variables accordingly
window.addEventListener("resize", function(e){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    activeHeight = canvas.height - header.offsetHeight;
    center = new Point(canvas.width / 2, activeHeight / 2 + header.offsetHeight)
    
    console.log("Canvas Dimensions: " + canvas.width + ", " + canvas.height);
});




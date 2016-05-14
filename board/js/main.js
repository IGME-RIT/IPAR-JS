"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Game = require('./modules/game.js');
var Point = require('./modules/point.js');
var Constants = require('./modules/constants.js');
var Utilities = require('./modules/utilities.js');

//game objects
var game;

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
	
	// Setup dt
    prevTime = Date.now();
    dt = 0;
    
    // Create the game
    game = new Game(localStorage['caseFiles'], Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
}

//fires once per frame
function loop(){
	// loop
    window.requestAnimationFrame(loop.bind(this));
    
	// update delta time
    dt = Date.now() - prevTime;
    prevTime = Date.now();
    
    // update game
    game.update(dt);
}

//listens for changes in size of window and adjusts variables accordingly
window.addEventListener("resize", function(e){
    // Get the new scale
    game.setScale(Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));    
});

// Listen for touch for fullscreen
window.addEventListener('touchstart', function(event){
	
	if(window.matchMedia("only screen and (max-width: 760px)"))
		document.documentElement.requestFullScreen();
	
}, false);
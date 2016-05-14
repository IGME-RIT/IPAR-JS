"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Game = require('./modules/game.js');
var Point = require('./modules/point.js');
var Constants = require('./modules/constants.js');
var Utilities = require('./modules/utilities.js');

// The current game
var game;

// The current page the website is on
var curPage;
var PAGE = Object.freeze({TITLE: 0, CASE: 1, PROFILE: 2, BOARD: 3});

//fires when the window loads
window.onload = function(e){
	
    createGame();
	
}

// create the game object and start the loop with a dt
function createGame(){
    
	// Set the page to the game page
	curPage = PAGE.BOARD;
	
    // Create the game
    game = new Game(localStorage['caseFiles'], Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
    
    // Start the game loop
    gameLoop(Date.now());
    
}

//fires once per frame for the game
function gameLoop(prevTime){
	
    
	// get delta time
    var dt = Date.now() - prevTime;
    
    // update game
    game.update(dt);
    
	// loop
    window.requestAnimationFrame(gameLoop.bind(this, Date.now()));
    
}

//listens for changes in size of window and scales the game accordingly
window.addEventListener("resize", function(e){
	
	// Scale the game to the new size
	if(curPage==PAGE.BOARD)
		game.setScale(Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
	
});

// Listen for touch for fullscreen while in game on mobile
window.addEventListener('touchstart', function(event){
	
	if(curPage==PAGE.BOARD && window.matchMedia("only screen and (max-width: 760px)"))
		document.documentElement.requestFullScreen();
	
}, false);
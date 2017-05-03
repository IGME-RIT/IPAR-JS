"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Game = require('./modules/game/game.js');
var Point = require('./modules/helper/point.js');
var Constants = require('./modules/game/constants.js');
var Utilities = require('./modules/helper/utilities.js');
var TitleMenu = require('./modules/menus/titleMenu.js');
var CaseMenu = require('./modules/menus/caseMenu.js');
var ProfileMenu = require('./modules/menus/profileMenu.js');

// The current game
var game;

// The section holding the board
var boardSection;

// The current page the website is on
var curPage;
var menus = [];
var PAGE = Object.freeze({TITLE: 0, CASE: 1, PROFILE: 2, BOARD: 3});

//fires when the window loads
window.onload = function(e){
	
	// Get the sections
	boardSection = document.getElementById("board");
	
	// Setup title menu
	menus[PAGE.TITLE] = new TitleMenu(document.getElementById("titleMenu"));
	menus[PAGE.TITLE].onclose = function(){
		switch(this.next){
		case TitleMenu.NEXT.BOARD:
			curPage = PAGE.BOARD;
			createGame();
			break;
		case TitleMenu.NEXT.CASE:
			curPage = PAGE.CASE;
			menus[PAGE.CASE].open();
			break;
		}
	}
	
	// Setup case menu
	menus[PAGE.CASE] = new CaseMenu(document.getElementById("caseMenu"));
	menus[PAGE.CASE].onclose = function(){
		switch(this.next){
		case CaseMenu.NEXT.NEW_PROFILE:
			curPage = PAGE.PROFILE;
			menus[PAGE.PROFILE].open(true);
			break;
		case CaseMenu.NEXT.OLD_PROFILE:
			curPage = PAGE.PROFILE;
			menus[PAGE.PROFILE].open(false);
			break;
		case CaseMenu.NEXT.TITLE:
			curPage = PAGE.TITLE;
			menus[PAGE.TITLE].open();
			break;
		}
	}
	
	//Setup profile menu
	menus[PAGE.PROFILE] = new ProfileMenu(document.getElementById("profileMenu"));
	menus[PAGE.PROFILE].onclose = function(){
		switch(this.next){
		case ProfileMenu.NEXT.BOARD:
			curPage = PAGE.BOARD;
			createGame();
			break;
		case ProfileMenu.NEXT.CASE:
			curPage = PAGE.CASE;
			menus[PAGE.CASE].open();
			break;
		}
	}
	
	
	// Open the title menu
    curPage = PAGE.TITLE;
    menus[PAGE.TITLE].open();
    
}

// create the game object and start the loop with a dt
function createGame(){
	
	// Show the section for the game
	boardSection.style.display = 'block';
	
    // Create the game
    game = new Game(document.getElementById("board"), Utilities.getScale(Constants.boardSize, new Point(window.innerWidth, window.innerHeight)));
    
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
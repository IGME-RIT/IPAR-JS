"use strict";
var Board = require('./board.js');
var Point = require('./point.js');
var DrawLib = require('./drawLib.js');
var LessonNode = require('./lessonNode.js');
var Utilities = require('./utilities.js');
var ActiveJSON = require('../../data/lessons.json');

var GAME_PHASE = Object.freeze({LANDING: 0, SELECTION: 1, BOARD: 2});

//var painter;
var utility;
var currentPhase;

var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

var tempJSONContainer;



function game(){
    loadJSON("https://atlas-backend.herokuapp.com/repos");
    
    //painter = new DrawLib();
    utility = new Utilities();
    currentPhase = GAME_PHASE.BOARD;
    
    draggingDisabled = false;
    mouseSustainedDown = false;
    
    var testLessonNodeArray = [];
    
    for(var i = 0; i < ActiveJSON.length; i++){
        testLessonNodeArray.push(new LessonNode(new Point(i * 100, i * 75), "images/dog.png"));
    }
    
    //board = new Board(new Point(0,0), testLessonNodeArray);
}	

function loadJSON(pFilePath){
    var xhr = new XMLHttpRequest();
    xhr.onload = function(){
        var tempJSONContainer = JSON.parse(xhr.responseText);
    }

    xhr.open('GET', pFilePath, true);
    xhr.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2010 00:00:00 GM0T");
    xhr.send();
}

var p = game.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState){
    previousMouseState = mouseState;
    mouseState = pMouseState;
    mouseTarget = 0;
    if(typeof previousMouseState === 'undefined'){
        previousMouseState = mouseState;
    }
    
    
    if(currentPhase == GAME_PHASE.BOARD){
        //update active board object
    }
    //update stuff
    p.act();
    //draw stuff
    p.draw(ctx, canvas, center, activeHeight);
}

p.act = function(){
    //collision detection, iterate through each node in the active board
    /*for(var i = 0; i < board.lessonNodeArray.length; i++){
        var targetLessonNode = board.lessonNodeArray[i];
        utility.mouseIntersect(mouseState, targetLessonNode, board.position, targetLessonNode.scaleFactor);
        if(targetLessonNode.mouseOver == true){
            mouseTarget = targetLessonNode;
            break;
        }
    }*/
    
    //if the element that the mouse is hovering over is NOT the canvas
    if(mouseTarget != 0){
        //if mouseDown
        if(mouseState.mouseDown == true && previousMouseState.mouseDown == false){
            mouseSustainedDown = true;
            draggingDisabled = true;
        }
        //if mouseUp click event
        else if(mouseState.mouseDown == false && previousMouseState.mouseDown == true){
            console.log(mouseTarget.type);
            mouseTarget.click(mouseState);
        }
    }
    else{
        //if not a sustained down
        if(mouseSustainedDown == false){
            draggingDisabled = false;
        }
    }
    if(mouseState.mouseDown == false && previousMouseState.mouseDown == true){
        mouseSustainedDown = false;
    }
    
    //moving the board
    if(mouseState.mouseDown == true && draggingDisabled == false){
        board.move(previousMouseState.position.x - mouseState.position.x, previousMouseState.position.y - mouseState.position.y);
    }
    
    
    
    document.querySelector('#debugLine').innerHTML = "mousePosition: x = " + mouseState.relativePosition.x + ", y = " + mouseState.relativePosition.y + 
    "<br>Clicked = " + mouseState.mouseDown + 
    "<br>Over Canvas = " + mouseState.mouseIn;
}

p.draw = function(ctx, canvas, center, activeHeight){
    //draw board
    ctx.save();
    //painter.clear(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    //painter.rect(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight, "white");
    //painter.line(ctx, canvas.offsetWidth/2, center.y - activeHeight/2, canvas.offsetWidth/2, canvas.offsetHeight, 2, "lightgray");
    //painter.line(ctx, 0, center.y, canvas.offsetWidth, center.y, 2, "lightGray");
    
    //drawing lesson nodes
    //board.draw(ctx, center, activeHeight);
    
    ctx.restore();
}

module.exports = game;
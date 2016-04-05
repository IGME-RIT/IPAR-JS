"use strict";
var Board = require('./board.js');
var Point = require('./point.js');
var DrawLib = require('./drawLib.js');
var LessonNode = require('./lessonNode.js');
var Utilities = require('./utilities.js');
var boardPhase = require('./phases/boardPhase.js');

var GAME_PHASE = Object.freeze({LANDING: 0, SELECTION: 1, BOARD: 2});

var drawLib;
var utility;
var currentPhase;

//mouse management
var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

//phase handling
var phaseObject;



function game(pUltility, pDrawLib){
    utility = pUltility;
    drawLib = pDrawLib;
    currentPhase = GAME_PHASE.BOARD;
    phaseObject = new boardPhase();
    
    draggingDisabled = false;
    mouseSustainedDown = false;
}

var p = game.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState){
    previousMouseState = mouseState;
    mouseState = pMouseState;
    mouseTarget = 0;
    if(typeof previousMouseState === 'undefined'){
        previousMouseState = mouseState;
    }
    //update stuff
    p.act();
    //draw stuff
    p.draw(ctx, canvas, center, activeHeight);
    
    phaseObject.update();
    
    
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
    }
    
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
    */
    
    
    
    document.querySelector('#debugLine').innerHTML = "mousePosition: x = " + mouseState.relativePosition.x + ", y = " + mouseState.relativePosition.y + 
    "<br>Clicked = " + mouseState.mouseDown + 
    "<br>Over Canvas = " + mouseState.mouseIn;
}

p.draw = function(ctx, canvas, center, activeHeight){
    //draw board
    ctx.save();
    drawLib.clear(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    drawLib.rect(ctx, 0, 0, canvas.offsetWidth, canvas.offsetHeight, "white");
    drawLib.line(ctx, canvas.offsetWidth/2, center.y - activeHeight/2, canvas.offsetWidth/2, canvas.offsetHeight, 2, "lightgray");
    drawLib.line(ctx, 0, center.y, canvas.offsetWidth, center.y, 2, "lightGray");
    
    ctx.restore();
}

module.exports = game;
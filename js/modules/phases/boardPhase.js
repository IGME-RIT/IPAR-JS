"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');

var boardArray;
var activeBoardIndex;

function boardPhase(pUrl, pName){
    this.currentPhase = 2;
    this.name = pName;
    
    processData(pUrl);
    
    //read data
    //initialize boards
    
}	

function processData(pUrl){
    boardArray = [];
    var lessonNodes = [];
    lessonNodes.push(new LessonNode(new Point(0,0), "./images/dog.png"));
    boardArray.push(new Board(new Point(0,0), lessonNodes));
}

var p = boardPhase.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState){
    p.act();
    p.draw(ctx, canvas, center, activeHeight);
}

p.act = function(){
    
}

p.draw = function(ctx, canvas, center, activeHeight){
    for(var i = 0; i < boardArray.length; i++){
        for(var k = 0; k < boardArray[i].lessonNodeArray.length; k++){
            boardArray[i].lessonNodeArray[k].draw(ctx);
        }
    }
}


module.exports = boardPhase;
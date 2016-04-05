"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var DrawLib = require('../drawLib.js');
var LessonNode = require('../lessonNode.js');

var painter;

//position data, lessNode data
var activeBoard;

function boardPhase(pBoard){
    painter = new DrawLib();
    
    activeBoard = pBoard;
    
    var testLessonNodeArray = [];
    
    for(var i = 0; i < ActiveJSON.length; i++){
        testLessonNodeArray.push(new LessonNode(new Point(i * 100, i * 75), "images/dog.png"));
    }
    
}	

var p = boardPhase.prototype;

p.update = function(){
    p.act();
    p.draw();
}

p.act = function(){
    
}

p.draw = function(){
    
}


module.exports = boardPhase;
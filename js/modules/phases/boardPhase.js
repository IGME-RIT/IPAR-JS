"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');

var boardArray;
var activeBoardIndex;
var currentPhase;

function boardPhase(){
    currentPhase = 2;
    
    //initialize boards
    
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
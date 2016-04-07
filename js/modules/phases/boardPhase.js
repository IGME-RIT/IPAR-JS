"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');
var iparDataParser = require('../iparDataParser.js');
var Question = require('../question.js');

var boardArray;
var questions;
var questionElements;
var activeBoardIndex;

// file management
var iparParser;

function boardPhase(pUrl, pName){
    this.currentPhase = 2;
    this.name = pName;
    
    processData(pUrl);
    
    // initialize
    questionElements = [];
    questions = [];
    // create the parser
    iparParser = new iparDataParser();
    // read demo file into structure, passed to callback
    iparParser.createCaseFile("../data/mydata.xml",caseFileLoaded);
    
    
    //initialize boards
    
}	

function caseFileLoaded(caseFile) {
	questionElements = caseFile.getElementsByTagName("button");
    // create questions
    for (var i=0; i<questionElements.length; i++) 
	{
    	questions[i] = new Question();
    	questions[i].correctAnswer = questionElements[i].getAttribute("correctAnswer");
    	console.log("Correct answer for question "+(i+1)+": "+questions[i].correctAnswer);
    }
}

function processData(pUrl){
    boardArray = [];
    var lessonNodes = [];
    lessonNodes.push(new LessonNode(new Point(0,0), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(400,200), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(-300,100), "./images/goldDog.png"));
    lessonNodes.push(new LessonNode(new Point(-200,-200), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(300,-200), "./images/smolDog.png"));
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
            boardArray[i].draw(ctx, center, activeHeight);
        }
    }
}


module.exports = boardPhase;
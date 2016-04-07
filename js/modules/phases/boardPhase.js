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

    //initialize boards
    
}	


function processData(pUrl){
	

	// initialize
    questionElements = [];
    questions = [];
    // create the parser
    iparParser = new iparDataParser();
    // read demo file into structure, passed to callback
    iparParser.createCaseFile("../data/mydata.xml",caseFileLoaded);
    // ordinarily we would passin pUrl, as below. But we are passing in "../data/mydata.xml" for now
    // iparParser.createCaseFile(pUrl,caseFileLoaded);
    
    boardArray = [];
    
    // moved to caseFileLoaded so that it runs when the data loads
    /*var lessonNodes = [];
    lessonNodes.push(new LessonNode(new Point(0,0), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(400,200), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(-300,100), "./images/goldDog.png"));
    lessonNodes.push(new LessonNode(new Point(-200,-200), "./images/dog.png"));
    lessonNodes.push(new LessonNode(new Point(300,-200), "./images/smolDog.png"));
    boardArray.push(new Board(new Point(0,0), lessonNodes));*/
}

function caseFileLoaded(caseFile) {
	questions = iparParser.getQuestionsArray();
    createLessonNodesFromQuestions(questions);
}

function createLessonNodesFromQuestions(questions) {
	// initialize empty
	var lessonNodes = [];
    // add a node per question
	for (var i=0; i<questions.length; i++) {
		// create a new lesson node
		lessonNodes.push(new LessonNode(new Point(5*i-200,5*i-200), questions[i].imageLink ) );
		// attach question object to lesson node
		lessonNodes[lessonNodes.length-1].question = questions[i];
		console.log("image: "+lessonNodes[lessonNodes.length-1].image.getAttribute("src"));
		
	}
	// create a board
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
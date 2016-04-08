"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');
var IparDataParser = require('../iparDataParser.js');
var Question = require('../question.js');

var boardArray;
var questions;
var activeBoardIndex;
//has everything loaded?
var loadingComplete;

function boardPhase(pUrl){
    this.currentPhase = 2;
    loadingComplete = false;
    
    processData(pUrl);
}	


function processData(pUrl){
	

	// initialize
    boardArray = [];
    // create the parser
    var extractedData = new IparDataParser("./data/mydata.xml", dataLoaded);
}

function dataLoaded(sentData) {
	//questions = iparParser.getQuestionsArray();
    //createLessonNodesFromQuestions(questions);
    
    questions = sentData;
    createLessonNodesFromQuestions(questions);
    loadingComplete = true;
}

function createLessonNodesFromQuestions(questions) {
	// initialize empty
	var lessonNodes = [];
    // add a node per question
	for (var i = 0; i < questions.length; i++) {
		// create a new lesson node
		lessonNodes.push(new LessonNode(new Point(15*i-200,15*i-200), questions[i].imageLink, questions[i] ) );
		// attach question object to lesson node
		lessonNodes[lessonNodes.length-1].question = questions[i];
		//console.log("image: "+lessonNodes[lessonNodes.length-1].image.getAttribute("src"));
		
	}
	// create a board
	boardArray.push(new Board(new Point(0,0), lessonNodes));
}


var p = boardPhase.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState){
    p.act();
    p.draw(ctx, canvas, center, activeHeight);
    
    // hover states
    for(var i = 0; i < boardArray.length; i++){
    	
		boardArray[i].lessonNodeArray.forEach(function(lNode) {
			//console.log("lnode: " + lNode.position.x);
			
			// if hovering, reduce opacity
			if (pMouseState.position.x > lNode.position.x-lNode.width/2 
			&& pMouseState.position.x < lNode.position.x+lNode.width/2
			&& pMouseState.position.y > lNode.position.y-lNode.height/2
			&& pMouseState.position.y < lNode.position.y+lNode.height/2) {
				lNode.mouseOver = true;
				console.log("mouse over");
			}
		});
    }
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
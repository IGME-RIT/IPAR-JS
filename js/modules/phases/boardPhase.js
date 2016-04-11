"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');
var IparDataParser = require('../iparDataParser.js');
var Question = require('../question.js');
var Point = require('../point.js');

var boardArray;
var currentBoard;
var questions;
var activeBoardIndex;
//has everything loaded?
var loadingComplete;
// save the last state of the mouse for checking clicks
var prevMouseState;

function boardPhase(pUrl){
    loadingComplete = false;
    processData(pUrl);
}	


function processData(pUrl){
	// initialize
    boardArray = [];
    // create the parser
    var extractedData = new IparDataParser("./data/mydata.xml", dataLoaded);
}

function dataLoaded(categoryData) {
	//questions = iparParser.getQuestionsArray();
    //createLessonNodesFromQuestions(questions);
    createLessonNodesInBoards(categoryData);
    loadingComplete = true;
}

function createLessonNodesInBoards(categories) {
	categories.forEach(function(cat) {
		// initialize empty
		var lessonNodes = [];
		// add a node per question
		for (var i = 0; i < cat.questions.length; i++) {
			// create a new lesson node
			lessonNodes.push(new LessonNode(new Point(cat.questions[i].positionPercentX - 500, cat.questions[i].positionPercentY - 300), cat.questions[i].imageLink, cat.questions[i] ) );
			// attach question object to lesson node
			lessonNodes[lessonNodes.length-1].question = cat.questions[i];
			//console.log("image: "+lessonNodes[lessonNodes.length-1].image.getAttribute("src"));
		
		}
		// create a board
		boardArray.push(new Board(new Point(0,0), lessonNodes));
		//console.log(boardArray[boardArray.length-1].lessonNodeArray[0].question);
	});
	activeBoardIndex = 3; // start with the first board (actually its the second now so I can debug)
}


var p = boardPhase.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState) {
    p.act(pMouseState);
    p.draw(ctx, canvas, center, activeHeight);
    if (activeBoardIndex) boardArray[activeBoardIndex].update();
}

p.act = function(pMouseState){
	// hover states
	//for(var i = 0; i < boardArray.length; i++){
		// loop through lesson nodes to check for hover
	if (activeBoardIndex != undefined) {
		// update board
		
		var nodeChosen = false;
		for (var i=boardArray[activeBoardIndex].lessonNodeArray.length-1; i>=0; i--) {
			var lNode = boardArray[activeBoardIndex].lessonNodeArray[i];
			
			if (!pMouseState.mouseDown) {
				lNode.dragPosition = undefined; // clear drag behavior
				lNode.dragging = false;
			} 
			
			lNode.mouseOver = false;
			
			// if there is already a selected node, do not continue
			if (nodeChosen) continue;
			
			//consoel.log("node update");
			// if hovering, show hover glow
			if (pMouseState.relativePosition.x > lNode.position.x-lNode.width/2 
			&& pMouseState.relativePosition.x < lNode.position.x+lNode.width/2
			&& pMouseState.relativePosition.y > lNode.position.y-lNode.height/2
			&& pMouseState.relativePosition.y < lNode.position.y+lNode.height/2) {
				lNode.mouseOver = true;
				nodeChosen = true;
				
				if (pMouseState.mouseDown && !prevMouseState.mouseDown) {
					// drag
					lNode.dragging = true;
					lNode.dragPosition = new Point(
					pMouseState.relativePosition.x - lNode.position.x,
					pMouseState.relativePosition.y - lNode.position.y
					);
					
				}
				if (pMouseState.mouseClicked) {
					// handle click code
					lNode.click(pMouseState);
				}
			}
			// if the user is dragging a node, allow the mouse to control its movement
			if (lNode.dragging) {
				lNode.position.x = pMouseState.relativePosition.x - lNode.dragPosition.x;
				lNode.position.y = pMouseState.relativePosition.y - lNode.dragPosition.y;
			}
		}
	}
	prevMouseState = pMouseState;
}

p.draw = function(ctx, canvas, center, activeHeight){
	// current board = 0;
	//console.log("draw currentBoard " + currentBoard);
	if (activeBoardIndex != undefined) boardArray[activeBoardIndex].draw(ctx, center, activeHeight);
}


module.exports = boardPhase;
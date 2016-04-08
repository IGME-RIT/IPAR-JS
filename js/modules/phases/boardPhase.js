"use strict";
var Board = require('../board.js');
var Point = require('../point.js');
var LessonNode = require('../lessonNode.js');
var IparDataParser = require('../iparDataParser.js');
var Question = require('../question.js');
var Point = require('../point.js');

var boardArray;
var currentBoard;
var categories;
var questions;
var activeBoardIndex;
//has everything loaded?
var loadingComplete;
// save the last state of the mouse for checking clicks
var prevMouseState;

function boardPhase(pUrl){
    loadingComplete = false;
    this.activeNodes = [];
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
    categories = categoryData;
    createLessonNodesInCategories(categories);
    loadingComplete = true;
}

function createLessonNodesInCategories(categories) {
	categories.forEach(function(cat) {
		// initialize empty
		var lessonNodes = [];
		// add a node per question
		for (var i = 0; i < cat.questions.length; i++) {
			// create a new lesson node
			lessonNodes.push(new LessonNode(new Point(15*i-100,15*i-100), cat.questions[i].imageLink, cat.questions[i] ) );
			// attach question object to lesson node
			lessonNodes[lessonNodes.length-1].question = cat.questions[i];
			//console.log("image: "+lessonNodes[lessonNodes.length-1].image.getAttribute("src"));
		
		}
		cat.lessonNodes = lessonNodes;
	});
	// create a board
	boardArray.push(new Board(new Point(0,0), categories,3));
	currentBoard = boardArray.length-1;
	//console.log("currentBoard: "+currentBoard);
	// set active nodes to all nodes for now
	//this.activeNodes = lessonNodes;
}


var p = boardPhase.prototype;

p.update = function(ctx, canvas, dt, center, activeHeight, pMouseState){
    p.act(pMouseState);
    p.draw(ctx, canvas, center, activeHeight);
}

p.act = function(pMouseState){
	// hover states
	//for(var i = 0; i < boardArray.length; i++){
		// loop through lesson nodes to check for hover
	if (currentBoard != undefined) {
		boardArray[currentBoard].categoryArray[boardArray[currentBoard].currentCategory].lessonNodes.forEach(function(lNode) {
			
			if (!pMouseState.mouseDown) {
				lNode.dragPosition = undefined; // clear drag behavior
				lNode.dragging = false;
			} 
			
			lNode.mouseOver = false;
			
			//consoel.log("node update");
			// if hovering, show hover glow
			if (pMouseState.relativePosition.x > lNode.position.x-lNode.width/2 
			&& pMouseState.relativePosition.x < lNode.position.x+lNode.width/2
			&& pMouseState.relativePosition.y > lNode.position.y-lNode.height/2
			&& pMouseState.relativePosition.y < lNode.position.y+lNode.height/2) {
				lNode.mouseOver = true;
				
				if (pMouseState.mouseDown && !prevMouseState.mouseDown) {
					// drag
					lNode.dragging = true;
					lNode.dragPosition = new Point(
					pMouseState.relativePosition.x - lNode.position.x,
					pMouseState.relativePosition.y - lNode.position.y
					);
					
				}
			}
			if (lNode.dragging) {
				lNode.position.x = pMouseState.relativePosition.x - lNode.dragPosition.x;
				lNode.position.y = pMouseState.relativePosition.y - lNode.dragPosition.y;
			}
		});
	}
	prevMouseState = pMouseState;
}

p.draw = function(ctx, canvas, center, activeHeight){
	// current board = 0;
	//console.log("draw currentBoard " + currentBoard);
	if (currentBoard != undefined) boardArray[currentBoard].draw(ctx, center, activeHeight);
}


module.exports = boardPhase;
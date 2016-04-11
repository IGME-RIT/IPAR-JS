"use strict";

//parameter is a point that denotes starting position
function question(){
    this.index;             //int
    this.categoryIndex;     //int
    this.correctAnswer;     //int
    this.questionText;      //string
    this.questionType		//int			<- from xml
    this.answerText;        //stromg array
    this.feedbackText;      //string array
    this.imageLink;         //string
    this.connections;       //string
    this.instructions;      //string
    this.resources;         //resourceItem
    this.revealThreshold;   //int
    
    this.positionPercentX = 50;
    this.positionPercentY = 50;
    
    this.justification;     //string
    this.fileSubmitCount;   //int
    this.animated;          //bool
    this.linesTraced;       //int
    this.revealBuffer;      //int
}

var p = question.prototype;

module.exports = question;
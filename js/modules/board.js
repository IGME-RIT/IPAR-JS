"use strict";

//parameter is a point that denotes starting position
function board(startPosition, categories, currentCategory){
    this.position = startPosition;
    this.categoryArray = categories;
    this.currentCategory = currentCategory;
}

board.drawLib = undefined;

//prototype
var p = board.prototype;

p.move = function(pX, pY){
    this.position.x += pX;
    this.position.y += pY;
};

p.draw = function(ctx, center, activeHeight){
    ctx.save();
    //console.log("draw board");
    //translate to the center of the screen
    ctx.translate(center.x - this.position.x, center.y - this.position.y);
    //for(var i=0; i<this.categoryArray.length; i++){
    this.categoryArray[this.currentCategory].lessonNodes.forEach(function (node) {
        node.draw(ctx);
        //console.log(node.question.questionText);
    });
    //}
    ctx.restore();
};

module.exports = board;

//this is an object named Board and this is its javascript
//var Board = require('./objects/board.js');
//var b = new Board();
    
"use strict";
var DrawLib = require('./drawLib.js');

var drawLib;
//parameter is a point that denotes starting position
function lessonNode(startPosition, imagePath){
    drawLib = new DrawLib();
    
    this.position = startPosition;
    this.mouseOver = false;
    this.scaleFactor = 1;
    this.type = "lessonNode";
    this.image = new Image();
    this.width = 100;
    this.height = 100;
    
    //image loading and resizing
    this.image.onload = function() {
        //this.width = this.image.naturalWidth;
        //this.height = this.image.naturalHeight;
        var maxDimension = 100;
        //too small?
        if(this.width < maxDimension && this.height < maxDimension){
            var x;
            if(this.width > this.height){
                x = maxDimension / this.width;
            }
            else{
                x = maxDimension / this.height;
            }
            this.width = this.width * x;
            this.height = this.height * x;
        }
        if(this.width > maxDimension || this.height > maxDimension){
            var x;
            if(this.width > this.height){
                x = this.width / maxDimension;
            }
            else{
                x = this.height / maxDimension;
            }
            this.width = this.width / x;
            this.height = this.height / x;
        }
    };
    
    this.image.src = imagePath;
}

var p = lessonNode.prototype;

p.draw = function(ctx){
    //lessonNode.drawLib.circle(ctx, this.position.x, this.position.y, 10, "red");
    //draw the image, shadow if hovered
    ctx.save();
    if(this.mouseOver){
        ctx.shadowColor = 'dodgerBlue';
        ctx.shadowBlur = 20;
    }
    //ctx.drawImage(this.image, this.position.x - (this.width*this.scaleFactor)/2, this.position.y - (this.height*this.scaleFactor)/2, this.width * this.scaleFactor, this.height * this.scaleFactor)
    drawLib.rect(ctx, this.position.x, this.position.y, this.width, this.height, "blue");
    
    
    ctx.restore();
};

p.click = function(mouseState){
    console.log("whoopity doo");
}

module.exports = lessonNode;
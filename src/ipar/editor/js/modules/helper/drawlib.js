"use strict";

//Module export
var m = module.exports;

m.clear = function(ctx, x, y, w, h) {
    ctx.clearRect(x, y, w, h);
}

m.rect = function(ctx, x, y, w, h, col, centerOrigin) {
    ctx.save();
    ctx.fillStyle = col;
    if(centerOrigin){
        ctx.fillRect(x - (w / 2), y - (h / 2), w, h);
    }
    else{
        ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
}

m.strokeRect = function(ctx, x, y, w, h, line, col, centerOrigin) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = line;
    if(centerOrigin){
        ctx.strokeRect(x - (w / 2), y - (h / 2), w, h);
    }
    else{
        ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
}

m.line = function(ctx, x1, y1, x2, y2, thickness, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

m.circle = function(ctx, x, y, radius, color){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

// http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag 
m.arrow = function(ctx, start, end, headlen, thickness, color){

    var angle = Math.atan2(end.y-start.y, end.x-start.x);
	
    ctx.save();
	ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x-headlen*Math.cos(angle-Math.PI/6), end.y-headlen*Math.sin(angle-Math.PI/6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x-headlen*Math.cos(angle+Math.PI/6), end.y-headlen*Math.sin(angle+Math.PI/6))
    ctx.closePath();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

function boardButton(ctx, position, width, height, hovered){
    //ctx.save();
    if(hovered){
        ctx.fillStyle = "dodgerblue";
    }
    else{
        ctx.fillStyle = "lightblue";
    }
    //draw rounded container
    ctx.rect(position.x - width/2, position.y - height/2, width, height);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.fill();
    //ctx.restore();
}
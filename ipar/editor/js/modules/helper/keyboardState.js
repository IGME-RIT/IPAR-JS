"use strict";

function KeyboardState(game){
	this.key = [];
	this.preKey = [];
	this.keyPressed = [];
	this.keyReleased = [];
    var keyboardState = this;
    window.addEventListener("keydown", function(e){
    	if(game.active)
    		e.preventDefault();
    	keyboardState.key[e.keyCode] = true;
    });
    window.addEventListener("keyup", function(e){
    	if(game.active)
    		e.preventDefault();
    	keyboardState.key[e.keyCode] = false;
    });
}

var p = KeyboardState.prototype;

//Update the mouse to the current state
p.update = function(){

	for(var i=0;i<this.keyPressed.length;i++)
		if(this.keyPressed[i])
			this.keyPressed[i] = false;

	for(var i=0;i<this.keyReleased.length;i++)
		if(this.keyReleased[i])
			this.keyReleased[i] = false;
	
	for(var i=0;i<this.key.length;i++){
		if(this.preKey[i] && !this.key[i])
			this.keyReleased[i] = true;
		if(!this.preKey[i] && this.key[i])
			this.keyPressed[i] = true;
		this.preKey[i] = this.key[i];
	}
}

module.exports = KeyboardState;
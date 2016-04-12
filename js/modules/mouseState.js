"use strict";
function mouseState(pPosition, pRelativePosition, pMousedown, pMouseIn, pMouseClicked){
    this.position = pPosition;
    this.relativePosition = pRelativePosition;
    this.mouseDown = pMousedown;
    this.mouseIn = pMouseIn;
    this.prevMouseDown = pMousedown;
    this.mouseClicked = pMouseClicked;
    this.hasTarget = false;
}

var p = mouseState.prototype;

module.exports = mouseState;
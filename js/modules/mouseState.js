"use strict";
function mouseState(pPosition, pRelativePosition, pMousedown, pMouseIn){
    this.position = pPosition;
    this.relativePosition = pRelativePosition;
    this.mouseDown = pMousedown;
    this.mouseIn = pMouseIn;
    this.prevMouseDown = pMousedown;
}

var p = mouseState.prototype;

module.exports = mouseState;
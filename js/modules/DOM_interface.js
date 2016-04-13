"use strict";

// references to the dom elements
var refs = undefined;

function hideElement(elem) {
	elem.style.display = "none";
	console.log(elem.id + " hidden");
}

function showElement(elem) {
	elem.style.display = "block";
}

function DOM_interface() {
	refs = {
		superPanel: document.querySelector(".questionPanels"),
		text: document.querySelector(".multipleChoiceText"),
		answers: document.querySelector(".multipleChoiceAnswers"),
		email: document.querySelector(".emailQuestion"),
		resources: document.querySelector(".resources"),
		closeButton: document.querySelector(".closeBtn"),
		proceedButton: document.querySelector(".proceedBtn")
	}
	refs.closeButton.onclick = function() {
		hideElement(refs.superPanel);
	}
}

var p = DOM_interface.prototype;

module.exports = DOM_interface;
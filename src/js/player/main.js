"use strict";

var Video = require('./modules/video.js');
var PlayButton = require('./modules/playButton.js');

window.onload = function(e) {
	console.log("Setting video elements!");
	// get video elements
	var elements = document.getElementsByClassName("player");

	for(var i=0; i<elements.length; i++) {
		console.log("Setting element " + i);
		// get source attribute
		var src = elements[i].getAttribute('data-video-src');

		// create video
		var video = new Video(src);

		// create button
		var button = new PlayButton(video);

		// register event handlers
		video.setButton(button);
		
		// attach video to element
		video.setParent(elements[i]);

		// attach button to element
		button.setParent(elements[i]);

	}
}

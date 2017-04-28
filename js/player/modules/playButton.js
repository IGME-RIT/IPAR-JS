function PlayButton(video) {
	// create play button
	this.element = document.createElement("span");
	this.element.setAttribute("class", "glyphicon glyphicon-play-circle video-play");

	this.video = video;

	// register event handlers
	this.element.addEventListener("click", function() {
		// play the video
		this.video.element.play();
	});
}

p = PlayButton.prototype;

p.setParent = function(parent) {
	this.parentElement = parent;
	parent.appendChild(this.element);
}

p.toggle = function(val) {
	if(val) {
		// show button
		this.element.setAttribute("style", "");
	}
	else {
		// hide button
		this.element.setAttribute("style", "display: none;");
	}
}

module.exports = PlayButton;

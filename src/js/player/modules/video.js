function Video(src) {
	// create video element
	this.element = document.createElement("video");
	this.element.setAttribute("src", src);
}

p = Video.prototype;

p.setParent = function(parent) {
	this.parentElement = parent;
	parent.appendChild(this.element);
}

p.setButton = function(button) {
	this.button = button;
	
	// set up event handlers
	this.element.addEventListener("playing", function() {
		// hide button when playing
		this.button.toggle(false);
		
		// show controls when playing
		this.element.setAttribute("controls", "");
	}.bind(this));

	this.element.addEventListener("pause", function() {
		// show button while paused
		this.button.toggle(true);
	}.bind(this));

	this.element.addEventListener("ended", function() {
		// show button when video ends
		this.button.toggle(true);

		// hide controls
		this.element.removeAttribute("controls");
	}.bind(this));
}

module.exports = Video;

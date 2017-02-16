"use strict";

document.documentElement.requestFullScreen = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;

//imports
var Reader = require('./modules/reader.js');
var TitleMenu = require('./modules/titleMenu.js');

//fires when the window loads
window.onload = function(e){
	
	// Setup title menu
	var title = new TitleMenu(document.getElementById("titleMenu"));
	title.onclose = function(){
		var reader = new Reader(document.getElementById("case"), title.loadData);
	}
    
}
var Utilities = require('../helper/utilities.js');

// HTML
var section;

// Elements
var title, description;
var resume, start, back;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, TITLE: 1, NEW_PROFILE: 2, OLD_PROFILE: 3});

function CaseMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	title = document.querySelector('#'+section.id+' #title');
	description = document.querySelector('#'+section.id+' #description');
	resume = document.querySelector('#'+section.id+' #resume-button');
	start = document.querySelector('#'+section.id+' #start-button');
	back = document.querySelector('#'+section.id+' #back-button');
	
	// Setup the buttons
    var page = this;
    resume.onclick = function(){
    	page.next = NEXT.OLD_PROFILE;
    	page.close();
    };
    start.onclick = function(){
    	page.next = NEXT.NEW_PROFILE;
    	page.close();
    };
    back.onclick = function(){
    	page.next = NEXT.TITLE;
    	page.close();
    };
}

var p = CaseMenu.prototype;

p.open = function(){
	
	// Display the section holding the menu
	section.style.display = '';
	
	// Get the case name and description from the xml
	localforage.getItem('caseFile').then(function(caseFile){
		var curCase = Utilities.getXml(caseFile).getElementsByTagName("case")[0];
		title.innerHTML = curCase.getAttribute("caseName");
		description.innerHTML = curCase.getAttribute("description");
	});
	
	// Get the case save status
	localforage.getItem('saveFile').then(function(saveFile){
		caseStatus = Utilities.getXml(saveFile).getElementsByTagName("case")[0].getAttribute("caseStatus");
		var statusMessage = "";
		switch(caseStatus){
			case '0':
				statusMessage = "";
				resume.disabled = true;
				break;
			case '1':
				statusMessage = " [In Progress]";
				break;
			case '2':
				statusMessage = " [Completed]";
				break;
		}
	    title.innerHTML += statusMessage;
	});
    
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = CaseMenu;
module.exports.NEXT = NEXT;
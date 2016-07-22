var Utilities = require('../helper/utilities.js');

// HTML
var section;

//Elements
var nameInput, descriptionInput, cat1Input;
var create, back;

// The cur case
var caseFile;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, TITLE: 1, BOARD: 2});

function CreateMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	nameInput = document.querySelector('#'+section.id+' #input-name');
	descriptionInput = document.querySelector('#'+section.id+' #input-description');
	conclusionInput = document.querySelector('#'+section.id+' #input-conclusion');
	cat1Input = document.querySelector('#'+section.id+' #input-cat1');
	create = document.querySelector('#'+section.id+' #create-button');
	back = document.querySelector('#'+section.id+' #back-button');
    
	// Setup the buttons
	back.onclick = function(){
    	page.next = NEXT.TITLE;
    	page.close();
    };
	var page = this;
    create.onclick = function(){
    	
    	page.next = NEXT.BOARD;
    	create.disabled = true;
    	back.disabled = true;
    	
    	var request = new XMLHttpRequest();
    	request.responseType = "arraybuffer";
    	request.onreadystatechange = function() {
    	  if (request.readyState == 4 && request.status == 200) {
    		  	
    		Utilities.loadCaseData(nameInput.value+".iparw", request.response, function(){
    			localforage.getItem('caseFile').then(function(caseFile){
    				caseFile = Utilities.getXml(caseFile);
    				
    				// Set the inputs to the current case
    		    	var curCase = caseFile.getElementsByTagName("case")[0];
    		    	curCase.setAttribute('caseName', nameInput.value);
    		    	curCase.setAttribute('description', descriptionInput.innerHTML);
    		    	curCase.setAttribute('conclusion', conclusionInput.innerHTML);
    		    	var catList = curCase.getElementsByTagName('categoryList')[0];
    		    	catList.setAttribute('categoryCount', '1');
    		    	catList.innerHTML = '<element>'+cat1Input.value+'</element>';
    		    	var cat1 = caseFile.createElement('category');
    		    	cat1.setAttribute('categoryDesignation', '0');
    		    	cat1.setAttribute('questionCount', '0');
    		    	curCase.appendChild(cat1);
    		    	
    		    	// Save the changes to local storage
    		    	localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile), page.close.bind(page));
    			});
    		});
    	  }
    	};
    	request.open("GET", "base.iparw", true);
    	request.send();
    };
}

var p = CreateMenu.prototype;

p.open = function(){
	
	// Make the menu visible
	section.style.display = '';

	// Make it so that create is disabled until you at least have a name and 1st cat
	var checkProceed = function(){
		if(nameInput.value=="" ||
			cat1Input.value=="")
			create.disabled = true;
		else
			create.disabled = false;
	};
	nameInput.addEventListener('change', checkProceed);
	cat1Input.addEventListener('change', checkProceed);
	checkProceed();
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = CreateMenu;
module.exports.NEXT = NEXT;
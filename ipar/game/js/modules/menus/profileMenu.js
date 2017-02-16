var Utilities = require('../helper/utilities.js');

// HTML
var section;

//Elements
var title;
var firstName, lastName, email;
var firstNameInput, lastNameInput, emailInput;
var proceed, back;

// If making a new profile or not
var newProfile;

// The cur case
var curCase;

// The next page to open when this one closes
var next;

var NEXT = Object.freeze({NONE: 0, CASE: 1, BOARD: 2});

function ProfileMenu(pSection){
	section = pSection;
	next = NEXT.NONE;
	
	// Get the html elements
	title = document.querySelector('#'+section.id+' #title');
	firstName = document.querySelector('#'+section.id+' #first-name');
	lastName = document.querySelector('#'+section.id+' #last-name');
	email = document.querySelector('#'+section.id+' #email');
	firstNameInput = document.querySelector('#'+section.id+' #input-first-name');
	lastNameInput = document.querySelector('#'+section.id+' #input-last-name');
	emailInput = document.querySelector('#'+section.id+' #input-email');
	proceed = document.querySelector('#'+section.id+' #proceed-button');
	back = document.querySelector('#'+section.id+' #back-button');
    
	// Setup the buttons
	back.onclick = function(){
    	page.next = NEXT.CASE;
    	page.close();
    };
	var page = this;
    proceed.onclick = function(){
    	page.next = NEXT.BOARD;
    	if(newProfile){
			curCase.setAttribute("profileFirst", firstNameInput.value);
			curCase.setAttribute("profileLast", lastNameInput.value);
			curCase.setAttribute("profileMail", emailInput.value);
			curCase.setAttribute("caseStatus", "0");
    	}
    	else
			curCase.setAttribute("caseStatus", "1");
    	localforage.setItem('saveFile', new XMLSerializer().serializeToString(curCase), function(){
        	page.close();
    	});
    };
}

var p = ProfileMenu.prototype;

p.open = function(pNewProfile){

	
	// Save the status of new profile for the procceed button
	newProfile = pNewProfile;
	
	// Make the menu visible
	section.style.display = '';
	
	// Get the case
	localforage.getItem('saveFile').then(function(saveFile){
		
		curCase = Utilities.getXml(saveFile).getElementsByTagName("case")[0];
		
		// Set up the page for a new profile
		if(newProfile){
			
			// Update the title
			title.innerHTML = "Enter Profile Information";
			
			// Display the inputs and clear the names
			email.style.display = '';
			firstNameInput.style.display = '';
			lastNameInput.style.display = '';
			firstName.innerHTML = '';
			lastName.innerHTML = '';
			
			
			// Make it so that proceed is disabled until all three inputs have values
			var checkProceed = function(){
				if(firstNameInput.value=="" ||
					lastNameInput.value=="" ||
					emailInput.value=="")
					proceed.disabled = true;
				else
					proceed.disabled = false;
			};
			firstNameInput.addEventListener('change', checkProceed);
			lastNameInput.addEventListener('change', checkProceed);
			emailInput.addEventListener('change', checkProceed);
			checkProceed();
			
		}
		// Set up the page for an old profile
		else{
			
			// Update the title
			title.innerHTML = "Confirm Profile Information";
			
			// Hide the email and textboxes and display the current name
			email.style.display = 'none';
			firstNameInput.style.display = 'none';
			lastNameInput.style.display = 'none';
			firstName.innerHTML = curCase.getAttribute("profileFirst");
			firstName.style.fontWeight = 'bold';
			lastName.innerHTML = curCase.getAttribute("profileLast");
			lastName.style.fontWeight = 'bold';
			
			// Make procceed not disabled
			proceed.disabled = false;
			
		}
		
	});
	
}

p.close = function(){
	section.style.display = 'none';
	if(this.onclose)
		this.onclose();
}

module.exports = ProfileMenu;
module.exports.NEXT = NEXT;
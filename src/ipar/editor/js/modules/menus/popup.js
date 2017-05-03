var Windows = require('../html/popupWindows.js');

var m = module.exports;

m.editInfo = function(windowDiv, caseFile, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.editInfo;
    var editInfo = tempDiv.firstChild;
    
    // Fill it with the given info
    var caseInfo = caseFile.getElementsByTagName("case")[0];
    editInfo.innerHTML = editInfo.innerHTML.replace(/%caseName%/g, caseInfo.getAttribute("caseName")).replace(/%description%/g, caseInfo.getAttribute("description")).replace(/%conclusion%/g, caseInfo.getAttribute("conclusion"));
    
    // Setup the buttons
    var buttons = editInfo.getElementsByTagName("button");
    buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback(caseFile, caseInfo.getAttribute("caseName"));
    }
    buttons[1].onclick = function(){
    	windowDiv.innerHTML = '';
    	var form = editInfo.getElementsByTagName("form")[0];
    	var divs = form.getElementsByTagName("div");
    	caseInfo.setAttribute("caseName", form.elements["caseName"].value);
    	caseInfo.setAttribute("description", divs[0].innerHTML);
    	caseInfo.setAttribute("conclusion", divs[1].innerHTML);
    	callback(caseFile, form.elements["caseName"].value);
    }

    // Display the window
    windowDiv.innerHTML = '';
    windowDiv.appendChild(editInfo);
    
    
}

m.prompt = function(windowDiv, title, prompt, defaultValue, applyText, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.textInput;
    var promptWindow = tempDiv.firstChild;
    
    // Fill it with the given info
    promptWindow.innerHTML = promptWindow.innerHTML.replace(/%title%/g, title).replace(/%prompt%/g, prompt).replace(/%value%/g, defaultValue).replace(/%apply%/g, applyText);
    
    // Setup the buttons
    var buttons = promptWindow.getElementsByTagName("button");
    buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback();
    }
    buttons[1].onclick = function(){
    	windowDiv.innerHTML = '';
    	callback(promptWindow.getElementsByTagName("form")[0].elements["text"].value);
    }

    // Display the window
    windowDiv.innerHTML = '';
    windowDiv.appendChild(promptWindow);
	
}
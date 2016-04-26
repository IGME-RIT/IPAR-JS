

function QuestionWindows(callback){
  this.loadWindows(callback);
}

var p = QuestionWindows.prototype;

p.loadWindows = function(callback){

  var counter = 0;
  var cb = function(){
	  if(++counter>=6 && callback)
		  callback();
  };
  this.loadTaskWindow(cb);
  this.loadResourceWindow(cb);
  this.loadAnswerWindow(cb);
  this.loadFileWindow(cb);
  this.loadMessageWindow(cb);
  this.loadResource(cb);
  
}

p.loadTaskWindow = function(callback){
	// Get the template for task windows
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Save the task window 
	    	windows.taskWindow = request.responseText;
	    	if(callback)
	    	  callback();
	    }
	}
	request.open("GET", "taskWindow.html", true);
	request.send();
}


p.loadResourceWindow = function(callback){
	
	// Get the template for resource windows
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Save the resource window 
	    	windows.resourceWindow = request.responseText;
	        if(callback)
	        	callback();
	    }
	};
	request.open("GET", "resourceWindow.html", true);
	request.send();
}

p.loadResource = function(callback){
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Get the html for each resource and then add the result to the window
	    	windows.resource = request.responseText;
	        if(callback)
	        	callback();
	    }
	}
	request.open("GET", "resource.html", true);
	request.send();
}

p.loadAnswerWindow = function(callback){
	
	// Get the template for answer windows
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Save the answer window 
	    	windows.answerWindow = request.responseText;
	        if(callback)
	        	callback();
	    }
	}
	request.open("GET", "answerWindow.html", true);
	request.send();
}

p.loadFileWindow = function(callback){
	
	// Get the template for file windows
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Save the file window 
	    	windows.fileWindow = request.responseText;
	    	if(callback)
	    		callback();
	        
	    }
	}
	request.open("GET", "fileWindow.html", true);
	request.send();
}

p.loadMessageWindow = function(callback){
	
	// Get the template for message windows
	var windows = this;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
	    if (request.readyState == 4 && request.status == 200) {
	    	
	    	// Save the message window 
	    	windows.messageWindow = request.responseText;
		    if(callback)
		    	callback();

	    }
	}
	request.open("GET", "messageWindow.html", true);
	request.send();
}

module.exports = QuestionWindows;
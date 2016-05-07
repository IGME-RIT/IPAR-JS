// Get the filesystem
window.requestFileSystemSync  = window.requestFileSystemSync || window.webkitRequestFileSystemSync;

document.addEventListener('DOMContentLoaded', function() {
	
	// Make sure the need APIs are supported
	if(!window.File || !window.FileReader || !window.FileList || !window.Blob || !window.ArrayBuffer || !window.Worker){
		alert('The File APIs need to load files are not supported in this browser!');
		document.getElementById("load-button").disabled = true;
	}
	else{
		// Get the load button and input
		var loadInput = document.getElementById('load-input');
		var loadButton = document.getElementById('load-button');
		var demoButton = document.getElementById('demo-button');
		
		// When click the demo clear cache open board page
		demoButton.onclick = function() {
			
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			demoButton.disabled = true;
			
			var request = new XMLHttpRequest();
			request.responseType = "arraybuffer";
			request.onreadystatechange = function() {
			  if (request.readyState == 4 && request.status == 200) {
				  	
				 	// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
					localStorage.setItem("autosave","");
					localStorage['caseName'] = "demo.ipar";
					
					// Create a worker for unzipping the file
					var zipWorker = new Worker("lib/unzip.js");
					zipWorker.onmessage = function(message) {
						
						// Save the base url to local storage
						var baseURL = JSON.parse(message.data)['case\\active\\caseFile.ipardata'];
						localStorage['caseFiles'] = baseURL.substr(0, baseURL.length-'active/caseFiles.ipardata'.length+1);
						
						// call the callback
						document.location = "board/";
						
					}
					
					// Start the worker
					zipWorker.postMessage(request.response);
			  }
			};
			request.open("GET", "demo.ipar", true);
			request.send();
		}
		
		// When click the load button call the load input
		loadButton.onclick = function() {
			loadInput.click();
		}
		
		// When load input choosen load the file
		loadInput.addEventListener('change', function(event){
			
			// Make sure a ipar file was choosen
			if(!loadInput.value.endsWith("ipar")){
				alert("You didn't choose an ipar file! you can only load ipar files!");
				return;
			}
			console.log(event.target.files[0]);
			localStorage['caseName'] = event.target.files[0].name;
		
			// Set the button to disabled so that it can't be pressed while loading
			loadButton.disabled = true;
			loadInput.disabled = true;
			demoButton.disabled = true;
			
			// Create a reader and read the zip
			var reader = new FileReader();
			reader.onload = function(event){
			
				// since the user is loading a fresh file, clear the autosave (soon we won't use this at all)
				localStorage.setItem("autosave","");
				
				// Create a worker for unzipping the file
				var zipWorker = new Worker("lib/unzip.js");
				zipWorker.onmessage = function(message) {
					
					// Save the base url to local storage
					var baseURL = JSON.parse(message.data)['case\\active\\caseFile.ipardata'];
					localStorage['caseFiles'] = baseURL.substr(0, baseURL.length-'active/caseFiles.ipardata'.length+1);
					
					// Redirect to the next page
					document.location = "case/";
					
				}
				
				// Start the worker
				zipWorker.postMessage(event.target.result);
				
			};
			reader.readAsArrayBuffer(event.target.files[0]);
			
		}, false);
	}

});
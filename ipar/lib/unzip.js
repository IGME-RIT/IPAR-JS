importScripts('jszip.min.js');
importScripts('mimetypes.js');

onmessage = function(message) {

	// Open the zip file using jszip
	var worker = this;
	JSZip.loadAsync(message.data).then(function(zip){

		// Function and variables used to keep track of async methods
		var data = {};
		var totalCB = 1, curCB = 0;
		var finishedCB = function(){
			if(++curCB>=totalCB){
				worker.postMessage(data);
				worker.close();
			}
		}
		
		// Save the case and save files as text
		totalCB += 2;
		zip.file('caseFile.ipardata').async("string").then(function(caseFile){
			data.caseFile = caseFile;
			finishedCB();
		});
		zip.file('saveFile.ipardata').async("string").then(function(saveFile){
			data.saveFile = saveFile;
			finishedCB();
		});
		
		// Write the submitted files to blobs
		var submitted = zip.folder("submitted");
		data.submitted = {};
		for (var file in submitted.files){
			if (!submitted.files.hasOwnProperty(file) || file.endsWith("/") || !file.startsWith(submitted.root)) continue;
			totalCB++;
			(function(file){
				zip.file(file).async("arraybuffer").then(function(fileData){
					
					var blob = new Blob([fileData], {type: getMimeType(file)});
					var fileReader = new FileReader();
					fileReader.onload = function (event) {
		                data.submitted[file.substring(file.lastIndexOf("/")+1)] =  event.target.result;
		    			finishedCB();
		            };
		            fileReader.readAsDataURL(blob);
					
				});
			})(file);
		}
		
		finishedCB();
		
	});
	
}
importScripts('jszip.min.js');

self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;

onmessage = function(message) {
	
	// Measure the size of the zip for knowing how much local space is needed
	curCase = new JSZip(message.data);
	var size = 0;
	for (var file in curCase.files) {
		if (!curCase.files.hasOwnProperty(file)) continue;
		size += curCase.file(file).asArrayBuffer().byteLength;
	}
  
	// Create the filesystem for storing the unzipped files
	if(navigator.webkitPersistentStorage){
		navigator.webkitPersistentStorage.requestQuota(size, function(grantedBytes) {
		  postMessage(loadFileSystem(PERSISTENT, grantedBytes, curCase));
		}, function(e){
			console.log("Error: "+e.message);
		});
	}
	else{
		postMessage(loadFileSystem(TEMPORARY, size, curCase));
	}
	
	// Close the worker because there should be no more messages
	close();
}

function loadFileSystem(type, size, curCase){
	// Load the file system
	var fileSystem = self.requestFileSystemSync(type, size);
	
	// Write the files
	var urls = {};
	for (var file in curCase.files) {
		if (!curCase.files.hasOwnProperty(file)) continue;
		urls[file] = addFileToSystem(file, curCase.file(file).asArrayBuffer(), fileSystem);
	}
	
	// return the urls to the files
	return JSON.stringify(urls);
}

function addFileToSystem(filename, data, fileSystem){
	
	// Make sure the dir exists first
	var dirs = filename.substr(0, filename.lastIndexOf('\\')).split('\\');
	var curDir = fileSystem.root;
	for(var i=0;i<dirs.length;i++)
		curDir = curDir.getDirectory(dirs[i], {create: true, exclusive: false});
	
	// Create the file
	var file = curDir.getFile(filename.substr(filename.lastIndexOf('\\')+1), {create: true});
	file.createWriter().write(new Blob([data], {type: getMimeType(filename)}));
	
	// Return the url to the file
	return file.toURL();
	
}

function getMimeType(file){
	switch(file.substr(file.lastIndexOf('.')+1)){
		case 'png':
			return 'image/png';
		case 'jpeg':
		case 'jpg':
			return 'image/jpeg';
		case 'pdf':
			return 'application/pdf';
		case 'docx':
		case 'doc':
			return 'application/msword';
		case 'rtf':
			return 'text/richtext';
		case 'ipardata':
			return 'text/xml';
		default:
			return 'text/plain';
	}
}
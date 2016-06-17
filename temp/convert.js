document.addEventListener("DOMContentLoaded", function(event) {
	
	function getXml(xml){
		
		// Clean up the xml
		xml = xml.trim();
		while(xml.charCodeAt(0)<=32)
			xml = xml.substr(1);
		xml = xml.trim();
		
		var xmlDoc;
		if (window.DOMParser){
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(xml, "text/xml");
		}
		else{ // IE
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(xml);
		}
		return xmlDoc;
	}
	
	var fileInput = document.getElementById("fileInput");
	var buttons = document.getElementsByClassName("menuButton");
	
	buttons[2].onclick = fileInput.click.bind(fileInput);
	fileInput.onchange = function(){
		console.log("CHANGED");
		// Check for an ipar file
		if(fileInput.files.length!=1 || !fileInput.files[0].name.match(/.*\.ipar$/)){
			alert("You must select an IPAR file to convert!");
			return;
		}
		
		// Check if they want to confirm
		if(!confirm("Are you sure you want to convert this case file? You will lose all save data current inside it!"))
			return;
		
		// Disable all buttons while converting
		for(var i=0;i<buttons.length;i++)
			buttons[i].disabled = true;
		
		// Read the ipar file
		var reader = new FileReader();
		reader.onload = function(){
			console.log("READ");
			// Unzip the ipar file
			JSZip.loadAsync(reader.result).then(function(zip){
				console.log("UNZIPPED");
				
				// Function and variables used to keep track of async methods
				var data = {};
				var totalCB = 1, curCB = 0;
				var finishedCB = function(){
					if(++curCB>=totalCB){
						
						console.log(data);
						
						// Update the case with the links and clear the save file
						var curCase = data.caseFile.getElementsByTagName('case')[0];
						if(Number(curCase.getAttribute('version'))>=1){
							alert("Can only convert case's from before version 1!");
							return;
						}
						curCase.setAttribute('version', '1.0');
						var resources = curCase.getElementsByTagName('resourceList')[0].getElementsByTagName('resource');
						for(var i=0;i<resources.length;i++)
							if(Number(resources[i].getAttribute("type"))==0)
								resources[i].setAttribute('link', data.resourceLinks[resources[i].getAttribute('link')]);
						var questions = curCase.getElementsByTagName('button');
						for(var i=0;i<questions.length;i++){console.log(data.imageLinks[questions[i].getAttribute('imageLink').replace(/\//g, "\\")]+":"+questions[i].getAttribute('imageLink').replace(/\//g, "\\"));
							questions[i].setAttribute('imageLink', data.imageLinks[questions[i].getAttribute('imageLink').replace(/\//g, "\\")]);}
						data.saveFile.getElementsByTagName('questions')[0].innerHTML = '';
						data.saveFile.getElementsByTagName('case')[0].setAttribute('caseStatus', 0);
						
						// Create the zip file and download it
						var zip = new JSZip();
						zip.file("caseFile.ipardata", new XMLSerializer().serializeToString(data.caseFile));
						zip.file("saveFile.ipardata", new XMLSerializer().serializeToString(data.saveFile));
						zip.folder("submitted");
						zip.generateAsync({type:"base64"}).then(function (base64) {
							var a = document.createElement("a");
							a.style.display = 'none';
							a.href = "data:application/zip;base64," + base64;
							a.download = fileInput.files[0].name;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							fileInput.value ="";
						});
						
					}
				}
				

				// Get the case file
				totalCB++;
				zip.file('case\\active\\caseFile.ipardata').async("string").then(function(caseFile){
					data.caseFile = getXml(caseFile);
					finishedCB();
				});
				  
				// Get the save file
				totalCB++;
				zip.file('case\\active\\saveFile.ipardata').async("string").then(function(saveFile){
					data.saveFile = getXml(saveFile);
					finishedCB();
				});
					  
				// Upload and save all the images
				var images = zip.folder("case\\assets\\images");
				data.imageLinks = {};
				for (var file in images.files){
					if (!images.files.hasOwnProperty(file) || file.endsWith("/") || file.substr(0, file.lastIndexOf("\\"))!=images.root.substr(0, images.root.length-1)) continue;
					totalCB++;
					(function(file){
						zip.file(file).async("arraybuffer").then(function(fileData){
							
							var imageData = new FormData();
							imageData.append('image', new Blob([fileData], {type: getMimeType(file)}), file.substring(file.lastIndexOf("\\")+1));
							var request = new XMLHttpRequest();
							request.onreadystatechange = function() {
								if (request.readyState == 4 && request.status == 200) {
									data.imageLinks[file.substring(file.indexOf("\\")+1)] = window.location.href.substr(0, window.location.href.lastIndexOf("/"))+"/image/"+request.responseText;
					    			finishedCB();
								}
							};
							request.open("POST", "image", true);
							request.send(imageData);
							
							});
					})(file);
				}
			  
				// Upload and save all the resources
				var resources = zip.folder("case\\assets\\files");
				data.resourceLinks = {};
				for (var file in resources.files){
					if (!resources.files.hasOwnProperty(file) || file.endsWith("/") || file.substr(0, file.lastIndexOf("\\"))!=resources.root.substr(0, resources.root.length-1)) continue;
					totalCB++;
					(function(file){
						zip.file(file).async("arraybuffer").then(function(fileData){
							
							var resourceData = new FormData();
							resourceData.append('resource', new Blob([fileData], {type: getMimeType(file)}), file.substring(file.lastIndexOf("/")+1));
							var request = new XMLHttpRequest();
							request.onreadystatechange = function() {
								if (request.readyState == 4 && request.status == 200) {
									data.resourceLinks[file.substring(file.lastIndexOf("\\")+1)] = window.location.href.substr(0, window.location.href.lastIndexOf("/"))+"/resource/"+request.responseText;
					    			finishedCB();
								}
							};
							request.open("POST", "resource", true);
							request.send(resourceData);
							
							});
					})(file);
				}
				
				finishedCB();
				  
			});		
		};
		reader.readAsArrayBuffer(fileInput.files[0]);
	}
	
});
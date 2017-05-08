"use strict";
var Windows = require('../html/popupWindows.js');
var Utilities = require('../helper/utilities.js');


// Creates a category with the given name and from the given xml
function Resource(xml){
	
	// First get the icon
	this.xml = xml;
	var type = parseInt(xml.getAttribute("type"));
	this.type = type;
	switch(type){
	  case 0:
	    this.icon = '../img/iconResourceFile.png';
	    break;
	  case 1:
	    this.icon = '../img/iconResourceLink.png';
	    break;
	  case 2:
    	this.icon = '../img/iconResourceVideo.png';
	    break;
	  default:
	    this.icon = '';
	    break;
	}

	// Next get the title
	this.title = xml.getAttribute("text");

	// Last get the link
	this.link = xml.getAttribute("link");
    
}

function Resources(resourceElements, doc){
	for (var i=0; i<resourceElements.length; i++) {
		// Load each resource
		this[i] = new Resource(resourceElements[i]);
	}
	this.length = resourceElements.length;
	this.doc = doc;
}

var p = Resources.prototype;

p.openWindow = function(windowDiv, select, callback){
	
	// Create the resource window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourcesWindow;
    this.resource = tempDiv.firstChild;
	this.resourceDiv = this.resource.getElementsByClassName("resourceContent")[0];
	this.updateResources();
	
	// Store the buttons
	this.buttons = this.resource.getElementsByTagName("button");
	
	// Setup the buttons
	var resources = this;
    this.buttons[0].onclick = function(){
    	windowDiv.innerHTML = '';
    	resources.windowDiv = null;
    	callback();
    }
	this.buttons[1].onclick = function(){
		resources.edit(null, function(){
			resources.updateResources();
			if(resources.windowDiv)
				resources.openWindow(resources.windowDiv, resources.select, resources.onclose);
		});
	}
    this.onclose = callback;
    this.windowDiv = windowDiv;
    this.select = select;
	
	var icons = this.resource.getElementsByClassName("icon");
	for(var i=0;i<icons.length;i++){
		if(this.select)
			icons[i].className = "iconSelect icon";
		else
			icons[i].className = "icon";
	}
    
	windowDiv.innerHTML = '';
	windowDiv.appendChild(this.resource);
	
}

p.updateResources = function(){
	
	if(this.length==0){
		this.resourceDiv.color = "grey";
		this.resourceDiv.className = "resourceContent center";
		this.resourceDiv.innerHTML = "No Resources Loaded";
	}else{
		var resources = this;
		this.resourceDiv.color = "";
		this.resourceDiv.className = "resourceContent";
		this.resourceDiv.innerHTML = '';
	    for(var i=0;i<this.length;i++){
	    	
	    	// Create the current resource element
    		var curResource = Windows.resource.replace("%icon%", this[i].icon);
	    	curResource = curResource.replace("%title%", this[i].title);
	    	curResource = curResource.replace("%link%", this[i].link);
	    	var tempDiv = document.createElement("DIV");
	    	tempDiv.innerHTML = curResource;
	        curResource = tempDiv.firstChild;
	    	this.resourceDiv.appendChild(curResource);
	    	
	    	// Setup delete and edit buttons
	    	(function(index){
	    		curResource.getElementsByClassName("delete")[0].onclick = function(){
	    			for(var i=index;i<resources.length-1;i++)
	    				resources[i] = resources[i+1];
	    			delete resources[--resources.length];
	    			resources.updateResources();
	    		}
	    		curResource.getElementsByClassName("edit")[0].onclick = function(){
	    			resources.edit(index, function(){
	    				resources.updateResources();
	    				if(resources.windowDiv)
	    					resources.openWindow(resources.windowDiv, resources.select, resources.onclose);
	    			});
	    		}
	    		
	    	    // If select setup the resources as buttons
	    		curResource.getElementsByClassName("icon")[0].onclick = function(){
		    	    if(resources.windowDiv && resources.select){
		    	    	resources.windowDiv.innerHTML = '';
		    	    	resources.windowDiv = null;
		    	    	resources.onclose(index);
		    	    	
		    	    }
	    		}
	    		
	    	})(i);
	    }
	}
	
}

p.edit = function(index, callback){
	
	// Create the popup window 
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.resourceEditor;
    var editInfo = tempDiv.firstChild;
    var form = editInfo.getElementsByTagName("form")[0];

	var resources = this;
    var type = editInfo.getElementsByTagName("select")[0];
	var buttons = editInfo.getElementsByTagName("button");
    
    
	if(index==null){
		editInfo.innerHTML = editInfo.innerHTML.replace(/%edit%/g, "Create").replace(/%apply%/g, "Create Resource").replace(/%name%/g, '').replace(/%link%/g, '');
	}
	else{
		editInfo.innerHTML = editInfo.innerHTML.replace(/%edit%/g, "Edit").replace(/%apply%/g, "Apply Changes").replace(/%name%/g, this[index].title).replace(/%link%/g, this[index].link);
		type.value = this[index].type;
		this.newLink = this[index].link;
	}
	
	// Setup combo box
	this.updateEditInfo(type, buttons, editInfo.getElementsByClassName("addressTag")[0], editInfo.getElementsByClassName("addressInfo")[0], editInfo.getElementsByClassName("address")[0], editInfo.getElementsByClassName("preResources")[0], index);
	editInfo.getElementsByTagName("select")[0].onchange = function(){
		resources.updateEditInfo(resources.windowDiv.getElementsByTagName("select")[0], resources.windowDiv.getElementsByTagName("button"), resources.windowDiv.getElementsByClassName("addressTag")[0], resources.windowDiv.getElementsByClassName("addressInfo")[0], resources.windowDiv.getElementsByClassName("address")[0], resources.windowDiv.getElementsByClassName("preResources")[0], index);
	};
	
	// Setup cancel button
	buttons[2].onclick = function(){
		resources.windowDiv.innerHTML = '';
    	callback();
	}
	
	// Setup confirm button
	buttons[3].onclick = function(){
		var form = editInfo.getElementsByTagName("form")[0];
		if(this.validateResourceInput(form, resources)) {
			if(index==null)
				index = resources.length++;
			var newResource = resources.doc.createElement("resource");
			if(form.elements["type"].value=="3")
				newResource.setAttribute("type", 0);
			else
				newResource.setAttribute("type", form.elements["type"].value);
			newResource.setAttribute("text", encodeURI(form.elements["name"].value));
			if(resources.newLink==null){
				var newLink = form.elements["link"].value;
				if(!newLink.match(/^https?:\/\/.*/))
					newLink = "http://"+newLink;
				newResource.setAttribute("link", newLink);
			}
			else
				newResource.setAttribute("link", resources.newLink);
			resources[index] = new Resource(newResource);
			resources.windowDiv.innerHTML = '';
			callback();
		}
	}.bind(this)
	

	// Display the edit window
	this.windowDiv.innerHTML = '';
	this.windowDiv.appendChild(editInfo);
}

p.validateResourceInput = function(form, resources) {
	var logInvalid = function(reason) {
		alert("Invalid input: " + reason);
		// TODO: use proper field validation instead of alerts
	}
	
	// check that a name exists
	if(!form.elements["name"].value || form.elements["name"].value == "") {
		logInvalid("Missing name value");
		return false;
	}

	// check that a link was provided for linked resources
	// TODO: validate that text is a link
	if(!form.elements["link"].value || form.elements["link"].value == "") {
		logInvalid("Missing link!");
		return false;
	}

	// check that a resource was provided for file resources
	if((form.elements["type"].value == 3 || form.elements["type"].value == 0) && !(resources.newLink && resources.newLink != "")) {
		logInvalid("No resource provided!");
		return false;
	}

	return true
}

p.updateEditInfo = function(type, buttons, addressTag, addressInfo, address, preResources, index){

	if(!this.newLink)
		this.newLink = "";
	var resources = this;
	
	if(Number(type.value)==0){
		addressTag.innerHTML = "Refrence File";
		address.value = "";
		address.type = "file";
		address.style.display = "none";
		preResources.innerHTML = '';
		addressInfo.style.display = "";
		addressInfo.innerHTML = this.newLink;
		buttons[0].style.display = "";
		buttons[1].style.display = "";
		resources.loading = false;
		
		// Setup View button
		buttons[1].onclick = function(){
			if(resources.newLink && resources.newLink!="")
				window.open(resources.newLink,'_blank');
		};
		
		// Setup input button
		buttons[0].onclick = address.click.bind(address);
		address.onchange = function(){
			if(!resources.loading){
				if(address.files.length>0){
					if(address.files[0].type.match(/^application\/pdf.*/) && address.files[0].name.match(/.*\.pdf$/i)){
						resources.loading = true;
						var resourceData = new FormData();
						resourceData.append('resource', address.files[0], address.files[0].name);
						var request = new XMLHttpRequest();
						request.onreadystatechange = function() {
							if (request.readyState == 4 && request.status == 200) {
								resources.loading = false;
								if(request.responseText.match(/^!.*/i))
									addressInfo.innerHTML = request.responseText.substr(1);
								else{
									resources.newLink = window.location.href.substr(0, window.location.href.substr(0, window.location.href.length-1).lastIndexOf("/"))+"/resource/"+request.responseText;
									addressInfo.innerHTML = 'Uploaded!';
								}
							}
						};
						request.open("POST", "./resource.php", true);
						request.send(resourceData);
						addressInfo.innerHTML = "Uploading...";
					}
					else
						alert('You can only upload pdfs as resources!');
				}
				else{
					resources.newLink = "";
					addressInfo.innerHTML = resources.newLink;
				}
			}
		}
	}
	else{
		if(Number(type.value)==3){
			addressTag.innerHTML = "Refrence File";
			address.style.display = "none";
			preResources.innerHTML = '';
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					preResources.innerText = request.responseText;
			        var images = preResources.getElementsByTagName("img");
			        var links = preResources.getElementsByTagName("a");
					for(var i=0;i<images.length;i+=2){
				        (function(i){
				        	images[i].onclick = function(){
								window.open(images[i].getAttribute("file"),'_blank');
				        	}
				        	images[i+1].onclick = function(){
				        		if(confirm("Are you sure you want to remove this resource from uploaded resources? This can not be undone and any cases that currently use this resource will now have dead links!")){
				        			var toRemove = preResources.getElementsByClassName("image")[i/2];
				        			toRemove.parentNode.removeChild(toRemove);
				        		}
				        	}
				        	links[i/2].onclick = function(){
				        		for(var j=0;j<links.length;j++)
				        			links[j].className = 'unactiveLink';
				        		links[i/2].className = 'activeLink';
								resources.newLink = images[i].getAttribute("file");
				        	}
				        })(i);
			        }
				}
			};
			request.open("POST", "./preResource.php", true);
			request.send();
		}
		else{
			addressTag.innerHTML = "Link Address";
			preResources.innerHTML = '';
			address.value = "";
			address.type = "text";
			address.style.display = "";
			address.value = this.newLink;
			this.newLink = null;
		}
		address.onchange = function(){};
		addressInfo.style.display = "none";
		buttons[0].style.display = "none";
		buttons[1].style.display = "none";
		buttons[0].onclick = function(){};
		buttons[1].onclick = function(){};
	}
}

p.xml = function(xmlDoc){
	var xml = xmlDoc.createElement("resourceList");
	xml.setAttribute("resourceCount", this.length);
	for(var i=0;i<this.length;i++)
		xml.appendChild(this[i].xml);
	return xml;
}

module.exports = Resources;

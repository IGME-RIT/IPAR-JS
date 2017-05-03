"use strict";
var Point = require('./point.js');

//Module export
var m = module.exports;

// returns mouse position in local coordinate system of element
m.getMouse = function(e){
    return new Point((e.pageX - e.target.offsetLeft), (e.pageY - e.target.offsetTop));
}

//returns a value relative to the ratio it has with a specific range "mapped" to a different range
m.map = function(value, min1, max1, min2, max2){
    return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
}

//if a value is higher or lower than the min and max, it is "clamped" to that outer limit
m.clamp = function(value, min, max){
    return Math.max(min, Math.min(max, value));
}

//determines whether the mouse is intersecting the active element
m.mouseIntersect = function(pMouseState, pElement, pOffsetter){
    if(pMouseState.virtualPosition.x > pElement.position.x - pElement.width/2 - pOffsetter.x && pMouseState.virtualPosition.x < pElement.position.x + pElement.width/2 - pOffsetter.x){
        if(pMouseState.virtualPosition.y > pElement.position.y - pElement.height/2 - pOffsetter.y && pMouseState.virtualPosition.y < pElement.position.y + pElement.height/2 - pOffsetter.y){
            //pElement.mouseOver = true;
            return true;
            pMouseState.hasTarget = true;
        }
        else{
            //pElement.mouseOver = false;
            return false;
        }
    }
    else{
    	return false;
        //pElement.mouseOver = false;
    }
}

// gets the xml object of a string
m.getXml = function(xml){
	
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

// gets the scale of the first parameter to the second (with the second fitting inside the first)
m.getScale = function(virtual, actual){
	return actual.y/virtual.x*virtual.y < actual.x ? actual.y/virtual.y : actual.x/virtual.x;
}

m.replaceAll = function (str, target, replacement) {
	while (str.indexOf(target) > -1) {
		str = str.replace(target,replacement);
	}
	return str;
}

// Gets the files from the given case and the save and case data and then stores it to the local storage
m.loadCaseData = function(zipName, zipBuffer, callback){

	localforage.setItem('caseName', zipName, function(){
		JSZip.loadAsync(zipBuffer).then(function(zip){
			
			// Function and variables used to keep track of async methods
			var submitted = {};
			var totalCB = 1, curCB = 0;
			var finishedCB = function(){
				if(++curCB>=totalCB){
					localforage.setItem('submitted', submitted, callback);
				}
			};
			
			// Save the case and save files as text
			totalCB += 2;
			zip.file('caseFile.ipardata').async("string").then(function(caseFile){
				localforage.setItem('caseFile', caseFile, finishedCB);
			});
			zip.file('saveFile.ipardata').async("string").then(function(saveFile){
				localforage.setItem('saveFile', saveFile, finishedCB);
			});
			
			// Write the submitted files to blobs
			zip.folder("submitted").forEach(function (relativePath, file){
			    totalCB++;
				file.async("arraybuffer").then(function(buffer){
					
					var blob = new Blob([buffer], {type: getMimeType(relativePath)});
	                submitted[relativePath] =  blob;
	    			finishedCB();
		            
			    });
			});
			
			finishedCB();
			
		});
	});
	
}

Element.prototype.innerXML = function(newText){
	if(newText==null){
		if(this.innerHTML)
			return this.innerHTML;
		var innerHTML = '';
		var XMLS = new XMLSerializer(); 
		for(var i=0;i<this.childNodes.length;i++)
			innerHTML += XMLS.serializeToString(this.childNodes[i]);
		return innerHTML;
	}
	else{
		if(this.innerHTML)
			this.innerHTML = newText;
		else{
			var newXml = getXml('<wrapper>'+newText+'</wrapper>').getElementsByTagName('wrapper')[0];
			while(this.firstChild)
				this.removeChild(this.firstChild);
			while(newXml.firstChild)
				this.appendChild(newXml.firstChild);
		}
	}
}

//Gets the index of the nth search string (starting at 1, 0 will always return 0)
String.prototype.indexOfAt = function(search, num){
	var curIndex = 0;
	for(var i=0;i<num && curIndex!=-1;i++)
		curIndex = this.indexOf(search, curIndex+1);
	return curIndex;
}
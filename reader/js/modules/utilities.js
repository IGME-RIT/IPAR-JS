"use strict";

//Module export
var m = module.exports;

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

m.getString = function(xml){
	if (window.ActiveXObject) {
		return xml.xml;
	} 
	// code for Chrome, Safari, Firefox, Opera, etc.
	else {
		return (new XMLSerializer()).serializeToString(xml);
	}
}

m.replaceAll = function (str, target, replacement) {
	while (str.indexOf(target) > -1) {
		str = str.replace(target,replacement);
	}
	return str;
}

// Gets the index of the nth search string (starting at 1, 0 will always return 0)
String.prototype.indexOfAt = function(search, num){
	var curIndex = 0;
	for(var i=0;i<num && curIndex!=-1;i++)
		curIndex = this.indexOf(search, curIndex+1);
	return curIndex;
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

var Utilities = require('./utilities.js');
var HtmlElements = require('./htmlElements.js');

var submissionCol, categoryCol, categoryContent;
var curCat, curSub;
var catData;
var lastCatBut, lastSubBut;
var multiChoice;

function Reader(section, startData){
	
	// Get the parts of the reader
	var butCols = section.getElementsByClassName("buttonCol");
	submissionCol = butCols[0].getElementsByTagName("div")[0];
	categoryCol = butCols[1].getElementsByTagName("div")[0];
	categoryContent = section.getElementsByClassName("categoryContent")[0].getElementsByTagName("div")[0];
	curSub = startData;
	curCat = 0;
	
	// Setup add submission button
	var reader = this;
	var addSubButton = document.createElement("button");
	var addSubFile = document.querySelector("#"+section.id+" #file-submission");
	addSubButton.onclick = addSubFile.click.bind(addSubFile);
	addSubButton.className = "readerButton";
	addSubButton.innerHTML = "Add Submission";
	butCols[0].appendChild(addSubButton);
	addSubFile.onchange = function(){
		
		// Make sure a iparsubmit file was choosen
		if(!addSubFile.value.endsWith("iparwsubmit")){
			if(addSubFile.value.endsWith("iparsubmit")){
				if(!confirm("That is an old version of a case submit file! You can still load it but all the submitted files won't have names! Is that okay?"))
					return;
			}
			else{
				alert("You didn't choose an iparwsubmit file! you can only load iparwsubmit files!");
				return;
			}
		}
		addSubButton.disabled = true;

		// Get and add the submitted save and files
		var fileReader = new FileReader();
		fileReader.onload = function(event){

			JSZip.loadAsync(event.target.result).then(function(zip){

				// Save the case and save files as text
				zip.file('caseFile.ipardata').async("string").then(function(caseFile){
					if(!startData.caseFile.isEqualNode(Utilities.getXml(caseFile))){
						alert("That submission doesn't match the case of the previously loaded ones!");
						addSubButton.disabled = false;
					}
					else
						zip.file('saveFile.ipardata').async("string").then(function(saveFile){

							var data = {};
							data.saveFile = Utilities.getXml(saveFile);
							data.submissions = zip.filter(function (relativePath, file){
																return relativePath.match(/^submitted[\\\/].*/i) && !relativePath.endsWith('\\') && !relativePath.endsWith('/');
							});
							reader.addSub(data);

							addSubButton.disabled = false;
						});
				});
				
				
			});
		};
		fileReader.readAsArrayBuffer(addSubFile.files[0]);
	};
	
	// Create the category buttons
	var caseData = startData.caseFile;
	var cats = caseData.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
	var reader = this;
	for(var i=0;i<cats.length;i++){
		(function(i){
			var button = document.createElement("button");
			button.innerHTML = cats[i].innerHTML;
			button.onclick = function(){
		    	curCat = i;
		    	reader.update();
		    	lastCatBut.disabled = false;
		    	lastCatBut = this;
		    	lastCatBut.disabled = true;
			};
			button.className = "readerButton";
			categoryCol.appendChild(button);
			if(i==0){
				lastCatBut = button;
				lastCatBut.disabled = true;
			}
		})(i);
	}
	
	// Setup the multi choice button
	multiChoice = true;
	document.querySelector("#"+section.id+" #multiple-choice").onclick = function(){
		if((multiChoice = !multiChoice))
			this.src = "../img/iconToolboxBlue.png";
		else
			this.src = "../img/iconToolboxRed.png";
		reader.update();
	}
	
	// Get all the categories' data
	var cat = caseData.getElementsByTagName("category");
	catData = [];
	for(var i=0;i<cat.length;i++)
		catData[i] = cat[i].getElementsByTagName("button");

	lastSubBut = reader.addSub(startData);
	lastSubBut.disabled = true;
	this.update();
	section.style.display = "";
}

p = Reader.prototype;

p.addSub = function(data){

	// Create the button
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = HtmlElements.button;
    var newSub = tempDiv.firstChild;

    // Setup the text for the button
    var caseNode = data.saveFile.getElementsByTagName("case")[0];
    data.lastName = caseNode.getAttribute("profileLast");
    data.firstName = caseNode.getAttribute("profileFirst");
    newSub.innerHTML = newSub.innerHTML.replace(/%title%/g, data.lastName+", "+data.firstName);
    newSub.innerHTML = newSub.innerHTML.replace(/%text%/g, caseNode.getAttribute("profileMail"));
    
    // Setup the button
    var reader = this;
    newSub.onclick = function(){
    	curSub = data;
    	reader.update();
    	lastSubBut.disabled = false;
    	lastSubBut = this;
    	lastSubBut.disabled = true;
    };
    submissionCol.appendChild(newSub);
    return newSub;
}

p.update = function(){
	
	// Clear the current content
	categoryContent.innerHTML = '';

	// Display the current cat from the current sub
	for(var i=0;i<catData[curCat].length;i++){
		var questionType = Number(catData[curCat][i].getAttribute("questionType"));
		
		if(questionType==5 || (questionType==2 && !multiChoice))
			continue;
		var questionName = catData[curCat][i].getElementsByTagName("questionName")[0].innerHTML;
		var curQuestion = HtmlElements.questionStart.replace(/%title%/g, questionName).
														replace(/%instructions%/g, catData[curCat][i].getElementsByTagName("instructions")[0].innerHTML).
														replace(/%question%/g, catData[curCat][i].getElementsByTagName("questionText")[0].innerHTML);
		if(questionType==3 || questionType==2){
			var answers = catData[curCat][i].getElementsByTagName("answer");
			var correct = Number(catData[curCat][i].getAttribute("correctAnswer"));
			for(var j=0;j<answers.length;j++)
				curQuestion += HtmlElements.answer.replace(/%answer%/g, String.fromCharCode(j + "A".charCodeAt())+". "+answers[j].innerHTML).replace(/%correct%/g, correct==j);
		}
		var questionNum = i;
		for(var j=0;j<curCat;j++)
			questionNum += catData[j].length;
		if(questionType==1 || questionType==3)
			curQuestion += HtmlElements.justification.replace(/%justification%/g, curSub.saveFile.getElementsByTagName("question")[questionNum].getAttribute("justification"));
		if(questionType==4)
			curQuestion += HtmlElements.submissions;
		curQuestion += HtmlElements.questionEnd;
		var tempDiv = document.createElement("DIV");
		tempDiv.innerHTML = curQuestion;
		curQuestion = tempDiv.firstChild;
		
		var subButton = curQuestion.getElementsByTagName("button")[0];
		if(subButton){
			(function(submissions, questionName, questionNum){
				subButton.onclick = function(){
					var zip = new JSZip();
					var fileCount = 0, totalFiles = 0;
					var savedFile = function(){
						if(++fileCount>=totalFiles)
						{
							zip.generateAsync({type:"blob"}).then(function (blob) {
								var url = window.URL.createObjectURL(blob);
								var a = document.createElement("a");
								a.style.display = "none";
								a.href = url;
								var space;
								while((space = questionName.indexOf(' '))!=-1)
									questionName = questionName.substr(0, space)+questionName.substr(space+1, 1).toUpperCase()+questionName.substr(space+2);
						        a.download = curSub.lastName+curSub.firstName.substr(0, 1).toUpperCase()+curSub.firstName.substr(1)+"_"+questionName+".zip";
						        document.body.appendChild(a);
						        a.click();
						        document.body.removeChild(a);
					        	setTimeout(function(){window.URL.revokeObjectURL(url);}, 0);
							});
						}
					}
					for(var i=0;i<submissions.length;i++){
						(function(file){
							var name = file.name.substr('submitted\\'.length);
							if(!name.match(new RegExp('^'+curCat+'-'+questionNum+'.*'))) return;
							if(!name.match(/^[0-9]-[0-9]-[0-9]\..*/))
								name = name.substr('0-0-0-'.length);
							totalFiles++;
							file.async("arraybuffer").then(function(buffer){
						    	zip.file(name, buffer);
						    	savedFile();
						    },
						    function(e){
						    	alert("Error Loading "+name+"! "+e);
						    	savedFile();
						    });
						})(submissions[i]);
					}
				}
			})(curSub.submissions, questionName, i);
		}
		
		categoryContent.appendChild(curQuestion);
	}
	
}

module.exports = Reader;
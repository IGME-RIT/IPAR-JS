"use strict";
var Board = require('./board.js');
var Point = require('../helper/point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('../helper/drawlib.js');
var DataParser = require('../helper/iparDataParser.js');
var MouseState = require('../helper/mouseState.js');
var KeyboardState = require('../helper/keyboardState.js');
var FileManager = require('../helper/fileManager.js');
var Utilities = require('../helper/utilities.js');
var Question = require('../case/question.js');
var Category = require('../case/category.js');
var Popup = require('../menus/popup.js');
var PopupWindows = require('../html/popupWindows.js');

//mouse & keyboard management
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

// HTML elements
var zoomSlider;
var windowDiv;
var windowFilm;

// Used for pinch zoom
var pinchStart;

// Used for waiting a second to close windows
var pausedTime = 0;

//phase handling
var phaseObject;

function game(section, baseScale){
	var game = this;
	this.active = false;
	this.section = section;
	this.saveFiles = [];
	
	// Get and setup the window elements
	windowDiv = document.getElementById('window');
	windowFilm = document.getElementById('windowFlim');
	
	// Get and setup the zoom slider
	zoomSlider = document.querySelector('#'+section.id+' #zoom-slider');
	zoomSlider.oninput = function(){
		game.setZoom(-parseFloat(zoomSlider.value));
	};
	document.querySelector('#'+section.id+' #zoom-in').onclick = function() {
    	zoomSlider.stepDown();
		game.setZoom(-parseFloat(zoomSlider.value));
    };
    document.querySelector('#'+section.id+' #zoom-out').onclick = function() { 
		zoomSlider.stepUp(); 
		game.setZoom(-parseFloat(zoomSlider.value));
	};
	
	// Get and setup the board context menu
	var boardContext = document.querySelector('#'+section.id+' #board-context');
	document.querySelector('#'+section.id+' #board-context #add-question').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		game.addQuestion((boardContext.virtualPosition.x+Constants.boardSize.x/2)/Constants.boardSize.x*100,
				(boardContext.virtualPosition.y+Constants.boardSize.y/2)/Constants.boardSize.y*100);
		boardContext.style.display = '';
	};


	document.querySelector('#'+section.id+' #board-context #add-category').onclick = function(e){
		Popup.prompt(windowDiv, "Create Category", "Category Name:", "", "Create", function(newName){
    		if(newName)
    			game.addCategory(newName);
    	});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #rename-category').onclick = function(e){
		Popup.prompt(windowDiv, "Rename Category", "Category Name:", game.categories[game.activeBoardIndex].name, "Rename", function(newName){
    		if(newName){
    			game.categories[game.activeBoardIndex].name = newName;
    			game.boardArray[game.activeBoardIndex].button.innerHTML = newName;
    			localforage.getItem('caseFile').then(function(caseFile){
    				caseFile = Utilities.getXml(caseFile);
        			caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element")[game.activeBoardIndex].innerXML(newName);
        			localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile));
    			});
    		}
    	});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #delete-category').onclick = function(e){
		if(game.boardArray.length>1 && confirm("Are you sure you want to delete the current category You can't undo this action!"))
			game.deleteCategory();
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #forward-category').onclick = function(e){
		if(game.activeBoardIndex+1<game.categories.length)
			game.moveCategory(1);
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #backward-category').onclick = function(e){
		if(game.activeBoardIndex-1>=0)
			game.moveCategory(-1);
		boardContext.style.display = '';
	};
	
	
	document.querySelector('#'+section.id+' #board-context #edit-info').onclick = function(e){
		localforage.getItem('caseFile').then(function(caseFile){
			Popup.editInfo(windowDiv, Utilities.getXml(caseFile), function(newCaseFile, name){
		    	localforage.setItem('caseName', name+".iparw");
		    	localforage.setItem('caseFile', new XMLSerializer().serializeToString(newCaseFile));
			});
		});
		boardContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #board-context #edit-resources').onclick = function(e){
		game.resources.openWindow(windowDiv, false, function(){
			game.save();
		});
		boardContext.style.display = '';
	};
	

	// Get and setup the node context menu
	var nodeContext = document.querySelector('#'+this.section.id+' #node-context');
	document.querySelector('#'+section.id+' #node-context #add-connection').onclick = function(e){
		game.boardArray[game.activeBoardIndex].addConnection(game.boardArray[game.activeBoardIndex].contextNode);
		game.save();
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #hide-connection').onclick = function(e){
		if(game.boardArray[game.activeBoardIndex].contextNode.question.connections.length>0){
			game.boardArray[game.activeBoardIndex].hideConnection(game.boardArray[game.activeBoardIndex].contextNode);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #remove-connection').onclick = function(e){
		if(game.boardArray[game.activeBoardIndex].contextNode.question.connections.length>0){
			game.boardArray[game.activeBoardIndex].removeConnection(game.boardArray[game.activeBoardIndex].contextNode);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #delete-question').onclick = function(e){
		if(confirm("Are you sure want to delete this question? You can't undo this action!")){
			var board = game.boardArray[game.activeBoardIndex],
				cat = game.categories[game.activeBoardIndex];
			for(var i=0;i<cat.questions.length;i++){
				if(cat.questions[i].num>board.contextNode.question.num)
					cat.questions[i].num--;
				var con = cat.questions[i].connections.indexOf(board.contextNode.question.num+1);
				while(con!=-1){
					cat.questions[i].connections.splice(con, 1);
					con = cat.questions[i].connections.indexOf(board.contextNode.question.num+1);
				}
				for(var j=0;j<cat.questions[i].connections.length;j++)
					if(cat.questions[i].connections[j]-1>board.contextNode.question.num)
						cat.questions[i].connections[j]--;
			}
			board.lessonNodeArray.splice(board.contextNode.question.num, 1);
			cat.questions.splice(board.contextNode.question.num, 1);
			game.save();
		}
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #make-larger').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		if(board.lessonNodeArray[board.contextNode.question.num].question.scale<Constants.maxNodeScale){
			board.lessonNodeArray[board.contextNode.question.num].question.scale += Constants.nodeStep;
			board.lessonNodeArray[board.contextNode.question.num].updateImage();
		}
		game.save();
		nodeContext.style.display = '';
	};
	document.querySelector('#'+section.id+' #node-context #make-smaller').onclick = function(e){
		var board = game.boardArray[game.activeBoardIndex];
		if(board.lessonNodeArray[board.contextNode.question.num].question.scale>Constants.minNodeScale){
			board.lessonNodeArray[board.contextNode.question.num].question.scale -= Constants.nodeStep;
			board.lessonNodeArray[board.contextNode.question.num].updateImage();
		}
		game.save();
		nodeContext.style.display = '';
	};
	
	
	
	// Save the given scale
	this.scale = baseScale;

	// on loading the case file
	var onload = function(categories, resources, images, startCat){
		
		// Create the boards
		this.resources = resources;
		this.categories = categories;
		this.nodeContext = nodeContext;
		this.boardContext = boardContext;
		this.createLessonNodes();
		
		// Display the current board
		this.activeBoardIndex = startCat;
		this.active = true;
		this.boardArray[this.activeBoardIndex].show();
		zoomSlider.value = -this.getZoom();
		
		// Setup the save button
		FileManager.prepareZip(document.querySelector('#'+section.id+' #blob'));
		
		// Create the images window 
		var tempDiv = document.createElement("DIV");
		tempDiv.innerHTML = PopupWindows.imagesEditor;
	    this.imagesWindow = tempDiv.firstChild;
	    
	    // Fill it with the current images
	    var content = this.imagesWindow.getElementsByClassName("imageContent")[0];
	    for(var i=0;i<images.length;i++)
	    	content.innerHTML += PopupWindows.image.replace(/%image%/g, images[i]);

	    // Setup the uploaded images button
	    this.imagesWindow.getElementsByTagName("button")[3].onclick = function(){
	    	var question = game.boardArray[game.activeBoardIndex].target.question;
	        var icon = question.typeWindow.getElementsByClassName("imageButton")[0].getElementsByTagName("img")[0];
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					
					// Create the images window 
					var tempDiv = document.createElement("DIV");
					tempDiv.innerHTML = request.responseText;
				    var uploadedWindow = tempDiv.firstChild;
				    
				    question.windowDiv.innerHTML = '';
			    	question.windowDiv.appendChild(uploadedWindow);
			        var buttons = uploadedWindow.getElementsByTagName("button");
			        var images = uploadedWindow.getElementsByTagName("img");
			        buttons[0].onclick = question.displayWindows.bind(question);
			        for(var i=0;i<images.length;i+=2){
				        (function(i){
				        	images[i].onclick = function(){
				        		question.imageLink = images[i].src;
				    			question.xml.setAttribute("imageLink", images[i].src);
				    			icon.src = images[i].src;
				    			question.displayWindows();
				        	}
				        	images[i+1].onclick = function(){
				        		if(confirm("Are you sure you want to remove this image from uploaded images? This can not be undone and any cases that currently use this image will use a default image instead!")){
				        			var toRemove = uploadedWindow.getElementsByClassName("image")[i/2];
				        			toRemove.parentNode.removeChild(toRemove);
				            		close();
				            		button.click();
				        		}
				        	}
				        })(i);
			        }
			        
				}
			};
			request.open("POST", "./preImage.php", true);
			request.send();
	    };
	    
	    
		// Add it to all the questions
		for(var i=0;i<this.categories.length;i++)
			for(var j=0;j<this.categories[i].questions.length;j++)
				this.categories[i].questions[j].imagesWindow = this.imagesWindow;
		
	};
	
	// Load the case file
	FileManager.loadCase(document.querySelector('#'+section.id+' #window'), onload.bind(this));
	
}

var p = game.prototype;

p.addCategory = function(name){
	
	var game = this;
	localforage.getItem('caseFile').then(function(caseFile){
		caseFile = Utilities.getXml(caseFile);
		var cat = caseFile.createElement("category");
		cat.setAttribute("categoryDesignation", game.categories.length);
		cat.setAttribute("questionCount", 0);
		caseFile.getElementsByTagName("case")[0].appendChild(cat);
		game.categories.push(new Category(name, cat, game.resources, windowDiv));
		game.createBoard(game.categories[game.categories.length-1], game.categories.length-1);
		
		caseFile.getElementsByTagName("case")[0].appendChild(cat);
		var list = caseFile.getElementsByTagName("categoryList")[0];
		list.setAttribute("categoryCount", game.categories.length);
		var newElement = caseFile.createElement("element");
		newElement.innerHTML = name;
		list.appendChild(newElement);
		localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile));
	});
	
}

p.moveCategory = function(dir){
	
	// Flip the categories first
	var temp = this.categories[this.activeBoardIndex];
	this.categories[this.activeBoardIndex] = this.categories[dir+this.activeBoardIndex];
	this.categories[this.activeBoardIndex+dir] = temp;
	
	// Next flip the button names
	this.boardArray[this.activeBoardIndex].button.innerHTML = this.categories[this.activeBoardIndex].name;
	this.boardArray[this.activeBoardIndex+dir].button.innerHTML = this.categories[this.activeBoardIndex+dir].name;
	
	// Then flip the buttons
	temp = this.boardArray[this.activeBoardIndex+dir].button;
	this.boardArray[this.activeBoardIndex+dir].button = this.boardArray[this.activeBoardIndex].button;
	this.boardArray[this.activeBoardIndex].button = temp;
	
	// Then, flip the boards
	temp = this.boardArray[this.activeBoardIndex+dir];
	this.boardArray[this.activeBoardIndex+dir] = this.boardArray[this.activeBoardIndex];
	this.boardArray[this.activeBoardIndex] = temp;
	
	// Finally, flip the data in the xml and save
	var game = this;
	localforage.getItem('caseFile').then(function(caseFile){
		caseFile = Utilities.getXml(caseFile);
		var list = caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element");
		list[game.activeBoardIndex].innerXML(game.categories[game.activeBoardIndex].name);
		list[game.activeBoardIndex+dir].innerXML(game.categories[game.activeBoardIndex+dir].name);
		var cats = caseFile.getElementsByTagName("category");
		for(var i=0;i<cats.length;i++){
			if(Number(cats[i].getAttribute("categoryDesignation"))==game.activeBoardIndex)
				cats[i].setAttribute("categoryDesignation", game.activeBoardIndex+dir);
			else if(Number(cats[i].getAttribute("categoryDesignation"))==game.activeBoardIndex+dir)
				cats[i].setAttribute("categoryDesignation", game.activeBoardIndex);
		}
		localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile), function(){
			game.boardArray[game.activeBoardIndex+dir].button.className = "active";
			game.boardArray[game.activeBoardIndex].button.className = "";
			game.activeBoardIndex += dir;
		});
	});
	
}

p.deleteCategory = function() {
	
	// Remove the button, board, and cat first
	this.boardArray[this.boardArray.length-1].button.parentNode.removeChild(this.boardArray[this.boardArray.length-1].button);
	this.boardArray[this.activeBoardIndex].canvas.parentNode.removeChild(this.boardArray[this.activeBoardIndex].canvas);
	for(var i=this.boardArray.length-1;i>this.activeBoardIndex;i--){
		this.boardArray[i].button = this.boardArray[i-1].button;
		this.boardArray[i].button.innerHTML = this.categories[i].name;
	}
	for(var i=this.activeBoardIndex+1;i<this.boardArray.length;i++){
		this.boardArray[i-1] = this.boardArray[i];
		this.categories[i-1] = this.categories[i];
	}
	this.boardArray.pop();
	this.categories.pop();
	
	// Then remove it from the xml
	var game = this;
	localforage.getItem('caseFile').then(function(caseFile){
		caseFile = Utilities.getXml(caseFile);
		var list = caseFile.getElementsByTagName("categoryList")[0];
		list.setAttribute("categoryCount", game.categories.length);
		list.removeChild(list.getElementsByTagName("element")[game.activeBoardIndex]);
		var cats = caseFile.getElementsByTagName("category");
		for(var i=0;i<cats.length;i++){
			if(Number(cats[i].getAttribute("categoryDesignation"))==game.activeBoardIndex){
				cats[i].parentNode.removeChild(cats[i]);
				break;
			}
		}
		cats = caseFile.getElementsByTagName("category");
		for(var i=0;i<cats.length;i++)
			if(Number(cats[i].getAttribute("categoryDesignation"))>game.activeBoardIndex)
				cats[i].setAttribute("categoryDesignation", game.activeBoardIndex-1);
		localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile), function(){
			if(game.activeBoardIndex>=game.boardArray.length)
				game.activeBoardIndex = game.boardArray.length-1;
			game.boardArray[game.activeBoardIndex].button.className = "active";
			game.newBoard = game.activeBoardIndex;
			game.zoomout = true;
		});
	});
}

p.createLessonNodes = function(){
	this.boardArray = [];
	this.bottomBar = document.querySelector('#'+this.section.id+' #bottomBar');
	this.mouseState = new MouseState();
	this.keyboardState = new KeyboardState(this);
	for(var i=0;i<this.categories.length;i++)
		this.createBoard(this.categories[i], i);
	
}

p.createBoard = function(cat, num){
	this.lessonNodes = [];
	// add a node per question
	for (var j = 0; j < cat.questions.length; j++) {
		// create a new lesson node
		this.lessonNodes.push(new LessonNode( cat.questions[j] ) );
		// attach question object to lesson node
		this.lessonNodes[this.lessonNodes.length-1].question = cat.questions[j];
	
	}

	// create a board
	this.boardArray[num] = new Board(this.section, this.boardContext, this.nodeContext, this.mouseState, new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), this.lessonNodes, this.save.bind(this));
	var button = document.createElement("BUTTON");
	button.innerHTML = cat.name;
	var game = this;
	button.onclick = (function(i){ 
		return function() {
			if(game.active){
				game.changeBoard(i);
			}
	}})(num);
	this.bottomBar.appendChild(button);
	this.boardArray[num].button = button;
}

p.update = function(dt){

    if(this.active){
    
    	// perform game actions
    	this.act(dt);
    	
	    // draw stuff
	    this.boardArray[this.activeBoardIndex].draw(this.scale, this.mouseState);
	    
    }
    else if(pausedTime!=0 && windowDiv.innerHTML=='')
    	this.windowClosed();
    
}

p.act = function(dt){

    // Update the mouse and keyboard states
	this.mouseState.update(dt, this.scale*this.getZoom());
	this.keyboardState.update();
	
	// Handle keyboard shortcuts
	this.checkKeyboard();
	
	
    // Update the current board (give it the mouse only if not zooming)
    this.boardArray[this.activeBoardIndex].act(this.scale, (this.zoomout ? null : this.mouseState), dt);
    
    // Check if new board available
    if(this.activeBoardIndex < this.boardArray.length-1 &&
    		this.boardArray[this.activeBoardIndex+1].button.disabled && 
    		this.boardArray[this.activeBoardIndex].finished){
    	this.boardArray[this.activeBoardIndex+1].button.disabled = false;
    }
	

	// If the needs to zoom out to center
	if(this.zoomout){
		
		// Get the current board
		var board = this.boardArray[this.activeBoardIndex];
		
		// Zoom out and move towards center
		if(this.getZoom()>Constants.startZoom)
			board.zoom -= dt*Constants.zoomSpeed;
		else if(this.getZoom()<Constants.startZoom)
			board.zoom = Constants.startZoom;
		board.moveTowards(new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), dt, Constants.zoomMoveSpeed);
		
		// Update the zoom slider
		zoomSlider.value = -this.getZoom();
		
		// If fully zoomed out and in center stop
		if(this.getZoom()==Constants.startZoom && board.boardOffset.x==Constants.boardSize.x/2 && board.boardOffset.y==Constants.boardSize.y/2){				
			this.zoomout = false;
			
			// If changing board start that process
			if(this.newBoard!=null){
				var dir = this.newBoard < this.activeBoardIndex;
				this.boardArray[this.activeBoardIndex].hide(dir);
				this.activeBoardIndex = this.newBoard;
				this.boardArray[this.activeBoardIndex].show(dir);
				zoomSlider.value = -this.getZoom();
				this.active = false;
				var game = this;
				this.boardArray[this.activeBoardIndex].loaded = function(){
					game.active = true;
					game.newBoard = null;
				}
			}
		}
	}
	else{ // Only handle zooming if not performing animation zoom
	
		// Handle pinch zoom
	    if(this.mouseState.zoomDiff!=0){
	    	zoomSlider.value = pinchStart + this.mouseState.zoomDiff * Constants.pinchSpeed;
	    	this.updateZoom(-parseFloat(zoomSlider.value)); 
	    }
	    else
	    	pinchStart = Number(zoomSlider.value);
	    
	    // Handle mouse zoom
	    if(this.mouseState.mouseWheelDY!=0)
	    	this.zoom(this.mouseState.mouseWheelDY<0);
	}

    
    // Check if should pause
    if(windowDiv.innerHTML!='' && pausedTime++>3){
    	this.active = false;
    	windowFilm.style.display = 'block';
    }
    
}

p.getZoom = function(){
	return this.boardArray[this.activeBoardIndex].zoom;
}

p.setZoom = function(zoom){
	this.boardArray[this.activeBoardIndex].zoom = zoom;
}

p.zoom = function(dir){
	if(dir)
    	zoomSlider.stepDown();
    else
    	zoomSlider.stepUp();
	this.setZoom(-parseFloat(zoomSlider.value));
}

p.setScale = function(scale){
	for(var i=0;i<this.boardArray.length;i++)
		this.boardArray[i].updateSize();
	this.scale = scale;
}

p.changeBoard = function(num){
	if(num!=this.activeBoardIndex){
		this.boardArray[num].button.className = "active";
		this.boardArray[this.activeBoardIndex].button.className = "";
		this.newBoard = num;
		this.zoomout = true;
	}
}

p.windowClosed = function() {
	
	// Unpause the game and fully close the window
	pausedTime = 0;
	this.active = true;
	windowFilm.style.display = 'none';
	
	var save = this.boardArray[this.activeBoardIndex].windowClosed();
	
	if(save){
		var game = this;
		localforage.getItem('caseFile').then(function(caseFile){
			caseFile = Utilities.getXml(caseFile);
			if(save.xml){
				var cat = caseFile.getElementsByTagName('category')[game.activeBoardIndex];
				cat.replaceChild(save.xml, cat.getElementsByTagName('button')[save.num]);
				localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile), game.save.bind(game));
			}
			else{
				game.categories[game.activeBoardIndex].questions[save.num].xml = caseFile.getElementsByTagName('category')[game.activeBoardIndex].getElementsByTagName('button')[save.num];
				game.categories[game.activeBoardIndex].questions[save.num].refresh();
				game.save();
			}
		});
	}
	else
		this.save();
	
}

p.save = function(){
	
	var lessonNodes = this.boardArray[this.activeBoardIndex].lessonNodeArray;
	for(var i=0;i<lessonNodes.length;i++)
		lessonNodes[i].save();
	
	var game = this;
	localforage.getItem('caseFile').then(function(caseFile){
		caseFile = Utilities.getXml(caseFile);
		
		var resourceList = caseFile.getElementsByTagName("resourceList")[0];
		resourceList.parentNode.replaceChild(game.resources.xml(caseFile), resourceList);
		
		var caseNode = caseFile.getElementsByTagName("case")[0];
		var cat = caseNode.getElementsByTagName("category")[0];
		while(cat){
			caseNode.removeChild(cat);
			cat = caseNode.getElementsByTagName("category")[0];
		}
		for(var i=0;i<game.categories.length;i++)
			caseNode.appendChild(game.categories[i].xml(caseFile, i));
		localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile));
	});
	
}

p.addQuestion = function(x, y){
	
	// Get the case to add the question
	var game = this;
	localforage.getItem('caseFile').then(function(caseFile){

		caseFile = Utilities.getXml(caseFile);
		var newQuestion = caseFile.createElement('button');
		newQuestion.setAttribute('xPositionPercent', x);
		newQuestion.setAttribute('yPositionPercent', y);
		newQuestion.setAttribute('scale', '1');
		newQuestion.setAttribute('numConnections', '0');
		newQuestion.setAttribute('numAnswers', '3');
		newQuestion.setAttribute('correctAnswer', '0');
		newQuestion.setAttribute('imageLink', window.location.href.substr(0, window.location.href.lastIndexOf("editor/")-1)+"/image/default.png");
		newQuestion.setAttribute('revealThreshold', '0');
		newQuestion.setAttribute('questionType', '2');
		newQuestion.setAttribute('resourceCount', '0');
		newQuestion.appendChild(caseFile.createElement('questionName'));
		newQuestion.appendChild(caseFile.createElement('instructions'));
		newQuestion.appendChild(caseFile.createElement('questionText'));
		newQuestion.appendChild(caseFile.createElement('answer'));
		newQuestion.appendChild(caseFile.createElement('answer'));
		newQuestion.appendChild(caseFile.createElement('answer'));
		newQuestion.appendChild(caseFile.createElement('feedback'));
		newQuestion.appendChild(caseFile.createElement('feedback'));
		newQuestion.appendChild(caseFile.createElement('feedback'));
		var cats = caseFile.getElementsByTagName('category');
		for(var i=0;i<cats.length;i++){
			if(Number(cats[i].getAttribute("categoryDesignation"))==game.activeBoardIndex)
			{
				cats[i].appendChild(newQuestion);
				break;
			}
		}
		
		var question = new Question(newQuestion, game.resources, windowDiv, game.categories[game.activeBoardIndex].questions.length);
		question.imagesWindow = game.imagesWindow;
		game.categories[game.activeBoardIndex].questions.push(question);
		var lessonNodes = game.boardArray[game.activeBoardIndex].lessonNodeArray;
		lessonNodes.push(new LessonNode( question ) );
		// attach question object to lesson node
		lessonNodes[lessonNodes.length-1].question = question;
		game.boardArray[game.activeBoardIndex].lessonNodeArray = lessonNodes;
		
		// Save the changes to local storage
		game.save();
	});
	
}

p.checkKeyboard = function(){
	
	if(this.keyboardState.keyPressed[46]){ // Delete - Delete Category
		if(this.boardArray.length>1 && confirm("Are you sure you want to delete the current category You can't undo this action!"))
			this.deleteCategory();
	}
	
	if(this.keyboardState.key[17]){ // Ctrl
		
		var board = this.boardArray[this.activeBoardIndex];
		var game = this;
		
		if(this.keyboardState.keyPressed[67]){ // C - Add Category
			Popup.prompt(windowDiv, "Create Category", "Category Name:", "", "Create", function(newName){
	    		if(newName)
	    			game.addCategory(newName);
	    	});
		}
		
		if(this.keyboardState.keyPressed[86]){ // V - Rename Category
			Popup.prompt(windowDiv, "Rename Category", "Category Name:", this.categories[this.activeBoardIndex].name, "Rename", function(newName){
	    		if(newName){
	    			game.categories[game.activeBoardIndex].name = newName;
	    			game.boardArray[game.activeBoardIndex].button.innerHTML = newName;
	    			localforage.getItem('caseFile').then(function(caseFile){
	    				caseFile = Utilities.getXml(caseFile);
		    			caseFile.getElementsByTagName("categoryList")[0].getElementsByTagName("element")[game.activeBoardIndex].innerXML(newName);
	    				localforage.setItem('caseFile', new XMLSerializer().serializeToString(caseFile));
	    			})
	    		}
	    	});
		}
		
		if(this.keyboardState.keyPressed[88]){ // X - Move Category forward
			if(this.activeBoardIndex+1<this.categories.length)
				this.moveCategory(1);
		}
		
		if(this.keyboardState.keyPressed[90]){ // Z - Move Category backward
			if(this.activeBoardIndex-1>=0)
				this.moveCategory(-1);
		}
		
		if(this.keyboardState.keyPressed[70]){ // F - Edit Case Info
			localforage.getItem('caseFile').then(function(caseFile){
				Popup.editInfo(windowDiv, Utilities.getXml(caseFile), function(newCaseFile, name){
					localforage.setItem('caseName', name+".ipar");
					localforage.setItem('caseFile', new XMLSerializer().serializeToString(newCaseFile));
				});
			});
		}
		
		if(this.keyboardState.keyPressed[82]){ // R - Edit resources
			this.resources.openWindow(windowDiv, false, function(){
				game.save();
			});
		}
		
		if(board.target){

			if(this.keyboardState.key[16]){ // Shift
				if(this.keyboardState.keyPressed[65]){ // A - Add connection
					board.addConnection(board.target);
					this.save();
				}
				
				if(this.keyboardState.keyPressed[68]){ // D - Remove connection
					if(board.target.question.connections.length>0){
						board.removeConnection(board.target);
						this.save();
					}
				}
				
				if(this.keyboardState.keyPressed[83]){ // S - Show/Hide connection
					if(board.target.question.connections.length>0){
						game.boardArray[game.activeBoardIndex].hideConnection(board.target);
						game.save();
					}
				}
			}
			else{
			
				if(this.keyboardState.keyPressed[65]){ // A - Make question smaller
					if(board.lessonNodeArray[board.target.question.num].question.scale>Constants.minNodeScale){
						board.lessonNodeArray[board.target.question.num].question.scale -= Constants.nodeStep;
						board.lessonNodeArray[board.target.question.num].updateImage();
					}
					this.save();
				}
		
				if(this.keyboardState.keyPressed[83]){ // S - Make question larger
					if(board.lessonNodeArray[board.target.question.num].question.scale<Constants.maxNodeScale){
						board.lessonNodeArray[board.target.question.num].question.scale += Constants.nodeStep;
						board.lessonNodeArray[board.target.question.num].updateImage();
					}
					this.save();
				}
				
				if(this.keyboardState.keyPressed[68]){ // D - Delete question
					if(confirm("Are you sure want to delete this question? You can't undo this action!")){
						var cat = this.categories[this.activeBoardIndex];
						for(var i=0;i<cat.questions.length;i++){
							if(cat.questions[i].num>board.target.question.num)
								cat.questions[i].num--;
							var con = cat.questions[i].connections.indexOf(board.target.question.num+1);
							while(con!=-1){
								cat.questions[i].connections.splice(con, 1);
								con = cat.questions[i].connections.indexOf(board.target.question.num+1);
							}
							for(var j=0;j<cat.questions[i].connections.length;j++)
								if(cat.questions[i].connections[j]-1>board.target.question.num)
									cat.questions[i].connections[j]--;
						}
						board.lessonNodeArray.splice(board.target.question.num, 1);
						cat.questions.splice(board.target.question.num, 1);
						this.save();
					}
				}
				
			}
			
		}
		else{
			if(this.keyboardState.keyPressed[81]){ // Q - Add Question
				this.addQuestion((this.mouseState.virtualPosition.x+Constants.boardSize.x/2)/Constants.boardSize.x*100,
						(this.mouseState.virtualPosition.y+Constants.boardSize.y/2)/Constants.boardSize.y*100);
			}
		}
	}
	
}

module.exports = game;

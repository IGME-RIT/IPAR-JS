"use strict";
var Board = require('./board.js');
var Point = require('../helper/point.js');
var LessonNode = require('./lessonNode.js');
var Constants = require('./constants.js');
var DrawLib = require('../helper/drawlib.js');
var DataParser = require('../helper/iparDataParser.js');
var MouseState = require('../helper/mouseState.js');
var FileManager = require('../helper/fileManager.js');
var Windows = require('../html/questionWindows.js');
var Utilities = require('../helper/utilities.js');

//mouse management
var mouseState;
var previousMouseState;
var draggingDisabled;
var mouseTarget;
var mouseSustainedDown;

// HTML elements
var zoomSlider;
var windowDiv;
var windowWrapper;
var windowFilm;
var proceedContainer;
var proceedLong;
var proceedRound;

// Used for pinch zoom
var pinchStart;

// Used for waiting a second to close windows
var pausedTime = 0;

//phase handling
var phaseObject;

function game(section, baseScale){
	var game = this;
	this.active = false;
	this.saveFiles = [];
	
	// Get and setup the window elements
	windowDiv = document.getElementById('window');
	windowWrapper = document.getElementById('windowWrapper');
    proceedContainer = document.getElementById('proceedContainer');
    proceedLong = document.getElementById('proceedBtnLong');
    proceedRound = document.getElementById('proceedBtnRound');
	windowFilm = document.getElementById('windowFlim');
	windowFilm.onclick = function(e) {
		var window = false;
		var windows = document.getElementsByClassName("windowContent");
		for(var i=0;i<windows.length && !window;i++){
			var bounds = windows[i].getBoundingClientRect();
			if(bounds.left < e.clientX && bounds.right > e.clientX && bounds.top < e.clientY && bounds.bottom > e.clientY)
				window = true;
		}
		windows = document.getElementsByClassName("title");
		for(var i=0;i<windows.length && !window;i++){
			var bounds = windows[i].getBoundingClientRect();
			if(bounds.left < e.clientX && bounds.right > e.clientX && bounds.top < e.clientY && bounds.bottom > e.clientY)
				window = true;
		}
		
		if(!window && e.isTrusted && e.isPrimary!=false)
			windowDiv.innerHTML = '';
	};
	
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
	
	// Save the given scale
	this.scale = baseScale;
	
	// on case info
	document.getElementById("infoButton").onclick = this.showInfo.bind(this);
	
	// on loading the case file
	var onload = function(categories, startCat){
		// Create the boards
		this.categories = categories;
		this.createLessonNodes(section);
		
		// Create the final button
		this.finalButton = document.createElement("button");
		this.finalButton.innerHTML = "Close Case";
		if(!this.boardArray[this.boardArray.length-1].finished)
			this.finalButton.disabled = true;
		this.finalButton.onclick = function(){
			if(game.active && !game.zoomout && !game.zoomin)
				game.submit();
		};
		this.bottomBar.appendChild(this.finalButton);
		
		// Display the current board
		this.activeBoardIndex = startCat;
		this.active = true;
		this.boardArray[this.activeBoardIndex].show();
		this.boardArray[this.activeBoardIndex].button.className = "active";
		this.updateNode();
		zoomSlider.value = -this.getZoom();
		
		// Setup the save button
		FileManager.prepareZip(document.querySelector('#'+section.id+' #blob'));
	};
	
	// Load the case file
	FileManager.loadCase(document.querySelector('#'+section.id+' #window'), onload.bind(this));
	
}

var p = game.prototype;

p.createLessonNodes = function(section){
	this.boardArray = [];
	this.bottomBar = document.querySelector('#'+section.id+' #bottomBar');
	for(var i=0;i<this.categories.length;i++){
		// initialize empty
		
		this.lessonNodes = [];
		// add a node per question
		for (var j = 0; j < this.categories[i].questions.length; j++) {
			// create a new lesson node
			this.lessonNodes.push(new LessonNode(new Point(this.categories[i].questions[j].positionPercentX, this.categories[i].questions[j].positionPercentY), this.categories[i].questions[j].imageLink, this.categories[i].questions[j] ) );
			// attach question object to lesson node
			this.lessonNodes[this.lessonNodes.length-1].question = this.categories[i].questions[j];
		
		}

		// create a board
		this.boardArray[i] = new Board(section, new Point(Constants.boardSize.x/2, Constants.boardSize.y/2), this.lessonNodes);
		var button = document.createElement("BUTTON");
		button.innerHTML = this.categories[i].name;
		var game = this;
		button.onclick = (function(i){ 
			return function() {
				if(game.active && !game.zoomout && !game.zoomin){
					game.changeBoard(i);
				}
		}})(i);
		if(i!=0 && !this.boardArray[i-1].finished)
			button.disabled = true;
		this.bottomBar.appendChild(button);
		this.boardArray[i].button = button;
		var game = this;
		this.boardArray[i].updateNode = function(){game.updateNode();};
	}
	
	this.mouseState = new MouseState(this.boardArray);
	
}

p.update = function(dt){
	
    if(this.active){
    
    	// perform game actions
    	this.act(dt);
    	
	    // draw stuff
	    this.boardArray[this.activeBoardIndex].draw(this.scale);
	    
    }
    else if(pausedTime!=0 && windowDiv.innerHTML=='')
    	this.windowClosed();
    
}

p.act = function(dt){

    // Update the mouse state
	this.mouseState.update(dt, this.scale*this.getZoom());
	
    // Update the current board (give it the mouse only if not zooming)
    this.boardArray[this.activeBoardIndex].act(this.scale, (this.zoomin || this.zoomout ? null : this.mouseState), dt);
    
    // Check if new board available
    if(this.boardArray[this.activeBoardIndex].finished){
	    if(this.activeBoardIndex < this.boardArray.length-1){
	    	if(this.boardArray[this.activeBoardIndex+1].button.disabled){
		    	this.boardArray[this.activeBoardIndex+1].button.disabled = false;
		    	this.prompt = true;
	    	}
	    }
	    else if(this.finalButton.disabled){
	    	this.finalButton.disabled = false;
	    	this.prompt = true;
	    }
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
			
			if(this.prompt){
				proceedContainer.style.display = 'none';
				if(this.activeBoardIndex+1<this.categories.length)
					windowDiv.innerHTML = '<div class="windowPrompt"><div><h1>The "'+this.categories[this.activeBoardIndex+1].name+'" category is now available!</h1></div></div>';
				else
					windowDiv.innerHTML = '<div class="windowPrompt"><div><h1>The investigation has been completed! You can now conclude the investigation.</h1></div></div>';
				var windowPrompt = windowDiv.getElementsByClassName("windowPrompt")[0];
		    	var zoomin = function(){
		    		windowPrompt.removeEventListener('animationend', zoomin);
					setTimeout(function(){
						windowPrompt.style.animation = 'promptFade 1s';
						var fadeout = function(){
							windowPrompt.style.animation = '';
							windowPrompt.removeEventListener('animationend', fadeout);
							windowDiv.innerHTML = '';
							windowDiv.style.animation = '';
						}
						windowPrompt.addEventListener('animationend', fadeout, false);
					}, 500);
				};
				windowDiv.style.animation = 'none';
				windowPrompt.style.animation = 'openWindow 0.5s';
				windowPrompt.addEventListener('animationend', zoomin, false);
		    	this.prompt = false;
			}
			
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
					game.updateNode();
				}
			}
		}
	} // If there is a new node zoom into it
	else if(this.zoomin){ 
		
		// Get the current board
		var board = this.boardArray[this.activeBoardIndex];
		
		// If board is not finished look for next node
		if(!board.finished && this.targetNode==null){
			this.targetNode = board.getFreeNode();
		}
		else if(board.finished){
			this.zoomin = false;
			this.zoomout = true;
		}
		
		// Start moving and zooming if target found
		if(this.zoomin && this.targetNode){
	
			// Zoom in and move towards target node
			if(this.getZoom()<Constants.endZoom)
				board.zoom += dt*Constants.zoomSpeed;
			else if(this.getZoom()>Constants.endZoom)
				board.zoom = Constants.endZoom;
			board.moveTowards(this.targetNode.position, dt, Constants.zoomMoveSpeed);

			// Update the zoom slider
			zoomSlider.value = -this.getZoom();
			
			// If reached the node and zoomed in stop and get rid of the target
			if(this.getZoom()==Constants.endZoom && board.boardOffset.x==this.targetNode.position.x && board.boardOffset.y==this.targetNode.position.y){
				this.zoomin = false;
				this.targetNode = null;
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

p.updateNode = function(){
	this.zoomin = true;
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
	proceedContainer.style.display = 'none';
	
	if(!this.popup)
		this.save();
	else
		this.popup = false;
	
}

p.save = function(){
	
	var saveFile = DataParser.createXMLSaveFile(this.activeBoardIndex, this.boardArray, true);
	
	// Autosave on window close
	var filesToStore = this.boardArray[this.activeBoardIndex].windowClosed();
	if (filesToStore){
		filesToStore.board = this.activeBoardIndex;
		this.saveFiles.push(filesToStore);
		var game = this;
		localforage.getItem('submitted').then(function(submitted){
			game.nextFileInSaveStack(submitted);
		});
	}
	
	localforage.setItem('saveFile', saveFile);
	
}

p.nextFileInSaveStack = function(submitted){
	
	var game = this;
	localforage.setItem('submitted', submitted, function(){
		if(game.saveFiles.length>0){
			FileManager.removeFilesFor(submitted, game.saveFiles[0]);
			FileManager.addNewFilesToSystem(submitted, game.saveFiles[0], game.nextFileInSaveStack.bind(game));
		}
		game.saveFiles.shift();
	});
	
}

p.submit = function(){
	
	// Create the export case window
	this.popup = true;
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.closeCase;
    var exportWindow = tempDiv.firstChild;

    localforage.getItem('caseFile').then(function(caseFile){
    	var caseNode = Utilities.getXml(caseFile).getElementsByTagName("case")[0];
        exportWindow.innerHTML = exportWindow.innerHTML.replace(/%title%/g, caseNode.getAttribute("caseName"))
        												.replace(/%conclusion%/g, caseNode.getAttribute("conclusion"));
        exportWindow.getElementsByTagName("button")[0].onclick = function(){
        	FileManager.saveIPAR(true);
        	windowDiv.innerHTML = Windows.caseClosed;
        };
    });
	
    var game = this;
    var exitButton = new Image();
	exitButton.src = "../img/iconClose.png";
	exitButton.className = "exit-button";
    exitButton.style.left = "75vw";
	exitButton.onclick = function() { windowDiv.innerHTML = ''; };
	windowDiv.appendChild(exportWindow);
	windowDiv.appendChild(exitButton);
    
}

p.showInfo = function(){
	
	// Create the info case window
	this.popup = true;
	var tempDiv = document.createElement("DIV");
	tempDiv.innerHTML = Windows.caseInfo;
    var infoWindow = tempDiv.firstChild;

    localforage.getItem('caseFile').then(function(caseFile){
    	var caseNode = Utilities.getXml(caseFile).getElementsByTagName("case")[0];
    	infoWindow.innerHTML = infoWindow.innerHTML.replace(/%title%/g, caseNode.getAttribute("caseName"))
        												.replace(/%description%/g, caseNode.getAttribute("description"));
    });
    localforage.getItem('saveFile').then(function(saveFile){
    	var caseNode = Utilities.getXml(saveFile).getElementsByTagName("case")[0];
    	infoWindow.innerHTML = infoWindow.innerHTML.replace(/%email%/g, caseNode.getAttribute("profileMail"))
        												.replace(/%name%/g, caseNode.getAttribute("profileLast")+", "+caseNode.getAttribute("profileFirst"));
    });
	
    var game = this;
    var exitButton = new Image();
	exitButton.src = "../img/iconClose.png";
	exitButton.className = "exit-button";
    exitButton.style.left = "75vw";
	exitButton.onclick = function() { windowDiv.innerHTML = ''; };
	windowDiv.appendChild(infoWindow);
	windowDiv.appendChild(exitButton);
}

module.exports = game;

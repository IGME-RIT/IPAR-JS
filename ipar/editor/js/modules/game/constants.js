"use strict";
var Point = require('../helper/point.js');

//Module export
var m = module.exports;

// The size of the board in game units at 100% zoom
m.boardSize = new Point(1920, 1080);
m.boundSize = 3;

//The size of the board outline in game units at 100% zoom
m.boardOutline = m.boardSize.x > m.boardSize.y ? m.boardSize.x/20 : m.boardSize.y/20;

// The zoom values at start and end of animation
m.startZoom = 0.5;
m.endZoom = 1.5;

// The speed of the zoom animation
m.zoomSpeed = 0.001;
m.zoomMoveSpeed = 0.75;

// The speed of the line animation
m.lineSpeed = 0.002;

// The time between zoom checks
m.pinchSpeed = .0025;

// Used for resizing nodes
m.nodeStep = 0.1;
m.maxNodeScale = 2;
m.minNodeScale = 0.5;
m.nodeEdgeWidth = 25;

// Used for drawing arrows
m.arrowHeadSize = 50;
m.arrowSize = 5;

// fix for context menu alignment
//TODO: do something more permanant than this
m.navbarSize = 51;

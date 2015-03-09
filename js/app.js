/* 
Pulled from an example on the Firebase page: 
https://www.firebase.com/tutorial/#session/fw6ggzi07hb

 - Removed some extraneous bits
 - Converted to a revealing module pattern
*/

var Firecanvas = (function() {

	// Define global variables with initial settings
	var _settings = {
		brushSize : 2,
		lastPoint : null,
		currentColor : "rgb(0, 0, 0)",
		brushDown : false
	}

	// Create reference to Firebase
	var _fbref = new Firebase("https://zmcanvas.firebaseio.com/");

	// Set up the canvas
	var _drawing = document.getElementById("drawing");
	var _context = _drawing.getContext("2d");

	// Listens for mousedown events and sets a global brushDown prop to true
	_drawing.onmousedown = function() {
		_settings.brushDown = true;
	}
	// Declare function that sets the global brushDown prop to false and clears out the global position prop
	var _liftBrush = function() {
		_settings.brushDown = false;
		_settings.lastPoint = null;
	}
	// Bind to both the mouse out and mouse up events
	_drawing.onmouseout = _liftBrush;
	_drawing.onmouseup = _liftBrush;

	// Function that handles the drawing of the line
	var drawLine = function(e) {
		if (!_settings.brushDown) return;

		e.preventDefault();

		//Bresenham's line algorithm
		var offset = $('#drawing').offset();

		var x1 = Math.floor((e.pageX - offset.left) / _settings.brushSize - 1);
		var y1 = Math.floor((e.pageY - offset.top) / _settings.brushSize -1);
		
		var x0 = (_settings.lastPoint == null) ? x1 : _settings.lastPoint[0];
		var y0 = (_settings.lastPoint == null) ? y1 : _settings.lastPoint[1];
		
		var dx = Math.abs(x1 - x0);
		var dy = Math.abs(y1 - y0);
		
		var sx = (x0 < x1) ? 1 : -1;
		var sy = (y0 < y1) ? 1 : -1;
		
		var err = dx - dy;

		while (true) {
			_fbref.child(x0 + ":" + y0).set(_settings.currentColor === "rgb(255, 255, 255)" ? null : _settings.currentColor);

			if (x0 == x1 && y0 == y1) break;

	 		var e2 = 2 * err;
			if (e2 > -dy) {
				err = err - dy;
				x0 = x0 + sx;
			}
			if (e2 < dx) {
				err = err + dx;
				y0 = y0 + sy;
			}
		}
		_settings.lastPoint = [x1, y1];
	};

	var _drawPixel = function(snapshot) {
		var coords = snapshot.key().split(":");
		_context.fillStyle = snapshot.val();
		_context.fillRect(parseInt(coords[0]) * _settings.brushSize, parseInt(coords[1]) * _settings.brushSize, _settings.brushSize, _settings.brushSize);
	};
    var _clearPixel = function(snapshot) {
		var coords = snapshot.key().split(":");
		_context.clearRect(parseInt(coords[0]) * _settings.brushSize, parseInt(coords[1]) * _settings.brushSize, _settings.brushSize, _settings.brushSize);
    };

	_fbref.on('child_added', _drawPixel);
	_fbref.on('child_changed', _drawPixel);
	_fbref.on('child_removed', _clearPixel);

	var selectColor = function(){
		$(this).siblings().each(function(index, value){
			$(value).removeClass("selected");
		});
		$(this).addClass("selected");
		_settings.currentColor = ($(this).css("background-color"));
	};

	var saveArt = function(){
		window.open(_drawing.toDataURL('image/png'));
	};

	var clearArt = function(){
		_fbref.remove();
	};

	return {
		drawLine : drawLine,
		selectColor : selectColor,
		saveArt: saveArt,
		clearArt: clearArt
	};

})();

$(function() {
	$(".color-square").on("click", Firecanvas.selectColor);
	$("#drawing").on("mousedown mousemove", Firecanvas.drawLine);
	$("#save").on("click", Firecanvas.saveArt);
	$("#clear").on("click", Firecanvas.clearArt);
}); 
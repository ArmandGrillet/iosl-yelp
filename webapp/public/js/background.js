chrome.app.runtime.onLaunched.addListener(function(parameters) {
	var windowConfig = {
		outerBounds: {
	      	width: Math.round(screen.width * 0.85),
	      	height: Math.round(screen.height * 0.85),
			minWidth: 750,
			minHeight: 330
	    },
	    frame: "none"
	};
	chrome.app.window.create("index.html", windowConfig);
});

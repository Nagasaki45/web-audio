//---------------------------------------------------------
//		GUI INIT
//---------------------------------------------------------

var gui = {}

function gui_init() {

	var height = 150,
		width = $("#content").width();

	// svg element
	gui.svg = d3.select(".synth")
		.append("svg")
		.attr("height", height)
		.attr("width", width);

	// x and y scales
	gui.x = d3.scale.linear()
		.domain([0, width])
		.range([0, 1]);

	gui.y = d3.scale.linear()
		.domain([0, height])
		.range([1, 0]);

	// interface
	gui.interface = gui.svg.append("rect")
		.attr("height", height)
		.attr("width", width);

}

gui_init();


//---------------------------------------------------------
//		AUDIO INIT
//---------------------------------------------------------

var audio = {}

function audio_init() {

	// fix up prefixing
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audio.context = new AudioContext();

	// source
	audio.oscillator = audio.context.createOscillator()

	// gain
	audio.gain = audio.context.createGainNode();

	// audio route
	audio.oscillator.connect(audio.gain);
	audio.gain.connect(audio.context.destination);

	// audio logaritmic scale
	audio.freq_scale = d3.scale.pow()
		.domain([0, 1])
		.range([100, 5000]);

}

audio_init();


//---------------------------------------------------------
//		WHEN DOCUMENT IS READY
//---------------------------------------------------------

$( document ).ready(function() {
	
	audio.gain.gain.value = 0;
	audio.oscillator.start(0);


	//---------------------------------------------------------
	//		ONCLICK LISTENER
	//---------------------------------------------------------

	gui.interface.on("click", function(d) {

		gui.mouse_x = gui.x(d3.mouse(this)[0])
		gui.mouse_y = gui.y(d3.mouse(this)[1])

		// circle creation, transition and removal
		var circle = gui.svg.append("circle")
			.attr("cx", gui.x.invert(gui.mouse_x))
			.attr("cy", gui.y.invert(gui.mouse_y))
			.attr("r", 3)
			.attr("fill", "rgba(30, 30, 255, 0.8)")
			.transition()
			.duration(500)
			.attr("r", 30)
			.attr("fill", "rgba(30, 30, 255, 0)")
			.remove();

		// audio update
		audio.gain.gain.value = gui.mouse_y;
		var now = audio.context.currentTime;
		audio.gain.gain.setTargetAtTime(0, now, 0.2);
		audio.oscillator.frequency.setValueAtTime(audio.freq_scale(gui.mouse_x), now);

	});

});

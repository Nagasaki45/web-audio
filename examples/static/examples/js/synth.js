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
		.attr("width", width)
		.attr("fill", "rgba(30, 160, 30, 0.5)")

	// mute button
	var dim = 20,
		pad = 10,
		stroke_width = 2;

	var mute = gui.svg
		.append("rect")
		.attr("height", dim)
		.attr("width", dim)
		.attr("x", pad)
		.attr("y", height - dim - pad)
		.attr("id", "mute")
		.classed("mute-off", true);

	var text_pad = 4;

	var mute_text = gui.svg
		.append("text")
		.attr("dy", "-0.35em")
		.attr("x", pad + dim + text_pad)
		.attr("y", height - 10)
		.text("Mute");

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
	//		MUTE ONCLICK LISTENER
	//---------------------------------------------------------

	d3.select("#mute").on("click", function(d) {

		var mute = d3.select("#mute"),
			mute_text = d3.select("text");

		// if muted
		if (mute.classed("mute-on")) {
			mute.classed("mute-on", false)
				.classed("mute-off", true);
			mute_text.text("Mute");
		} else {
			mute.classed("mute-on", true)
				.classed("mute-off", false);
			mute_text.text("UnMute");
		}
	});

	//---------------------------------------------------------
	//		PLAY ONCLICK LISTENER
	//---------------------------------------------------------

	gui.interface.on("click", function(d) {

		// if mute is off
		if (d3.select("#mute").classed("mute-off")) {

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

		}

	});

});

//---------------------------------------------------------
//		PUSHER INIT
//---------------------------------------------------------

var pusher = new Pusher('faeca2549c7ec94a3faa');
pusher.clients_channel = pusher.subscribe('clients_channel');

//---------------------------------------------------------
//		GUI INIT
//---------------------------------------------------------

var gui = {}

function gui_init() {

	var height = 150,
		width = $("#content").width();

	// svg element
	var svg = d3.select(".synth")
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
	var interface = svg.append("rect")
		.attr("height", height)
		.attr("width", width)
		.attr("id", "interface");

	// mute button
	var dim = 20,
		pad = 10,
		stroke_width = 2;

	var mute = svg.append("rect")
		.attr("height", dim)
		.attr("width", dim)
		.attr("x", pad)
		.attr("y", height - dim - pad)
		.attr("id", "mute")
		.classed("mute-off", true);

	var text_pad = 4;

	var mute_text = svg.append("text")
		.attr("dy", "-0.35em")
		.attr("x", pad + dim + text_pad)
		.attr("y", height - 10)
		.attr("id", "mute-text")
		.text("Mute web users");

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

	// audio logaritmic scale
	audio.freq_scale = d3.scale.pow()
		.domain([0, 1])
		.range([100, 5000]);

}

audio_init();


$( document ).ready(function() {


	//---------------------------------------------------------
	//		MUTE ONCLICK LISTENER
	//---------------------------------------------------------

	d3.select("#mute").on("click", function(d) {

		var mute = d3.select("#mute"),
			mute_text = d3.select("#mute-text");

		// if muted
		if (mute.classed("mute-on")) {
			mute.classed("mute-on", false)
				.classed("mute-off", true);
			mute_text.text("Mute web users");
		} else {
			mute.classed("mute-on", true)
				.classed("mute-off", false);
			mute_text.text("UnMute web users");
		}
	});


	//---------------------------------------------------------
	//		INTERFACE ONCLICK LISTENER
	//---------------------------------------------------------

	d3.select("#interface").on("click", function(d) {

		gui.mouse_x = gui.x(d3.mouse(this)[0])
		gui.mouse_y = gui.y(d3.mouse(this)[1])

		play_note(gui.mouse_x, gui.mouse_y);

		// sending user click the server with ajax
		$.get(
			click_url,
			{x: gui.mouse_x, y: gui.mouse_y}
		);
		
	});

	//---------------------------------------------------------
	//		PUSHER HANDLER
	//---------------------------------------------------------

	pusher.clients_channel.bind('click', function(data) {

		// check if web users mute is off
		if (d3.select("#mute").classed("mute-off")) {
			// play note only if not the message sender
			if (data.x != gui.mouse_x && data.y != gui.mouse_y) {
				play_note(data.x, data.y);
			}
		}
	});

});


//---------------------------------------------------------
//		NOTE PLAYER
//---------------------------------------------------------

function play_note(x, y) {

	// circle creation, transition and removal
	var circle = d3.select("svg").append("circle")
		.attr("cx", gui.x.invert(x))
		.attr("cy", gui.y.invert(y))
		.attr("r", 3)
		.attr("fill", "rgba(30, 30, 255, 0.8)")
		.transition()
		.duration(500)
		.attr("r", 30)
		.attr("fill", "rgba(30, 30, 255, 0)")
		.remove();

	// create audio nodes
	var oscillator = audio.context.createOscillator(),
		gain = audio.context.createGainNode();

	// route
	oscillator.connect(gain);
	gain.connect(audio.context.destination);

	// use x and y values
	gain.gain.value = y;
	var now = audio.context.currentTime;
	gain.gain.setTargetAtTime(0, now, 0.2);
	oscillator.frequency.setValueAtTime(audio.freq_scale(x), now);

	// and play
	oscillator.start(0);
}

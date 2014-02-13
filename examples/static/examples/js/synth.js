//---------------------------------------------------------
//		WEBSOCKET INIT
//---------------------------------------------------------

var ws = new WebSocket("ws://" + location.host + ws_url);	


//---------------------------------------------------------
//		AUDIO INIT
//---------------------------------------------------------

var audio = {
	octaves: 3,
	lowest_pitch: 440,
}

audio.audio_init = function() {

	// fix up prefixing
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audio.context = new AudioContext();

	// init tuna effects library and convolver effect
	audio.tuna = new Tuna(audio.context);
	audio.convolver = new audio.tuna.Convolver({
		highCut: 22050,
		lowCut: 20,
		dryLevel: 1,
		wetLevel: 1.5,
		level: 0.5,
		// impulse response from voxengo IM reverb pack 1
		impulse: "static/impulses/Five Columns Long.wav",
		bypass: 0
	});
	audio.convolver.connect(audio.context.destination);
}

audio.audio_init();


//---------------------------------------------------------
//		GUI INIT
//---------------------------------------------------------

var gui = {}

gui.gui_init = function() {

	// random color generated on init
	var color = "hsl(" + Math.floor(Math.random() * 360) + " ,100%, 50%)";

	var height = 150,
		width = $("#synth").width();

	// svg element
	var svg = d3.select("#synth")
		.append("svg")
		.attr("height", height)
		.attr("width", width);

	// interface
	var interface = svg.append("g")
		.attr("height", height)
		.attr("width", width)
		.attr("id", "interface");

	var keys_scale = d3.scale.ordinal()
		.domain(d3.range(audio.octaves * 12))
		.rangeRoundBands([0, width], 0.05);

	var keys_height = d3.scale.pow()
		.domain([0, audio.octaves * 12])
		.rangeRound([height, 0.3 * height])
		.exponent(0.7);

	var keys = interface.selectAll("line")
		.data(d3.range(audio.octaves * 12))
		.enter()
		.append("rect")
		.attr("x", function(d) {
			return keys_scale(d);
		})
		.attr("width", function() {
			return keys_scale.rangeBand();
		})
		.attr("y", function(d) {
			return 0.5 * (height - keys_height(d));
		})
		.attr("height", function(d) {
			return keys_height(d);
		})
		.classed("key", true)
		.classed("tonic", function(d) { return d % 12 == 0; })
		.classed("stable", function(d) { return d % 12 == 4 || d % 12 == 7; });

	// middle line
	interface.append("line")
		.attr("x1", 0)
		.attr("x2", width)
		.attr("y1", height / 2)
		.attr("y2", height / 2)
		.attr("stroke", "black");


	//---------------------------------------------------------
	//		NOTE CLICK LISTENER
	//---------------------------------------------------------

	keys.on("mousedown", function(d) {

		// collect note properties to play and draw
		var upper_keyboard = d3.mouse(this)[1] < (height / 2);
		var keyboard_name = 'low';
		if (upper_keyboard) {
			keyboard_name = 'up';
		}
		var properties = {
			note: d,
			upper_keyboard: upper_keyboard,
			verb: $("[name=" + keyboard_name + "-verb]").is(":checked"),
			osc: $("[name=" + keyboard_name + "-osc]:checked").val(),
			circle_position: {
				x: d3.mouse(this)[0],
				y: d3.mouse(this)[1],
			},
			color: color,
		}

		// play and draw properties
		play_note(properties);
		draw_circle(properties);

		// sending user click to tornado server through websockets
		// data must being sent as string
		ws.send(JSON.stringify(properties));
	});
}

gui.gui_init();


//---------------------------------------------------------
//		WEBSOCKETS HANDLER
//---------------------------------------------------------

ws.onmessage = function(evt) {
	properties = JSON.parse(evt.data);
	play_note(properties);
	draw_circle(properties);
};


//---------------------------------------------------------
//		NOTE PLAYER AND NOTE CIRCLE DRAWER
//---------------------------------------------------------

function play_note(properties) {

	// create audio nodes
	var oscillator = audio.context.createOscillator(),
		gain = audio.context.createGainNode();

	// route
	oscillator.connect(gain);
	if (properties.verb) {
		gain.connect(audio.convolver.input);
	} else {
		gain.connect(audio.context.destination);
	}

	var now = audio.context.currentTime;
	gain.gain.setValueAtTime(0.5, now);
	gain.gain.linearRampToValueAtTime(0, now + 1);

	var freq = audio.lowest_pitch * (Math.pow(2, properties.note/12));
	oscillator.frequency.setValueAtTime(freq, now);
	oscillator.type = properties.osc;

	// play and stop
	oscillator.start(now);
	oscillator.stop(now + 1);
}


function draw_circle(properties) {
	d3.select("svg").append("circle")
		.attr("cx", properties.circle_position.x)
		.attr("cy", properties.circle_position.y)
		.attr("r", 3)
		.attr("fill", properties.color)
		.attr("opacity", 1)
		.transition()
		.duration(500)
		.attr("r", 60)
		.attr("opacity", 0)
		.remove();
}

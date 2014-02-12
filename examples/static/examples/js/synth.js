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
		width = $("#content").width();

	// svg element
	var svg = d3.select(".synth")
		.append("svg")
		.attr("height", height)
		.attr("width", width);

	// x and y scales
	var x = d3.scale.linear()
		.domain([0, width])
		.range([0, 1]);

	var y = d3.scale.linear()
		.domain([0, height])
		.range([1, 0]);

	// interface
	var interface = svg.append("g")
		.attr("height", height)
		.attr("width", width)
		.attr("id", "interface");

	var keys_scale = d3.scale.ordinal()
		.domain(d3.range(audio.octaves * 12))
		.rangeRoundBands([0, width], 0.05);

	var keys_half_height = d3.scale.pow()
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
			return 0.5 * (height - keys_half_height(d));
		})
		.attr("height", function(d) {
			return keys_half_height(d);
		})
		.classed("key", true)
		.classed("tonic", function(d) { return d % 12 == 0; })
		.classed("stable", function(d) { return d % 12 == 4 || d % 12 == 7; })
		.on("click", function(d) {
			play_note(d, 0.5);
			var circle_position = {
				x: d3.mouse(this)[0],
				y: d3.mouse(this)[1],
			}
			draw_circle(circle_position, color);

			// sending user click to tornado server through websockets
			// data must being sent as string
			ws.send(JSON.stringify(
				{note: d,
				amp: 0.5,
				circle_position: circle_position,
				color: color}
			));
		});
}

gui.gui_init();


//---------------------------------------------------------
//		WEBSOCKETS HANDLER
//---------------------------------------------------------

ws.onmessage = function(evt) {
	data = JSON.parse(evt.data);
	play_note(data.note, data.amp);
	draw_circle(data.circle_position, data.color);
};


//---------------------------------------------------------
//		NOTE PLAYER
//---------------------------------------------------------

function play_note(note, amp) {

	// create audio nodes
	var oscillator = audio.context.createOscillator(),
		gain = audio.context.createGainNode();

	// route
	oscillator.connect(gain);
	gain.connect(audio.context.destination);

	var now = audio.context.currentTime;
	gain.gain.setValueAtTime(amp, now);
	gain.gain.linearRampToValueAtTime(0, now + 1);

	var freq = audio.lowest_pitch * (Math.pow(2, note/12));
	oscillator.frequency.setValueAtTime(freq, now);

	// play and stop
	oscillator.start(now);
	oscillator.stop(now + 1);
}


function draw_circle(circle_position, color) {
	d3.select("svg").append("circle")
		.attr("cx", circle_position.x)
		.attr("cy", circle_position.y)
		.attr("r", 3)
		.attr("fill", color)
		.attr("opacity", 1)
		.transition()
		.duration(500)
		.attr("r", 60)
		.attr("opacity", 0)
		.remove();
}
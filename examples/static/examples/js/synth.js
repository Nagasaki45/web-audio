//---------------------------------------------------------
//		WEBSOCKET INIT & HANDLER
//---------------------------------------------------------

// location.host is created by js itself
// ws_url comes from my django template
var ws = new WebSocket("ws://" + location.host + ws_url);

ws.onmessage = function(evt) {
	properties = JSON.parse(evt.data);
	audio.play_note(properties);
	gui.draw_circle(properties);
};


//---------------------------------------------------------
//		AUDIO
//---------------------------------------------------------

var audio = {
	octaves: 3,
	lowest_pitch: 440,

	init: function() {

		var that = this;  // important in order to use "that" in functions

		// fix up prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		that.context = new AudioContext();

		// init tuna effects library and convolver effect
		that.tuna = new Tuna(audio.context);
		that.convolver = new that.tuna.Convolver({
			highCut: 22050,
			lowCut: 20,
			dryLevel: 1,
			wetLevel: 1.5,
			level: 0.5,
			// impulse response from voxengo IM reverb pack 1
			impulse: "static/impulses/Five Columns Long.wav",
			bypass: 0
		});
		that.convolver.connect(that.context.destination);
	},

	play_note: function(properties) {

		var that = this;  // important in order to use "that" in functions

		// create audio nodes
		var oscillator = that.context.createOscillator(),
			gain = that.context.createGainNode();

		// route
		oscillator.connect(gain);
		if (properties.verb) {
			gain.connect(audio.convolver.input);
		} else {
			gain.connect(audio.context.destination);
		}

		var now = that.context.currentTime;
		gain.gain.setValueAtTime(0.5, now);
		gain.gain.linearRampToValueAtTime(0, now + 1);

		var freq = that.lowest_pitch * (Math.pow(2, properties.note/12));
		oscillator.frequency.setValueAtTime(freq, now);
		oscillator.type = properties.osc;

		// play and stop
		oscillator.start(now);
		oscillator.stop(now + 1);
	},
}

audio.init();


//---------------------------------------------------------
//		GUI
//---------------------------------------------------------

var gui = {
	height: 150,
	width: $("#synth").width(),
	color: "hsl(" + Math.floor(Math.random() * 360) + " ,100%, 50%)",
	init: function() {

		var that = this;  // important in order to use "that" in functions

		var keys_scale = d3.scale.ordinal()
			.domain(d3.range(audio.octaves * 12))
			.rangeRoundBands([0, that.width], 0.05);

		var keys_height = d3.scale.pow()
			.domain([0, audio.octaves * 12])
			.rangeRound([that.height, 0.3 * that.height])
			.exponent(0.7);

		// svg element
		d3.select("#synth")
			.append("svg")
			.attr("height", that.height)
			.attr("width", that.width);

		// create interface
		d3.select("svg")
			.append("g")
			.attr("height", that.height)
			.attr("width", that.width)
			.attr("id", "interface")

		// create keys in interface
		d3.select("#interface")
			.selectAll("rect")
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
				return 0.5 * (that.height - keys_height(d));
			})
			.attr("height", function(d) {
				return keys_height(d);
			})
			.classed("key", true)
			.classed("tonic", function(d) { return d % 12 === 0; })
			.classed("stable", function(d) { return d % 12 === 4 || d % 12 === 7; });

		// add keyboard division line to interface
		d3.select("#interface")
			.append("line")
			.attr("x1", 0)
			.attr("x2", that.width)
			.attr("y1", that.height / 2)
			.attr("y2", that.height / 2)
			.attr("stroke", "black");

		//---------------------------------------------------------
		//		NOTE CLICK LISTENER ON KEYS
		//---------------------------------------------------------

		d3.selectAll(".key").on("mousedown", function(d) {

			// collect note properties to play and draw
			var keyboard_name = d3.mouse(this)[1] < (that.height / 2) ? "up" : "low";

			var properties = {
				note: d,
				verb: $("[name=" + keyboard_name + "-verb]").is(":checked"),
				osc: $("[name=" + keyboard_name + "-osc]:checked").val(),
				circle_position: {
					x: d3.mouse(this)[0] / that.width,
					y: d3.mouse(this)[1] / that.height,
				},
				color: that.color,
			}

			// play and draw properties
			audio.play_note(properties);
			that.draw_circle(properties);

			// sending user click to tornado server through websockets
			// data must being sent as string
			ws.send(JSON.stringify(properties));
		});
	},

	draw_circle: function (properties) {

		var that = this;  // important in order to use "that" in functions

		d3.select("svg").append("circle")
			.attr("cx", Math.round(properties.circle_position.x * that.width))
			.attr("cy", Math.round(properties.circle_position.y * that.height))
			.attr("r", 3)
			.attr("fill", properties.color)
			.attr("opacity", 1)
			.transition()
			.duration(500)
			.attr("r", 60)
			.attr("opacity", 0)
			.remove();
	},
}

gui.init();

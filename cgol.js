const game_area = document.getElementById("game_area");
const controls = document.getElementById("controls");
const controls_drag = document.getElementById("controls_drag");
const step_time_slider = document.getElementById("step_time_slider");
const scale_slider = document.getElementById("scale_slider");
const toggle_run_button = document.getElementById("toggle_run_button");

const gl = game_area.getContext("webgl2", { preserveDrawingBuffer: true });
// FIXME: should error-check gl
const texture = gl.createTexture();
const position_buffer = gl.createBuffer();
const texture_coord_buffer = gl.createBuffer(); // TODO: rm
let vertex_position_location;
let screen_texture_location;
let texture_coord_location; // TODO: rm

let run = true;
let step_time = step_time_slider.value;
let scale = scale_slider.value;
let drag_controls = false;


function readPixels() {
	const buffer = new Uint8Array(game_area.width * game_area.height * 4);
	gl.readPixels(0, 0, game_area.width, game_area.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

	return buffer;
}

function makePixelLive(buffer_image, row, col) { // FIXME: make work with WebGL
	buffer_image.data[row * (game_area.width * 4) + col * 4] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 1] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 2] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 3] = 255;
}

function makePixelDead(buffer_image, row, col) { // FIXME: make work with WebGL
	buffer_image.data[row * (game_area.width * 4) + col * 4] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 1] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 2] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 3] = 0;
}

function draw() {
	// TODO: look through everything in here and see if we can stick some things in initWebGL to run once instead of on every draw
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0); // TODO: do we need this?
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
	gl.vertexAttribPointer(
		vertex_position_location, // index
		2, // size
		gl.FLOAT, // type
		false, // normalized
		0, // stride
		0 // offset
	);
	gl.enableVertexAttribArray(vertex_position_location);

	/* TODO: rm */
	gl.bindBuffer(gl.ARRAY_BUFFER, texture_coord_buffer);
	gl.vertexAttribPointer(
		texture_coord_location, // index
		2, // size
		gl.FLOAT, // type
		false, // normalized
		0, // stride
		0 // offset
	);
	gl.enableVertexAttribArray(texture_coord_location);
	/**/

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.uniform1i(screen_texture_location, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function step() {
	if (run) draw();
	setTimeout(step, step_time);
}

function toggle_run() {
	run = !run;

	toggle_run_button.innerText = run ? "Pause" : "Unpause";
}

function setPixel(e) { // FIXME: make work with WebGL
	if (drag_controls) return;

	function setPixelState(stateFunc) {
		stateFunc(game_area_image, Math.floor((e.clientY + window.scrollY) / scale), Math.floor((e.clientX + window.scrollX) / scale));
	}

	const game_area_image = readPixels(); // TODO: maybe just read the one pixel...

	if (e.buttons & 1) setPixelState(makePixelLive);
    if (e.buttons & 2) setPixelState(makePixelDead);

	if (e.touches) {
		let row = Math.floor((e.touches[0].clientY + window.scrollY) / scale);
		let col = Math.floor((e.touches[0].clientX + window.scrollX) / scale);

		if (game_area_image.data[row * (game_area.width * 4) + col * 4]) {
			makePixelDead(game_area_image, row, col);
		} else {
			makePixelLive(game_area_image, row, col);
		}
	}

	//gl.putImageData(game_area_image, 0, 0);
}

function createTexture() {
	gl.texImage2D(
		gl.TEXTURE_2D, // target
		0, // level
		gl.RGBA, // internal format
		//game_area.width, // width // TODO: uncomment
		//game_area.height, // height // TODO: uncomment
		4, 4, // TODO: rm
		0, // border
		gl.RGBA, // source format
		gl.UNSIGNED_BYTE, // source type
		//new Uint8Array(game_area.width * game_area.height * 4) // source data // TODO: uncomment
		/* TODO: rm */
		new Uint8Array([
			0, 0, 0, 255,       255, 0, 0, 255,     255, 255, 0, 255,       0, 255, 0, 255,
			0, 255, 255, 255,   0, 0, 255, 255,     255, 0, 255, 255,       255, 255, 255, 255,
			0, 127, 127, 255,   0, 0, 127, 255,     127, 0, 127, 255,       127, 127, 127, 255,
			0, 0, 0, 255,       127, 0, 0, 255,     127, 127, 0, 255,       0, 127, 0, 255,
		])
		/**/
	);
}

function initWebGL(vsh, fsh) {
	function loadShader(type, source) {
		const shader = gl.createShader(type);

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log("Issue compiling shader:\n" + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);

			return null;
		}

		return shader;
	}

	if (vsh === null) {
		console.log("Issue reading vertex shader");
		return false;
	}
	if (fsh === null) {
		console.log("Issue reading fragment shader");
		return false;
	}

	const vertex_shader = loadShader(gl.VERTEX_SHADER, vsh);
	const fragment_shader = loadShader(gl.FRAGMENT_SHADER, fsh);

	const shader_program = gl.createProgram();
	gl.attachShader(shader_program, vertex_shader);
	gl.attachShader(shader_program, fragment_shader);
	gl.linkProgram(shader_program);
	if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
		console.log("Issue initializing shader program:\n" + gl.getProgramInfoLog(shader_program));
		return;
	}

	vertex_position_location = gl.getAttribLocation(shader_program, "vertex_position");
	texture_coord_location = gl.getAttribLocation(shader_program, "texture_coord"); // TODO: rm
	screen_texture_location = gl.getUniformLocation(shader_program, "screen_texture");

	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 1.0,
			-1.0, 1.0,
			1.0, -1.0,
			-1.0, -1.0
		]), gl.STATIC_DRAW);

	/* TODO: rm */ 
	gl.bindBuffer(gl.ARRAY_BUFFER, texture_coord_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 0.0,
			0.0, 0.0,
			1.0, 1.0,
			0.0, 1.0
		]), gl.STATIC_DRAW);
	/**/

	// do we want to do gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); ?

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.useProgram(shader_program);

	return true;
}

function resizeCanvas() {
	//const game_area_image = readPixels(); // TODO: preserve pixels by copying into new resized texture maybe?
	game_area.width = window.innerWidth;
	game_area.height = window.innerHeight;
	// TODO: change texture size I think, idk yet (maybe something with createTexture)

	gl.viewport(0, 0, game_area.width, game_area.height);

	createTexture();

	draw();
	//gl.putImageData(game_area_image, 0, 0);

	game_area.style.height = (game_area.height * scale) + "px";
}


controls_drag.addEventListener("mousedown", () => {
	drag_controls = true;
});

document.addEventListener("mouseup", () => {
	drag_controls = false;
});

document.addEventListener("mousemove", (e) => {
	if (drag_controls) {
		controls.style.top = (controls.offsetTop + e.movementY) + "px";
		controls.style.left = (controls.offsetLeft + e.movementX) + "px";
	}
});

toggle_run_button.addEventListener("click", toggle_run);
toggle_run();

step_time_slider.addEventListener("change", () => {
	step_time = step_time_slider.value;
});

scale_slider.addEventListener("change", () => {
	scale = scale_slider.value;
	game_area.style.height = (game_area.height * scale) + "px";
});

game_area.addEventListener("mousemove", setPixel);
game_area.addEventListener("mousedown", setPixel);
game_area.addEventListener("touchstart", setPixel);


gl.bindTexture(gl.TEXTURE_2D, texture);

Promise.all([
	fetch("cgol.vsh").then((res) => (res.ok ? res.text() : null)),
	fetch("cgol.fsh").then((res) => (res.ok ? res.text() : null))
]).then((shader_sources) => {
	initWebGL(shader_sources[0], shader_sources[1]);

	resizeCanvas();
	// TODO: error-checking?
	window.addEventListener("resize", resizeCanvas /* TODO: maybe error-checking in here too */);

	//step(); // TODO: uncomment; commented for now while testing
});

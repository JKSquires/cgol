const game_area = document.getElementById("game_area");
const controls = document.getElementById("controls");
const controls_drag = document.getElementById("controls_drag");
const step_time_slider = document.getElementById("step_time_slider");
const scale_slider = document.getElementById("scale_slider");
const toggle_run_button = document.getElementById("toggle_run_button");

const gl = game_area.getContext("webgl2", { preserveDrawingBuffer: true });
// FIXME: should error-check gl

const tex_info = {
	target: gl.TEXTURE_2D,
	level: 0,
	format: gl.RGBA,
	type: gl.UNSIGNED_BYTE
};

let texture = gl.createTexture();
let texture_buffer = gl.createTexture();
const frame_buffer = gl.createFramebuffer();
const position_buffer = gl.createBuffer();
let vertex_position_location;
let screen_texture_location;
let draw_next_location;

let run = true;
let step_time = step_time_slider.value;
let scale = scale_slider.value;
let drag_controls = false;


function readPixels() {
	const buffer = new Uint8Array(game_area.width * game_area.height * 4);
	gl.readPixels(0, 0, game_area.width, game_area.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

	return buffer;
}

function updateTexturePixel(x, y, rgba) {
	const src_data = new Uint8Array(rgba);

	gl.texSubImage2D(
		tex_info.target,
		tex_info.level,
		x,
		y,
		1, // width
		1, // height
		tex_info.format,
		tex_info.type,
		src_data
	);

	draw(false);
}

function makePixelLive(row, col) {
	updateTexturePixel(col, row, [255, 255, 255, 255]);
}

function makePixelDead(row, col) {
	updateTexturePixel(col, row, [0, 0, 0, 0]);
}

function draw(do_step) {
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

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(tex_info.target, texture);

	gl.uniform1i(screen_texture_location, 0);
	gl.uniform1i(draw_next_location, run);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	if (run && do_step) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex_info.target, texture_buffer, 0);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		[texture, texture_buffer] = [texture_buffer, texture];
	}
}

function step() {
	draw(true);
	setTimeout(step, step_time);
}

function toggle_run() {
	run = !run;

	toggle_run_button.innerText = run ? "Pause" : "Unpause";
}

function setPixel(e) {
	if (drag_controls) return;

	function setPixelState(stateFunc) {
		stateFunc(Math.floor(game_area.height - ((e.clientY + window.scrollY) / scale)), Math.floor((e.clientX + window.scrollX) / scale));
	}

	if (e.buttons & 1) setPixelState(makePixelLive);
    if (e.buttons & 2) setPixelState(makePixelDead);

	if (e.touches) {
		let row = Math.floor(game_area.height - ((e.clientY + window.scrollY) / scale));
		let col = Math.floor((e.touches[0].clientX + window.scrollX) / scale);

		if (game_area_image.data[row * (game_area.width * 4) + col * 4]) {
			makePixelDead(row, col);
		} else {
			makePixelLive(row, col);
		}
	}
}

function createTexture() {
	gl.bindTexture(tex_info.target, texture);
	gl.texImage2D(
		tex_info.target,
		tex_info.level,
		tex_info.format, // internal format
		game_area.width, // width
		game_area.height, // height
		0, // border
		tex_info.format, // source format
		tex_info.type, // source type
		new Uint8Array(game_area.width * game_area.height * 4) // source data
	);
	gl.texParameteri(tex_info.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(tex_info.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(tex_info.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(tex_info.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.bindTexture(tex_info.target, texture_buffer);
	gl.texImage2D(
		tex_info.target,
		tex_info.level,
		tex_info.format, // internal format
		game_area.width, // width
		game_area.height, // height
		0, // border
		tex_info.format, // source format
		tex_info.type, // source type
		null // source data
	);
	gl.texParameteri(tex_info.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(tex_info.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(tex_info.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(tex_info.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.bindTexture(tex_info.target, texture);
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
	draw_next_location = gl.getUniformLocation(shader_program, "draw_next");

	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 1.0,
			-1.0, 1.0,
			1.0, -1.0,
			-1.0, -1.0
		]), gl.STATIC_DRAW);

	gl.useProgram(shader_program);

	return true;
}

function resizeCanvas(e) {
	const initial = (e === null);

	let use_width;
	let use_height;
	let pixel_buffer;
	if (!initial) {
		use_width = Math.min(game_area.width, window.innerWidth);
		use_height = Math.min(game_area.height, window.innerHeight);

		pixel_buffer = new Uint8Array(use_width * use_height * 4);
		gl.readPixels(0, 0, use_width, use_height, tex_info.format, tex_info.type, pixel_buffer); // TODO: crop bottom y instead
	}

	game_area.width = window.innerWidth;
	game_area.height = window.innerHeight;
	gl.viewport(0, 0, game_area.width, game_area.height);

	createTexture(); // TODO: save data from previous texture

	if (!initial) {
		gl.texSubImage2D(
			tex_info.target,
			tex_info.level,
			0, // x offset
			0, // y offset // TODO: place image at screen top instead of screen bottom
			use_width,
			use_height,
			tex_info.format,
			tex_info.type,
			pixel_buffer
		);
	}

	draw(false);

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


gl.bindTexture(tex_info.target, texture);

Promise.all([
	fetch("cgol.vsh").then((res) => (res.ok ? res.text() : null)),
	fetch("cgol.fsh").then((res) => (res.ok ? res.text() : null))
]).then((shader_sources) => {
	initWebGL(shader_sources[0], shader_sources[1]);

	resizeCanvas(null);
	// TODO: error-checking?
	window.addEventListener("resize", resizeCanvas /* TODO: maybe error-checking in here too */);

	step();
});

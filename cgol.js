const game_area = document.getElementById("game_area");

const game_area_context = game_area.getContext("2d");
let run = true;
let step_time = 333;


function makePixelLive(buffer_image, row, col) {
	buffer_image.data[row * (game_area.width * 4) + col * 4] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 1] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 2] = 255;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 3] = 255;
}

function makePixelDead(buffer_image, row, col) {
	buffer_image.data[row * (game_area.width * 4) + col * 4] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 1] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 2] = 0;
	buffer_image.data[row * (game_area.width * 4) + col * 4 + 3] = 0;
}

function togglePixel(row, col) {
	const game_area_image = game_area_context.getImageData(0, 0, game_area.width, game_area.height);

	if (game_area_image.data[row * (game_area.width * 4) + col * 4]) makePixelDead(game_area_image, row, col);
	else makePixelLive(game_area_image, row, col);

	game_area_context.putImageData(game_area_image, 0, 0);
}

function draw() {
	const game_area_image = game_area_context.getImageData(0, 0, game_area.width, game_area.height);
	const buffer_image = game_area_context.createImageData(game_area_image);

	let i = 0;
	for (let col = 0; col < game_area.width; col++) {
		for (let row = 0; row < game_area.height; row++) {
			let is_live = (game_area_image.data[row * (game_area.width * 4) + col * 4] != 0);

			let count_live = 0;
			for (let c_col = -1; c_col <= 1; c_col++) {
				for (let c_row = -1; c_row <= 1; c_row++) {
					if (c_col == 0 && c_row == 0) continue;
					if (col + c_col < 0 || col + c_col >= game_area.width || row + c_row < 0 || row + c_row >= game_area.height) continue;
					if (game_area_image.data[(row + c_row) * (game_area.width * 4) + (col + c_col) * 4]) count_live++;
				}
			}
			if (count_live == 3 || (is_live && count_live == 2)) makePixelLive(buffer_image, row, col);
		}
	}

	game_area_context.putImageData(buffer_image, 0, 0);
}

function resizeCanvas() {
	game_area.width = window.innerWidth;
	game_area.height = window.innerHeight;

	draw();
}

function step() {
	if (run) draw();
	setTimeout(step, step_time);
}


resizeCanvas();
window.addEventListener("resize", resizeCanvas);

step();


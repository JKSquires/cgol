#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D screen_texture;

out highp vec4 fragColor;

void main() {
	ivec2 tex_size = textureSize(screen_texture, 0);
	ivec2 tex_coord = ivec2(gl_FragCoord.xy);

	bool is_live = (texelFetch(screen_texture, tex_coord, 0).a == 1.0);

	uint count_live = 0;
	for (int col = -1; col <= 1; col++) {
		for (int row = -1; row <= 1; row++) {
			ivec2 neighbor = (tex_coord + ivec2(col, row)) % tex_size;

			//if (neighbor.x < 0 || neighbor.x >= tex_size.x || neighbor.y < 0 || neighbor.y >= tex_size.y) continue;
			if (col == 0 && row == 0) continue;

			if (texelFetch(screen_texture, neighbor, 0).a == 1.0) count_live++;
		}
	}

	fragColor = (count_live == 3 || (is_live && count_live == 2)) ? vec4(1.0) : vec4(0.0); // TODO: might be better to use R8 texture if possible
}

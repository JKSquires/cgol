#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D screen_texture;
uniform bool draw_next;

out highp vec4 fragColor;

void main() {
	ivec2 tex_size = textureSize(screen_texture, 0);
	ivec2 tex_coord = ivec2(gl_FragCoord.x, tex_size.y - int(gl_FragCoord.y));
	if (draw_next) {
		bool is_live = (texelFetch(screen_texture, tex_coord, 0).a == 1.0);

		int count_live = 0;
		for (int col = 0; col < 3; col++) {
			for (int row = 0; row < 3; row++) {
				ivec2 neighbor = (tex_coord + ivec2(col, row) - ivec2(1)) % tex_size;

				//if (neighbor.x < 0 || neighbor.x >= tex_size.x || neighbor.y < 0 || neighbor.y >= tex_size.y) continue;
				if (col == 1 && row == 1) continue;

				if (texelFetch(screen_texture, neighbor, 0).a == 1.0) count_live++;
			}
		}

		fragColor = (count_live == 3 || (is_live && count_live == 2)) ? vec4(1.0) : vec4(0.0); // TODO: might be better to use R8 texture if possible
	} else {
		fragColor = texture(screen_texture, vec2(tex_coord) / vec2(tex_size));
	}
}

#version 300 es

in vec4 vertex_position;
in vec2 texture_coord; // TODO: rm

out highp vec2 tc; // TODO: rm

void main() {
	gl_Position = vertex_position;
	tc = texture_coord; // TODO: rm
}

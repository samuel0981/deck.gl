export default `
#define SHADER_NAME bitmap-layer-vertex-shader

attribute vec2 texCoords;

// four vertices of an arbitrary quadrilateral
uniform vec3 leftBottom;
uniform vec3 rightBottom;
uniform vec3 rightTop;
uniform vec3 leftTop;

varying vec2 vTexCoord;

void main(void) {
  // quadrilateral interpolation
  vec3 p0 = mix(leftBottom, rightBottom, texCoords.x);
  vec3 p1 = mix(leftTop, rightTop, texCoords.x);
  vec3 position = mix(p0, p1, texCoords.y);
 
  gl_Position = project_position_to_clipspace(vec3(position.xy, 0.0), vec2(0.0), vec3(0.0));
 
  vTexCoord = texCoords;
 
  picking_setPickingColor(vec3(0., 0., 1.));
}
`;

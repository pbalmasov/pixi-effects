precision mediump float;
      
const float PI = 3.141592653589793;
const float PIh = 1.5707963267948966;
const float PI2 = 6.283185307179586;

attribute vec2 aVertexPosition;
attribute vec2 aUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2 vUvs;
varying float progress;
uniform float time;
uniform float offset;

void main() {

  vUvs = aUvs;
  progress =  max( 0.0, min( 1.0, time * (1.0 + offset) - vUvs.y * offset) );
  float t = PIh - progress * PI;

  float rot_pos_x = sin( t );
  float vx = aVertexPosition.x * rot_pos_x;
  float rot_pos_y = 1.0 + cos( t ) * ( (vUvs.x - 0.5) * 0.4 );
  float vy = aVertexPosition.y * rot_pos_y;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(vx, vy, 1.0)).xy, 0.0, 1.0);
}
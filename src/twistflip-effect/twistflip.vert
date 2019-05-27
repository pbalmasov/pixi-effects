precision mediump float;

const float PI = 3.141592653589793;
const float PIh = 1.5707963267948966;

attribute vec2 aVertexPosition;
attribute vec2 aUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2 vUvs;
varying float progress;
uniform float value;
uniform float offset;

void main() {

  vUvs = aUvs;
  progress =  max( 0.0, min( 1.0, value * (1.0 + offset) - vUvs.y * offset) );
  float t = PIh - progress * PI;

  float rotationPosX = sin( t );
  float rotationPosY = 1.0 + cos( t ) * ( (vUvs.y - 0.5) * 0.4 );
  float vx = aVertexPosition.x * rotationPosY;
  float vy = aVertexPosition.y * rotationPosX;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(vx, vy, 1.0)).xy, 0.0, 1.0);
}

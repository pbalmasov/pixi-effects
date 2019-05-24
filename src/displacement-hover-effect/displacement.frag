varying vec2 vTextureCoord;

uniform float value;
uniform sampler2D displacementTexture;

uniform sampler2D firstTexture;
uniform sampler2D secondTexture;
uniform float angle1;
uniform float angle2;
uniform float intensity1;
uniform float intensity2;

mat2 getRotM(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec4 disp = texture2D(displacementTexture, vTextureCoord);
  vec2 dispVec = vec2(disp.r, disp.g);
  vec2 distortedPosition1 = vTextureCoord + getRotM(angle1) * dispVec * intensity1 * value;
  vec2 distortedPosition2 = vTextureCoord + getRotM(angle2) * dispVec * intensity2 * (1.0 - value);
  vec4 _texture1 = texture2D(firstTexture, distortedPosition1);
  vec4 _texture2 = texture2D(secondTexture, distortedPosition2);
  gl_FragColor = mix(_texture1, _texture2, value);
//  gl_FragColor = texture2D(displacementTexture,vTextureCoord);
//  gl_FragColor = vec4(1.0,0.0,1.0,1.0);
}

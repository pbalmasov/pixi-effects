precision mediump float;

const float PI = 3.141592653589793;
const float PIh = 1.5707963267948966;

varying vec2 vUvs;
varying float progress;

uniform sampler2D frontTexture;
uniform sampler2D backTexture;
uniform bool isFront;

void main() {
    vec2 _vUvs = vUvs;
    vec4 col;

    float t = PIh - progress * PI;
    float rotationPosX = sin( t );
    bool isBack = rotationPosX * vUvs.x < 0.0;
    if(isBack) {
      _vUvs.y = abs( vUvs.y - 1.0 );
      col = isFront ? texture2D( backTexture, _vUvs ) : texture2D( frontTexture, _vUvs );
    } else
      col = isFront ? texture2D( frontTexture, _vUvs ) : texture2D( backTexture, _vUvs );
    float coef = -(progress - 0.5);
    coef = 1.0 + (coef > 0.0 ? (0.5 - coef) * 0.5 : (-0.5 - coef) * 1.5 );
    gl_FragColor = col;
}

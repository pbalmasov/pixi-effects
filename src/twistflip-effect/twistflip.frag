precision mediump float;

varying vec2 vUvs;
varying float progress;

uniform sampler2D frontTexture;
uniform sampler2D backTexture;
uniform bool isFront;

void main() {
    vec2 _vUvs = vUvs;
    vec4 col;

    if( progress < 0.5 ){
      col = isFront ? texture2D( frontTexture, _vUvs ) : texture2D( backTexture, _vUvs );
    }else{
      _vUvs.x = abs( vUvs.x - 1.0 );
      col = isFront ? texture2D( backTexture, _vUvs ) : texture2D( frontTexture, _vUvs );
    }
    float coef = -(progress - 0.5);
    coef = 1.0 + (coef > 0.0 ? (0.5 - coef) * 0.5 : (-0.5 - coef) * 1.5 );
    gl_FragColor = vec4( vec3( col * coef ), 1.0 );
}

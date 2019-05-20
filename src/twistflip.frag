precision mediump float;

varying vec2 vUvs;
varying float progress;

uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform bool isFront;

void main() {
    vec2 _vUvs = vUvs;
    vec4 col;

    if( progress < 0.5 ){
      col = isFront ? texture2D( uSampler1, _vUvs ) : texture2D( uSampler2, _vUvs );
    }else{
      _vUvs.x = abs( vUvs.x - 1.0 );
      col = isFront ? texture2D( uSampler2, _vUvs ) : texture2D( uSampler1, _vUvs );
    }
    float coef = -(progress - 0.5);
    coef = 1.0 + (coef > 0.0 ? (0.5 - coef) * 0.5 : (-0.5 - coef) * 1.5 );
    gl_FragColor = vec4( vec3( col * coef ), 1.0 );
}

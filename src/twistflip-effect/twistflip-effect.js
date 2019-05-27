import vertex from './twistflip.vert';
import frag from './twistflip.frag';
import { Application, Shader, Loader, Mesh, Geometry } from 'pixi.js';
import { TweenLite } from 'gsap/TweenLite';
import { Sine } from 'gsap/EasePack';

export class FlipSprite extends Mesh {
  constructor(
    width,
    height,
    frontTexture,
    backTexture,
    { widthSegments = 5, heightSegments = 20, isFront = true, offset = 0.2 },
  ) {

    const shader = Shader.from(vertex, frag, {
      frontTexture,
      backTexture,
      isFront,
      value: 0,
      offset,
    });

    const positions = [];
    const uvs = [];
    const indices = [];

    const stepX = Math.round(width / widthSegments);
    const stepY = Math.round(height / heightSegments);
    const stepU = 1 / widthSegments;
    const stepV = 1 / heightSegments;
    const wh = width / 2;
    const hh = height / 2;

    for (let _y = 0; _y < heightSegments; _y++) {
      for (let _x = 0; _x < widthSegments; _x++) {
        const index = positions.length / 2;
        const x = -wh + _x * stepX;
        const y = -hh + _y * stepY;
        positions.push(x, y, x + stepX, y, x + stepX, y + stepY, x, y + stepY);
        const u = _x * stepU;
        const v = _y * stepV;
        uvs.push(u, v, u + stepU, v, u + stepU, v + stepV, u, v + stepV);
        indices.push(index, index + 1, index + 2, index, index + 2, index + 3);
      }
    }
    super(
      new Geometry()
        .addAttribute('aVertexPosition', positions, 2)
        .addAttribute('aUvs', uvs, 2)
        .addIndex(indices)
        .interleave(),
      shader,
    );
  }

  setTextures(frontTexture, backTexture) {
    this.shader.uniforms.frontTexture = frontTexture;
    this.shader.uniforms.backTexture = backTexture;
  }

  reverse() {
    this.shader.uniforms.isFront = !this.shader.uniforms.isFront;
    this.shader.uniforms.value = 0;
  }

  flip(duration = 1, offset, onComplete) {
    if (this.flipTween && this.flipTween.isActive()) return this.flipTween;
    if (offset !== undefined) this.shader.uniforms.offset = offset;
    this.flipTween = TweenLite.to(this.shader.uniforms, duration, {
      value: 1,
      ease: Sine.easeInOut,
      onComplete: () => {
        this.reverse();
        if (onComplete) onComplete();
      },
    });
    return this.flipTween;
  }
}

export class FlipPIXIApplication extends Application {
  constructor(view, appOptions, options) {
    const { clientWidth, clientHeight } = view;
    super({
      autoStart: false,
      width: clientWidth,
      height: clientHeight,
      autoResize: true,
      antialias: true,
      transparent: true,
      resolution: devicePixelRatio,
      ...appOptions,
    });
    const { frontImage, backImage } = options;
    this.options = options;

    const loader = new Loader();
    loader.onError.add(e => console.error(e));
    loader.onComplete.add(this.initFilter.bind(this));
    loader.add('front', frontImage);
    loader.add('back', backImage);
    loader.load();

    view.style.position = 'relative';
    const { style } = this.view;
    style.position = 'absolute';
    style.top = style.left = style.bottom = style.right = 0;
    view.appendChild(this.view);

    this.onResize = this.onResize.bind(this);
    this.onFlipClick = this.onFlipClick.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  initFilter({ resources: { front: { texture: front }, back: { texture: back } } }) {
    this.flipSprite = new FlipSprite(this.options.width || front.orig.width, this.options.height || front.orig.height, front, back, this.options);
    this.view.addEventListener('click', this.onFlipClick);
    this.view.addEventListener('tap', this.onFlipClick);
    this.stage.addChild(this.flipSprite);
    this.resizeSprite(this.flipSprite);
    this.render();
  }

  onResize() {
    const parent = this.view.parentNode;
    this.renderer.resize(parent.clientWidth, parent.clientHeight);
    this.resizeSprite(this.flipSprite);
    this.render();
  }

  onFlipClick() {
    this.flipSprite.flip(this.options.duration).vars.onUpdate = () => this.render();
  }

  resizeSprite(flipSprite) {
    flipSprite.position.set(Math.floor(this.screen.width / 2), Math.floor(this.screen.height / 2));
    const scale = Math.min(this.screen.width / flipSprite.width, (this.screen.height * 0.8) / flipSprite.height);
    flipSprite.scale.set(scale);
  }

  destroy(removeView, stageOptions) {
    this.options = null;
    this.view.removeEventListener('click', this.onFlipClick);
    this.view.removeEventListener('tap', this.onFlipClick);
    window.removeEventListener('resize', this.onResize);
    this.onResize = null;
    this.onFlipClick = null;
    super.destroy(removeView, stageOptions);
  }
}

export function createFlipPIXIApplication(view, appOptions, options) {
  if (!view) {
    console.error('View variable not defined');
    return;
  }
  if (!options) {
    console.error('Options not defined');
    return;
  }
  const { frontImage, backImage } = options;
  if (!frontImage || !backImage) {
    console.error('Both images not defined');
    return;
  }

  return new FlipPIXIApplication(view, appOptions, options);
}

window.createFlipPIXIApplication = createFlipPIXIApplication;

document.querySelectorAll('[data-twistflip-effect]').forEach(item => {
  const { appOptions, options } = JSON.parse(item.dataset.twistflipEffect);
  createFlipPIXIApplication(item, appOptions, options);
});

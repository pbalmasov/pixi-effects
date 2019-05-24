import vert from './displacement.vert';
import frag from './displacement.frag';
import { Application, Shader, Loader, Mesh, Geometry, utils, MeshMaterial, defaultVertex } from 'pixi.js';
import { TweenLite } from 'gsap/TweenLite';
import { Sine } from 'gsap/EasePack';

console.log(defaultVertex);

export class DisplacementSprite extends Mesh {

  constructor(
    width,
    height,
    firstTexture,
    secondTexture,
    displacementTexture,
    { widthSegments = 5, heightSegments = 20, angle1 = 45, angle2 = 45, intensity1 = 1, intensity2 = 1 },
  ) {

    const shader = Shader.from(vert, frag, {
      firstTexture,
      secondTexture,
      displacementTexture,
      angle1: angle1 / 180 * Math.PI,
      angle2: angle2 / 180 * Math.PI,
      intensity1,
      intensity2,
      value: 0,
    }, "displacement");

    const wh = width / 2;
    const hh = height / 2;
    super(
      new Geometry()
        .addAttribute('aVertexPosition', [-wh, -hh,
          wh, -hh, // x, y
          wh, hh,
          -wh, hh], 2)
        .addAttribute('aTextureCoord', [
          0, 0,
          1, 0,
          1, 1,
          0, 1 ], 2)
        .addIndex([0, 1, 2, 0, 2, 3])
        .interleave(), shader,
    );
    this.isSwaped = false;
  }

  swap(duration = 1, onComplete) {
    this.isSwaped = !this.isSwaped;
    this.swapTween && this.swapTween.kill();
    this.swapTween = TweenLite.to(this.shader.uniforms, duration, {
      value: +this.isSwaped,
      ease: Sine.easeInOut,
      onComplete,
    });
    return this.swapTween;
  }
}

export class DisplacementPIXIApplication extends Application {
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
    const { image1, image2, displacementImage } = options;
    this.options = options;

    const loader = new Loader();
    loader.onError.add(e => console.error(e));
    loader.onComplete.add(this.initFilter.bind(this));
    loader.add('first', image1);
    loader.add('second', image2);
    loader.add('displacementImage', displacementImage);
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

  initFilter({
               resources: {
                 displacementImage: { texture: displacementImage },
                 first: { texture: first },
                 second: { texture: second },
               },
             }) {
    this.displacementSprite = new DisplacementSprite(this.options.width || first.orig.width, this.options.height || first.orig.height, first, second, displacementImage, this.options);
    this.view.addEventListener('pointerup', this.onFlipClick);
    this.stage.addChild(this.displacementSprite);
    this.resizeSprite(this.displacementSprite);
    this.render();
  }

  onResize() {
    const parent = this.view.parentNode;
    this.renderer.resize(parent.clientWidth, parent.clientHeight);
    this.resizeSprite(this.displacementSprite);
    this.render();
  }

  onFlipClick() {
    this.displacementSprite.swap(this.options.swapDuration).vars.onUpdate = () => this.render();
  }

  resizeSprite(displacementSprite) {
    displacementSprite.position.set(this.screen.width / 2, this.screen.height / 2);
    const scale = Math.min(this.screen.width / displacementSprite.width, this.screen.height / displacementSprite.height);
    displacementSprite.scale.set(scale);
  }

  destroy(removeView, stageOptions) {
    this.options = null;
    this.view.removeEventListener('pointerup', this.onFlipClick);
    window.removeEventListener('resize', this.onResize);
    this.onResize = null;
    this.onFlipClick = null;
    super.destroy(removeView, stageOptions);
  }
}

export function createDisplacementPIXIApplication(view, appOptions, options) {
  if (!view) {
    console.error('View variable not defined');
    return;
  }
  if (!options) {
    console.error('Options not defined');
    return;
  }
  const { image1, image2, displacementImage } = options;
  if (!image1 || !image2 || !displacementImage) {
    console.error('Both images not defined');
    return;
  }

  return new DisplacementPIXIApplication(view, appOptions, options);
}

window.createDisplacementPIXIApplication = createDisplacementPIXIApplication;

document.querySelectorAll('[data-displacement-effect]').forEach(item => {
  const { appOptions, options } = JSON.parse(item.dataset.displacementEffect);
  createDisplacementPIXIApplication(item, appOptions, options);
});

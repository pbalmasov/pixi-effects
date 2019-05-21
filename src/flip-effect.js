import vertex from "./twistflip.vert";
import frag from "./twistflip.frag";
import { Application, Shader, Loader, Mesh, Geometry } from "pixi.js";
import { TweenLite } from "gsap/TweenLite";
import { Sine } from "gsap/EasePack";

export class FlipSprite extends Mesh {
  constructor(width, height, frontTexture, backTexture, { widthSegments = 5, heightSegments = 20, isFront = true, offset = 0.2 }) {
    const shader = Shader.from(vertex, frag,
      {
        frontTexture,
        backTexture,
        isFront,
        time: 0,
        offset,
      });

    const positions = [];
    const uvs = [];
    const indices = [];

    const stp_x = width / widthSegments;
    const stp_y = height / heightSegments;
    const stp_u = 1 / widthSegments;
    const stp_v = 1 / heightSegments;
    const wh = width / 2;
    const hh = height / 2;

    for (let _y = 0; _y < heightSegments; _y++) {
      for (let _x = 0; _x < widthSegments; _x++) {
        const ind = positions.length / 2;
        const x = -wh + _x * stp_x;
        const y = -hh + _y * stp_y;
        positions.push(x, y, x + stp_x, y, x + stp_x, y + stp_y, x, y + stp_y);
        const u = _x * stp_u;
        const v = _y * stp_v;
        uvs.push(u, v, u + stp_u, v, u + stp_u, v + stp_v, u, v + stp_v);
        indices.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3);
      }
    }
    super(new Geometry()
      .addAttribute('aVertexPosition', positions, 2)
      .addAttribute('aUvs', uvs, 2)
      .addIndex(indices)
      .interleave(), shader);
    this.texture = frontTexture;
    this.offset = offset;
  }

  setTextures(frontTexture, backTexture) {
    this.shader.uniforms.frontTexture = frontTexture;
    this.shader.uniforms.backTexture = backTexture;
  }

  reverse() {
    this.shader.uniforms.isFront = !this.shader.uniforms.isFront;
    this.shader.uniforms.time = 0;
  }

  flip(duration = 1, offset, onComplete) {
    if (this.flipTween && this.flipTween.isActive())
      return this.flipTween;
    if (offset !== undefined) this.shader.uniforms.offset = offset;
    this.flipTween = TweenLite.to(this.shader.uniforms, duration, {
      time: 1,
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
      resolution: devicePixelRatio, ...appOptions,
    });
    const { frontImage, backImage } = options;
    this.options = options;

    const loader = new Loader();
    loader.onError.add(e => console.error(e));
    loader.onComplete.add(this.initFilter.bind(this));
    loader.add("front", frontImage);
    loader.add("back", backImage);
    loader.load();

    view.style.position = "relative";
    const { style } = this.view;
    style.position = "absolute";
    style.top = style.left = style.bottom = style.right = 0;
    view.appendChild(this.view);

    this.onResize = this.onResize.bind(this);
    this.onFlipClick = this.onFlipClick.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  initFilter({ resources: { front: { texture: front }, back: { texture: back } } }) {
    this.flipSprite = new FlipSprite(front.orig.width, front.orig.height, front, back, this.options);
    this.view.addEventListener("click", this.onFlipClick);
    this.view.addEventListener("tap", this.onFlipClick);
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
    this.flipSprite.flip(this.options.flipDuration).vars.onUpdate = () => this.render();
  }

  resizeSprite(flipSprite) {
    const { orig } = flipSprite.texture;
    flipSprite.position.set(this.screen.width / 2, this.screen.height / 2);
    const scale = Math.min(this.screen.width / orig.width, (this.screen.height * 0.8) / orig.height);
    flipSprite.scale.set(scale);
  }

  destroy(removeView, stageOptions) {
    this.options = null;
    this.view.removeEventListener("click", this.onFlipClick);
    this.view.removeEventListener("tap", this.onFlipClick);
    window.removeEventListener("resize", this.onResize);
    this.onResize = null;
    this.onFlipClick = null;
    super.destroy(removeView, stageOptions);
  }
}

export function createPIXIApplication(view, appOptions, options) {
  if (!view) {
    console.error("View variable not defined");
    return;
  }
  if (!options) {
    console.error("Options not defined");
    return;
  }
  const { frontImage, backImage } = options;
  if (!frontImage || !backImage) {
    console.error("Both images not defined");
    return;
  }

  return new FlipPIXIApplication(view, appOptions, options);
}


window.createPIXIApplication = createPIXIApplication;

document.querySelectorAll("[data-flip-effect]").forEach(item => {
  const { appOptions, options } = JSON.parse(item.dataset.flipEffect);
  createPIXIApplication(item, appOptions, options);
});




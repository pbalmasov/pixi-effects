import vertex from "./twistflip.vert";
import frag from "./twistflip.frag";
import { Application, Shader, Loader, Mesh, Geometry } from "pixi.js";
import { TweenLite, Sine } from "gsap"

export class FlipSprite extends Mesh {
  constructor(width, height, frontTexture, backTexture, isFront = true, offset = 0.2) {
    const shader = Shader.from(vertex, frag,
      {
        uSampler1: frontTexture,
        uSampler2: backTexture,
        isFront: isFront,
        time: 0,
        offset: offset,
      });

    const sx = 5;
    const sy = 20;

    const positions = [];
    const uvs = [];
    const indices = [];

    const stp_x = width / sx;
    const stp_y = height / sy;
    const stp_u = 1 / sx;
    const stp_v = 1 / sy;
    const wh = width / 2;
    const hh = height / 2;

    for (let _y = 0; _y < sy; _y++) {
      for (let _x = 0; _x < sx; _x++) {
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
  }

  reverse() {
    this.shader.uniforms.isFront = !this.shader.uniforms.isFront;
    this.shader.uniforms.time = 0;
  }

  flip(duration = 1, offset, onComplete) {
    if (offset !== undefined) this.shader.uniforms.offset = offset;
    this.time = 0;
    TweenLite.to(this.shader.uniforms, duration, {
      time: 1,
      ease: Sine.easeInOut,
      onComplete: () => {
        this.reverse();
        if (onComplete) onComplete();
      },
    });
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
  const loader = new Loader();
  loader.onError.add(e => console.error(e));
  loader.onComplete.add(initFilter);
  loader.add("front", frontImage);
  loader.add("back", backImage);
  loader.load();

  const { clientWidth, clientHeight } = view;
  const app = new Application({
    width: clientWidth,
    height: clientHeight,
    autoResize: true,
    antialias: true,
    resolution: devicePixelRatio, ...appOptions,
  });
  view.style.position = "relative";
  const { style } = app.view;
  style.position = "absolute";
  style.top = style.left = style.bottom = style.right = 0;
  view.appendChild(app.view);
  window.addEventListener("resize", () => {
    const parent = app.view.parentNode;
    app.renderer.resize(parent.clientWidth, parent.clientHeight);
  });

  function initFilter({ resources: { front: { texture: front }, back: { texture: back } } }) {
    const flipSprite = new FlipSprite(front.orig.width, front.orig.height, front, back);
    app.view.addEventListener("click", () => flipSprite.flip());
    app.stage.addChild(flipSprite);
    // var quad = createFilppingPlane( texture_w, texture_h, texture, texture_back, false);
    // app.stage.addChild(new Sprite(resources.front.texture));
  }

  return app;
}


window.createPIXIApplication = createPIXIApplication;

document.querySelectorAll("[data-flip-effect]").forEach(item => {
  const { appOptions, options } = JSON.parse(item.dataset.flipEffect);
  createPIXIApplication(item, appOptions, options);
});




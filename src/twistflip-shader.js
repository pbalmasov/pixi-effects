import $ from 'jquery';
import vertex from "./twistflip.vert";
import frag from "./twistflip.frag";
//import * as PIXI from 'pixi.js';
// import * as PIXI from 'pixi.min.js';

export function twistFlip()
{
  var preload_checker = setInterval(function(){
    if( PIXI ){
      console.log('preloaded!', PIXI);
      clearInterval(preload_checker);
      init();
    }else{
      
    }
  }, 40);

  function init(){
     
    var CANVAS_WIDTH = 400;
    var CANVAS_HEIGHT = 600;
    const ROTATION_FREQUENCY = 7000;

    var INIT_HEIGHT = CANVAS_HEIGHT;

    var scale = 1;
    var canvasOffset = 70;
    
    //
    var app = new PIXI.Application({width:CANVAS_WIDTH, height:CANVAS_HEIGHT, transparent: true, antialias: true/*, resolution: Window.devicePixelRatio*/});
    //app.renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    var $element = $('.flip-twist-container').append(app.view);
    $element.fadeOut(0);
    app.renderer.plugins.interaction.autoPreventDefault = false;
    app.renderer.view.style.touchAction = 'auto';

    // var img_url = 'https://pixijs.io/examples-v4/examples/assets/flowerTop.png';
    var img_url = 'images/ticket.jpg';
    var back_url = 'images/oborot.jpg';
        
    var loader = PIXI.Loader.shared;
    loader.onComplete.add(onLoad);
    loader.add( img_url );
    loader.add( back_url );
    loader.load();   
    
    function onLoad(a,b){
      var texture = loader.resources[img_url].texture;
      var texture_back = loader.resources[back_url].texture;
      console.log('image', texture );
      
      var texture_w = texture.orig.width;
      var texture_h = texture.orig.height;
         
      var quad = createFilppingPlane( texture_w, texture_h, texture, texture_back, false);
        // quad.position.x = CANVAS_WIDTH/2;
        // quad.position.y = CANVAS_HEIGHT/2;
      //quad.scale.set(1);
      function onResize(){
        CANVAS_WIDTH = $element.width();
        CANVAS_HEIGHT = $element.height();
        quad.scale.set(CANVAS_HEIGHT / texture_h);
        quad.position.x = CANVAS_WIDTH/2;
        let newHeight = CANVAS_HEIGHT+ canvasOffset * 2;
        quad.position.y = newHeight/2;
        app.renderer.resize(CANVAS_WIDTH, newHeight);
        app.view.style.marginTop = - canvasOffset + 'px' ;
        app.ticker.update();
      }

      $(window).resize(onResize)
      onResize();

      app.stage.addChild(quad);
      
      //
      app.ticker.add(function(delta) {
          // quad.rotation += 0.005;
      });

      $element.fadeIn(1000);
      
      app.ticker.update();
      
      var stopAutoRotation = false;

      //обнаружение поворота на скролл
      $(document).on("scroll", scrollDetect);

      function scrollDetect(){
        if ($(document).scrollTop() + window.innerHeight - $element.height()*0.3>$element.offset().top){
          rotate();
          $(document).off("scroll", scrollDetect);
        }
      }
      scrollDetect();

      //вращение по таймеру

      function rotate(){
        let topOffset = $element.offset().top;
        let scroll = $(document).scrollTop();
        if ((scroll > topOffset + $element.height()) || (scroll + window.innerHeight < topOffset)){
          setTimeout(rotate, ROTATION_FREQUENCY);
          return;
        }
          
        if (!stopAutoRotation){
          animate();
          setTimeout(rotate, ROTATION_FREQUENCY);
        }
      }

      //вращение по клику. отключает вращение по таймеру
      $element.on('click touchstart',function(){
        stopAutoRotation = true;
        animate();
      });

      var is_busy = false;
      
      function animate(){
        console.log(quad)
        if( is_busy ) return;
        is_busy = true;
        app.ticker.start();

        quad.flip( 2, .4, function(){
          is_busy = false;
          //app.ticker.stop();
          app.ticker.update();
        });
      }

    }  
    
  //
  };



  // -------------------
  function createFilppingPlane( w, h, t1, t2, side, offset ){
      
      if( side == undefined ) side = true;
    
      const shader = PIXI.Shader.from(vertex,frag,
  {
      uSampler1: t1,
      uSampler2: t2,
      side: side,
      time: 0,
      offset: offset || .2
  });
      
      const geometry = createPlane( w, h, 5, 20 );
      let _time = 0;
    
      let quad = new PIXI.Mesh(geometry, shader);
      
      Object.defineProperty(quad, 'time', {
        get: function() {
          return _time;
        },
        set: function(t) {
          _time = t;
          shader.uniforms.time = t;
        }
      });
    
      quad.reverse = function(){
        shader.uniforms.side = !shader.uniforms.side;
        console.log( shader.uniforms.side );
        shader.uniforms.time = 0;  
        var t = 0;
      }
    
      quad.flip = function( duration, offset, onComplete ){
        if( offset != undefined ) shader.uniforms.offset = offset;
        quad.time = 0.0;
        TweenMax.to(quad, duration || 1,{
          time: 1.0,
          ease: Sine.easeInOut,
          onComplete: function(){
            quad.reverse();
            if( onComplete ) onComplete();
          }
        });
      }
      return quad;
    
  }

  //
  function createPlane(w,h,sx,sy){
    
    var positions = []
    var uvs = [];
    var indices = [];
    
    var stp_x = w/sx;
    var stp_y = h/sy;
    var stp_u = 1/sx;
    var stp_v = 1/sy;
    var wh = w/2;
    var hh = h/2;
    
    for( var _y=0; _y<sy; _y++){
      for( var _x=0; _x<sx; _x++){
        
        var ind = positions.length/2;
        
        var x = -wh + _x * stp_x;
        var y = -hh + _y * stp_y;
        positions.push(...[
          x, y,
          x + stp_x, y,
          x + stp_x, y + stp_y,
          x, y + stp_y,
        ]);
        
        var u = _x * stp_u;
        var v = _y * stp_v;
        uvs.push(...[
          u, v,
          u + stp_u, v,
          u + stp_u, v + stp_v,
          u, v + stp_v,
        ]);
        
        indices.push(...[
          ind+0, ind+1, ind+2, ind+0, ind+2, ind+3
        ]);
      }
    }
    // console.log( 'geo: ', positions, uvs, indices );
     var geometry = new PIXI.Geometry()
      .addAttribute('aVertexPosition', positions, 2)
      .addAttribute('aUvs', uvs, 2)
      .addIndex(indices)
      .interleave();
    
     return geometry;
    
    /*
    var geometry = new PIXI.Geometry()
      .addAttribute('aVertexPosition', // the attribute name
          [-100, -100, // x, y
              100, -100, // x, y
              100, 100,
              -100, 100], // x, y
          2) // the size of the attribute
      .addAttribute('aUvs', // the attribute name
          [0, 0, // u, v
              1, 0, // u, v
              1, 1,
              0, 1], // u, v
          2) // the size of the attribute
      .addIndex([0, 1, 2, 0, 2, 3])
      .interleave();
    */
     
  }
}
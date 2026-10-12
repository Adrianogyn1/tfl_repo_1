(function($){
  $.fn.addDado = function(options){
    const settings = $.extend({
      tamanho: 100,
      velocidadeContinuo: 15,
      alturaPulo: 30,
      tempoParada: 1000,
      callbackFim: null
    }, options);

    // CSS apenas uma vez
    if($('#dadoPluginStyle').length === 0){
      $('head').append(`
        <style id="dadoPluginStyle">
          .cubo { position:relative; transform-style:preserve-3d; }
          .face { position:absolute; background:#fff; border:2px solid #000; border-radius:10px;
                  display:grid; place-items:center; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); }
          .dot { width:12px; height:12px; background:#000; border-radius:50%; justify-self:center; align-self:center; }
          .face1 { transform: rotateY(0deg) translateZ(var(--translateZ)); }
          .face2 { transform: rotateY(90deg) translateZ(var(--translateZ)); }
          .face3 { transform: rotateY(180deg) translateZ(var(--translateZ)); }
          .face4 { transform: rotateY(-90deg) translateZ(var(--translateZ)); }
          .face5 { transform: rotateX(90deg) translateZ(var(--translateZ)); }
          .face6 { transform: rotateX(-90deg) translateZ(var(--translateZ)); }
        </style>
      `);
    }

    const $container = $(this);
    const cubo = $('<div class="cubo"></div>');
    $container.append(cubo);

    const facesHTML = [
      '<div class="face face1"><div class="dot" style="grid-column:2;grid-row:2;"></div></div>',
      '<div class="face face2"><div class="dot" style="grid-column:1;grid-row:1;"></div><div class="dot" style="grid-column:3;grid-row:3;"></div></div>',
      '<div class="face face3"><div class="dot" style="grid-column:1;grid-row:1;"></div><div class="dot" style="grid-column:2;grid-row:2;"></div><div class="dot" style="grid-column:3;grid-row:3;"></div></div>',
      '<div class="face face4"><div class="dot" style="grid-column:1;grid-row:1;"></div><div class="dot" style="grid-column:3;grid-row:1;"></div><div class="dot" style="grid-column:1;grid-row:3;"></div><div class="dot" style="grid-column:3;grid-row:3;"></div></div>',
      '<div class="face face5"><div class="dot" style="grid-column:1;grid-row:1;"></div><div class="dot" style="grid-column:3;grid-row:1;"></div><div class="dot" style="grid-column:2;grid-row:2;"></div><div class="dot" style="grid-column:1;grid-row:3;"></div><div class="dot" style="grid-column:3;grid-row:3;"></div></div>',
      '<div class="face face6"><div class="dot" style="grid-column:1;grid-row:1;"></div><div class="dot" style="grid-column:3;grid-row:1;"></div><div class="dot" style="grid-column:1;grid-row:2;"></div><div class="dot" style="grid-column:3;grid-row:2;"></div><div class="dot" style="grid-column:1;grid-row:3;"></div><div class="dot" style="grid-column:3;grid-row:3;"></div></div>'
    ];
    cubo.append(facesHTML.join(''));

    cubo.css({width:settings.tamanho, height:settings.tamanho});
    cubo.find('.face').css({width:settings.tamanho, height:settings.tamanho, '--translateZ': settings.tamanho/2 + 'px'});

    let rotX=0, rotY=0;
    let continuousRolling=false; // gira infinito
    let stopping=false;          // animando para parar
    let animFrame;

    const faceRotations = [
      {x:0, y:0}, {x:0, y:-90}, {x:180, y:0}, {x:0, y:90}, {x:-90, y:0}, {x:90, y:0}
    ];

    function loop(){
      if(continuousRolling && !stopping){
        rotX += settings.velocidadeContinuo;
        rotY += settings.velocidadeContinuo;
        cubo.css('transform', `translateY(0px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
      }
      requestAnimationFrame(loop);
    }
    loop();

    function start(){
      continuousRolling = true;
      stopping = false;
    }

    function stop(alvo, tempo=settings.tempoParada){
      continuousRolling = false;
      stopping = true;
      cancelAnimationFrame(animFrame);
      if(!alvo) alvo = Math.floor(Math.random()*6) + 1;
      const target = faceRotations[alvo-1];
      const rotations = {x: target.x + 360*3, y: target.y + 360*3};
      const duration = tempo/16;
      let t=0;
      const jumpHeight = settings.alturaPulo;

      function animate(){
        t++;
        const frac = t/duration;
        const posY = -4*jumpHeight*(frac-0.5)*(frac-0.5)+jumpHeight;
        rotX = rotations.x*frac;
        rotY = rotations.y*frac;
        cubo.css('transform', `translateY(${posY}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
        if(t<duration) animFrame=requestAnimationFrame(animate);
        else {
          cubo.css('transform', `translateY(0px) rotateX(${rotations.x}deg) rotateY(${rotations.y}deg)`);
          if(settings.callbackFim) settings.callbackFim(alvo);
          stopping = false; // terminou
        }
      }
      animate();
    }

    function resize(novoTamanho, alturaPulo=10, duracao=30){
      let t=0;
      const inicial = parseFloat(cubo.css('width'));
      function animate(){
        t++;
        const frac = t/duracao;
        const scale = inicial + (novoTamanho-inicial)*frac;
        const jump = -4*alturaPulo*(frac-0.5)*(frac-0.5)+alturaPulo;
        cubo.css({width: scale + 'px', height: scale + 'px'});
        cubo.find('.face').css({width: scale+'px', height: scale+'px', '--translateZ': scale/2+'px'});
        cubo.css('transform', `translateY(${jump}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
        if(t<duracao) requestAnimationFrame(animate);
      }
      animate();
    }

    function isRolling(){
      return continuousRolling || stopping;
    }
    
    function isStop() {
  return stopping;
}

    return {start, stop, resize, isRolling,isStop};
  }
})(jQuery);
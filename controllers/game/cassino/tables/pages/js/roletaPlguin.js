(function($) {
  $.fn.roulette = function(options) {
    const settings = $.extend({
      numbers: [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
        8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
        28, 12, 35, 3, 26
      ],
      
      duration: 10000, // tempo do giro (ms)
      wheelRotations: 5, // voltas da roda
      ballRotations: 10, // voltas da bolinha
      onFinish: null // callback quando parar
    }, options);
    
    return this.each(function() 
    {
     const numerosPretos = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
      const canvas = this;
      const $canvas = $(canvas);
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      const radius = width / 2;
      
      const numbers = settings.numbers;
      const numSlices = numbers.length;
      const sliceAngle = 2 * Math.PI / numSlices;
      
      let angle = -Math.PI / 2; // roleta
      let ballAngle = -Math.PI / 2; // bolinha
      
      function drawWheel() {
        ctx.clearRect(0, 0, width, height);
        
        // slices
        for (let i = 0; i < numSlices; i++) {
     
          
          
          
          ctx.beginPath();
          ctx.moveTo(radius, radius);
          ctx.arc(radius, radius, radius, angle + i * sliceAngle, angle + (i + 1) * sliceAngle);
          let color ='#ff0000';
          if(numerosPretos.includes(numbers[i]))
          color = '#000000';
          else if(numbers[i] ==0)
          color = '#00ff00';
          else 
            color ='#ff0000';
          
          ctx.fillStyle = color;// (i % 2 === 0) ? '#ff0000' : '#000000';
         // if (numbers[i] === 0) ctx.fillStyle = 
          ctx.fill();
          ctx.stroke();
          
               const start = angle + i * sliceAngle;
     const end = angle + (i + 1) * sliceAngle;
     const extrude = 50;
     // lado extrudado (mais escuro)
     ctx.beginPath();
     ctx.moveTo(radius + Math.cos(start) * radius, radius + Math.sin(start) * radius);
     ctx.lineTo(radius + Math.cos(start) * (radius - extrude), radius + Math.sin(start) * (radius - extrude));
     ctx.lineTo(radius + Math.cos(end) * (radius - extrude), radius + Math.sin(end) * (radius - extrude));
     ctx.lineTo(radius + Math.cos(end) * radius, radius + Math.sin(end) * radius);
     ctx.closePath();
     
     ctx.fillStyle = shadeColor(ctx.fillStyle, -20); // função para escurecer cor
     ctx.fill();
          
          
          ctx.strokeStyle = "#FFFFFF"; // cor da linha
          ctx.lineWidth = 2;
          const x = radius + Math.cos(angle) * radius;
          const y = radius + Math.sin(angle) * radius;
          // parte escura
          ctx.strokeStyle = "#333";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(radius, radius);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // parte clara “brilho”
          ctx.strokeStyle = "#FFF";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(radius, radius);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          
          // número
          ctx.save();
          ctx.translate(radius, radius);
          ctx.rotate(angle + (i + 0.5) * sliceAngle);
          ctx.textAlign = "right";
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px Arial";
          ctx.fillText(numbers[i], radius - 10, 5);
          ctx.restore();
        }
        
        // bolinha
        const ballRadius = 6;
        const ballX = radius + (radius - 40) * Math.cos(ballAngle);
        const ballY = radius + (radius - 40) * Math.sin(ballAngle);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffff00";
        ctx.fill();
        ctx.stroke();
        
        // círculo central externo
        const centerX = width / 2;
        const centerY = height / 2;
        const centerRadius = ((centerX + centerY) / 2.3) * .7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // círculo central interno
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius * .25, 0, 2 * Math.PI);
        ctx.fillStyle = "#4F4F4F";
        ctx.fillStyle = shadeColor(ctx.fillStyle, 50);
        ctx.fill();
        ctx.stroke();
      }
      
      function spinAnimated(target) {
        
        $canvas.css("transform","rotateX(60deg) rotateY(0deg)");
        $canvas.css("transition","transform 0.s ease;");
        
        const index = numbers.indexOf(target);
        const startAngle = angle;
        const startBallAngle = ballAngle;
        
        const finalAngle = -Math.PI / 2;
        const finalBallAngle = -Math.PI / 2 + index * sliceAngle + sliceAngle / 2;
        
        const totalWheelRotation = settings.wheelRotations * 2 * Math.PI + (finalAngle - startAngle);
        const totalBallRotation = -settings.ballRotations * 2 * Math.PI + (finalBallAngle - startBallAngle);
        
        const startTime = performance.now();
        
        function animate(now) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / settings.duration, 1);
          const easeOut = 1 - Math.pow(1 - t, 5);
          
          angle = startAngle + totalWheelRotation * easeOut;
          ballAngle = startBallAngle + totalBallRotation * easeOut;
          
          drawWheel();
          
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            angle = finalAngle;
            ballAngle = finalBallAngle;
            drawWheel();
            $canvas.css("transform","rotateX(30deg) rotateY(0deg)");
            if (typeof settings.onFinish === "function") {
              settings.onFinish(target);
            }
          }
        }
        
        requestAnimationFrame(animate);
      }
      
      function shadeColor(color, percent) {
        const f = parseInt(color.slice(1), 16),
          t = percent < 0 ? 0 : 255,
          p = percent < 0 ? percent * -1 : percent,
          R = f >> 16,
          G = f >> 8 & 0x00FF,
          B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
          (Math.round((t - G) * p) + G) * 0x100 +
          (Math.round((t - B) * p) + B)).toString(16).slice(1);
      }
      
      
      // desenha inicial
      drawWheel();
      
      // expõe API pública
      $(canvas).data("roulette", {
        spin: spinAnimated,
        draw: drawWheel,
        numbers: numbers
      });
    });
  };
})(jQuery);
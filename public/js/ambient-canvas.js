/**
 * Totally Baked Pemba - Partículas e Atmosfera Artesanal Interativa (Canvas 2D)
 * Em conformidade com as skills canvas-design, generative_ui e animation-performance:
 * - Partículas de farinha dourada/açúcar de confeiteiro em flutuação orgânica
 * - Reatividade ao cursor do rato e ao toque tátil no telemóvel (repulsão e dispersão suave)
 * - Zero consumo de layout/reflow (execução estritamente em requestAnimationFrame sobre canvas isolado)
 * - Auto-pausa quando a secção do Hero não estiver visível (IntersectionObserver)
 * - Desativação automática se o utilizador preferir redução de movimento (prefers-reduced-motion)
 */

(function () {
  const canvas = document.getElementById('heroAtmosphereCanvas');
  if (!canvas) return;

  // Respeita acessibilidade (prefers-reduced-motion)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  // Configuração das partículas
  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 38 : 75;
  const particles = [];

  // Posição do ponteiro (rato ou toque)
  const pointer = {
    x: -1000,
    y: -1000,
    radius: isMobile ? 90 : 130,
    isActive: false
  };

  class FlourDust {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2.5 + 1.0;
      this.baseAlpha = Math.random() * 0.35 + 0.15;
      this.alpha = this.baseAlpha;
      this.vy = -(Math.random() * 0.35 + 0.15); // Flutuação lenta para cima
      this.vx = (Math.random() - 0.5) * 0.25;
      this.hue = Math.random() > 0.5 ? 333 : 338; // Paleta #FF70B0 / #FFA0CA / #FFC4DE
      this.saturation = Math.random() * 20 + 80;
      this.lightness = Math.random() * 14 + 68;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
      // Movimento oscilatório suave
      this.angle += this.angularSpeed;
      this.y += this.vy;
      this.x += this.vx + Math.sin(this.angle) * 0.2;

      // Interação com o ponteiro do utilizador (repulsão física de ar)
      if (pointer.isActive) {
        const dx = this.x - pointer.x;
        const dy = this.y - pointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist < pointer.radius && dist > 0) {
          const force = (1 - dist / pointer.radius) * 2.4;
          const normalX = dx / dist;
          const normalY = dy / dist;
          this.x += normalX * force * 3;
          this.y += normalY * force * 3;
          this.alpha = Math.min(0.9, this.alpha + 0.25);
        } else {
          this.alpha += (this.baseAlpha - this.alpha) * 0.05;
        }
      }

      // Reinicia quando sai do topo ou das bordas laterais
      if (this.y < -15 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
      ctx.fill();
    }
  }

  // Inicializa partículas
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new FlourDust());
  }

  // Ouvintes de Rato e Toque
  const parent = canvas.parentElement;

  parent.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.isActive = true;
  });

  parent.addEventListener('pointerleave', () => {
    pointer.isActive = false;
  });

  parent.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.isActive = true;
  });

  // Redimensionamento
  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
  });

  // Loop de Renderização otimizado
  let isVisible = true;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);
  }

  function render() {
    requestAnimationFrame(render);
    if (!isVisible) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
  }

  render();
})();

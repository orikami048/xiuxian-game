window.XiuXian = window.XiuXian || {};

XiuXian.ParticleSystem = class ParticleSystem {
  constructor(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.maxParticles = 22;
    this.isRunning = false;
    this.animationId = null;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(x, y, color) {
    const isGold = Math.random() < 0.6;
    const defaultColor = isGold ? 'rgba(212,163,75,1)' : 'rgba(75,185,130,1)';
    
    return {
      x: x !== undefined ? x : Math.random() * this.width,
      y: y !== undefined ? y : this.height + Math.random() * 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.6 + 0.3), // [-0.9, -0.3]
      size: Math.random() * 2 + 2, // 2-4px
      color: color || defaultColor,
      alpha: 1,
      life: Math.random() * 100 + 100,
      maxLife: 200
    };
  }

  start() {
    if (this.isRunning) return;
    this.init();
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  update() {
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0 || p.y < 0) {
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(i, 1);
            i--;
        } else {
            this.particles[i] = this.createParticle(undefined, this.height + Math.random() * 10);
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color.replace(/1\)$/, `${p.alpha})`);
      if (p.color.startsWith('rgb(') || p.color.startsWith('rgba(')) {
          // just use alpha
          let match = p.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if(match) {
             this.ctx.fillStyle = `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${p.alpha})`;
          }
      }
      this.ctx.fill();
    }
  }

  loop = () => {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      let p = this.createParticle(x, y, color);
      p.vx = (Math.random() - 0.5) * 4;
      p.vy = (Math.random() - 0.5) * 4;
      p.life = Math.random() * 30 + 30;
      p.maxLife = p.life;
      this.particles.push(p);
    }
  }
}

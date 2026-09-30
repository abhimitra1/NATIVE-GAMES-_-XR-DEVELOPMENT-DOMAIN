/**
 * Effects.js - Ambient Courtly VFX & Piece Animation Helper
 * 
 * Handles:
 * - Floating diya lamplight dust motes on HTML5 Canvas
 * - Token parabolic hopping transitions
 * - Capture bursts and victory celebrations
 */

export class Effects {
  static initDust(canvasEl) {
    if (!canvasEl) return null;
    const ctx = canvasEl.getContext('2d');
    const motes = [];

    function resize() {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = Math.max(20, Math.min(80, Math.floor(window.innerWidth / 22)));
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.6 + Math.random() * 1.8,
        a: 0.12 + Math.random() * 0.4,
        vy: 0.00012 + Math.random() * 0.0003,
        ph: Math.random() * 6.28,
        vx: (Math.random() - 0.5) * 0.0001
      });
    }

    let animId = null;
    function loop() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      motes.forEach(m => {
        m.y -= m.vy;
        m.x += m.vx;
        if (m.y < -0.05) m.y = 1.05;
        if (m.x < -0.05) m.x = 1.05;
        if (m.x > 1.05) m.x = -0.05;
        m.ph += 0.02;
        const a = m.a * (0.5 + 0.5 * Math.sin(m.ph));
        ctx.beginPath();
        ctx.arc(m.x * canvasEl.width, m.y * canvasEl.height, m.s, 0, 6.283);
        ctx.fillStyle = `rgba(255, 215, 125, ${a.toFixed(3)})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }
}

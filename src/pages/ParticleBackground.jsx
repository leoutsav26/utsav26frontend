import { useEffect, useRef } from 'react';

const PI2 = Math.PI * 2;

/* Neon colors only: blue, golden, silver, orange (no purple) */
const NEON_COLORS = [
  { r: 255, g: 215, b: 0, a: 0.75 },   // neon golden
  { r: 0, g: 170, b: 255, a: 0.78 },   // neon blue
  { r: 224, g: 224, b: 224, a: 0.72 }, // silver
  { r: 255, g: 140, b: 0, a: 0.75 },   // neon orange
  { r: 255, g: 230, b: 100, a: 0.7 },  // light golden
  { r: 100, g: 200, b: 255, a: 0.7 },  // light blue
];

function getCount() {
  if (typeof window === 'undefined') return 600;
  const mobile = window.innerWidth < 768;
  return mobile ? 360 : 660;
}

function getCanvasSize(canvas) {
  const parent = canvas.parentElement;
  const w =
    canvas.offsetWidth ||
    (parent && parent.clientWidth) ||
    window.innerWidth ||
    800;
  const h =
    canvas.offsetHeight ||
    (parent && parent.clientHeight) ||
    window.innerHeight ||
    600;

  return { w: Math.max(1, w), h: Math.max(1, h) };
}

export default function FreeFlowParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let particles = [];
    let lastW = 0;
    let lastH = 0;

    function initParticles() {
      const { w, h } = getCanvasSize(canvas);
      const count = getCount();
      particles = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.2 + 0.8,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          colorIndex: Math.floor(Math.random() * NEON_COLORS.length),
        });
      }
    }

    function resize() {
      const { w, h } = getCanvasSize(canvas);
      if (w === lastW && h === lastH) return;

      lastW = w;
      lastH = h;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const { w, h } = getCanvasSize(canvas);
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x - p.radius < 0 || p.x + p.radius > w) p.speedX *= -1;
        if (p.y - p.radius < 0 || p.y + p.radius > h) p.speedY *= -1;

        p.x = Math.max(p.radius, Math.min(w - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(h - p.radius, p.y));

        const c = NEON_COLORS[p.colorIndex];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, PI2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    function start() {
      resize();
      initParticles();
      draw();
    }

    const startId = requestAnimationFrame(start);

    const ro = new ResizeObserver(() => {
      resize();
      initParticles();
    });

    ro.observe(canvas.parentElement || document.body);

    const onResize = () => {
      resize();
      initParticles();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(startId);
      cancelAnimationFrame(animationId);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="global-particle-canvas"
      style={{ background: 'transparent', width: '100%', height: '100%', display: 'block' }}
      aria-hidden
    />
  );
}

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface DustParticlesProps {
  count?: number;
  maxRadius?: number;
  speed?: number;
  opacityMax?: number;
  color?: string;
  zIndex?: number;
}

export default function DustParticles({
  count = 130,
  maxRadius = 2.5,
  speed = 0.3,
  opacityMax = 0.6,
  color = '255, 255, 255',
  zIndex = 0,
}: DustParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reiniciamos las partículas al cambiar tamaño
      initParticles();
    };

    const initParticles = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius: Math.random() * maxRadius + 0.5,
          opacity: Math.random() * opacityMax,
          life: Math.random() * 300,
          maxLife: 300 + Math.random() * 200
        });
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Movimiento browniano suave
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;
        // Límite de velocidad
        const maxSpeed = speed * 1.5;
        p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
        p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));

        p.x += p.vx;
        p.y += p.vy;

        // Rebotar en bordes
        if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -0.5; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -0.5; }

        // Ciclo de vida (parpadeo orgánico)
        p.life++;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.maxLife = 200 + Math.random() * 300;
          // Reaparecer en posición aleatoria
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }
        const lifeRatio = Math.sin((p.life / p.maxLife) * Math.PI);
        const currentOpacity = p.opacity * lifeRatio;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${currentOpacity})`;
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [count, maxRadius, speed, opacityMax, color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
    />
  );
}

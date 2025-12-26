import { useEffect, useState, useMemo, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  isCircle: boolean;
  animationDelay: number;
  animationDuration: number;
}

const COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

function createParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      isCircle: Math.random() > 0.5,
      animationDelay: Math.random() * 0.5,
      animationDuration: 2 + Math.random(),
    });
  }
  return particles;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const activationCountRef = useRef(0);

  // Track activations to regenerate particles each time
  if (active && !showConfetti) {
    activationCountRef.current += 1;
  }

  // Generate particles based on activation count (regenerates each time active becomes true)
  const particles = useMemo(() => {
    if (!active) return [];
    return createParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activationCountRef.current]);

  // Sync showConfetti state with active prop and handle timeout
  useEffect(() => {
    if (active) {
      setShowConfetti(true);
      const timeout = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setShowConfetti(false);
    }
  }, [active, onComplete]);

  if (!showConfetti || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: particle.isCircle ? "50%" : "2px",
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
}

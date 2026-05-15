import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Spotlight: mouse-following radial glow overlay (Aceternity-style)
export function Spotlight({ className = '', size = 400, color = 'rgba(108, 92, 231, 0.15)' }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      className={`spotlight-wrapper ${className}`}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    >
      <motion.div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

// CardSpotlight: card with mouse-tracking gradient reveal (Aceternity-style)
export function CardSpotlight({ children, className = '', borderColor = 'rgba(108, 92, 231, 0.4)' }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, ${borderColor}, transparent 80%)`;

  return (
    <div ref={ref} className={`card-spotlight-outer ${className}`} onMouseMove={handleMouseMove}>
      <motion.div className="card-spotlight-glow" style={{ background }} />
      <div className="card-spotlight-content">
        {children}
      </div>
    </div>
  );
}

// Meteors: animated meteor streaks inside a container (Aceternity-style)
export function Meteors({ count = 8 }) {
  const meteors = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2,
    size: 1 + Math.random() * 2,
  })), [count]);

  return (
    <div className="meteors-container">
      {meteors.map((m) => (
        <motion.div
          key={m.id}
          className="meteor"
          style={{
            position: 'absolute',
            top: -20,
            left: m.left,
            width: m.size,
            height: 60 + Math.random() * 60,
            background: `linear-gradient(to bottom, rgba(108, 92, 231, 0.6), transparent)`,
            borderRadius: '50% 50% 0 0',
            transform: 'rotate(215deg)',
          }}
          animate={{
            top: ['0%', '120%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 5 + 2,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Sparkles: floating particle sparkle effect (Aceternity-style)
export function Sparkles({ count = 20, color = '#A29BFE', minSize = 2, maxSize = 5 }) {
  const sparkles = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: minSize + Math.random() * (maxSize - minSize),
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  })), [count, minSize, maxSize]);

  return (
    <div className="sparkles-container">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="sparkle"
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${s.size * 2}px ${color}`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// MovingBorder: animated gradient border that moves around a container (Aceternity-style)
export function MovingBorder({ children, className = '', duration = 3, borderColor = '#6C5CE7' }) {
  return (
    <div className={`moving-border-outer ${className}`}>
      <motion.div
        className="moving-border-gradient"
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${borderColor} 10%, transparent 30%)`,
        }}
      />
      <div className="moving-border-inner">
        {children}
      </div>
    </div>
  );
}

// GlowingBorder: animated glow border that follows container edges (Aceternity-style Glowing Effect)
export function GlowingBorder({ children, className = '', color = '#6C5CE7', blur = 15 }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const glowBg = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, ${color}40, transparent 80%)`;

  return (
    <div ref={ref} className={`glowing-border-wrapper ${className}`} onMouseMove={handleMouseMove}>
      <motion.div
        className="glowing-border-effect"
        style={{
          background: glowBg,
          filter: `blur(${blur}px)`,
        }}
      />
      {children}
    </div>
  );
}

// BackgroundBeams: animated SVG beam lines (Aceternity-style)
export function BackgroundBeams() {
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 800);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const x = useSpring(useTransform(mouseX, [0, 2000], [30, -30]), { stiffness: 50, damping: 20 });
  const y = useSpring(useTransform(mouseY, [0, 1000], [30, -30]), { stiffness: 50, damping: 20 });

  const paths = [
    'M0 300 Q 200 100, 400 300 T 800 300 T 1200 300 T 1600 300',
    'M0 400 Q 250 200, 500 400 T 1000 400 T 1500 400',
    'M0 200 Q 300 50, 600 200 T 1200 200 T 1800 200',
    'M0 500 Q 150 300, 300 500 T 600 500 T 900 500 T 1200 500',
  ];

  return (
    <motion.svg 
      className="background-beams" 
      viewBox="0 0 1600 600" 
      preserveAspectRatio="none"
      style={{ x, y, width: 'calc(100% + 60px)', height: 'calc(100% + 60px)', position: 'absolute', top: -30, left: -30 }}
    >
      <defs>
        <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="rgba(108, 92, 231, 0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="url(#beam-gradient)"
          strokeWidth={1 + i * 0.3}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
          transition={{
            duration: 4 + i * 1.5,
            delay: i * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.svg>
  );
}

// TextGenerateEffect: words fade in one by one (Aceternity-style)
export function TextGenerateEffect({ words, className = '' }) {
  const wordArray = words.split(' ');

  return (
    <span className={`text-generate ${className}`}>
      {wordArray.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// FloatingElement: gently floating animation for any child
export function FloatingElement({ children, duration = 4, y = 8 }) {
  return (
    <motion.div
      animate={{ y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

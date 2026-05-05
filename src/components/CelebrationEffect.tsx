import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  show: boolean;
  onComplete?: () => void;
}

// 特效类型
type EffectType = 'confetti' | 'fireworks' | 'stars' | 'hearts' | 'rainbow';

const CELEBRATION_EFFECTS: EffectType[] = ['confetti', 'fireworks', 'stars', 'hearts', 'rainbow'];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  type: string;
}

const CelebrationEffect = ({ show, onComplete }: CelebrationEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effectType, setEffectType] = useState<EffectType>('confetti');

  const generateParticles = useCallback(() => {
    const type = CELEBRATION_EFFECTS[Math.floor(Math.random() * CELEBRATION_EFFECTS.length)];
    setEffectType(type);
    
    const newParticles: Particle[] = [];
    const count = type === 'fireworks' ? 50 : type === 'rainbow' ? 30 : 40;
    
    const colors = {
      confetti: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'],
      fireworks: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00CED1', '#FFA500'],
      stars: ['#FFD700', '#FFA500', '#FFE66D', '#FFC107', '#FFEB3B'],
      hearts: ['#FF6B6B', '#FF69B4', '#F38181', '#E84393', '#FD79A8'],
      rainbow: ['#FF6B6B', '#FF9F43', '#FFE66D', '#10AC84', '#0ABDE3', '#5F27CD'],
    };

    const particleColors = colors[type];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: type === 'fireworks' ? 30 + Math.random() * 40 : -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        delay: Math.random() * 0.5,
        type: type,
      });
    }

    setParticles(newParticles);
    
    // 自动关闭
    setTimeout(() => {
      onComplete?.();
    }, 2500);
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      generateParticles();
    }
  }, [show, generateParticles]);

  const getParticleEmoji = (type: string): string => {
    switch (type) {
      case 'confetti': return '🎊';
      case 'fireworks': return '🎆';
      case 'stars': return '⭐';
      case 'hearts': return '❤️';
      case 'rainbow': return '🌈';
      default: return '✨';
    }
  };

  const getParticleStyle = (particle: Particle): React.CSSProperties => {
    switch (particle.type) {
      case 'confetti':
        return {
          position: 'absolute',
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
          animation: 'confettiFall 2s ease-out forwards',
        };
      case 'fireworks':
        return {
          position: 'absolute',
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          transform: `scale(${particle.scale})`,
          animation: `fireworkExplode 1s ease-out forwards`,
          animationDelay: `${particle.delay}s`,
        };
      case 'stars':
        return {
          position: 'absolute',
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          transform: `scale(${particle.scale})`,
          animation: `starTwinkle 1.5s ease-in-out infinite`,
          animationDelay: `${particle.delay}s`,
        };
      case 'hearts':
        return {
          position: 'absolute',
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          transform: `scale(${particle.scale})`,
          animation: `heartFloat 2s ease-out forwards`,
          animationDelay: `${particle.delay}s`,
        };
      case 'rainbow':
        return {
          position: 'absolute',
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          transform: `scale(${particle.scale})`,
          animation: `rainbowFall 2s ease-out forwards`,
          animationDelay: `${particle.delay}s`,
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {/* CSS Keyframes */}
          <style>{`
            @keyframes confettiFall {
              0% {
                transform: translateY(0) rotate(0deg) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg) scale(0.5);
                opacity: 0;
              }
            }
            @keyframes fireworkExplode {
              0% {
                transform: scale(0);
                opacity: 1;
              }
              50% {
                transform: scale(1.5);
                opacity: 1;
              }
              100% {
                transform: scale(2);
                opacity: 0;
              }
            }
            @keyframes starTwinkle {
              0%, 100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
              50% {
                transform: scale(1.3) rotate(180deg);
                opacity: 0.7;
              }
            }
            @keyframes heartFloat {
              0% {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-100px) scale(0.5);
                opacity: 0;
              }
            }
            @keyframes rainbowFall {
              0% {
                transform: translateY(-20px) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) scale(0.3);
                opacity: 0;
              }
            }
          `}</style>

          {/* 中心文字 */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-white px-8 py-4 rounded-full shadow-xl">
              <p className="text-2xl font-bold text-center">太棒了！🎉</p>
            </div>
          </motion.div>

          {/* 粒子 */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: particle.scale }}
              style={getParticleStyle(particle)}
            >
              <span style={{ color: particle.color, fontSize: 24 * particle.scale }}>
                {getParticleEmoji(particle.type)}
              </span>
            </motion.div>
          ))}

          {/* 额外的大emoji装饰 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute top-1/4 left-1/4 text-6xl"
          >
            🎊
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="absolute top-1/3 right-1/4 text-5xl"
          >
            🎉
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute bottom-1/3 left-1/3 text-5xl"
          >
            ✨
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="absolute bottom-1/4 right-1/3 text-4xl"
          >
            🌟
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationEffect;

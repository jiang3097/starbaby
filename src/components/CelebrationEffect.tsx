import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  show: boolean;
  onComplete?: () => void;
}

// 鼓励文字
const ENCOURAGEMENTS = [
  '太棒了！🎉',
  '好棒呀！⭐',
  '真厉害！✨',
  '加油！💪',
  '你真棒！👏',
  '太厉害了！🌟',
  '继续保持！💫',
  '太聪明了！🧠',
];

// 简单粒子emoji
const PARTICLES = ['✨', '⭐', '🌟', '💫', '✨', '⭐'];

interface Particle {
  id: number;
  x: number;
  delay: number;
  emoji: string;
}

const CelebrationEffect = ({ show, onComplete }: CelebrationEffectProps) => {
  const [text, setText] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateEffect = useCallback(() => {
    // 随机选择鼓励文字
    const randomText = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setText(randomText);
    
    // 生成简单粒子
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: i,
        x: 20 + Math.random() * 60, // 在屏幕中间区域
        delay: Math.random() * 0.3,
        emoji: PARTICLES[i % PARTICLES.length],
      });
    }
    setParticles(newParticles);
    
    // 自动关闭
    setTimeout(() => {
      onComplete?.();
    }, 1800);
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      generateEffect();
    }
  }, [show, generateEffect]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* 半透明遮罩 */}
          <div className="absolute inset-0 bg-black/10" />
          
          {/* 中心文字 */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20,
            }}
            className="relative z-10"
          >
            {/* 文字气泡 */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-white px-10 py-5 rounded-full shadow-xl">
              <p className="text-3xl font-bold text-center whitespace-nowrap">
                {text}
              </p>
            </div>
            
            {/* 周围粒子 */}
            <div className="absolute inset-0 -m-4">
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0],
                    y: [0, -30, -50],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1,
                    delay: p.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute text-2xl"
                  style={{ 
                    left: `${p.x}%`,
                    top: '50%',
                  }}
                >
                  {p.emoji}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationEffect;

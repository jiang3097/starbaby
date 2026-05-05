import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MobileShell from '../components/MobileShell';
import { useUser } from '../context/UserContext';

const Splash = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      // 如果已有用户选择，直接跳转到主页
      navigate('/home');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileShell className="bg-gradient-to-b from-sky-100 via-blue-50 to-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300"
            initial={{ 
              opacity: 0,
              x: Math.random() * 400,
              y: Math.random() * 800,
            }}
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              y: [null, Math.random() * 60 - 30],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{ fontSize: Math.random() * 10 + 12 }}
          >
            {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🌟'}
          </motion.div>
        ))}
      </div>

      <div className="h-full flex flex-col items-center justify-center p-8 text-center relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-40 h-40 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full flex items-center justify-center shadow-2xl shadow-amber-200/50 mb-8 overflow-hidden"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-7xl">👋</span>
          </motion.div>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4"
        >
          守护星宝
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-lg text-slate-500 font-medium"
        >
          AI陪伴，让星宝勇敢开口
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-20"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i} 
                className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full"
                animate={{ scaleY: [0.5, 1.2, 0.5] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1,
                  delay: i * 0.15 
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </MobileShell>
  );
};

export default Splash;

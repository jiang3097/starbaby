import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MobileShell from '../components/MobileShell';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileShell className="bg-sky-50">
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-xl shadow-sky-200/50 mb-8 overflow-hidden"
        >
          <img 
            src="https://modao.cc/agent-py/media/generated_images/2026-05-02/257f05b6fa1d464081f793541d8c9c90.jpg#desc=Cute%20blue%20star%20character%2C%20smiling%2C%20big%20eyes%2C%20friendly%2C%20pastel%20colors" 
            alt="守护星宝 Logo"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-bold text-sky-600 mb-4 tracking-wider"
        >
          守护星宝
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-lg text-sky-400 font-medium"
        >
          AI陪伴，让星宝勇敢开口
        </motion.p>

        <div className="absolute bottom-20">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-sky-200 rounded-full" />
            ))}
          </motion.div>
        </div>
      </div>
    </MobileShell>
  );
};

export default Splash;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodRewardEffectProps {
  show: boolean;
  foodEmoji: string;
  onClose: () => void;
}

const FoodRewardEffect: React.FC<FoodRewardEffectProps> = ({ show, foodEmoji, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
        >
          {/* 中央卡片 */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl px-10 py-8 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 食物图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2, duration: 0.8 }}
              className="w-24 h-24 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full flex items-center justify-center text-6xl shadow-lg mb-4"
            >
              {foodEmoji}
            </motion.div>

            {/* 文字 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-xl font-bold text-green-600 mb-1">获得新食物！</p>
              <p className="text-sm text-green-500">真棒，继续加油哦</p>
            </motion.div>

            {/* 装饰星星 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -top-2 -left-2 text-2xl"
            >
              ⭐
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              className="absolute -bottom-2 -right-2 text-2xl"
            >
              ✨
            </motion.div>

            {/* 轻微浮动的心形 */}
            <motion.div
              animate={{ y: [-5, 5, -5], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute -top-4 right-4 text-xl"
            >
              💕
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FoodRewardEffect;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { useUser } from '../context/UserContext';
import { speakText, preloadVoices } from '../lib/useSpeech';

const TimeLimitModal = () => {
  const { showTimeLimitModal, setShowTimeLimitModal, resetTimeLimit, timeLimit } = useApp();
  const { profile, avatar } = useUser();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false); // 是否显示解锁状态

  // 弹窗显示时初始化状态
  useEffect(() => {
    if (showTimeLimitModal) {
      setShowUnlock(false);
      setPin('');
      setError(false);
      preloadVoices();
      // 语音播报
      const messages = [
        `嗨，${profile.name}！今天的训练时间到啦～`,
        `${profile.name}今天学习得好棒呀！`,
        `小${profile.name}，今天已经玩得很开心了哦～`,
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      speakText(`${randomMsg} 去休息一下吧，明天再来一起玩！🌙`);
    }
  }, [showTimeLimitModal, profile.name]);

  // 解锁后语音播报
  useEffect(() => {
    if (showUnlock) {
      speakText(`好啦${profile.name}！我们继续玩吧！😊`);
    }
  }, [showUnlock, profile.name]);

  // 输入密码
  const handlePin = (num: string) => {
    if (showUnlock) return; // 已解锁，不响应
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === '1234') {
          // 密码正确，显示解锁状态
          setShowUnlock(true);
        } else {
          // 密码错误
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setShowTimeLimitModal(false);
    resetTimeLimit();
  };

  const getLimitText = () => {
    const minutes = timeLimit.customMinutes || timeLimit.minutes;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  return (
    <AnimatePresence>
      {showTimeLimitModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-gradient-to-b from-indigo-900/90 via-purple-900/90 to-slate-900/95 flex items-center justify-center p-6"
          onClick={showUnlock ? handleClose : undefined} // 解锁后才能点击关闭
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-white/20"
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%`,
                  fontSize: `${12 + Math.random() * 16}px`
                }}
                animate={{ 
                  opacity: [0.1, 0.4, 0.1], 
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 2
                }}
              >
                ⭐
              </motion.div>
            ))}
            <motion.div 
              className="absolute top-16 right-12 text-6xl"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              🌙
            </motion.div>
            <motion.div 
              className="absolute bottom-32 left-8 text-4xl opacity-40"
              animate={{ x: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 6 }}
            >
              ☁️
            </motion.div>
          </div>

          {/* 主内容卡片 */}
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-gradient-to-b from-white to-purple-50 rounded-3xl p-6 w-full max-w-[300px] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-100/50 to-transparent rounded-t-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              {/* 头像 */}
              <motion.div
                animate={{ y: showUnlock ? [0, -8, 0] : [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: showUnlock ? 1 : 2 }}
                className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-purple-300 to-pink-300 shadow-lg mb-4"
              >
                <div className={cn(
                  "w-full h-full rounded-full overflow-hidden bg-gradient-to-br",
                  avatar.color
                )}>
                  <img src={avatar.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                </div>
              </motion.div>

              {/* 标题 */}
              <h2 className="text-xl font-bold text-purple-700 mb-2 flex items-center gap-2">
                <Moon size={20} className="text-purple-400" />
                {showUnlock ? '继续玩吧！' : '休息时间到啦'}
              </h2>

              {showUnlock ? (
                /* 解锁状态 */
                <>
                  <p className="text-purple-600 text-sm text-center mb-2">
                    嗨，<span className="font-bold text-purple-700">{profile.name}</span>！
                  </p>
                  <p className="text-slate-600 text-sm text-center mb-6">
                    好啦好啦，我们继续玩吧！😊
                  </p>
                  
                  <div className="flex gap-2 mb-6">
                    {['💖', '✨', '💖'].map((emoji, i) => (
                      <motion.span
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      >
                        {emoji}
                      </motion.span>
                    ))}
                  </div>

                  <p className="text-slate-400 text-xs text-center">
                    点击任意位置继续玩耍~
                  </p>
                </>
              ) : (
                /* 限制状态 */
                <>
                  <p className="text-purple-600 text-sm text-center mb-2">
                    嗨，<span className="font-bold text-purple-700">{profile.name}</span>！
                  </p>
                  <p className="text-slate-600 text-sm text-center mb-1">
                    今天已经学习了
                  </p>
                  <p className="text-purple-600 text-sm text-center mb-4">
                    <span className="text-2xl font-bold text-purple-700">{getLimitText()}</span>
                    <span className="text-slate-600"> 啦</span>
                  </p>

                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl px-4 py-3 mb-6 text-center">
                    <p className="text-purple-700 text-sm font-medium">
                      🌟 去休息一下吧 🌟
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      明天再来一起玩哦~
                    </p>
                  </div>

                  {/* 密码输入 */}
                  <div className="w-full bg-slate-100 rounded-2xl p-4">
                    <p className="text-center text-xs text-slate-400 mb-3">如需解除，请联系家长</p>
                    
                    <div className="flex justify-center gap-3 mb-4">
                      {[0, 1, 2, 3].map((i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-4 h-4 rounded-full transition-all duration-150",
                            pin.length > i 
                              ? error ? "bg-rose-400 scale-110" : "bg-purple-500 scale-110" 
                              : "bg-slate-300"
                          )} 
                        />
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((num, i) => {
                        if (num === '') return <div key={i} />;
                        return (
                          <button
                            key={i}
                            onClick={() => num === '⌫' ? setPin(pin.slice(0, -1)) : handlePin(num)}
                            className={cn(
                              "h-11 rounded-xl flex items-center justify-center text-base font-medium transition-all active:scale-95",
                              num === '⌫' 
                                ? "bg-slate-200 text-slate-400" 
                                : "bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                            )}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TimeLimitModal;

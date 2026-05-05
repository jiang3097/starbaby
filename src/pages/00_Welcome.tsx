import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Edit3 } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useUser, STAR_AVATARS } from '../context/UserContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { profile: savedProfile, updateProfile } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(STAR_AVATARS.find(a => a.id === savedProfile.avatarId) || STAR_AVATARS[0]);
  const [nickname, setNickname] = useState(savedProfile.name);
  const [isEditing, setIsEditing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始动画
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // 编辑名字
  const handleEditName = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  // 开始游戏
  const handleStart = () => {
    const finalName = nickname.trim() || selectedAvatar.name;
    
    updateProfile({
      avatarId: selectedAvatar.id,
      name: finalName,
    });
    
    setIsStarting(true);
    
    setTimeout(() => {
      navigate('/home');
    }, 1500);
  };

  return (
    <MobileShell className="bg-gradient-to-b from-sky-100 via-blue-50 to-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 漂浮的星星 */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300"
            initial={{ 
              opacity: 0,
              x: Math.random() * 400,
              y: Math.random() * 800,
            }}
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              y: [null, Math.random() * 100 - 50],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🌟'}
          </motion.div>
        ))}
        
        {/* 云朵装饰 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute text-blue-200 text-4xl"
            initial={{ opacity: 0.4, x: -100 }}
            animate={{ 
              opacity: [0.4, 0.6, 0.4],
              x: [null, 50, 0],
            }}
            transition={{ 
              duration: 8 + i * 2,
              repeat: Infinity,
            }}
            style={{ top: `${20 + i * 25}%` }}
          >
            ☁️
          </motion.div>
        ))}
      </div>

      <div className="relative h-full flex flex-col">
        <AnimatePresence mode="wait">
          {/* 初始加载动画 */}
          {!showContent && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-2xl"
              >
                <span className="text-6xl">👋</span>
              </motion.div>
            </motion.div>
          )}

          {/* 主内容 */}
          {showContent && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex-1 flex flex-col px-6 pt-8"
            >
              {/* 标题区域 */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-md mb-4"
                >
                  <Sparkles size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-slate-600">欢迎来到星小宝的世界</span>
                  <Sparkles size={18} className="text-amber-500" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                >
                  选择你的小伙伴
                </motion.h1>
              </div>

              {/* 形象选择区域 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex-1 flex flex-col items-center"
              >
                {/* 选中形象展示 */}
                <motion.div
                  key={selectedAvatar.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={cn(
                    'relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl mb-8 bg-gradient-to-br',
                    selectedAvatar.color
                  )}
                >
                  {/* 角色图片 */}
                  <img
                    src={selectedAvatar.image}
                    alt={selectedAvatar.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 选中光环 */}
                  <motion.div
                    layoutId="avatarGlow"
                    className="absolute inset-0 border-4 border-white/50 rounded-3xl"
                    animate={{ 
                      boxShadow: [
                        '0 0 20px rgba(255,255,255,0.3)',
                        '0 0 40px rgba(255,255,255,0.6)',
                        '0 0 20px rgba(255,255,255,0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* 浮动装饰 */}
                  <motion.div
                    animate={{ 
                      y: [-5, 5, -5],
                      rotate: [0, 5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-2xl">{selectedAvatar.emoji}</span>
                  </motion.div>
                </motion.div>

                {/* 名字输入区域 */}
                <div className="flex items-center gap-3 mb-8">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={nickname}
                      onChange={handleNameChange}
                      onBlur={handleNameBlur}
                      onKeyDown={handleNameKeyDown}
                      maxLength={8}
                      className="w-40 h-12 px-4 text-center text-xl font-bold text-slate-700 bg-white rounded-full shadow-md border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <motion.button
                      onClick={handleEditName}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 h-12 bg-white rounded-full shadow-md border-2 border-transparent hover:border-blue-200 transition-colors"
                    >
                      <span className="text-xl font-bold text-slate-700">
                        {nickname || '点击起名'}
                      </span>
                      <Edit3 size={18} className="text-blue-400" />
                    </motion.button>
                  )}
                  
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-lg"
                  >
                    👋
                  </motion.div>
                </div>

                {/* 形象选择列表 */}
                <div className="flex justify-center gap-4 mb-8">
                  {STAR_AVATARS.map((avatar, index) => (
                    <motion.button
                      key={avatar.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={cn(
                        'relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg transition-all',
                        selectedAvatar.id === avatar.id
                          ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110'
                          : 'hover:shadow-xl opacity-70 hover:opacity-100'
                      )}
                    >
                      <img
                        src={avatar.image}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar.id === avatar.id && (
                        <motion.div
                          layoutId="avatarIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 rounded-full text-xs font-bold text-white"
                        >
                          {avatar.emoji}
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* 提示文字 */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-slate-400 mb-8"
                >
                  选择你喜欢的形象，点击名字可以修改哦
                </motion.p>
              </motion.div>

              {/* 开始按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="pb-12"
              >
                <AnimatePresence mode="wait">
                  {isStarting ? (
                    <motion.div
                      key="starting"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200"
                    >
                      <motion.div
                        animate={{ 
                          rotate: 360,
                        }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="text-3xl"
                      >
                        🚀
                      </motion.div>
                      <span className="ml-3 text-xl font-bold text-white">
                        正在进入...
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="start"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStart}
                      className="w-full h-16 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-200"
                    >
                      <span className="text-lg font-bold text-white">
                        和 {nickname || selectedAvatar.name} 一起开始冒险
                      </span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ChevronRight size={24} className="text-white ml-2" />
                      </motion.div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileShell>
  );
};

export default WelcomePage;

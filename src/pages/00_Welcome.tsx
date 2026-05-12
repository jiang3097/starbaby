import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Edit3, User, RefreshCw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { STAR_AVATARS } from '../context/UserContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile: savedProfile, updateProfile, switchAvatar } = useUser();
  const rechooseMode = searchParams.get('rechoose') === '1';
  const [selectedAvatar, setSelectedAvatar] = useState(STAR_AVATARS.find((a) => a.id === savedProfile.avatarId) || STAR_AVATARS[0]);
  const [nickname, setNickname] = useState(savedProfile.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showAvatarList, setShowAvatarList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
      // 如果是重新选择模式，直接显示形象列表
      if (rechooseMode) {
        setShowAvatarList(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [rechooseMode]);

  const handleSelectAvatar = (avatar: typeof STAR_AVATARS[0]) => {
    setSelectedAvatar(avatar);
    setNickname(avatar.name);
    setShowAvatarList(false);
  };

  const handleSwitchAvatar = () => {
    setShowAvatarList(true);
  };

  const handleConfirmAvatar = () => {
    if (selectedAvatar.id !== savedProfile.avatarId) {
      switchAvatar(selectedAvatar.id);
    }
    handleStart();
  };

  const handleStart = async () => {
    setIsStarting(true);
    updateProfile({ name: nickname || selectedAvatar.name });
    setTimeout(() => {
      navigate('/home');
    }, 800);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    updateProfile({ name: nickname || selectedAvatar.name });
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleEditName = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const hasSavedData = savedProfile.avatarId > 0 && savedProfile.name;

  return (
    <MobileShell>
      <div className="min-h-full bg-gradient-to-b from-blue-50 via-white to-purple-50 flex flex-col">
        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* 顶部欢迎语 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center pt-8 pb-4"
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  欢迎来到星小宝的世界
                </h1>
              </motion.div>

              {showAvatarList || !hasSavedData ? (
                /* 形象选择界面 */
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  {/* 选中形象 */}
                  <motion.div
                    key={selectedAvatar.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      'relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl mb-6 bg-gradient-to-br',
                      selectedAvatar.color
                    )}
                  >
                    <img
                      src={selectedAvatar.image}
                      alt={selectedAvatar.name}
                      className="w-full h-full object-cover"
                    />
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
                    <motion.div
                      animate={{ y: [-5, 5, -5], rotate: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-2xl">{selectedAvatar.emoji}</span>
                    </motion.div>
                  </motion.div>

                  {/* 名字输入 */}
                  <div className="flex items-center gap-3 mb-6">
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

                  {/* 形象列表 */}
                  <div className="flex justify-center gap-4 mb-6">
                    {STAR_AVATARS.map((avatar: typeof STAR_AVATARS[0], index: number) => (
                      <motion.button
                        key={avatar.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSelectAvatar(avatar)}
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

                  <p className="text-sm text-slate-400 mb-6">
                    选择你喜欢的形象，点击名字可以修改哦
                  </p>

                  {/* 确认按钮 */}
                  <motion.div className="w-full pb-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmAvatar}
                      className="w-full h-14 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-200"
                    >
                      <span className="text-lg font-bold text-white">
                        {hasSavedData ? '开始冒险' : '和星小宝一起玩'}
                      </span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ChevronRight size={24} className="text-white ml-2" />
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </div>
              ) : (
                /* 已有数据 - 显示继续/切换 */
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  {/* 头像显示 */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      'relative w-56 h-56 rounded-3xl overflow-hidden shadow-2xl mb-6 bg-gradient-to-br',
                      selectedAvatar.color
                    )}
                  >
                    <img
                      src={selectedAvatar.image}
                      alt={selectedAvatar.name}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(255,255,255,0.3)',
                          '0 0 40px rgba(255,255,255,0.6)',
                          '0 0 20px rgba(255,255,255,0.3)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 border-4 border-white/50 rounded-3xl"
                    />
                    <motion.div
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-3 -right-3 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-3xl">{selectedAvatar.emoji}</span>
                    </motion.div>
                  </motion.div>

                  <h2 className="text-2xl font-bold text-slate-700 mb-2">
                    {nickname || selectedAvatar.name}
                  </h2>
                  <p className="text-slate-500 mb-8">欢迎回来！</p>

                  {/* 继续按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    className="w-full h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-4"
                  >
                    <User size={22} className="text-white mr-2" />
                    <span className="text-lg font-bold text-white">继续冒险</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ChevronRight size={24} className="text-white ml-2" />
                    </motion.div>
                  </motion.button>

                  {/* 切换形象按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSwitchAvatar}
                    className="w-full h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-200"
                  >
                    <RefreshCw size={20} className="text-slate-500 mr-2" />
                    <span className="text-base font-medium text-slate-600">切换形象</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileShell>
  );
};

export default WelcomePage;

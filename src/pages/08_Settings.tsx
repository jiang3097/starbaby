import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Volume2, Eye, Mic2, Info, LogOut, Check, X, User, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useUser, STAR_AVATARS } from '../context/UserContext';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, avatar, updateProfile } = useUser();
  const [showParentPortal, setShowParentPortal] = useState(false);
  const [pin, setPin] = useState('');

  const settingsItems = [
    { 
      icon: Volume2, 
      label: '系统音量', 
      value: '80%', 
      color: 'text-sky-500', 
      bg: 'bg-sky-50',
      gradient: 'from-sky-200 to-blue-200',
      emoji: '🔊'
    },
    { 
      icon: Eye, 
      label: '护眼模式', 
      value: '已开启', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      gradient: 'from-emerald-200 to-teal-200',
      emoji: '👀'
    },
    { 
      icon: Mic2, 
      label: '语音包选择', 
      value: '温柔姐姐', 
      color: 'text-rose-500', 
      bg: 'bg-rose-50',
      gradient: 'from-rose-200 to-pink-200',
      emoji: '🎤'
    },
    { 
      icon: Info, 
      label: '关于项目', 
      value: '', 
      color: 'text-slate-400', 
      bg: 'bg-slate-50',
      gradient: 'from-slate-200 to-gray-200',
      emoji: 'ℹ️'
    },
  ];

  const handlePin = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin === '1234') {
        setTimeout(() => {
          alert('家长管理模式已开启 (Demo)');
          setShowParentPortal(false);
          setPin('');
        }, 300);
      }
    }
  };

  return (
    <MobileShell showNav className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-200"
            style={{ left: `${10 + i * 12}%`, top: `${5 + (i % 3) * 5}%` }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2.5 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      <div className="px-6 py-6 relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-500 hover:bg-amber-50 transition-colors"
          >
            <ChevronRight size={28} className="rotate-180" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-2xl font-bold text-slate-800">设置</h1>
            </div>
            <p className="text-sm text-amber-600 font-medium">让{profile.name}用得更开心~</p>
          </div>
          <div className="w-12" />
        </div>

        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-5 mb-6 shadow-lg border-2 border-white"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full p-0.5 shadow-md border-2 border-white bg-gradient-to-br overflow-hidden",
              avatar.color
            )}>
              <img src={avatar.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
              <p className="text-sm text-amber-600 font-medium">小可爱</p>
            </div>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-amber-200 text-amber-500 hover:bg-amber-50 transition-colors">
              <User size={20} />
            </button>
          </div>
        </motion.div>

        {/* Parent Portal Trigger */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowParentPortal(true)}
          className="mb-6"
        >
          <Card className="p-5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-[28px] border-none shadow-xl flex items-center justify-between cursor-pointer overflow-hidden relative">
            {/* 装饰 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 text-6xl">👨‍👩‍👧</div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield size={28} className="text-sky-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg">家长入口</h3>
                <p className="text-slate-400 text-xs font-medium">管理训练进度与课程</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 relative z-10" />
          </Card>
        </motion.div>

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 px-2 flex items-center gap-2">
            <span className="text-lg">📋</span>
            通用设置
          </h3>
          {settingsItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-5 flex items-center justify-between border-none shadow-md rounded-[24px] group cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative">
                {/* 背景装饰 */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r",
                  item.gradient
                )} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", item.bg)}>
                    <span>{item.emoji}</span>
                  </div>
                  <span className="font-bold text-slate-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="text-slate-400 text-sm font-medium">{item.value}</span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 重新选择形象 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <button
            onClick={() => navigate('/')}
            className="w-full p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-[24px] shadow-md border-2 border-amber-200 flex items-center justify-center gap-3 hover:from-amber-100 hover:to-orange-100 transition-colors"
          >
            <Sparkles size={22} className="text-amber-500" />
            <span className="font-bold text-amber-700">重新选择形象</span>
          </button>
        </motion.div>

        {/* Version Info */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🌟</span>
            <p className="text-amber-600 text-sm font-bold">守护星宝</p>
            <span className="text-2xl">🌟</span>
          </div>
          <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">v1.0.2</p>
          <p className="text-slate-300 text-[10px] mt-1">© 2026 守护星宝项目组</p>
          <p className="text-amber-300 text-xs mt-2">陪伴星宝健康成长 💕</p>
        </div>
      </div>

      <Navigation />

      {/* Parent Portal Modal */}
      <AnimatePresence>
        {showParentPortal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-gradient-to-b from-white to-amber-50 rounded-t-[48px] p-8 pb-12 flex flex-col items-center"
            >
              <button 
                onClick={() => { setShowParentPortal(false); setPin(''); }}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Shield size={32} className="text-sky-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">家长验证</h2>
              <p className="text-slate-400 text-sm mb-8">请输入四位数字密码 (Demo: 1234)</p>
              
              <div className="flex gap-4 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-5 h-5 rounded-full transition-all duration-200",
                      pin.length > i ? "bg-sky-500 scale-125" : "bg-slate-200"
                    )} 
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'clear'].map((num, i) => {
                  if (num === '') return <div key={i} />;
                  if (num === 'clear') return (
                    <button 
                      key={i}
                      onClick={() => setPin('')}
                      className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold"
                    >
                      清除
                    </button>
                  );
                  return (
                    <button
                      key={i}
                      onClick={() => handlePin(num)}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 hover:from-sky-100 hover:to-blue-100 text-2xl font-black text-slate-700 active:scale-90 transition-all shadow-md"
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default Settings;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Info, User, Sparkles, ChevronLeft, Trash2 } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';

type ParentView = 'settings' | 'parent';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const [parentView, setParentView] = useState<ParentView>('settings');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // 关于项目内容
  const settingsItems = [
    { 
      label: '关于项目', 
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
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === '1234') {
          // 密码正确，进入家长空间
          setTimeout(() => {
            setShowPinModal(false);
            setParentView('parent');
            setPin('');
          }, 200);
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

  // 家长空间内容
  const parentMenuItems = [
    { 
      label: '训练报告', 
      desc: '查看今日训练数据',
      emoji: '📊',
      color: 'from-emerald-200 to-teal-200',
      textColor: 'text-emerald-600'
    },
    { 
      label: '使用记录', 
      desc: '查看历史使用情况',
      emoji: '📅',
      color: 'from-sky-200 to-blue-200',
      textColor: 'text-sky-600'
    },
    { 
      label: '数据管理', 
      desc: '重置训练数据',
      emoji: '🗑️',
      color: 'from-rose-200 to-pink-200',
      textColor: 'text-rose-600'
    },
  ];

  return (
    <MobileShell showNav className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* PIN 输入弹窗 - 打电话样式 */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => { setShowPinModal(false); setPin(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-5 w-full max-w-[280px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => { setShowPinModal(false); setPin(''); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-sky-500" />
                  <span className="font-bold text-slate-700">家长验证</span>
                </div>
                <div className="w-8" />
              </div>
              
              {/* 密码提示 */}
              <p className="text-center text-xs text-slate-400 mb-4">请输入四位数字密码</p>
              
              {/* PIN 显示 */}
              <div className="flex justify-center gap-3 mb-5">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-150",
                      pin.length > i 
                        ? error ? "bg-rose-400 scale-110" : "bg-sky-500 scale-110" 
                        : "bg-slate-200"
                    )} 
                  />
                ))}
              </div>
              
              {/* 数字键盘 */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((num, i) => {
                  if (num === '') return <div key={i} />;
                  return (
                    <button
                      key={i}
                      onClick={() => num === '⌫' ? setPin(pin.slice(0, -1)) : handlePin(num)}
                      className={cn(
                        "h-12 rounded-xl flex items-center justify-center text-lg font-medium transition-all active:scale-95",
                        num === '⌫' 
                          ? "bg-slate-100 text-slate-400" 
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              
              {/* Demo 提示 */}
              <p className="text-center text-[10px] text-slate-300 mt-3">Demo 密码: 1234</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {parentView === 'settings' ? (
        <>
          {/* 普通设置界面 */}
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
              onClick={() => setShowPinModal(true)}
              className="mb-6"
            >
              <Card className="p-5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-[28px] border-none shadow-xl flex items-center justify-between cursor-pointer overflow-hidden relative">
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
        </>
      ) : (
        <>
          {/* 家长空间页面 */}
          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setParentView('settings')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👨‍👩‍👧</span>
                  <h1 className="text-2xl font-bold text-slate-800">家长空间</h1>
                </div>
                <p className="text-sm text-slate-500">管理孩子的学习进度</p>
              </div>
              <div className="w-12" />
            </div>

            {/* 用户信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-3xl p-5 mb-6 shadow-lg border-2 border-white"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-full p-0.5 shadow-md border-2 border-white bg-gradient-to-br overflow-hidden",
                  avatar.color
                )}>
                  <img src={avatar.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
                  <p className="text-sm text-sky-600">学习小达人</p>
                </div>
              </div>
            </motion.div>

            {/* 功能菜单 */}
            <div className="space-y-4">
              {parentMenuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-5 border-none shadow-md rounded-2xl cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative">
                    <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-r", item.color)} />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                        {item.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn("font-bold text-lg", item.textColor)}>{item.label}</h3>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* 退出按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={() => setParentView('settings')}
                className="w-full p-4 bg-slate-100 rounded-2xl shadow-md flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft size={18} />
                <span className="font-bold">退出家长空间</span>
              </button>
            </motion.div>
          </div>
        </>
      )}
    </MobileShell>
  );
};

export default Settings;

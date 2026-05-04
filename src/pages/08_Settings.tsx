import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Volume2, Eye, Mic2, Info, LogOut, Check, X } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const Settings = () => {
  const navigate = useNavigate();
  const [showParentPortal, setShowParentPortal] = useState(false);
  const [pin, setPin] = useState('');

  const settingsItems = [
    { icon: Volume2, label: '系统音量', value: '80%', color: 'text-sky-500', bg: 'bg-sky-50' },
    { icon: Eye, label: '护眼模式', value: '已开启', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Mic2, label: '语音包选择', value: '温柔姐姐', color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: Info, label: '关于项目', value: '', color: 'text-slate-400', bg: 'bg-slate-50' },
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
    <MobileShell showNav className="bg-slate-50">
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">设置</h1>

        {/* Parent Portal Trigger */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowParentPortal(true)}
          className="mb-8"
        >
          <Card className="p-6 bg-slate-900 text-white rounded-[32px] border-none shadow-xl flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield size={24} className="text-sky-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg">家长入口</h3>
                <p className="text-slate-400 text-xs font-medium">管理训练进度与课程</p>
              </div>
            </div>
            <ChevronRight className="text-slate-600" />
          </Card>
        </motion.div>

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 px-2 mb-2">通用设置</h3>
          {settingsItems.map((item) => (
            <Card key={item.label} className="p-5 flex items-center justify-between border-none shadow-sm rounded-3xl group cursor-pointer active:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.bg)}>
                  <item.icon size={24} className={item.color} />
                </div>
                <span className="font-bold text-slate-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-medium">{item.value}</span>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </Card>
          ))}
        </div>

        {/* Version Info */}
        <div className="mt-12 text-center">
          <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">守护星宝 v1.0.2</p>
          <p className="text-slate-300 text-[10px] mt-1">© 2026 守护星宝项目组</p>
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
            className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[48px] p-8 pb-12 flex flex-col items-center"
            >
              <button 
                onClick={() => { setShowParentPortal(false); setPin(''); }}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-6">
                <Shield size={32} className="text-sky-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">家长验证</h2>
              <p className="text-slate-400 text-sm mb-8">请输入四位数字密码 (Demo: 1234)</p>
              
              <div className="flex gap-4 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-200",
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
                      className="w-16 h-16 rounded-full bg-slate-50 hover:bg-sky-50 text-2xl font-black text-slate-700 active:scale-90 transition-all"
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

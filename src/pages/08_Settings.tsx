import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Info, User, Sparkles, ChevronLeft, Clock, Check, X } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';

type ParentView = 'settings' | 'timeLimit' | 'aboutProject' | 'changePassword';
type ParentViewState = 'enterPin' | 'main';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const { timeLimit, setTimeLimit } = useApp();
  const [parentView, setParentView] = useState<ParentView>('settings');
  const [parentViewState, setParentViewState] = useState<ParentViewState>('enterPin');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(timeLimit.minutes);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // 修改密码状态
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [pinError, setPinError] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

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
          setTimeout(() => {
            setShowPinModal(false);
            setParentView('timeLimit');
            setPin('');
          }, 200);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  // 预设时间选项
  const timeOptions = [
    { label: '15分钟', value: 15 },
    { label: '30分钟', value: 30 },
    { label: '45分钟', value: 45 },
    { label: '1小时', value: 60 },
    { label: '1.5小时', value: 90 },
    { label: '2小时', value: 120 },
  ];

  const handleSaveTimeLimit = () => {
    const minutes = showCustomInput && customMinutes ? parseInt(customMinutes) : selectedMinutes;
    if (minutes > 0) {
      setTimeLimit({
        enabled: true,
        minutes: timeOptions.find(o => o.value === minutes)?.value || 30,
        customMinutes: showCustomInput && customMinutes ? parseInt(customMinutes) : null
      });
      setParentView('settings');
    }
  };

  const handleDisableLimit = () => {
    setTimeLimit({ enabled: false, minutes: 30, customMinutes: null });
    setParentView('settings');
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

  // 密码修改相关
  const storedPassword = '1234'; // 实际应该存在localStorage或AppContext中
  
  const handlePinInput = (num: string, setter: React.Dispatch<React.SetStateAction<string>>, target: string) => {
    if (num === '⌫') {
      setter(prev => prev.slice(0, -1));
      return;
    }
    if (pinStep === target && (target === 'current' ? currentPin : target === 'new' ? newPin : confirmPin).length < 4) {
      if (target === 'current') {
        const newVal = currentPin + num;
        setCurrentPin(newVal);
        if (newVal.length === 4) {
          if (newVal === storedPassword) {
            setPinStep('new');
            setCurrentPin('');
          } else {
            setPinError(true);
            setTimeout(() => { setCurrentPin(''); setPinError(false); }, 800);
          }
        }
      } else if (target === 'new') {
        const newVal = newPin + num;
        setNewPin(newVal);
        if (newVal.length === 4) {
          setPinStep('confirm');
          setNewPin('');
        }
      } else if (target === 'confirm') {
        const newVal = confirmPin + num;
        setConfirmPin(newVal);
        if (newVal.length === 4) {
          if (newVal === newPin) {
            // 密码相同，保存新密码（这里简化处理，实际应该保存到存储）
            localStorage.setItem('parent_password', newVal);
            setPinSuccess(true);
            setTimeout(() => {
              setPinStep('current');
              setNewPin('');
              setConfirmPin('');
              setPinSuccess(false);
              setParentView('settings');
            }, 1500);
          } else {
            setPinError(true);
            setTimeout(() => { setConfirmPin(''); setPinError(false); }, 800);
          }
        }
      }
    }
  };

  const getPinDisplay = (val: string) => {
    if (pinSuccess) return '✓';
    return val;
  };

  const getPinValue = () => {
    if (pinStep === 'current') return currentPin;
    if (pinStep === 'new') return newPin;
    return confirmPin;
  };

  return (
    <MobileShell showNav={parentView === 'settings'} className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* PIN 输入弹窗 */}
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
              
              <p className="text-center text-xs text-slate-400 mb-4">请输入四位数字密码</p>
              
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
              
              <p className="text-center text-[10px] text-slate-300 mt-3">Demo 密码: 1234</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {parentView === 'settings' && (
        <>
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
                  <Card 
                  onClick={() => setParentView('aboutProject')}
                  className="p-5 flex items-center justify-between border-none shadow-md rounded-[24px] group cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative"
                >
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
      )}

      {parentView === 'timeLimit' && (
        <>
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setParentView('settings')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <h1 className="text-2xl font-bold text-slate-800">使用限制</h1>
                </div>
                <p className="text-sm text-slate-500">设置每日使用时长</p>
              </div>
              <div className="w-12" />
            </div>

            {timeLimit.enabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-5 mb-6 shadow-lg border-2 border-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Clock size={24} className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">当前设置</p>
                      <p className="text-2xl font-bold text-purple-700">{getLimitText()}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisableLimit}
                    className="px-4 py-2 bg-white rounded-full text-rose-500 text-sm font-bold shadow-md hover:bg-rose-50 transition-colors flex items-center gap-1"
                  >
                    <X size={16} />
                    关闭
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <h3 className="font-bold text-slate-700 mb-3">快速选择</h3>
              <div className="grid grid-cols-3 gap-3">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedMinutes(option.value);
                      setShowCustomInput(false);
                    }}
                    className={cn(
                      "p-4 rounded-2xl text-center transition-all shadow-md",
                      selectedMinutes === option.value && !showCustomInput
                        ? "bg-purple-500 text-white scale-105"
                        : "bg-white text-slate-600 hover:bg-purple-50"
                    )}
                  >
                    <span className="font-bold">{option.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="w-full p-4 rounded-2xl bg-white shadow-md flex items-center justify-between text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold">自定义时间</span>
                {showCustomInput ? <X size={20} /> : <ChevronRight size={20} />}
              </button>
              {showCustomInput && (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="输入分钟"
                    className="flex-1 p-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 outline-none text-center font-bold"
                  />
                  <span className="text-slate-500 font-bold">分钟</span>
                </div>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleSaveTimeLimit}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg text-white font-bold text-lg flex items-center justify-center gap-2"
            >
              <Check size={22} />
              保存设置
            </motion.button>

            {/* 修改密码按钮 */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              onClick={() => setParentView('changePassword')}
              className="w-full p-4 mt-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Shield size={20} />
              <span className="font-bold">修改密码</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-amber-50 rounded-2xl"
            >
              <p className="text-amber-700 text-sm font-medium">
                💡 温馨提示：当使用时间达到设置限制时，会弹出温馨提醒，孩子需要家长输入密码才能继续使用。
              </p>
            </motion.div>
          </div>
        </>
      )}

      {parentView === 'aboutProject' && (
        <>
          <div className="px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setParentView('settings')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">ℹ️</span>
                  <h1 className="text-2xl font-bold text-slate-800">用户使用说明</h1>
                </div>
              </div>
              <div className="w-12" />
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-100 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* 用户使用说明 */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-purple-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📖</span> 用户使用说明
                </h2>
                
                <div className="space-y-4 text-sm text-slate-600">
                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">一、产品定位</h3>
                    <p>本APP是一款面向孤独症谱系障碍儿童、语言发育迟缓儿童的辅助语言康复训练工具，通过电子宠物陪伴、AI绘本互动、趣味康复游戏等形式，提升儿童语言表达能力、社交反应能力与情绪感知能力，<span className="text-rose-500 font-bold">非医疗诊断、非替代专业康复治疗产品</span>。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">二、适用人群</h3>
                    <p className="mb-1">1. 2-12岁存在语言发育迟缓、轻度孤独症谱系障碍、社交沟通障碍的儿童；</p>
                    <p>2. 需在家长/监护人全程陪同、监护下使用，<span className="text-rose-500 font-bold">禁止儿童独立操作</span>。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">三、核心使用规则</h3>
                    
                    <div className="ml-2 space-y-2">
                      <div>
                        <p className="font-medium text-slate-700">1. 使用前提</p>
                        <p>本APP仅作为家庭康复辅助工具，使用前建议家长已咨询儿童康复科医生、言语治疗师等专业人士，明确儿童康复需求。</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-slate-700">2. 使用规范</p>
                        <p className="mb-1">（1）每日使用时长建议控制在30分钟内，单次使用不超过15分钟，避免儿童过度用眼、产生抵触情绪；</p>
                        <p className="mb-1">（2）所有训练内容需监护人全程引导，结合线下真实场景巩固训练效果；</p>
                        <p>（3）电子宠物语音、互动内容可由监护人自定义设置，贴合儿童熟悉的声音，降低防备心理。</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-slate-700">3. 功能使用说明</p>
                        <p className="mb-1">（1）智能宠物陪伴区：用于日常语言引导、情绪安抚，培养儿童表达欲望；</p>
                        <p className="mb-1">（2）AI绘本闯关区：按阶段完成社交场景模拟训练，闯关奖励仅为APP内虚拟道具，无实际价值；</p>
                        <p>（3）趣味游戏区：通过指令反应、情绪识别、拼图训练，锻炼儿童理解能力与辨别能力。</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-slate-700">4. 隐私保护</p>
                        <p className="mb-1">（1）APP仅收集儿童康复训练数据、使用行为数据，仅用于优化康复内容、提升产品效果；</p>
                        <p>（2）不会向第三方泄露用户个人信息、儿童隐私信息，监护人可在设置中查看、清除数据。</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">四、禁止行为</h3>
                    <p className="mb-1">1. <span className="text-rose-500 font-bold">禁止将本APP用于医疗诊断、替代医院专业康复治疗；</span></p>
                    <p className="mb-1">2. 禁止利用本APP进行商业推广、违规传播、恶意篡改产品内容；</p>
                    <p>3. 禁止未满18周岁儿童独立注册、登录及使用本APP。</p>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t-2 border-dashed border-slate-200 my-4" />

              {/* 免责声明 */}
              <div>
                <h2 className="text-lg font-bold text-purple-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span> 免责声明
                </h2>
                
                <div className="space-y-3 text-sm text-slate-600">
                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">1. 产品性质声明</h3>
                    <p>本APP为非医疗类康复辅助工具，所有训练内容、互动模式仅为通用康复参考，不构成医疗诊断、治疗建议，不能替代医院、康复机构的专业言语治疗、康复训练。儿童康复效果存在个体差异，本APP不承诺、不保证任何康复效果。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">2. 监护责任声明</h3>
                    <p>儿童使用本APP期间，监护人必须全程陪同、监护，对儿童使用行为、操作安全、用眼健康、心理健康负全部责任。因监护人监护不当、未按使用说明操作导致的任何风险、损害，均由监护人自行承担，本平台不承担任何责任。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">3. 信息与隐私免责</h3>
                    <p>监护人需保证注册信息、儿童信息真实有效，因信息填写错误、虚假信息导致的问题，平台不承担责任；平台将严格遵守隐私保护政策，若因不可抗力、第三方恶意攻击导致信息泄露，平台不承担相关责任。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">4. 使用风险免责</h3>
                    <p className="mb-1">（1）儿童在使用过程中产生的抵触情绪、身体不适，监护人应立即停止使用，平台不承担相关责任；</p>
                    <p className="mb-1">（2）因网络故障、设备故障、APP版本更新等问题，导致使用中断、数据丢失，平台仅负责协助处理，不承担赔偿责任；</p>
                    <p>（3）APP内虚拟道具、闯关奖励仅为互动激励，无实际经济价值，平台有权根据运营规则调整、取消相关奖励。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">5. 知识产权声明</h3>
                    <p>本APP所有内容、技术、界面、素材的知识产权均归本平台所有，未经授权禁止复制、传播、篡改，违者将追究法律责任。</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 mb-1">6. 其他说明</h3>
                    <p>本平台有权根据法律法规、产品运营需求，随时更新本使用说明与免责声明，更新后将通过APP内公告告知，继续使用本APP即视为同意更新后的全部条款。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-slate-400 text-xs">© 2026 守护星宝项目组</p>
              <p className="text-amber-400 text-xs mt-1">陪伴星宝健康成长 💕</p>
            </div>
          </div>
        </>
      )}

      {/* 修改密码视图 */}
      {parentView === 'changePassword' && (
        <>
          <div className="px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => {
                  setParentView('timeLimit');
                  setPinStep('current');
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                  setPinError(false);
                }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  <h1 className="text-2xl font-bold text-slate-800">修改密码</h1>
                </div>
              </div>
              <div className="w-12" />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-100">
              {pinSuccess ? (
                /* 成功状态 */
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={40} className="text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">密码修改成功！</h2>
                  <p className="text-slate-500">请牢记您的新密码</p>
                </motion.div>
              ) : (
                <>
                  {/* 步骤提示 */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      pinStep === 'current' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500'
                    )}>
                      {pinStep === 'current' ? '1' : <Check size={16} />}
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200" />
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      pinStep === 'new' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500'
                    )}>
                      {pinStep === 'new' ? '2' : pinStep === 'confirm' ? <Check size={16} /> : '2'}
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200" />
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      pinStep === 'confirm' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500'
                    )}>
                      3
                    </div>
                  </div>

                  <p className="text-center text-sm text-slate-500 mb-4">
                    {pinStep === 'current' && '请输入当前密码'}
                    {pinStep === 'new' && '请输入新密码（4位数字）'}
                    {pinStep === 'confirm' && '请再次输入新密码'}
                  </p>

                  {/* 密码点 */}
                  <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-5 h-5 rounded-full transition-all duration-150",
                          getPinValue().length > i 
                            ? pinError ? "bg-rose-400 scale-125" : "bg-purple-500 scale-125" 
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
                          onClick={() => handlePinInput(num, () => {}, pinStep === 'current' ? 'current' : pinStep === 'new' ? 'new' : 'confirm')}
                          className={cn(
                            "h-14 rounded-xl flex items-center justify-center text-xl font-medium transition-all active:scale-95",
                            num === '⌫' 
                              ? "bg-slate-100 text-slate-400" 
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-sm"
                          )}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  {pinError && (
                    <p className="text-center text-rose-500 text-sm mt-4">密码错误，请重试</p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </MobileShell>
  );
};

export default Settings;

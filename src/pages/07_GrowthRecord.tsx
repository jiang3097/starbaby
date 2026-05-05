import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Trophy, Star, MessageCircle, BookOpen, Gamepad2, TrendingUp, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useApp, getWeekDates } from '../context/AppContext';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 洗澡特效组件
const BathEffect = ({ show, onComplete }: { show: boolean; onComplete: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const bubbles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    delay: Math.random() * 0.5,
    size: 10 + Math.random() * 20,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-sky-200/90 to-sky-300/90 flex flex-col items-center justify-center"
    >
      {/* 泡沫效果 */}
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${bubble.left}%`,
            bottom: '20%',
            width: bubble.size,
            height: bubble.size,
          }}
          animate={{
            y: [0, -300, -500],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 1.5],
          }}
          transition={{
            duration: 2,
            delay: bubble.delay,
            repeat: Infinity,
          }}
        >
          ✨
        </motion.div>
      ))}
      
      {/* 洗澡中的文字 */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🛁</div>
        <h2 className="text-3xl font-bold text-sky-700 mb-2">正在洗澡~</h2>
        <p className="text-sky-600">泡泡好舒服呀！</p>
      </motion.div>
    </motion.div>
  );
};

const GrowthRecord = () => {
  const navigate = useNavigate();
  const { profile, avatar, useFood, useToy, takeBath } = useUser();
  const { dailyStats, weeklyStats } = useApp();
  
  const [displayStats, setDisplayStats] = useState({
    trainingMinutes: dailyStats.trainingMinutes,
    expressionCount: dailyStats.expressionCount,
    gamePassCount: dailyStats.gamePassCount,
  });
  
  const [showBathEffect, setShowBathEffect] = useState(false);
  const [usedFood, setUsedFood] = useState(false);
  const [usedToy, setUsedToy] = useState(false);
  
  const usedFoodTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const usedToyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // 防抖更新显示数据 - 与每日数据同步
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayStats({
        trainingMinutes: dailyStats.trainingMinutes,
        expressionCount: dailyStats.expressionCount,
        gamePassCount: dailyStats.gamePassCount,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [dailyStats]);

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 计算本周活跃度 - 基于实际每日数据，确保与成长板块数据同步
  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];
  
  const weekData = weekDates.map((date, index) => {
    const isToday = date === today;
    // 今日使用 dailyStats 保证数据同步，往日使用 weeklyStats
    let minutes, expression, game;
    if (isToday) {
      minutes = dailyStats.trainingMinutes;
      expression = dailyStats.expressionCount;
      game = dailyStats.gamePassCount;
    } else {
      const dayData = weeklyStats[date];
      minutes = dayData?.trainingMinutes || 0;
      expression = dayData?.expressionCount || 0;
      game = dayData?.gamePassCount || 0;
    }
    // 权重计算：训练时长40% + 主动表达30% + 趣味闯关30%
    const minutesScore = Math.min(minutes * 4, 100) * 0.4;
    const expressionScore = Math.min(expression * 10, 100) * 0.3;
    const gameScore = Math.min(game * 10, 100) * 0.3;
    const activity = Math.round(minutesScore + expressionScore + gameScore);
    return { date, activity, minutes, expression, game, isToday };
  });
  
  // 今日活跃度（用于显示）
  const todayActivity = weekData[weekData.length - 1]?.activity || 0;

  const maxActivity = Math.max(...weekData.map(d => d.activity), 1);

  // 洗澡处理
  const handleBath = () => {
    if (profile.cleanliness >= 100) {
      speakText('我已经好干净啦！谢谢！');
      return;
    }
    setShowBathEffect(true);
    speakText('洗澡澡啦！泡泡好舒服呀！');
  };

  const handleBathComplete = () => {
    setShowBathEffect(false);
    takeBath();
    speakText('洗完啦！我变得好干净好香哦！✨');
  };

  // 使用食物
  const handleUseFood = () => {
    if (usedFood) return;
    if (profile.foods <= 0) {
      speakText('没有食物道具啦，下次通关再获得吧！');
      return;
    }
    if (profile.fullness >= 100) {
      speakText('我已经吃饱啦！');
      return;
    }
    const success = useFood();
    if (success) {
      setUsedFood(true);
      speakText('好吃！谢谢喂我吃东西！🍖');
      usedFoodTimerRef.current = setTimeout(() => setUsedFood(false), 1000);
    }
  };

  // 使用玩具
  const handleUseToy = () => {
    if (usedToy) return;
    if (profile.toys <= 0) {
      speakText('没有玩具道具啦，下次通关再获得吧！');
      return;
    }
    if (profile.mood >= 100) {
      speakText('我现在很开心呀！');
      return;
    }
    const success = useToy();
    if (success) {
      setUsedToy(true);
      speakText('玩具好好玩！好开心呀！🎉');
      usedToyTimerRef.current = setTimeout(() => setUsedToy(false), 1000);
    }
  };

  // 获取状态颜色
  const getStatusColor = (value: number) => {
    if (value >= 70) return 'text-emerald-500';
    if (value >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStatusBg = (value: number) => {
    if (value >= 70) return 'bg-emerald-100';
    if (value >= 40) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  // 获取道具图标
  const getFoodEmoji = () => {
    const foods = ['🍎', '🍕', '🍔', '🍰', '🧁', '🍩'];
    return foods[Math.floor(Math.random() * foods.length)];
  };

  const getToyEmoji = () => {
    const toys = ['🧸', '🎈', '🎯', '🎨', '🚗', '🎮'];
    return toys[Math.floor(Math.random() * toys.length)];
  };

  return (
    <MobileShell className="bg-gradient-to-b from-purple-50 to-white">
      <BathEffect show={showBathEffect} onComplete={handleBathComplete} />

      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <h1 className="text-2xl font-bold text-slate-800">成长记录</h1>
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* 星小宝状态卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-5 mb-6 shadow-lg border-2 border-white"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-16 h-16 rounded-full p-0.5 shadow-md border-2 border-white bg-gradient-to-br overflow-hidden",
              avatar.color
            )}>
              <img src={avatar.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{profile.name}的状态</h2>
              <p className="text-sm text-purple-600 font-medium">好好照顾我哦！🌟</p>
            </div>
            <div className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full">
              <Heart size={14} className="text-rose-400 fill-rose-400" />
              <span className="text-sm font-bold text-rose-500">{profile.intimacy}</span>
            </div>
          </div>

          {/* 状态条 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* 饱腹值 */}
            <div className="bg-white/70 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                  🍖 饱腹值
                </span>
                <span className={cn("text-sm font-bold", getStatusColor(profile.fullness))}>
                  {profile.fullness}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.fullness}%` }}
                />
              </div>
            </div>

            {/* 心情值 */}
            <div className="bg-white/70 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-pink-600 flex items-center gap-1">
                  😊 心情值
                </span>
                <span className={cn("text-sm font-bold", getStatusColor(profile.mood))}>
                  {profile.mood}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.mood}%` }}
                />
              </div>
            </div>

            {/* 清洁值 */}
            <div className="bg-white/70 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-sky-600 flex items-center gap-1">
                  🛁 清洁值
                </span>
                <span className={cn("text-sm font-bold", getStatusColor(profile.cleanliness))}>
                  {profile.cleanliness}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-400 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.cleanliness}%` }}
                />
              </div>
            </div>

            {/* 亲密度 */}
            <div className="bg-white/70 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-rose-600 flex items-center gap-1">
                  ❤️ 亲密度
                </span>
                <span className={cn("text-sm font-bold", getStatusColor(profile.intimacy))}>
                  {profile.intimacy}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.intimacy}%` }}
                />
              </div>
            </div>
          </div>

          {/* 道具区域 */}
          <div className="flex gap-3">
            {/* 食物道具 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUseFood}
              className={cn(
                "flex-1 py-3 rounded-2xl flex flex-col items-center shadow-md transition-all",
                profile.foods > 0 && profile.fullness < 100 && !usedFood
                  ? "bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200"
                  : "bg-slate-100 cursor-not-allowed"
              )}
              disabled={profile.foods <= 0 || profile.fullness >= 100 || usedFood}
            >
              <span className="text-2xl">{usedFood ? '✨' : getFoodEmoji()}</span>
              <span className="text-xs font-bold text-orange-600 mt-1">
                食物 x{profile.foods}
              </span>
              <span className="text-[10px] text-orange-400">
                {profile.foods <= 0 ? '无道具' : profile.fullness >= 100 ? '已满' : '点击使用'}
              </span>
            </motion.button>

            {/* 玩具道具 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUseToy}
              className={cn(
                "flex-1 py-3 rounded-2xl flex flex-col items-center shadow-md transition-all",
                profile.toys > 0 && profile.mood < 100 && !usedToy
                  ? "bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200"
                  : "bg-slate-100 cursor-not-allowed"
              )}
              disabled={profile.toys <= 0 || profile.mood >= 100 || usedToy}
            >
              <span className="text-2xl">{usedToy ? '✨' : getToyEmoji()}</span>
              <span className="text-xs font-bold text-pink-600 mt-1">
                玩具 x{profile.toys}
              </span>
              <span className="text-[10px] text-pink-400">
                {profile.toys <= 0 ? '无道具' : profile.mood >= 100 ? '已满' : '点击使用'}
              </span>
            </motion.button>

            {/* 洗澡按钮 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBath}
              className={cn(
                "flex-1 py-3 rounded-2xl flex flex-col items-center shadow-md transition-all",
                profile.cleanliness < 100
                  ? "bg-gradient-to-r from-sky-100 to-blue-100 hover:from-sky-200 hover:to-blue-200"
                  : "bg-slate-100 cursor-not-allowed"
              )}
              disabled={profile.cleanliness >= 100}
            >
              <span className="text-2xl">🛁</span>
              <span className="text-xs font-bold text-sky-600 mt-1">洗澡</span>
              <span className="text-[10px] text-sky-400">
                {profile.cleanliness >= 100 ? '已干净' : '点击洗澡'}
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* 今日数据卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 mb-6 shadow-lg border-2 border-slate-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">今日数据</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={24} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{displayStats.trainingMinutes}</p>
              <p className="text-xs text-slate-500">训练时长(分钟)</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle size={24} className="text-pink-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{displayStats.expressionCount}</p>
              <p className="text-xs text-slate-500">主动表达次数</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Gamepad2 size={24} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{displayStats.gamePassCount}</p>
              <p className="text-xs text-slate-500">趣味闯关</p>
            </div>
          </div>
        </motion.div>

        {/* 本周活跃度折线图 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-500" />
              <h3 className="font-bold text-slate-800">本周语言活跃度</h3>
            </div>
            <span className="text-sm text-purple-600 font-medium">
              今日: {todayActivity}分
            </span>
          </div>

          {/* 权重说明 */}
          <div className="flex items-center justify-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-slate-500">训练时长40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-500">主动表达30%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-slate-500">趣味闯关30%</span>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-36 px-2">
            {weekData.map((day, index) => {
              const height = (day.activity / maxActivity) * 100;
              const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
              
              return (
                <div key={day.date} className="flex flex-col items-center flex-1">
                  {/* 显示数值 */}
                  <div className="text-[10px] text-slate-400 mb-1 h-4">
                    {day.activity > 0 ? day.activity : ''}
                  </div>
                  <div className="relative w-full flex justify-center items-end h-24">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 4)}%` }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={cn(
                        "w-6 rounded-t-lg transition-all relative",
                        day.isToday 
                          ? "bg-gradient-to-t from-purple-500 to-pink-400" 
                          : "bg-gradient-to-t from-purple-300 to-pink-200"
                      )}
                    >
                      {/* 顶部分数 */}
                      {height > 20 && (
                        <span className={cn(
                          "absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold",
                          day.isToday ? "text-purple-600" : "text-purple-400"
                        )}>
                          {day.activity}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <p className={cn(
                    "text-xs mt-2 font-bold",
                    day.isToday ? "text-purple-600" : "text-slate-400"
                  )}>
                    {dayNames[index]}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* 详细数据 - 使用今日数据保证同步 */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-500">训练时长</span>
              </div>
              <span className="text-sm font-bold text-teal-600">
                {dailyStats.trainingMinutes}分钟
              </span>
            </div>
            <div className="flex flex-col items-center border-l border-r border-slate-100">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">主动表达</span>
              </div>
              <span className="text-sm font-bold text-amber-600">
                {dailyStats.expressionCount}次
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-xs text-slate-500">趣味闯关</span>
              </div>
              <span className="text-sm font-bold text-pink-600">
                {dailyStats.gamePassCount}次
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </MobileShell>
  );
};

export default GrowthRecord;

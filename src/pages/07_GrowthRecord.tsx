import React, { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, MessageSquare, BookOpen, Star, ChevronLeft, Award, Heart } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useApp, getWeekDates } from '../context/AppContext';

const GrowthRecord = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const { dailyStats, weeklyStats } = useApp();
  
  // 使用 ref 存储最新数据，避免闭包问题
  const weeklyStatsRef = useRef(weeklyStats);
  weeklyStatsRef.current = weeklyStats;

  // 稳定显示的数据（用于展示，不频繁更新）
  const [displayStats, setDisplayStats] = React.useState({
    trainingMinutes: dailyStats.trainingMinutes,
    expressionCount: dailyStats.expressionCount,
    gamePassCount: dailyStats.gamePassCount,
  });

  // 防抖更新显示数据（缩短到500ms，保持流畅但不过于频繁）
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayStats({
        trainingMinutes: dailyStats.trainingMinutes,
        expressionCount: dailyStats.expressionCount,
        gamePassCount: dailyStats.gamePassCount,
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [dailyStats.trainingMinutes, dailyStats.expressionCount, dailyStats.gamePassCount]);

  const stats = [
    { label: '今日训练', value: displayStats.trainingMinutes, unit: '分钟', icon: Clock, gradient: 'from-amber-200 to-orange-300', emoji: '🎯' },
    { label: '主动表达', value: displayStats.expressionCount, unit: '次数', icon: MessageSquare, gradient: 'from-rose-200 to-pink-300', emoji: '💬' },
    { label: '趣味闯关', value: displayStats.gamePassCount, unit: '关卡', icon: BookOpen, gradient: 'from-emerald-200 to-teal-300', emoji: '📚' },
  ];

  // 增长百分比
  const chatGrowth = displayStats.expressionCount > 0 ? Math.min(displayStats.expressionCount * 8, 50) : 0;
  const trainingGrowth = displayStats.trainingMinutes > 0 ? Math.min(displayStats.trainingMinutes * 2, 30) : 0;

  // 计算本周活跃度数据
  const weekData = useMemo(() => {
    const dates = getWeekDates();
    const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
    
    return dates.map((date, index) => {
      const dayStats = weeklyStats[date] || { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      
      // 计算综合活跃度：训练时长40% + 主动表达30% + 趣味闯关30%
      // 为了可视化效果，将数值归一化到合理范围
      const normalizedTraining = dayStats.trainingMinutes * 0.4;
      const normalizedExpression = dayStats.expressionCount * 0.3 * 10; // 表达次数放大10倍
      const normalizedGame = dayStats.gamePassCount * 0.3 * 20; // 闯关放大20倍
      const total = normalizedTraining + normalizedExpression + normalizedGame;
      
      return {
        date,
        dayName: dayNames[index],
        trainingMinutes: dayStats.trainingMinutes,
        expressionCount: dayStats.expressionCount,
        gamePassCount: dayStats.gamePassCount,
        total: Math.round(total),
      };
    });
  }, [weeklyStats]);

  // 计算折线图的数据点和最大值
  const chartData = useMemo(() => {
    const values = weekData.map(d => d.total);
    const maxValue = Math.max(...values, 10); // 最小为10，保证有高度
    return { values, maxValue };
  }, [weekData]);

  // 星期几（0-6），周日为0
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // 转换为0-6，0=周一

  return (
    <MobileShell showNav className="bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300"
            style={{ left: `${8 + i * 10}%`, top: `${5 + (i % 4) * 4}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.1, 0.8] }}
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
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-purple-400 hover:bg-purple-50 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl font-bold text-slate-800">成长档案</h1>
            </div>
            <p className="text-sm text-purple-600 font-medium">记录{profile.name}的每一点进步~</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-md border-2 border-white">
            <span className="text-xl">🏆</span>
          </div>
        </div>

        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-5 mb-6 shadow-lg border-2 border-white"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full p-0.5 shadow-md border-2 border-white bg-gradient-to-br overflow-hidden",
              avatar.color
            )}>
              <img src={avatar.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{profile.name}的成长记录</h2>
              <p className="text-sm text-purple-600 font-medium">继续加油，你是最棒的！🌟</p>
            </div>
            <div className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full">
              <Heart size={14} className="text-rose-400 fill-rose-400" />
              <span className="text-sm font-bold text-rose-500">{profile.intimacy}</span>
            </div>
          </div>
          {/* 亲密度进度条 */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-rose-500 font-medium">亲密度</span>
              <span className="text-slate-400">{profile.intimacy}/100</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profile.intimacy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "p-5 flex items-center justify-between border-none shadow-md rounded-[28px] overflow-hidden relative"
              )}>
                <div className={cn(
                  "absolute inset-0 opacity-30",
                  `bg-gradient-to-r ${stat.gradient}`
                )} />
                
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-white"
                  )}>
                    <span className="text-3xl">{stat.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-400 text-xs font-bold uppercase">{stat.label}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                      <span className="text-slate-400 text-sm font-bold">{stat.unit}</span>
                    </div>
                  </div>
                  {stat.value > 0 && (
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white px-4 py-2 rounded-full shadow-md flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span className="text-xs font-bold">+{stat.label === '主动表达' ? chatGrowth : trainingGrowth}%</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Weekly Progress - 折线图 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 border-none shadow-md rounded-[32px] mb-6 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <h3 className="font-bold text-slate-800">本周语言活跃度</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp size={14} />
                稳步提升
              </div>
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-500">训练时长40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-slate-500">主动表达30%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-500">趣味闯关30%</span>
              </div>
            </div>

            {/* 折线图 */}
            <div className="relative h-48 px-2">
              {/* Y轴刻度 */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400 font-medium pr-2">
                <span>{chartData.maxValue}</span>
                <span>{Math.round(chartData.maxValue * 0.75)}</span>
                <span>{Math.round(chartData.maxValue * 0.5)}</span>
                <span>{Math.round(chartData.maxValue * 0.25)}</span>
                <span>0</span>
              </div>

              {/* 图表区域 */}
              <div className="absolute left-8 right-0 top-2 bottom-8">
                {/* 网格线 */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="border-b border-slate-100" />
                  ))}
                </div>

                {/* 折线 */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* 面积填充 */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
                      <stop offset="100%" stopColor="rgba(139, 92, 246, 0.02)" />
                    </linearGradient>
                  </defs>
                  
                  {/* 面积 */}
                  <path
                    d={`M 0,100 ${chartData.values.map((v, i) => {
                      const x = (i / 6) * 100;
                      const y = 100 - (v / chartData.maxValue) * 100;
                      return `L ${x},${y}`;
                    }).join(' ')} L 100,100 Z`}
                    fill="url(#lineGradient)"
                  />

                  {/* 线条 */}
                  <path
                    d={`M 0,100 ${chartData.values.map((v, i) => {
                      const x = (i / 6) * 100;
                      const y = 100 - (v / chartData.maxValue) * 100;
                      return `L ${x},${y}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="url(#lineGradientStroke)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <defs>
                    <linearGradient id="lineGradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {/* 数据点 */}
                  {chartData.values.map((v, i) => {
                    const x = (i / 6) * 100;
                    const y = 100 - (v / chartData.maxValue) * 100;
                    const isToday = i === todayIndex;
                    return (
                      <g key={i}>
                        {/* 今日高亮点 */}
                        {isToday && (
                          <circle
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#8b5cf6"
                            stroke="white"
                            strokeWidth="0.5"
                          />
                        )}
                        {/* 普通点 */}
                        {!isToday && v > 0 && (
                          <circle
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#c4b5fd"
                            stroke="white"
                            strokeWidth="0.3"
                          />
                        )}
                        {/* 零值点 */}
                        {v === 0 && (
                          <circle
                            cx={x}
                            cy={y}
                            r="1"
                            fill="#e5e7eb"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* X轴标签 */}
              <div className="absolute left-8 right-0 bottom-0 flex justify-between px-1">
                {weekData.map((d, i) => (
                  <div
                    key={d.date}
                    className={cn(
                      "flex flex-col items-center",
                      i === todayIndex && "text-purple-600 font-bold"
                    )}
                  >
                    <span className="text-xs">{d.dayName}</span>
                    <span className={cn(
                      "text-[10px] mt-0.5",
                      i === todayIndex ? "text-purple-500 font-bold" : "text-slate-400"
                    )}>
                      {d.total > 0 ? d.total : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-center gap-2 px-2">
            <span className="text-xl">🏅</span>
            <h3 className="font-bold text-slate-800">获得的徽章</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto py-2 px-2">
            {[
              { name: '开口小达人', emoji: '🎤', gradient: 'from-amber-200 to-orange-300' },
              { name: '场景专家', emoji: '🎭', gradient: 'from-sky-200 to-blue-300' },
              { name: '坚持不懈', emoji: '💪', gradient: 'from-rose-200 to-pink-300' },
              { name: '阅读之星', emoji: '📚', gradient: 'from-emerald-200 to-teal-300' },
            ].map((badge) => (
              <motion.div
                key={badge.name}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 min-w-[100px] bg-white rounded-3xl p-4 shadow-md"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br",
                  badge.gradient
                )}>
                  <span className="text-3xl">{badge.emoji}</span>
                </div>
                <span className="text-xs font-bold text-slate-600 text-center">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <Navigation />
    </MobileShell>
  );
};

export default GrowthRecord;

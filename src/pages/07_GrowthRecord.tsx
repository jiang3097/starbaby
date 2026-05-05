import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, MessageSquare, BookOpen, Star, Calendar, ChevronLeft, Award, Heart } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';

const GrowthRecord = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();

  const stats = [
    { label: '今日训练', value: '45', unit: '分钟', icon: Clock, gradient: 'from-amber-200 to-orange-300', emoji: '🎯' },
    { label: '主动表达', value: '28', unit: '次数', icon: MessageSquare, gradient: 'from-rose-200 to-pink-300', emoji: '💬' },
    { label: '绘本通关', value: '4', unit: '关卡', icon: BookOpen, gradient: 'from-emerald-200 to-teal-300', emoji: '📚' },
  ];

  return (
    <MobileShell showNav className="bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 星星装饰 */}
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
              <span className="text-sm font-bold text-rose-500">85</span>
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
                {/* 装饰 */}
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
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white px-4 py-2 rounded-full shadow-md flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span className="text-xs font-bold">+12%</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 border-none shadow-md rounded-[32px] mb-6 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <h3 className="font-bold text-slate-800">本周语言活跃度</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp size={14} />
                稳步提升
              </div>
            </div>
            
            <div className="flex items-end justify-between h-40 px-2">
              {[30, 45, 60, 25, 80, 50, 40].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    className={cn(
                      "w-8 rounded-full shadow-md",
                      i === 4 ? "bg-gradient-to-t from-purple-400 to-pink-400" : "bg-purple-200"
                    )}
                  />
                  <span className="text-xs font-bold text-slate-400">
                    {['一', '二', '三', '四', '五', '六', '日'][i]}
                  </span>
                </div>
              ))}
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
          <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide">
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

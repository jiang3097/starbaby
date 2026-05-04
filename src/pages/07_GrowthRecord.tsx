import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, MessageSquare, BookOpen, Star, Calendar } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const GrowthRecord = () => {
  const stats = [
    { label: '今日训练', value: '45', unit: '分钟', icon: Clock, color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { label: '主动表达', value: '28', unit: '次数', icon: MessageSquare, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { label: '绘本通关', value: '4', unit: '关卡', icon: BookOpen, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  ];

  return (
    <MobileShell showNav className="bg-slate-50">
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">成长档案</h1>
            <p className="text-slate-400 text-sm font-medium">记录星宝的每一点进步</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Calendar size={24} className="text-slate-400" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5 flex items-center justify-between border-none shadow-sm rounded-[32px]">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bgColor)}>
                  <stat.icon size={28} className={stat.color} />
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase">{stat.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                    <span className="text-slate-400 text-sm font-bold">{stat.unit}</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                +12%
              </div>
            </Card>
          ))}
        </div>

        {/* Weekly Progress - Minimalist Chart */}
        <Card className="p-6 border-none shadow-sm rounded-[40px] mb-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">本周语言活跃度</h3>
            <div className="flex items-center gap-1 text-sky-500 font-bold text-sm">
              <TrendingUp size={16} />
              稳步提升
            </div>
          </div>
          
          <div className="flex items-end justify-between h-40 px-2">
            {[30, 45, 60, 25, 80, 50, 40].map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className={cn(
                    "w-6 rounded-full",
                    i === 4 ? "bg-sky-500 shadow-lg shadow-sky-200" : "bg-sky-100"
                  )}
                />
                <span className="text-[10px] font-bold text-slate-300">
                  {['一', '二', '三', '四', '五', '六', '日'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Achievements */}
        <div className="space-y-4 mb-10">
          <h3 className="font-bold text-slate-800 px-2">获得的徽章</h3>
          <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide">
            {[
              { name: '开口小达人', icon: Star, color: 'text-amber-500', bg: 'bg-amber-100' },
              { name: '场景专家', icon: MessageSquare, color: 'text-sky-500', bg: 'bg-sky-100' },
              { name: '坚持不懈', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-100' },
            ].map((badge) => (
              <div key={badge.name} className="flex flex-col items-center gap-2 min-w-[100px]">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-md", badge.bg)}>
                  <badge.icon size={32} className={badge.color} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Navigation />
    </MobileShell>
  );
};

export default GrowthRecord;

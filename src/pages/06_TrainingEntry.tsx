import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Smile, Search, LayoutPanelTop, Play } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const TrainingEntry = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'emotions',
      title: '表情猜猜看',
      desc: '谁在笑？谁在生气？',
      icon: Smile,
      color: 'bg-rose-100',
      iconColor: 'bg-rose-200',
      textColor: 'text-rose-600',
      goal: '情绪认知',
      gradient: 'from-rose-200 to-pink-200',
    },
    {
      id: 'finding',
      title: '指令寻物',
      desc: '帮小宝找到红色杯子',
      icon: Search,
      color: 'bg-sky-100',
      iconColor: 'bg-sky-200',
      textColor: 'text-sky-600',
      goal: '听者行为',
      gradient: 'from-sky-200 to-blue-200',
    },
    {
      id: 'puzzle',
      title: '拼图表达',
      desc: '拼出你想说的话',
      icon: LayoutPanelTop,
      color: 'bg-amber-100',
      iconColor: 'bg-amber-200',
      textColor: 'text-amber-600',
      goal: '逻辑思维',
      gradient: 'from-amber-200 to-orange-200',
    }
  ];

  return (
    <MobileShell className="bg-gradient-to-b from-emerald-50 via-teal-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-200 text-2xl"
            initial={{ 
              opacity: 0,
              x: Math.random() * 400,
              y: Math.random() * 800,
            }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              y: [null, Math.random() * 50 - 25],
            }}
            transition={{ 
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {i % 2 === 0 ? '🌟' : '✨'}
          </motion.div>
        ))}
      </div>

      <div className="px-6 py-6 relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-slate-400"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">趣味训练</h1>
            <p className="text-sm text-emerald-600 font-medium">提升认知与表达能力</p>
          </div>
        </div>

        {/* Game Buttons */}
        <div className="space-y-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (game.id === 'emotions') {
                  navigate('/emotion-guess');
                } else if (game.id === 'finding') {
                  navigate('/instruction-find');
                } else if (game.id === 'puzzle') {
                  navigate('/puzzle-express');
                }
              }}
              className="cursor-pointer"
            >
              <Card className={cn(
                "p-6 flex items-center gap-5 border-none shadow-md rounded-[32px] overflow-hidden relative",
                game.color
              )}>
                {/* 左侧图标区域 */}
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br",
                  game.gradient
                )}>
                  <game.icon size={40} className={game.textColor} />
                </div>
                
                {/* 文字区域 */}
                <div className="flex-1">
                  <h3 className={cn("text-xl font-bold mb-1", game.textColor)}>{game.title}</h3>
                  <p className="text-slate-500 text-sm mb-3">{game.desc}</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/70 px-3 py-0.5 rounded-full text-xs font-bold text-slate-500">
                      {game.goal}
                    </span>
                  </div>
                </div>

                {/* 右侧播放按钮 */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-md",
                    game.textColor.replace('text', 'bg').replace('600', '100')
                  )}
                >
                  <Play size={24} className={game.textColor} fill="currentColor" />
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 温馨提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-emerald-100"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-emerald-700 mb-1">温馨提示</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                每个训练游戏都有不同的难度级别，可以根据孩子的能力选择合适的挑战哦！
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MobileShell>
  );
};

export default TrainingEntry;

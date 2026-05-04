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
      color: 'bg-rose-50',
      iconColor: 'bg-rose-200',
      textColor: 'text-rose-600',
      goal: '情绪认知'
    },
    {
      id: 'finding',
      title: '指令寻物',
      desc: '帮小宝找到红色杯子',
      icon: Search,
      color: 'bg-sky-50',
      iconColor: 'bg-sky-200',
      textColor: 'text-sky-600',
      goal: '听者行为'
    },
    {
      id: 'puzzle',
      title: '拼图表达',
      desc: '拼出你想说的话',
      icon: LayoutPanelTop,
      color: 'bg-amber-50',
      iconColor: 'bg-amber-200',
      textColor: 'text-amber-600',
      goal: '逻辑思维'
    }
  ];

  return (
    <MobileShell className="bg-white">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shadow-sm text-slate-400"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">趣味训练</h1>
            <p className="text-sm text-emerald-600 font-medium">康复目标：提升认知与配合度</p>
          </div>
        </div>

        {/* Game Buttons - Huge vertical grid */}
        <div className="space-y-6">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (game.id === 'emotions') {
                  navigate('/emotion-guess');
                } else if (game.id === 'finding') {
                  navigate('/instruction-find');
                } else if (game.id === 'puzzle') {
                  alert(`即将开启：${game.title}`);
                }
              }}
              className="cursor-pointer"
            >
              <Card className={cn(
                "p-8 flex flex-col items-center text-center border-none shadow-sm rounded-[48px]",
                game.color
              )}>
                <div className={cn("w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-sm", game.iconColor)}>
                  <game.icon size={48} className={game.textColor} />
                </div>
                
                <h3 className={cn("text-2xl font-black mb-2", game.textColor)}>{game.title}</h3>
                <p className="text-slate-500 font-medium mb-6">{game.desc}</p>
                
                <div className="flex items-center justify-between w-full mt-2">
                   <div className="bg-white/60 px-4 py-1.5 rounded-full text-xs font-bold text-slate-500">
                    训练：{game.goal}
                  </div>
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-md", game.textColor.replace('text', 'bg').replace('600', '100'))}>
                    <Play size={24} className={game.textColor} fill="currentColor" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
};

export default TrainingEntry;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';

const Home = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();

  const features = [
    {
      id: 'chat',
      title: 'AI宠物聊天',
      desc: '练习开口说话',
      emoji: '💬',
      color: 'bg-gradient-to-r from-pink-100 to-rose-100',
      textColor: 'text-pink-600',
      emojiBg: 'bg-pink-200',
      path: '/chat',
      goal: '训练主动语言'
    },
    {
      id: 'books',
      title: '绘本闯关',
      desc: '理解社交场景',
      emoji: '📚',
      color: 'bg-gradient-to-r from-amber-100 to-orange-100',
      textColor: 'text-amber-600',
      emojiBg: 'bg-amber-200',
      path: '/books',
      goal: '场景认知与社交'
    },
    {
      id: 'training',
      title: '趣味训练',
      desc: '逻辑与表达',
      emoji: '🎮',
      color: 'bg-gradient-to-r from-emerald-100 to-teal-100',
      textColor: 'text-emerald-600',
      emojiBg: 'bg-emerald-200',
      path: '/training',
      goal: '逻辑思维'
    }
  ];

  return (
    <MobileShell showNav className="bg-gradient-to-b from-sky-50 via-blue-50 to-white">
      <div className="px-6 py-4">
        {/* AI Pet Hero Area */}
        <div className="relative mb-8 pt-4">
          {/* 设置按钮 */}
          <button 
            onClick={() => navigate('/settings')}
            className="absolute top-0 right-0 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white"
          >
            <span className="text-2xl">⚙️</span>
          </button>
          
          {/* 亲密度 */}
          <div className="absolute top-0 left-0 bg-gradient-to-r from-pink-100 to-rose-100 px-4 py-1.5 rounded-full border-2 border-rose-200 flex items-center gap-2 shadow-sm">
            <Heart size={14} className="text-rose-400 fill-rose-400" />
            <span className="text-xs font-bold text-rose-600">亲密度 85</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-6">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-48 h-48 relative cursor-pointer"
            >
              {/* 光环效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/50 to-amber-200/50 rounded-full blur-3xl animate-pulse" />
              
              {/* 背景圆 */}
              <div className={cn(
                "absolute inset-2 rounded-full bg-gradient-to-br shadow-lg overflow-hidden",
                avatar.color
              )}>
                <img 
                  src={avatar.image} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
              <p className="text-sm text-slate-400 mt-1">你好！今天要和我玩什么呢？</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {features.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
            >
              <Card className={cn(
                "p-5 flex items-center border-none shadow-sm cursor-pointer rounded-[28px] overflow-hidden relative",
                item.color
              )}>
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-sm text-3xl", item.emojiBg)}>
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <h3 className={cn("text-xl font-bold", item.textColor)}>{item.title}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/60 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    <Sparkles size={10} className="text-amber-400" />
                    {item.goal}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={item.textColor}
                  >
                    →
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      <Navigation />
    </MobileShell>
  );
};

export default Home;

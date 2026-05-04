import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, BookOpen, Gamepad2, Heart } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import Navigation from '../components/Navigation';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'chat',
      title: 'AI宠物聊天',
      desc: '练习开口说话',
      icon: MessageCircle,
      color: 'bg-rose-100',
      textColor: 'text-rose-600',
      iconColor: 'bg-rose-200',
      path: '/chat',
      goal: '训练主动语言'
    },
    {
      id: 'books',
      title: '绘本闯关',
      desc: '理解社交场景',
      icon: BookOpen,
      color: 'bg-amber-100',
      textColor: 'text-amber-600',
      iconColor: 'bg-amber-200',
      path: '/books',
      goal: '场景认知与社交'
    },
    {
      id: 'training',
      title: '趣味训练',
      desc: '逻辑与表达',
      icon: Gamepad2,
      color: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      iconColor: 'bg-emerald-200',
      path: '/training',
      goal: '逻辑思维'
    }
  ];

  return (
    <MobileShell showNav className="bg-white">
      <div className="px-6 py-4">
        {/* AI Pet Hero Area */}
        <div className="relative mb-8 pt-4">
          <div className="absolute top-0 right-0 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 flex items-center gap-2">
            <Heart size={14} className="text-rose-400 fill-rose-400" />
            <span className="text-xs font-bold text-sky-600">亲密度 85</span>
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
              <div className="absolute inset-0 bg-sky-100/50 rounded-full blur-2xl" />
              <img 
                src="https://modao.cc/agent-py/media/generated_images/2026-05-02/d3bbb6c79bf243fe94c28470c58ecd95.jpg#desc=Cute%20pastel%20blue%20round%20monster%2C%20small%20horns%2C%20friendly%20smile%2C%20big%20eyes%2C%20waving%20hand" 
                alt="AI Pet"
                className="w-full h-full object-contain relative z-10"
              />
            </motion.div>
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold text-slate-800">星小宝</h2>
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
                "p-5 flex items-center border-none shadow-sm cursor-pointer rounded-[32px] overflow-hidden relative group",
                item.color
              )}>
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-sm", item.iconColor)}>
                  <item.icon className={item.textColor} size={32} />
                </div>
                <div className="flex-1">
                  <h3 className={cn("text-xl font-bold", item.textColor)}>{item.title}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
                  <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-white/60 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    目标: {item.goal}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
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

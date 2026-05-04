import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, RotateCcw, ArrowRight, CheckCircle2, Trophy, Star, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import AIChatPanel from '../components/AIChatPanel';

const BookInteraction = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const story = [
    {
      text: "早上好，我想吃早餐。",
      highlight: [4, 5, 6],
      image: "https://modao.cc/agent-py/media/generated_images/2026-05-02/5222f2b2a9d94c7a99ee73e2e9faa6a5.jpg#desc=Kitchen%20table%2C%20breakfast%20cereal%2C%20orange%20juice%2C%20morning%20sun"
    },
    {
      text: "请给我一个大大的拥抱。",
      highlight: [5, 6, 7, 8],
      image: "https://modao.cc/agent-py/media/generated_images/2026-05-02/35146b02b38b4b2bb235efdb0d6a12fa.jpg#desc=Mom%20hugging%20child%2C%20warm%20colors%2C%20living%20room"
    },
    {
      text: "我可以和你一起玩吗？",
      highlight: [4, 5, 6, 7],
      image: "https://modao.cc/agent-py/media/generated_images/2026-05-02/ec30c8d068b4420a9a456a2d2b56deab.jpg#desc=Two%20kids%20playing%20with%20blocks%2C%20sharing%20toys%2C%20smiling"
    }
  ];

  const handleNext = () => {
    if (currentPage < story.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <MobileShell className="bg-white">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div 
            key="story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-4 flex items-center justify-between pb-2">
              <button 
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex gap-2">
                {story.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === currentPage ? "w-8 bg-amber-400" : "w-2 bg-slate-100"
                    )} 
                  />
                ))}
              </div>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-sm border border-amber-200 active:scale-95 transition-transform"
              >
                <Sparkles size={24} />
              </button>
            </div>

            {/* Story Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center gap-8">
              <motion.div
                key={currentPage}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl shadow-amber-100"
              >
                <img 
                  src={story[currentPage].image} 
                  alt="Story scene" 
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="w-full space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full text-amber-500 mb-2 cursor-pointer active:scale-95 transition-transform">
                  <Volume2 size={32} />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 leading-relaxed px-4">
                  {story[currentPage].text.split('').map((char, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        story[currentPage].highlight.includes(i) ? "text-amber-500" : ""
                      )}
                    >
                      {char}
                    </span>
                  ))}
                </h2>
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 flex gap-4">
              <Button 
                variant="secondary"
                onClick={() => setCurrentPage(0)}
                className="flex-1 h-20 rounded-[30px] bg-slate-100 text-slate-600 font-bold text-lg gap-2 border-none"
              >
                <RotateCcw size={24} />
                重读
              </Button>
              <Button 
                onClick={handleNext}
                className="flex-[2] h-20 rounded-[30px] bg-amber-400 hover:bg-amber-500 text-white font-bold text-2xl gap-2 shadow-lg shadow-amber-200 border-none"
              >
                {currentPage === story.length - 1 ? "完成" : "下一页"}
                <ArrowRight size={28} />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-amber-50 to-white text-center"
          >
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-amber-400"
              >
                <Trophy size={80} strokeWidth={1.5} />
              </motion.div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-rose-400 rounded-full flex items-center justify-center text-white shadow-lg rotate-12">
                <Star size={32} fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-800 mb-2">真棒！</h1>
            <p className="text-lg text-slate-500 mb-12">星宝学会了如何寻求帮助</p>
            
            <div className="space-y-4 w-full px-4">
              <Button 
                onClick={() => navigate('/books')}
                className="w-full h-20 rounded-[30px] bg-amber-400 hover:bg-amber-500 text-white font-bold text-xl shadow-lg border-none"
              >
                领取星星奖励
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/home')}
                className="w-full h-16 rounded-[30px] text-slate-400 font-bold text-lg"
              >
                回首页
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChatPanel 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        title="星宝AI助手"
        context="日常沟通"
      />
    </MobileShell>
  );
};

export default BookInteraction;

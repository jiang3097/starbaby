import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, CheckCircle2, Star, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import AIChatPanel from '../components/AIChatPanel';
import { useApp } from '../context/AppContext';

const BookList = () => {
  const navigate = useNavigate();
  const { dailyStats } = useApp();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');

  // 从 localStorage 读取已通过的关卡
  const getPassedLevels = (bookId: number): number[] => {
    const storageKey = `star_baby_passed_levels_${bookId}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  };

  // 计算已通关的关卡数量（每道题算一关，首次通过才计数）
  const passedLevels1 = getPassedLevels(1);
  const passedLevels2 = getPassedLevels(2);
  const passedLevels3 = getPassedLevels(3);
  
  const booksCompleted = passedLevels1.length + passedLevels2.length + passedLevels3.length;

  // 星星计算：从 localStorage 读取已通过关卡数
  const emotionStars = passedLevels1.length; // 情绪识别已通过关卡数
  const dailyStarsCalc = passedLevels2.length; // 日常沟通已通过关卡数
  const helpStarsCalc = passedLevels3.length; // 求助场景已通过关卡数

  const books = [
    {
      id: 1,
      title: '情绪表达',
      desc: '认识开心、难过和生气',
      status: 'active', // 始终可访问
      stars: emotionStars,
      color: 'bg-rose-50',
      borderColor: 'border-rose-100',
      iconColor: 'text-rose-500',
      gradient: 'from-rose-200 to-pink-200',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/ba68d8f98ff34703933479aa9dbe851f.jpg#desc=Facial%20expressions%2C%20cute%20characters%2C%20happy%20sad%20angry'
    },
    {
      id: 2,
      title: '日常沟通',
      desc: '学会表达你的基本需求',
      status: passedLevels1.length >= 1 ? 'active' : 'locked', // 完成情绪识别第一关后才能解锁
      stars: dailyStarsCalc,
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      iconColor: 'text-emerald-500',
      gradient: passedLevels1.length >= 1 ? 'from-emerald-200 to-teal-200' : 'from-slate-200 to-gray-200',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/aa7156b859894d3c90a8d6ef1a1ffd12.jpg#desc=Morning%20routine%2C%20breakfast%20table%2C%20kids%2C%20friendly%20style'
    },
    {
      id: 3,
      title: '求助场景',
      desc: '遇到困难时如何开口',
      status: 'locked',
      stars: helpStarsCalc,
      color: 'bg-slate-50',
      borderColor: 'border-slate-100',
      iconColor: 'text-slate-400',
      gradient: 'from-slate-200 to-gray-200',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/7e38337d73b549ada55dfddf80cc62a9.jpg#desc=Boy%20looking%20for%20help%2C%20park%20scene%2C%20kind%20stranger'
    }
  ];

  return (
    <MobileShell className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 漂浮书本装饰 */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute top-20 right-8 text-5xl opacity-20"
        >
          📚
        </motion.div>
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute top-40 left-6 text-4xl opacity-15"
        >
          📖
        </motion.div>
        {/* 星星装饰 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300"
            style={{ left: `${10 + i * 15}%`, top: `${5 + (i % 3) * 5}%` }}
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
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-500 hover:bg-amber-50 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h1 className="text-2xl font-bold text-slate-800">绘本闯关</h1>
            </div>
            <p className="text-sm text-amber-600 font-medium">一起来读有趣的故事吧~</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-3xl shadow-md border-2 border-amber-200 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shadow-md">
              <Star size={24} className="text-white" fill="currentColor" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{dailyStats.gamePassCount}</div>
              <div className="text-xs text-amber-600 font-bold">获得星星</div>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-3xl shadow-md border-2 border-emerald-200 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{booksCompleted}/3</div>
              <div className="text-xs text-emerald-600 font-bold">已通关</div>
            </div>
          </motion.div>
        </div>

        {/* List */}
        <div className="space-y-5">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={book.status !== 'locked' ? { scale: 0.98 } : {}}
              onClick={() => {
                if (book.status !== 'locked') {
                  const routeId = book.id === 1 ? 3 : book.id === 2 ? 1 : book.id;
                  navigate(`/book-interaction/${routeId}`);
                }
              }}
            >
              <Card className={cn(
                "overflow-hidden border-3 rounded-[32px] shadow-lg relative",
                book.borderColor,
                book.color,
                book.status === 'locked' && "opacity-70"
              )}>
                {/* 顶部装饰条 */}
                <div className={cn(
                  "h-2 bg-gradient-to-r",
                  book.gradient
                )} />
                
                <div className="h-36 overflow-hidden relative">
                  <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                  
                  {/* 状态遮罩 */}
                  {book.status === 'locked' && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
                        <Lock size={32} className="text-slate-400" />
                      </div>
                    </div>
                  )}
                  
                  {/* 已通关标记 */}
                  {book.status === 'completed' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={16} className="text-white" />
                      <span className="text-xs font-bold text-white">已通关</span>
                    </motion.div>
                  )}

                  {/* 进行中标记 */}
                  {book.status === 'active' && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <span className="text-sm">🌟</span>
                      <span className="text-xs font-bold text-white">进行中</span>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {book.id === 1 ? '😊' : book.id === 2 ? '🗣️' : '🆘'}
                        </span>
                        <h3 className="text-xl font-bold text-slate-800">{book.title}</h3>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 ml-8">{book.desc}</p>
                      
                      {/* 星星评分 */}
                      <div className="flex items-center gap-3 mt-3 ml-8">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <Star 
                              key={i} 
                              size={20} 
                              className={cn(
                                i <= book.stars 
                                  ? "text-amber-400" 
                                  : "text-slate-200"
                              )} 
                              fill={i <= book.stars ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        
                        {book.status !== 'locked' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBook(book.title);
                              setIsAIChatOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 rounded-full text-xs font-bold hover:from-amber-200 hover:to-yellow-200 transition-colors shadow-sm"
                          >
                            <Sparkles size={14} />
                            AI指导
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 右侧按钮 */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center shadow-lg ml-4",
                        book.status === 'locked' 
                          ? "bg-slate-200 text-slate-400" 
                          : "bg-gradient-to-br from-amber-400 to-orange-400 text-white"
                      )}
                    >
                      {book.status === 'locked' ? (
                        <Lock size={22} />
                      ) : (
                        <span className="text-xl">→</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <AIChatPanel 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        context={selectedBook}
      />
    </MobileShell>
  );
};

export default BookList;

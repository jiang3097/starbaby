import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, CheckCircle2, Star, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import AIChatPanel from '../components/AIChatPanel';

const BookList = () => {
  const navigate = useNavigate();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');

  const books = [
    {
      id: 1,
      title: '日常沟通',
      desc: '学会表达你的基本需求',
      status: 'completed',
      stars: 3,
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      iconColor: 'text-emerald-500',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/aa7156b859894d3c90a8d6ef1a1ffd12.jpg#desc=Morning%20routine%2C%20breakfast%20table%2C%20kids%2C%20friendly%20style'
    },
    {
      id: 2,
      title: '情绪表达',
      desc: '认识开心、难过和生气',
      status: 'active',
      stars: 1,
      color: 'bg-rose-50',
      borderColor: 'border-rose-100',
      iconColor: 'text-rose-500',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/ba68d8f98ff34703933479aa9dbe851f.jpg#desc=Facial%20expressions%2C%20cute%20characters%2C%20happy%20sad%20angry'
    },
    {
      id: 3,
      title: '求助场景',
      desc: '遇到困难时如何开口',
      status: 'locked',
      stars: 0,
      color: 'bg-slate-50',
      borderColor: 'border-slate-100',
      iconColor: 'text-slate-400',
      image: 'https://modao.cc/agent-py/media/generated_images/2026-05-02/7e38337d73b549ada55dfddf80cc62a9.jpg#desc=Boy%20looking%20for%20help%2C%20park%20scene%2C%20kind%20stranger'
    }
  ];

  return (
    <MobileShell className="bg-amber-50/30">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-amber-600"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">绘本闯关</h1>
            <p className="text-sm text-amber-600 font-medium">康复目标：场景认知与社交互动</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Star size={20} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">12</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">获得星星</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">4/10</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">已通关</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-6">
          {books.map((book) => (
            <motion.div
              key={book.id}
              whileTap={book.status !== 'locked' ? { scale: 0.98 } : {}}
              onClick={() => book.status !== 'locked' && navigate(`/book-interaction/${book.id}`)}
            >
              <Card className={cn(
                "overflow-hidden border-2 rounded-[32px] shadow-sm relative",
                book.borderColor,
                book.color,
                book.status === 'locked' && "opacity-80 grayscale-[0.5]"
              )}>
                <div className="h-40 overflow-hidden relative">
                  <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                  {book.status === 'locked' && (
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                        <Lock size={28} className="text-slate-400" />
                      </div>
                    </div>
                  )}
                  {book.status === 'completed' && (
                    <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600">已通关</span>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{book.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{book.desc}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={cn(i <= book.stars ? "text-amber-500 fill-amber-500" : "text-slate-200")} 
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
                          className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold hover:bg-amber-200 transition-colors"
                        >
                          <Sparkles size={12} />
                          AI指导
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-md",
                    book.status === 'locked' ? "bg-slate-200 text-slate-400" : "bg-white text-amber-500"
                  )}>
                    {book.status === 'locked' ? <Lock size={20} /> : <div className="text-xl font-bold">→</div>}
                  </button>
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

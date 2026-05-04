import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Volume2, Sparkles, Send } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const AIChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '你好呀，星宝！今天心情怎么样？', audio: true },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPhrases = ['我开心', '我要喝水', '我想玩球', '抱抱我'];

  const handleSend = (text: string) => {
    const newMessage = { id: Date.now(), type: 'user', text, audio: false };
    setMessages([...messages, newMessage]);
    
    // Simple bot reply simulation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: text === '我要喝水' ? '好哒，我们去拿杯子喝水吧！' : '听到你这么说真棒！',
        audio: true
      }]);
    }, 1000);
  };

  return (
    <MobileShell className="bg-sky-50">
      {/* Header */}
      <div className="px-6 pt-4 flex items-center justify-between sticky top-0 bg-sky-50 z-10 pb-2">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-sky-600"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm border border-sky-100">
            <img 
              src="https://modao.cc/agent-py/media/generated_images/2026-05-02/01867dd933bf4127ae61cc9c7cc4a8e1.jpg#desc=Pet" 
              alt="Pet" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-bold text-sky-500 mt-0.5">正在倾听...</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 px-6 py-4 flex flex-col gap-6 overflow-y-auto min-h-0"
      >
        <div className="bg-white/60 rounded-full px-4 py-1 self-center text-[10px] font-bold text-sky-400">
          康复目标：练习主动语言与对话
        </div>
        
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "flex items-end gap-2 max-w-[85%]",
              msg.type === 'user' ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            <div className={cn(
              "p-4 rounded-[28px] shadow-sm relative",
              msg.type === 'user' 
                ? "bg-sky-500 text-white rounded-br-none" 
                : "bg-white text-slate-700 rounded-bl-none"
            )}>
              <p className="text-base font-medium leading-relaxed">{msg.text}</p>
              {msg.audio && (
                <div className="mt-2 flex items-center gap-2 text-sky-400">
                  <Volume2 size={16} />
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-3 bg-sky-100 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white rounded-t-[40px] shadow-2xl space-y-4">
        {/* Quick Phrases */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {quickPhrases.map(phrase => (
            <button
              key={phrase}
              onClick={() => handleSend(phrase)}
              className="px-5 py-2.5 bg-sky-50 text-sky-600 rounded-full text-sm font-bold whitespace-nowrap border border-sky-100 active:bg-sky-100 transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Big Voice Button */}
        <div className="flex items-center justify-center py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onTouchStart={() => setIsRecording(true)}
            onTouchEnd={() => setIsRecording(false)}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative",
              isRecording 
                ? "bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]" 
                : "bg-sky-500 shadow-xl shadow-sky-200"
            )}
          >
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full bg-rose-400/30"
                />
              )}
            </AnimatePresence>
            <Mic size={40} className="text-white relative z-10" />
          </motion.button>
        </div>
        <p className="text-center text-slate-400 text-sm font-medium">长按说话，我也想听你的声音</p>
      </div>
    </MobileShell>
  );
};

export default AIChat;

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Send, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  audio?: boolean;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialMessages?: Message[];
  context?: string;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  title = "AI 星宝助手", 
  initialMessages = [],
  context = "" 
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          id: Date.now(), 
          type: 'bot', 
          text: `你好呀，星宝！我是你的AI小伙伴。${context ? `我们要一起学习《${context}》这本绘本了，你准备好了吗？` : '今天想和我聊聊什么呢？'}`, 
          audio: true 
        }
      ]);
    }
  }, [isOpen, context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string) => {
    const newMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, newMessage]);
    
    // AI responses based on the request (gentle, encouraging, patient)
    setTimeout(() => {
      let reply = "你观察得真仔细！说得太棒了。";
      if (text.includes("准备好了")) {
        reply = "太棒了！那我们开始吧。你看，图片里的小动物在做什么呢？";
      } else if (text.includes("他在写作业")) {
        reply = "哇，星宝真聪明！他是在认真写作业哦。如果你是他，写完作业你会对自己说什么呢？";
      } else if (text.includes("不清楚") || text.includes("不知道")) {
        reply = "没关系哦，我们可以慢慢看。你看小猫的手里拿着什么？是不是一个红色的苹果呀？";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: reply,
        audio: true
      }]);
    }, 1500);
  };

  const quickPhrases = ["准备好了！", "他在写作业", "我不知道", "真开心"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[40px] shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{title}</h3>
                  <p className="text-[10px] text-amber-500 font-medium">AI辅助语言引导，提升表达自信心</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50"
            >
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
                    "p-4 rounded-[24px] shadow-sm relative",
                    msg.type === 'user' 
                      ? "bg-amber-400 text-white rounded-br-none" 
                      : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    {msg.audio && (
                      <div className={cn("mt-2 flex items-center gap-2", msg.type === 'user' ? "text-white/80" : "text-amber-400")}>
                        <Volume2 size={14} />
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={cn("w-0.5 h-2.5 rounded-full animate-pulse", msg.type === 'user' ? "bg-white/50" : "bg-amber-100")} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer / Input */}
            <div className="p-6 bg-white border-t border-slate-50 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {quickPhrases.map(phrase => (
                  <button
                    key={phrase}
                    onClick={() => handleSend(phrase)}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-bold whitespace-nowrap border border-amber-100 active:bg-amber-100"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onMouseDown={() => setIsRecording(true)}
                  onMouseUp={() => setIsRecording(false)}
                  onTouchStart={() => setIsRecording(true)}
                  onTouchEnd={() => setIsRecording(false)}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isRecording ? "bg-rose-500 scale-110" : "bg-amber-400"
                  )}
                >
                  <Mic size={24} className="text-white" />
                </button>
                <div className="flex-1 bg-slate-100 rounded-full px-5 py-3 flex items-center justify-between">
                  <span className="text-slate-400 text-sm">我也想听你的声音...</span>
                  <Send size={18} className="text-slate-300" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatPanel;

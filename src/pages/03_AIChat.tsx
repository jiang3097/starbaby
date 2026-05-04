import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Volume2, Sparkles, Send, RefreshCw, Check, VolumeX } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useSpeech, preloadVoices } from '../lib/useSpeech';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  audio?: boolean;
  followingText?: string;
}

const AIChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: '你好呀，星宝！今天心情怎么样？', audio: true },
  ]);
  const [currentBotMessage, setCurrentBotMessage] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    state: speechState,
    transcript,
    isListening,
    isSpeaking,
    isFollowing,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    startFollowing,
    stopFollowing,
  } = useSpeech({
    lang: 'zh-CN',
    rate: 0.85,
    onTranscript: (text) => {
      if (text && speechState === 'listening') {
        handleVoiceInput(text);
      }
    }
  });

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentBotMessage]);

  const quickPhrases = ['我开心', '我要喝水', '我想玩球', '抱抱我'];

  // 处理语音输入
  const handleVoiceInput = useCallback((text: string) => {
    if (!text.trim()) return;
    
    stopListening();
    
    const newMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages([...messages, newMessage]);
    
    // AI 响应
    setTimeout(() => {
      let reply = '听到你这么说真棒！';
      let needsFollowing = false;
      
      if (text === '我要喝水') {
        reply = '好哒，我们去拿杯子喝水吧！';
      } else if (text === '我开心') {
        reply = '太棒了！开心的时候可以做什么呢？要不要一起唱首歌？';
      } else if (text === '我想玩球') {
        reply = '玩球真有趣！你会拍球吗？我们一起练习吧！';
      } else if (text === '抱抱我') {
        reply = '给你一个大大的拥抱！抱抱可以让人感觉温暖和安全哦。';
        needsFollowing = true;
      }

      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply, 
        audio: true,
        followingText: needsFollowing ? reply.split('！')[0] + '！' : undefined
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      if (needsFollowing) {
        speak(reply).then(() => {
          setCurrentBotMessage(botMsg);
        });
      }
    }, 1000);
  }, [messages, stopListening, speak]);

  const handleSend = (text: string) => {
    const newMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages([...messages, newMessage]);
    
    // AI 响应
    setTimeout(() => {
      let reply = '听到你这么说真棒！';
      let needsFollowing = false;
      
      if (text === '我要喝水') {
        reply = '好哒，我们去拿杯子喝水吧！';
      } else if (text === '我开心') {
        reply = '太棒了！开心的时候可以做什么呢？要不要一起唱首歌？';
      } else if (text === '我想玩球') {
        reply = '玩球真有趣！你会拍球吗？我们一起练习吧！';
      } else if (text === '抱抱我') {
        reply = '给你一个大大的拥抱！抱抱可以让人感觉温暖和安全哦。';
        needsFollowing = true;
      }

      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply, 
        audio: true,
        followingText: needsFollowing ? reply.split('！')[0] + '！' : undefined
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      if (needsFollowing) {
        speak(reply).then(() => {
          setCurrentBotMessage(botMsg);
        });
      }
    }, 1000);
  };

  // 开始跟读
  const handleStartFollowing = useCallback((text: string) => {
    setCurrentBotMessage(null);
    startFollowing(text);
  }, [startFollowing]);

  // 停止跟读
  const handleStopFollowing = useCallback(() => {
    stopFollowing();
    setCurrentBotMessage(null);
  }, [stopFollowing]);

  // 处理跟读完成
  const handleFollowingComplete = useCallback(() => {
    stopFollowing();
    setCurrentBotMessage(null);
    const encourageMsg: Message = {
      id: Date.now(),
      type: 'bot',
      text: '太棒了！说得真好听，继续加油！',
      audio: true
    };
    setMessages(prev => [...prev, encourageMsg]);
    speak('太棒了！说得真好听，继续加油！');
  }, [stopFollowing, speak]);

  // 处理麦克风按钮点击
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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
          <span className="text-[10px] font-bold text-sky-500 mt-0.5">
            {isSpeaking ? '正在朗读...' : isFollowing ? '请跟读' : isListening ? '正在听...' : '正在倾听...'}
          </span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Following Mode Banner */}
      <AnimatePresence>
        {isFollowing && currentBotMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-sky-50 px-6 py-3 border-b border-sky-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center">
                  <Volume2 size={16} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-sky-600 font-medium">请跟读</p>
                  <p className="text-sm font-bold text-sky-800">{currentBotMessage.followingText}</p>
                </div>
              </div>
              <button
                onClick={handleStopFollowing}
                className="p-2 text-sky-400 hover:text-sky-600"
              >
                <VolumeX size={20} />
              </button>
            </div>
            
            {/* User's following result */}
            <div className="mt-3 bg-white rounded-xl p-3 border border-sky-200">
              <p className="text-xs text-slate-500 mb-1">你说的</p>
              <p className={`text-sm font-medium ${transcript ? 'text-slate-800' : 'text-slate-400'}`}>
                {transcript || '...'}
              </p>
            </div>
            
            {/* Confirm button */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleStopFollowing}
                className="flex-1 py-2 rounded-full border border-sky-300 text-sky-600 text-sm font-bold"
              >
                再听一遍
              </button>
              <button
                onClick={handleFollowingComplete}
                className="flex-1 py-2 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center gap-1"
              >
                <Check size={16} />
                完成跟读
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              
              {/* Audio controls for bot messages */}
              {msg.audio && msg.type === 'bot' && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => msg.followingText && speak(msg.text)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-all",
                      isSpeaking ? "text-sky-400" : "text-sky-300 hover:text-sky-500"
                    )}
                    disabled={isSpeaking}
                  >
                    <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                    <span>朗读</span>
                  </button>
                  
                  {msg.followingText && (
                    <button
                      onClick={() => msg.followingText && handleStartFollowing(msg.followingText)}
                      className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-500 transition-all"
                    >
                      <RefreshCw size={14} />
                      <span>跟读</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Audio indicator for user messages */}
              {msg.audio && msg.type === 'user' && (
                <div className="mt-2 flex items-center gap-1.5 text-white/70">
                  <Mic size={14} />
                  <span className="text-xs">你说的话</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Current bot message being processed */}
        {currentBotMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex items-end gap-2 max-w-[85%] self-start"
          >
            <div className="bg-white text-slate-700 rounded-[28px] rounded-bl-none shadow-sm p-4">
              <p className="text-base font-medium leading-relaxed">{currentBotMessage.text}</p>
              <div className="mt-2 flex items-center gap-2 text-sky-400">
                <Volume2 size={14} className="animate-pulse" />
                <span className="text-xs">正在朗读...</span>
              </div>
            </div>
          </motion.div>
        )}
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
            onClick={handleMicClick}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative",
              isListening 
                ? "bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]" 
                : "bg-sky-500 shadow-xl shadow-sky-200"
            )}
          >
            <AnimatePresence>
              {isListening && (
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

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center gap-2 py-2"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.6, 
                      delay: i * 0.1 
                    }}
                    className="w-1 h-4 bg-rose-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-sm text-rose-500 font-medium">正在听你说...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-400 text-sm font-medium">
          {isListening ? '请说话...' : '长按说话，我也想听你的声音'}
        </p>
      </div>
    </MobileShell>
  );
};

export default AIChat;

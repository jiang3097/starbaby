import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Volume2, Send, RefreshCw, Check, VolumeX } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { cn } from '../lib/utils';
import { speakText, startListening, preloadVoices } from '../lib/useSpeech';
import { useUser } from '../context/UserContext';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  followingText?: string;
}

const AIChat = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: `你好呀，${profile.name}！今天心情怎么样？` },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentFollowingText, setCurrentFollowingText] = useState('');
  const [userSpeakingText, setUserSpeakingText] = useState('');
  
  const stopListeningFnRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFollowing]);

  const quickPhrases = ['我开心', '我要喝水', '我想玩球', '抱抱我'];

  // 处理发送消息
  const handleSend = useCallback((text: string) => {
    // 添加用户消息
    const userMsg: Message = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    // AI 响应
    setTimeout(() => {
      let reply = '听到你这么说真棒！';
      let followingText: string | undefined;

      if (text === '我要喝水') {
        reply = '好哒，我们去拿杯子喝水吧！';
      } else if (text === '我开心') {
        reply = '太棒了！开心的时候可以做什么呢？要不要一起唱首歌？';
      } else if (text === '我想玩球') {
        reply = '玩球真有趣！你会拍球吗？我们一起练习吧！';
      } else if (text === '抱抱我') {
        reply = '给你一个大大的拥抱！抱抱可以让人感觉温暖和安全哦。';
        followingText = '抱抱';
      }

      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply,
        followingText
      };
      
      setMessages(prev => [...prev, botMsg]);

      // AI 自动朗读回复
      speakText(reply);
    }, 800);
  }, []);

  // 点击麦克风开始说话
  const handleMicClick = () => {
    if (isListening) {
      // 停止录音
      if (stopListeningFnRef.current) {
        stopListeningFnRef.current();
        stopListeningFnRef.current = null;
      }
      setIsListening(false);
    } else {
      // 开始录音
      setIsListening(true);
      setUserSpeakingText('');

      stopListeningFnRef.current = startListening(
        (text) => {
          // 识别成功，发送消息
          setIsListening(false);
          handleSend(text);
        },
        (error) => {
          console.error('Voice input error:', error);
          setIsListening(false);
        }
      );
    }
  };

  // 朗读按钮
  const handleReadAloud = (text: string) => {
    setIsSpeaking(true);
    speakText(text, () => {
      setIsSpeaking(false);
    });
  };

  // 开始跟读
  const handleStartFollowing = (text: string) => {
    setIsFollowing(true);
    setCurrentFollowingText(text);
    setUserSpeakingText('');

    // AI 先读一遍
    speakText(text, () => {
      // 读完后开始监听用户跟读
      stopListeningFnRef.current = startListening(
        (spokenText) => {
          setUserSpeakingText(spokenText);
        },
        () => {
          // 识别结束但不关闭面板
        }
      );
    });
  };

  // 停止跟读
  const handleStopFollowing = () => {
    if (stopListeningFnRef.current) {
      stopListeningFnRef.current();
      stopListeningFnRef.current = null;
    }
    setIsFollowing(false);
    setCurrentFollowingText('');
    setUserSpeakingText('');
  };

  // 完成跟读
  const handleCompleteFollowing = () => {
    handleStopFollowing();
    // 鼓励消息
    const encourageMsg: Message = {
      id: Date.now(),
      type: 'bot',
      text: '太棒了！你说得真好听，继续加油！'
    };
    setMessages(prev => [...prev, encourageMsg]);
    speakText('太棒了！你说得真好听，继续加油！');
  };

  // 再听一遍
  const handleReplay = () => {
    if (stopListeningFnRef.current) {
      stopListeningFnRef.current();
      stopListeningFnRef.current = null;
    }
    handleStartFollowing(currentFollowingText);
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
          <div className={cn(
            "w-12 h-12 rounded-full p-0.5 shadow-md border-2 border-white bg-gradient-to-br overflow-hidden",
            avatar.color
          )}>
            <img 
              src={avatar.image}
              alt={profile.name} 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-sky-500 mt-0.5">
            {isSpeaking ? '正在朗读...' : isFollowing ? '请跟读' : isListening ? '正在听你说...' : '正在倾听...'}
          </span>
        </div>
        <div className="w-12" />
      </div>

      {/* Following Mode Banner */}
      <AnimatePresence>
        {isFollowing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-sky-50 px-6 py-4 border-b border-sky-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center">
                  <Volume2 size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-sky-600 font-medium">请跟读</p>
                  <p className="text-lg font-bold text-sky-800">{currentFollowingText}</p>
                </div>
              </div>
              <button
                onClick={handleStopFollowing}
                className="p-2 text-sky-400 hover:text-sky-600"
              >
                <VolumeX size={24} />
              </button>
            </div>
            
            {/* User's speech result */}
            <div className="bg-white rounded-xl p-4 border border-sky-200 mb-3">
              <p className="text-xs text-slate-500 mb-1">你说的</p>
              <p className={`text-base font-medium ${userSpeakingText ? 'text-slate-800' : 'text-slate-400'}`}>
                {userSpeakingText || '请跟着朗读上方文字...'}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleReplay}
                className="flex-1 py-3 rounded-full border-2 border-sky-300 text-sky-600 text-sm font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                再听一遍
              </button>
              <button
                onClick={handleCompleteFollowing}
                className="flex-1 py-3 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center gap-2"
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
              
              {/* Bot message controls */}
              {msg.type === 'bot' && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleReadAloud(msg.text!)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all",
                      isSpeaking 
                        ? "bg-sky-100 text-sky-400" 
                        : "bg-sky-50 text-sky-500 hover:bg-sky-100"
                    )}
                  >
                    <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                    <span>朗读</span>
                  </button>
                  
                  {msg.followingText && (
                    <button
                      onClick={() => msg.followingText && handleStartFollowing(msg.followingText!)}
                      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-500 hover:bg-sky-100 transition-all"
                    >
                      <RefreshCw size={14} />
                      <span>跟读</span>
                    </button>
                  )}
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

        {/* Voice Button */}
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
              className="flex items-center justify-center gap-3 py-2"
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.6, 
                      delay: i * 0.1 
                    }}
                    className="w-1.5 h-5 bg-rose-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-base text-rose-500 font-bold">正在听你说...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-400 text-sm font-medium">
          {isListening ? '请说话，说完我会帮你发送' : '点击麦克风，说出你想说的话'}
        </p>
      </div>
    </MobileShell>
  );
};

export default AIChat;

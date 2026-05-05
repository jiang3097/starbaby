import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Volume2, Send, RefreshCw, Check, VolumeX } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { cn } from '../lib/utils';
import { speakText, startListening, preloadVoices } from '../lib/useSpeech';
import { useUser } from '../context/UserContext';
import { useStats } from '../context/StatsContext';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  followingText?: string;
}

const AIChat = () => {
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const { startTraining, incrementExpression, incrementChatMessage } = useStats();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: `你好呀！我是${profile.name}！今天心情怎么样？` },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentFollowingText, setCurrentFollowingText] = useState('');
  const [userSpeakingText, setUserSpeakingText] = useState('');
  const hasStartedTraining = useRef(false);
  
  const stopListeningFnRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 进入页面时开始训练计时（只执行一次）
  useEffect(() => {
    let mounted = true;
    if (!hasStartedTraining.current && mounted) {
      hasStartedTraining.current = true;
      startTraining('chat');
    }
    return () => {
      mounted = false;
    };
  }, []); // 空依赖，确保只执行一次

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFollowing]);

  const quickPhrases = ['我开心 😊', '我要喝水 🚰', '我想玩球 🎾', '抱抱我 🤗'];

  // 处理发送消息
  const handleSend = useCallback((text: String) => {
    // 清理emoji用于处理
    const cleanText = text.toString().replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    
    // 添加用户消息
    const userMsg: Message = { id: Date.now(), type: 'user', text: cleanText };
    setMessages(prev => [...prev, userMsg]);

    // 统计：增加主动表达次数和聊天消息数
    incrementExpression('chat');
    incrementChatMessage();

    // AI 响应
    setTimeout(() => {
      let reply = '听到你这么说真棒！';
      let followingText: string | undefined;

      if (cleanText === '我要喝水') {
        reply = '好哒，我们去拿杯子喝水吧！';
      } else if (cleanText === '我开心' || cleanText === '开心') {
        reply = '太棒了！开心的时候可以做什么呢？要不要一起唱首歌？';
      } else if (cleanText === '我想玩球' || cleanText === '玩球') {
        reply = '玩球真有趣！你会拍球吗？我们一起练习吧！';
      } else if (cleanText === '抱抱我' || cleanText === '抱抱') {
        reply = '给你一个大大的拥抱！🤗 抱抱可以让人感觉温暖和安全哦。';
        followingText = '抱抱';
      } else if (cleanText.includes('难过') || cleanText.includes('不开心')) {
        reply = '没关系，我陪着你哦。要不要听个有趣的故事？📖';
      } else if (cleanText.includes('生气')) {
        reply = '深呼吸，慢慢来~ 🧘 我们一起平静一下好吗？';
      } else if (cleanText.includes('谢谢')) {
        reply = '不客气！我们是好朋友呀！💕';
      } else if (cleanText.includes('你好') || cleanText.includes('嗨')) {
        reply = `你好呀！${profile.name}！见到你真开心！🌟`;
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
  }, [profile.name]);

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
      text: '太棒了！✨ 你说得真好听，继续加油！'
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
    <MobileShell className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 云朵装饰 */}
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-20 left-8 text-4xl opacity-40"
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ x: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
          className="absolute top-32 right-10 text-3xl opacity-30"
        >
          ☁️
        </motion.div>
        {/* 星星装饰 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300"
            style={{ left: `${15 + i * 18}%`, top: `${10 + (i % 3) * 8}%` }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="px-6 pt-4 flex items-center justify-between sticky top-0 bg-gradient-to-b from-amber-50/90 to-transparent z-10 pb-2">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-500 hover:bg-amber-50 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        
        {/* 形象展示 */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={cn(
              "w-16 h-16 rounded-full p-1 shadow-lg border-3 border-white bg-gradient-to-br overflow-hidden",
              avatar.color
            )}
          >
            <img 
              src={avatar.image}
              alt={profile.name} 
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
          <span className={cn(
            "text-xs font-bold mt-1 px-3 py-0.5 rounded-full",
            isSpeaking ? "bg-amber-100 text-amber-600" : 
            isFollowing ? "bg-green-100 text-green-600" : 
            isListening ? "bg-rose-100 text-rose-500" : 
            "bg-sky-100 text-sky-500"
          )}>
            {isSpeaking ? '正在朗读' : isFollowing ? '请跟读' : isListening ? '正在听...' : profile.name}
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
            className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-t border-b border-green-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center shadow-md">
                  <Volume2 size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-bold">✨ 请跟着我读</p>
                  <p className="text-lg font-bold text-green-800">{currentFollowingText}</p>
                </div>
              </div>
              <button
                onClick={handleStopFollowing}
                className="p-3 bg-white rounded-full shadow-md text-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                <VolumeX size={20} />
              </button>
            </div>
            
            {/* User's speech result */}
            <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-green-100 mb-3">
              <p className="text-xs text-slate-500 mb-1">你说的 👇</p>
              <p className={cn(
                "text-base font-medium",
                userSpeakingText ? 'text-slate-800' : 'text-slate-400 italic'
              )}>
                {userSpeakingText || '请跟着朗读上方文字...'}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReplay}
                className="flex-1 py-3 rounded-full border-2 border-green-300 text-green-600 text-sm font-bold flex items-center justify-center gap-2 bg-white shadow-sm"
              >
                <RefreshCw size={18} />
                再听一遍
              </button>
              <button
                onClick={handleCompleteFollowing}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Check size={18} />
                完成跟读
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto min-h-0 relative"
      >
        {/* 温馨提示 */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-5 py-2 self-center text-xs font-bold text-amber-600 flex items-center gap-2 shadow-sm">
          <span>🌟</span>
          <span>和{profile.name}聊聊天吧~</span>
        </div>
        
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "flex items-end gap-3 max-w-[88%]",
              msg.type === 'user' ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            {/* 头像 */}
            {msg.type === 'bot' && (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-10 h-10 rounded-full p-0.5 shadow-md border-2 border-white flex-shrink-0 bg-gradient-to-br overflow-hidden",
                  avatar.color
                )}
              >
                <img 
                  src={avatar.image}
                  alt={profile.name} 
                  className="w-full h-full object-cover rounded-full"
                />
              </motion.div>
            )}
            
            {/* 消息气泡 */}
            <div className={cn(
              "p-4 rounded-[24px] shadow-md relative",
              msg.type === 'user' 
                ? "bg-gradient-to-r from-sky-400 to-sky-500 text-white rounded-br-md" 
                : "bg-white text-slate-700 rounded-bl-md border border-slate-100"
            )}>
              {/* 消息内容 */}
              <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {/* Bot message controls */}
              {msg.type === 'bot' && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleReadAloud(msg.text)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all shadow-sm",
                      isSpeaking 
                        ? "bg-amber-100 text-amber-400" 
                        : "bg-sky-50 text-sky-500 hover:bg-sky-100"
                    )}
                  >
                    <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                    <span>朗读</span>
                  </button>
                  
                  {msg.followingText && (
                    <button
                      onClick={() => msg.followingText && handleStartFollowing(msg.followingText)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-all shadow-sm"
                    >
                      <RefreshCw size={14} />
                      <span>跟读练习</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* 用户头像 */}
            {msg.type === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                我
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-white to-amber-50/50 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] space-y-4">
        {/* Quick Phrases */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {quickPhrases.map(phrase => (
            <motion.button
              key={phrase}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(phrase)}
              className="px-4 py-2.5 bg-white text-slate-600 rounded-full text-sm font-bold whitespace-nowrap border-2 border-amber-100 shadow-sm hover:border-amber-300 hover:bg-amber-50 transition-all"
            >
              {phrase}
            </motion.button>
          ))}
        </div>

        {/* Voice Button */}
        <div className="flex items-center justify-center py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleMicClick}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-lg",
              isListening 
                ? "bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]" 
                : "bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_8px_20px_rgba(251,146,60,0.4)]"
            )}
          >
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 rounded-full bg-rose-300/40"
                  />
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                    className="absolute inset-0 rounded-full bg-rose-300/30"
                  />
                </>
              )}
            </AnimatePresence>
            <span className="text-4xl relative z-10">🎤</span>
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
              <div className="flex gap-1 items-end">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [12, 28, 12], scaleY: [0.5, 1, 0.5] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5, 
                      delay: i * 0.1 
                    }}
                    className="w-2 bg-gradient-to-t from-rose-400 to-pink-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-base text-rose-500 font-bold">在听你说哦~</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-amber-600 text-sm font-medium">
          {isListening ? '请说话哦~' : '👆 点击麦克风，和我说话吧'}
        </p>
      </div>
    </MobileShell>
  );
};

export default AIChat;

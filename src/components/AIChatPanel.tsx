import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Send, Sparkles, RefreshCw, Check, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useSpeech, preloadVoices } from '../lib/useSpeech';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
  audio?: boolean;
  followingText?: string; // 跟读文本
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
  const [currentBotMessage, setCurrentBotMessage] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');

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
      // 语音输入完成后的处理
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

  // 当 AI 朗读完成时自动开始跟读
  useEffect(() => {
    if (speechState === 'idle' && isFollowing) {
      // 跟读模式已启动
    }
  }, [speechState, isFollowing]);

  // 初始化消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = { 
        id: Date.now(), 
        type: 'bot', 
        text: `你好呀，星宝！我是你的AI小伙伴。${context ? `我们要一起学习《${context}》这本绘本了，你准备好了吗？` : '今天想和我聊聊什么呢？'}`, 
        audio: true 
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, context, messages.length]);

  // 处理语音输入
  const handleVoiceInput = useCallback((text: string) => {
    if (!text.trim()) return;
    
    stopListening();
    
    const newMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, newMessage]);
    
    // AI 响应
    setTimeout(() => {
      let reply = "你观察得真仔细！说得太棒了。";
      let needsFollowing = true;
      
      if (text.includes("准备好了")) {
        reply = "太棒了！那我们开始吧。你看，图片里的小动物在做什么呢？";
      } else if (text.includes("他在写作业")) {
        reply = "哇，星宝真聪明！他是在认真写作业哦。如果你是他，写完作业你会对自己说什么呢？";
      } else if (text.includes("不知道") || text.includes("不清楚")) {
        reply = "没关系哦，我们可以慢慢看。你看小猫的手里拿着什么？是不是一个红色的苹果呀？";
      } else if (text.includes("苹果") || text.includes("水果")) {
        reply = "太棒了！你说得对。你能试着跟我读一遍吗？苹果——";
        needsFollowing = true;
      }

      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply, 
        audio: true,
        followingText: needsFollowing ? reply.replace('你能试着跟我读一遍吗？', '').replace('——', '') : undefined
      };
      setMessages(prev => [...prev, botMsg]);
      
      // 如果需要跟读，先朗读再让用户跟读
      if (needsFollowing) {
        speak(reply).then(() => {
          setCurrentBotMessage(botMsg);
        });
      }
    }, 1500);
  }, [stopListening, speak]);

  // 处理文本发送
  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const newMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // AI 响应
    setTimeout(() => {
      let reply = "你观察得真仔细！说得太棒了。";
      let needsFollowing = false;
      
      if (text.includes("准备好了")) {
        reply = "太棒了！那我们开始吧。你看，图片里的小动物在做什么呢？";
      } else if (text.includes("他在写作业")) {
        reply = "哇，星宝真聪明！他是在认真写作业哦。如果你是他，写完作业你会对自己说什么呢？";
      } else if (text.includes("不知道") || text.includes("不清楚")) {
        reply = "没关系哦，我们可以慢慢看。你看小猫的手里拿着什么？是不是一个红色的苹果呀？";
      } else if (text.includes("苹果") || text.includes("水果")) {
        reply = "太棒了！你说得对。你能试着跟我读一遍吗？苹果——";
        needsFollowing = true;
      }

      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply, 
        audio: true,
        followingText: needsFollowing ? reply.replace('你能试着跟我读一遍吗？', '').replace('——', '') : undefined
      };
      setMessages(prev => [...prev, botMsg]);
      
      if (needsFollowing) {
        speak(reply).then(() => {
          setCurrentBotMessage(botMsg);
        });
      }
    }, 1500);
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
    // 鼓励消息
    const encourageMsg: Message = {
      id: Date.now(),
      type: 'bot',
      text: '太棒了！发音很清晰，继续加油！',
      audio: true
    };
    setMessages(prev => [...prev, encourageMsg]);
    speak('太棒了！发音很清晰，继续加油！');
  }, [stopFollowing, speak]);

  // 处理麦克风按钮点击
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 处理跟读确认
  const handleFollowingConfirm = () => {
    const userText = transcript.toLowerCase().trim();
    const targetText = currentBotMessage?.followingText?.toLowerCase().replace(/[，。！？、]/g, '') || '';
    
    // 简单的相似度检查
    const similarity = calculateSimilarity(userText, targetText);
    
    if (similarity > 0.5) {
      handleFollowingComplete();
    } else {
      // 提示再试一次
      stopFollowing();
      speak('再试一次吧，慢慢来，你可以的！').then(() => {
        if (currentBotMessage) {
          startFollowing(currentBotMessage.followingText || '');
        }
      });
    }
  };

  // 计算字符串相似度
  const calculateSimilarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (s1: string, s2: string): number => {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
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
                  <p className="text-[10px] text-amber-500 font-medium">
                    {isSpeaking ? '正在朗读...' : isFollowing ? '请跟读' : isListening ? '正在听...' : 'AI辅助语言引导，提升表达自信心'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Following Mode Banner */}
            <AnimatePresence>
              {isFollowing && currentBotMessage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-50 px-6 py-3 border-b border-amber-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                        <Volume2 size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 font-medium">请跟读</p>
                        <p className="text-sm font-bold text-amber-800">{currentBotMessage.followingText}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleStopFollowing}
                      className="p-2 text-amber-400 hover:text-amber-600"
                    >
                      <VolumeX size={20} />
                    </button>
                  </div>
                  
                  {/* User's following result */}
                  <div className="mt-3 bg-white rounded-xl p-3 border border-amber-200">
                    <p className="text-xs text-slate-500 mb-1">你说的</p>
                    <p className={`text-sm font-medium ${transcript ? 'text-slate-800' : 'text-slate-400'}`}>
                      {transcript || '...'}
                    </p>
                  </div>
                  
                  {/* Confirm button */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleStopFollowing}
                      className="flex-1 py-2 rounded-full border border-amber-300 text-amber-600 text-sm font-bold"
                    >
                      再听一遍
                    </button>
                    <button
                      onClick={handleFollowingConfirm}
                      className="flex-1 py-2 rounded-full bg-amber-400 text-white text-sm font-bold flex items-center justify-center gap-1"
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
                    {msg.audio && msg.type === 'bot' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => msg.followingText && speak(msg.text)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs transition-all",
                            isSpeaking ? "text-amber-500" : "text-amber-300 hover:text-amber-500"
                          )}
                          disabled={isSpeaking}
                        >
                          <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                          <span>朗读</span>
                        </button>
                        {msg.followingText && (
                          <button
                            onClick={() => msg.followingText && handleStartFollowing(msg.followingText)}
                            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-500 transition-all"
                          >
                            <RefreshCw size={14} />
                            <span>跟读</span>
                          </button>
                        )}
                      </div>
                    )}
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
                  <div className="bg-white text-slate-700 rounded-[24px] rounded-bl-none shadow-sm p-4 border border-slate-100">
                    <p className="text-sm font-medium leading-relaxed">{currentBotMessage.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500">
                        <Volume2 size={14} className="animate-pulse" />
                        <span>正在朗读...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
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

              {/* Voice Input Area */}
              <div className="flex items-center gap-3">
                {/* Mic Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMicClick}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                    isListening 
                      ? "bg-rose-500 shadow-lg shadow-rose-200" 
                      : "bg-amber-400 shadow-md shadow-amber-200"
                  )}
                >
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 rounded-full bg-rose-400 animate-ping"
                      />
                    )}
                  </AnimatePresence>
                  <Mic size={24} className="text-white relative z-10" />
                </motion.button>

                {/* Text Input */}
                <div className="flex-1 flex items-center bg-slate-100 rounded-full px-4 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputText.trim()) {
                        handleSend(inputText);
                      }
                    }}
                    placeholder="我也想听你的声音..."
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    disabled={isListening}
                  />
                  {inputText.trim() && (
                    <button
                      onClick={() => handleSend(inputText)}
                      className="p-1 text-amber-500"
                    >
                      <Send size={18} />
                    </button>
                  )}
                </div>
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

              {/* Transcript preview */}
              {transcript && isListening === false && speechState !== 'following' && (
                <div className="text-center text-xs text-slate-400">
                  听到了: "{transcript}"
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatPanel;

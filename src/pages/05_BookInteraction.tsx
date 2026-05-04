import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, RotateCcw, ArrowRight, CheckCircle2, Trophy, Star, Sparkles, Mic, RefreshCw, Check, VolumeX } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import AIChatPanel from '../components/AIChatPanel';
import VoiceSelector from '../components/VoiceSelector';
import { speakText, startListening, preloadVoices } from '../lib/useSpeech';

const BookInteraction = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  
  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 跟读状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [userSpokenText, setUserSpokenText] = useState('');
  
  const stopListeningRef = useRef<(() => void) | null>(null);

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

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  // 播放朗读
  const handlePlay = useCallback(() => {
    const text = story[currentPage].text;
    setIsPlaying(true);
    speakText(text, () => {}, () => {
      setIsPlaying(false);
    });
  }, [currentPage]);

  // 重读
  const handleReplay = useCallback(() => {
    handlePlay();
  }, [handlePlay]);

  // 开始跟读
  const handleStartFollowing = useCallback(() => {
    const text = story[currentPage].text;
    setIsFollowing(true);
    setUserSpokenText('');
    setIsListeningUser(false);

    // AI 先读一遍
    speakText(text, () => {}, () => {
      // 读完后开始监听用户
      setIsListeningUser(true);
      stopListeningRef.current = startListening(
        (spokenText) => {
          setUserSpokenText(spokenText);
          setIsListeningUser(false);
        },
        () => {
          setIsListeningUser(false);
        }
      );
    });
  }, [currentPage]);

  // 停止跟读
  const handleStopFollowing = useCallback(() => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setIsFollowing(false);
    setIsListeningUser(false);
    setUserSpokenText('');
  }, []);

  // 完成跟读
  const handleCompleteFollowing = useCallback(() => {
    handleStopFollowing();
  }, [handleStopFollowing]);

  // 再来一遍
  const handleReplayFollowing = useCallback(() => {
    handleStopFollowing();
    handleStartFollowing();
  }, [handleStopFollowing, handleStartFollowing]);

  // 下一题
  const handleNext = () => {
    // 如果在跟读模式，先退出
    if (isFollowing) {
      handleStopFollowing();
    }
    
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
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsVoiceSelectorOpen(true)}
                  className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 active:scale-95 transition-transform"
                >
                  <Volume2 size={20} />
                </button>
                <button 
                  onClick={() => setIsAIChatOpen(true)}
                  className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-sm border border-amber-200 active:scale-95 transition-transform"
                >
                  <Sparkles size={24} />
                </button>
              </div>
            </div>

            {/* Story Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
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

              {/* Following mode result */}
              <AnimatePresence>
                {isFollowing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200"
                  >
                    <div className="text-center mb-3">
                      <p className="text-sm text-amber-600 font-medium mb-1">
                        {isListeningUser ? '正在听你说...' : isPlaying ? '正在朗读...' : '请跟读'}
                      </p>
                      <p className="text-xs text-slate-400">跟着我一起读下面的句子吧</p>
                    </div>
                    
                    {/* User's speech result */}
                    <div className="bg-white rounded-xl p-3 border border-amber-200 mb-3">
                      <p className="text-sm text-slate-500 mb-1">你说的</p>
                      <p className={cn(
                        "text-base font-medium",
                        userSpokenText ? "text-slate-800" : "text-slate-400"
                      )}>
                        {userSpokenText || '请跟着朗读上方文字...'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleReplayFollowing}
                        className="flex-1 py-3 rounded-full border-2 border-amber-300 text-amber-600 text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} />
                        再听一遍
                      </button>
                      <button
                        onClick={handleCompleteFollowing}
                        className="flex-1 py-3 rounded-full bg-amber-400 text-white text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        完成跟读
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Text display */}
              <div className="w-full space-y-4 text-center">
                {/* Play button */}
                <button
                  onClick={handlePlay}
                  disabled={isPlaying || isFollowing}
                  className={cn(
                    "inline-flex items-center justify-center w-16 h-16 rounded-full transition-all",
                    isPlaying 
                      ? "bg-amber-200 text-amber-400 cursor-not-allowed" 
                      : isFollowing
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-amber-100 text-amber-500 hover:bg-amber-200 active:scale-95"
                  )}
                >
                  <Volume2 size={32} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
                
                {/* Sentence */}
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

                {/* Follow button */}
                {!isFollowing && (
                  <button
                    onClick={handleStartFollowing}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-full text-amber-600 font-bold text-sm hover:bg-amber-100 active:scale-95 transition-all"
                  >
                    <Mic size={18} />
                    跟读练习
                  </button>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 flex gap-4">
              <Button 
                variant="secondary"
                onClick={handleReplay}
                disabled={isPlaying || isFollowing}
                className="flex-1 h-20 rounded-[30px] bg-slate-100 text-slate-600 font-bold text-lg gap-2 border-none disabled:opacity-50"
              >
                <RotateCcw size={24} />
                重读
              </Button>
              <Button 
                onClick={handleNext}
                disabled={isFollowing}
                className="flex-[2] h-20 rounded-[30px] bg-amber-400 hover:bg-amber-500 text-white font-bold text-2xl gap-2 shadow-lg shadow-amber-200 border-none disabled:opacity-50"
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

      {/* AI Chat Panel */}
      <AIChatPanel 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        title="星宝AI助手"
        context="日常沟通"
      />

      {/* Voice Selector */}
      <VoiceSelector 
        isOpen={isVoiceSelectorOpen} 
        onClose={() => setIsVoiceSelectorOpen(false)} 
      />
    </MobileShell>
  );
};

export default BookInteraction;

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, ArrowRight, Trophy, Star, Mic, Check, RefreshCw, Send, Sparkles } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import AIChatPanel from '../components/AIChatPanel';
import VoiceSelector from '../components/VoiceSelector';
import { speakText, startListening, preloadVoices } from '../lib/useSpeech';

// 绘本主题
export type BookTheme = 'emotion' | 'help' | 'daily';

// 故事页
interface StoryPage {
  id: number;
  text: string;
  image: string;
  question: string;
  answer: string;
}

// 绘本数据
const BOOKS_DATA: Record<number, {
  id: BookTheme;
  title: string;
  subtitle: string;
  successText: string;
  stories: StoryPage[];
}> = {
  // 情绪识别
  1: {
    id: 'emotion',
    title: '情绪识别',
    subtitle: '认识不同的情绪',
    successText: '星宝学会了识别不同的情绪',
    stories: [
      {
        id: 1,
        text: "今天妈妈带我去公园玩，我非常开心。",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop",
        question: "故事里的小朋友为什么很开心？",
        answer: "因为妈妈带他去公园玩"
      },
      {
        id: 2,
        text: "我的气球飞走了，我有点难过。",
        image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&h=400&fit=crop",
        question: "故事里的小朋友为什么难过？",
        answer: "因为气球飞走了"
      },
      {
        id: 3,
        text: "弟弟抢走了我的玩具，我很生气。",
        image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop",
        question: "故事里的小朋友为什么生气？",
        answer: "因为弟弟抢走了他的玩具"
      }
    ]
  },
  // 寻求帮助
  2: {
    id: 'help',
    title: '寻求帮助',
    subtitle: '学会正确表达需求',
    successText: '星宝学会了如何向他人寻求帮助',
    stories: [
      {
        id: 1,
        text: "妈妈，我够不到水杯，你能帮我拿一下吗？",
        image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&h=400&fit=crop",
        question: "故事里的小朋友是怎么请求帮助的？",
        answer: "妈妈，我够不到，你能帮我拿一下吗"
      },
      {
        id: 2,
        text: "老师，这道题我不会做，您可以教教我吗？",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
        question: "故事里的小朋友是怎么向老师请求帮助的？",
        answer: "老师，这道题我不会做，您可以教教我吗"
      },
      {
        id: 3,
        text: "叔叔，我和妈妈走散了，您能帮我找妈妈吗？",
        image: "https://images.unsplash.com/photo-1447069387593-a5de0862485e?w=600&h=400&fit=crop",
        question: "故事里的小朋友遇到什么困难了？",
        answer: "和妈妈走散了"
      }
    ]
  },
  // 日常使用
  3: {
    id: 'daily',
    title: '日常使用',
    subtitle: '学习日常表达',
    successText: '星宝学会了日常沟通表达',
    stories: [
      {
        id: 1,
        text: "早上好，妈妈。今天天气真好啊！",
        image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop",
        question: "故事里的小朋友早上和妈妈说了什么？",
        answer: "早上好，妈妈"
      },
      {
        id: 2,
        text: "谢谢阿姨送我礼物，阿姨你真好！",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=400&fit=crop",
        question: "故事里的小朋友收到礼物后说了什么？",
        answer: "谢谢阿姨，阿姨你真好"
      },
      {
        id: 3,
        text: "对不起，我不小心弄坏了你的书。",
        image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=400&fit=crop",
        question: "故事里的小朋友做了什么？",
        answer: "道歉，因为弄坏了书"
      }
    ]
  }
};

// 游戏阶段
type GamePhase = 'intro' | 'reading' | 'question' | 'answering' | 'feedback' | 'complete';

const BookInteraction = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  
  const currentBookId = useMemo(() => {
    const id = parseInt(bookId || '1', 10);
    return Math.min(Math.max(id, 1), 3);
  }, [bookId]);

  const bookData = BOOKS_DATA[currentBookId] || BOOKS_DATA[1];
  
  // 游戏状态
  const [currentStory, setCurrentStory] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  
  // AI Chat
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);

  const stopListeningRef = useRef<(() => void) | null>(null);
  const story = bookData.stories[currentStory];

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  // 重置状态
  const resetState = useCallback(() => {
    setPhase('intro');
    setIsPlaying(false);
    setIsListening(false);
    setUserAnswer('');
    setIsCorrect(false);
    setShowResult(false);
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
  }, []);

  // 切换到下一故事
  const nextStory = useCallback(() => {
    if (currentStory < bookData.stories.length - 1) {
      setCurrentStory(prev => prev + 1);
      resetState();
    } else {
      setPhase('complete');
    }
  }, [currentStory, bookData.stories.length, resetState]);

  // 开始跟读故事
  const startReading = useCallback(() => {
    setPhase('reading');
    setIsPlaying(true);
    speakText(story.text, () => {}, () => {
      setIsPlaying(false);
      // 跟读结束后进入提问阶段
      setTimeout(() => {
        setPhase('question');
        // AI 朗读问题
        setTimeout(() => {
          speakText(story.question);
        }, 500);
      }, 1000);
    });
  }, [story]);

  // 开始回答
  const startAnswering = useCallback(() => {
    setPhase('answering');
    setIsListening(true);
    setUserAnswer('');

    stopListeningRef.current = startListening(
      (text) => {
        setUserAnswer(text);
        setIsListening(false);
        
        // 简单判断是否正确（包含关键词）
        const answerLower = text.toLowerCase();
        const correctLower = story.answer.toLowerCase();
        const keywords = correctLower.split(/[,，、]/).filter(k => k.trim().length > 2);
        const matchedCount = keywords.filter(k => answerLower.includes(k.trim())).length;
        const correct = matchedCount >= Math.ceil(keywords.length * 0.6);
        
        setIsCorrect(correct);
        setShowResult(true);
        setPhase('feedback');
        
        if (correct) {
          setScore(prev => prev + 1);
          speakText("太棒了！回答正确！");
        } else {
          speakText(`回答得很好。其实正确答案是：${story.answer}`);
        }
      },
      (error) => {
        console.error('Voice error:', error);
        setIsListening(false);
      }
    );
  }, [story]);

  // 停止录音
  const stopListening = useCallback(() => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setIsListening(false);
  }, []);

  // 返回首页
  const handleBack = () => {
    resetState();
    setCurrentStory(0);
    setScore(0);
    navigate('/books');
  };

  return (
    <MobileShell className="bg-gradient-to-b from-amber-50 to-white">
      <AnimatePresence mode="wait">
        {/* ========== 介绍阶段 ========== */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-6 pt-4 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <span className="text-sm font-bold text-amber-600">{bookData.title}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsVoiceSelectorOpen(true)}
                  className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-100"
                >
                  <Volume2 size={18} />
                </button>
                <button 
                  onClick={() => setIsAIChatOpen(true)}
                  className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 border border-amber-200"
                >
                  <Sparkles size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-xl mb-8"
              >
                <span className="text-6xl">📖</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{bookData.title}</h1>
              <p className="text-lg text-slate-500 mb-8">{bookData.subtitle}</p>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 text-left w-full max-w-sm">
                <p className="text-sm text-slate-600 font-medium mb-2">游戏规则：</p>
                <ul className="text-sm text-slate-500 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">1.</span>
                    <span>先听AI朗读故事</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">2.</span>
                    <span>跟着一起读</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">3.</span>
                    <span>回答AI提出的问题</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setCurrentStory(0);
                  startReading();
                }}
                className="w-full max-w-sm h-16 bg-amber-400 hover:bg-amber-500 text-white font-bold text-xl rounded-full shadow-lg border-none"
              >
                开始听故事
                <ArrowRight size={24} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========== 跟读阶段 ========== */}
        {(phase === 'reading' || phase === 'question' || phase === 'answering' || phase === 'feedback') && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-4 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-amber-600">{bookData.title}</span>
                <div className="flex gap-1 mt-1">
                  {bookData.stories.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === currentStory ? "w-6 bg-amber-400" : i < currentStory ? "w-2 bg-emerald-400" : "w-2 bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-amber-500 font-medium">{currentStory + 1}/{bookData.stories.length}</span>
            </div>

            {/* Story Image */}
            <div className="p-6">
              <motion.div
                key={currentStory}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full aspect-video rounded-[30px] overflow-hidden shadow-xl"
              >
                <img src={story.image} alt="故事" className="w-full h-full object-cover" />
              </motion.div>
            </div>

            {/* Story Text / Question */}
            <div className="flex-1 px-6 pb-4">
              {phase === 'reading' && (
                <motion.div
                  key="reading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg text-center"
                >
                  <p className="text-xl font-medium text-slate-700 leading-relaxed">
                    {isPlaying ? story.text : "点击下方按钮，跟我一起读..."}
                  </p>
                  <button
                    onClick={startReading}
                    disabled={isPlaying}
                    className={cn(
                      "mt-4 w-16 h-16 rounded-full flex items-center justify-center transition-all",
                      isPlaying ? "bg-amber-200 cursor-not-allowed" : "bg-amber-400 hover:bg-amber-500"
                    )}
                  >
                    <Volume2 size={32} className={cn("text-white", isPlaying && "animate-pulse")} />
                  </button>
                </motion.div>
              )}

              {phase === 'question' && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 rounded-2xl p-6 shadow-lg border-2 border-amber-200 text-center"
                >
                  <p className="text-xs text-amber-600 font-medium mb-2">听好了，我要提问啦！</p>
                  <p className="text-xl font-bold text-amber-800 leading-relaxed mb-4">
                    {story.question}
                  </p>
                  <Button
                    onClick={startAnswering}
                    className="w-full h-14 bg-rose-400 hover:bg-rose-500 text-white font-bold text-lg rounded-full border-none"
                  >
                    <Mic size={20} className="mr-2" />
                    点击回答问题
                  </Button>
                </motion.div>
              )}

              {phase === 'answering' && (
                <motion.div
                  key="answering"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 rounded-2xl p-6 shadow-lg border-2 border-rose-200"
                >
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold text-rose-700 mb-2">请回答问题：</p>
                    <p className="text-base text-slate-600">{story.question}</p>
                  </div>
                  
                  {/* Recording UI */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                    {isListening ? (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <motion.div
                              key={i}
                              animate={{ scaleY: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                              className="w-1.5 h-6 bg-rose-400 rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-rose-500 font-medium">正在听你说...</span>
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-2">
                        {userAnswer ? `"${userAnswer}"` : '点击麦克风开始说话'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={stopListening}
                      variant="secondary"
                      className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-full border-none"
                    >
                      停止录音
                    </Button>
                    <Button
                      onClick={startAnswering}
                      className="flex-1 h-12 bg-rose-400 hover:bg-rose-500 text-white font-bold rounded-full border-none"
                    >
                      <Mic size={18} className="mr-1" />
                      {userAnswer ? '再说一遍' : '开始录音'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === 'feedback' && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl p-6 shadow-lg text-center",
                    isCorrect ? "bg-emerald-50 border-2 border-emerald-300" : "bg-amber-50 border-2 border-amber-300"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                    isCorrect ? "bg-emerald-200" : "bg-amber-200"
                  )}>
                    {isCorrect ? (
                      <Check size={32} className="text-emerald-600" />
                    ) : (
                      <span className="text-2xl">💪</span>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-xl font-bold mb-2",
                    isCorrect ? "text-emerald-700" : "text-amber-700"
                  )}>
                    {isCorrect ? "太棒了！回答正确！" : "回答得很好！"}
                  </p>
                  
                  {!isCorrect && (
                    <p className="text-base text-slate-600 mb-2">
                      正确答案：<span className="font-bold text-amber-700">{story.answer}</span>
                    </p>
                  )}
                  
                  {userAnswer && (
                    <p className="text-sm text-slate-500 mb-4">
                      你说的："{userAnswer}"
                    </p>
                  )}

                  <Button
                    onClick={nextStory}
                    className={cn(
                      "w-full h-14 font-bold text-lg rounded-full border-none",
                      currentStory < bookData.stories.length - 1
                        ? "bg-amber-400 hover:bg-amber-500 text-white"
                        : "bg-emerald-400 hover:bg-emerald-500 text-white"
                    )}
                  >
                    {currentStory < bookData.stories.length - 1 ? (
                      <>
                        下一题
                        <ArrowRight size={20} className="ml-2" />
                      </>
                    ) : (
                      <>
                        查看结果
                        <Trophy size={20} className="ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========== 完成阶段 ========== */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-48 h-48 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-2xl mb-8"
            >
              <Trophy size={80} className="text-white" />
            </motion.div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">真棒！</h1>
            <p className="text-lg text-slate-500 mb-4">{bookData.successText}</p>
            <p className="text-sm text-amber-500 mb-2">本次得分：{score}/{bookData.stories.length}</p>
            <p className="text-2xl text-amber-500 font-bold mb-12">
              获得 {score} 颗星星 ⭐
            </p>

            <div className="space-y-4 w-full max-w-sm">
              <Button
                onClick={() => {
                  resetState();
                  setCurrentStory(0);
                  setScore(0);
                }}
                className="w-full h-16 bg-amber-400 hover:bg-amber-500 text-white font-bold text-xl rounded-full border-none"
              >
                <RefreshCw size={24} className="mr-2" />
                再来一次
              </Button>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full h-14 text-slate-400 font-bold text-lg"
              >
                返回绘本列表
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Panel */}
      <AIChatPanel 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        title={`星宝AI助手 - ${bookData.title}`}
        context={bookData.title}
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

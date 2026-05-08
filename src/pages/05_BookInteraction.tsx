import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, Mic, Check, ArrowRight, Trophy, RefreshCw, Sparkles, Star, Home, Square } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, startListening, stopListening, preloadVoices, stopSpeaking } from '../lib/useSpeech';
import VoiceSelector from '../components/VoiceSelector';
import AIChatPanel from '../components/AIChatPanel';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';

type BookTheme = 'emotion' | 'help' | 'daily';
type GamePhase = 'intro' | 'reading' | 'follow-up' | 'question' | 'answering' | 'feedback' | 'complete';

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
  gradient: string;
  color: string;
  stories: StoryPage[];
}> = {
  // 情绪识别
  1: {
    id: 'daily',
    title: '日常使用',
    subtitle: '学习日常表达',
    gradient: 'from-emerald-200 to-teal-300',
    color: 'text-emerald-600',
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
  },
  // 寻求帮助
  2: {
    id: 'help',
    title: '寻求帮助',
    subtitle: '学会正确表达需求',
    gradient: 'from-blue-200 to-indigo-300',
    color: 'text-blue-600',
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
    id: 'emotion',
    title: '情绪表达',
    subtitle: '认识不同的情绪',
    gradient: 'from-rose-200 to-pink-300',
    color: 'text-rose-600',
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
  }
};

const BookInteraction = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { profile, avatar } = useUser();
  const { startTraining, incrementExpression, incrementBookCompleted, incrementGamePass, dailyStats } = useApp();
  const hasStartedTraining = useRef(false);
  const hasGivenStarRef = useRef<Set<number>>(new Set()); // 防止重复奖励
  
  const [currentStory, setCurrentStory] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0); // 本次获得星星数
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  const bookData = BOOKS_DATA[Number(bookId) || 1];
  const story = bookData?.stories[currentStory];

  useEffect(() => {
    preloadVoices();
  }, []);

  // 进入页面时开始训练计时（只执行一次）
  useEffect(() => {
    let mounted = true;
    if (!hasStartedTraining.current && bookId && mounted) {
      hasStartedTraining.current = true;
      startTraining();
    }
    return () => {
      mounted = false;
    };
  }, [bookId]); // 只依赖 bookId

  const resetState = useCallback(() => {
    setPhase('intro');
    setIsPlaying(false);
    setIsListening(false);
    setUserAnswer('');
    setIsCorrect(false);
    setShowResult(false);
    setEarnedStars(0); // 重置星星
    setIsAIChatOpen(false);
    stopListening();
  }, []);

  // 开始阅读
  const startReading = useCallback(() => {
    setPhase('reading');
    setIsPlaying(true);
    speakText(story.text, () => {
      setIsPlaying(false);
      // 朗读完成后进入跟读阶段，让用户自己点击进入答题
      setPhase('follow-up');
    });
  }, [story]);

  // 开始回答
  const startAnswering = useCallback(() => {
    setPhase('answering');
    setIsListening(true);
    setUserAnswer('');

    startListening({
      onTranscript: (text: string, isFinal: boolean) => {
        // 过滤空文本
        const trimmedText = text.trim();
        if (!trimmedText) return;
        
        if (isFinal) {
          setUserAnswer(trimmedText);
          setIsListening(false);
          
          const answerLower = trimmedText.toLowerCase();
          const correctLower = story.answer.toLowerCase();
          const keywords = correctLower.split(/[,，、]/).filter(k => k.trim().length > 2);
          const matchedCount = keywords.filter(k => answerLower.includes(k.trim())).length;
          const correct = matchedCount >= Math.ceil(keywords.length * 0.6);
          
          setIsCorrect(correct);
          setShowResult(true);
          setPhase('feedback');
          
          // 统计：增加主动表达次数和绘本完成数
          incrementExpression('book');
          incrementBookCompleted();
          
          if (correct) {
            // 每答对一题就获得一个星星并累计通关次数
            console.log('答对了！增加星星');
            setEarnedStars(prev => {
              console.log('earnedStars:', prev, '->', prev + 1);
              return prev + 1;
            });
            incrementGamePass(); // 实时更新通关次数
            speakText("太棒了！回答正确！获得一颗星星！");
          } else {
            console.log('答错了，正确答案是:', story.answer);
            speakText(`回答得很好。其实正确答案是：${story.answer}`);
          }
        }
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  }, [story, incrementExpression, incrementBookCompleted]);

  // 停止录音
  const stopCurrentListening = useCallback(() => {
    stopListening();
    setIsListening(false);
  }, []);
  
  // 下一题
  const nextStory = () => {
    if (currentStory < bookData.stories.length - 1) {
      resetState();
      setCurrentStory(prev => prev + 1);
    } else {
      // 全部完成，增加闯关次数
      incrementGamePass();
      setPhase('complete');
    }
  };

  // 返回首页
  const handleBack = () => {
    resetState();
    setCurrentStory(0);
    setEarnedStars(0);
    navigate('/books');
  };

  return (
    <MobileShell className="bg-gradient-to-b from-amber-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 星星装饰 */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300"
            style={{ left: `${8 + i * 12}%`, top: `${3 + (i % 4) * 6}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2.5 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
        {/* 云朵装饰 */}
        <motion.div
          animate={{ x: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
          className="absolute top-16 right-10 text-4xl opacity-30"
        >
          ☁️
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {/* ========== 介绍阶段 ========== */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col relative"
          >
            <div className="px-6 pt-4 flex items-center justify-between relative z-10">
              <button
                onClick={handleBack}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-lg"
              >
                <ChevronLeft size={28} />
              </button>
              
              {/* 星星和通关次数显示 */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 rounded-full shadow-md">
                  <span className="text-lg">⭐</span>
                  <span className="font-bold text-amber-600">{dailyStats.gamePassCount}</span>
                  <span className="text-xs text-amber-500">颗星星</span>
                </div>
                <span className="text-[10px] text-slate-400">本次获得: {earnedStars} ⭐</span>
              </div>
              
              <div className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r",
                bookData.gradient,
                "text-white shadow-md"
              )}>
                {bookData.title}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsVoiceSelectorOpen(true)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-md border-2 border-amber-100"
                >
                  <Volume2 size={18} />
                </button>
                <button 
                  onClick={() => setIsAIChatOpen(true)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-md border-2 border-amber-100"
                >
                  <Sparkles size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {/* 绘本图标 */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn(
                  "w-40 h-40 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl mb-6",
                  bookData.gradient
                )}
              >
                <span className="text-7xl">📖</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur px-6 py-3 rounded-full shadow-md mb-4"
              >
                <p className="text-lg font-bold text-slate-700">{bookData.title}</p>
                <p className="text-sm text-slate-500">{bookData.subtitle}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-amber-50 border-2 border-amber-200 px-6 py-3 rounded-2xl shadow-md mb-8"
              >
                <p className="text-sm text-amber-700">
                  第 <span className="font-bold">{currentStory + 1}</span> 页，共 <span className="font-bold">{bookData.stories.length}</span> 页
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={startReading}
                  className={cn(
                    "h-16 px-12 rounded-full font-bold text-xl shadow-xl border-none bg-gradient-to-r",
                    bookData.gradient,
                    "text-white"
                  )}
                >
                  开始阅读
                  <ArrowRight size={24} className="ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ========== 阅读阶段 ========== */}
        {phase === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-4 flex items-center justify-between">
              <button
                onClick={() => { resetState(); setCurrentStory(0); }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-lg"
              >
                <Home size={22} />
              </button>
              {/* 星星和通关次数显示 */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 rounded-full shadow-md">
                  <span className="text-lg">⭐</span>
                  <span className="font-bold text-amber-600">{dailyStats.gamePassCount}</span>
                  <span className="text-xs text-amber-500">颗星星</span>
                </div>
                <span className="text-[10px] text-slate-400">本次获得: {earnedStars} ⭐</span>
              </div>
              <div className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold",
                bookData.color,
                "bg-white shadow-md"
              )}>
                第{currentStory + 1}页
              </div>
            </div>

            {/* 图片 */}
            <motion.div
              layoutId={`story-image-${currentStory}`}
              className="mx-6 mt-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img 
                src={story.image} 
                alt="故事" 
                className="w-full aspect-video object-cover"
              />
            </motion.div>

            {/* 文字内容 */}
            <motion.div
              key={currentStory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 p-6 flex flex-col items-center justify-center"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-amber-100 max-w-sm text-center">
                <p className="text-xl font-bold text-slate-700 leading-relaxed">
                  "{story.text}"
                </p>
              </div>
              
              {/* 朗读按钮 */}
              <motion.button
                animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: isPlaying ? Infinity : 0, duration: 1 }}
                onClick={() => !isPlaying && speakText(story.text)}
                className={cn(
                  "mt-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all",
                  isPlaying 
                    ? "bg-amber-200 cursor-not-allowed" 
                    : "bg-gradient-to-br from-amber-400 to-orange-400 hover:scale-105"
                )}
              >
                <Volume2 size={32} className={cn("text-white", isPlaying && "animate-pulse")} />
              </motion.button>
              <p className="mt-2 text-sm text-amber-600 font-medium">
                {isPlaying ? '正在朗读...' : '点击重听'}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ========== 跟读阶段 - 朗读完成后等待用户 ========== */}
        {phase === 'follow-up' && (
          <motion.div
            key="follow-up"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { resetState(); setCurrentStory(0); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-lg">
                <Home size={22} />
              </button>
              <div className="flex items-center gap-2">
                {[...Array(bookData.stories.length)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i === currentStory ? "bg-amber-400 scale-125" : i < currentStory ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <div className="w-12" />
            </div>

            {/* 图片 */}
            <motion.div
              layoutId={`story-image-${currentStory}`}
              className="mx-6 mt-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img 
                src={story.image} 
                alt="故事" 
                className="w-full aspect-video object-cover"
              />
            </motion.div>

            {/* 文字内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 p-6 flex flex-col items-center justify-center"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-amber-100 max-w-sm text-center">
                <p className="text-xl font-bold text-slate-700 leading-relaxed">
                  "{story.text}"
                </p>
              </div>

              {/* 完成提示 */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl px-6 py-3 shadow-md"
              >
                <p className="text-emerald-600 font-bold text-lg">听完了！✨</p>
              </motion.div>

              {/* 按钮组 */}
              <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
                {/* 重听/停止按钮 */}
                <button
                  onClick={() => {
                    if (isPlaying) {
                      stopSpeaking();
                    } else {
                      speakText(story.text);
                    }
                  }}
                  className={cn(
                    "w-full h-12 border-2 rounded-full flex items-center justify-center gap-2 font-bold transition-all",
                    isPlaying 
                      ? "bg-rose-100 border-rose-300 text-rose-500" 
                      : "bg-white border-amber-200 text-amber-600"
                  )}
                >
                  {isPlaying ? (
                    <>
                      <Square size={20} />
                      停止播放
                    </>
                  ) : (
                    <>
                      <Volume2 size={20} />
                      再听一遍
                    </>
                  )}
                </button>
                
                {/* 开始答题按钮 */}
                <Button
                  onClick={() => {
                    setPhase('question');
                    speakText(story.question);
                  }}
                  className="w-full h-14 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-lg rounded-full shadow-lg border-none"
                >
                  <Mic size={22} className="mr-2" />
                  开始答题
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ========== 提问阶段 ========== */}
        {phase === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { resetState(); setCurrentStory(0); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-lg">
                <Home size={22} />
              </button>
              <div className="flex items-center gap-2">
                {[...Array(bookData.stories.length)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i === currentStory ? "bg-amber-400 scale-125" : i < currentStory ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <div className="w-12" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center shadow-xl",
                  bookData.gradient,
                  "text-white"
                )}
              >
                <span className="text-4xl">❓</span>
              </motion.div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 shadow-lg border-2 border-amber-200 max-w-sm">
                <p className="text-xs text-amber-600 font-bold mb-2">✨ 请听好问题</p>
                <p className="text-xl font-bold text-slate-700 leading-relaxed">
                  {story.question}
                </p>
              </div>
              
              <Button
                onClick={startAnswering}
                className="h-16 px-12 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-xl shadow-xl border-none"
              >
                <Mic size={24} className="mr-2" />
                点击回答问题
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========== 回答阶段 ========== */}
        {phase === 'answering' && (
          <motion.div
            key="answering"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col p-6"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-rose-50 border-2 border-rose-200 px-6 py-3 rounded-full">
                <p className="text-lg font-bold text-rose-700">请回答问题 👇</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {/* 问题显示 */}
              <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 max-w-sm w-full">
                <p className="text-sm text-slate-400 mb-1">问题：</p>
                <p className="text-base text-slate-600">{story.question}</p>
              </div>

              {/* 录音状态 */}
              <motion.div
                animate={{ scale: isListening ? [1, 1.02, 1] : 1 }}
                className={cn(
                  "w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-xl transition-all",
                  isListening 
                    ? "bg-gradient-to-br from-rose-400 to-pink-500" 
                    : "bg-gradient-to-br from-slate-100 to-slate-200"
                )}
              >
                <span className="text-5xl mb-2">{isListening ? '🎤' : '🎙️'}</span>
                <p className={cn(
                  "text-sm font-bold",
                  isListening ? "text-white" : "text-slate-400"
                )}>
                  {isListening ? '正在听...' : '已停止'}
                </p>
              </motion.div>

              {/* 用户回答 */}
              <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-rose-100 max-w-sm w-full">
                <p className="text-xs text-slate-400 mb-1">你说的：</p>
                <p className={cn(
                  "text-base font-medium",
                  userAnswer ? "text-slate-700" : "text-slate-400 italic"
                )}>
                  {userAnswer || '点击麦克风开始说话~'}
                </p>
              </div>

              {/* 控制按钮 */}
              <div className="flex gap-4 w-full max-w-sm">
                <Button
                  onClick={() => stopListening()}
                  variant="secondary"
                  className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-full border-none"
                >
                  停止
                </Button>
                <Button
                  onClick={startAnswering}
                  className="flex-1 h-14 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full border-none"
                >
                  <Mic size={20} className="mr-1" />
                  {userAnswer ? '再说一遍' : '开始录音'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== 反馈阶段 ========== */}
        {phase === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-6",
                isCorrect ? "bg-gradient-to-br from-emerald-300 to-teal-400" : "bg-gradient-to-br from-amber-300 to-orange-400"
              )}
            >
              {isCorrect ? (
                <Check size={48} className="text-white" />
              ) : (
                <span className="text-5xl">💪</span>
              )}
            </motion.div>
            
            <h2 className={cn(
              "text-3xl font-bold mb-2",
              isCorrect ? "text-emerald-600" : "text-amber-600"
            )}>
              {isCorrect ? "太棒了！🎉" : "回答得很好！"}
            </h2>
            
            {!isCorrect && (
              <div className="bg-white rounded-2xl p-4 shadow-md border border-amber-200 mb-4">
                <p className="text-sm text-slate-500">正确答案：</p>
                <p className="text-base font-bold text-amber-700">{story.answer}</p>
              </div>
            )}
            
            {userAnswer && (
              <p className="text-sm text-slate-500 mb-6">
                你说的："{userAnswer}"
              </p>
            )}

            <Button
              onClick={nextStory}
              className={cn(
                "h-16 px-12 rounded-full font-bold text-xl shadow-xl border-none bg-gradient-to-r",
                currentStory < bookData.stories.length - 1
                  ? "from-amber-400 to-orange-400 text-white"
                  : "from-emerald-400 to-teal-500 text-white"
              )}
            >
              {currentStory < bookData.stories.length - 1 ? (
                <>
                  下一题
                  <ArrowRight size={24} className="ml-2" />
                </>
              ) : (
                <>
                  查看结果
                  <Trophy size={24} className="ml-2" />
                </>
              )}
            </Button>
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
              className="relative mb-8"
            >
              <div className="w-40 h-40 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-2xl">
                <Trophy size={80} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Star size={32} className="text-white" fill="currentColor" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">真棒！</h1>
            <p className="text-lg text-slate-500 mb-4">{bookData.successText}</p>
            <p className="text-sm text-amber-500 mb-2">本次得分：{earnedStars}/{bookData.stories.length}</p>
            <p className="text-2xl text-amber-500 font-bold mb-12">
              获得 {earnedStars} 颗星星 ⭐
            </p>

            <div className="space-y-4 w-full max-w-sm">
              <Button
                onClick={() => {
                  resetState();
                  setCurrentStory(0);
                  setEarnedStars(0);
                }}
                className="w-full h-16 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-xl rounded-full border-none shadow-xl"
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

      <VoiceSelector isOpen={isVoiceSelectorOpen} onClose={() => setIsVoiceSelectorOpen(false)} />
      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} context={bookData?.title} />
    </MobileShell>
  );
};

export default BookInteraction;

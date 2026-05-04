import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 表情数据
const EMOTIONS_DATA = [
  {
    id: 1,
    emoji: "😊",
    name: "开心",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", // 笑脸
    hint: "眼睛弯弯，嘴角上扬"
  },
  {
    id: 2,
    emoji: "😢",
    name: "难过",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face", // 难过
    hint: "眉毛下垂，看起来不开心"
  },
  {
    id: 3,
    emoji: "😠",
    name: "生气",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face", // 生气
    hint: "眉头紧皱，嘴巴抿着"
  },
  {
    id: 4,
    emoji: "😨",
    name: "害怕",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", // 害怕
    hint: "眼睛睁大，脸色发白"
  },
  {
    id: 5,
    emoji: "😮",
    name: "惊讶",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", // 惊讶
    hint: "嘴巴张开，眼睛睁大"
  },
  {
    id: 6,
    emoji: "🤔",
    name: "思考",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face", // 思考
    hint: "手摸着下巴，眼睛看上方"
  }
];

// 所有情绪选项
const ALL_EMOTIONS = ["开心", "难过", "生气", "害怕", "惊讶", "思考"];

// 打乱数组
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 生成题目
function generateQuestions(count: number) {
  const shuffledEmotions = shuffleArray(EMOTIONS_DATA);
  return shuffledEmotions.slice(0, Math.min(count, shuffledEmotions.length)).map(emotion => {
    // 生成3个选项（包括正确答案和2个干扰项）
    const otherEmotions = ALL_EMOTIONS.filter(e => e !== emotion.name);
    const wrongOptions = shuffleArray(otherEmotions).slice(0, 2);
    const options = shuffleArray([emotion.name, ...wrongOptions]);
    
    return {
      emotion,
      options
    };
  });
}

const EmotionGuess = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState(() => generateQuestions(6));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const question = questions[currentQuestion];

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 朗读题目
  useEffect(() => {
    if (question && !showResult) {
      setIsSpeaking(true);
      speakText("这是什么表情？选择正确的情绪。", () => {}, () => {
        setIsSpeaking(false);
      });
    }
  }, [currentQuestion, showResult]);

  // 选择选项
  const handleSelect = useCallback((option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    setShowResult(true);
    
    const correct = option === question.emotion.name;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      setIsSpeaking(true);
      speakText("太棒了！你真厉害！", () => {}, () => {
        setIsSpeaking(false);
      });
    } else {
      setIsSpeaking(true);
      speakText(`没关系，正确答案是${question.emotion.name}。${question.emotion.hint}`, () => {}, () => {
        setIsSpeaking(false);
      });
    }
  }, [question, showResult]);

  // 下一题
  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setSelectedOption(null);
      setShowResult(false);
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentQuestion, questions.length]);

  // 重来
  const handleReplay = useCallback(() => {
    setCurrentQuestion(0);
    setQuestions(generateQuestions(6));
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
  }, []);

  return (
    <MobileShell className="bg-gradient-to-b from-purple-50 to-white">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-4 flex items-center justify-between pb-4">
              <button
                onClick={() => navigate('/training')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-purple-600">表情猜猜看</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{currentQuestion + 1}/{questions.length}</span>
                  <span className="text-xs text-amber-500 font-medium">得分: {score}</span>
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Progress bar */}
            <div className="px-6 mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                />
              </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
              {/* Emotion Image */}
              <motion.div
                key={currentQuestion}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-56 h-56 rounded-full overflow-hidden shadow-2xl shadow-purple-200 border-8 border-white bg-white"
              >
                <img
                  src={question.emotion.image}
                  alt="表情"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Question */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">这是什么表情？</h2>
                <p className="text-sm text-slate-400">选择正确的情绪</p>
              </div>

              {/* Options */}
              <div className="w-full grid grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isThisCorrect = option === question.emotion.name;
                  
                  let bgClass = 'bg-white border-2 border-slate-200';
                  let textClass = 'text-slate-800';
                  let emojiBgClass = 'bg-slate-100';
                  
                  if (showResult) {
                    if (isThisCorrect) {
                      bgClass = 'bg-emerald-100 border-2 border-emerald-400';
                      textClass = 'text-emerald-700';
                      emojiBgClass = 'bg-emerald-200';
                    } else if (isSelected) {
                      bgClass = 'bg-rose-100 border-2 border-rose-400';
                      textClass = 'text-rose-700';
                      emojiBgClass = 'bg-rose-200';
                    } else {
                      bgClass = 'bg-slate-50 border-2 border-slate-100';
                      textClass = 'text-slate-400';
                    }
                  }

                  return (
                    <motion.button
                      key={`${currentQuestion}-${index}`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(option)}
                      disabled={showResult}
                      className={cn(
                        "relative p-4 rounded-2xl transition-all flex items-center gap-3",
                        bgClass,
                        !showResult && "hover:border-purple-300 hover:bg-purple-50 active:scale-95"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                        emojiBgClass
                      )}>
                        {EMOTIONS_DATA.find(e => e.name === option)?.emoji || "❓"}
                      </div>
                      <span className={cn("font-bold text-lg", textClass)}>{option}</span>
                      
                      {showResult && isThisCorrect && (
                        <CheckCircle2 size={24} className="absolute top-2 right-2 text-emerald-500" />
                      )}
                      {showResult && isSelected && !isThisCorrect && (
                        <XCircle size={24} className="absolute top-2 right-2 text-rose-500" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Hint after wrong answer */}
              <AnimatePresence>
                {showResult && !isCorrect && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"
                  >
                    <p className="text-sm text-amber-700">
                      <span className="font-bold">提示：</span>
                      {question.emotion.hint}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next Button */}
            <div className="p-6 pb-8">
              <Button
                onClick={handleNext}
                disabled={!showResult}
                className={cn(
                  "w-full h-16 rounded-full font-bold text-xl gap-2 border-none",
                  showResult
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-200"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {currentQuestion < questions.length - 1 ? (
                  <>
                    下一题
                    <ArrowRight size={24} />
                  </>
                ) : (
                  <>
                    查看结果
                    <Trophy size={24} />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Trophy */}
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-40 h-40 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Trophy size={80} className="text-white" />
              </motion.div>
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Star size={32} className="text-white" fill="currentColor" />
              </div>
            </div>

            {/* Score */}
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {score >= questions.length * 0.8 ? "太厉害了！" : score >= questions.length * 0.5 ? "很不错！" : "继续加油！"}
            </h1>
            <p className="text-xl text-slate-500 mb-2">你答对了 {score}/{questions.length} 题</p>
            <p className="text-sm text-amber-500 mb-12">获得 {score} 颗星星奖励</p>

            {/* Buttons */}
            <div className="space-y-4 w-full">
              <Button
                onClick={() => {
                  setCurrentQuestion(0);
                  setQuestions(generateQuestions(6));
                  setSelectedOption(null);
                  setShowResult(false);
                  setScore(0);
                  setIsFinished(false);
                }}
                className="w-full h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl gap-2 border-none hover:opacity-90 shadow-lg shadow-purple-200"
              >
                <RotateCcw size={24} />
                再来一次
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/training')}
                className="w-full h-14 rounded-full text-slate-400 font-bold text-lg"
              >
                返回游戏列表
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default EmotionGuess;

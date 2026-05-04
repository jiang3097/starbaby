import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 四种基本情绪 - 使用 emoji 风格的卡通背景
const EMOTIONS = [
  { 
    id: 'happy', 
    name: '开心', 
    description: '眉毛弯弯，眼睛眯成月牙',
    // 黄色背景 + 开心 emoji
    bgColor: '#FFE066',
    emojiChar: '😊'
  },
  { 
    id: 'sad', 
    name: '难过', 
    description: '嘴角下垂，眼泪汪汪',
    // 蓝色背景 + 难过 emoji
    bgColor: '#74C0FC',
    emojiChar: '😢'
  },
  { 
    id: 'angry', 
    name: '生气', 
    description: '眉头紧皱，脸颊发红',
    // 红色背景 + 生气 emoji
    bgColor: '#FF8787',
    emojiChar: '😠'
  },
  { 
    id: 'scared', 
    name: '害怕', 
    description: '眼睛睁大，脸色发白',
    // 紫色背景 + 害怕 emoji
    bgColor: '#B197FC',
    emojiChar: '😨'
  }
];

// 打乱数组
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 生成题目：给出一种情绪，从4个选项中选择正确的
function generateQuestions(count: number) {
  return shuffleArray(EMOTIONS).slice(0, count).map(emotion => {
    // 生成3个干扰选项
    const otherEmotions = EMOTIONS.filter(e => e.id !== emotion.id);
    const wrongOptions = shuffleArray(otherEmotions).slice(0, 3);
    const options = shuffleArray([emotion, ...wrongOptions]);
    
    return {
      targetEmotion: emotion,
      options: options.map(e => ({ id: e.id, name: e.name, emojiChar: e.emojiChar, bgColor: e.bgColor }))
    };
  });
}

const EmotionGuess = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState(() => generateQuestions(8));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentQuestion];

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 朗读题目
  useEffect(() => {
    if (question && !showResult) {
      setTimeout(() => {
        speakText(`${question.targetEmotion.description}，这是什么表情？`);
      }, 300);
    }
  }, [currentQuestion, showResult, question]);

  // 选择选项
  const handleSelect = useCallback((optionId: string) => {
    if (showResult) return;
    
    setSelectedOption(optionId);
    setShowResult(true);
    
    const correct = optionId === question.targetEmotion.id;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      speakText("太棒了！你真厉害！");
    } else {
      speakText(`没关系，正确答案是${question.targetEmotion.name}。${question.targetEmotion.description}`);
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

  // 重新开始
  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setQuestions(generateQuestions(8));
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
              {/* Emotion Card - Emoji Style */}
              <motion.div
                key={currentQuestion}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-56 h-56 rounded-full flex items-center justify-center shadow-2xl border-8 border-white"
                style={{ backgroundColor: question.targetEmotion.bgColor }}
              >
                <span className="text-8xl">{question.targetEmotion.emojiChar}</span>
              </motion.div>

              {/* Question */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">这是什么表情？</h2>
                <p className="text-sm text-slate-400">
                  {question.targetEmotion.description}
                </p>
              </div>

              {/* Options - 2x2 Grid */}
              <div className="w-full grid grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === option.id;
                  const isThisCorrect = option.id === question.targetEmotion.id;
                  const optionEmotion = EMOTIONS.find(e => e.id === option.id);
                  
                  let bgClass = 'bg-white border-2 border-slate-200';
                  let textClass = 'text-slate-800';
                  
                  if (showResult) {
                    if (isThisCorrect) {
                      bgClass = 'bg-emerald-100 border-2 border-emerald-400';
                      textClass = 'text-emerald-700';
                    } else if (isSelected) {
                      bgClass = 'bg-rose-100 border-2 border-rose-400';
                      textClass = 'text-rose-700';
                    } else {
                      bgClass = 'bg-slate-50 border-2 border-slate-100';
                      textClass = 'text-slate-400';
                    }
                  }

                  return (
                    <motion.button
                      key={`${currentQuestion}-${option.id}`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(option.id)}
                      disabled={showResult}
                      className={cn(
                        "relative p-4 rounded-2xl transition-all flex flex-col items-center gap-2",
                        bgClass,
                        !showResult && "hover:border-purple-300 hover:bg-purple-50"
                      )}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                        style={{ backgroundColor: optionEmotion?.bgColor || '#f0f0f0' }}
                      >
                        <span className="text-4xl">{optionEmotion?.emojiChar}</span>
                      </div>
                      <span className={cn("font-bold text-xl", textClass)}>{option.name}</span>
                      
                      {showResult && isThisCorrect && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={20} className="text-white" />
                        </div>
                      )}
                      {showResult && isSelected && !isThisCorrect && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-400 rounded-full flex items-center justify-center">
                          <XCircle size={20} className="text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
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

            {/* Result breakdown */}
            <div className="flex gap-4 mb-8">
              {EMOTIONS.map(emotion => (
                <div key={emotion.id} className="text-center">
                  <div 
                    className="w-14 h-14 rounded-full shadow-md flex items-center justify-center mb-1 border-2 border-white"
                    style={{ backgroundColor: emotion.bgColor }}
                  >
                    <span className="text-2xl">{emotion.emojiChar}</span>
                  </div>
                  <p className="text-xs text-slate-500">{emotion.name}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-4 w-full max-w-sm">
              <Button
                onClick={handleRestart}
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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw, Mic, Volume2 } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 题目数据
const QUESTIONS_DATA = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop", // 客厅场景
    question: "图片里有几个沙发？",
    answer: "2",
    options: ["1个", "2个", "3个"],
    hint: "沙发是长长的，可以坐很多人的"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop", // 厨房场景
    question: "桌子上有几个苹果？",
    answer: "3",
    options: ["2个", "3个", "4个"],
    hint: "苹果是红红的、圆圆的"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop", // 教室场景
    question: "黑板是什么颜色？",
    answer: "绿色",
    options: ["黑色", "绿色", "蓝色"],
    hint: "黑板虽然叫黑板，但不一定是黑色的哦"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=600&fit=crop", // 公园场景
    question: "天空中有几个气球？",
    answer: "5",
    options: ["3个", "4个", "5个"],
    hint: "气球是彩色的，飘在天上"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop", // 卧室场景
    question: "床是什么颜色的？",
    answer: "白色",
    options: ["白色", "蓝色", "粉色"],
    hint: "床单是白白的、干净的"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop", // 书房场景
    question: "桌子上有几本书？",
    answer: "3",
    options: ["2本", "3本", "4本"],
    hint: "书是长方形的，上面有字"
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

// 生成题目
function generateQuestions(count: number) {
  return shuffleArray(QUESTIONS_DATA).slice(0, count);
}

const InstructionFind = () => {
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

  // 朗读问题
  useEffect(() => {
    if (question && !showResult) {
      setIsSpeaking(true);
      speakText(question.question, () => {}, () => {
        setIsSpeaking(false);
      });
    }
  }, [currentQuestion, showResult, question]);

  // 朗读选项
  const handleSpeakQuestion = () => {
    setIsSpeaking(true);
    speakText(question.question, () => {}, () => {
      setIsSpeaking(false);
    });
  };

  // 选择选项
  const handleSelect = useCallback((option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    setShowResult(true);
    
    const correct = option === question.answer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      setIsSpeaking(true);
      speakText("太棒了！你真厉害！", () => {}, () => {
        setIsSpeaking(false);
      });
    } else {
      setIsSpeaking(true);
      speakText(`没关系，正确答案是${question.answer}。${question.hint}`, () => {}, () => {
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

  // 重新开始
  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setQuestions(generateQuestions(6));
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
  }, []);

  return (
    <MobileShell className="bg-gradient-to-b from-teal-50 to-white">
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
                <span className="text-sm font-bold text-teal-600">指令寻物</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{currentQuestion + 1}/{questions.length}</span>
                  <span className="text-xs text-amber-500 font-medium">得分: {score}</span>
                </div>
              </div>
              <button
                onClick={handleSpeakQuestion}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                  isSpeaking
                    ? "bg-teal-100 border-teal-300 text-teal-400"
                    : "bg-white border-teal-200 text-teal-500 hover:bg-teal-50"
                )}
              >
                <Volume2 size={22} className={isSpeaking ? 'animate-pulse' : ''} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6 mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                />
              </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
              {/* Scene Image */}
              <motion.div
                key={currentQuestion}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-full aspect-[4/3] rounded-[30px] overflow-hidden shadow-2xl shadow-teal-200 border-4 border-white bg-white"
              >
                <img
                  src={question.image}
                  alt="场景"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Question */}
              <div className={cn(
                "w-full rounded-2xl p-4 text-center",
                showResult 
                  ? isCorrect 
                    ? "bg-emerald-50 border-2 border-emerald-200" 
                    : "bg-amber-50 border-2 border-amber-200"
                  : "bg-teal-50 border-2 border-teal-200"
              )}>
                <p className={cn(
                  "text-xl font-bold",
                  showResult 
                    ? isCorrect ? "text-emerald-700" : "text-amber-700"
                    : "text-teal-700"
                )}>
                  {showResult && (
                    <span className="mr-2">{isCorrect ? '✓ 正确！' : '✗ '}</span>
                  )}
                  {question.question}
                </p>
              </div>

              {/* Options */}
              <div className="w-full flex flex-col gap-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isThisCorrect = option === question.answer;
                  
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
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(option)}
                      disabled={showResult}
                      className={cn(
                        "relative p-4 rounded-2xl transition-all text-center",
                        bgClass,
                        !showResult && "hover:border-teal-300 hover:bg-teal-50"
                      )}
                    >
                      <span className={cn("text-lg font-bold", textClass)}>{option}</span>
                      
                      {showResult && isThisCorrect && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                      )}
                      {showResult && isSelected && !isThisCorrect && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4">
                          <XCircle size={24} className="text-rose-500" />
                        </div>
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
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center w-full"
                  >
                    <p className="text-sm text-amber-700">
                      <span className="font-bold">提示：</span>
                      {question.hint}
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
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-teal-200"
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
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center shadow-lg">
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
            <div className="space-y-4 w-full max-w-sm">
              <Button
                onClick={handleRestart}
                className="w-full h-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl gap-2 border-none hover:opacity-90 shadow-lg shadow-teal-200"
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

export default InstructionFind;

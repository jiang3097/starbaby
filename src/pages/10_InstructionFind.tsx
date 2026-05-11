import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw, Volume2, SkipForward } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText } from '../lib/useSpeech';
import CelebrationEffect from '../components/CelebrationEffect';
import ToyRewardEffect from '../components/ToyRewardEffect';
import { useApp } from '../context/AppContext';
import { useUser } from '../context/UserContext';

// 图片资源
const IMAGE_1 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F25-220Z514302MZ.jpg&nonce=3d40f70e-bfc3-4cc5-9779-d0c9d0bf3800&project_id=7635954527711035402&sign=9703c46a636c287f91ac2d7508e073ca120f417e8326c031fe39eedab840c60f';
const IMAGE_2 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F30a08ffa56107c7116368a3716904916.jpg&nonce=e2f2379a-77fd-4d67-9c60-d90c6d99d244&project_id=7635954527711035402&sign=3e824fe1feff1353dc69c69fa7cde7697bf92fe088fe1bb88906285c8390c1bf';
const IMAGE_3 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F32639801_175118509109_2.jpg&nonce=162ba9de-2f21-4e83-805d-dfd639802370&project_id=7635954527711035402&sign=ded0db30efcfc3224c1d1895d95b09563bc1b22723e0f6d6b85fe8701e17d638';
const IMAGE_4 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F1607711065848_24b691cf.jpg&nonce=3e432d12-a503-44b2-a83e-e742d41a3ca9&project_id=7635954527711035402&sign=299339eb5392a325ed26e50b93faea98f080063af2cc5ceed71abb9e4a86572c';

// 题目数据 - 4张图片，每张3个问题
const QUESTIONS_DATA = [
  // 图片1: 客厅场景
  {
    id: 1,
    image: IMAGE_1,
    scene: "客厅场景",
    question: "图中窗户是什么颜色的？",
    answer: "白色",
    options: ["白色", "红色", "蓝色"],
    hint: "窗户是干干净净的白色哦"
  },
  {
    id: 2,
    image: IMAGE_1,
    scene: "客厅场景",
    question: "电视旁边的台灯灯罩是什么颜色？",
    answer: "粉色",
    options: ["蓝色", "粉色", "黄色"],
    hint: "台灯是放在电视旁边的，灯罩是粉粉的颜色"
  },
  {
    id: 3,
    image: IMAGE_1,
    scene: "客厅场景",
    question: "墙上的装饰画是什么图案？",
    answer: "叶子",
    options: ["花朵", "叶子", "星星"],
    hint: "装饰画是挂在墙上的，上面有绿色的叶子图案"
  },
  // 图片2: 公园场景
  {
    id: 4,
    image: IMAGE_2,
    scene: "公园场景",
    question: "公园里的喷泉是什么颜色？",
    answer: "蓝色",
    options: ["蓝色", "白色", "灰色"],
    hint: "喷泉是蓝色的，在公园中间"
  },
  {
    id: 5,
    image: IMAGE_2,
    scene: "公园场景",
    question: "有几个人在跑步？",
    answer: "2个",
    options: ["1个", "2个", "3个"],
    hint: "仔细数一数，有两个人在跑步"
  },
  {
    id: 6,
    image: IMAGE_2,
    scene: "公园场景",
    question: "图中牵狗的两个人，他们的狗分别是什么颜色？",
    answer: "白和黄",
    options: ["白和黄", "白和黑", "黄和黑"],
    hint: "有两只狗，一只白色的，一只黄色的"
  },
  // 图片3: 田野场景
  {
    id: 7,
    image: IMAGE_3,
    scene: "田野场景",
    question: "天空的主要颜色是什么？",
    answer: "蓝色",
    options: ["蓝色", "绿色", "黄色"],
    hint: "天空是蓝蓝的，很美丽"
  },
  {
    id: 8,
    image: IMAGE_3,
    scene: "田野场景",
    question: "田野里的小路旁边是什么？",
    answer: "小河",
    options: ["小河", "公路", "草地"],
    hint: "小路旁边有一条弯弯的小河"
  },
  {
    id: 9,
    image: IMAGE_3,
    scene: "田野场景",
    question: "图中人物戴的帽子是什么形状？",
    answer: "圆形",
    options: ["圆形", "斗笠形", "方形"],
    hint: "帽子是圆圆的，像小碗一样的形状"
  },
  // 图片4: 小狗场景
  {
    id: 10,
    image: IMAGE_4,
    scene: "小狗场景",
    question: "小狗的房子屋顶是什么颜色？",
    answer: "红色",
    options: ["红色", "棕色", "蓝色"],
    hint: "小狗的房子屋顶是红红的颜色"
  },
  {
    id: 11,
    image: IMAGE_4,
    scene: "小狗场景",
    question: "小狗旁边的狗粮袋子是什么颜色？",
    answer: "蓝色",
    options: ["蓝色", "绿色", "粉色"],
    hint: "狗粮袋子是蓝色的，上面有狗的图案"
  },
  {
    id: 12,
    image: IMAGE_4,
    scene: "小狗场景",
    question: "小狗的耳朵是什么颜色？",
    answer: "黑色",
    options: ["黑色", "白色", "棕色"],
    hint: "小狗的耳朵是黑黑的"
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

const InstructionFind = () => {
  const navigate = useNavigate();
  const { startTraining, incrementGamePass, incrementTrainingGame } = useApp();
  const { checkAndAddToy } = useUser();
  const hasStartedTraining = useRef(false);
  const hasGivenReward = useRef(false);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // 按顺序出题，不打乱
  const [questions] = useState(() => [...QUESTIONS_DATA]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showToyReward, setShowToyReward] = useState(false);
  const [toyEmoji, setToyEmoji] = useState('');
  const [totalCorrect, setTotalCorrect] = useState(0);

  const question = questions[currentQuestion];

  // 预加载语音和图片
  useEffect(() => {
    
    [IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 进入页面时开始训练计时（只执行一次）
  useEffect(() => {
    let mounted = true;
    if (!hasStartedTraining.current && mounted) {
      hasStartedTraining.current = true;
      startTraining();
    }
    return () => {
      mounted = false;
    };
  }, []); // 空依赖，确保只执行一次

  // 游戏完成时增加统计和奖励道具
  useEffect(() => {
    if (isFinished && !hasGivenReward.current) {
      hasGivenReward.current = true;
      incrementTrainingGame();
      // 检查是否获得新玩具（根据累计答对题数判断）
      const newToy = checkAndAddToy(totalCorrect);
      if (newToy) {
        setToyEmoji(newToy);
        setTimeout(() => setShowToyReward(true), 300);
      }
    }
  }, [isFinished, totalCorrect]);

  // 朗读问题
  useEffect(() => {
    if (question && !showResult) {
      setIsSpeaking(true);
      speakText(question.question).then(() => setIsSpeaking(false)).catch(() => setIsSpeaking(false));
    }
  }, [currentQuestion, showResult, question]);

  // 朗读题目和选项
  const handleSpeakQuestion = () => {
    setIsSpeaking(true);
    const optionLabels = ['A', 'B', 'C'];
    const optionsText = question.options.map((o, i) => `${optionLabels[i]}、${o}`).join('，');
    speakText(`${question.question}。选项：${optionsText}`).then(() => setIsSpeaking(false)).catch(() => setIsSpeaking(false));
  };

  // 朗读题目时自动播报选项
  useEffect(() => {
    if (question && !showResult) {
      setTimeout(() => {
        handleSpeakQuestion();
      }, 300);
    }
  }, [currentQuestion, showResult, question]);

  // 选择选项
  const handleSelect = useCallback((option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    setShowResult(true);
    
    const correct = option === question.answer;
    setIsCorrect(correct);
    
    // 播报选中的选项
    const selectedText = `你选择了${option}`;
    
    if (correct) {
      setScore(prev => prev + 1);
      setTotalCorrect(prev => prev + 1); // 累计答对+1
      setShowCelebration(true);
      // 统计：趣味闯关+1
      incrementGamePass();
      setIsSpeaking(true);
      // 随机鼓励语
      const encouragements = ['太棒了！', '你真厉害！', '回答正确！', '太聪明了！'];
      const randomEnc = encouragements[Math.floor(Math.random() * encouragements.length)];
      speakText(`${selectedText}，${randomEnc}`).then(() => setIsSpeaking(false)).catch(() => setIsSpeaking(false));
    } else {
      setIsSpeaking(true);
      speakText(`${selectedText}，正确答案是${question.answer}。${question.hint}`).then(() => setIsSpeaking(false)).catch(() => setIsSpeaking(false));
    }
  }, [question, showResult, incrementGamePass]);

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

  // 跳过当前题
  const handleSkip = useCallback(() => {
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
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
  }, []);

  return (
    <MobileShell className="bg-gradient-to-b from-teal-50 to-white">
      {/* 鼓励特效 */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      {/* 玩具奖励特效 */}
      <ToyRewardEffect
        show={showToyReward}
        toyEmoji={toyEmoji}
        onClose={() => setShowToyReward(false)}
      />
      
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
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleSkip}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:bg-teal-50 hover:text-teal-500 transition-colors"
                >
                  <SkipForward size={22} />
                </button>
              </div>
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
                className="w-full max-w-md aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl shadow-teal-200 border-4 border-white bg-slate-100 flex items-center justify-center"
              >
                <img
                  src={question.image}
                  alt="场景"
                  className="w-full h-full object-contain object-top"
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

            {/* Answer Sheet */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 w-full max-w-sm">
              <p className="text-sm font-bold text-slate-600 mb-2">参考答案：</p>
              <p className="text-xs text-slate-500">1.A 2.B 3.B 4.A 5.B 6.A</p>
              <p className="text-xs text-slate-500">7.A 8.A 9.A 10.A 11.A 12.A</p>
            </div>

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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 图片资源
const IMAGE_1 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F30162727_104051221105_2.jpg&nonce=97a0a95d-6abb-4b88-8cbb-ea056436771e&project_id=7635954527711035402&sign=339f7c0cbe803d4d9acc8047e122c9969329df7d31bf9ff140fb29541c58a7a0';
const IMAGE_2 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F24585447_145340404104_2.jpg&nonce=4dcf096c-1be5-4b48-b1de-e5b5876220d9&project_id=7635954527711035402&sign=a145e6e5b87923ff31d0a1a36cbf422a002fc61ce2afec538e143aec5d1758e6';

// 四种基本情绪
const EMOTIONS = [
  { id: 'happy', name: '开心', description: '眉毛弯弯，眼睛眯成月牙，笑得很开心' },
  { id: 'sad', name: '难过', description: '嘴角下垂，神情难过，有点伤心' },
  { id: 'angry', name: '生气', description: '眉头紧皱，脸颊发红，很不高兴' },
  { id: 'scared', name: '害怕', description: '眼睛睁大，神情惊恐，有点害怕' }
];

// 精细裁剪的表情卡片数据
// 每个表情单独裁剪，只保留脸部区域，不含气泡文字
const EMOTION_CARDS = [
  // 开心 - 图1左上角，裁剪脸部中央
  { 
    id: 'card_1', 
    emotionId: 'happy', 
    image: IMAGE_1,
    // 中心在图片左上1/4区域的中间，精细裁剪脸部
    bgPosition: '22% 32%',  
    bgSize: '130%',
    description: '看看这个小朋友，他的表情是怎样的？'
  },
  // 难过 - 图1右上角
  { 
    id: 'card_2', 
    emotionId: 'sad', 
    image: IMAGE_1,
    // 中心在图片右上1/4区域的中间
    bgPosition: '78% 32%',  
    bgSize: '130%',
    description: '这位小朋友怎么了？你能看出来吗？'
  },
  // 生气 - 图1中下位置
  { 
    id: 'card_3', 
    emotionId: 'angry', 
    image: IMAGE_1,
    // 中心在图片中间偏下
    bgPosition: '50% 72%',  
    bgSize: '140%',
    description: '这个小朋友看起来不太高兴，是什么表情？'
  },
  // 害怕 - 图2左下角
  { 
    id: 'card_4', 
    emotionId: 'scared', 
    image: IMAGE_2,
    // 中心在图片左下1/4区域
    bgPosition: '18% 78%',  
    bgSize: '130%',
    description: '这位小朋友好害怕的样子，是什么情绪？'
  },
  // 开心 - 图2中间
  { 
    id: 'card_5', 
    emotionId: 'happy', 
    image: IMAGE_2,
    bgPosition: '48% 32%',  
    bgSize: '130%',
    description: '看看这张图片，小朋友是什么表情？'
  },
  // 难过 - 图2右侧
  { 
    id: 'card_6', 
    emotionId: 'sad', 
    image: IMAGE_2,
    bgPosition: '78% 78%',  
    bgSize: '130%',
    description: '这个小朋友看起来有点难过，是什么表情？'
  },
  // 生气 - 图2右上
  { 
    id: 'card_7', 
    emotionId: 'angry', 
    image: IMAGE_2,
    bgPosition: '78% 25%',  
    bgSize: '140%',
    description: '这位小朋友皱着眉头，是什么表情？'
  },
  // 害怕 - 图2左侧
  { 
    id: 'card_8', 
    emotionId: 'scared', 
    image: IMAGE_2,
    bgPosition: '18% 28%',  
    bgSize: '130%',
    description: '看看这张图，小朋友好惊恐的样子？'
  },
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
function generateQuestions() {
  const shuffledCards = shuffleArray(EMOTION_CARDS);
  
  return shuffledCards.map(card => {
    const targetEmotion = EMOTIONS.find(e => e.id === card.emotionId)!;
    const otherEmotions = EMOTIONS.filter(e => e.id !== targetEmotion.id);
    const wrongOptions = shuffleArray(otherEmotions).slice(0, 3);
    const options = shuffleArray([targetEmotion, ...wrongOptions]);
    
    return {
      card,
      targetEmotion,
      options: options.map(e => ({ id: e.id, name: e.name }))
    };
  });
}

// 获取情绪对应的颜色
function getEmotionColor(emotionId: string): string {
  const colors: Record<string, string> = {
    happy: '#FFE066',
    sad: '#74C0FC',
    angry: '#FF8787',
    scared: '#B197FC'
  };
  return colors[emotionId] || '#f0f0f0';
}

const EmotionGuess = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState(() => generateQuestions());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentQuestion];

  // 预加载
  useEffect(() => {
    preloadVoices();
    [IMAGE_1, IMAGE_2].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 朗读题目
  useEffect(() => {
    if (question && !showResult) {
      setTimeout(() => {
        speakText(question.card.description);
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
      speakText("太棒了！回答正确！你真厉害！");
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
    setQuestions(generateQuestions());
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
              {/* 精细裁剪的表情卡片 - 方形，圆角 */}
              <motion.div
                key={currentQuestion}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-72 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200"
              >
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${question.card.image})`,
                    backgroundPosition: question.card.bgPosition,
                    backgroundSize: question.card.bgSize,
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </motion.div>

              {/* Question */}
              <div className="text-center px-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">这是什么表情？</h2>
              </div>

              {/* Options - 2x2 Grid */}
              <div className="w-full grid grid-cols-2 gap-4 max-w-sm">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isThisCorrect = option.id === question.targetEmotion.id;
                  const bgColor = getEmotionColor(option.id);
                  
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
                        "relative p-4 rounded-2xl transition-all flex items-center gap-3",
                        bgClass,
                        !showResult && "hover:border-purple-300 hover:bg-purple-50"
                      )}
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className="text-lg font-bold text-white">{option.name.charAt(0)}</span>
                      </div>
                      <span className={cn("font-bold text-lg", textClass)}>{option.name}</span>
                      
                      {showResult && isThisCorrect && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 size={18} className="text-white" />
                        </div>
                      )}
                      {showResult && isSelected && !isThisCorrect && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-400 rounded-full flex items-center justify-center shadow-lg">
                          <XCircle size={18} className="text-white" />
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
            <p className="text-sm text-amber-500 mb-8">获得 {score} 颗星星奖励</p>

            {/* Result breakdown */}
            <div className="flex gap-4 mb-8">
              {EMOTIONS.map(emotion => (
                <div key={emotion.id} className="text-center">
                  <div 
                    className="w-14 h-14 rounded-full shadow-md flex items-center justify-center mb-1 border-2 border-white"
                    style={{ backgroundColor: getEmotionColor(emotion.id) }}
                  >
                    <span className="text-lg font-bold text-white">{emotion.name}</span>
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

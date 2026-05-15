import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Star, RotateCcw, SkipForward } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText } from '../lib/useSpeech';
import CelebrationEffect from '../components/CelebrationEffect';
import ToyRewardEffect from '../components/ToyRewardEffect';
import { useApp } from '../context/AppContext';
import { useUser } from '../context/UserContext';

// 8张表情图片
const IMAGE_1 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201524.png&nonce=3f68cfce-dd09-4065-9953-be96ea2bc305&project_id=7635954527711035402&sign=c03ab686b2c95964f0c974b9fec78ead09a927a3f354f7a88056b902366dbf56';
const IMAGE_2 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201529.png&nonce=e0bd5fe9-d15a-450d-9b57-a8351a2ada27&project_id=7635954527711035402&sign=9a7652e1fab3f290cf6b2ae63c93ccf3acf959e4a9a3af436c1333b6f7359f12';
const IMAGE_3 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201533.png&nonce=0b81d9de-4787-4388-afb3-87ff908d4ed4&project_id=7635954527711035402&sign=f4b471875f1917a29c8243e5ed19e5aaf8055342f37f5e99a43618fca1c6bb3a';
const IMAGE_4 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201538.png&nonce=b6880c50-bdb3-45e9-9ae0-eefa254d98fe&project_id=7635954527711035402&sign=c28a56efafd2f0e15a92dca456a954294770244077ed2805b6712d17533f9c0a';
const IMAGE_5 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201542.png&nonce=2ac0f356-b7f6-46ef-b6d9-4d7025d73764&project_id=7635954527711035402&sign=6d1bd45efe3ecb27308e3ee4f1d7f8fc1886e38323fb12f0a2ff359f52b9c852';
const IMAGE_6 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201609.png&nonce=b64d3af7-519e-43bf-98a1-cde09e8d60ab&project_id=7635954527711035402&sign=ba39dce9d091c038cc55fe919acca5935e355a01858473c6e7551c4bc7a96c10';
const IMAGE_7 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201613.png&nonce=3c363642-322a-4f0c-aab7-5ff93d143a7c&project_id=7635954527711035402&sign=84c119f0f6151bb01c938df0a1e1768b12db239d8bc5e357c10aabfb05d04773';
const IMAGE_8 = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-04+201620.png&nonce=c8b16280-38ff-422f-8362-75e62fe47a5a&project_id=7635954527711035402&sign=ceebbbaf200c3f0810cdc220b90e6aa065fe260ccc3e93564c981fda6e98d495';

// 题目数据
const QUESTIONS_DATA = [
  // 基础难度
  {
    id: 1,
    image: IMAGE_1,
    difficulty: '基础',
    question: '图中男生的核心情绪是？',
    answer: 'B',
    options: [
      { id: 'A', name: '惊讶' },
      { id: 'B', name: '开心' },
      { id: 'C', name: '愤怒' },
      { id: 'D', name: '难过' }
    ],
    hint: '看他的眼睛和嘴巴'
  },
  {
    id: 2,
    image: IMAGE_2,
    difficulty: '基础',
    question: '图中女生的情绪最接近？',
    answer: 'A',
    options: [
      { id: 'A', name: '大笑愉悦' },
      { id: 'B', name: '无奈' },
      { id: 'C', name: '生气' },
      { id: 'D', name: '委屈' }
    ],
    hint: '她在开心地笑'
  },
  {
    id: 3,
    image: IMAGE_3,
    difficulty: '基础',
    question: '图中男生的表情传递的情绪是？',
    answer: 'B',
    options: [
      { id: 'A', name: '平静' },
      { id: 'B', name: '愤怒/不满' },
      { id: 'C', name: '开心' },
      { id: 'D', name: '难过' }
    ],
    hint: '他的眉毛和嘴巴说明了什么'
  },
  {
    id: 4,
    image: IMAGE_4,
    difficulty: '基础',
    question: '图中女生的表情属于？',
    answer: 'B',
    options: [
      { id: 'A', name: '大笑' },
      { id: 'B', name: '平静无表情' },
      { id: 'C', name: '生气' },
      { id: 'D', name: '难过' }
    ],
    hint: '她的表情很平淡'
  },
  // 进阶难度
  {
    id: 5,
    image: IMAGE_5,
    difficulty: '进阶',
    question: '图中男生的表情细节是眉头微蹙、嘴角下撇，他的情绪是？',
    answer: 'B',
    options: [
      { id: 'A', name: '单纯生气' },
      { id: 'B', name: '委屈难过' },
      { id: 'C', name: '惊讶' },
      { id: 'D', name: '开心' }
    ],
    hint: '委屈和单纯生气不一样哦'
  },
  {
    id: 6,
    image: IMAGE_6,
    difficulty: '进阶',
    question: '图中女生的表情是嘴角微扬、眼神柔和，她的情绪更偏向？',
    answer: 'C',
    options: [
      { id: 'A', name: '大笑狂喜' },
      { id: 'B', name: '温和满足' },
      { id: 'C', name: '俏皮满足' },
      { id: 'D', name: '难过' }
    ],
    hint: '她是俏皮地笑了'
  },
  // 挑战难度
  {
    id: 7,
    image: IMAGE_7,
    difficulty: '挑战',
    question: '图中男生的眼睛为"×"形、嘴巴大张，这个表情在卡通语境中代表？',
    answer: 'B',
    options: [
      { id: 'A', name: '打哈欠犯困' },
      { id: 'B', name: '晕倒/失去意识' },
      { id: 'C', name: '大喊大叫' },
      { id: 'D', name: '惊讶' }
    ],
    hint: '在卡通里×眼睛通常表示失去意识'
  },
  {
    id: 8,
    image: IMAGE_8,
    difficulty: '挑战',
    question: '对比女生的大笑表情，这个表情眉头轻皱、嘴角下撇，她的情绪是？',
    answer: 'B',
    options: [
      { id: 'A', name: '单纯平静' },
      { id: 'B', name: '难过/失落' },
      { id: 'C', name: '开心大笑' },
      { id: 'D', name: '生气' }
    ],
    hint: '和大笑完全相反的情绪'
  }
];

const EmotionGuess = () => {
  const navigate = useNavigate();
  const { startTraining, incrementGamePass, incrementTrainingGame } = useApp();
  const { checkAndAddToy, addToy, profile } = useUser();
  const hasStartedTraining = useRef(false);
  const hasGivenReward = useRef(false); // 防止重复奖励
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions] = useState(() => [...QUESTIONS_DATA]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showToyReward, setShowToyReward] = useState(false);
  const [toyEmoji, setToyEmoji] = useState('');
  const [totalCorrect, setTotalCorrect] = useState(0); // 累计答对题数

  const question = questions[currentQuestion];

  // 预加载
  useEffect(() => {
    
    QUESTIONS_DATA.forEach(q => {
      const img = new Image();
      img.src = q.image;
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
      // 基于 profile.toys 判断是否应该给玩具（避免刷新后重复给）
      const expectedToys = Math.floor(totalCorrect / 4);
      if (expectedToys > profile.toys) {
        const toy = addToy();
        if (toy) {
          setToyEmoji(toy);
          setTimeout(() => setShowToyReward(true), 300);
        }
      }
    }
  }, [isFinished, totalCorrect]);

  // 朗读题目
  useEffect(() => {
    if (question && !showResult) {
      setTimeout(() => {
        // 朗读题目和选项
        const optionsText = question.options.map(o => `${o.id}、${o.name}`).join('，');
        speakText(`${question.question}。选项：${optionsText}`);
      }, 300);
    }
  }, [currentQuestion, showResult, question]);

  // 选择选项
  const handleSelect = useCallback((optionId: string) => {
    if (showResult) return;
    
    setSelectedOption(optionId);
    setShowResult(true);
    
    const correct = optionId === question.answer;
    setIsCorrect(correct);
    
    // 播报选中的选项
    const selectedOptionObj = question.options.find(o => o.id === optionId);
    const selectedText = `你选择了${selectedOptionObj?.name}`;
    
    if (correct) {
      setScore(prev => prev + 1);
      setTotalCorrect(prev => prev + 1); // 累计答对+1
      setShowCelebration(true);
      // 统计：趣味闯关+1
      incrementGamePass();
      // 播报鼓励内容
      const encouragements = ['太棒了！', '你真厉害！', '回答正确！', '太聪明了！'];
      const randomEnc = encouragements[Math.floor(Math.random() * encouragements.length)];
      speakText(`${selectedText}，${randomEnc}`);
    } else {
      const correctOption = question.options.find(o => o.id === question.answer);
      speakText(`${selectedText}，正确答案是${correctOption?.name}。${question.hint}`);
    }
  }, [question, showResult, incrementGamePass]);

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
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
  }, []);

  return (
    <MobileShell className="bg-gradient-to-b from-purple-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-200"
            style={{ left: `${8 + i * 12}%`, top: `${5 + (i % 4) * 6}%` }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2.5 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
        <motion.div
          animate={{ x: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
          className="absolute top-20 right-10 text-4xl opacity-30"
        >
          😊
        </motion.div>
      </div>

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
            className="h-full flex flex-col relative"
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-3 flex items-center justify-end">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-purple-600">表情猜猜看</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{currentQuestion + 1}/{questions.length}</span>
                  <span className="text-xs text-amber-500 font-medium">得分: {score}</span>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:bg-purple-50 hover:text-purple-500 transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                />
              </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 px-4 pb-4 flex flex-col items-center justify-center gap-3">
              {/* 难度标签 */}
              <div className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold",
                question.difficulty === '基础' && "bg-emerald-100 text-emerald-600",
                question.difficulty === '进阶' && "bg-amber-100 text-amber-600",
                question.difficulty === '挑战' && "bg-rose-100 text-rose-600"
              )}>
                {question.difficulty}难度
              </div>

              {/* 表情图片 */}
              <motion.div
                key={currentQuestion}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-48 h-48 rounded-xl overflow-hidden shadow-xl border-2 border-white bg-slate-100 flex items-center justify-center"
              >
                <img
                  src={question.image}
                  alt="表情"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Question */}
              <div className="text-center px-4">
                <h2 className="text-xl font-bold text-slate-800">{question.question}</h2>
              </div>

              {/* Options - 2x2 Grid */}
              <div className="w-full grid grid-cols-2 gap-2 max-w-xs">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isThisCorrect = option.id === question.answer;
                  
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
                        "relative p-2 rounded-lg transition-all text-center",
                        bgClass,
                        !showResult && "hover:border-purple-300 hover:bg-purple-50"
                      )}
                    >
                      <span className={cn("text-base font-bold", textClass)}>
                        {option.id}. {option.name}
                      </span>
                      
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

              {/* Hint after wrong answer */}
              <AnimatePresence>
                {showResult && !isCorrect && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center w-full max-w-sm"
                  >
                    <p className="text-sm text-amber-700">
                      <span className="font-bold">提示：</span>{question.hint}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next Button */}
            <div className="p-4 pb-6">
              <Button
                onClick={handleNext}
                disabled={!showResult}
                className={cn(
                  "w-full h-14 rounded-full font-bold text-lg gap-2 border-none",
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
              {score >= 7 ? "太厉害了！" : score >= 5 ? "很不错！" : "继续加油！"}
            </h1>
            <p className="text-xl text-slate-500 mb-2">你答对了 {score}/{questions.length} 题</p>
            <p className="text-sm text-amber-500 mb-8">获得 {score} 颗星星</p>

            {/* Difficulty legend */}
            <div className="flex gap-4 mb-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-1 mx-auto">
                  <span className="text-sm">基</span>
                </div>
                <p className="text-xs text-slate-500">基础</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-1 mx-auto">
                  <span className="text-sm">进</span>
                </div>
                <p className="text-xs text-slate-500">进阶</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-1 mx-auto">
                  <span className="text-sm">挑</span>
                </div>
                <p className="text-xs text-slate-500">挑战</p>
              </div>
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

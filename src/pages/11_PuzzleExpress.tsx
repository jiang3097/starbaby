import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 4张拼图图片
const PUZZLE_IMAGES = [
  {
    id: 1,
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F1b222b499971.jpg&nonce=672e2d97-a267-4f9f-b47a-0a6969c4fbe9&project_id=7635954527711035402&sign=5ebc1b269169f8f976f69850c587553c1413dd3392a937571e74bdb3ae7041a8',
  },
  {
    id: 2,
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F3086.jpg_wh860.jpg&nonce=f19a274a-6127-4a6e-90ad-fd162db5d644&project_id=7635954527711035402&sign=6fec602d76b304354e8aeefdd9ba907504e88ffc9559e47f4ffc4ffc171180fd',
  },
  {
    id: 3,
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F20200407135902_tlC2r.jpeg&nonce=76f404e2-d4e8-496c-aa11-ae146a5bb370&project_id=7635954527711035402&sign=d1edc985d10c7a2ea5678303b6b3f456f83a62e0d98753131664b0f4ad8f6bfb',
  },
  {
    id: 4,
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2Fu%3D3694985207%2C1529845521%26fm%3D253%26gp%3D0.jpg&nonce=80047a34-fd68-45fd-a0c4-74001c56efe3&project_id=7635954527711035402&sign=a88f6c158ad9816a6696e73130ed52035932e34c6f0b833e7c1cc08761c423c6',
  },
];

// 打乱碎片顺序
function shufflePieces(): number[] {
  const pieces = [1, 2, 3, 4];
  // Fisher-Yates 洗牌
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

const PuzzleExpress = () => {
  const navigate = useNavigate();
  
  // 游戏状态
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [shuffledPieces, setShuffledPieces] = useState<number[]>(() => shufflePieces());
  const [completedPieces, setCompletedPieces] = useState<number[]>([]);
  const [expectedPiece, setExpectedPiece] = useState(1); // 期望点击的碎片序号
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // 预加载语音
  useEffect(() => {
    preloadVoices();
    // 预加载图片
    PUZZLE_IMAGES.forEach(img => {
      const image = new Image();
      image.src = img.url;
    });
  }, []);

  // 开始游戏
  const startGame = useCallback((image?: typeof PUZZLE_IMAGES[0]) => {
    if (image) setCurrentImage(image);
    setShuffledPieces(shufflePieces());
    setCompletedPieces([]);
    setExpectedPiece(1);
    setShowError(false);
    setShowSuccess(false);
    setGameStarted(true);
    speakText('拼图开始！请按顺序点击图片，按1、2、3、4的顺序哦！');
  }, []);

  // 点击碎片
  const handlePieceClick = useCallback((pieceNumber: number) => {
    if (showSuccess) return;
    if (completedPieces.includes(pieceNumber)) return;

    if (pieceNumber === expectedPiece) {
      // 正确
      setCompletedPieces(prev => [...prev, pieceNumber]);
      setExpectedPiece(prev => prev + 1);
      setShowError(false);

      // 检查是否全部完成
      if (expectedPiece === 4) {
        setShowSuccess(true);
        speakText('通关啦！真棒！你太厉害了！');
      } else {
        speakText('正确！');
      }
    } else {
      // 错误
      setShowError(true);
      speakText('再试试看哦！');
      setTimeout(() => setShowError(false), 1000);
    }
  }, [expectedPiece, completedPieces, showSuccess]);

  // 下一张图片
  const handleNextImage = useCallback(() => {
    const currentIndex = PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id);
    const nextIndex = (currentIndex + 1) % PUZZLE_IMAGES.length;
    const nextImage = PUZZLE_IMAGES[nextIndex];
    setCurrentImage(nextImage);
    setShuffledPieces(shufflePieces());
    setCompletedPieces([]);
    setExpectedPiece(1);
    setShowError(false);
    setShowSuccess(false);
    speakText('下一关！请按顺序点击图片！');
  }, [currentImage]);

  // 获取碎片位置样式
  const getPieceStyle = (index: number) => {
    const positions = [
      { left: '0%', top: '0%' },    // 左上
      { left: '50%', top: '0%' },   // 右上
      { left: '0%', top: '50%' },   // 左下
      { left: '50%', top: '50%' },  // 右下
    ];
    return positions[index];
  };

  return (
    <MobileShell className="bg-gradient-to-b from-orange-50 to-white">
      <AnimatePresence mode="wait">
        {/* ========== 开始界面 ========== */}
        {!gameStarted && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-6 pt-4 flex items-center justify-between">
              <button
                onClick={() => navigate('/training')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <span className="text-sm font-bold text-orange-600">拼图表达</span>
              <div className="w-12" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {/* Title */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-40 h-40 bg-gradient-to-br from-orange-200 to-amber-300 rounded-full flex items-center justify-center shadow-xl mb-8"
              >
                <span className="text-6xl">🧩</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-slate-800 mb-2">拼图表达</h1>
              <p className="text-lg text-slate-500 mb-8">按顺序点击图片，1→2→3→4</p>

              {/* 图片预览 */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {PUZZLE_IMAGES.map(img => (
                  <div key={img.id} className="w-20 h-20 rounded-xl overflow-hidden shadow-md border-2 border-white">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => startGame(PUZZLE_IMAGES[0])}
                className="w-full max-w-xs h-16 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold text-xl shadow-lg shadow-orange-200 border-none"
              >
                开始游戏
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========== 游戏界面 ========== */}
        {gameStarted && !showSuccess && (
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
                onClick={() => setGameStarted(false)}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-orange-600">拼图表达</span>
                <span className="text-xs text-slate-400">
                  第 {PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id) + 1}/4 关
                </span>
              </div>
              <button
                onClick={() => startGame(currentImage)}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-400 shadow-sm"
              >
                <RotateCcw size={22} />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map(num => (
                  <div
                    key={num}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all",
                      completedPieces.includes(num)
                        ? "bg-emerald-400 text-white"
                        : num === expectedPiece
                          ? "bg-orange-400 text-white animate-pulse"
                          : "bg-slate-200 text-slate-400"
                    )}
                  >
                    {completedPieces.includes(num) ? <CheckCircle2 size={24} /> : num}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
              {/* 提示文字 */}
              <div className="bg-orange-100 rounded-full px-6 py-2">
                <p className="text-orange-600 font-bold">
                  请点击 <span className="text-2xl text-orange-500">{expectedPiece}</span> 号图片
                </p>
              </div>

              {/* 错误提示 */}
              <AnimatePresence>
                {showError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-rose-100 border-2 border-rose-300 rounded-full px-6 py-2"
                  >
                    <p className="text-rose-600 font-bold">再试试看哦！</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 打乱的碎片 - 2x2 网格 */}
              <div className="relative w-72 h-72 bg-slate-100 rounded-3xl shadow-xl overflow-hidden border-4 border-white">
                {shuffledPieces.map((pieceNumber, index) => {
                  const isCompleted = completedPieces.includes(pieceNumber);
                  const pos = getPieceStyle(index);
                  
                  return (
                    <motion.div
                      key={index}
                      whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                      onClick={() => !isCompleted && handlePieceClick(pieceNumber)}
                      className={cn(
                        "absolute w-1/2 h-1/2 transition-all duration-300 overflow-hidden",
                        isCompleted && "opacity-50"
                      )}
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: 'translate(0, 0)',
                      }}
                    >
                      {/* 碎片图片 */}
                      <img
                        src={currentImage.url}
                        alt=""
                        className="w-[200%] h-[200%]"
                        style={{
                          objectPosition: `${pos.left === '0%' ? '0%' : '100%'} ${pos.top === '0%' ? '0%' : '100%'}`,
                          objectFit: 'cover',
                        }}
                      />
                      
                      {/* 碎片边框 */}
                      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" />
                      
                      {/* 序号标签 */}
                      <div className={cn(
                        "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg",
                        isCompleted
                          ? "bg-emerald-400 text-white"
                          : "bg-orange-400 text-white"
                      )}>
                        {pieceNumber}
                      </div>

                      {/* 完成标记 */}
                      {isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <CheckCircle2 size={48} className="text-emerald-400" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* 底部说明 */}
              <p className="text-sm text-slate-400">按 1 → 2 → 3 → 4 的顺序点击</p>
            </div>
          </motion.div>
        )}

        {/* ========== 成功界面 ========== */}
        {showSuccess && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Trophy */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative mb-8"
            >
              <div className="w-48 h-48 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-2xl">
                <Trophy size={80} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Star size={40} className="text-white" fill="currentColor" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">通关啦！真棒！</h1>
            <p className="text-xl text-slate-500 mb-8">你成功完成了拼图！</p>
            <p className="text-2xl text-amber-500 font-bold mb-12">获得 1 颗星星 ⭐</p>

            {/* 完成的拼图 */}
            <div className="mb-8 w-72 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img src={currentImage.url} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-4 w-full max-w-xs">
              <Button
                onClick={handleNextImage}
                className="w-full h-16 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold text-xl border-none shadow-lg shadow-orange-200"
              >
                下一关
              </Button>
              <Button
                variant="ghost"
                onClick={() => startGame(currentImage)}
                className="w-full h-14 rounded-full text-slate-400 font-bold text-lg"
              >
                再玩一次
              </Button>
              <Button
                variant="ghost"
                onClick={() => setGameStarted(false)}
                className="w-full h-14 rounded-full text-slate-400 font-bold text-lg"
              >
                返回选择图片
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default PuzzleExpress;

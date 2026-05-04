import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Trophy, Star, RotateCcw, X } from 'lucide-react';
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
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

const PuzzleExpress = () => {
  const navigate = useNavigate();
  
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [shuffledPieces, setShuffledPieces] = useState<number[]>(() => shufflePieces());
  const [completedPieces, setCompletedPieces] = useState<number[]>([]);
  const [expectedPiece, setExpectedPiece] = useState(1);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    preloadVoices();
    PUZZLE_IMAGES.forEach(img => {
      const image = new Image();
      image.src = img.url;
    });
  }, []);

  const startGame = useCallback((image?: typeof PUZZLE_IMAGES[0]) => {
    if (image) setCurrentImage(image);
    setShuffledPieces(shufflePieces());
    setCompletedPieces([]);
    setExpectedPiece(1);
    setShowError(false);
    setShowSuccess(false);
    setGameStarted(true);
    speakText('拼图开始！请按顺序点击图片！');
  }, []);

  const handlePieceClick = useCallback((pieceNumber: number) => {
    if (showSuccess) return;
    if (completedPieces.includes(pieceNumber)) return;

    if (pieceNumber === expectedPiece) {
      setCompletedPieces(prev => [...prev, pieceNumber]);
      setExpectedPiece(prev => prev + 1);
      setShowError(false);

      if (expectedPiece === 4) {
        setTimeout(() => {
          setShowSuccess(true);
          speakText('通关啦！真棒！你太厉害了！');
        }, 300);
      } else {
        speakText('正确！');
      }
    } else {
      setShowError(true);
      speakText('再试试看哦！');
      setTimeout(() => setShowError(false), 1000);
    }
  }, [expectedPiece, completedPieces, showSuccess]);

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

  // 获取碎片在原图中的位置
  const getPieceBgPosition = (pieceNumber: number) => {
    const positions: Record<number, { x: string; y: string }> = {
      1: { x: '0%', y: '0%' },      // 左上
      2: { x: '-100%', y: '0%' },   // 右上
      3: { x: '0%', y: '-100%' },   // 左下
      4: { x: '-100%', y: '-100%' }, // 右下
    };
    return positions[pieceNumber];
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
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-40 h-40 bg-gradient-to-br from-orange-200 to-amber-300 rounded-full flex items-center justify-center shadow-xl mb-8"
              >
                <span className="text-6xl">🧩</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-slate-800 mb-2">拼图表达</h1>
              <p className="text-lg text-slate-500 mb-8">按顺序点击碎片，拼出完整图片</p>

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

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
              {/* 参考图 */}
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">参考图</p>
                <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-orange-200">
                  <img src={currentImage.url} alt="参考图" className="w-full h-full object-cover" />
                </div>
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
                    <p className="text-rose-600 font-bold flex items-center gap-2">
                      <X size={18} className="text-rose-500" />
                      再试试看哦！
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 打乱的拼图碎片 - 2x2 */}
              <div className="relative w-72 h-72 bg-slate-100 rounded-3xl shadow-xl overflow-hidden border-4 border-white">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  {shuffledPieces.map((pieceNumber, index) => {
                    const isCompleted = completedPieces.includes(pieceNumber);
                    const pos = getPieceBgPosition(pieceNumber);
                    
                    return (
                      <motion.div
                        key={index}
                        whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                        onClick={() => !isCompleted && handlePieceClick(pieceNumber)}
                        className={cn(
                          "relative overflow-hidden cursor-pointer transition-all duration-300",
                          isCompleted && "opacity-30 pointer-events-none"
                        )}
                      >
                        <img
                          src={currentImage.url}
                          alt=""
                          className="w-[200%] h-[200%]"
                          style={{
                            objectPosition: `${pos.x} ${pos.y}`,
                            objectFit: 'cover',
                            marginLeft: pos.x === '0%' ? '0' : undefined,
                            marginTop: pos.y === '0%' ? '0' : undefined,
                          }}
                        />
                        {/* 边框 */}
                        <div className="absolute inset-0 border border-white/30 pointer-events-none" />
                        
                        {/* 完成标记 */}
                        {isCompleted && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                            <CheckCircle2 size={48} className="text-emerald-400" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* 进度指示 */}
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(num => (
                  <div
                    key={num}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      completedPieces.includes(num)
                        ? "bg-emerald-400 text-white"
                        : num === expectedPiece
                          ? "bg-orange-400 text-white animate-bounce"
                          : "bg-slate-200 text-slate-400"
                    )}
                  >
                    {completedPieces.includes(num) ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <span className="font-bold">{num}</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-400">按正确顺序点击碎片</p>
            </div>
          </motion.div>
        )}

        {/* ========== 成功结算画面 ========== */}
        {showSuccess && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            {/* 动画效果 */}
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
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Star size={40} className="text-white" fill="currentColor" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">通关啦！</h1>
            <p className="text-xl text-slate-500 mb-2">真棒！你太厉害了！</p>
            <p className="text-2xl text-amber-500 font-bold mb-8">获得 1 颗星星 ⭐</p>

            {/* 完成的拼图 */}
            <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white mb-8">
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
                返回选图
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default PuzzleExpress;

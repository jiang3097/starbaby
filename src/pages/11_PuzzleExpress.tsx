import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, Star, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';

// 拼图图片
const PUZZLE_IMAGES = [
  {
    id: 1,
    name: '可爱小熊',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&h=600&fit=crop',
  },
  {
    id: 2,
    name: '彩虹天空',
    url: 'https://images.unsplash.com/photo-1518173946687-a4c036bc6e66?w=600&h=600&fit=crop',
  },
  {
    id: 3,
    name: '森林小屋',
    url: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=600&h=600&fit=crop',
  },
  {
    id: 4,
    name: '海底世界',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop',
  },
];

// 难度配置
type Difficulty = 4 | 9;
const DIFFICULTY_CONFIG: Record<Difficulty, { name: string; cols: number; rows: number }> = {
  4: { name: '简单 (2x2)', cols: 2, rows: 2 },
  9: { name: '困难 (3x3)', cols: 3, rows: 3 },
};

const PuzzleExpress = () => {
  const navigate = useNavigate();
  
  // 游戏状态
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [selectedImage, setSelectedImage] = useState(PUZZLE_IMAGES[0]);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 打乱拼图
  const shufflePieces = useCallback((size: number) => {
    const pieces = Array.from({ length: size }, (_, i) => i);
    // Fisher-Yates 洗牌
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }, []);

  // 开始游戏
  const startGame = useCallback((diff: Difficulty, image?: typeof PUZZLE_IMAGES[0]) => {
    setDifficulty(diff);
    if (image) setSelectedImage(image);
    setPieces(shufflePieces(diff));
    setSelectedPiece(null);
    setMoveCount(0);
    setIsComplete(false);
    setShowHint(false);
    setGameStarted(true);
    speakText('拼图开始！把图片拼完整吧！');
  }, [shufflePieces]);

  // 检查是否完成
  const checkComplete = useCallback((currentPieces: number[], size: number) => {
    return currentPieces.every((piece, index) => piece === index);
  }, []);

  // 选择/交换碎片
  const handlePieceClick = useCallback((index: number) => {
    if (isComplete) return;
    
    if (selectedPiece === null) {
      // 选中碎片
      setSelectedPiece(index);
    } else if (selectedPiece === index) {
      // 取消选中
      setSelectedPiece(null);
    } else {
      // 交换碎片
      const newPieces = [...pieces];
      [newPieces[selectedPiece], newPieces[index]] = [newPieces[index], newPieces[selectedPiece]];
      setPieces(newPieces);
      setMoveCount(prev => prev + 1);
      setSelectedPiece(null);
      
      // 检查是否完成
      if (checkComplete(newPieces, difficulty)) {
        setIsComplete(true);
        speakText('太棒了！拼图完成！你真厉害！');
      }
    }
  }, [selectedPiece, pieces, difficulty, isComplete, checkComplete]);

  // 获取碎片位置
  const getPiecePosition = (index: number, pieceIndex: number) => {
    const row = Math.floor(pieceIndex / config.cols);
    const col = pieceIndex % config.cols;
    return {
      width: `${100 / config.cols}%`,
      height: `${100 / config.rows}%`,
      left: `${col * (100 / config.cols)}%`,
      top: `${row * (100 / config.rows)}%`,
    };
  };

  // 完成后的拼图样式
  const completedStyle = {
    width: 'min(80vw, 80vh)',
    height: 'min(80vw, 80vh)',
    display: 'grid',
    gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
    gridTemplateRows: `repeat(${config.rows}, 1fr)`,
    overflow: 'hidden',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
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
              <p className="text-lg text-slate-500 mb-8">把图片拼完整吧！</p>

              {/* Difficulty Selection */}
              <div className="w-full max-w-sm space-y-4">
                <p className="text-sm text-slate-500 font-medium">选择难度：</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(4)}
                    className="p-6 bg-white rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-colors"
                  >
                    <div className="text-4xl mb-2">🧩</div>
                    <p className="font-bold text-slate-800">简单</p>
                    <p className="text-sm text-slate-400">2 x 2</p>
                    <p className="text-xs text-slate-400">4片拼图</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(9)}
                    className="p-6 bg-white rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-colors"
                  >
                    <div className="text-4xl mb-2">🧩🧩</div>
                    <p className="font-bold text-slate-800">困难</p>
                    <p className="text-sm text-slate-400">3 x 3</p>
                    <p className="text-xs text-slate-400">9片拼图</p>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== 游戏界面 ========== */}
        {gameStarted && !isComplete && (
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
                onClick={() => {
                  setGameStarted(false);
                  setSelectedPiece(null);
                }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-orange-600">拼图表达</span>
                <span className="text-xs text-slate-400">已移动: {moveCount} 步</span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                  showHint 
                    ? "bg-orange-100 border-orange-300 text-orange-500" 
                    : "bg-white border-orange-100 text-orange-300 hover:border-orange-200"
                )}
              >
                <span className="text-lg">👀</span>
              </button>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {/* Reference Image (hint) */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-4 p-2 bg-white rounded-xl shadow-lg border-2 border-orange-200"
                  >
                    <img 
                      src={selectedImage.url} 
                      alt="参考图片" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <p className="text-xs text-center text-slate-500 mt-1">参考图</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Puzzle Grid */}
              <div 
                className="relative bg-slate-100 rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  width: 'min(85vw, 400px)',
                  height: 'min(85vw, 400px)',
                  aspectRatio: '1',
                }}
              >
                {pieces.map((pieceIndex, gridIndex) => {
                  const isSelected = selectedPiece === gridIndex;
                  return (
                    <motion.div
                      key={gridIndex}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePieceClick(gridIndex)}
                      className={cn(
                        "absolute cursor-pointer transition-all duration-200",
                        isSelected && "ring-4 ring-orange-400 ring-offset-2 z-10"
                      )}
                      style={{
                        ...getPiecePosition(gridIndex, pieceIndex),
                      }}
                    >
                      <div 
                        className="w-full h-full relative overflow-hidden"
                        style={{
                          backgroundImage: `url(${selectedImage.url})`,
                          backgroundSize: `${config.cols * 100}% ${config.rows * 100}%`,
                          backgroundPosition: `${
                            (pieceIndex % config.cols) * (100 / (config.cols - 1 || 1))
                          }% ${
                            Math.floor(pieceIndex / config.cols) * (100 / (config.rows - 1 || 1))
                          }%`,
                        }}
                      />
                      {/* Border lines */}
                      {pieceIndex % config.cols !== config.cols - 1 && (
                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/50" />
                      )}
                      {Math.floor(pieceIndex / config.cols) !== config.rows - 1 && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Selected indicator */}
              {selectedPiece !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center"
                >
                  <p className="text-sm text-slate-500">点击另一块拼图进行交换</p>
                  <button
                    onClick={() => setSelectedPiece(null)}
                    className="mt-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm"
                  >
                    取消选择
                  </button>
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 pb-8 flex gap-4">
              <Button
                variant="secondary"
                onClick={() => startGame(difficulty, selectedImage)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-full border-none"
              >
                <RotateCcw size={20} className="mr-2" />
                重置
              </Button>
              <Button
                onClick={() => startGame(difficulty === 4 ? 9 : 4)}
                className="flex-1 h-14 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-full border-none"
              >
                {difficulty === 4 ? '换成9片' : '换成4片'}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========== 完成界面 ========== */}
        {isComplete && (
          <motion.div
            key="complete"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Trophy Animation */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative mb-8"
            >
              <div className="w-48 h-48 bg-gradient-to-br from-orange-200 to-amber-400 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle2 size={80} className="text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Star size={40} className="text-white" fill="currentColor" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">拼图完成！</h1>
            <p className="text-lg text-slate-500 mb-2">你用了 {moveCount} 步完成拼图</p>
            <p className="text-sm text-orange-500 mb-4">完美图片：{selectedImage.name}</p>
            <p className="text-2xl text-amber-500 font-bold mb-12">获得 1 颗星星 ⭐</p>

            {/* Completed Puzzle */}
            <div className="mb-8">
              <div style={completedStyle}>
                {Array.from({ length: difficulty }).map((_, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${selectedImage.url})`,
                      backgroundSize: `${config.cols * 100}% ${config.rows * 100}%`,
                      backgroundPosition: `${
                        (i % config.cols) * (100 / (config.cols - 1 || 1))
                      }% ${
                        Math.floor(i / config.cols) * (100 / (config.rows - 1 || 1))
                      }%`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 w-full max-w-sm">
              <Button
                onClick={() => {
                  // 随机选择另一张图片
                  const otherImages = PUZZLE_IMAGES.filter(img => img.id !== selectedImage.id);
                  const randomImage = otherImages[Math.floor(Math.random() * otherImages.length)];
                  startGame(difficulty, randomImage);
                }}
                className="w-full h-16 bg-orange-400 hover:bg-orange-500 text-white font-bold text-xl rounded-full border-none"
              >
                <RotateCcw size={24} className="mr-2" />
                换一张图再来
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setGameStarted(false);
                  setIsComplete(false);
                }}
                className="w-full h-14 rounded-full text-slate-400 font-bold text-lg"
              >
                返回选择难度
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default PuzzleExpress;

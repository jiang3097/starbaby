import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';
import CelebrationEffect from '../components/CelebrationEffect';
import { useApp } from '../context/AppContext';

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

type Difficulty = 4 | 9; // 4块(2x2) 或 9块(3x3)

interface Piece {
  id: number; // 碎片的原始位置 0,1,2,3 (或 0-8)
  currentSlot: number; // 当前所在的格子索引
}

const PuzzleExpress = () => {
  const navigate = useNavigate();
  const { startTraining, incrementGamePass, incrementTrainingGame } = useApp();
  const hasStartedTraining = useRef(false);
  const hasAddedStats = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [correctCount, setCorrectCount] = useState(0); // 正确放置的碎片数
  const [draggingPiece, setDraggingPiece] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gridSize, setGridSize] = useState(280);
  const [cellSize, setCellSize] = useState(140);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 }); // 正在拖拽的碎片位置

  const gridCols = difficulty === 4 ? 2 : 3;

  // 预加载
  useEffect(() => {
    preloadVoices();
    PUZZLE_IMAGES.forEach(img => {
      const image = new Image();
      image.src = img.url;
    });
  }, []);

  // 进入页面时开始训练计时
  useEffect(() => {
    let mounted = true;
    if (!hasStartedTraining.current && mounted) {
      hasStartedTraining.current = true;
      startTraining('training');
    }
    return () => {
      mounted = false;
    };
  }, []);

  // 游戏完成时增加统计
  useEffect(() => {
    if (showSuccess && !hasAddedStats.current) {
      hasAddedStats.current = true;
      incrementTrainingGame();
      incrementGamePass();
    }
  }, [showSuccess]);

  // 初始化碎片
  const initializePieces = useCallback(() => {
    const count = difficulty;
    const newPieces: Piece[] = [];
    
    // 创建碎片，每个碎片随机分配到一个格子
    const availableSlots = Array.from({ length: count }, (_, i) => i);
    
    for (let i = 0; i < count; i++) {
      const slotIndex = Math.floor(Math.random() * availableSlots.length);
      const slot = availableSlots.splice(slotIndex, 1)[0];
      newPieces.push({ id: i, currentSlot: slot });
    }
    
    setPieces(newPieces);
    setCorrectCount(0);
    hasAddedStats.current = false;
  }, [difficulty]);

  // 初始化位置
  useEffect(() => {
    if (gameStarted && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const size = Math.min(containerWidth - 40, 280);
      const cell = size / gridCols;
      
      setGridSize(size);
      setCellSize(cell);
      initializePieces();
    }
  }, [gameStarted, currentImage, difficulty, gridCols, initializePieces]);

  // 获取格子中心坐标
  const getSlotCenter = (slot: number): { x: number; y: number } => {
    const col = slot % gridCols;
    const row = Math.floor(slot / gridCols);
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };

  // 获取碎片背景定位
  const getBgPosition = (pieceId: number): string => {
    const col = pieceId % gridCols;
    const row = Math.floor(pieceId / gridCols);
    return `${col * 100}% ${row * 100}%`;
  };

  // 检查是否全部归位
  const checkAllCorrect = useCallback((currentPieces: Piece[]) => {
    return currentPieces.every(piece => piece.id === piece.currentSlot);
  }, []);

  // 开始游戏
  const startGame = useCallback((image?: typeof PUZZLE_IMAGES[0], diff?: Difficulty) => {
    if (image) setCurrentImage(image);
    if (diff !== undefined) setDifficulty(diff);
    setShowSuccess(false);
    setGameStarted(true);
    speakText('拼图开始！把碎片拖到正确位置！');
  }, []);

  // 重置当前关卡
  const resetGame = useCallback(() => {
    setShowSuccess(false);
    initializePieces();
    speakText('重新开始！加油！');
  }, [initializePieces]);

  // 拖拽开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, piece: Piece) => {
    e.preventDefault();
    setDraggingPiece(piece.id);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const slotCenter = getSlotCenter(piece.currentSlot);
    setDragOffset({
      x: clientX - rect.left - slotCenter.x,
      y: clientY - rect.top - slotCenter.y,
    });
    setDragPosition({ x: slotCenter.x, y: slotCenter.y });
  };

  // 拖拽中
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingPiece === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left - dragOffset.x;
    const y = clientY - rect.top - dragOffset.y;
    
    setDragPosition({ x, y });
  }, [draggingPiece, dragOffset]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    if (draggingPiece === null) {
      setDraggingPiece(null);
      return;
    }

    const piece = pieces.find(p => p.id === draggingPiece);
    if (!piece) {
      setDraggingPiece(null);
      return;
    }

    // 计算放下位置对应的格子
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setDraggingPiece(null);
      return;
    }

    const targetX = dragPosition.x;
    const targetY = dragPosition.y;
    
    // 找出最近的格子
    let closestSlot = -1;
    let closestDist = Infinity;
    
    for (let i = 0; i < difficulty; i++) {
      const center = getSlotCenter(i);
      const dist = Math.sqrt(Math.pow(targetX - center.x, 2) + Math.pow(targetY - center.y, 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestSlot = i;
      }
    }

    // 检查目标格子是否有其他碎片
    const targetPiece = pieces.find(p => p.currentSlot === closestSlot && p.id !== draggingPiece);
    
    setPieces(prev => {
      const newPieces = prev.map(p => {
        if (p.id === draggingPiece) {
          return { ...p, currentSlot: closestSlot };
        }
        if (targetPiece && p.id === targetPiece.id) {
          // 交换位置
          return { ...p, currentSlot: piece.currentSlot };
        }
        return p;
      });

      // 计算正确放置的数量
      const correct = newPieces.filter(p => p.id === p.currentSlot).length;
      setCorrectCount(correct);

      // 检查是否全部正确
      if (checkAllCorrect(newPieces)) {
        setTimeout(() => {
          setShowSuccess(true);
          setShowCelebration(true);
          speakText('通关啦！真棒！你太厉害了！');
        }, 200);
      }

      return newPieces;
    });

    setDraggingPiece(null);
  }, [draggingPiece, pieces, dragPosition, difficulty, checkAllCorrect]);

  // 监听拖拽事件
  useEffect(() => {
    if (draggingPiece !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggingPiece, handleDragMove, handleDragEnd]);

  // 下一张图片
  const handleNextImage = useCallback(() => {
    const currentIndex = PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id);
    const nextIndex = (currentIndex + 1) % PUZZLE_IMAGES.length;
    const nextImage = PUZZLE_IMAGES[nextIndex];
    setCurrentImage(nextImage);
    setShowSuccess(false);
    setGameStarted(true);
    speakText('下一关！把碎片拖到正确位置！');
  }, [currentImage]);

  return (
    <MobileShell className="bg-gradient-to-b from-orange-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-orange-200"
            style={{ left: `${8 + i * 10}%`, top: `${5 + (i % 4) * 5}%` }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2.5 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute top-20 right-8 text-5xl opacity-20"
        >
          🧩
        </motion.div>
      </div>

      {/* 鼓励特效 */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      
      <AnimatePresence mode="wait">
        {/* ========== 开始界面 ========== */}
        {!gameStarted && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col relative"
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
              <p className="text-lg text-slate-500 mb-6">把碎片拖到正确位置</p>

              {/* 难度选择 */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setDifficulty(4)}
                  className={cn(
                    "px-6 py-3 rounded-full font-bold transition-all shadow-md",
                    difficulty === 4
                      ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white scale-105"
                      : "bg-white text-slate-600 hover:bg-orange-50"
                  )}
                >
                  4块 (2x2)
                </button>
                <button
                  onClick={() => setDifficulty(9)}
                  className={cn(
                    "px-6 py-3 rounded-full font-bold transition-all shadow-md",
                    difficulty === 9
                      ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white scale-105"
                      : "bg-white text-slate-600 hover:bg-orange-50"
                  )}
                >
                  9块 (3x3)
                </button>
              </div>

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
                  第 {PUZZLE_IMAGES.findIndex(img => img.id === currentImage.id) + 1}/4 关 · {difficulty}块
                </span>
              </div>
              <button
                onClick={resetGame}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-400 shadow-sm"
              >
                <RotateCcw size={22} />
              </button>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              {/* 进度 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">完成进度</span>
                <div className="flex gap-1">
                  {Array.from({ length: difficulty }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
                        i < correctCount ? "bg-emerald-400" : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-orange-500">{correctCount}/{difficulty}</span>
              </div>

              {/* 参考图 */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">参考图</span>
                <div 
                  className="rounded-xl overflow-hidden shadow-md border-2 border-orange-200"
                  style={{ width: 60, height: 60 }}
                >
                  <img src={currentImage.url} alt="参考图" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* 拼图区域 */}
              <div 
                ref={containerRef}
                className="relative bg-slate-200 rounded-2xl shadow-xl overflow-hidden border-4 border-white"
                style={{ 
                  width: gridSize, 
                  height: gridSize,
                  touchAction: 'none',
                }}
              >
                {/* 网格线 */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: gridCols - 1 }).map((_, i) => (
                    <React.Fragment key={`v-${i}`}>
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white/60" 
                        style={{ left: `${((i + 1) / gridCols) * 100}%` }}
                      />
                      <div 
                        className="absolute left-0 right-0 h-0.5 bg-white/60" 
                        style={{ top: `${((i + 1) / gridCols) * 100}%` }}
                      />
                    </React.Fragment>
                  ))}
                </div>

                {/* 碎片 - 先渲染非拖拽中的碎片 */}
                {pieces.filter(p => p.id !== draggingPiece).map((piece) => {
                  const center = getSlotCenter(piece.currentSlot);
                  const isCorrect = piece.id === piece.currentSlot;

                  return (
                    <div
                      key={piece.id}
                      onMouseDown={(e) => handleDragStart(e, piece)}
                      onTouchStart={(e) => handleDragStart(e, piece)}
                      className={cn(
                        "absolute cursor-grab active:cursor-grabbing transition-all duration-150 overflow-hidden rounded-md",
                        isCorrect && "pointer-events-none"
                      )}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        left: center.x - cellSize / 2,
                        top: center.y - cellSize / 2,
                        zIndex: 1,
                        backgroundImage: `url(${currentImage.url})`,
                        backgroundSize: `${gridSize}px ${gridSize}px`,
                        backgroundPosition: getBgPosition(piece.id),
                      }}
                    >
                      {/* 边框 */}
                      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" />
                      
                      {/* 正确归位标记 */}
                      {isCorrect && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-400/30">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 正在拖拽的碎片 */}
                {draggingPiece !== null && (
                  <div
                    className="absolute cursor-grabbing transition-none z-50 overflow-hidden rounded-md"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      left: dragPosition.x - cellSize / 2,
                      top: dragPosition.y - cellSize / 2,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      backgroundImage: `url(${currentImage.url})`,
                      backgroundSize: `${gridSize}px ${gridSize}px`,
                      backgroundPosition: getBgPosition(draggingPiece),
                    }}
                  >
                    <div className="absolute inset-0 border-2 border-orange-400 rounded-md pointer-events-none" />
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-400">把碎片拖到正确位置</p>
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
            <p className="text-2xl text-amber-500 font-bold mb-8">获得 1 颗星星</p>

            {/* 完成的拼图 */}
            <div className="mb-8">
              <div 
                className="rounded-2xl overflow-hidden shadow-xl border-4 border-amber-200"
                style={{ width: gridSize, height: gridSize }}
              >
                <img src={currentImage.url} alt="完成的拼图" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-xs">
              <button
                onClick={resetGame}
                className="flex-1 py-4 bg-white rounded-full text-orange-500 font-bold shadow-md border-2 border-orange-200"
              >
                再玩一次
              </button>
              <button
                onClick={handleNextImage}
                className="flex-1 py-4 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full text-white font-bold shadow-md"
              >
                下一关
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
};

export default PuzzleExpress;

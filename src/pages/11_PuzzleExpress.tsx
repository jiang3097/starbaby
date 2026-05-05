import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Trophy, Star, RotateCcw } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { speakText, preloadVoices } from '../lib/useSpeech';
import CelebrationEffect from '../components/CelebrationEffect';

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

// 碎片位置：0=左上, 1=右上, 2=左下, 3=右下
type PiecePosition = 0 | 1 | 2 | 3;

interface Piece {
  id: number; // 碎片的原始位置 0,1,2,3
  currentPosition: PiecePosition; // 当前所在位置
}

interface Position {
  x: number;
  y: number;
}

// 打乱碎片位置
function shufflePieces(): Piece[] {
  const positions: PiecePosition[] = [0, 1, 2, 3];
  // Fisher-Yates 洗牌
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  return positions.map((pos, index) => ({
    id: index,
    currentPosition: pos,
  }));
}

// 获取目标位置的中心坐标
function getTargetCenter(position: PiecePosition, gridSize: number, pieceSize: number): Position {
  const offsets = [
    { x: 0, y: 0 },           // 0: 左上
    { x: gridSize / 2, y: 0 }, // 1: 右上
    { x: 0, y: gridSize / 2 }, // 2: 左下
    { x: gridSize / 2, y: gridSize / 2 }, // 3: 右下
  ];
  const offset = offsets[position];
  return {
    x: offset.x + pieceSize / 2,
    y: offset.y + pieceSize / 2,
  };
}

const PuzzleExpress = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentImage, setCurrentImage] = useState(PUZZLE_IMAGES[0]);
  const [pieces, setPieces] = useState<Piece[]>(() => shufflePieces());
  const [positions, setPositions] = useState<Record<PiecePosition, Position>>({ 0: { x: 0, y: 0 }, 1: { x: 0, y: 0 }, 2: { x: 0, y: 0 }, 3: { x: 0, y: 0 } });
  const [draggingPiece, setDraggingPiece] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gridSize, setGridSize] = useState(280);
  const [pieceSize, setPieceSize] = useState(140);
  const [showCelebration, setShowCelebration] = useState(false);

  // 预加载
  useEffect(() => {
    preloadVoices();
    PUZZLE_IMAGES.forEach(img => {
      const image = new Image();
      image.src = img.url;
    });
  }, []);

  // 初始化位置
  useEffect(() => {
    if (gameStarted && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const size = Math.min(containerWidth - 40, 280);
      const half = size / 2;
      
      setGridSize(size);
      setPieceSize(half);
      
      // 初始化碎片位置（随机分散在4个格子里）
      const shuffledPieces = shufflePieces();
      const newPositions: Record<PiecePosition, Position> = { 0: { x: 0, y: 0 }, 1: { x: 0, y: 0 }, 2: { x: 0, y: 0 }, 3: { x: 0, y: 0 } };
      
      shuffledPieces.forEach((piece) => {
        const targetCenter = getTargetCenter(piece.currentPosition, size, half);
        // 随机微调位置
        newPositions[piece.currentPosition] = {
          x: targetCenter.x + (Math.random() - 0.5) * 30,
          y: targetCenter.y + (Math.random() - 0.5) * 30,
        };
      });
      
      setPieces(shuffledPieces);
      setPositions(newPositions);
    }
  }, [gameStarted, currentImage]);

  // 检查是否全部归位
  const checkWin = useCallback((currentPositions: Record<PiecePosition, Position>) => {
    const tolerance = 30;
    
    for (let i = 0; i < 4; i++) {
      const piece = pieces.find(p => p.currentPosition === (i as PiecePosition));
      if (!piece) continue;
      
      const targetCenter = getTargetCenter(piece.id as PiecePosition, gridSize, pieceSize);
      const current = currentPositions[i as PiecePosition];
      
      const distance = Math.sqrt(
        Math.pow(current.x - targetCenter.x, 2) + 
        Math.pow(current.y - targetCenter.y, 2)
      );
      
      if (distance > tolerance) return false;
    }
    return true;
  }, [pieces, gridSize, pieceSize]);

  // 开始游戏
  const startGame = useCallback((image?: typeof PUZZLE_IMAGES[0]) => {
    if (image) setCurrentImage(image);
    setShowSuccess(false);
    setGameStarted(true);
    speakText('拼图开始！拖动碎片拼出完整图片！');
  }, []);

  // 拖拽开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, pieceId: number) => {
    e.preventDefault();
    setDraggingPiece(pieceId);
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

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setPositions(prev => {
      const piece = pieces.find(p => p.id === draggingPiece);
      if (!piece) return prev;

      const newPositions = {
        ...prev,
        [piece.currentPosition]: { x, y }
      };

      // 检查是否归位
      if (checkWin(newPositions)) {
        setTimeout(() => {
          setShowSuccess(true);
          setShowCelebration(true);
          speakText('通关啦！真棒！你太厉害了！');
        }, 100);
      }

      return newPositions;
    });
  }, [draggingPiece, pieces, checkWin]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggingPiece(null);
  }, []);

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
    speakText('下一关！拖动碎片拼出完整图片！');
  }, [currentImage]);

  // 获取碎片背景定位
  const getBgPosition = (pieceId: number): string => {
    const positions = [
      '0% 0%',      // 0: 左上
      '100% 0%',    // 1: 右上
      '0% 100%',    // 2: 左下
      '100% 100%',  // 3: 右下
    ];
    return positions[pieceId] || '0% 0%';
  };

  // 计算碎片是否在正确位置
  const isPieceInPlace = (piece: Piece): boolean => {
    const pos = positions[piece.currentPosition];
    if (!pos) return false;
    const targetCenter = getTargetCenter(piece.id as PiecePosition, gridSize, pieceSize);
    const distance = Math.sqrt(
      Math.pow(pos.x - targetCenter.x, 2) + 
      Math.pow(pos.y - targetCenter.y, 2)
    );
    return distance < 30;
  };

  return (
    <MobileShell className="bg-gradient-to-b from-orange-50 to-white">
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
              <p className="text-lg text-slate-500 mb-8">拖动碎片拼出完整图片</p>

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
                <div 
                  className="rounded-2xl overflow-hidden shadow-lg border-2 border-orange-200"
                  style={{ width: 80, height: 80 }}
                >
                  <img src={currentImage.url} alt="参考图" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* 拼图区域 */}
              <div 
                ref={containerRef}
                className="relative bg-slate-200 rounded-3xl shadow-xl overflow-hidden border-4 border-white"
                style={{ 
                  width: gridSize, 
                  height: gridSize,
                  touchAction: 'none',
                }}
              >
                {/* 网格线 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
                </div>

                {/* 碎片 */}
                {pieces.map((piece) => {
                  const pos = positions[piece.currentPosition];
                  const inPlace = isPieceInPlace(piece);

                  return (
                    <div
                      key={piece.id}
                      onMouseDown={(e) => handleDragStart(e, piece.id)}
                      onTouchStart={(e) => handleDragStart(e, piece.id)}
                      className={cn(
                        "absolute cursor-grab active:cursor-grabbing transition-all duration-150",
                        inPlace && "pointer-events-none"
                      )}
                      style={{
                        width: pieceSize,
                        height: pieceSize,
                        left: pos ? pos.x - pieceSize / 2 : 0,
                        top: pos ? pos.y - pieceSize / 2 : 0,
                        zIndex: draggingPiece === piece.id ? 10 : 1,
                      }}
                    >
                      <img
                        src={currentImage.url}
                        alt=""
                        className="w-full h-full"
                        style={{
                          objectPosition: getBgPosition(piece.id),
                          objectFit: 'cover',
                        }}
                      />
                      {/* 边框 */}
                      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" />
                      
                      {/* 正确归位标记 */}
                      {inPlace && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                          <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-slate-400">拖动碎片到正确位置</p>
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

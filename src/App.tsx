import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/00_Welcome';
import Splash from './pages/01_Splash';
import Home from './pages/02_Home';
import AIChat from './pages/03_AIChat';
import BookList from './pages/04_BookList';
import BookInteraction from './pages/05_BookInteraction';
import TrainingEntry from './pages/06_TrainingEntry';
import GrowthRecord from './pages/07_GrowthRecord';
import Settings from './pages/08_Settings';
import EmotionGuess from './pages/09_EmotionGuess';
import InstructionFind from './pages/10_InstructionFind';
import PuzzleExpress from './pages/11_PuzzleExpress';

// 检测是否在微信中打开
const isWeChat = () => {
  return /MicroMessenger/i.test(navigator.userAgent);
};

// 微信提示组件
const WeChatTip = () => (
  <div className="fixed inset-0 bg-gradient-to-b from-orange-100 to-yellow-50 z-[9999] flex items-center justify-center p-6">
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
      <div className="text-6xl mb-4">🤔</div>
      <h2 className="text-xl font-bold text-gray-800 mb-3">请用浏览器打开</h2>
      <p className="text-gray-600 mb-4">
        为了获得最佳体验，建议您：
      </p>
      <ol className="text-left text-gray-600 mb-6 space-y-2">
        <li>1. 点击右上角 <span className="font-bold">···</span> 菜单</li>
        <li>2. 选择 <span className="font-bold">「在浏览器中打开」</span></li>
        <li>3. 或者复制链接到 Safari/Chrome</li>
      </ol>
      <p className="text-sm text-gray-500">
        微信内置浏览器不支持语音功能 💡
      </p>
    </div>
  </div>
);

const App = () => {
  // 如果在微信中，显示提示
  if (isWeChat()) {
    return <WeChatTip />;
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/chat" element={<AIChat />} />
      <Route path="/books" element={<BookList />} />
      <Route path="/book-interaction/:bookId" element={<BookInteraction />} />
      <Route path="/training" element={<TrainingEntry />} />
      <Route path="/emotion-guess" element={<EmotionGuess />} />
      <Route path="/instruction-find" element={<InstructionFind />} />
      <Route path="/puzzle-express" element={<PuzzleExpress />} />
      <Route path="/growth" element={<GrowthRecord />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default App;

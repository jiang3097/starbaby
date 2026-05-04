import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
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

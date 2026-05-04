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

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/chat" element={<AIChat />} />
      <Route path="/books" element={<BookList />} />
      <Route path="/book-interaction" element={<BookInteraction />} />
      <Route path="/training" element={<TrainingEntry />} />
      <Route path="/growth" element={<GrowthRecord />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default App;

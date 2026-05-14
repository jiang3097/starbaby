import React from 'react'
import { Routes, Route } from 'react-router-dom'

const TestPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-orange-100 to-yellow-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">⭐</div>
      <h1 className="text-2xl font-bold text-gray-800">星小宝</h1>
      <p className="text-gray-600 mt-2">测试页面</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<TestPage />} />
    </Routes>
  );
};

export default App;

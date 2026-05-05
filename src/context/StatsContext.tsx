import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface DailyStats {
  date: string;
  trainingMinutes: number;      // 今日训练时长（分钟）
  expressionCount: number;       // 主动表达次数
  gamePassCount: number;        // 趣味闯关通关次数
  chatMessages: number;          // AI聊天消息数
  bookCompleted: number;        // 绘本完成题目数
  trainingGames: number;        // 趣味训练完成数
}

interface TrainingSession {
  startTime: number | null;
  type: 'chat' | 'book' | 'training' | null;
}

interface StatsContextType {
  dailyStats: DailyStats;
  startTraining: (type: 'chat' | 'book' | 'training') => void;
  endTraining: () => void;
  incrementExpression: (source: 'chat' | 'book') => void;
  incrementGamePass: () => void;
  incrementChatMessage: () => void;
  incrementBookCompleted: () => void;
  incrementTrainingGame: () => void;
  getTodayDate: () => string;
}

const defaultStats: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  trainingMinutes: 0,
  expressionCount: 0,
  gamePassCount: 0,
  chatMessages: 0,
  bookCompleted: 0,
  trainingGames: 0,
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

const STORAGE_KEY = 'star_baby_stats';

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    // 初始化时从 localStorage 读取
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return { ...defaultStats, date: today };
  });

  const currentSession = useRef<TrainingSession>({ startTime: null, type: null });
  const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialized = useRef(false);

  // 获取今天的日期字符串
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // 防抖保存到 localStorage
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyStats));
    }, 500); // 500ms 防抖

    return () => clearTimeout(timeout);
  }, [dailyStats]);

  // 结束训练计时
  const endTraining = useCallback(() => {
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
      sessionTimer.current = null;
    }

    if (currentSession.current.startTime) {
      // 计算本次训练时长（不足1分钟按1分钟算）
      const elapsed = Date.now() - currentSession.current.startTime;
      const minutes = Math.max(1, Math.ceil(elapsed / 60000));
      
      setDailyStats(prev => ({
        ...prev,
        trainingMinutes: prev.trainingMinutes + minutes,
      }));
    }

    currentSession.current = { startTime: null, type: null };
  }, []);

  // 开始训练计时
  const startTraining = useCallback((type: 'chat' | 'book' | 'training') => {
    // 如果已经有在进行的同类型训练，不重复启动
    if (currentSession.current.startTime && currentSession.current.type === type) {
      return;
    }
    
    // 先结束之前的训练
    if (currentSession.current.startTime) {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
        sessionTimer.current = null;
      }
      // 计算之前训练的时长
      const elapsed = Date.now() - currentSession.current.startTime;
      const minutes = Math.max(1, Math.ceil(elapsed / 60000));
      currentSession.current = { startTime: null, type: null };
    }
    
    currentSession.current = {
      startTime: Date.now(),
      type,
    };

    // 每分钟更新一次训练时长
    sessionTimer.current = setInterval(() => {
      setDailyStats(prev => ({
        ...prev,
        trainingMinutes: prev.trainingMinutes + 1,
      }));
    }, 60000);
  }, []);

  // 增加主动表达次数
  const incrementExpression = useCallback((source: 'chat' | 'book') => {
    setDailyStats(prev => ({
      ...prev,
      expressionCount: prev.expressionCount + 1,
      chatMessages: source === 'chat' ? prev.chatMessages + 1 : prev.chatMessages,
      bookCompleted: source === 'book' ? prev.bookCompleted + 1 : prev.bookCompleted,
    }));
  }, []);

  // 增加闯关次数
  const incrementGamePass = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      gamePassCount: prev.gamePassCount + 1,
    }));
  }, []);

  // 增加聊天消息数
  const incrementChatMessage = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      chatMessages: prev.chatMessages + 1,
    }));
  }, []);

  // 增加绘本完成数
  const incrementBookCompleted = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      bookCompleted: prev.bookCompleted + 1,
    }));
  }, []);

  // 增加趣味训练完成数
  const incrementTrainingGame = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      trainingGames: prev.trainingGames + 1,
    }));
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
    };
  }, []);

  return (
    <StatsContext.Provider
      value={{
        dailyStats,
        startTraining,
        endTraining,
        incrementExpression,
        incrementGamePass,
        incrementChatMessage,
        incrementBookCompleted,
        incrementTrainingGame,
        getTodayDate,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = (): StatsContextType => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

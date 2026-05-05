import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface DailyStats {
  date: string;
  trainingMinutes: number;
  expressionCount: number;
  gamePassCount: number;
  chatMessages: number;
  bookCompleted: number;
  trainingGames: number;
}

interface WeeklyStats {
  [date: string]: {
    trainingMinutes: number;
    expressionCount: number;
    gamePassCount: number;
  };
}

interface TrainingSession {
  startTime: number | null;
  type: 'chat' | 'book' | 'training' | null;
}

interface StatsContextType {
  dailyStats: DailyStats;
  weeklyStats: WeeklyStats;
  startTraining: (type: 'chat' | 'book' | 'training') => void;
  endTraining: () => void;
  incrementExpression: (source: 'chat' | 'book') => void;
  incrementGamePass: () => void;
  incrementChatMessage: () => void;
  incrementBookCompleted: () => void;
  incrementTrainingGame: () => void;
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

const DAILY_STORAGE_KEY = 'star_baby_daily_stats';
const WEEKLY_STORAGE_KEY = 'star_baby_weekly_stats';

// 获取本周一和周日日期
const getWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  };
};

// 获取本周所有日期
const getWeekDates = (): string[] => {
  const { start } = getWeekRange();
  const dates: string[] = [];
  const monday = new Date(start);
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// 初始化日数据
const initDailyStats = (): DailyStats => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        return parsed;
      }
    } catch { /* ignore */ }
  }
  return { ...defaultStats, date: today };
};

// 初始化周数据
const initWeeklyStats = (): WeeklyStats => {
  const stored = localStorage.getItem(WEEKLY_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const { start, end } = getWeekRange();
      if (parsed.weekStart === start && parsed.weekEnd === end) {
        return parsed.data || {};
      }
    } catch { /* ignore */ }
  }
  const weekData: WeeklyStats = {};
  getWeekDates().forEach(date => {
    weekData[date] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
  });
  return weekData;
};

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats>(initDailyStats);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>(initWeeklyStats);

  const currentSession = useRef<TrainingSession>({ startTime: null, type: null });
  const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsRef = useRef({ dailyStats, weeklyStats });
  
  // 保持 ref 同步
  statsRef.current = { dailyStats, weeklyStats };

  // 保存数据到 localStorage（不在渲染时保存）
  const saveToStorage = useCallback(() => {
    const { dailyStats: d, weeklyStats: w } = statsRef.current;
    const { start, end } = getWeekRange();
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(d));
    localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify({ weekStart: start, weekEnd: end, data: w }));
  }, []);

  // 开始训练计时
  const startTraining = useCallback((type: 'chat' | 'book' | 'training') => {
    if (currentSession.current.startTime && currentSession.current.type === type) {
      return;
    }
    
    // 先结束之前的
    if (currentSession.current.startTime) {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
        sessionTimer.current = null;
      }
      const elapsed = Date.now() - currentSession.current.startTime;
      const minutes = Math.max(1, Math.ceil(elapsed / 60000));
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => ({ ...prev, trainingMinutes: prev.trainingMinutes + minutes }));
      setWeeklyStats(prev => {
        const newData = { ...prev };
        if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
        newData[today].trainingMinutes += minutes;
        return newData;
      });
    }
    
    currentSession.current = { startTime: Date.now(), type };
    
    // 清理之前的定时器
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
    }
    
    // 每分钟更新
    sessionTimer.current = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => ({ ...prev, trainingMinutes: prev.trainingMinutes + 1 }));
      setWeeklyStats(prev => {
        const newData = { ...prev };
        if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
        newData[today].trainingMinutes += 1;
        return newData;
      });
    }, 60000);
  }, []);

  // 结束训练计时
  const endTraining = useCallback(() => {
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
      sessionTimer.current = null;
    }

    if (currentSession.current.startTime) {
      const elapsed = Date.now() - currentSession.current.startTime;
      const minutes = Math.max(1, Math.ceil(elapsed / 60000));
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => ({ ...prev, trainingMinutes: prev.trainingMinutes + minutes }));
      setWeeklyStats(prev => {
        const newData = { ...prev };
        if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
        newData[today].trainingMinutes += minutes;
        return newData;
      });
    }
    currentSession.current = { startTime: null, type: null };
  }, []);

  // 增加主动表达次数
  const incrementExpression = useCallback((source: 'chat' | 'book') => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      expressionCount: prev.expressionCount + 1,
      chatMessages: source === 'chat' ? prev.chatMessages + 1 : prev.chatMessages,
      bookCompleted: source === 'book' ? prev.bookCompleted + 1 : prev.bookCompleted,
    }));
    setWeeklyStats(prev => {
      const newData = { ...prev };
      if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      newData[today].expressionCount += 1;
      return newData;
    });
  }, []);

  // 增加闯关次数
  const incrementGamePass = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({ ...prev, gamePassCount: prev.gamePassCount + 1 }));
    setWeeklyStats(prev => {
      const newData = { ...prev };
      if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      newData[today].gamePassCount += 1;
      return newData;
    });
  }, []);

  // 增加聊天消息数
  const incrementChatMessage = useCallback(() => {
    setDailyStats(prev => ({ ...prev, chatMessages: prev.chatMessages + 1 }));
  }, []);

  // 增加绘本完成数
  const incrementBookCompleted = useCallback(() => {
    setDailyStats(prev => ({ ...prev, bookCompleted: prev.bookCompleted + 1 }));
  }, []);

  // 增加趣味训练完成数
  const incrementTrainingGame = useCallback(() => {
    setDailyStats(prev => ({ ...prev, trainingGames: prev.trainingGames + 1 }));
  }, []);

  return (
    <StatsContext.Provider
      value={{
        dailyStats,
        weeklyStats,
        startTraining,
        endTraining,
        incrementExpression,
        incrementGamePass,
        incrementChatMessage,
        incrementBookCompleted,
        incrementTrainingGame,
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

export { getWeekDates };

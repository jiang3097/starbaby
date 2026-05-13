import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWeekDates } from '../lib/utils';

const AppContext = createContext<AppContextType | undefined>(undefined);

const DAILY_STORAGE_KEY = 'star_baby_daily_stats';
const WEEKLY_STORAGE_KEY = 'star_baby_weekly_stats';
const LIMIT_STORAGE_KEY = 'star_baby_time_limit';

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

interface TimeLimit {
  enabled: boolean;
  minutes: number;
  customMinutes: number | null;
}

interface AppContextType {
  dailyStats: DailyStats;
  weeklyStats: WeeklyStats;
  timeLimit: TimeLimit;
  timeLimitReached: boolean;
  showTimeLimitModal: boolean;
  setShowTimeLimitModal: (show: boolean) => void;
  resetTimeLimit: () => void;
  incrementGamePass: () => void;
  incrementExpression: (source: 'chat' | 'book') => void;
  incrementChatMessage: () => void;
  incrementBookCompleted: () => void;
  incrementTrainingGame: () => void;
  startTraining: () => void;
  setTimeLimit: (limit: TimeLimit) => void;
  setTimeLimitReached: (reached: boolean) => void;
}

const defaultDailyStats: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  trainingMinutes: 0,
  expressionCount: 0,
  gamePassCount: 0,
  chatMessages: 0,
  bookCompleted: 0,
  trainingGames: 0,
};

function AppProvider({ children }: { children: React.ReactNode }) {
  // 从 localStorage 读取数据，检查日期是否需要重置
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(DAILY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DailyStats;
      // 如果是同一天，保留数据；否则重置
      if (parsed.date === today) {
        return parsed;
      }
    }
    return { ...defaultDailyStats, date: today };
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({});
  const [timeLimit, setTimeLimitState] = useState<TimeLimit>(() => {
    const saved = localStorage.getItem(LIMIT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as TimeLimit;
      } catch {
        return { enabled: false, minutes: 30, customMinutes: null };
      }
    }
    return { enabled: false, minutes: 30, customMinutes: null };
  });
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [trainingStartTime, setTrainingStartTime] = useState<number | null>(null);

  // 定时增加训练时长和检查时间限制
  useEffect(() => {
    if (!trainingStartTime || timeLimitReached) return;

    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => {
        // 只有同一天才累加
        if (prev.date !== today) return prev;
        return {
          ...prev,
          trainingMinutes: prev.trainingMinutes + 1,
        };
      });

      // 检查时间限制
      if (timeLimit.enabled) {
        const elapsed = Math.floor((Date.now() - trainingStartTime) / 60000);
        const limitMinutes = timeLimit.customMinutes ?? timeLimit.minutes;
        if (elapsed >= limitMinutes) {
          setTimeLimitReached(true);
          setShowTimeLimitModal(true);
        }
      }
    }, 60000); // 每分钟增加1

    return () => clearInterval(interval);
  }, [trainingStartTime, timeLimit, timeLimitReached]);

  const resetTimeLimit = useCallback(() => {
    setTimeLimitReached(false);
    setShowTimeLimitModal(false);
    setTrainingStartTime(null);
  }, []);

  const incrementGamePass = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      date: today,
      gamePassCount: prev.gamePassCount + 1,
    }));
  }, []);

  const incrementExpression = useCallback((_source: 'chat' | 'book') => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      date: today,
      expressionCount: prev.expressionCount + 1,
    }));
  }, []);

  const incrementChatMessage = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      date: today,
      chatMessages: prev.chatMessages + 1,
    }));
  }, []);

  const incrementBookCompleted = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      date: today,
      bookCompleted: prev.bookCompleted + 1,
    }));
  }, []);

  const incrementTrainingGame = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({
      ...prev,
      date: today,
      trainingGames: prev.trainingGames + 1,
    }));
  }, []);

  const startTraining = useCallback(() => {
    if (trainingStartTime === null) {
      setTrainingStartTime(Date.now());
    }
  }, [trainingStartTime]);

  const setTimeLimit = useCallback((limit: TimeLimit) => {
    setTimeLimitState(limit);
    localStorage.setItem(LIMIT_STORAGE_KEY, JSON.stringify(limit));
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyStats));
  }, [dailyStats]);

  // 更新周数据
  useEffect(() => {
    const weekData = getWeekDates();
    const week: WeeklyStats = {};
    weekData.forEach((date: string) => {
      if (date === dailyStats.date) {
        week[date] = {
          trainingMinutes: dailyStats.trainingMinutes,
          expressionCount: dailyStats.expressionCount,
          gamePassCount: dailyStats.gamePassCount,
        };
      } else {
        week[date] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      }
    });
    setWeeklyStats(week);
  }, [dailyStats]);

  return (
    <AppContext.Provider value={{
      dailyStats,
      weeklyStats,
      timeLimit,
      timeLimitReached,
      showTimeLimitModal,
      setShowTimeLimitModal,
      resetTimeLimit,
      incrementGamePass,
      incrementExpression,
      incrementChatMessage,
      incrementBookCompleted,
      incrementTrainingGame,
      startTraining,
      setTimeLimit,
      setTimeLimitReached,
    }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { AppProvider, useApp };
export { getWeekDates };

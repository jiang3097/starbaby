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
  const [dailyStats, setDailyStats] = useState<DailyStats>({ ...defaultDailyStats });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({});
  const [timeLimit, setTimeLimitState] = useState<TimeLimit>({ enabled: false, minutes: 30, customMinutes: null });
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [trainingStartTime, setTrainingStartTime] = useState<number | null>(null);

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

  useEffect(() => {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyStats));
  }, [dailyStats]);

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

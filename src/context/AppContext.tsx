import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

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

interface TrainingSession {
  startTime: number | null;
  type: 'chat' | 'book' | 'training' | null;
}

interface AppContextType {
  dailyStats: DailyStats;
  weeklyStats: WeeklyStats;
  timeLimit: TimeLimit;
  isTimeLimitReached: boolean;
  showTimeLimitModal: boolean;
  setTimeLimit: (limit: TimeLimit) => void;
  setShowTimeLimitModal: (show: boolean) => void;
  resetTimeLimit: () => void;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

const DAILY_STORAGE_KEY = 'star_baby_daily_stats';
const WEEKLY_STORAGE_KEY = 'star_baby_weekly_stats';
const LIMIT_STORAGE_KEY = 'star_baby_time_limit';
const REACHED_STORAGE_KEY = 'star_baby_time_reached';

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

// 初始化限时
const initTimeLimit = (): TimeLimit => {
  const stored = localStorage.getItem(LIMIT_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* ignore */ }
  }
  return { enabled: false, minutes: 30, customMinutes: null };
};

// 初始化是否已达限
const initTimeReached = (): boolean => {
  const stored = localStorage.getItem(REACHED_STORAGE_KEY);
  if (stored) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        return parsed.reached;
      }
    } catch { /* ignore */ }
  }
  return false;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats>(initDailyStats);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>(initWeeklyStats);
  const [timeLimit, setTimeLimitState] = useState<TimeLimit>(initTimeLimit);
  const [isTimeLimitReached, setIsTimeLimitReached] = useState(initTimeReached);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);

  const currentSession = useRef<TrainingSession>({ startTime: null, type: null });
  const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsRef = useRef({ dailyStats, weeklyStats });
  const hasShownLimitModal = useRef(false);
  
  statsRef.current = { dailyStats, weeklyStats };

  // 检查是否达到限时（计时器每分钟触发）
  useEffect(() => {
    if (!timeLimit.enabled || hasShownLimitModal.current || isTimeLimitReached) {
      return;
    }
    const limitMinutes = timeLimit.customMinutes || timeLimit.minutes;
    if (dailyStats.trainingMinutes >= limitMinutes) {
      setIsTimeLimitReached(true);
      setShowTimeLimitModal(true);
      hasShownLimitModal.current = true;
    }
  }, [dailyStats.trainingMinutes, timeLimit, isTimeLimitReached]);

  // 设置限时
  const setTimeLimit = useCallback((limit: TimeLimit) => {
    setTimeLimitState(limit);
    localStorage.setItem(LIMIT_STORAGE_KEY, JSON.stringify(limit));
    if (!limit.enabled) {
      setIsTimeLimitReached(false);
      hasShownLimitModal.current = false;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(REACHED_STORAGE_KEY, JSON.stringify({ date: today, reached: false }));
    }
  }, []);

  // 重置限时 - 解锁后继续使用
  const resetTimeLimit = useCallback(() => {
    setShowTimeLimitModal(false);
    setIsTimeLimitReached(false);
    // 重置标记，这样下次达到限时可以再次触发
    hasShownLimitModal.current = false;
  }, []);

  // 开始训练计时
  const startTraining = useCallback((type: 'chat' | 'book' | 'training') => {
    if (isTimeLimitReached) return; // 已达限时不允许开始
    
    if (currentSession.current.startTime && currentSession.current.type === type) {
      return;
    }
    
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
    
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
    }
    
    sessionTimer.current = setInterval(() => {
      // 暂停状态下不更新计时（但计时器继续运行，等待解锁后继续）
      if (isTimeLimitReached) {
        return; // 只暂停更新，不停止计时器
      }
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => ({ ...prev, trainingMinutes: prev.trainingMinutes + 1 }));
      setWeeklyStats(prev => {
        const newData = { ...prev };
        if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
        newData[today].trainingMinutes += 1;
        return newData;
      });
    }, 60000);
  }, [isTimeLimitReached]);

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
    if (isTimeLimitReached) return;
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
  }, [isTimeLimitReached]);

  // 增加闯关次数
  const incrementGamePass = useCallback(() => {
    if (isTimeLimitReached) return;
    const today = new Date().toISOString().split('T')[0];
    setDailyStats(prev => ({ ...prev, gamePassCount: prev.gamePassCount + 1 }));
    setWeeklyStats(prev => {
      const newData = { ...prev };
      if (!newData[today]) newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      newData[today].gamePassCount += 1;
      return newData;
    });
  }, [isTimeLimitReached]);

  // 增加聊天消息数
  const incrementChatMessage = useCallback(() => {
    if (isTimeLimitReached) return;
    setDailyStats(prev => ({ ...prev, chatMessages: prev.chatMessages + 1 }));
  }, [isTimeLimitReached]);

  // 增加绘本完成数
  const incrementBookCompleted = useCallback(() => {
    if (isTimeLimitReached) return;
    setDailyStats(prev => ({ ...prev, bookCompleted: prev.bookCompleted + 1 }));
  }, [isTimeLimitReached]);

  // 增加趣味训练完成数
  const incrementTrainingGame = useCallback(() => {
    if (isTimeLimitReached) return;
    setDailyStats(prev => ({ ...prev, trainingGames: prev.trainingGames + 1 }));
  }, [isTimeLimitReached]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        dailyStats,
        weeklyStats,
        timeLimit,
        isTimeLimitReached,
        showTimeLimitModal,
        setTimeLimit,
        setShowTimeLimitModal,
        resetTimeLimit,
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
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { getWeekDates };

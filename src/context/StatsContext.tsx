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

const DAILY_STORAGE_KEY = 'star_baby_daily_stats';
const WEEKLY_STORAGE_KEY = 'star_baby_weekly_stats';

// 获取本周一和周日日期
const getWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 将周日的0转为7
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

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(DAILY_STORAGE_KEY);
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

  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>(() => {
    const stored = localStorage.getItem(WEEKLY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 检查是否是本周的数据
        const { start, end } = getWeekRange();
        if (parsed.weekStart === start && parsed.weekEnd === end) {
          return parsed.data || {};
        }
      } catch {
        // ignore
      }
    }
    // 返回本周空数据
    const weekData: WeeklyStats = {};
    getWeekDates().forEach(date => {
      weekData[date] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
    });
    return weekData;
  });

  const currentSession = useRef<TrainingSession>({ startTime: null, type: null });
  const sessionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialized = useRef(false);

  // 获取今天的日期字符串
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // 更新周数据
  const updateWeeklyStats = useCallback((updates: Partial<{ trainingMinutes: number; expressionCount: number; gamePassCount: number }>) => {
    const today = getTodayDate();
    setWeeklyStats(prev => {
      const newData = { ...prev };
      if (!newData[today]) {
        newData[today] = { trainingMinutes: 0, expressionCount: 0, gamePassCount: 0 };
      }
      if (updates.trainingMinutes !== undefined) {
        newData[today].trainingMinutes += updates.trainingMinutes;
      }
      if (updates.expressionCount !== undefined) {
        newData[today].expressionCount += updates.expressionCount;
      }
      if (updates.gamePassCount !== undefined) {
        newData[today].gamePassCount += updates.gamePassCount;
      }
      return newData;
    });
  }, [getTodayDate]);

  // 防抖保存日数据到 localStorage
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    const timeout = setTimeout(() => {
      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyStats));
    }, 500);

    return () => clearTimeout(timeout);
  }, [dailyStats]);

  // 防抖保存周数据到 localStorage
  useEffect(() => {
    const { start, end } = getWeekRange();
    const timeout = setTimeout(() => {
      localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify({
        weekStart: start,
        weekEnd: end,
        data: weeklyStats
      }));
    }, 500);

    return () => clearTimeout(timeout);
  }, [weeklyStats]);

  // 结束训练计时
  const endTraining = useCallback(() => {
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
      sessionTimer.current = null;
    }

    if (currentSession.current.startTime) {
      const elapsed = Date.now() - currentSession.current.startTime;
      const minutes = Math.max(1, Math.ceil(elapsed / 60000));
      
      setDailyStats(prev => ({
        ...prev,
        trainingMinutes: prev.trainingMinutes + minutes,
      }));
      
      // 更新周数据
      updateWeeklyStats({ trainingMinutes: minutes });
    }

    currentSession.current = { startTime: null, type: null };
  }, [updateWeeklyStats]);

  // 开始训练计时
  const startTraining = useCallback((type: 'chat' | 'book' | 'training') => {
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
      currentSession.current = { startTime: null, type: null };
    }
    
    currentSession.current = {
      startTime: Date.now(),
      type,
    };

    sessionTimer.current = setInterval(() => {
      setDailyStats(prev => ({
        ...prev,
        trainingMinutes: prev.trainingMinutes + 1,
      }));
      updateWeeklyStats({ trainingMinutes: 1 });
    }, 60000);
  }, [updateWeeklyStats]);

  // 增加主动表达次数
  const incrementExpression = useCallback((source: 'chat' | 'book') => {
    setDailyStats(prev => ({
      ...prev,
      expressionCount: prev.expressionCount + 1,
      chatMessages: source === 'chat' ? prev.chatMessages + 1 : prev.chatMessages,
      bookCompleted: source === 'book' ? prev.bookCompleted + 1 : prev.bookCompleted,
    }));
    updateWeeklyStats({ expressionCount: 1 });
  }, [updateWeeklyStats]);

  // 增加闯关次数
  const incrementGamePass = useCallback(() => {
    setDailyStats(prev => ({
      ...prev,
      gamePassCount: prev.gamePassCount + 1,
    }));
    updateWeeklyStats({ gamePassCount: 1 });
  }, [updateWeeklyStats]);

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
        weeklyStats,
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

// 导出辅助函数供组件使用
export { getWeekDates };

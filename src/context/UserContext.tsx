import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STAR_AVATARS, type STAR_AVATAR } from '../lib/starAvatars';
export type { STAR_AVATAR };
export { STAR_AVATARS };

// 存储 key 定义
const CURRENT_AVATAR_KEY = 'star_baby_current_avatar';
const getProfileKey = (avatarId: number) => `star_baby_profile_${avatarId}`;

// 玩具类型定义
export const TOY_TYPES = [
  { id: 1, name: '小熊', emoji: '🧸', color: 'from-amber-300 to-orange-400' },
  { id: 2, name: '毛绒球', emoji: '🎾', color: 'from-pink-300 to-rose-400' },
  { id: 3, name: '积木', emoji: '🧱', color: 'from-blue-300 to-cyan-400' },
  { id: 4, name: '音乐盒', emoji: '🎵', color: 'from-purple-300 to-violet-400' },
  { id: 5, name: '小汽车', emoji: '🚗', color: 'from-red-300 to-orange-400' },
  { id: 6, name: '玩偶', emoji: '🪆', color: 'from-green-300 to-emerald-400' },
  { id: 7, name: '风车', emoji: '🎡', color: 'from-teal-300 to-cyan-400' },
  { id: 8, name: '皮球', emoji: '⚽', color: 'from-yellow-300 to-amber-400' },
];

// 食物类型定义
export const FOOD_TYPES = [
  { id: 1, name: '苹果', emoji: '🍎', color: 'from-red-300 to-pink-400' },
  { id: 2, name: '胡萝卜', emoji: '🥕', color: 'from-orange-300 to-amber-400' },
  { id: 3, name: '米饭', emoji: '🍚', color: 'from-yellow-200 to-amber-300' },
  { id: 4, name: '面包', emoji: '🍞', color: 'from-amber-200 to-yellow-300' },
  { id: 5, name: '牛奶', emoji: '🥛', color: 'from-slate-200 to-blue-200' },
  { id: 6, name: '鸡蛋', emoji: '🥚', color: 'from-yellow-100 to-amber-200' },
  { id: 7, name: '蔬菜', emoji: '🥦', color: 'from-green-300 to-emerald-400' },
  { id: 8, name: '水果', emoji: '🍇', color: 'from-purple-300 to-violet-400' },
];

export interface UserProfile {
  avatarId: number;
  name: string;
  
  // 亲密度
  intimacy: number;
  lastLoginDate: string;
  todayIntimacyAdded: number;
  
  // 饱腹值
  fullness: number;
  fullnessUsedToday: number;
  fullnessDate: string;
  
  // 清洁值
  cleanliness: number;
  lastBathDate: string;
  
  // 心情值
  mood: number;
  moodUsedToday: number;
  moodDate: string;
  
  // 道具
  toys: number;
  foods: number;
  stars: number; // 星星数（绘本闯关获得）
  
  // 累计通关次数
  totalGamePassed: number;
}

interface UserContextType {
  profile: UserProfile;
  avatar: STAR_AVATAR;
  updateProfile: (updates: Partial<UserProfile>) => void;
  incrementIntimacy: () => void;
  useFood: () => boolean;
  useToy: () => boolean;
  takeBath: () => void;
  addToy: () => string | null;
  addFood: () => string | null;
  checkAndAddToy: (currentPassCount: number) => string | null;
  checkAndAddFood: () => string | null;
  // 头像相关
  switchAvatar: (avatarId: number) => void;
  getAvatarProfile: (avatarId: number) => UserProfile | null;
}

const createDefaultProfile = (avatarId: number): UserProfile => {
  const avatar = STAR_AVATARS.find(a => a.id === avatarId) || STAR_AVATARS[0];
  const today = new Date().toISOString().split('T')[0];
  return {
    avatarId,
    name: avatar.name,
    intimacy: 60,
    lastLoginDate: today,
    todayIntimacyAdded: 0,
    fullness: 60,
    fullnessUsedToday: 0,
    fullnessDate: today,
    cleanliness: 60,
    lastBathDate: today,
    mood: 60,
    moodUsedToday: 0,
    moodDate: today,
    toys: 0,
    foods: 0,
    stars: 0,
    totalGamePassed: 0,
  };
};

// 加载指定头像的数据
const loadProfile = (avatarId: number): UserProfile => {
  try {
    const storageKey = getProfileKey(avatarId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      
      // 获取保存的日期
      const savedDate = parsed.lastLoginDate || '';
      
      // 只有真正到了新的一天才重置每日计数和状态值
      const isNewDay = savedDate !== today;
      
      return {
        avatarId: parsed.avatarId ?? avatarId,
        name: parsed.name || STAR_AVATARS.find(a => a.id === avatarId)?.name || '星小宝',
        intimacy: parsed.intimacy ?? 60,
        lastLoginDate: today,
        // 只有新的一天才重置今日亲密度增加次数
        todayIntimacyAdded: isNewDay ? 0 : (parsed.todayIntimacyAdded ?? 0),
        // 饱腹值每天重置为初始值
        fullness: isNewDay ? 60 : (parsed.fullness ?? 60),
        // 只有新的一天才重置食物使用次数
        fullnessUsedToday: isNewDay ? 0 : (parsed.fullnessUsedToday ?? 0),
        fullnessDate: parsed.fullnessDate || today,
        // 清洁值每天重置为初始值
        cleanliness: isNewDay ? 60 : (parsed.cleanliness ?? 60),
        lastBathDate: parsed.lastBathDate || today,
        // 心情值每天重置为初始值
        mood: isNewDay ? 60 : (parsed.mood ?? 60),
        // 只有新的一天才重置玩具使用次数
        moodUsedToday: isNewDay ? 0 : (parsed.moodUsedToday ?? 0),
        moodDate: parsed.moodDate || today,
        toys: parsed.toys ?? 0,
        foods: parsed.foods ?? 0,
        stars: parsed.stars ?? 0,
        totalGamePassed: parsed.totalGamePassed ?? 0,
      };
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
  return createDefaultProfile(avatarId);
};

// 保存数据到指定头像
const saveProfile = (profile: UserProfile) => {
  const storageKey = getProfileKey(profile.avatarId);
  localStorage.setItem(storageKey, JSON.stringify(profile));
};

const UserContext = createContext<UserContextType>({
  profile: createDefaultProfile(1),
  avatar: STAR_AVATARS[0],
  updateProfile: () => {},
  incrementIntimacy: () => {},
  useFood: () => false,
  useToy: () => false,
  takeBath: () => {},
  addToy: () => null,
  addFood: () => null,
  checkAndAddToy: () => null,
  checkAndAddFood: () => null,
  switchAvatar: () => {},
  getAvatarProfile: () => null,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: React.ReactNode;
}

// 随机获取一个玩具
const getRandomToy = () => {
  const index = Math.floor(Math.random() * TOY_TYPES.length);
  return TOY_TYPES[index];
};

// 随机获取一个食物
const getRandomFood = () => {
  const index = Math.floor(Math.random() * FOOD_TYPES.length);
  return FOOD_TYPES[index];
};

export const UserProvider = ({ children }: UserProviderProps) => {
  // 初始化当前头像 ID（从 localStorage 读取或默认为 1）
  const [currentAvatarId, setCurrentAvatarId] = useState<number>(() => {
    const saved = localStorage.getItem(CURRENT_AVATAR_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });
  
  // 加载当前头像的数据
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(currentAvatarId));
  
  // 当 profile 变化时自动保存到 localStorage
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);
  
  // 获取当前头像信息
  const avatar = STAR_AVATARS.find(a => a.id === profile.avatarId) || STAR_AVATARS[0];
  
  // 切换头像
  const switchAvatar = useCallback((avatarId: number) => {
    // 先保存当前数据
    saveProfile(profile);
    
    // 更新当前头像 ID
    setCurrentAvatarId(avatarId);
    localStorage.setItem(CURRENT_AVATAR_KEY, avatarId.toString());
    
    // 加载新头像数据
    const newProfile = loadProfile(avatarId);
    setProfile(newProfile);
  }, [profile]);
  
  // 获取指定头像的数据（用于预览等）
  const getAvatarProfile = useCallback((avatarId: number): UserProfile | null => {
    try {
      const storageKey = getProfileKey(avatarId);
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);
  
  // 持久化保存
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);
  
  // 更新数据
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);
  
  // 增加亲密度
  const incrementIntimacy = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setProfile(prev => {
      if (prev.todayIntimacyAdded >= 5) return prev;
      return {
        ...prev,
        intimacy: Math.min(100, prev.intimacy + 1),
        todayIntimacyAdded: prev.todayIntimacyAdded + 1,
        lastLoginDate: today,
      };
    });
  }, []);
  
  // 使用食物
  const useFood = useCallback(() => {
    setProfile(prev => {
      if (prev.fullnessUsedToday >= 3) return prev;
      if (prev.foods <= 0) return prev;
      const today = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        fullness: Math.min(100, prev.fullness + 20),
        fullnessUsedToday: prev.fullnessUsedToday + 1,
        fullnessDate: today,
        foods: prev.foods - 1, // 使用后减一个
      };
    });
    return true;
  }, []);
  
  // 使用玩具
  const useToy = useCallback(() => {
    setProfile(prev => {
      if (prev.moodUsedToday >= 3) return prev;
      if (prev.toys <= 0) return prev;
      const today = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        mood: Math.min(100, prev.mood + 20),
        moodUsedToday: prev.moodUsedToday + 1,
        moodDate: today,
        toys: prev.toys - 1, // 使用后减一个
      };
    });
    return true;
  }, []);
  
  // 洗澡
  const takeBath = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setProfile(prev => ({
      ...prev,
      cleanliness: 100,
      lastBathDate: today,
    }));
  }, []);
  
  // 添加玩具
  const addToy = useCallback(() => {
    const toy = getRandomToy();
    setProfile(prev => ({
      ...prev,
      toys: prev.toys + 1,
    }));
    return toy.emoji;
  }, []);
  
  // 添加食物
  const addFood = useCallback(() => {
    const food = getRandomFood();
    setProfile(prev => ({
      ...prev,
      foods: prev.foods + 1,
    }));
    return food.emoji;
  }, []);
  
  // 检查并添加玩具（趣味闯关用）
  const checkAndAddToy = useCallback((currentPassCount: number): string | null => {
    const PASSES_NEEDED = 4;
    if (currentPassCount > 0 && currentPassCount % PASSES_NEEDED === 0) {
      return addToy();
    }
    return null;
  }, [addToy]);
  
  // 检查并添加食物（绘本闯关用）
  const checkAndAddFood = useCallback((): string | null => {
    return addFood();
  }, [addFood]);
  
  return (
    <UserContext.Provider
      value={{
        profile,
        avatar,
        updateProfile,
        incrementIntimacy,
        useFood,
        useToy,
        takeBath,
        addToy,
        addFood,
        checkAndAddToy,
        checkAndAddFood,
        switchAvatar,
        getAvatarProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

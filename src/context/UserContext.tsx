import React, { createContext, useContext, useState, useEffect } from 'react';
import { STAR_AVATARS, type STAR_AVATAR } from '../lib/starAvatars';

const STORAGE_KEY = 'star_baby_profile';

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

export interface UserProfile {
  avatarId: number;
  name: string;
  
  // 亲密度
  intimacy: number;
  lastLoginDate: string;
  todayIntimacyAdded: number;
  
  // 饱腹值
  fullness: number;
  fullnessCooldown: string;
  
  // 清洁值
  cleanliness: number;
  lastBathDate: string;
  
  // 心情值
  mood: number;
  
  // 道具
  toys: number;
  foods: number;
  
  // 累计通关次数（用于判断获得玩具条件）
  totalGamePassed: number;
}

interface UserContextType {
  profile: UserProfile;
  avatar: STAR_AVATAR;
  updateProfile: (profile: Partial<UserProfile>) => void;
  incrementIntimacy: () => void;
  useFood: () => boolean;
  useToy: () => boolean;
  takeBath: () => void;
  addToy: () => string | null;
  addFood: () => void;
  checkAndAddToy: (currentPassCount: number) => string | null;
}

const defaultProfile: UserProfile = {
  avatarId: 1,
  name: '星星',
  intimacy: 60,
  lastLoginDate: new Date().toISOString().split('T')[0],
  todayIntimacyAdded: 0,
  fullness: 100,
  fullnessCooldown: '',
  cleanliness: 100,
  lastBathDate: new Date().toISOString().split('T')[0],
  mood: 100,
  toys: 0,
  foods: 0,
  totalGamePassed: 0,
};

const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  avatar: STAR_AVATARS[0],
  updateProfile: () => {},
  incrementIntimacy: () => {},
  useFood: () => false,
  useToy: () => false,
  takeBath: () => {},
  addToy: () => null,
  addFood: () => {},
  checkAndAddToy: () => null,
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

export const UserProvider = ({ children }: UserProviderProps) => {
  const getInitialProfile = (): UserProfile => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        
        // 如果 intimacy 大于60，说明是旧数据，需要重置为60
        if (parsed.intimacy > 60) {
          const migrated: UserProfile = {
            ...defaultProfile,
            avatarId: parsed.avatarId ?? 1,
            name: parsed.name ?? '星星',
            intimacy: 60,
            lastLoginDate: today,
            todayIntimacyAdded: 0,
            fullness: parsed.fullness ?? 100,
            fullnessCooldown: today,
            cleanliness: parsed.cleanliness ?? 100,
            lastBathDate: today,
            mood: parsed.mood ?? 100,
            toys: parsed.toys ?? 0,
            foods: parsed.foods ?? 0,
            totalGamePassed: 0,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
        
        // 新数据格式，确保有所有字段
        return {
          ...defaultProfile,
          ...parsed,
          lastLoginDate: today,
          fullnessCooldown: parsed.fullnessCooldown || today,
          lastBathDate: parsed.lastBathDate || today,
          totalGamePassed: parsed.totalGamePassed || 0,
        };
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
    return defaultProfile;
  };
  
  const [profile, setProfile] = useState<UserProfile>(getInitialProfile);
  
  // 初始化后检查并纠正旧数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.intimacy > 60) {
        const corrected = { 
          ...parsed, 
          intimacy: 60,
          lastLoginDate: new Date().toISOString().split('T')[0],
          todayIntimacyAdded: 0,
          fullness: parsed.fullness ?? 100,
          fullnessCooldown: new Date().toISOString().split('T')[0],
          cleanliness: parsed.cleanness ?? 100,
          lastBathDate: new Date().toISOString().split('T')[0],
          mood: parsed.mood ?? 100,
          toys: parsed.toys ?? 0,
          foods: parsed.foods ?? 0,
          totalGamePassed: 0,
        };
        setProfile(corrected);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(corrected));
      }
    }
  }, []);

  const avatar = STAR_AVATARS.find(a => a.id === profile.avatarId) || STAR_AVATARS[0];

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // 增加亲密度
  const incrementIntimacy = () => {
    if (profile.todayIntimacyAdded >= 10) return;
    if (profile.intimacy < 100) {
      updateProfile({ 
        intimacy: Math.min(profile.intimacy + 1, 100),
        todayIntimacyAdded: profile.todayIntimacyAdded + 1
      });
    }
  };

  // 使用食物道具
  const useFood = () => {
    if (profile.foods <= 0) return false;
    if (profile.fullness >= 100) return false;
    updateProfile({
      foods: profile.foods - 1,
      fullness: Math.min(profile.fullness + 4, 100)
    });
    return true;
  };

  // 使用玩具道具
  const useToy = () => {
    if (profile.toys <= 0) return false;
    if (profile.mood >= 100) return false;
    updateProfile({
      toys: profile.toys - 1,
      mood: Math.min(profile.mood + 4, 100)
    });
    return true;
  };

  // 洗澡
  const takeBath = () => {
    if (profile.cleanliness >= 100) return;
    updateProfile({
      cleanliness: Math.min(profile.cleanliness + 5, 100),
      lastBathDate: new Date().toISOString().split('T')[0]
    });
  };

  // 增加食物（通关奖励）
  const addFood = () => {
    updateProfile({ foods: profile.foods + 1 });
  };

  // 检查并增加玩具 - 根据累计通关次数判断
  // 条件：3题获得第一个，7题获得第二个，全部通关(13题)获得第三个
  const checkAndAddToy = (currentPassCount: number): string | null => {
    const prevTotal = profile.totalGamePassed;
    const thresholds = [3, 7, 13]; // 获得玩具的门槛
    const toyCount = profile.toys;
    
    // 如果已经有3个玩具，不再获得
    if (toyCount >= 3) return null;
    
    // 检查是否达到新的门槛
    let newThreshold = null;
    for (let i = toyCount; i < thresholds.length; i++) {
      if (currentPassCount >= thresholds[i] && prevTotal < thresholds[i]) {
        newThreshold = thresholds[i];
        break;
      }
    }
    
    if (newThreshold !== null) {
      const toy = getRandomToy();
      updateProfile({ 
        toys: profile.toys + 1,
        totalGamePassed: currentPassCount
      });
      return toy.emoji;
    }
    
    // 更新累计通关次数
    if (currentPassCount > prevTotal) {
      updateProfile({ totalGamePassed: currentPassCount });
    }
    
    return null;
  };

  // 增加玩具（旧方法，保留兼容性）
  const addToy = (): string | null => {
    const toy = getRandomToy();
    updateProfile({ toys: profile.toys + 1 });
    return toy.emoji;
  };

  return (
    <UserContext.Provider value={{ 
      profile, 
      avatar, 
      updateProfile, 
      incrementIntimacy,
      useFood,
      useToy,
      takeBath,
      addToy,
      addFood,
      checkAndAddToy
    }}>
      {children}
    </UserContext.Provider>
  );
};

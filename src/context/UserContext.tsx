import React, { createContext, useContext, useState, useEffect } from 'react';
import { STAR_AVATARS, type STAR_AVATAR } from '../lib/starAvatars';

const STORAGE_KEY = 'star_baby_profile';

export interface UserProfile {
  avatarId: number;
  name: string;
  
  // 亲密度
  intimacy: number;
  lastLoginDate: string;
  todayIntimacyAdded: number;
  
  // 饱腹值
  fullness: number;
  fullnessCooldown: string; // 上次使用食物的日期
  
  // 清洁值
  cleanliness: number;
  lastBathDate: string;
  
  // 心情值
  mood: number;
  
  // 道具
  toys: number; // 心情道具（玩具）
  foods: number; // 饱腹道具（食物）
}

interface UserContextType {
  profile: UserProfile;
  avatar: STAR_AVATAR;
  updateProfile: (profile: Partial<UserProfile>) => void;
  incrementIntimacy: () => void;
  useFood: () => boolean;
  useToy: () => boolean;
  takeBath: () => void;
  addToy: () => void;
  addFood: () => void;
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
};

const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  avatar: STAR_AVATARS[0],
  updateProfile: () => {},
  incrementIntimacy: () => {},
  useFood: () => false,
  useToy: () => false,
  takeBath: () => {},
  addToy: () => {},
  addFood: () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: React.ReactNode;
}

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
          cleanliness: parsed.cleanliness ?? 100,
          lastBathDate: new Date().toISOString().split('T')[0],
          mood: parsed.mood ?? 100,
          toys: parsed.toys ?? 0,
          foods: parsed.foods ?? 0,
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

  // 增加玩具（通关奖励）
  const addToy = () => {
    updateProfile({ toys: profile.toys + 1 });
  };

  // 增加食物（通关奖励）
  const addFood = () => {
    updateProfile({ foods: profile.foods + 1 });
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
      addFood
    }}>
      {children}
    </UserContext.Provider>
  );
};

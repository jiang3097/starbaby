import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 星小宝形象数据
export const STAR_AVATARS = [
  {
    id: 1,
    name: '星星',
    color: 'from-yellow-300 to-amber-400',
    emoji: '⭐',
    image: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260505112032_161_75.jpg&nonce=5c08600b-c2eb-4594-ac95-2747a81d2ab7&project_id=7635954527711035402&sign=c2557a45ea48c67501ec91b2dca9f80dd3c0aada71da0b99aa2f07efdc9b16fb',
  },
  {
    id: 2,
    name: '月亮',
    color: 'from-blue-300 to-indigo-400',
    emoji: '🌙',
    image: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260505112035_163_75.jpg&nonce=2b2a1f35-3aac-4346-8771-9a048c1b0bc2&project_id=7635954527711035402&sign=327274929ee598d39b5fc82390a431438040db5d2492f1918cd2d5c28b3e5f0e',
  },
  {
    id: 3,
    name: '太阳',
    color: 'from-orange-300 to-red-400',
    emoji: '☀️',
    image: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-05+112106.png&nonce=3f4b6877-0974-4f53-a8f9-ac425d97ff95&project_id=7635954527711035402&sign=1e9f0593010a2c1c882fb330fd77169dcd07dedfb74dfca75a10bb12d764ff09',
  },
  {
    id: 4,
    name: '云朵',
    color: 'from-purple-300 to-pink-400',
    emoji: '☁️',
    image: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE+2026-05-05+112122.png&nonce=181579ea-6ca5-4e8a-988f-5c5e7fc5e662&project_id=7635954527711035402&sign=de6e4418a3575650d7c4bcf70e4c627a7ab575f7ca201a95422337d8409314af',
  },
];

// 存储键名
const STORAGE_KEY = 'star_baby_profile';

export interface UserProfile {
  avatarId: number;
  name: string;
  intimacy: number; // 亲密度，从60开始，上限100
}

interface UserContextType {
  profile: UserProfile;
  avatar: typeof STAR_AVATARS[0];
  updateProfile: (profile: Partial<UserProfile>) => void;
  incrementIntimacy: () => void;
}

const defaultProfile: UserProfile = {
  avatarId: 1,
  name: '星星',
  intimacy: 60,
};

const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  avatar: STAR_AVATARS[0],
  updateProfile: () => {},
  incrementIntimacy: () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return defaultProfile;
  });

  const avatar = STAR_AVATARS.find(a => a.id === profile.avatarId) || STAR_AVATARS[0];

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const incrementIntimacy = () => {
    if (profile.intimacy < 100) {
      const newIntimacy = Math.min(profile.intimacy + 1, 100);
      updateProfile({ intimacy: newIntimacy });
    }
  };

  return (
    <UserContext.Provider value={{ profile, avatar, updateProfile, incrementIntimacy }}>
      {children}
    </UserContext.Provider>
  );
};

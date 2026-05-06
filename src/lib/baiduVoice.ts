// 百度语音 TTS 服务
// 使用百度智能云语音合成 API

const BAIDU_TTS_URL = 'https://tsn.baidu.com/text2audio';
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';

// 百度语音凭证
const BAIDU_API_KEY = 'bce-v3/ALTAK-djSJGpAd4B4D0HZ4GcLYi/5d9e61a57403ab3230f2dc7c7d88041c043fd392';
const BAIDU_SECRET_KEY = '615243Abc';

// 缓存 access_token
let accessToken: string | null = null;
let tokenExpireTime: number = 0;

// 声音选项配置 - 使用百度音色
export interface BaiduVoiceOption {
  id: string;
  name: string;
  per: number;  // 百度语音音色参数
  description: string;
  rate: number;  // 语速
  pitch: number;  // 音调
}

export const BAIDU_VOICES: BaiduVoiceOption[] = [
  { id: 'duoduo', name: '朵朵童声', per: 5003, description: '活泼可爱的小女孩声音', rate: 1.1, pitch: 1.2 },
  { id: 'xiaojiao', name: '小娇甜声', per: 3, description: '甜美的年轻女声', rate: 1.0, pitch: 1.15 },
  { id: 'xiaoyan', name: '小燕女声', per: 5, description: '知性的女性声音', rate: 1.0, pitch: 1.0 },
  { id: 'xiaoyu', name: '小宇男声', per: 1, description: '温暖的男声', rate: 0.95, pitch: 1.0 },
  { id: 'ruhin', name: '如涵女声', per: 111, description: '知性的女性声音', rate: 1.0, pitch: 1.0 },
];

// 当前选中的声音
let currentVoiceId: string = 'duoduo';

// 音频引用
let currentAudio: HTMLAudioElement | null = null;

// 设置当前声音
export function setBaiduVoice(voiceId: string): void {
  const voice = BAIDU_VOICES.find(v => v.id === voiceId);
  if (voice) {
    currentVoiceId = voiceId;
    localStorage.setItem('baidu_voice_id', voiceId);
  }
}

// 获取当前声音
export function getBaiduVoice(): BaiduVoiceOption {
  return BAIDU_VOICES.find(v => v.id === currentVoiceId) || BAIDU_VOICES[0];
}

// 从 localStorage 恢复声音设置
export function initBaiduVoice(): void {
  const saved = localStorage.getItem('baidu_voice_id');
  if (saved && BAIDU_VOICES.find(v => v.id === saved)) {
    currentVoiceId = saved;
  }
}

// 获取百度 access_token
async function getAccessToken(): Promise<string | null> {
  // 如果 token 还有效，直接返回
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: BAIDU_API_KEY,
      client_secret: BAIDU_SECRET_KEY,
    });

    const response = await fetch(`${BAIDU_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      console.error('Failed to get Baidu access token');
      return null;
    }

    const data = await response.json();
    
    if (data.access_token) {
      accessToken = data.access_token;
      // 提前5分钟过期
      tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;
      return accessToken;
    }
    
    console.error('No access_token in response:', data);
    return null;
  } catch (error) {
    console.error('Error getting Baidu access token:', error);
    return null;
  }
}

// 停止当前播放
export function stopBaiduSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// 百度 TTS 朗读
export function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  // 停止之前的朗读
  stopBaiduSpeech();

  let audioElement: HTMLAudioElement | null = null;

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    currentAudio = null;
  };

  // 异步获取 token 并播放
  (async () => {
    const token = await getAccessToken();
    if (!token) {
      console.error('No access token available');
      onEnd?.();
      return;
    }

    const voice = getBaiduVoice();
    
    // 构建请求参数
    const params = new URLSearchParams({
      tex: text,
      per: voice.per.toString(),
      spd: Math.round(voice.rate * 5 + 5).toString(), // 百度语速 0-15，转换为 5-10
      pit: Math.round(voice.pitch * 50).toString(),  // 百度音调 0-75，转换为 50-75
      vol: '5',  // 音量
      aue: '3',  // 格式 mp3
      lan: 'zh',
      ctp: '1',
      cuid: `star_baby_${Date.now()}`,
      tok: token,
    });

    const audioUrl = `${BAIDU_TTS_URL}?${params.toString()}`;

    audioElement = new Audio(audioUrl);
    currentAudio = audioElement;

    audioElement.oncanplaythrough = () => {
      onStart?.();
      audioElement?.play().catch(err => {
        console.error('Audio play error:', err);
        onEnd?.();
      });
    };

    audioElement.onended = () => {
      currentAudio = null;
      onEnd?.();
    };

    audioElement.onerror = (e) => {
      console.error('Audio error:', e);
      currentAudio = null;
      onEnd?.();
    };
  })();

  return stop;
}

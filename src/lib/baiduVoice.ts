// 百度语音 TTS 服务
// 使用百度智能云语音合成 API

const BAIDU_TTS_URL = 'https://tsn.baidu.com/text2audio';
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';

// 百度语音凭证
const BAIDU_API_KEY = 'wLKn9mbXwp1fUyAVv0RufrtE';
const BAIDU_SECRET_KEY = 'iREZXzORXxH0Ee8cz7x55RtUoyNpOZ1T';

// 缓存 access_token
let accessToken: string | null = null;
let tokenExpireTime: number = 0;

// 是否使用百度 TTS
let useBaiduTTS = true;

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
      console.error('Failed to get Baidu access token, status:', response.status);
      useBaiduTTS = false;
      return null;
    }

    const data = await response.json();
    
    if (data.access_token) {
      accessToken = data.access_token;
      tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;
      useBaiduTTS = true;
      return accessToken;
    }
    
    console.error('No access_token in response:', data);
    useBaiduTTS = false;
    return null;
  } catch (error) {
    console.error('Error getting Baidu access token:', error);
    useBaiduTTS = false;
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

// 浏览器原生 TTS - 清晰自然
function nativeTTS(text: string, onStart?: () => void, onEnd?: () => void): () => void {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported');
    onEnd?.();
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  // 加载语音
  const loadVoices = () => {
    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let voices = synthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        synthesis.onvoiceschanged = () => {
          voices = synthesis.getVoices();
          resolve(voices);
        };
        setTimeout(() => resolve(synthesis.getVoices()), 1000);
      }
    });
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // 根据音色设置参数 - 清晰自然
    const voice = getBaiduVoice();
    
    if (voice.id === 'duoduo') {
      // 童声：清晰活泼
      utterance.rate = 1.1;
      utterance.pitch = 1.25;
    } else if (voice.id === 'xiaojiao') {
      // 甜美女声：清晰柔和
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
    } else if (voice.id === 'xiaoyu') {
      // 男声：清晰稳重
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
    } else {
      // 默认：清晰自然
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
    }
    
    utterance.volume = 1.0;

    // 尝试找到最好的中文声音
    const voices = synthesis.getVoices();
    const chineseVoices = voices.filter(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    );
    
    // 优先选择清晰的中文声音
    let selectedVoice = chineseVoices.find(v => {
      const name = v.name.toLowerCase();
      // 排除一些可能不清晰的
      return !name.includes('robot') && !name.includes('zephyr');
    });

    if (!selectedVoice && chineseVoices.length > 0) {
      selectedVoice = chineseVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    synthesis.speak(utterance);
  };

  loadVoices().then(() => speak());

  return () => synthesis.cancel();
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

  // 如果不使用百度 TTS，回退到原生
  if (!useBaiduTTS) {
    console.log('Using native TTS fallback');
    return nativeTTS(text, onStart, onEnd);
  }

  // 异步获取 token 并播放
  (async () => {
    const token = await getAccessToken();
    
    // 如果没有 token，回退到原生
    if (!token) {
      console.log('No Baidu token, using native TTS');
      nativeTTS(text, onStart, onEnd);
      return;
    }

    const voice = getBaiduVoice();
    
    // 构建请求参数
    const params = new URLSearchParams({
      tex: text,
      per: voice.per.toString(),
      spd: Math.round(voice.rate * 5 + 5).toString(),
      pit: Math.round(voice.pitch * 50).toString(),
      vol: '5',
      aue: '3',
      lan: 'zh',
      ctp: '1',
      cuid: `star_baby_${Date.now()}`,
      tok: token,
    });

    const audioUrl = `${BAIDU_TTS_URL}?${params.toString()}`;

    try {
      audioElement = new Audio(audioUrl);
      currentAudio = audioElement;

      audioElement.oncanplaythrough = () => {
        console.log('Audio ready, playing...');
        onStart?.();
        audioElement?.play().catch(err => {
          console.error('Audio play error:', err);
          // 回退到原生 TTS
          nativeTTS(text, onStart, onEnd);
        });
      };

      audioElement.onended = () => {
        console.log('Audio ended');
        currentAudio = null;
        onEnd?.();
      };

      audioElement.onerror = (e) => {
        console.error('Audio error:', e);
        currentAudio = null;
        // 回退到原生 TTS
        nativeTTS(text, onStart, onEnd);
      };
    } catch (err) {
      console.error('Error creating audio:', err);
      // 回退到原生 TTS
      nativeTTS(text, onStart, onEnd);
    }
  })();

  return stop;
}

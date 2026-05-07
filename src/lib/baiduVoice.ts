// 百度语音 TTS 服务
// 使用百度智能云语音合成 API - 直接方式

const BAIDU_TTS_URL = 'http://tsn.baidu.com/text2audio';

// 百度语音凭证
const BAIDU_API_KEY = 'wLKn9mbXwp1fUyAVv0RufrtE';
const BAIDU_SECRET_KEY = 'iREZXzORXxH0Ee8cz7x55RtUoyNpOZ1T';

// Token缓存
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// 声音选项配置
export interface BaiduVoiceOption {
  id: string;
  name: string;
  per: number;
  description: string;
  rate: number;
  pitch: number;
}

export const BAIDU_VOICES: BaiduVoiceOption[] = [
  { id: 'duoduo', name: '朵朵童声', per: 5003, description: '活泼可爱的小女孩声音', rate: 5, pitch: 5 },
  { id: 'xiaofeng', name: '小峰男声', per: 5004, description: '温暖的男声', rate: 5, pitch: 5 },
  { id: 'xiaomi', name: '小秘女声', per: 106, description: '甜美的女声', rate: 5, pitch: 5 },
  { id: 'xiaotong', name: '小童童声', per: 110, description: '可爱的小朋友声音', rate: 5, pitch: 5 },
  { id: 'ruhin', name: '如涵女声', per: 111, description: '知性的女性声音', rate: 5, pitch: 5 },
  { id: 'xiaoyu', name: '度小宇男声', per: 1, description: '标准的男声', rate: 5, pitch: 5 },
  { id: 'xiaojiao', name: '度小娇女声', per: 3, description: '甜美的女声', rate: 5, pitch: 5 },
];

let currentVoiceId: string = 'duoduo';
let currentAudio: HTMLAudioElement | null = null;

export function setBaiduVoice(voiceId: string): void {
  const voice = BAIDU_VOICES.find(v => v.id === voiceId);
  if (voice) {
    currentVoiceId = voiceId;
    localStorage.setItem('baidu_voice_id', voiceId);
  }
}

export function getBaiduVoice(): BaiduVoiceOption {
  return BAIDU_VOICES.find(v => v.id === currentVoiceId) || BAIDU_VOICES[0];
}

export function initBaiduVoice(): void {
  const saved = localStorage.getItem('baidu_voice_id');
  if (saved && BAIDU_VOICES.find(v => v.id === saved)) {
    currentVoiceId = saved;
  }
}

// 获取 Token - 使用代理方式
async function getAccessToken(): Promise<string | null> {
  // 检查缓存
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // 使用百度语音服务获取token的接口
  // 注意：这个接口在浏览器中可能受限
  return new Promise((resolve) => {
    // 尝试使用 fetch
    fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`, {
      method: 'GET',
      mode: 'cors',
    })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
        resolve(data.access_token);
      } else {
        resolve(null);
      }
    })
    .catch(() => {
      // CORS 失败，使用备用方案
      resolve(null);
    });
  });
}

export function stopBaiduSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 浏览器原生 TTS - 优化版
function nativeTTS(text: string, onStart?: () => void, onEnd?: () => void): () => void {
  console.log('使用浏览器原生 TTS');

  if (!('speechSynthesis' in window)) {
    console.warn('浏览器不支持 TTS');
    onEnd?.();
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  
  const voice = getBaiduVoice();
  // 根据音色调整参数
  if (voice.id === 'duoduo' || voice.id === 'xiaotong') {
    utterance.rate = 1.15;
    utterance.pitch = 1.25;
  } else if (voice.id === 'xiaojiao' || voice.id === 'xiaomi') {
    utterance.rate = 1.1;
    utterance.pitch = 1.15;
  } else {
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
  }
  utterance.volume = 1.0;

  // 尝试选择中文女声
  const voices = synthesis.getVoices();
  const chineseVoice = voices.find(v => 
    (v.lang.includes('zh') || v.lang.includes('CN')) && 
    !v.name.toLowerCase().includes('male')
  );
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  synthesis.speak(utterance);
  return () => synthesis.cancel();
}

// 百度 TTS - 尝试获取token后调用
export function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('尝试百度 TTS:', text.substring(0, 30));

  stopBaiduSpeech();

  let audioElement: HTMLAudioElement | null = null;

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    stopBaiduSpeech();
  };

  // 尝试获取token
  getAccessToken().then(token => {
    if (!token) {
      console.log('无法获取百度 Token，使用原生 TTS');
      nativeTTS(text, onStart, onEnd);
      return;
    }

    const voice = getBaiduVoice();
    console.log('使用百度音色:', voice.name);

    // 构建请求 URL
    const params = new URLSearchParams({
      tex: text,
      per: voice.per.toString(),
      spd: voice.rate.toString(),
      pit: voice.pitch.toString(),
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
        console.log('百度TTS播放中');
        onStart?.();
        audioElement?.play().catch(() => {
          nativeTTS(text, onStart, onEnd);
        });
      };

      audioElement.onended = () => {
        currentAudio = null;
        onEnd?.();
      };

      audioElement.onerror = () => {
        console.log('百度TTS失败，使用原生');
        currentAudio = null;
        nativeTTS(text, onStart, onEnd);
      };
    } catch {
      nativeTTS(text, onStart, onEnd);
    }
  });

  return stop;
}

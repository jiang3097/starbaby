// 百度语音 TTS 服务
// 使用百度智能云语音合成 API

const BAIDU_TTS_URL = 'http://tsn.baidu.com/text2audio';
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';

// 百度语音凭证
const BAIDU_API_KEY = 'wLKn9mbXwp1fUyAVv0RufrtE';
const BAIDU_SECRET_KEY = 'iREZXzORXxH0Ee8cz7x55RtUoyNpOZ1T';

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
  // 精品音库音色
  { id: 'duoduo', name: '朵朵童声', per: 5003, description: '活泼可爱的小女孩声音', rate: 5, pitch: 5 },
  { id: 'xiaofeng', name: '小峰男声', per: 5004, description: '温暖的男声', rate: 5, pitch: 5 },
  { id: 'xiaomi', name: '小秘女声', per: 106, description: '甜美的女声', rate: 5, pitch: 5 },
  { id: 'xiaotong', name: '小童童声', per: 110, description: '可爱的小朋友声音', rate: 5, pitch: 5 },
  { id: 'ruhin', name: '如涵女声', per: 111, description: '知性的女性声音', rate: 5, pitch: 5 },
  // 基础音库音色
  { id: 'xiaoyu', name: '度小宇男声', per: 1, description: '标准的男声', rate: 5, pitch: 5 },
  { id: 'xiaojiao', name: '度小娇女声', per: 3, description: '甜美的女声', rate: 5, pitch: 5 },
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

  console.log('正在获取百度 access token...');

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: BAIDU_API_KEY,
      client_secret: BAIDU_SECRET_KEY,
    });

    const response = await fetch(`${BAIDU_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
    });

    console.log('Token 响应状态:', response.status);

    if (!response.ok) {
      console.error('获取 Token 失败, 状态:', response.status);
      const text = await response.text();
      console.error('响应内容:', text);
      return null;
    }

    const data = await response.json();
    console.log('Token 响应数据:', data);
    
    if (data.access_token) {
      accessToken = data.access_token;
      tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;
      console.log('获取 Token 成功!');
      return accessToken;
    }
    
    console.error('响应中没有 access_token:', data);
    return null;
  } catch (error) {
    console.error('获取 Token 出错:', error);
    return null;
  }
}

// 停止当前播放
export function stopBaiduSpeech(): void {
  console.log('停止百度语音播放');
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // 同时停止浏览器 TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 浏览器原生 TTS
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
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    console.log('原生 TTS 开始');
    onStart?.();
  };
  utterance.onend = () => {
    console.log('原生 TTS 结束');
    onEnd?.();
  };
  utterance.onerror = (e) => {
    console.error('原生 TTS 错误:', e);
    onEnd?.();
  };

  synthesis.speak(utterance);
  return () => synthesis.cancel();
}

// 百度 TTS 朗读
export function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('百度 TTS 朗读:', text.substring(0, 50));

  // 停止之前的朗读
  stopBaiduSpeech();

  let audioElement: HTMLAudioElement | null = null;

  const stop = () => {
    console.log('停止百度 TTS');
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    currentAudio = null;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 异步获取 token 并播放
  (async () => {
    const token = await getAccessToken();
    
    if (!token) {
      console.log('没有 Token，使用原生 TTS');
      nativeTTS(text, onStart, onEnd);
      return;
    }

    const voice = getBaiduVoice();
    console.log('使用音色:', voice.name, 'per:', voice.per);
    
    // 构建请求参数
    const params = new URLSearchParams({
      tex: text,
      per: voice.per.toString(),
      spd: voice.rate.toString(),  // 语速 0-15，默认5
      pit: voice.pitch.toString(),  // 音调 0-15，默认5
      vol: '5',  // 音量 0-15
      aue: '3',  // 格式 mp3
      lan: 'zh',
      ctp: '1',
      cuid: `star_baby_${Date.now()}`,
      tok: token,
    });

    const audioUrl = `${BAIDU_TTS_URL}?${params.toString()}`;
    console.log('百度 TTS URL:', audioUrl.substring(0, 100) + '...');

    try {
      audioElement = new Audio(audioUrl);
      currentAudio = audioElement;

      audioElement.oncanplaythrough = () => {
        console.log('音频准备就绪，开始播放');
        onStart?.();
        audioElement?.play().then(() => {
          console.log('音频播放中');
        }).catch(err => {
          console.error('音频播放失败:', err);
          nativeTTS(text, onStart, onEnd);
        });
      };

      audioElement.onended = () => {
        console.log('音频播放结束');
        currentAudio = null;
        onEnd?.();
      };

      audioElement.onerror = (e) => {
        console.error('音频加载错误:', e);
        currentAudio = null;
        console.log('回退到原生 TTS');
        nativeTTS(text, onStart, onEnd);
      };
    } catch (err) {
      console.error('创建音频元素失败:', err);
      nativeTTS(text, onStart, onEnd);
    }
  })();

  return stop;
}

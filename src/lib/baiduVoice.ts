// 百度语音 TTS 服务
// 使用百度智能云语音合成 API - 直接鉴权方式

const BAIDU_TTS_URL = 'http://tsn.baidu.com/text2audio';

// 百度语音凭证
const BAIDU_API_KEY = 'wLKn9mbXwp1fUyAVv0RufrtE';
const BAIDU_SECRET_KEY = 'iREZXzORXxH0Ee8cz7x55RtUoyNpOZ1T';

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

// 获取百度 access_token - 使用 JSONP 方式避免 CORS
function getBaiduToken(callback: (token: string | null) => void): void {
  // 使用 JSONP 方式获取 token
  const callbackName = 'baiduToken_' + Date.now();
  
  // @ts-ignore
  window[callbackName] = (data: any) => {
    if (data.access_token) {
      callback(data.access_token);
    } else {
      console.error('获取 Token 失败:', data);
      callback(null);
    }
    delete (window as any)[callbackName];
    document.body.removeChild(script);
  };

  const script = document.createElement('script');
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: BAIDU_API_KEY,
    client_secret: BAIDU_SECRET_KEY,
    callback: callbackName,
  });
  
  script.src = `https://aip.baidubce.com/oauth/2.0/token?${params.toString()}`;
  script.onerror = () => {
    console.error('JSONP 获取 Token 失败');
    callback(null);
    delete (window as any)[callbackName];
    document.body.removeChild(script);
  };
  
  document.body.appendChild(script);
}

// 停止当前播放
export function stopBaiduSpeech(): void {
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
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  synthesis.speak(utterance);
  return () => synthesis.cancel();
}

// 百度 TTS 朗读
export function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('百度 TTS 朗读:', text.substring(0, 30));

  // 停止之前的朗读
  stopBaiduSpeech();

  let audioElement: HTMLAudioElement | null = null;

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    stopBaiduSpeech();
  };

  // 先获取 token
  getBaiduToken((token) => {
    if (!token) {
      console.log('没有 Token，使用原生 TTS');
      nativeTTS(text, onStart, onEnd);
      return;
    }

    const voice = getBaiduVoice();
    console.log('使用百度音色:', voice.name, 'per:', voice.per);

    // 构建请求参数
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

      // 由于是 http URL，需要设置 crossOrigin
      audioElement.crossOrigin = 'anonymous';

      audioElement.oncanplaythrough = () => {
        console.log('音频准备就绪，开始播放');
        onStart?.();
        audioElement?.play().catch(err => {
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
  });

  return stop;
}

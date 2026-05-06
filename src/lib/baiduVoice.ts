// 百度语音服务
// API文档: https://cloud.baidu.com/doc/SPEECH/TTS-API.html

const BAIDU_CONFIG = {
  appId: '34f45afe42414594b95958ca1a212c3a',
  apiKey: 'bce-v3/ALTAK-djSJGpAd4B4D0HZ4GcLYi/5d9e61a57403ab3230f2dc7c7d88041c043fd392',
  secretKey: '615243Abc',
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  ttsUrl: 'https://tsn.baidu.com/text2audio',
  asrUrl: 'https://vop.baidu.com/server_api',
};

// 获取access token
let accessToken: string = '';
let tokenExpireTime: number = 0;

export async function getAccessToken(): Promise<string> {
  // 如果token未过期，直接返回
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }

  try {
    const response = await fetch(
      `${BAIDU_CONFIG.tokenUrl}?grant_type=client_credentials&client_id=${BAIDU_CONFIG.apiKey}&client_secret=${BAIDU_CONFIG.secretKey}`,
      { method: 'POST' }
    );
    const data = await response.json();
    
    if (data.access_token) {
      accessToken = data.access_token;
      // token有效期通常是30天，这里提前1小时过期
      tokenExpireTime = Date.now() + (data.expires_in - 3600) * 1000;
      return accessToken;
    }
    
    throw new Error(data.error || 'Failed to get access token');
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// 百度TTS音色列表
export const BAIDU_VOICES = {
  // 度小美 - 年轻女性，清晰自然（默认推荐用于儿童场景）
  xiaomei: { id: 0, name: '小美', desc: '年轻女声，清晰自然' },
  // 度小宇 - 年轻男性
  xiaoyu: { id: 1, name: '小宇', desc: '年轻男声' },
  // 度小娇 - 女性，温柔
  xiaojiao: { id: 3, name: '小娇', desc: '温柔女声' },
  // 度米朵 - 女性，童声，俏皮可爱（推荐！）
  duxiaoduo: { id: 111, name: '朵朵', desc: '儿童童声，俏皮可爱' },
  // 度小文 - 男性，儿童
  xiaowen: { id: 5, name: '小文', desc: '儿童男声' },
  // 度小新 - 男性，儿童
  xiaoxin: { id: 6, name: '小新', desc: '儿童男声' },
  // 度小杰 - 男性，儿童
  xiaojie: { id: 7, name: '小杰', desc: '儿童男声' },
  // 度琪琪 - 女性，儿童
  qiqi: { id: 110, name: '琪琪', desc: '儿童女声' },
  // 度小乐 - 男性
  xiaole: { id: 9, name: '小乐', desc: '男声' },
  // 度丫丫 - 女性
  yaya: { id: 10, name: '丫丫', desc: '女声' },
};

// 当前选中的音色
let currentVoiceId = BAIDU_VOICES.duxiaoduo.id; // 默认使用朵朵（童声）

export function setBaiduVoice(voiceId: number): void {
  currentVoiceId = voiceId;
}

export function getBaiduVoice(): number {
  return currentVoiceId;
}

// 百度TTS语音合成
export async function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<() => void> {
  onStart?.();

  try {
    const token = await getAccessToken();
    
    // 构建请求参数
    const params = new URLSearchParams({
      tex: text,
      tok: token,
      cuid: BAIDU_CONFIG.appId,
      ctp: '1',
      lan: 'zh',
      spd: '7',      // 语速0-15，默认5
      pit: '7',      // 音调0-15，默认5
      vol: '9',      // 音量0-15，默认5
      per: String(currentVoiceId),  // 选择音色
      aue: '3',      // 3为mp3格式
    });

    const url = `${BAIDU_CONFIG.ttsUrl}?${params.toString()}`;
    
    // 使用audio元素播放
    const audio = new Audio(url);
    
    audio.oncanplaythrough = () => {
      audio.play().catch(console.error);
    };
    
    audio.onended = () => {
      onEnd?.();
    };
    
    audio.onerror = (e) => {
      console.error('TTS play error:', e);
      onEnd?.();
    };

    // 返回停止函数
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  } catch (error) {
    console.error('TTS error:', error);
    onEnd?.();
    return () => {};
  }
}

// 百度ASR语音识别
let recognition: any = null;
let recognizing = false;

export interface AsrResult {
  result: string;
  confidence?: number;
}

export function initAsr(): boolean {
  // 优先使用百度ASR
  // 但由于百度ASR需要服务端代理，我们使用浏览器原生ASR作为fallback
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';
    return true;
  }
  return false;
}

export function startAsr(
  onResult: (result: AsrResult) => void,
  onError?: (error: string) => void
): boolean {
  if (!recognition || recognizing) return false;
  
  recognizing = true;
  
  recognition.onresult = (event: any) => {
    recognizing = false;
    const result = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    onResult({ result, confidence });
  };
  
  recognition.onerror = (event: any) => {
    recognizing = false;
    console.error('ASR error:', event.error);
    onError?.(event.error);
  };
  
  recognition.onend = () => {
    recognizing = false;
  };
  
  try {
    recognition.start();
    return true;
  } catch (e) {
    recognizing = false;
    return false;
  }
}

export function stopAsr(): void {
  if (recognition && recognizing) {
    recognition.stop();
    recognizing = false;
  }
}

export function isRecognizing(): boolean {
  return recognizing;
}

// 获取可用音色列表
export function getAvailableVoices(): Array<{ id: number; name: string; desc: string }> {
  return Object.entries(BAIDU_VOICES).map(([key, voice]) => ({
    id: voice.id,
    name: voice.name,
    desc: voice.desc,
  }));
}

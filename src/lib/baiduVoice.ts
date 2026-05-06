// 百度语音 TTS 服务
// 使用百度智能云语音合成 API

const BAIDU_TTS_API = 'https://tsn.baidu.com/text2audio';

// 百度语音凭证（用户提供的）
const BAIDU_APP_ID = '34f45afe42414594b95958ca1a212c3a';
const BAIDU_API_KEY = 'bce-v3/ALTAK-djSJGpAd4B4D0HZ4GcLYi/5d9e61a57403ab3230f2dc7c7d88041c043fd392';
const BAIDU_SECRET_KEY = '615243Abc';

// 缓存 access_token
let accessToken: string | null = null;
let tokenExpireTime: number = 0;

// 获取百度 access_token
async function getAccessToken(): Promise<string | null> {
  // 如果 token 还有效，直接返回
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }

  try {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}&`;
    
    const response = await fetch(tokenUrl, {
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

// 声音选项配置
export interface BaiduVoiceOption {
  id: string;
  name: string;
  per: number;  // 百度语音音色参数
  description: string;
}

// 百度TTS支持的声音选项
export const BAIDU_VOICES: BaiduVoiceOption[] = [
  { id: 'duoduo', name: '朵朵(童声)', per: 5003, description: '活泼可爱的小女孩声音' },
  { id: 'yuer', name: '月儿(女声)', per: 1, description: '甜美的年轻女声' },
  { id: 'xiaoyan', name: '小燕(女声)', per: 5, description: '标准的年轻女性声音' },
  { id: 'ruhin', name: '如涵(女声)', per: 111, description: '知性的女性声音' },
];

// 当前选中的声音，默认为朵朵（童声）
let currentVoiceId: string = 'duoduo';

// 设置当前声音
export function setBaiduVoice(voiceId: string): void {
  const voice = BAIDU_VOICES.find(v => v.id === voiceId);
  if (voice) {
    currentVoiceId = voiceId;
  }
}

// 获取当前声音
export function getBaiduVoice(): BaiduVoiceOption {
  return BAIDU_VOICES.find(v => v.id === currentVoiceId) || BAIDU_VOICES[0];
}

// 百度TTS朗读文本
export async function baiduSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<() => void> {
  const voice = getBaiduVoice();
  
  const token = await getAccessToken();
  if (!token) {
    console.error('No access token, falling back to native TTS');
    onEnd?.();
    return () => {};
  }

  onStart?.();

  // 停止之前的朗读
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // 构建请求 URL
  const params = new URLSearchParams({
    tex: text,
    per: voice.per.toString(),
    tok: token,
    cuid: `star_baby_${Date.now()}`,
    ctp: '1',
    lan: 'zh',
  });

  const url = `${BAIDU_TTS_API}?${params.toString()}`;

  return new Promise<() => void>((resolve) => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.oncanplaythrough = () => {
      audio.play().catch(err => {
        console.error('Audio play error:', err);
      });
    };

    audio.onended = () => {
      audioRef.current = null;
      onEnd?.();
      resolve(() => stop());
    };

    audio.onerror = (e) => {
      console.error('Audio error:', e);
      audioRef.current = null;
      onEnd?.();
      resolve(() => stop());
    };

    audio.src = url;
  });
}

// 音频引用
const audioRef: { current: HTMLAudioElement | null } = { current: null };

// 同步版本的朗读（使用原生 TTS 作为后备）
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  // 优先尝试使用原生浏览器 TTS（某些浏览器效果也不错）
  if ('speechSynthesis' in window) {
    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // 设置童声音效参数
    const voice = getBaiduVoice();
    if (voice.id === 'duoduo') {
      // 朵朵童声：语速稍快、音调稍高
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
    } else if (voice.id === 'yuer') {
      utterance.rate = 1.0;
      utterance.pitch = 1.15;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    // 尝试选择最佳中文女声
    const voices = synthesis.getVoices();
    const chineseFemale = voices.find(v => 
      (v.lang.includes('zh') || v.lang.includes('CN')) && 
      (v.name.includes('female') || v.name.includes('female') || v.name.includes('女'))
    );
    
    if (chineseFemale) {
      utterance.voice = chineseFemale;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    synthesis.speak(utterance);

    return () => {
      synthesis.cancel();
    };
  }

  // 如果浏览器不支持 TTS，尝试百度 TTS
  baiduSpeakText(text, onStart, onEnd);
  return () => {};
}

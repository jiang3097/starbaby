/**
 * 火山引擎 TTS 语音合成
 * 官网：https://www.volcengine.com/product/tts
 * 免费额度：1000次（3个月有效期）
 */

// 火山引擎 TTS API 配置
const VOLC_TTS_CONFIG = {
  URL: 'https://openspeech.bytedance.com/api/v1/tts',
  // 需要替换为你自己的火山引擎凭证
  // 获取方式：https://console.volcengine.com/ 搜索"语音技术" -> 应用管理 -> 查看 AppID 和 Access Token
  ACCESS_TOKEN: 'vkMSggBglPENCr3VMfMmECdwUBEac_Wy', // Access Token
  APP_ID: '1368516150',       // App ID
};

// 音色列表
export interface IVolcVoice {
  id: string;
  name: string;
  lang: string;
  desc: string;
}

export const VOLC_VOICES: IVolcVoice[] = [
  { id: 'BV703', name: '俏皮女声', lang: 'zh', desc: '清脆活泼，适合儿童' },
  { id: 'BV700', name: '清新女声', lang: 'zh', desc: '清新自然的女生声音' },
  { id: 'BV701', name: '醇厚男声', lang: 'zh', desc: '低沉有磁性的男声' },
  { id: 'BV702', name: '亲切男声', lang: 'zh', desc: '温和亲切的男声' },
];

// 缓存当前选择的音色
let currentVoice = VOLC_VOICES[2]; // 默认 BV703 俏皮女声

export const setVolcVoice = (voiceId: string) => {
  const voice = VOLC_VOICES.find(v => v.id === voiceId);
  if (voice) currentVoice = voice;
};

export const getVolcVoice = (): IVolcVoice => currentVoice;

// 检查火山引擎是否可用
export const isVolcEnabled = () => {
  return !!VOLC_TTS_CONFIG.ACCESS_TOKEN && !!VOLC_TTS_CONFIG.APP_ID;
};

/**
 * 播放音频
 * @param base64Audio base64 编码的音频数据
 * @param onEnd 播放结束回调
 */
const playAudio = (base64Audio: string, onEnd?: () => void): HTMLAudioElement => {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  audio.onended = () => onEnd?.();
  audio.onerror = () => {
    console.log('[火山TTS] 音频播放失败');
    onEnd?.();
  };
  audio.play().catch(console.error);
  return audio;
};

/**
 * 停止播放
 */
export const stopVolcAudio = (): void => {
  window._volcAudio?.pause();
  window._volcAudio = null;
};

/**
 * 火山引擎 TTS 朗读
 * 优先使用原生 TTS（兼容性更好）
 */
export const volcSpeak = (
  text: string,
  onEnd?: () => void,
  voiceId?: string
): void => {
  if (!text) {
    onEnd?.();
    return;
  }

  // 优先使用原生 TTS（跨平台兼容性最好）
  console.log('[TTS] 使用原生语音朗读:', text);
  nativeSpeakText(text, onEnd);
};

/**
 * 原生浏览器 TTS 回退
 */
export const nativeSpeakText = (text: string, onEnd?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    console.log('[火山TTS] 浏览器不支持语音合成');
    onEnd?.();
    return;
  }

  // 停止之前的朗读
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // 选择中文语音（需要等待 voices loaded）
  const selectVoice = () => {
    // 某些浏览器需要等待 voices loaded
    let voices = window.speechSynthesis.getVoices();
    
    // 如果 voices 为空，等待 voiceschanged 事件
    if (voices.length === 0) {
      const loadVoices = () => {
        voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh')) || voices[0];
        if (zhVoice) {
          utterance.voice = zhVoice;
        }
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      // 触发一次获取
      window.speechSynthesis.getVoices();
    } else {
      const zhVoice = voices.find(v => v.lang.includes('zh')) || voices[0];
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    }
  };
  
  selectVoice();

  utterance.onend = () => {
    console.log('[火山TTS] 原生 TTS 朗读完成');
    onEnd?.();
  };
  utterance.onerror = (e) => {
    console.log('[火山TTS] 原生 TTS 朗读失败:', e.error);
    onEnd?.();
  };

  console.log('[火山TTS] 使用原生 TTS 朗读');
  window.speechSynthesis.speak(utterance);
};

// 全局变量用于控制播放
declare global {
  interface Window {
    _volcAudio: HTMLAudioElement | null;
  }
}
window._volcAudio = null;

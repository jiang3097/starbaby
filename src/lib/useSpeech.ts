// 语音朗读模块 - 最终稳定版本

let isSpeaking = false;
let isPaused = false;
let utteranceRef: SpeechSynthesisUtterance | null = null;
let voicesLoaded = false;

export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

export const stopSpeak = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  isPaused = false;
  utteranceRef = null;
};

export const pauseSpeak = (): void => {
  if (window.speechSynthesis && isSpeaking && !isPaused) {
    window.speechSynthesis.pause();
    isPaused = true;
  }
};

export const resumeSpeak = (): void => {
  if (window.speechSynthesis && isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
  }
};

export const checkSpeaking = (): boolean => isSpeaking;
export const checkPaused = (): boolean => isPaused;

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// 预加载语音列表
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve([]);
      return;
    }
    
    let voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    
    const handler = () => {
      voices = synth.getVoices();
      resolve(voices);
      synth.removeEventListener('voiceschanged', handler);
    };
    
    synth.addEventListener('voiceschanged', handler);
    // 触发一次获取
    synth.getVoices();
    
    // 超时处理
    setTimeout(() => {
      const v = synth.getVoices();
      if (v.length > 0) {
        resolve(v);
      } else {
        resolve([]);
      }
      synth.removeEventListener('voiceschanged', handler);
    }, 1000);
  });
};

// 朗读
export const speakText = async (text: string, options?: SpeakOptions): Promise<void> => {
  const cleanText = removeEmoji(text);
  if (!cleanText) return;
  
  // 先停止
  stopSpeak();
  
  const synth = window.speechSynthesis;
  if (!synth) {
    console.log('[TTS] 不支持');
    options?.onError?.('不支持');
    return;
  }
  
  // 获取语音
  const voices = await loadVoices();
  console.log('[TTS] 语音数量:', voices.length);
  
  // 选择中文语音
  let selectedVoice: SpeechSynthesisVoice | null = null;
  
  for (const v of voices) {
    if (v.lang.includes('zh-CN') || v.lang.includes('zh_Hans')) {
      selectedVoice = v;
      console.log('[TTS] 选择:', v.name, v.lang);
      break;
    }
  }
  
  // 如果没找到中文，尝试其他中文
  if (!selectedVoice) {
    for (const v of voices) {
      if (v.lang.includes('zh')) {
        selectedVoice = v;
        console.log('[TTS] 选择(其他中文):', v.name);
        break;
      }
    }
  }
  
  // 如果还是没有，用第一个
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0];
    console.log('[TTS] 选择(默认):', selectedVoice.name);
  }
  
  if (voices.length === 0) {
    console.log('[TTS] 没有可用语音');
    options?.onError?.('没有语音');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  utterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;
    console.log('[TTS] 开始');
    options?.onStart?.();
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    console.log('[TTS] 结束');
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    isSpeaking = false;
    isPaused = false;
    console.log('[TTS] 错误:', e.error);
    options?.onError?.(e.error);
  };
  
  utteranceRef = utterance;
  
  // 立即播放
  synth.speak(utterance);
  console.log('[TTS] 播放中');
};

// 预加载
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices().then((voices) => {
    const zhVoices = voices.filter(v => v.lang.includes('zh'));
    console.log('[TTS] 初始化 - 总语音:', voices.length, '中文:', zhVoices.length);
  });
}

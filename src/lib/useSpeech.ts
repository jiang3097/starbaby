// 语音朗读模块 - 浏览器优先版本

// 状态
let isSpeaking = false;
let isPaused = false;
let utteranceRef: SpeechSynthesisUtterance | null = null;

// 移除 emoji
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 停止朗读
export const stopSpeak = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  isPaused = false;
  utteranceRef = null;
};

// 暂停朗读
export const pauseSpeak = (): void => {
  if (window.speechSynthesis && isSpeaking && !isPaused) {
    window.speechSynthesis.pause();
    isPaused = true;
    console.log('[TTS] 已暂停');
  }
};

// 继续朗读
export const resumeSpeak = (): void => {
  if (window.speechSynthesis && isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    console.log('[TTS] 继续朗读');
  }
};

// 检查是否正在朗读
export const checkSpeaking = (): boolean => {
  return isSpeaking;
};

// 检查是否暂停
export const checkPaused = (): boolean => {
  return isPaused;
};

// 朗读选项
export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// 获取可用语音
const getVoice = (): SpeechSynthesisVoice | null => {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  
  // 尝试获取语音（部分浏览器需要等待 voiceschanged）
  let voices = synth.getVoices();
  
  // 如果没有语音，尝试从事件中获取
  if (voices.length === 0) {
    return null;
  }
  
  // 优先选中文语音
  const zhVoice = voices.find(v => 
    v.lang.includes('zh') && (v.lang.includes('CN') || v.lang.includes('TW'))
  );
  if (zhVoice) return zhVoice;
  
  // 其次选任何中文
  const anyZhVoice = voices.find(v => v.lang.includes('zh'));
  if (anyZhVoice) return anyZhVoice;
  
  // 返回第一个
  return voices[0];
};

// 朗读文本
export const speakText = (text: string, options?: SpeakOptions): void => {
  const cleanText = removeEmoji(text);
  
  if (!cleanText) return;
  
  // 先停止之前的
  stopSpeak();
  
  if (!window.speechSynthesis) {
    console.log('[TTS] 浏览器不支持语音');
    options?.onError?.('浏览器不支持语音');
    return;
  }
  
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // 尝试获取语音
  const voice = getVoice();
  if (voice) {
    utterance.voice = voice;
    console.log('[TTS] 使用语音:', voice.name);
  } else {
    // 语音列表还没加载，监听事件
    const onVoicesChanged = () => {
      const v = getVoice();
      if (v) {
        utterance.voice = v;
        console.log('[TTS] 延迟获取语音:', v.name);
      }
      synth.removeEventListener('voiceschanged', onVoicesChanged);
    };
    synth.addEventListener('voiceschanged', onVoicesChanged);
  }
  
  utterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;
    console.log('[TTS] 开始朗读');
    options?.onStart?.();
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    console.log('[TTS] 朗读完成');
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    isSpeaking = false;
    isPaused = false;
    console.log('[TTS] 朗读错误:', e.error);
    options?.onError?.(e.error);
  };
  
  utteranceRef = utterance;
  
  // 确保在用户交互后调用
  // 部分浏览器需要延迟一点
  setTimeout(() => {
    synth.speak(utterance);
    console.log('[TTS] 已提交朗读请求');
  }, 50);
};

// 预加载语音
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const synth = window.speechSynthesis;
  
  // 立即获取一次
  synth.getVoices();
  
  // 监听语音加载
  synth.onvoiceschanged = () => {
    const voices = synth.getVoices();
    const zhVoices = voices.filter(v => v.lang.includes('zh'));
    console.log('[TTS] 已加载语音', voices.length, '个，中文', zhVoices.length, '个');
    if (zhVoices.length > 0) {
      console.log('[TTS] 中文语音:', zhVoices.map(v => v.name).join(', '));
    }
  };
}

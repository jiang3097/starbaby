// 最简化的语音朗读 - Android Chrome 专用

export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

let isSpeaking = false;
let isPaused = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const stopSpeak = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  isPaused = false;
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

export const speakText = (text: string, options?: SpeakOptions): void => {
  const cleanText = removeEmoji(text);
  if (!cleanText) return;
  
  if (!window.speechSynthesis) {
    options?.onError?.('不支持');
    return;
  }
  
  // 先停止之前的
  window.speechSynthesis.cancel();
  
  const utterance = new window.SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  utterance.pitch = 1;
  
  utterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;
    options?.onStart?.();
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    options?.onEnd?.();
  };
  
  utterance.onerror = (e) => {
    isSpeaking = false;
    isPaused = false;
    options?.onError?.(e.error);
  };
  
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

// 预加载语音
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis!.getVoices();
    console.log('[TTS] 语音包数量:', voices.length);
  };
}

// 语音朗读模块 - 保留朗读功能
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isSpeaking = false;

// 移除 emoji 的辅助函数
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 检查 TTS 是否可用
export const isTTSAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
};

// 检查语音识别是否可用
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && 
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
};

// 停止朗读
export const stopSpeak = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    currentUtterance = null;
  }
};

// 朗读文本
export const speakText = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    // 先停止之前的朗读
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(removeEmoji(text));
    utterance.lang = 'zh-CN';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    currentUtterance = utterance;
    
    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      resolve();
    };
    
    utterance.onerror = () => {
      isSpeaking = false;
      currentUtterance = null;
      resolve();
    };
    
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  });
};
// 检查是否正在朗读
export const isSpeakingNow = (): boolean => isSpeaking;

// 创建语音 hook（空实现，保留接口）
export const useSpeech = () => ({
  isListening: false,
  isSpeaking: false,
  transcript: '',
  interimTranscript: '',
  startListening: () => {},
  stopListening: () => {},
  speakText,
  stopSpeak,
  isSpeakingNow,
});

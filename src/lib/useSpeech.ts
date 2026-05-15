// 语音朗读模块 - 浏览器优先版本

// 状态
let isSpeaking = false;
let currentText = '';

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
};

// 暂停朗读
export const pauseSpeak = (): void => {
  if (window.speechSynthesis && isSpeaking) {
    window.speechSynthesis.pause();
  }
};

// 继续朗读
export const resumeSpeak = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
};

// 检查是否正在朗读
export const checkSpeaking = (): boolean => {
  return isSpeaking;
};

// 朗读文本
export const speakText = (text: string): void => {
  const cleanText = removeEmoji(text);
  
  if (!cleanText) return;
  
  // 先停止之前的
  stopSpeak();
  
  if (!window.speechSynthesis) {
    console.log('[TTS] 浏览器不支持语音');
    return;
  }
  
  currentText = cleanText;
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  // 等待语音列表加载
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // 优先选中文语音
    const zhVoice = voices.find(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
  }
  
  utterance.onstart = () => {
    isSpeaking = true;
    console.log('[TTS] 开始朗读');
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    console.log('[TTS] 朗读完成');
  };
  
  utterance.onerror = (e) => {
    isSpeaking = false;
    console.log('[TTS] 朗读错误:', e.error);
  };
  
  window.speechSynthesis.speak(utterance);
};

// 预加载语音
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis!.getVoices();
    const zhVoices = voices.filter(v => v.lang.includes('zh'));
    console.log('[TTS] 已加载语音', voices.length, '个，中文', zhVoices.length, '个');
  };
  // 立即获取一次
  window.speechSynthesis.getVoices();
}

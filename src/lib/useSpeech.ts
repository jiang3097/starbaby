// 语音朗读模块 - 优先浏览器 SpeechSynthesis API
// 移除 emoji 的辅助函数
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 状态管理
let isSpeakingState = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// 获取中文语音
function getChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  // 确保语音列表已加载
  let voices = window.speechSynthesis.getVoices();
  
  // 有些浏览器需要等待 voiceschanged 事件
  if (voices.length === 0) {
    return null;
  }
  
  // 优先选择中文语音
  return voices.find(v => 
    v.lang.includes('zh') || 
    v.lang.includes('CN') ||
    v.lang.includes('HK') ||
    v.name.toLowerCase().includes('chinese')
  ) || null;
}

// 初始化语音列表
if (typeof window !== 'undefined') {
  window.speechSynthesis?.addEventListener('voiceschanged', () => {
    console.log('[TTS] 语音列表已加载');
  });
}

export const stopSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingState = false;
    currentUtterance = null;
    console.log('[TTS] 已停止');
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

export const pauseSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      isSpeakingState = false;
      console.log('[TTS] 已暂停');
    }
  } catch (e) {
    console.error('[TTS] 暂停失败:', e);
  }
};

export const resumeSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      isSpeakingState = true;
      console.log('[TTS] 继续朗读');
    }
  } catch (e) {
    console.error('[TTS] 继续失败:', e);
  }
};

export const isSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

export const speakText = async (text: string): Promise<void> => {
  try {
    // 先停止之前的朗读
    await stopSpeak();
    
    const cleanText = removeEmoji(text);
    if (!cleanText) {
      console.log('[TTS] 文本为空，跳过');
      return;
    }
    
    console.log('[TTS] 开始朗读:', cleanText.substring(0, 50));
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('[TTS] 当前环境不支持语音合成');
      return;
    }
    
    // 创建语音合成对象
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // 尝试获取中文语音
    const chineseVoice = getChineseVoice();
    if (chineseVoice) {
      utterance.voice = chineseVoice;
      console.log('[TTS] 使用语音:', chineseVoice.name);
    } else {
      console.log('[TTS] 使用默认语音');
    }
    
    utterance.onstart = () => {
      isSpeakingState = true;
      console.log('[TTS] 开始朗读');
    };
    
    utterance.onend = () => {
      isSpeakingState = false;
      currentUtterance = null;
      console.log('[TTS] 朗读完成');
    };
    
    utterance.onerror = (e) => {
      isSpeakingState = false;
      currentUtterance = null;
      console.log('[TTS] 朗读出错:', e.error);
    };
    
    currentUtterance = utterance;
    isSpeakingState = true;
    
    // 开始朗读
    window.speechSynthesis.speak(utterance);
    
  } catch (e) {
    console.error('[TTS] 朗读失败:', e);
    isSpeakingState = false;
  }
};

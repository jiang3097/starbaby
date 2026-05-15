// 语音朗读模块 - 完整版
// 支持 Capacitor 原生 TTS 和浏览器 SpeechSynthesis

import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 状态
let browserSpeaking = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// 移除 emoji
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 检查是否在 Capacitor 环境中
const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
};

// 停止朗读
export const stopSpeak = async (): Promise<void> => {
  try {
    // 停止浏览器 TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    browserSpeaking = false;
    currentUtterance = null;
    
    // 停止 Capacitor TTS
    if (isCapacitor()) {
      try {
        await TextToSpeech.stop();
      } catch (e) {
        // 忽略
      }
    }
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

// 暂停朗读（浏览器）
export const pauseSpeak = async (): Promise<void> => {
  try {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      console.log('[TTS] 已暂停');
    }
  } catch (e) {
    console.error('[TTS] 暂停失败:', e);
  }
};

// 继续朗读（浏览器）
export const resumeSpeak = async (): Promise<void> => {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      console.log('[TTS] 继续朗读');
    }
  } catch (e) {
    console.error('[TTS] 继续失败:', e);
  }
};

// 是否正在朗读
export const isSpeaking = (): boolean => {
  if (isCapacitor()) {
    return false;
  }
  if (window.speechSynthesis) {
    return window.speechSynthesis.speaking || browserSpeaking;
  }
  return false;
};

// Capacitor 原生 TTS
const speakWithCapacitor = async (text: string): Promise<void> => {
  try {
    console.log('[TTS] 使用原生 TTS');
    
    await TextToSpeech.speak({
      text: text,
      lang: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
    
    console.log('[TTS] 原生朗读完成');
  } catch (e: any) {
    console.error('[TTS] 原生 TTS 失败:', e?.message);
    throw e;
  }
};

// 获取中文语音（浏览器）
const getChineseVoice = (): SpeechSynthesisVoice | null => {
  if (!window.speechSynthesis) return null;
  
  const voices = window.speechSynthesis.getVoices();
  
  // 优先选择中文语音
  const zhVoices = voices.filter(v => 
    v.lang.includes('zh') || 
    v.name.toLowerCase().includes('chinese')
  );
  
  if (zhVoices.length > 0) {
    return zhVoices[0];
  }
  
  // 如果没有中文，返回第一个
  return voices[0] || null;
};

// 浏览器 TTS
const speakWithBrowser = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('浏览器不支持语音'));
      return;
    }
    
    const voice = getChineseVoice();
    if (!voice) {
      reject(new Error('没有可用语音'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    currentUtterance = utterance;
    
    utterance.onstart = () => {
      browserSpeaking = true;
      console.log('[TTS] 浏览器朗读开始');
    };
    
    utterance.onend = () => {
      browserSpeaking = false;
      currentUtterance = null;
      console.log('[TTS] 浏览器朗读完成');
      resolve();
    };
    
    utterance.onerror = (e) => {
      browserSpeaking = false;
      currentUtterance = null;
      console.log('[TTS] 浏览器朗读错误:', e.error);
      reject(new Error(e.error));
    };
    
    window.speechSynthesis.speak(utterance);
  });
};

// 主朗读函数
export const speakText = async (text: string): Promise<void> => {
  const cleanText = removeEmoji(text);
  
  if (!cleanText) {
    console.log('[TTS] 文本为空');
    return;
  }
  
  // 先停止
  await stopSpeak();
  
  console.log('[TTS] 开始朗读:', cleanText.substring(0, 20));
  
  // 优先尝试 Capacitor
  if (isCapacitor()) {
    try {
      await speakWithCapacitor(cleanText);
      return;
    } catch (e) {
      console.log('[TTS] Capacitor 失败，尝试浏览器');
    }
  }
  
  // 回退到浏览器
  try {
    await speakWithBrowser(cleanText);
  } catch (e: any) {
    console.error('[TTS] 朗读失败:', e?.message);
  }
};

// 初始化
if (typeof window !== 'undefined') {
  // 预加载语音列表
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const zhVoices = voices.filter(v => v.lang.includes('zh'));
      console.log('[TTS] 加载语音:', voices.length, '个，中文:', zhVoices.length, '个');
    };
  }
}

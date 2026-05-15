// 语音朗读模块 - 同时支持浏览器和 Capacitor 原生环境
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// 移除 emoji 的辅助函数
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 判断是否在 Capacitor 原生环境
let isCapacitor = false;
try {
  isCapacitor = Capacitor.isNativePlatform();
} catch {
  isCapacitor = false;
}

// 浏览器原生 TTS
let browserUtterance: SpeechSynthesisUtterance | null = null;
let isBrowserSpeaking = false;

export const stopSpeak = async (): Promise<void> => {
  try {
    if (isCapacitor) {
      await TextToSpeech.stop();
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    isBrowserSpeaking = false;
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

// 暂停朗读
export const pauseSpeak = async (): Promise<void> => {
  try {
    if (isCapacitor) {
      await TextToSpeech.stop();
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
        isBrowserSpeaking = false;
      }
    }
    console.log('[TTS] 已暂停');
  } catch (e) {
    console.error('[TTS] 暂停失败:', e);
  }
};

// 继续朗读
export const resumeSpeak = async (): Promise<void> => {
  try {
    if (!isCapacitor) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
        isBrowserSpeaking = true;
      }
    }
    console.log('[TTS] 继续朗读');
  } catch (e) {
    console.error('[TTS] 继续失败:', e);
  }
};

// 是否正在朗读
export const isSpeaking = (): boolean => {
  if (isCapacitor) {
    return isBrowserSpeaking;
  } else {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
  }
  return false;
};

// 获取中文语音
function getChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  // 确保语音列表已加载
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // 语音未加载，等待一下再试
    return null;
  }
  
  // 优先选择中文语音
  return voices.find(v => 
    v.lang.includes('zh') || 
    v.lang.includes('CN') || 
    v.lang.includes('HK') ||
    v.name.includes('Chinese')
  ) || null;
}

export const speakText = async (text: string): Promise<void> => {
  try {
    await stopSpeak();
    
    const cleanText = removeEmoji(text);
    if (!cleanText) return;
    
    console.log('[TTS] 开始朗读:', cleanText, 'isCapacitor:', isCapacitor);
    
    if (isCapacitor) {
      // Capacitor 原生环境
      await TextToSpeech.speak({
        text: cleanText,
        lang: 'zh-CN',
        rate: 0.9,
        pitch: 1.0,
      });
      console.log('[TTS] 原生朗读完成');
    } else {
      // 浏览器环境 - 使用 SpeechSynthesis API
      if (typeof window !== 'undefined' && window.speechSynthesis) {
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
          // 如果没有中文语音，使用默认语音
          console.log('[TTS] 未找到中文语音，使用默认');
        }
        
        utterance.onend = () => {
          isBrowserSpeaking = false;
          console.log('[TTS] 浏览器朗读完成');
        };
        
        utterance.onerror = (e) => {
          isBrowserSpeaking = false;
          console.log('[TTS] 浏览器朗读出错:', e.error);
        };
        
        browserUtterance = utterance;
        isBrowserSpeaking = true;
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.log('[TTS] 浏览器不支持语音合成');
      }
    }
  } catch (e) {
    console.error('[TTS] 朗读失败:', e);
    isBrowserSpeaking = false;
  }
};

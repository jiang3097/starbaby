// 语音朗读模块 - 同时支持浏览器和 Capacitor 原生环境
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// 移除 emoji 的辅助函数
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 判断是否在 Capacitor 原生环境
const isCapacitor = Capacitor.isNativePlatform();

// 浏览器原生 TTS
let browserUtterance: SpeechSynthesisUtterance | null = null;

export const stopSpeak = async (): Promise<void> => {
  try {
    if (isCapacitor) {
      await TextToSpeech.stop();
    } else {
      // 浏览器环境
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

export const speakText = async (text: string): Promise<void> => {
  try {
    // 先停止之前的朗读
    await stopSpeak();
    
    const cleanText = removeEmoji(text);
    if (!cleanText) return;
    
    console.log('[TTS] 开始朗读:', cleanText);
    
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
        
        // 尝试选择中文语音
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
        
        browserUtterance = utterance;
        
        window.speechSynthesis.speak(utterance);
        console.log('[TTS] 浏览器朗读完成');
      } else {
        console.warn('[TTS] 浏览器不支持语音合成');
      }
    }
  } catch (e) {
    console.error('[TTS] 朗读失败:', e);
  }
};

// 浏览器语音列表加载（需要在页面加载时调用）
export const loadBrowserVoices = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // 语音列表可能异步加载
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
};

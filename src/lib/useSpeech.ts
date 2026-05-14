import { useState, useCallback, useRef } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// 检查 Capacitor 是否可用
const isCapacitorAvailable = (): boolean => {
  return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
};

// Capacitor TTS 朗读
const speakWithCapacitor = async (text: string): Promise<void> => {
  try {
    await TextToSpeech.speak({
      text,
      lang: 'zh-CN',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
    });
  } catch (e) {
    console.warn('[TTS] Capacitor TTS 失败:', e);
    throw e;
  }
};

// 停止 Capacitor TTS
const stopCapacitorTTS = async (): Promise<void> => {
  try {
    await TextToSpeech.stop();
  } catch (e) {
    console.warn('[TTS] 停止 Capacitor TTS 失败:', e);
  }
};

// 检查浏览器原生 TTS 是否可用
const isNativeTTSAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// 浏览器原生 TTS 朗读
const speakWithNativeTTS = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    // 停止之前的朗读
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      console.log('[TTS] 原生 TTS 朗读完成');
      resolve();
    };

    utterance.onerror = (e) => {
      console.error('[TTS] 原生 TTS 出错:', e);
      reject(new Error('朗读出错'));
    };

    synth.speak(utterance);
  });
};

// 主 TTS 朗读函数：优先使用 Capacitor TTS，回退到原生 TTS
export const speakText = async (text: string): Promise<void> => {
  const cleanText = removeEmoji(text).trim();
  
  if (!cleanText) {
    console.log('[TTS] 文本为空');
    return;
  }

  console.log('[TTS] 开始朗读:', cleanText);

  // 优先使用 Capacitor TTS
  if (isCapacitorAvailable()) {
    try {
      await speakWithCapacitor(cleanText);
      console.log('[TTS] 使用 Capacitor TTS 成功');
      return;
    } catch (e) {
      console.warn('[TTS] Capacitor TTS 失败，尝试原生 TTS');
    }
  }

  // 回退到浏览器原生 TTS
  if (isNativeTTSAvailable()) {
    try {
      await speakWithNativeTTS(cleanText);
      console.log('[TTS] 使用原生 TTS 成功');
      return;
    } catch (e) {
      console.error('[TTS] 原生 TTS 也失败了');
    }
  }

  console.error('[TTS] 朗读不可用');
};

// 停止朗读
export const stopSpeak = async (): Promise<void> => {
  console.log('[TTS] 停止朗读');
  
  // 优先停止 Capacitor TTS
  if (isCapacitorAvailable()) {
    await stopCapacitorTTS();
  }

  // 同时停止原生 TTS
  if (isNativeTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
};

export const isTTSAvailable = (): boolean => {
  return isCapacitorAvailable() || isNativeTTSAvailable();
};

export const isSpeechRecognitionSupported = (): boolean => false;

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, []);

  const startListening = useCallback((
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ) => {
    onError?.('语音识别已禁用，请使用手机键盘输入');
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    isSupported,
  };
};

export default useSpeech;

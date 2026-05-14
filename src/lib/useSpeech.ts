import { useState, useCallback, useRef } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// TTS 朗读函数 - 使用 Capacitor TTS
export const speakText = async (text: string): Promise<void> => {
  try {
    // 移除 emoji
    const cleanText = removeEmoji(text);
    
    await TextToSpeech.speak({
      text: cleanText,
      lang: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
    });
  } catch (error) {
    console.error('[TTS] 朗读出错:', error);
  }
};

// 停止朗读
export const stopSpeak = async (): Promise<void> => {
  try {
    await TextToSpeech.stop();
  } catch (error) {
    console.error('[TTS] 停止朗读出错:', error);
  }
};

// 检查是否支持 TTS
export const isTTSAvailable = () => {
  return true; // Capacitor TTS 始终可用
};

// 语音识别已禁用
export const isSpeechRecognitionSupported = () => false;

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  const startListening = useCallback((
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ) => {
    onError?.('语音识别已禁用，请使用键盘输入');
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    isSupported,
  };
};

export default useSpeech;

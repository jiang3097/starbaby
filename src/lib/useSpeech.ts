import { useState, useCallback, useRef, useEffect } from 'react';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// TTS 状态
let isSpeaking = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// 原生 TTS 朗读
export const speakText = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const cleanText = removeEmoji(text);
      
      // 停止之前的朗读
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      if (!('speechSynthesis' in window)) {
        console.log('[TTS] 不支持语音合成');
        resolve();
        return;
      }
      
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      
      // 尝试找中文语音
      const voices = synth.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh'));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
      
      utterance.onstart = () => {
        console.log('[TTS] 开始朗读:', cleanText);
        isSpeaking = true;
      };
      
      utterance.onend = () => {
        console.log('[TTS] 朗读完成');
        isSpeaking = false;
        currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = () => {
        console.log('[TTS] 朗读出错');
        isSpeaking = false;
        currentUtterance = null;
        resolve();
      };
      
      currentUtterance = utterance;
      synth.speak(utterance);
    } catch (e) {
      console.error('[TTS] 异常:', e);
      resolve();
    }
  });
};

// 停止朗读
export const stopSpeak = (): void => {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

export const isTTSAvailable = () => 'speechSynthesis' in window;
export const isSpeechRecognitionSupported = () => false;

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

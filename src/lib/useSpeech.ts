import { useState, useCallback, useRef, useEffect } from 'react';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// 检查浏览器是否支持语音识别
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const isSpeechSupport = isSpeechRecognitionSupported;

// 检查 TTS 是否可用
export const isTTSAvailable = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported());
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);
  const callbacksRef = useRef<{ onResult?: (text: string) => void; onFinal?: (text: string) => void; onError?: (error: string) => void }>({});
  const finalTranscriptRef = useRef('');

  // 清理函数
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // 停止录音
  const stopListening = useCallback(() => {
    console.log('[Speech] 停止录音');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // 开始录音
  const startListening = useCallback((
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onFinal?: (text: string) => void
  ) => {
    console.log('[Speech] 开始录音');
    
    callbacksRef.current = { onResult, onError, onFinal };
    
    // 先停止之前的
    cleanup();
    
    if (!isSupported) {
      console.error('[Speech] 浏览器不支持语音识别');
      onError?.('浏览器不支持语音识别');
      return;
    }
    
    // 创建识别器
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // 配置
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    
    // 开始识别
    recognition.onstart = () => {
      console.log('[Speech] 开始识别');
      setIsListening(true);
      
      // 30秒超时
      timeoutRef.current = window.setTimeout(() => {
        console.log('[Speech] 录音超时');
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      }, 30000);
    };
    
    // 结果
    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      
      // 实时显示临时结果
      if (transcript) {
        callbacksRef.current.onResult?.(transcript);
      }
      
      // 如果是最终结果，保存下来
      if (lastResult.isFinal) {
        finalTranscriptRef.current = transcript;
      }
    };
    
    // 结束 - 只有最终结果才算完成
    recognition.onend = () => {
      console.log('[Speech] 识别结束');
      setIsListening(false);
      // 只输出最终结果
      if (finalTranscriptRef.current?.trim()) {
        console.log('[Speech] 最终结果:', finalTranscriptRef.current);
        callbacksRef.current.onFinal?.(finalTranscriptRef.current);
      }
      finalTranscriptRef.current = '';
    };
    
    // 错误
    recognition.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      cleanup();
      setIsListening(false);
      callbacksRef.current.onError?.('语音识别出错');
    };
    
    // 启动
    try {
      recognition.start();
    } catch (e) {
      console.error('[Speech] 启动失败:', e);
      cleanup();
      onError?.('启动失败');
    }
  }, [cleanup, isSupported]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};

// 语音合成朗读
export const speakText = (text: string, voiceRate: number = 0.9): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!text) {
      resolve();
      return;
    }
    
    console.log('[TTS] 开始朗读:', text);
    const cleanText = removeEmoji(text);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = voiceRate;
    utterance.volume = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') && v.lang.includes('CN')) ||
                    voices.find(v => v.lang.includes('zh')) || voices[0];
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    
    utterance.onend = () => {
      console.log('[TTS] 朗读完成');
      resolve();
    };
    
    utterance.onerror = (e: any) => {
      console.error('[TTS ERROR] 朗读出错:', e.error);
      resolve();
    };
    
    window.speechSynthesis.speak(utterance);
  });
};

// 停止朗读
export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

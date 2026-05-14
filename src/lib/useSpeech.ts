import { useState, useCallback, useRef, useEffect } from 'react';

const SPEECH_KEY = 'star_baby_speech_enabled';

// 检查浏览器是否支持语音识别
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

// 导出别名
export const isSpeechSupport = isSpeechRecognitionSupported;

// 创建浏览器语音识别实例
const createSpeechRecognition = () => {
  if ('SpeechRecognition' in window) {
    return new (window as any).SpeechRecognition();
  }
  if ('webkitSpeechRecognition' in window) {
    return new (window as any).webkitSpeechRecognition();
  }
  return null;
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported());
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // 忽略
      }
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 停止录音
  const stopListening = useCallback(() => {
    console.log('[Speech] 停止录音');
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  // 开始录音
  const startListening = useCallback((onResult: (text: string) => void, onError?: (error: string) => void) => {
    console.log('[Speech] 开始录音');
    
    // 先清理之前的实例
    cleanup();
    
    // 检查支持
    if (!isSupported) {
      console.error('[Speech] 浏览器不支持语音识别');
      onError?.('浏览器不支持语音识别');
      return;
    }
    
    // 创建新的识别实例
    const recognition = createSpeechRecognition();
    if (!recognition) {
      console.error('[Speech] 创建识别器失败');
      onError?.('创建识别器失败');
      return;
    }
    
    recognitionRef.current = recognition;
    
    // 设置识别参数
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    
    // 录音超时 - 30秒
    timeoutRef.current = window.setTimeout(() => {
      console.log('[Speech] 录音超时');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }, 30000);
    
    // 开始事件
    recognition.onstart = () => {
      console.log('[Speech] 开始识别');
      setIsListening(true);
    };
    
    // 结果事件
    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      // 临时结果
      const interimText = lastResult[0].transcript;
      if (interimText) {
        console.log('[Speech] 临时结果:', interimText);
        onResult(interimText);
      }
      
      // 最终结果
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        console.log('[Speech] 最终结果:', text);
        if (text) {
          onResult(text);
        }
      }
    };
    
    // 结束事件
    recognition.onend = () => {
      console.log('[Speech] 识别结束');
      cleanup();
      setIsListening(false);
    };
    
    // 错误事件
    recognition.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      cleanup();
      setIsListening(false);
      onError?.('语音识别出错');
    };
    
    // 开始识别
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

// 语音合成朗读 - 返回 Promise
export const speakText = (text: string, voiceRate: number = 0.9): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!text) {
      resolve();
      return;
    }
    
    console.log('[TTS] 开始朗读:', text);
    
    // 取消之前的朗读
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = voiceRate;
    utterance.volume = 1;
    
    // 选择中文语音
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') && v.lang.includes('CN')) ||
                    voices.find(v => v.lang.includes('zh')) ||
                    voices[0];
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    
    utterance.onend = () => {
      console.log('[TTS] 朗读完成');
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.error('[TTS ERROR] 朗读出错:', e.error);
      reject(e);
    };
    
    window.speechSynthesis.speak(utterance);
  });
};

// 停止朗读
export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

// 检查是否正在朗读
export const isSpeaking = () => {
  return window.speechSynthesis.speaking;
};

// 导出别名供其他组件使用
export const isTTSAvailable = isSpeaking;

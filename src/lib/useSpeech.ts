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
    
    // 设置识别参数 - 持续识别，直到用户手动停止
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    
    // 录音超时 - 30秒（给用户充足时间）
    timeoutRef.current = window.setTimeout(() => {
      console.log('[Speech] 录音超时，停止');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // 忽略
        }
      }
    }, 30000);
    
    // 开始事件
    recognition.onstart = () => {
      console.log('[Speech] ===== 开始识别 =====');
      console.log('[Speech] continuous:', recognition.continuous);
      console.log('[Speech] interimResults:', recognition.interimResults);
      console.log('[Speech] lang:', recognition.lang);
      setIsListening(true);
    };
    
    // 结果事件 - 持续识别，不断更新结果
    recognition.onresult = (event: any) => {
      const results = event.results;
      // 获取所有结果的文本
      let fullText = '';
      for (let i = 0; i < results.length; i++) {
        fullText += (fullText ? ' ' : '') + results[i][0].transcript;
      }
      console.log('[Speech] 识别结果:', fullText);
      if (fullText.trim()) {
        onResult(fullText.trim());
      }
    };
    
    // 结束事件
    recognition.onend = () => {
      console.log('[Speech] ===== 识别结束 =====');
      cleanup();
      setIsListening(false);
    };
    
    // 错误事件
    recognition.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      console.error('[Speech] 错误详情:', event.message);
      console.log('[Speech] 是否支持语音识别:', isSupported);
      console.log('[Speech] 当前语言:', recognition.lang);
      
      cleanup();
      setIsListening(false);
      
      // 根据不同错误类型给出提示
      if (event.error === 'no-speech') {
        console.log('[Speech] 没有检测到语音');
        onError?.('没有检测到语音，请对着麦克风说话');
      } else if (event.error === 'not-allowed') {
        console.log('[Speech] 麦克风权限被拒绝');
        onError?.('请允许使用麦克风权限');
      } else if (event.error === 'network') {
        console.log('[Speech] 网络错误');
        onError?.('网络错误，请检查网络连接');
      } else if (event.error === 'aborted') {
        console.log('[Speech] 识别被中断');
        // aborted 不提示用户，只是正常停止
      } else {
        console.log('[Speech] 其他错误:', event.error);
        onError?.('语音识别出错，请重试');
      }
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

import { useState, useCallback, useRef } from 'react';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// 检查浏览器是否支持 TTS
export const isTTSAvailable = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// 检查浏览器是否支持语音识别
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const isSpeechSupport = isSpeechRecognitionSupported;

// TTS 朗读函数
export const speakText = (text: string, voice?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    // 移除 emoji
    const cleanText = removeEmoji(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // 选择中文语音
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = () => {
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
};

// 停止朗读
export const stopSpeak = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported());
  const recognitionRef = useRef<any>(null);
  const interimTextRef = useRef<string>('');

  // 清理函数
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    interimTextRef.current = '';
    setIsListening(false);
  }, []);

  // 停止录音
  const stopListening = useCallback(() => {
    console.log('[Speech] 停止录音');
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
    cleanup();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[Speech] 浏览器不支持语音识别');
      onError?.('浏览器不支持语音识别');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    interimTextRef.current = '';

    // 配置
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.maxAlternatives = 1;

    // 实时返回识别结果
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // 显示临时结果
      if (interimText) {
        console.log('[Speech] 临时结果:', interimText);
        interimTextRef.current = interimText;
        onResult?.(interimText);
      }

      // 最终结果
      if (finalText) {
        console.log('[Speech] 最终结果:', finalText);
        onFinal?.(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      if (event.error === 'no-speech') {
        onError?.('没有检测到声音，请再说一次');
      } else if (event.error === 'not-allowed') {
        onError?.('请允许使用麦克风');
      } else {
        onError?.('语音识别出错');
      }
      cleanup();
    };

    recognition.onend = () => {
      console.log('[Speech] 识别结束');
      setIsListening(false);
    };

    recognition.onstart = () => {
      console.log('[Speech] 开始识别');
      setIsListening(true);
    };

    // 开始识别
    try {
      recognition.start();
    } catch (err) {
      console.error('[Speech] 启动失败:', err);
      onError?.('启动语音识别失败');
      cleanup();
    }
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    cleanup,
  };
};

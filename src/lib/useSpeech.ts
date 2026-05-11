// TTS 朗读功能 - 使用云服务 API

// 检测浏览器是否支持
const isBrowserSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// 使用浏览器原生 TTS
const speakWithBrowser = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      reject(new Error('不支持'));
      return;
    }
    
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      // 出错后尝试用另一种方式
      reject(e);
    };
    
    synth.speak(utterance);
    
    // 延迟检查是否真正在播放
    setTimeout(() => {
      if (!synth.speaking) {
        reject(new Error('未开始'));
      }
    }, 200);
  });
};

// 主函数 - 优先浏览器，不行再尝试其他
export const speakText = async (text: string): Promise<void> => {
  if (!text) return;
  
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  if (!cleanText) return;
  
  // 尝试浏览器 TTS
  if (isBrowserSupported()) {
    try {
      await speakWithBrowser(cleanText);
      return;
    } catch (e) {
      console.warn('[TTS] 浏览器TTS失败:', e);
    }
  }
  
  // 如果浏览器不支持，显示文字提示
  throw new Error('朗读暂不可用');
};

// 停止
export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupport = () => isBrowserSupported();
export const isTTSAvailable = () => isBrowserSupported();

// ==================== 语音识别 ====================
let recognition: any = null;

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const startListening = (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('不支持'));
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const err = '不支持语音识别';
      onError?.(err);
      reject(new Error(err));
      return;
    }
    
    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
    }
    
    let finalText = '';
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      onError?.(event.error || '错误');
      reject(new Error(event.error));
    };
    
    recognition.onend = () => {
      if (finalText) {
        onResult(finalText);
        resolve();
      } else {
        onError?.('未识别到语音');
        reject(new Error('no-speech'));
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      onError?.('启动失败');
      reject(e);
    }
  });
};

export const stopListening = () => {
  if (recognition) {
    try {
      recognition.stop();
    } catch {}
  }
};

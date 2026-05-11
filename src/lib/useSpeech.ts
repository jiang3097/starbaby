// TTS 朗读功能 - 简洁稳定版

let synth: any = null;
let voices: any[] = [];
let voicesReady = false;

// 初始化
const init = () => {
  if (typeof window === 'undefined') return;
  
  synth = window.speechSynthesis;
  if (!synth) return;
  
  // 加载语音
  const loadVoices = () => {
    voices = synth.getVoices() || [];
    voicesReady = true;
  };
  
  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
};

// 朗读
export const speakText = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!text) {
      resolve();
      return;
    }
    
    // 清理emoji
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    
    if (!cleanText) {
      resolve();
      return;
    }
    
    if (!synth) {
      init();
    }
    
    if (!synth) {
      reject(new Error('不支持'));
      return;
    }
    
    // 等待语音加载
    const trySpeak = () => {
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      // 找中文语音
      const zhVoice = voices.find(v => v.lang.includes('zh'));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // 出错也当完成处理
      
      synth.speak(utterance);
    };
    
    if (voicesReady) {
      trySpeak();
    } else {
      // 等待语音加载
      setTimeout(() => {
        voices = synth.getVoices() || [];
        voicesReady = true;
        trySpeak();
      }, 100);
    }
  });
};

// 停止
export const stopSpeaking = () => {
  if (synth) {
    synth.cancel();
  }
};

// 检测支持
export const isSpeechSupport = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const isTTSAvailable = () => {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
};

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

// 初始化
if (typeof window !== 'undefined') {
  init();
}

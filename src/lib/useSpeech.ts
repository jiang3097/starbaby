// 浏览器原生 TTS
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];

// 加载语音列表
export const preloadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!synth) {
      resolve([]);
      return;
    }
    const loadVoices = () => {
      voices = synth!.getVoices();
      resolve(voices);
    };
    if (voices.length > 0) {
      resolve(voices);
    } else if (synth!.onvoiceschanged !== undefined) {
      synth!.onvoiceschanged = loadVoices;
      setTimeout(loadVoices, 100);
    } else {
      setTimeout(loadVoices, 100);
    }
  });
};

// 获取中文语音
export const getChineseVoice = (): SpeechSynthesisVoice | null => {
  if (!synth) return null;
  if (voices.length === 0) {
    voices = synth.getVoices();
  }
  // 优先找中文语音
  const chineseVoice = voices.find(v => 
    v.lang.includes('zh') || v.lang.includes('CN')
  );
  return chineseVoice || voices[0] || null;
};

// TTS 是否可用
export const isTTSAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
};

// 朗读文字
export const speakText = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!synth) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    // 移除 emoji
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voice = getChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    synth.speak(utterance);
  });
};

// 停止朗读
export const stopSpeaking = (): void => {
  if (synth) {
    synth.cancel();
  }
};

// 检测 TTS 支持
export const isSpeechSupport = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// ===== 语音识别 (Web Speech API) =====
let recognition: any = null;

// 初始化语音识别
const initRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
  }
  return recognition;
};

// 启动语音识别
export const startListening = (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const recog = initRecognition();
    if (!recog) {
      const err = '浏览器不支持语音识别';
      onError?.(err);
      reject(new Error(err));
      return;
    }

    let finalTranscript = '';

    recog.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
        resolve();
      }
    };

    recog.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      const errMsg = event.error === 'not-allowed' ? '请允许使用麦克风' : '识别出错';
      onError?.(errMsg);
      reject(new Error(event.error));
    };

    recog.onend = () => {
      if (finalTranscript) {
        onResult(finalTranscript);
      }
      resolve();
    };

    try {
      recog.start();
    } catch (e) {
      console.error('[Speech] 启动失败:', e);
      reject(e);
    }
  });
};

// 停止语音识别
export const stopListening = (): void => {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('[Speech] 停止失败:', e);
    }
  }
};

// 语音识别是否可用
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
};

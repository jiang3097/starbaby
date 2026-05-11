// TTS 朗读功能 - 简单可靠版本

// 浏览器原生 TTS
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// 加载语音列表
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!synth) {
      resolve([]);
      return;
    }
    
    const updateVoices = () => {
      voices = synth!.getVoices() || [];
      voicesLoaded = true;
      resolve(voices);
    };
    
    if (voicesLoaded) {
      resolve(voices);
      return;
    }
    
    const voiceList = synth!.getVoices();
    if (voiceList && voiceList.length > 0) {
      voices = voiceList;
      voicesLoaded = true;
      resolve(voices);
      return;
    }
    
    if (synth!.onvoiceschanged !== undefined) {
      synth!.onvoiceschanged = updateVoices;
    }
    
    setTimeout(updateVoices, 100);
  });
};

// 获取中文语音
const getChineseVoice = (): SpeechSynthesisVoice | null => {
  if (!synth) return null;
  
  if (voices.length === 0 && synth.getVoices) {
    const available = synth.getVoices();
    if (available && available.length > 0) {
      voices = available;
    }
  }
  
  // 优先找中文语音
  const chineseVoice = voices.find(v => 
    (v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('Hans'))
  );
  
  return chineseVoice || voices[0] || null;
};

// 朗读文字
export const speakText = (text: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!text || !text.trim()) {
      resolve();
      return;
    }
    
    // 移除 emoji
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    
    if (!cleanText) {
      resolve();
      return;
    }
    
    if (!synth) {
      console.warn('[TTS] 浏览器不支持语音合成');
      reject(new Error('不支持'));
      return;
    }
    
    try {
      // 确保语音列表加载
      if (!voicesLoaded) {
        await loadVoices();
      }
      
      // 停止之前的朗读
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      
      const voice = getChineseVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onend = () => {
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.warn('[TTS] 朗读出错:', e);
        reject(e);
      };
      
      // 开始朗读
      synth.speak(utterance);
      
      // Chrome 需要用户交互后才能播放，先触发一下
      if (!synth.paused) {
        // 已经在播放或者准备播放
      }
      
    } catch (e) {
      console.error('[TTS] 异常:', e);
      reject(e);
    }
  });
};

// 停止朗读
export const stopSpeaking = (): void => {
  if (synth) {
    synth.cancel();
  }
};

// TTS 是否可用
export const isTTSAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
};

// 检测语音合成支持
export const isSpeechSupport = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// ==================== 语音识别 (Web Speech API) ====================
let recognition: any = null;

// 检测语音识别支持
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
        resolve();
      }
    };

    recog.onerror = (event: any) => {
      console.error('[Speech] 识别错误:', event.error);
      if (event.error === 'not-allowed') {
        onError?.('请允许使用麦克风');
      } else if (event.error === 'no-speech') {
        onError?.('没有检测到语音');
      } else {
        onError?.('语音识别出错');
      }
      reject(new Error(event.error));
    };

    recog.onend = () => {
      if (!finalTranscript) {
        onError?.('未识别到语音');
      }
    };

    try {
      recog.start();
    } catch (e) {
      console.error('[Speech] 启动失败:', e);
      onError?.('启动失败');
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
      console.warn('[Speech] 停止识别失败:', e);
    }
  }
};

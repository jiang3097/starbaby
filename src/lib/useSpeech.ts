// TTS 朗读功能 - 支持浏览器原生 TTS 和第三方 TTS 降级

// ==================== 方案1: 浏览器原生 TTS ====================
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];

// 加载语音列表
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!synth) {
      resolve([]);
      return;
    }
    const updateVoices = () => {
      voices = synth!.getVoices();
      resolve(voices);
    };
    if (voices.length > 0) {
      resolve(voices);
    } else if (synth!.onvoiceschanged !== undefined) {
      synth!.onvoiceschanged = updateVoices;
      setTimeout(updateVoices, 500);
    } else {
      setTimeout(updateVoices, 500);
    }
  });
};

// 获取中文语音
const getChineseVoice = (): SpeechSynthesisVoice | null => {
  if (!synth) return null;
  if (voices.length === 0) {
    voices = synth.getVoices();
  }
  const chineseVoice = voices.find(v => 
    v.lang.includes('zh') || v.lang.includes('CN')
  );
  return chineseVoice || voices[0] || null;
};

// ==================== 方案2: ResponsiveVoice (免费TTS) ====================
// ResponsiveVoice API Key - 使用免费版本
declare global {
  interface Window {
    responsiveVoice?: {
      speak: (text: string, voice: string, options?: any) => void;
      cancel: () => void;
      isPlaying: () => boolean;
      onend: () => void;
      onerror: (e: any) => void;
    };
  }
}

// 加载 ResponsiveVoice SDK
export const loadResponsiveVoice = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.responsiveVoice) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=demo';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('加载 ResponsiveVoice 失败'));
    document.head.appendChild(script);
  });
};

// 使用 ResponsiveVoice 朗读
const speakWithResponsiveVoice = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.responsiveVoice) {
      reject(new Error('ResponsiveVoice 未加载'));
      return;
    }
    
    window.responsiveVoice.speak(text, 'Chinese Female', {
      rate: 0.9,
      pitch: 1.1,
      volume: 1,
      onend: () => resolve(),
      onerror: (e: any) => reject(e || new Error('朗读出错'))
    });
  });
};

// ==================== 方案3: 备用 - 直接返回失败 ====================

// 朗读文字 - 优先使用浏览器原生，失败后尝试 ResponsiveVoice
export const speakText = async (text: string): Promise<void> => {
  // 移除 emoji
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  
  if (!cleanText) {
    return;
  }

  // 尝试方案1: 浏览器原生 TTS
  if (synth) {
    try {
      // 确保语音列表已加载
      if (voices.length === 0) {
        await loadVoices();
      }
      
      synth.cancel();
      
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        const voice = getChineseVoice();
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.warn('[TTS] 原生TTS失败，尝试备用方案:', e);
          // 原生失败，尝试 ResponsiveVoice
          speakWithResponsiveVoice(cleanText).then(resolve).catch(reject);
        };
        
        synth.speak(utterance);
        
        // 如果 500ms 后还没开始，自动尝试备用方案
        setTimeout(() => {
          if (synth && synth.speaking) {
            // 正在朗读，不管
          } else {
            // 没有在朗读，可能失败了
            synth.cancel();
            speakWithResponsiveVoice(cleanText).then(resolve).catch(reject);
          }
        }, 500);
      });
    } catch (e) {
      console.warn('[TTS] 原生TTS异常:', e);
    }
  }
  
  // 尝试方案2: ResponsiveVoice
  try {
    await loadResponsiveVoice();
    return speakWithResponsiveVoice(cleanText);
  } catch (e) {
    console.error('[TTS] 所有TTS方案都失败了');
    throw new Error('朗读功能暂不可用');
  }
};

// 停止朗读
export const stopSpeaking = (): void => {
  if (synth) {
    synth.cancel();
  }
  if (window.responsiveVoice) {
    window.responsiveVoice.cancel();
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

// 检测语音识别支持
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
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
        reject(new Error('no-speech'));
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

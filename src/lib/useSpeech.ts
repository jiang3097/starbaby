// TTS 朗读功能 - 带调试版本

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let debugMode = true; // 调试模式

// 调试日志
const log = (...args: any[]) => {
  if (debugMode) console.log('[TTS]', ...args);
};
const error = (...args: any[]) => {
  if (debugMode) console.error('[TTS ERROR]', ...args);
};

// 加载语音列表
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    log('loadVoices 被调用');
    
    if (!synth) {
      error('synth 不存在');
      resolve([]);
      return;
    }
    
    const updateVoices = () => {
      voices = synth!.getVoices() || [];
      voicesLoaded = true;
      log('语音列表已加载:', voices.length, '个');
      voices.forEach((v, i) => log(`  ${i}: ${v.name} (${v.lang})`));
      resolve(voices);
    };
    
    if (voicesLoaded) {
      log('语音已加载过');
      resolve(voices);
      return;
    }
    
    const voiceList = synth!.getVoices();
    log('初始语音列表:', voiceList?.length || 0);
    
    if (voiceList && voiceList.length > 0) {
      voices = voiceList;
      voicesLoaded = true;
      updateVoices();
      return;
    }
    
    if (synth!.onvoiceschanged !== undefined) {
      log('绑定 voiceschanged 事件');
      synth!.onvoiceschanged = updateVoices;
    }
    
    setTimeout(() => {
      if (!voicesLoaded) {
        log('超时，更新语音列表');
        updateVoices();
      }
    }, 100);
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
  
  log('查找中文语音，当前:', voices.length);
  
  const chineseVoice = voices.find(v => 
    (v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('Hans'))
  );
  
  if (chineseVoice) {
    log('找到中文语音:', chineseVoice.name);
  } else if (voices.length > 0) {
    log('没找到中文，使用第一个:', voices[0].name);
  }
  
  return chineseVoice || voices[0] || null;
};

// 朗读文字
export const speakText = (text: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    log('speakText 被调用:', text?.substring(0, 30));
    
    if (!text || !text.trim()) {
      log('文本为空');
      resolve();
      return;
    }
    
    // 移除 emoji
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    
    if (!cleanText) {
      log('清理后文本为空');
      resolve();
      return;
    }
    
    log('清理后文本:', cleanText.substring(0, 50));
    
    if (!synth) {
      error('浏览器不支持语音合成');
      reject(new Error('不支持'));
      return;
    }
    
    try {
      // 确保语音列表加载
      if (!voicesLoaded) {
        log('语音未加载，先加载');
        await loadVoices();
      }
      
      // 停止之前的朗读
      log('停止之前的朗读');
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      
      const voice = getChineseVoice();
      if (voice) {
        utterance.voice = voice;
        log('使用语音:', voice.name);
      } else {
        error('没有可用的语音');
      }
      
      utterance.onend = () => {
        log('朗读完成');
        resolve();
      };
      
      utterance.onerror = (e) => {
        error('朗读出错:', e.error, e);
        reject(e);
      };
      
      // 开始朗读
      log('开始朗读...');
      synth.speak(utterance);
      
      // 检查是否真的在播放
      setTimeout(() => {
        log('synth.speaking:', synth?.speaking);
        log('synth.pending:', synth?.pending);
      }, 100);
      
    } catch (e) {
      error('异常:', e);
      reject(e);
    }
  });
};

// 停止朗读
export const stopSpeaking = (): void => {
  log('stopSpeaking 被调用');
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

// ==================== 语音识别 ====================
let recognition: any = null;

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

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

export const stopListening = (): void => {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.warn('[Speech] 停止识别失败:', e);
    }
  }
};

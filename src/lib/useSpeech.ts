// TTS 朗读功能 - 支持浏览器和 Capacitor 原生插件

import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 检测是否在 Capacitor 环境
const isCapacitor = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// Capacitor TTS
const speakWithCapacitor = async (text: string): Promise<void> => {
  await TextToSpeech.speak({
    text,
    lang: 'zh-CN',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0
  });
};

// 停止 Capacitor TTS
const stopCapacitor = async (): Promise<void> => {
  try {
    await TextToSpeech.stop();
  } catch {}
};

// 检测浏览器 TTS
const isBrowserTTS = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// 浏览器 TTS
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
    utterance.onerror = () => resolve(); // 出错也当完成
    
    synth.speak(utterance);
    
    setTimeout(() => {
      if (!synth.speaking) {
        reject(new Error('未开始'));
      }
    }, 200);
  });
};

// 主函数
export const speakText = async (text: string): Promise<void> => {
  if (!text) return;
  
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  if (!cleanText) return;
  
  // 优先用 Capacitor 原生 TTS
  if (isCapacitor()) {
    try {
      await speakWithCapacitor(cleanText);
      return;
    } catch (e) {
      console.warn('[TTS] Capacitor TTS 失败:', e);
    }
  }
  
  // 降级到浏览器 TTS
  if (isBrowserTTS()) {
    await speakWithBrowser(cleanText);
    return;
  }
  
  throw new Error('朗读暂不可用');
};

// 停止
export const stopSpeaking = async (): Promise<void> => {
  if (isCapacitor()) {
    await stopCapacitor();
  } else if (isBrowserTTS()) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupport = () => isCapacitor() || isBrowserTTS();
export const isTTSAvailable = () => isCapacitor() || isBrowserTTS();

// ==================== 语音识别 ====================
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// 检测语音识别支持
export const isSpeechRecognitionSupported = (): boolean => {
  if (isCapacitor()) {
    return true;
  }
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

let webRecognition: any = null;
let recognitionTimeout: any = null;
let isCurrentlyListening = false; // 防止重复启动

export const startListening = async (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  // 如果正在录音，先停止
  if (isCurrentlyListening) {
    console.log('[Speech] Already listening, stopping first...');
    await stopListening();
  }
  
  // 清除之前的超时
  if (recognitionTimeout) {
    clearTimeout(recognitionTimeout);
    recognitionTimeout = null;
  }
  
  // 设置正在录音标志
  isCurrentlyListening = true;
  
  // Capacitor 环境使用原生插件
  if (isCapacitor()) {
    try {
      try {
        await SpeechRecognition.requestPermissions();
      } catch (e) {
        console.log('Permission request skipped');
      }
      
      const result = await SpeechRecognition.start({
        language: 'zh-CN',
        maxResults: 1,
        popup: true,
      });
      
      console.log('Recognition result:', result);
      if (result.matches && result.matches.length > 0) {
        onResult(result.matches[0]);
      } else {
        onError?.('未识别到语音');
      }
      
    } catch (e: any) {
      console.error('Capacitor speech start error:', e);
      if (e?.message?.includes('cancel') || e?.message?.includes('用户取消')) {
        onError?.('用户取消');
      } else {
        onError?.(e?.message || '启动失败');
      }
    }
    return;
  }
  
  // 浏览器环境使用 Web Speech API
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    onError?.('浏览器不支持语音识别');
    return;
  }
  
  // 如果已经在识别，先停止
  if (webRecognition) {
    try {
      webRecognition.onend = null;
      webRecognition.abort();
    } catch {}
    webRecognition = null;
  }
  
  // 创建识别实例
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';
  
  let finalText = '';
  let hasResult = false;
  
  recognition.onstart = () => {
    console.log('[Speech] Started');
    // 设置10秒超时
    recognitionTimeout = setTimeout(() => {
      if (!hasResult) {
        console.log('[Speech] Timeout');
        try {
          recognition.stop();
        } catch {}
      }
    }, 10000);
  };
  
  recognition.onresult = (event: any) => {
    console.log('[Speech] Result:', event);
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
        hasResult = true;
      }
    }
    // 如果有最终结果，停止识别
    if (hasResult) {
      console.log('[Speech] Final:', finalText);
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
      }
      try {
        recognition.stop();
      } catch {}
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error('[Speech] Error:', event.error, event);
    isCurrentlyListening = false;
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
      recognitionTimeout = null;
    }
    // no-speech 不显示错误，让用户重新录音
    if (event.error === 'no-speech') {
      console.log('[Speech] No speech detected, waiting for retry');
    } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
      onError?.('请允许使用麦克风');
    } else if (event.error === 'network') {
      onError?.('网络错误，请检查网络');
    } else if (event.error === 'aborted') {
      // 用户主动停止，忽略
    } else {
      onError?.('语音识别出错');
    }
  };
  
  recognition.onend = () => {
    console.log('[Speech] Ended, hasResult:', hasResult, 'final:', finalText);
    isCurrentlyListening = false;
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
      recognitionTimeout = null;
    }
    // 如果有结果，返回结果；没有结果时不显示错误，让用户重新录音
    if (hasResult && finalText.trim()) {
      onResult(finalText.trim());
    }
    // 没有结果时不调用 onError，用户可以重新点击开始录音
  };
  
  try {
    recognition.start();
    webRecognition = recognition;
  } catch (e: any) {
    console.error('[Speech] Start failed:', e);
    isCurrentlyListening = false;
    onError?.('启动失败');
  }
};

export const stopListening = async (): Promise<void> => {
  if (recognitionTimeout) {
    clearTimeout(recognitionTimeout);
    recognitionTimeout = null;
  }
  if (isCapacitor()) {
    try {
      await SpeechRecognition.stop();
    } catch (e) {
      console.log('Stop error:', e);
    }
  } else if (webRecognition) {
    try {
      webRecognition.onend = null;
      webRecognition.abort();
    } catch {}
    webRecognition = null;
  }
  isCurrentlyListening = false;
};

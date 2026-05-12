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
      await SpeechRecognition.requestPermissions();
    } catch (e) {
      console.log("Permission request skipped");
    }
    try {
      await speakWithCapacitor(cleanText);
      return;
    } catch (e) {
      console.warn('[TTS] Capacitor TTS 失败，尝试浏览器:', e);
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
    try {
      await SpeechRecognition.requestPermissions();
    } catch (e) {
      console.log("Permission request skipped");
    }
    await stopCapacitor();
  } else if (isBrowserTTS()) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupport = () => isCapacitor() || isBrowserTTS();
export const isTTSAvailable = () => isCapacitor() || isBrowserTTS();

// ==================== 语音识别 ====================
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// 请求麦克风权限
const requestMicrophonePermission = async (): Promise<boolean> => {
  if (isCapacitor()) {
    try {
      await SpeechRecognition.requestPermissions();
    } catch (e) {
      console.log("Permission request skipped");
    }
    // Capacitor 插件会自动请求权限，这里直接返回 true
    return true;
  }
  return true;
};

// 检测语音识别支持
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window !== 'undefined' && !isCapacitor()) {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }
  return true;
};

let webRecognition: any = null;

export const startListening = async (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  // Capacitor 环境先请求权限
  if (isCapacitor()) {
    try {
      await SpeechRecognition.requestPermissions();
    } catch (e) {
      console.log("Permission request skipped");
    }
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      onError?.('请在设置中允许使用麦克风');
      return;
    }
    
    try {
      const result = await SpeechRecognition.start({
        language: 'zh-CN'
      });
      
      if (result.matches && result.matches.length > 0) {
        onResult(result.matches[0]);
      }
      return;
    } catch (e: any) {
      onError?.(e.message || '语音识别失败');
      throw e;
    }
  }
  
  // 浏览器环境使用 Web Speech API
  return new Promise((resolve, reject) => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      const err = '不支持语音识别';
      onError?.(err);
      reject(new Error(err));
      return;
    }
    
    if (!webRecognition) {
      webRecognition = new SpeechRecognitionAPI();
      webRecognition.continuous = false;
      webRecognition.interimResults = true;
      webRecognition.lang = 'zh-CN';
    }
    
    let finalText = '';
    
    webRecognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
    };
    
    webRecognition.onerror = (event: any) => {
      onError?.(event.error || '错误');
      reject(new Error(event.error));
    };
    
    webRecognition.onend = () => {
      if (finalText) {
        onResult(finalText);
        resolve();
      } else {
        onError?.('未识别到语音');
        reject(new Error('no-speech'));
      }
    };
    
    try {
      webRecognition.start();
    } catch (e) {
      onError?.('启动失败');
      reject(e);
    }
  });
};

export const stopListening = async (): Promise<void> => {
  if (isCapacitor()) {
    try {
      await SpeechRecognition.requestPermissions();
    } catch (e) {
      console.log("Permission request skipped");
    }
    try {
      await SpeechRecognition.stop();
    } catch {}
  } else if (webRecognition) {
    try {
      webRecognition.stop();
    } catch {}
  }
};

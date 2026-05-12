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
  // 浏览器环境
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

let webRecognition: any = null;
let isWebListening = false;

export const startListening = async (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  // Capacitor 环境使用原生插件
  if (isCapacitor()) {
    try {
      // 请求权限
      try {
        await SpeechRecognition.requestPermissions();
      } catch (e) {
        console.log('Permission request skipped');
      }
      
      // 开始识别并等待结果
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
      // 如果用户取消或出错，返回错误
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
    } catch (e) {
      console.log('Abort error:', e);
    }
    webRecognition = null;
  }
  
  // 创建识别实例
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true; // 启用中间结果
  recognition.lang = 'zh-CN';
  
  let finalTranscript = '';
  
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript = transcript;
      }
    }
    
    console.log('[Speech] Final:', finalTranscript, 'Interim:', interimTranscript);
  };
  
  recognition.onerror = (event: any) => {
    console.error('[Speech] Error:', event.error);
    isWebListening = false;
    
    if (event.error === 'no-speech') {
      onError?.('未识别到语音');
    } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
      onError?.('请允许使用麦克风');
    } else if (event.error === 'network') {
      onError?.('网络错误，请检查网络连接');
    } else if (event.error === 'aborted') {
      // 忽略
    } else {
      onError?.('语音识别出错');
    }
  };
  
  recognition.onend = () => {
    console.log('[Speech] Recognition ended');
    isWebListening = false;
    webRecognition = null;
    
    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    } else {
      onError?.('未识别到语音');
    }
  };
  
  recognition.onstart = () => {
    console.log('[Speech] Recognition started');
    isWebListening = true;
  };
  
  try {
    recognition.start();
    webRecognition = recognition;
  } catch (e: any) {
    console.error('[Speech] Start error:', e);
    onError?.('启动失败');
  }
};

export const stopListening = async (): Promise<void> => {
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
    isWebListening = false;
  }
};

// 语音服务 - 使用讯飞 TTS
// 支持多种音色选择

import { 
  speakText, 
  stopSpeaking, 
  nativeTTS,
  XUNFEI_VOICES, 
  setXunfeiVoice, 
  getXunfeiVoice,
  initXunfeiVoice,
  type XunfeiVoiceOption 
} from './xunfeiVoice';

// 导出讯飞声音选项供 VoiceSelector 使用
export const VOICE_PACKAGES = XUNFEI_VOICES.map(v => ({
  id: v.id,
  name: v.name,
  description: v.description,
  emoji: v.id.includes('baby') ? '👶' : 
          v.id.includes('jiuxu') ? '👴' : 
          v.id.includes('xiaoyan') || v.id.includes('xiaolu') || v.id.includes('xiaojing') ? '👩' : '👧',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}));

export interface VoicePackage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rate: number;
  pitch: number;
  volume: number;
}

export function setVoicePackage(pkg: VoicePackage): void {
  setXunfeiVoice(pkg.id);
}

export function getVoicePackage(): VoicePackage {
  const voice = getXunfeiVoice();
  return VOICE_PACKAGES.find(v => v.id === voice.id) || VOICE_PACKAGES[0];
}

// 初始化
initXunfeiVoice();

// 预加载
export function preloadVoices(): void {
  // 讯飞 TTS 不需要预加载
}

// 朗读文本
export function speak(text: string, onStart?: () => void, onEnd?: () => void): () => void {
  return speakText(text, onStart, onEnd);
}

// 停止朗读
export function stopSpeech(): void {
  stopSpeaking();
}

// 重新导出
export { speakText, stopSpeaking };

// 语音识别功能
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

let recognition: any = null;
let currentOnInterim: ((transcript: string) => void) | undefined;
let currentOnFinal: ((transcript: string) => void) | undefined;
let currentOnError: ((error: string) => void) | undefined;

export function startListening(
  onInterim?: (transcript: string) => void,
  onFinal?: (transcript: string) => void,
  onError?: (error: string) => void
): void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('浏览器不支持语音识别');
    onError?.('浏览器不支持语音识别');
    return;
  }

  currentOnInterim = onInterim;
  currentOnFinal = onFinal;
  currentOnError = onError;

  if (recognition) {
    recognition.stop();
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('语音识别开始');
  };

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript) {
      currentOnInterim?.(interimTranscript);
    }
    if (finalTranscript) {
      currentOnFinal?.(finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('语音识别错误:', event.error);
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      currentOnError?.(event.error);
    }
  };

  recognition.onend = () => {
    console.log('语音识别结束');
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        // 忽略
      }
    }
  };

  try {
    recognition.start();
  } catch (e) {
    console.error('启动语音识别失败:', e);
  }
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  currentOnInterim = undefined;
  currentOnFinal = undefined;
  currentOnError = undefined;
}

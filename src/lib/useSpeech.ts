// 语音服务 - 使用百度 TTS
// 支持多种音色选择

import { 
  baiduSpeakText, 
  stopBaiduSpeech, 
  BAIDU_VOICES, 
  setBaiduVoice, 
  getBaiduVoice, 
  initBaiduVoice,
  type BaiduVoiceOption 
} from './baiduVoice';

// 导出百度声音选项供 VoiceSelector 使用
export const VOICE_PACKAGES = BAIDU_VOICES.map(v => ({
  id: v.id,
  name: v.name,
  description: v.description,
  emoji: v.id.includes('duoduo') || v.id.includes('xiao') && !v.id.includes('yu') ? '👧' : 
          v.id.includes('yu') || v.id.includes('nan') ? '👨' : '👩',
  rate: v.rate,
  pitch: v.pitch,
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
  setBaiduVoice(pkg.id);
}

export function getVoicePackage(): VoicePackage {
  const voice = getBaiduVoice();
  return VOICE_PACKAGES.find(v => v.id === voice.id) || VOICE_PACKAGES[0];
}

// 初始化
initBaiduVoice();

// 预加载（百度 TTS 不需要预加载）
export function preloadVoices(): void {
  // 百度 TTS 不需要预加载
}

// 朗读文本
export function speakText(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void
): () => void {
  return baiduSpeakText(text, onStart, onEnd);
}

// 停止朗读
export function stopSpeaking(): void {
  stopBaiduSpeech();
}

// 开始语音识别（使用浏览器原生）
export function startListening(
  onResult: (transcript: string) => void,
  onEnd?: () => void
): () => void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    onEnd?.();
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  let finalTranscript = '';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    onResult(finalTranscript || interimTranscript);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (event.error !== 'no-speech') {
      // 静默处理错误
    }
    onEnd?.();
  };

  recognition.start();

  return () => {
    recognition.stop();
  };
}

// 停止语音识别
export function stopListening(): void {
  const recognition = (window as any)._speechRecognition;
  if (recognition) {
    recognition.stop();
  }
}

// 跟读模式
export async function followRead(
  text: string,
  onStart?: () => void,
  onSpeakEnd?: () => void,
  onListenStart?: () => void,
  onListenEnd?: (transcript: string) => void,
  onComplete?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    // 先朗读一遍
    speakText(text, onStart, () => {
      onSpeakEnd?.();
      
      // 等待一下再开始录音
      setTimeout(() => {
        onListenStart?.();
        
        const stopListeningFn = startListening(
          (transcript) => {
            onListenEnd?.(transcript);
            stopListeningFn();
            onComplete?.();
            resolve();
          },
          () => {
            onComplete?.();
            resolve();
          }
        );
      }, 500);
    });
  });
}

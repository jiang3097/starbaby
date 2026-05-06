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

// 停止朗读 - 停止所有音频
export function stopSpeaking(): void {
  // 停止百度 TTS
  stopBaiduSpeech();
  
  // 停止浏览器原生 TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 开始语音识别 - 自动检测说话结束
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
  // 自动结束：检测到用户停止说话后自动结束
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';
  
  // 空闲超时时间（毫秒）- 超过这个时间没说话就自动结束
  // 不设置这个，靠 onend 事件自动检测

  let finalTranscript = '';
  let interimTranscript = '';
  let hasResult = false;

  recognition.onresult = (event: any) => {
    interimTranscript = '';
    hasResult = true;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    // 实时返回结果（包含临时结果）
    onResult(finalTranscript || interimTranscript);
  };

  // 用户停止说话时自动触发
  recognition.onend = () => {
    // 如果有识别到内容，返回最终结果
    if (finalTranscript || hasResult) {
      onResult(finalTranscript || interimTranscript);
    }
    onEnd?.();
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    // no-speech 错误也视为正常结束
    if (event.error === 'no-speech' || event.error === 'aborted') {
      if (finalTranscript) {
        onResult(finalTranscript);
      }
      onEnd?.();
    } else {
      onEnd?.();
    }
  };

  // 开始识别
  recognition.start();

  // 最多30秒超时保护
  const timeout = setTimeout(() => {
    recognition.stop();
  }, 30000);

  // 返回停止函数
  return () => {
    clearTimeout(timeout);
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

// 语音服务 - 优化版
// 使用浏览器原生 TTS，优化参数使其听起来更可爱

// 可选的声音包
export interface VoicePackage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rate: number;    // 语速
  pitch: number;   // 音调
  volume: number;  // 音量
}

export const VOICE_PACKAGES: VoicePackage[] = [
  {
    id: 'default',
    name: '朵朵童声',
    description: '活泼可爱的小女孩声音',
    emoji: '👧',
    rate: 1.15,   // 稍快，更活泼
    pitch: 1.3,    // 较高音调，更可爱
    volume: 1.0,
  },
  {
    id: 'yuer',
    name: '月儿甜声',
    description: '甜美的小女孩声音',
    emoji: '👧',
    rate: 1.1,
    pitch: 1.25,
    volume: 1.0,
  },
  {
    id: 'male',
    name: '温暖男声',
    description: '友好的男声',
    emoji: '👨',
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
  },
  {
    id: 'elder',
    name: '爷爷声音',
    description: '慈祥的爷爷声音',
    emoji: '👴',
    rate: 0.85,
    pitch: 0.9,
    volume: 1.0,
  },
];

// 当前选中的声音包 - 默认为朵朵童声
let currentVoicePackage: VoicePackage = VOICE_PACKAGES[0];

export function setVoicePackage(pkg: VoicePackage) {
  currentVoicePackage = pkg;
}

export function getVoicePackage(): VoicePackage {
  return currentVoicePackage;
}

// 获取所有可用声音
function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.getVoices();
  }
  return window.speechSynthesis.getVoices();
}

// 预加载声音
export function preloadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.getVoices();
}

// 选择最适合的声音
function selectBestVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const pkg = currentVoicePackage;
  
  // 优先选择中文声音
  let candidates = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
  
  if (candidates.length === 0) {
    candidates = voices;
  }

  // 童声优先选择年轻女性/女声
  if (pkg.id === 'default' || pkg.id === 'yuer') {
    // 1. 优先找明确标注为女性/女声的
    let matched = candidates.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('female') || name.includes('woman') || name.includes('girl') || 
             name.includes('女') || name.includes('年轻');
    });
    if (matched) return matched;
    
    // 2. 排除男声
    matched = candidates.find(v => {
      const name = v.name.toLowerCase();
      return !name.includes('male') && !name.includes('man') && !name.includes('男');
    });
    if (matched) return matched;
  }

  // 男声优先选择男性声音
  if (pkg.id === 'male' || pkg.id === 'elder') {
    const matched = candidates.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('male') || name.includes('man') || name.includes('男');
    });
    if (matched) return matched;
  }

  // 默认返回第一个中文声音
  return candidates[0];
}

// 朗读文本
export function speakText(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void
): () => void {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported');
    onEnd?.();
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  
  // 先取消之前的朗读
  synthesis.cancel();

  // 确保语音列表已加载
  preloadVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  
  // 根据声音包设置参数
  const pkg = currentVoicePackage;
  utterance.rate = pkg.rate;
  utterance.pitch = pkg.pitch;
  utterance.volume = pkg.volume;

  // 选择声音
  const voice = selectBestVoice();
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onEnd?.();
  };

  synthesis.speak(utterance);

  // 返回停止函数
  return () => {
    synthesis.cancel();
  };
}

// 开始语音识别
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

  // 返回停止函数
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

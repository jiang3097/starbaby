import { useState, useCallback, useRef, useEffect } from 'react';

// 类型声明
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// 可选的声音包
export interface VoicePackage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  lang?: string;
  voiceName?: string;
}

export const VOICE_PACKAGES: VoicePackage[] = [
  {
    id: 'default',
    name: '标准女声',
    description: '清晰温柔的女声',
    emoji: '👩',
  },
  {
    id: 'male',
    name: '温暖男声',
    description: '友好的男声',
    emoji: '👨',
    voiceName: 'male',
  },
  {
    id: 'child',
    name: '童声',
    description: '可爱的儿童声音',
    emoji: '👧',
    voiceName: 'young',
  },
  {
    id: 'elder',
    name: '爷爷声音',
    description: '慈祥的爷爷声音',
    emoji: '👴',
    voiceName: 'elder',
  },
];

// 当前选中的声音包
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
  return window.speechSynthesis.getVoices();
}

// 选择最适合的声音
function selectBestVoice(lang: string = 'zh-CN'): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  // 根据当前声音包选择
  const pkg = currentVoicePackage;
  
  // 优先选择中文声音
  let candidates = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
  
  if (candidates.length === 0) {
    candidates = voices;
  }

  // 根据声音包名称过滤
  if (pkg.voiceName) {
    const matched = candidates.find(v => 
      v.name.toLowerCase().includes(pkg.voiceName!.toLowerCase())
    );
    if (matched) return matched;
  }

  // 默认返回第一个
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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  
  // 根据声音包调整语速和音调
  const pkg = currentVoicePackage;
  if (pkg.id === 'child') {
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
  } else if (pkg.id === 'elder') {
    utterance.rate = 0.75;
    utterance.pitch = 0.9;
  } else {
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
  }

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

  utterance.onerror = (e) => {
    console.error('TTS error:', e);
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
  onResult: (text: string) => void,
  onError?: (error: string) => void,
  onStart?: () => void
): () => void {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('STT not supported');
    onError?.('浏览器不支持语音识别');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false; // 只返回最终结果
  recognition.lang = 'zh-CN';

  let finalTranscript = '';

  recognition.onstart = () => {
    console.log('STT started');
    onStart?.();
    finalTranscript = '';
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      }
    }
  };

  recognition.onend = () => {
    console.log('STT ended, transcript:', finalTranscript);
    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('STT error:', event.error);
    onError?.(event.error);
  };

  recognition.start();

  // 返回停止函数
  return () => {
    try {
      recognition.stop();
    } catch (e) {
      // ignore
    }
  };
}

// 预加载声音
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
  }
}

// 获取中文声音数量
export function getChineseVoiceCount(): number {
  const voices = getAvailableVoices();
  return voices.filter(v => v.lang.includes('zh')).length;
}

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

// 简单的 TTS 函数
export function speakText(text: string, onEnd?: () => void): () => void {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported');
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  
  // 先取消之前的朗读
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;

  // 等待声音列表加载
  const voices = synthesis.getVoices();
  const chineseVoice = voices.find(v => v.lang.includes('zh'));
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error('TTS error:', e);
    if (onEnd) onEnd();
  };

  synthesis.speak(utterance);

  // 返回停止函数
  return () => {
    synthesis.cancel();
  };
}

// 简单的 STT 函数
export function startListening(
  onResult: (text: string) => void,
  onError?: (error: string) => void
): () => void {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('STT not supported');
    onError?.('浏览器不支持语音识别');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  let finalTranscript = '';

  recognition.onstart = () => {
    console.log('STT started');
    finalTranscript = '';
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
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

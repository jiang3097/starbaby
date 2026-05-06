import { useState, useCallback, useRef, useEffect } from 'react';
import { baiduSpeakText, initAsr, startAsr, stopAsr, isRecognizing, BAIDU_VOICES, getAvailableVoices, setBaiduVoice } from './baiduVoice';

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

// 导出百度语音接口
export { BAIDU_VOICES, getAvailableVoices, setBaiduVoice };

// 预加载声音
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

// 朗读文本 - 使用百度TTS
export function speakText(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void
): () => void {
  // 使用百度语音
  baiduSpeakText(text, onStart, onEnd);
  
  // 返回停止函数
  return () => {
    window.speechSynthesis?.cancel();
  };
}

// 停止朗读
export function stopSpeaking(): void {
  window.speechSynthesis?.cancel();
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

// 获取浏览器原生中文声音数量（用于兼容性检测）
export function getChineseVoiceCount(): number {
  if (!('speechSynthesis' in window)) return 0;
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v: any) => v.lang.includes('zh')).length;
}

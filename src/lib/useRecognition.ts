/**
 * 语音识别模块
 * 使用浏览器 Web Speech API
 */

import { useCallback, useRef, useState } from 'react';

// 语音识别类型
type RecognitionCallback = (text: string) => void;
type ErrorCallback = (error: string) => void;

// 全局变量
declare global {
  interface Window {
    _recognition: SpeechRecognition | null;
    _recordingCallback: RecognitionCallback | null;
    _recordingError: ErrorCallback | null;
  }
}

// 创建语音识别实例
const createRecognition = (): SpeechRecognition | null => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log('[语音识别] 浏览器不支持语音识别');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  recognition.onstart = () => {
    console.log('[语音识别] 开始识别');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const result = event.results[0];
    if (result.isFinal) {
      const text = result[0].transcript.trim();
      console.log('[语音识别] 识别结果:', text);
      window._recordingCallback?.(text);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('[语音识别] 错误:', event.error);
    window._recordingError?.(event.error);
  };

  recognition.onend = () => {
    console.log('[语音识别] 识别结束');
    window._recognition = null;
  };

  return recognition;
};

// 开始录音
export const startListening = (
  onResult: RecognitionCallback,
  onError?: ErrorCallback
): void => {
  // 停止之前的录音
  if (window._recognition) {
    window._recognition.stop();
  }

  const recognition = createRecognition();
  if (!recognition) {
    onError?.('浏览器不支持语音识别');
    return;
  }

  window._recognition = recognition;
  window._recordingCallback = onResult;
  window._recordingError = onError || (() => {});

  try {
    recognition.start();
  } catch (e) {
    console.error('[语音识别] 启动失败:', e);
    onError?.('启动语音识别失败');
  }
};

// 停止录音
export const stopListening = (): void => {
  if (window._recognition) {
    window._recognition.stop();
    window._recognition = null;
  }
};

// 是否正在录音
export const isListening = (): boolean => {
  return window._recognition !== null;
};

// 预加载语音
export const preloadVoices = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
};

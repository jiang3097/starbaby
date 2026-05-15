// Capacitor 原生 TTS - Android 专用

import { TextToSpeech, type TTSOptions } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

let currentSpeakText = '';
let isSpeaking = false;
let isPaused = false;
let speakInterval: ReturnType<typeof setInterval> | null = null;

export const stopSpeak = (): void => {
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop();
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  isPaused = false;
  currentSpeakText = '';
  if (speakInterval) {
    clearInterval(speakInterval);
    speakInterval = null;
  }
};

export const pauseSpeak = (): void => {
  isPaused = true;
};

export const resumeSpeak = (): void => {
  isPaused = false;
};

export const checkSpeaking = (): boolean => isSpeaking;
export const checkPaused = (): boolean => isPaused;

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export const speakText = (text: string, options?: SpeakOptions): void => {
  const cleanText = removeEmoji(text);
  if (!cleanText) return;

  // 先停止之前的
  stopSpeak();

  currentSpeakText = cleanText;
  isSpeaking = true;
  isPaused = false;
  options?.onStart?.();

  if (Capacitor.isNativePlatform()) {
    // 原生 Android 使用 TTS 插件
    const ttsOptions: TTSOptions = {
      text: cleanText,
      lang: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
    };

    TextToSpeech.speak(ttsOptions)
      .then(() => {
        // TTS 开始播放，成功
        isSpeaking = false;
        isPaused = false;
        options?.onEnd?.();
      })
      .catch((error) => {
        console.error('[TTS] 朗读出错:', error);
        isSpeaking = false;
        isPaused = false;
        options?.onError?.(error.message || '错误');
      });
  } else {
    // 浏览器使用 Web Speech API
    if (!window.speechSynthesis) {
      options?.onError?.('不支持');
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      isSpeaking = false;
      isPaused = false;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('[TTS] 朗读出错:', e.error);
      isSpeaking = false;
      isPaused = false;
      options?.onError?.(e.error);
    };

    window.speechSynthesis.speak(utterance);
  }
};

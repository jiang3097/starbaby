// 语音服务 - 使用火山引擎 TTS + 浏览器原生 TTS 回退
// 支持多种音色选择

import { 
  volcSpeak, 
  stopVolcAudio,
  VOLC_VOICES,
  setVolcVoice,
  getVolcVoice,
  isVolcEnabled,
  type IVolcVoice 
} from './volcTTS';

import {
  startListening as recStartListening,
  stopListening as recStopListening,
  isListening as recIsListening,
  preloadVoices as loadVoices,
} from './useRecognition';

// 导出火山引擎声音选项供 VoiceSelector 使用
export const VOICE_PACKAGES = VOLC_VOICES.map((v: IVolcVoice) => ({
  id: v.id,
  name: v.name,
  description: v.desc,
  emoji: v.id === 'BV700' ? '👩' : 
          v.id === 'BV701' ? '👨' :
          v.id === 'BV702' ? '👨' : '👧',
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
  setVolcVoice(pkg.id);
}

export function getVoicePackage(): VoicePackage {
  const voice = getVolcVoice();
  return VOICE_PACKAGES.find(v => v.id === voice.id) || VOICE_PACKAGES[0];
}

// 语音朗读（兼容旧接口：支持 text + onEnd 或只传 text）
export const speakText = (text: string, onEnd?: (() => void) | undefined): void => {
  if (typeof text === 'string') {
    volcSpeak(text, onEnd as (() => void) | undefined);
  }
};

// 停止朗读
export const stopSpeaking = stopVolcAudio;

// 语音识别
export const startListening = recStartListening;
export const stopListening = recStopListening;

// 预加载语音
export const preloadVoices = loadVoices;

// 初始化（无特殊初始化需求）
export const initVoice = (): void => {
  console.log('[语音] 火山引擎 TTS 初始化完成');
  console.log('[语音] 火山引擎启用状态:', isVolcEnabled() ? '已启用' : '未启用（使用原生 TTS）');
};

export const nativeTTS = (text: string, onEnd?: () => void): void => {
  volcSpeak(text, onEnd);
};

export type { IVolcVoice };

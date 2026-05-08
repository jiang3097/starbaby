// 语音服务 - 使用 Coze TTS + 火山引擎 TTS 回退
// 支持多种音色选择

import { 
  volcSpeak, 
  stopVolcAudio,
  VOLC_VOICES,
  setVolcVoice,
  getVolcVoice,
  isVolcEnabled,
  nativeSpeakText,
  type IVolcVoice 
} from './volcTTS';

import {
  cozeSpeak,
  stopCozeAudio,
  COZE_VOICES,
  setCozeVoice,
  getCozeVoice,
  isCozeTTSEnabled,
  type ICozeVoice
} from './cozeTTS';

import {
  startListening as recStartListening,
  stopListening as recStopListening,
  isListening as recIsListening,
} from './useRecognition';

// 音色包类型（用于UI展示）
export interface VoicePackage {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'coze' | 'volc';
}

// 组合所有音色包
export const VOICE_PACKAGES: VoicePackage[] = [
  // Coze 音色
  { id: 'coze_shanshan', name: '珊珊', emoji: '👧', description: '活泼可爱的女声，适合儿童', type: 'coze' },
  { id: 'coze_shanshan2', name: '闪闪', emoji: '✨', description: '清脆活泼的女孩声音', type: 'coze' },
  { id: 'coze_nvyou', name: '女朋友', emoji: '💕', description: '温柔甜美的女声', type: 'coze' },
  // 火山引擎音色
  { id: 'volc_BV703', name: '俏皮女声', emoji: '🎤', description: '清脆活泼，适合儿童', type: 'volc' },
  { id: 'volc_BV700', name: '清新女声', emoji: '🌸', description: '清新自然的女生声音', type: 'volc' },
  { id: 'volc_BV701', name: '醇厚男声', emoji: '🎸', description: '低沉有磁性的男声', type: 'volc' },
];

// 当前选中的音色包
let currentPackage = VOICE_PACKAGES[0];

// 获取音色包
export const getVoicePackage = (): VoicePackage => currentPackage;

// 设置音色包
export const setVoicePackage = (pkg: VoicePackage) => {
  currentPackage = pkg;
  if (pkg.type === 'coze') {
    // Coze 音色使用 cozeTTS
    setUseCozeTTS(true);
    setCozeVoice(pkg.id.replace('coze_', ''));
  } else {
    // 火山引擎音色
    setUseCozeTTS(false);
    setVolcVoice(pkg.id.replace('volc_', ''));
  }
};

// 当前使用的 TTS 引擎
let useCozeTTS = true; // 默认使用 Coze TTS

/**
 * 设置是否使用 Coze TTS
 */
export const setUseCozeTTS = (use: boolean) => {
  useCozeTTS = use;
};

/**
 * 检查当前 TTS 状态
 */
export const getTTSStatus = () => {
  return {
    useCozeTTS,
    cozeEnabled: isCozeTTSEnabled(),
    volcEnabled: isVolcEnabled(),
  };
};

// 语音朗读
const speakWithTTS = (text: string, onEnd?: () => void) => {
  if (useCozeTTS && isCozeTTSEnabled()) {
    cozeSpeak(text, onEnd);
  } else if (isVolcEnabled()) {
    volcSpeak(text, onEnd);
  } else {
    nativeSpeakText(text, onEnd);
  }
};

// 停止朗读
const stopCurrentTTS = () => {
  if (useCozeTTS && isCozeTTSEnabled()) {
    stopCozeAudio();
  }
  stopVolcAudio();
};

// 语音朗读（兼容旧接口：支持 text + onEnd 或只传 text）
export const speakText = (text: string, onEnd?: (() => void) | undefined): void => {
  if (typeof text === 'string') {
    speakWithTTS(text, onEnd as (() => void) | undefined);
  }
};

// 停止朗读
export const stopSpeaking = stopCurrentTTS;

// 语音识别
export const startListening = recStartListening;
export const stopListening = recStopListening;

// 预加载语音（用于 TTS）
export const preloadVoices = (): void => {
  // 预加载浏览器语音列表（用于原生 TTS 回退）
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
};

// 初始化
export const initVoice = (): void => {
  console.log('[语音] Coze TTS 启用状态:', isCozeTTSEnabled() ? '已启用' : '未启用');
  console.log('[语音] 火山引擎 TTS 启用状态:', isVolcEnabled() ? '已启用' : '未启用（使用原生 TTS）');
  console.log('[语音] 当前 TTS 引擎:', useCozeTTS ? 'Coze TTS' : '火山引擎 TTS');
};

export const nativeTTS = (text: string, onEnd?: () => void): void => {
  nativeSpeakText(text, onEnd);
};

// 导出音色列表和设置函数
export {
  VOLC_VOICES,
  setVolcVoice,
  getVolcVoice,
  COZE_VOICES,
  setCozeVoice,
  getCozeVoice,
  type IVolcVoice,
  type ICozeVoice,
};

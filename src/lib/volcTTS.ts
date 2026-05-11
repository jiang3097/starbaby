// 原生 TTS 实现（使用浏览器自带 TTS）

let voicesLoaded = false;
let voiceList: SpeechSynthesisVoice[] = [];

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (voicesLoaded && voiceList.length > 0) {
      resolve(voiceList);
      return;
    }

    const synth = window.speechSynthesis;
    
    const load = () => {
      voiceList = synth.getVoices();
      if (voiceList.length > 0) {
        voicesLoaded = true;
        resolve(voiceList);
      }
    };

    load();

    if (!voicesLoaded) {
      synth.onvoiceschanged = () => {
        load();
      };
      
      setTimeout(() => {
        if (!voicesLoaded) {
          voiceList = synth.getVoices();
          voicesLoaded = true;
          resolve(voiceList);
        }
      }, 1000);
    }
  });
};

export const isNativeTTSSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const preloadNativeVoices = async (): Promise<void> => {
  if (!isNativeTTSSupported()) return;
  await loadVoices();
};

export const nativeSpeakText = async (text: string): Promise<void> => {
  if (!isNativeTTSSupported()) {
    console.warn('[TTS] 浏览器不支持原生 TTS');
    return;
  }

  const synth = window.speechSynthesis;
  
  synth.cancel();

  await loadVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  // 选择中文语音
  const zhVoice = voiceList.find(v => 
    v.lang.includes('zh') && (v.localService || v.name.includes('Chinese'))
  ) || voiceList.find(v => v.lang.includes('zh')) || voiceList[0];
  
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('[TTS] 朗读错误:', e);
      reject(e);
    };
    
    synth.speak(utterance);
  });
};

export const stopNativeTTS = (): void => {
  if (isNativeTTSSupported()) {
    window.speechSynthesis.cancel();
  }
};

export default {
  isNativeTTSSupported,
  preloadNativeVoices,
  nativeSpeakText,
  stopNativeTTS,
};

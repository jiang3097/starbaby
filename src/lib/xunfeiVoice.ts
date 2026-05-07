// 讯飞语音 TTS 服务
// 使用讯飞开放平台 REST API

import CryptoJS from 'crypto-js';

// ============== 配置 ==============
const XF_APPID = '8fe5843b';
const XF_API_SECRET = 'YjIwNjg1Y2U2ODRiNDFiZmEyYjgzZTUy';
const XF_API_KEY = 'f0d034b0c856de0d831b8b246ae8cc29';
const XF_TTS_URL = 'https://tts-api.xfyun.cn/v2/tts';

// ============== 声音选项 ==============
export interface XunfeiVoiceOption {
  id: string;
  name: string;
  vcn: string;
  description: string;
}

export const XUNFEI_VOICES: XunfeiVoiceOption[] = [
  { id: 'aishabxuu', name: '许小宝童声', vcn: 'aisbabyxu', description: '活泼可爱的小女孩声音' },
  { id: 'xiaoyan', name: '小燕女声', vcn: 'x4_xiaoyan', description: '标准的年轻女声' },
  { id: 'xiaolu', name: '小露女声', vcn: 'x4_yezi', description: '甜美的女声' },
  { id: 'xiaojing', name: '小婧女声', vcn: 'aisjinger', description: '知性的女声' },
  { id: 'jiuxu', name: '许久男声', vcn: 'aisjiuxu', description: '温暖的男声' },
];

let currentVoiceId: string = 'aishabxuu';
let currentAudioContext: AudioContext | null = null;

export function setXunfeiVoice(voiceId: string): void {
  const voice = XUNFEI_VOICES.find(v => v.id === voiceId);
  if (voice) {
    currentVoiceId = voiceId;
    localStorage.setItem('xunfei_voice_id', voiceId);
  }
}

export function getXunfeiVoice(): XunfeiVoiceOption {
  return XUNFEI_VOICES.find(v => v.id === currentVoiceId) || XUNFEI_VOICES[0];
}

export function initXunfeiVoice(): void {
  const saved = localStorage.getItem('xunfei_voice_id');
  if (saved && XUNFEI_VOICES.find(v => v.id === saved)) {
    currentVoiceId = saved;
  }
}

// ============== 讯飞鉴权（新版）==============
function createHeaders(text: string, vcn: string) {
  const curTime = Math.floor(Date.now() / 1000);
  
  // X-Param: Base64(JSON.stringify(business参数))
  const businessParams = {
    aue: 'lame',
    auf: 'audio/L16;rate=16000',
    vcn: vcn,
    speed: 50,
    volume: 50,
    pitch: 50,
    tte: 'UTF8'
  };
  const xParam = btoa(JSON.stringify(businessParams));
  
  // X-CheckSum: MD5(apiKey + curTime + apiSecret)
  const checkSumStr = XF_API_KEY + curTime + XF_API_SECRET;
  const xCheckSum = CryptoJS.MD5(checkSumStr).toString();
  
  return {
    'Content-Type': 'application/json',
    'X-Appid': XF_APPID,
    'X-CurTime': String(curTime),
    'X-CheckSum': xCheckSum,
    'X-Param': xParam
  };
}

// ============== 核心 TTS 函数 ==============
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('[讯飞TTS] 开始朗读:', text);
  
  let audioContext: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let isDone = false;
  let audioUrl: string | null = null;

  const cleanup = () => {
    if (source) {
      try { source.stop(); } catch {}
      source = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    currentAudioContext = null;
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      audioUrl = null;
    }
  };

  const playAudio = (audioBlob: Blob) => {
    if (isDone) return;
    
    try {
      const url = URL.createObjectURL(audioBlob);
      audioUrl = url;
      
      const audio = new Audio(url);
      audio.onplay = () => {
        console.log('[讯飞TTS] 播放中');
        onStart?.();
      };
      audio.onended = () => {
        cleanup();
        isDone = true;
        onEnd?.();
      };
      audio.onerror = (e) => {
        console.error('[讯飞TTS] 音频播放失败:', e);
        cleanup();
        fallbackNative();
      };
      
      audio.play();
    } catch (e) {
      console.error('[讯飞TTS] 播放失败:', e);
      cleanup();
      fallbackNative();
    }
  };

  const fallbackNative = () => {
    if (isDone) return;
    isDone = true;
    console.log('[讯飞TTS] 使用原生 TTS');
    nativeTTS(text, onStart, onEnd);
  };

  // 发送请求
  const fetchAudio = async () => {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      currentAudioContext = audioContext;

      const voice = getXunfeiVoice();
      const headers = createHeaders(text, voice.vcn);
      
      const body = {
        common: { app_id: XF_APPID },
        business: {
          aue: 'lame',
          auf: 'audio/L16;rate=16000',
          vcn: voice.vcn,
          speed: 50,
          volume: 50,
          pitch: 50,
          tte: 'UTF8'
        },
        data: {
          status: 2,
          text: btoa(unescape(encodeURIComponent(text)))
        }
      };
      
      console.log('[讯飞TTS] 发送请求, voice:', voice.vcn);
      console.log('[讯飞TTS] headers:', JSON.stringify(headers).substring(0, 100));
      
      const response = await fetch(XF_TTS_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });
      
      console.log('[讯飞TTS] 响应状态:', response.status);
      console.log('[讯飞TTS] Content-Type:', response.headers.get('Content-Type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[讯飞TTS] 请求失败:', response.status, errorText.substring(0, 200));
        fallbackNative();
        return;
      }
      
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('audio') || contentType.includes('mp3') || contentType.includes('mpeg')) {
        // 返回的是音频数据
        const audioBlob = await response.blob();
        console.log('[讯飞TTS] 收到音频:', audioBlob.size, '字节, 类型:', audioBlob.type);
        playAudio(audioBlob);
      } else if (contentType.includes('json')) {
        // 返回的是 JSON 错误
        const json = await response.json();
        console.error('[讯飞TTS] 服务错误:', json.code, json.message);
        fallbackNative();
      } else {
        // 尝试作为音频解析
        const audioBlob = await response.blob();
        if (audioBlob.size > 0) {
          playAudio(audioBlob);
        } else {
          console.error('[讯飞TTS] 空响应');
          fallbackNative();
        }
      }
    } catch (e: any) {
      console.error('[讯飞TTS] 请求异常:', e.message || e);
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        console.error('[讯飞TTS] 可能是 CORS 问题');
      }
      fallbackNative();
    }
  };

  fetchAudio();
  
  return cleanup;
}

// ============== 原生 TTS ==============
export function nativeTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    console.log('[原生TTS] 不支持');
    onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 1.0;
  utter.pitch = 1.1;

  const voices = synth.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh'));
  if (zhVoice) utter.voice = zhVoice;

  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();

  synth.speak(utter);
}

// ============== 停止 ==============
export function stopSpeaking(): void {
  if (currentAudioContext) {
    currentAudioContext.close();
    currentAudioContext = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 讯飞语音 TTS 服务
// 使用讯飞开放平台 WebSocket API

import CryptoJS from 'crypto-js';

// ============== 配置 ==============
const XF_APPID = '8fe5843b';
const XF_API_SECRET = 'YjIwNjg1Y2U2ODRiNDFiZmEyYjgzZTUy';
const XF_API_KEY = 'f0d034b0c856de0d831b8b246ae8cc29';
const XF_TTS_URL = 'wss://tts-api.xfyun.cn/v2/tts';

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

// ============== 讯飞鉴权 ==============
function createAuthStr(): string {
  const now = new Date();
  // RFC 7231 格式: Sun, 05 May 2024 00:00:00 GMT
  const date = now.toUTCString().replace(/\.\d{3}/, '');
  
  const signatureOrigin = `host: tts-api.xfyun.cn\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
  
  // HMAC-SHA1
  const hash = CryptoJS.HmacSHA1(signatureOrigin, XF_API_SECRET);
  const signature = hash.toString(CryptoJS.enc.Base64);
  
  // 构造 authorization (不再次 base64)
  const authOrigin = `api_key="${XF_API_KEY}", algorithm="hmac-sha1", headers="host date request-line", signature="${signature}"`;
  
  return authOrigin;
}

function getQueryString(): string {
  const now = new Date();
  const date = now.toUTCString().replace(/\.\d{3}/, '');
  const auth = createAuthStr();
  
  const params = new URLSearchParams({
    authorization: btoa(auth),
    date: date,
    host: 'tts-api.xfyun.cn'
  });
  
  return params.toString();
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
  let ws: WebSocket | null = null;
  let audioBuffer: Int16Array | null = null;
  let isPlaying = false;
  let isDone = false;

  const cleanup = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (source) {
      try { source.stop(); } catch {}
      source = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    currentAudioContext = null;
    isPlaying = false;
  };

  const playAudio = () => {
    if (!audioContext || !audioBuffer || isPlaying || isDone) return;
    
    isPlaying = true;
    isDone = true;
    
    try {
      // 创建 AudioBuffer (16kHz, 16bit, mono)
      const buffer = audioContext.createBuffer(1, audioBuffer.length, 16000);
      // Int16Array 转 Float32Array
      const floatData = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        floatData[i] = audioBuffer[i] / 32768;
      }
      buffer.copyToChannel(floatData, 0);
      
      const node = audioContext.createBufferSource();
      node.buffer = buffer;
      node.connect(audioContext.destination);
      source = node;
      
      onStart?.();
      
      node.onended = () => {
        cleanup();
        onEnd?.();
      };
      
      node.start();
      console.log('[讯飞TTS] 播放中...');
    } catch (e) {
      console.error('[讯飞TTS] 播放失败:', e);
      cleanup();
      fallbackNative();
    }
  };

  const fallbackNative = () => {
    console.log('[讯飞TTS] 回退到原生 TTS');
    nativeTTS(text, onStart, onEnd);
  };

  const connect = () => {
    const queryString = getQueryString();
    const url = `${XF_TTS_URL}?${queryString}`;
    
    console.log('[讯飞TTS] 连接中...');
    
    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.error('[讯飞TTS] WebSocket 创建失败:', e);
      fallbackNative();
      return;
    }

    ws.onopen = () => {
      console.log('[讯飞TTS] 连接成功');
      
      const voice = getXunfeiVoice();
      const request = {
        common: { app_id: XF_APPID },
        business: {
          aue: 'raw',
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
      
      ws?.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      if (isDone) return;
      
      if (typeof event.data === 'string') {
        try {
          const resp = JSON.parse(event.data);
          console.log('[讯飞TTS] 响应:', resp.code, resp.message || '');
          
          if (resp.code !== 0) {
            console.error('[讯飞TTS] 服务错误:', resp.code, resp.message);
            cleanup();
            fallbackNative();
            return;
          }
          
          if (resp.data?.audio) {
            // 解码 base64 音频
            const binary = atob(resp.data.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            
            // 转换为 Int16Array (L16 格式)
            const samples = new Int16Array(bytes.length / 2);
            for (let i = 0; i < samples.length; i++) {
              samples[i] = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
            }
            
            audioBuffer = samples;
            console.log('[讯飞TTS] 收到音频:', samples.length, '样本');
          }
          
          if (resp.data?.status === 2) {
            console.log('[讯飞TTS] 合成完成');
            playAudio();
          }
        } catch (e) {
          console.error('[讯飞TTS] 解析失败:', e);
        }
      }
    };

    ws.onerror = (e) => {
      console.error('[讯飞TTS] WebSocket 错误:', e);
      cleanup();
      fallbackNative();
    };

    ws.onclose = (e) => {
      console.log('[讯飞TTS] 连接关闭:', e.code);
      if (audioBuffer && !isPlaying) {
        playAudio();
      } else if (!isDone) {
        fallbackNative();
      }
    };
  };

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    currentAudioContext = audioContext;
  } catch (e) {
    console.error('[讯飞TTS] AudioContext 创建失败:', e);
    fallbackNative();
    return () => {};
  }

  connect();
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

  // 选择中文语音
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

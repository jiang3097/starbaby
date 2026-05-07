// 讯飞语音 TTS 服务
// 使用讯飞开放平台 WebSocket API

import CryptoJS from 'crypto-js';

// 讯飞凭证
const XF_APPID = '8fe5843b';
const XF_API_SECRET = 'YjIwNjg1Y2U2ODRiNDFiZmEyYjgzZTUy';
const XF_API_KEY = 'f0d034b0c856de0d831b8b246ae8cc29';

const XF_TTS_URL = 'wss://tts-api.xfyun.cn/v2/tts';

// 声音选项配置
export interface XunfeiVoiceOption {
  id: string;
  name: string;
  vcn: string;  // 讯飞音色参数
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

// 讯飞 TTS 朗读
export function xunfeiSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('讯飞 TTS 朗读:', text.substring(0, 30));

  let audioContext: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let ws: WebSocket | null = null;
  let audioChunks: Uint8Array[] = [];
  let playing = false;

  const stop = () => {
    playing = false;
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
  };

  // 创建 WebSocket 连接
  const connect = () => {
    audioContext = new AudioContext();
    currentAudioContext = audioContext;
    audioChunks = [];

    const ts = Math.floor(Date.now() / 1000);
    const date = new Date(ts * 1000).toUTCString();
    
    // 鉴权头
    const signatureOrigin = `host: tts-api.xfyun.cn\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
    const hmac = CryptoJS.HmacSHA1(signatureOrigin, XF_API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(hmac);
    const authorizationOrigin = `api_key="${XF_API_KEY}", algorithm="hmac-sha1", headers="host date request-line", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    const voice = getXunfeiVoice();
    
    const url = `${XF_TTS_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=tts-api.xfyun.cn`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('讯飞 WebSocket 已连接');
      
      const request = {
        common: {
          app_id: XF_APPID,
        },
        business: {
          aue: 'audio/L16;rate=16000',
          auf: 'audio/L16;rate=16000',
          vcn: voice.vcn,
          speed: 50,  // 语速 0-100
          volume: 50, // 音量 0-100
          pitch: 50,  // 音调 0-100
          tte: 'utf8',
        },
        data: {
          status: 2,
          text: btoa(encodeURIComponent(text)),
        },
      };

      ws?.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          
          if (data.code !== 0) {
            console.error('讯飞 TTS 错误:', data.code, data.message);
            stop();
            onEnd?.();
            return;
          }

          if (data.data && data.data.audio) {
            const audioData = Uint8Array.from(atob(data.data.audio), c => c.charCodeAt(0));
            audioChunks.push(audioData);
          }

          if (data.data && data.data.status === 2) {
            // 合成完成，播放音频
            console.log('讯飞 TTS 合成完成，开始播放');
            playAudio();
          }
        } else {
          // 二进制数据
          const blob = event.data as Blob;
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const audioData = new Uint8Array(arrayBuffer);
            audioChunks.push(audioData);
          };
          reader.readAsArrayBuffer(blob);
        }
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('讯飞 WebSocket 错误:', error);
      stop();
      onEnd?.();
    };

    ws.onclose = () => {
      console.log('讯飞 WebSocket 已关闭');
      if (audioChunks.length > 0 && !playing) {
        playAudio();
      }
    };
  };

  const playAudio = () => {
    if (!audioContext || audioChunks.length === 0 || playing) return;
    
    playing = true;
    
    // 合并所有音频块
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      mergedArray.set(chunk, offset);
      offset += chunk.length;
    }

    // 解码音频
    audioContext.decodeAudioData(mergedArray.buffer, (buffer) => {
      const bufferSource = audioContext!.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(audioContext!.destination);
      source = bufferSource;
      
      onStart?.();
      
      bufferSource.onended = () => {
        playing = false;
        stop();
        onEnd?.();
      };
      
      bufferSource.start();
    }, (error) => {
      console.error('音频解码错误:', error);
      playing = false;
      stop();
      onEnd?.();
    });
  };

  connect();

  return stop;
}

// 停止朗读
export function stopXunfeiSpeech(): void {
  if (currentAudioContext) {
    currentAudioContext.close();
    currentAudioContext = null;
  }
}

// 浏览器原生 TTS
export function nativeSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return () => {};
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  synthesis.speak(utterance);
  return () => synthesis.cancel();
}

// 主函数 - 使用讯飞
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('使用讯飞 TTS');
  return xunfeiSpeakText(text, onStart, onEnd);
}

// 停止朗读
export function stopSpeaking(): void {
  stopXunfeiSpeech();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

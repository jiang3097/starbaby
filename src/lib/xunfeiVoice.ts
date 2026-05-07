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

// 生成讯飞鉴权
function generateAuth(): { authorization: string; date: string } {
  const ts = Math.floor(Date.now() / 1000);
  const dateStr = new Date(ts * 1000).toUTCString();
  
  const signatureOrigin = `host: tts-api.xfyun.cn\ndate: ${dateStr}\nGET /v2/tts HTTP/1.1`;
  const hmac = CryptoJS.HmacSHA1(signatureOrigin, XF_API_SECRET);
  const signature = CryptoJS.enc.Base64.stringify(hmac);
  
  const authorizationOrigin = `api_key="${XF_API_KEY}", algorithm="hmac-sha1", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin);
  
  return { authorization, date: dateStr };
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
  let audioPlayed = false;

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
    try {
      audioContext = new AudioContext();
      currentAudioContext = audioContext;
      audioChunks = [];
      audioPlayed = false;

      const { authorization, date } = generateAuth();
      const voice = getXunfeiVoice();
      
      const url = `${XF_TTS_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=tts-api.xfyun.cn`;
      console.log('讯飞 WebSocket 连接:', url.substring(0, 100));

      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('讯飞 WebSocket 已连接');
        
        const request = {
          common: {
            app_id: XF_APPID,
          },
          business: {
            aue: 'raw',
            auf: 'audio/L16;rate=16000',
            vcn: voice.vcn,
            speed: 50,
            volume: 50,
            pitch: 50,
            tte: 'UTF8',
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
            console.log('讯飞响应:', data.code, data.message);
            
            if (data.code !== 0) {
              console.error('讯飞 TTS 错误:', data.code, data.message);
              stop();
              // 回退到原生 TTS
              nativeSpeakText(text, onStart, onEnd);
              return;
            }

            if (data.data && data.data.audio) {
              const audioData = Uint8Array.from(atob(data.data.audio), c => c.charCodeAt(0));
              audioChunks.push(audioData);
            }

            if (data.data && data.data.status === 2 && !audioPlayed) {
              console.log('讯飞 TTS 合成完成');
              playAudio();
            }
          }
        } catch (e) {
          // 二进制数据
        }
      };

      ws.onerror = (error) => {
        console.error('讯飞 WebSocket 错误:', error);
        stop();
        // 回退到原生 TTS
        nativeSpeakText(text, onStart, onEnd);
      };

      ws.onclose = () => {
        console.log('讯飞 WebSocket 已关闭');
        if (audioChunks.length > 0 && !audioPlayed) {
          playAudio();
        }
      };
    } catch (e) {
      console.error('讯飞连接失败:', e);
      // 回退到原生 TTS
      nativeSpeakText(text, onStart, onEnd);
    }
  };

  const playAudio = () => {
    if (!audioContext || audioChunks.length === 0 || playing || audioPlayed) return;
    
    playing = true;
    audioPlayed = true;
    
    // 合并所有音频块
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      mergedArray.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('播放音频，数据大小:', mergedArray.length);

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

// 浏览器原生 TTS
export function nativeSpeakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!('speechSynthesis' in window)) {
    console.log('浏览器不支持语音合成');
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

  // 尝试选择中文语音
  const voices = synthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  synthesis.speak(utterance);
  return () => synthesis.cancel();
}

// 主函数 - 优先使用讯飞，失败回退到原生
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
  if (currentAudioContext) {
    currentAudioContext.close();
    currentAudioContext = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

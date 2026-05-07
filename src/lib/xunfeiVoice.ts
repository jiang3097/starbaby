// 讯飞语音 TTS 服务
// 通过本地 WebSocket 代理调用讯飞 API

// ============== 配置 ==============
const TTS_PROXY_URL = 'ws://localhost:8088';

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

// ============== 核心 TTS 函数 ==============
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  console.log('[TTS] 开始朗读:', text);
  
  let audioContext: AudioContext | null = null;
  let ws: WebSocket | null = null;
  let audioBuffer: number[] = [];
  let isDone = false;

  const cleanup = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    currentAudioContext = null;
  };

  const playAudio = () => {
    if (!audioContext || audioBuffer.length === 0 || isDone) return;
    
    try {
      // 转换为 Int16Array
      const samples = new Int16Array(audioBuffer.length / 2);
      for (let i = 0; i < samples.length; i++) {
        const low = audioBuffer[i * 2];
        const high = audioBuffer[i * 2 + 1];
        samples[i] = (high << 8) | low;
      }
      
      // 创建 AudioBuffer
      const buffer = audioContext.createBuffer(1, samples.length, 16000);
      const floatData = new Float32Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        floatData[i] = samples[i] / 32768;
      }
      buffer.copyToChannel(floatData, 0);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      
      console.log('[TTS] 播放中，时长:', buffer.duration, '秒');
      onStart?.();
      
      source.onended = () => {
        cleanup();
        isDone = true;
        onEnd?.();
      };
      
      source.start();
    } catch (e) {
      console.error('[TTS] 播放失败:', e);
      cleanup();
      fallbackNative();
    }
  };

  const fallbackNative = () => {
    if (isDone) return;
    isDone = true;
    console.log('[TTS] 使用原生语音');
    nativeTTS(text, onStart, onEnd);
  };

  // 连接 WebSocket 代理
  const connect = () => {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      currentAudioContext = audioContext;

      const voice = getXunfeiVoice();
      console.log('[TTS] 连接代理, voice:', voice.vcn);
      
      ws = new WebSocket(TTS_PROXY_URL);
      
      ws.onopen = () => {
        console.log('[TTS] WebSocket 已连接');
        ws?.send(JSON.stringify({
          type: 'request',
          id: Date.now(),
          text: text,
          vcn: voice.vcn
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'complete') {
            console.log('[TTS] 收到音频数据');
            
            // 解码 base64 音频
            const binary = atob(data.audio);
            for (let i = 0; i < binary.length; i++) {
              audioBuffer.push(binary.charCodeAt(i));
            }
            
            console.log('[TTS] 音频大小:', audioBuffer.length, '字节');
            playAudio();
          } else if (data.type === 'error') {
            console.error('[TTS] 代理错误:', data.error);
            fallbackNative();
          }
        } catch (e) {
          console.error('[TTS] 解析失败:', e);
        }
      };
      
      ws.onerror = (e) => {
        console.error('[TTS] WebSocket 错误');
        fallbackNative();
      };
      
      ws.onclose = () => {
        console.log('[TTS] WebSocket 关闭');
        if (audioBuffer.length === 0 && !isDone) {
          fallbackNative();
        }
      };
    } catch (e) {
      console.error('[TTS] 连接失败:', e);
      fallbackNative();
    }
  };

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
    console.log('[原生] 不支持语音合成');
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
  if (zhVoice) {
    utter.voice = zhVoice;
    console.log('[原生] 使用语音:', zhVoice.name);
  }

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

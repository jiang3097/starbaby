// 讯飞语音 TTS 服务
// 通过本地代理调用讯飞 API

// ============== 配置 ==============
const TTS_PROXY_URL = 'http://localhost:8088';

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
  
  let audio: HTMLAudioElement | null = null;
  let isDone = false;

  const cleanup = () => {
    if (audio) {
      audio.pause();
      audio = null;
    }
  };

  const fallbackNative = () => {
    if (isDone) return;
    isDone = true;
    console.log('[TTS] 使用原生语音');
    nativeTTS(text, onStart, onEnd);
  };

  // 调用 HTTP 接口
  const fetchAudio = async () => {
    try {
      const voice = getXunfeiVoice();
      console.log('[TTS] 发送请求, voice:', voice.vcn);
      
      const response = await fetch(`${TTS_PROXY_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, vcn: voice.vcn })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '未知错误' }));
        console.error('[TTS] 请求失败:', error);
        fallbackNative();
        return;
      }
      
      const result = await response.json();
      console.log('[TTS] 收到音频, 大小:', result.audio?.length || 0);
      
      if (result.audio) {
        // 播放 base64 音频
        const audioUrl = `data:audio/mp3;base64,${result.audio}`;
        audio = new Audio(audioUrl);
        
        audio.onplay = () => {
          console.log('[TTS] 播放中');
          onStart?.();
        };
        
        audio.onended = () => {
          cleanup();
          isDone = true;
          onEnd?.();
        };
        
        audio.onerror = (e) => {
          console.error('[TTS] 音频播放失败:', e);
          cleanup();
          fallbackNative();
        };
        
        audio.play();
      } else {
        fallbackNative();
      }
    } catch (e: any) {
      console.error('[TTS] 请求异常:', e.message);
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
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

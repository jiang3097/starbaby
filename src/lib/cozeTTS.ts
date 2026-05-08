/**
 * Coze TTS 语音合成
 * 使用 Coze 平台的语音合成 API
 */

const COZE_TTS_CONFIG = {
  URL: 'https://api.coze.cn/v1/audio/speech',
  // 从环境变量读取 API Key
  get API_KEY() {
    return import.meta.env.VITE_COZE_API_KEY || '';
  },
};

// Coze 音色列表（常用的中文音色）
export interface ICozeVoice {
  id: string;
  name: string;
  desc: string;
}

export const COZE_VOICES: ICozeVoice[] = [
  { id: 'custom_shanshan', name: '珊珊', desc: '活泼可爱的女声，适合儿童' },
  { id: 'BV700', name: '清新女声', desc: '清新自然的女生声音' },
  { id: 'BV701', name: '醇厚男声', desc: '低沉有磁性的男声' },
  { id: 'shanshan', name: '闪闪', desc: '清脆活泼的女孩声音' },
  { id: 'nvyou', name: '女朋友', desc: '温柔甜美的女声' },
  { id: 'nanguo', name: '难过', desc: '带有情感的男声' },
];

// 缓存当前选择的音色
let currentVoice = COZE_VOICES[0]; // 默认珊珊

export const setCozeVoice = (voiceId: string) => {
  const voice = COZE_VOICES.find(v => v.id === voiceId);
  if (voice) currentVoice = voice;
};

export const getCozeVoice = (): ICozeVoice => currentVoice;

// 检查 Coze TTS 是否可用
export const isCozeTTSEnabled = () => {
  return !!COZE_TTS_CONFIG.API_KEY;
};

// 当前播放的音频
let currentAudio: HTMLAudioElement | null = null;

/**
 * 停止播放
 */
export const stopCozeAudio = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

/**
 * Coze TTS 朗读
 */
export const cozeSpeak = async (
  text: string,
  onEnd?: () => void,
  voiceId?: string
): Promise<void> => {
  if (!text) {
    onEnd?.();
    return;
  }

  const voice = voiceId || currentVoice.id;

  // 如果没有配置 API Key，返回失败
  if (!COZE_TTS_CONFIG.API_KEY) {
    console.log('[Coze TTS] 未配置 API Key');
    onEnd?.();
    return;
  }

  console.log('[Coze TTS] 开始朗读:', text, '音色:', voice);

  try {
    const response = await fetch(COZE_TTS_CONFIG.URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_TTS_CONFIG.API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        voice_id: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Coze TTS] 请求失败:', response.status, errorText);
      onEnd?.();
      return;
    }

    // 返回的是音频二进制数据，需要转换为 blob URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // 播放音频
    currentAudio = new Audio(audioUrl);
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
    };
    currentAudio.onerror = () => {
      console.error('[Coze TTS] 音频播放失败');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
    };

    await currentAudio.play();
    console.log('[Coze TTS] 开始播放音频');
  } catch (error) {
    console.error('[Coze TTS] 请求异常:', error);
    onEnd?.();
  }
};

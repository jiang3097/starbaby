// 语音朗读模块 - 完整版，支持多种语音源
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 状态管理
let browserSpeaking = false;

export const stopSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    browserSpeaking = false;
    console.log('[TTS] 已停止');
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

export const pauseSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      console.log('[TTS] 已暂停');
    }
  } catch (e) {
    console.error('[TTS] 暂停失败:', e);
  }
};

export const resumeSpeak = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      console.log('[TTS] 继续朗读');
    }
  } catch (e) {
    console.error('[TTS] 继续失败:', e);
  }
};

export const isSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

// 获取所有可用的中文语音
function getChineseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  
  const voices = window.speechSynthesis.getVoices();
  console.log('[TTS] 检测到语音数量:', voices.length);
  
  // 列出所有语音（调试用）
  voices.forEach((v, i) => {
    console.log(`[TTS] 语音${i}: ${v.name} (${v.lang})`);
  });
  
  // 筛选中文语音
  return voices.filter(v => 
    v.lang.includes('zh') || 
    v.lang.includes('CN') ||
    v.lang.includes('HK') ||
    v.lang.includes('TW') ||
    v.name.toLowerCase().includes('chinese') ||
    v.name.toLowerCase().includes('中文')
  );
}

export const speakText = async (text: string): Promise<void> => {
  try {
    // 先停止
    await stopSpeak();
    
    const cleanText = removeEmoji(text);
    if (!cleanText) {
      console.log('[TTS] 文本为空');
      return;
    }
    
    console.log('[TTS] 开始朗读:', cleanText.substring(0, 30));
    
    if (typeof window === 'undefined') {
      console.log('[TTS] 非浏览器环境');
      return;
    }
    
    if (!window.speechSynthesis) {
      console.log('[TTS] 不支持语音合成');
      alert('当前浏览器不支持语音朗读功能，请使用 Chrome、Safari 或 Edge 浏览器');
      return;
    }
    
    // 获取中文语音
    let chineseVoices = getChineseVoices();
    
    // 如果没有中文语音，使用任何可用的语音
    if (chineseVoices.length === 0) {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        chineseVoices = allVoices;
        console.log('[TTS] 无中文语音，使用默认语音');
      } else {
        console.log('[TTS] 没有任何可用语音');
        alert('未检测到语音库，请确保手机系统语言设置为中文');
        return;
      }
    }
    
    // 创建 utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // 稍慢一点
    utterance.pitch = 1.0;
    
    // 设置语音
    utterance.voice = chineseVoices[0];
    utterance.volume = 1.0;
    
    console.log('[TTS] 使用语音:', chineseVoices[0].name);
    
    utterance.onstart = () => {
      browserSpeaking = true;
      console.log('[TTS] 朗读开始');
    };
    
    utterance.onend = () => {
      browserSpeaking = false;
      console.log('[TTS] 朗读完成');
    };
    
    utterance.onerror = (e) => {
      browserSpeaking = false;
      console.log('[TTS] 朗读错误:', e.error);
      if (e.error === 'not-allowed') {
        alert('语音被阻止，请允许浏览器使用语音功能');
      }
    };
    
    // 开始朗读
    window.speechSynthesis.speak(utterance);
    
  } catch (e) {
    console.error('[TTS] 朗读失败:', e);
    browserSpeaking = false;
  }
};

// 初始化时加载语音列表
if (typeof window !== 'undefined') {
  // 有些浏览器需要等待
  window.speechSynthesis?.getVoices();
  window.speechSynthesis?.addEventListener('voiceschanged', () => {
    console.log('[TTS] 语音列表已更新');
    const voices = getChineseVoices();
    if (voices.length > 0) {
      console.log('[TTS] 可用中文语音:', voices.map(v => v.name).join(', '));
    }
  });
  
  // 某些浏览器需要用户交互后才能播放
  document.addEventListener('click', () => {
    if (window.speechSynthesis && window.speechSynthesis.pending) {
      console.log('[TTS] 恢复挂起的语音');
      window.speechSynthesis.resume();
    }
  }, { once: true });
}

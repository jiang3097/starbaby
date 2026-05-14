// 语音朗读模块 - 使用 Capacitor TTS 插件
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// 移除 emoji 的辅助函数
export function removeEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

// 检查 TTS 是否可用
export const isTTSAvailable = async (): Promise<boolean> => {
  return true; // 假设 TTS 可用
};

// 停止朗读
export const stopSpeak = async (): Promise<void> => {
  try {
    await TextToSpeech.stop();
  } catch (e) {
    console.error('[TTS] 停止失败:', e);
  }
};

// 朗读文本
export const speakText = async (text: string): Promise<void> => {
  try {
    // 先停止之前的朗读
    await stopSpeak();
    
    const cleanText = removeEmoji(text);
    if (!cleanText) return;
    
    console.log('[TTS] 开始朗读:', cleanText);
    
    await TextToSpeech.speak({
      text: cleanText,
      lang: 'zh-CN',
      rate: 0.9,
      pitch: 1.0,
    });
    
    console.log('[TTS] 朗读完成');
  } catch (e) {
    console.error('[TTS] 朗读失败:', e);
  }
};

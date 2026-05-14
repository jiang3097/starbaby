import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

// 百度语音配置
const BAIDU_APP_ID = '7746751';
const BAIDU_API_KEY = 'lxcTuf5SRwkOFnff4cKqsPgM';
const BAIDU_SECRET_KEY = 'R3IZvo7BkyK0dVRzsgm81DFHnBznF3NW';

// 移除 emoji，只保留文字
export const removeEmoji = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
};

// 检查 TTS 是否可用
export const isTTSAvailable = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// 百度语音始终支持
export const isSpeechRecognitionSupported = () => true;
export const isSpeechSupport = isSpeechRecognitionSupported;

// 获取百度 access_token
let tokenCache: { token: string; expireTime: number } | null = null;

const getBaiduToken = async (): Promise<string> => {
  if (tokenCache && Date.now() < tokenCache.expireTime) {
    return tokenCache.token;
  }
  
  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
  
  try {
    const response = await axios.post(tokenUrl);
    const { access_token, expires_in } = response.data;
    
    tokenCache = {
      token: access_token,
      expireTime: Date.now() + (expires_in - 300) * 1000
    };
    
    return access_token;
  } catch (error) {
    console.error('[BaiduASR] 获取token失败:', error);
    throw new Error('获取语音识别授权失败');
  }
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(true);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callbacksRef = useRef<{ onResult?: (text: string) => void; onFinal?: (text: string) => void; onError?: (error: string) => void }>({});

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsListening(false);
  }, []);

  const stopListening = useCallback(() => {
    console.log('[BaiduASR] 停止录音');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startListening = useCallback((
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onFinal?: (text: string) => void
  ) => {
    console.log('[BaiduASR] 开始录音');
    
    callbacksRef.current = { onResult, onError, onFinal };
    chunksRef.current = [];
    
    cleanup();
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[BaiduASR] 浏览器不支持录音');
      onError?.('浏览器不支持录音');
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          console.log('[BaiduASR] 开始识别...');
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          try {
            const token = await getBaiduToken();
            
            // 转换为 base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64 = (reader.result as string).split(',')[1];
              
              try {
                // 调用百度短语音识别 API
                const response = await axios.post(
                  `https://vop.baidu.com/server_api?dev_pid=15372&token=${token}`,
                  {
                    format: 'wav',
                    rate: 16000,
                    dev_pid: 15372,
                    spenc: 'wav',
                    channel: 1,
                    cuuid: 'starbaby',
                    len: blob.size,
                    speech: base64
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    params: {
                      dev_pid: 15372,
                      token: token
                    }
                  }
                );
                
                console.log('[BaiduASR] 识别结果:', response.data);
                
                if (response.data.err_no === 0 && response.data.result) {
                  const text = response.data.result[0];
                  console.log('[BaiduASR] 识别文字:', text);
                  onResult?.(text);
                  onFinal?.(text);
                } else {
                  console.error('[BaiduASR] 识别失败:', response.data.err_msg);
                  onError?.(response.data.err_msg || '识别失败');
                }
              } catch (apiError) {
                console.error('[BaiduASR] API调用失败:', apiError);
                onError?.('识别服务调用失败');
              }
            };
          } catch (tokenError) {
            console.error('[BaiduASR] 获取token失败:', tokenError);
            onError?.('获取授权失败');
          }
        };
        
        mediaRecorder.onerror = (error) => {
          console.error('[BaiduASR] 录音错误:', error);
          onError?.('录音出错');
          cleanup();
        };
        
        // 开始录音
        mediaRecorder.start();
        setIsListening(true);
        console.log('[BaiduASR] 录音中...');
        
        // 30秒超时自动停止
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            console.log('[BaiduASR] 录音超时');
            mediaRecorderRef.current.stop();
          }
        }, 30000);
        
      })
      .catch((err) => {
        console.error('[BaiduASR] 麦克风权限获取失败:', err);
        if (err.name === 'NotAllowedError') {
          onError?.('请允许使用麦克风');
        } else {
          onError?.('麦克风不可用');
        }
      });
      
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    isTTSAvailable: isTTSAvailable()
  };
};

// TTS 朗读功能
export const speakText = (text: string, onEnd?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isTTSAvailable()) {
      console.warn('[TTS] 浏览器不支持语音合成');
      resolve();
      return;
    }
    
    const cleanText = removeEmoji(text);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => v.lang.includes('zh') && v.localService);
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    
    utterance.onend = () => {
      console.log('[TTS] 朗读完成');
      onEnd?.();
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.error('[TTS] 朗读出错:', e.error);
      onEnd?.();
      resolve(); // 即使出错也resolve，避免阻塞
    };
    
    console.log('[TTS] 开始朗读:', cleanText);
    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeak = () => {
  window.speechSynthesis.cancel();
};

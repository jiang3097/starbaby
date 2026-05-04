import { useState, useCallback, useRef, useEffect } from 'react';

// 语音识别类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'following';

interface UseSpeechOptions {
  lang?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  onTranscript?: (text: string) => void;
}

interface UseSpeechReturn {
  state: VoiceState;
  transcript: string;
  isListening: boolean;
  isSpeaking: boolean;
  isFollowing: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  startFollowing: (text: string) => Promise<void>;
  stopFollowing: () => void;
}

// 获取可用的声音列表（处理异步加载）
function getVoicesSync(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  
  // Chrome 需要延迟获取声音列表
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return voices;
  
  // 如果声音列表为空，等待短暂时间后重试
  return window.speechSynthesis.getVoices();
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = 'zh-CN',
    voice,
    rate = 0.9,
    pitch = 1.0,
    onTranscript,
  } = options;

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const followingTextRef = useRef<string>('');
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // 检查浏览器支持
  const isSpeechSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // 初始化语音识别
  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setState('listening');
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = (finalTranscript || interimTranscript).trim();
      setTranscript(fullTranscript);
      if (fullTranscript && onTranscript) {
        onTranscript(fullTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setState('idle');
    };

    recognition.onend = () => {
      setIsListening(false);
      setState('idle');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, isSpeechSupported]);

  // 初始化语音合成声音列表
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    // 加载声音列表
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    // 立即尝试获取
    loadVoices();

    // 监听声音列表变化
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 开始语音识别
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [isListening]);

  // 停止语音识别
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Failed to stop recognition:', e);
    }
    setState('idle');
  }, []);

  // 语音合成 - AI 朗读
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      // 停止之前的朗读
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // 获取声音列表
      let voices = voicesRef.current;
      if (voices.length === 0) {
        voices = window.speechSynthesis.getVoices();
      }

      // 优先选择中文声音
      const chineseVoice = voices.find(v => 
        v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('Hans')
      );
      
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      } else if (voices.length > 0) {
        // 如果没有中文声音，选择第一个可用的
        utterance.voice = voices[0];
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setState('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setState('idle');
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
        setState('idle');
        // 即使出错也resolve，避免阻塞
        resolve();
      };

      utteranceRef.current = utterance;
      
      // 延迟一小段时间确保浏览器准备好
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error('Failed to speak:', e);
          setIsSpeaking(false);
          setState('idle');
          resolve();
        }
      }, 50);
    });
  }, [lang, rate, pitch]);

  // 停止朗读
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setState('idle');
  }, []);

  // 跟读功能 - AI 先读，用户跟读
  const startFollowing = useCallback(async (text: string): Promise<void> => {
    followingTextRef.current = text;
    
    // 先让 AI 朗读
    await speak(text);
    
    // 朗读结束后开始跟读模式
    setIsFollowing(true);
    setState('following');
    setTranscript('');
    
    // 开始监听用户跟读
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start following recognition:', e);
      }
    }
  }, [speak]);

  // 停止跟读
  const stopFollowing = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop following recognition:', e);
      }
    }
    setIsFollowing(false);
    setState('idle');
  }, []);

  return {
    state,
    transcript,
    isListening,
    isSpeaking,
    isFollowing,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    startFollowing,
    stopFollowing,
  };
}

// 预加载语音（确保声音列表加载）
export function preloadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  
  // 触发声音列表加载
  window.speechSynthesis.getVoices();
  
  // 等待声音列表变化
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
  };
}

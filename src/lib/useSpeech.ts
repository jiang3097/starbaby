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

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);
      if (onTranscript) {
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
      if (state === 'listening') {
        setState('idle');
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onTranscript, state]);

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
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // 停止之前的朗读
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // 选择指定声音
      if (voice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name.includes(voice));
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // 优先选择中文声音
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find(v => v.lang.includes('zh'));
      if (chineseVoice && !voice) {
        utterance.voice = chineseVoice;
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
        reject(e);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [lang, rate, pitch, voice]);

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
    followingTextRef.current = '';
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

// 预加载语音
export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // 超时保护
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

// 语音识别模块 - 使用原生 Web Speech API

// 扩展 Window 接口
declare global {
  interface Window {
    _recognition: SpeechRecognition | null;
  }
}

interface VoiceRecognitionCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onStart?: () => void;
}

// 内部状态
let _recognition: SpeechRecognition | null = null;
let _callbacks: VoiceRecognitionCallbacks = {};
let _silenceTimer: ReturnType<typeof setTimeout> | null = null;
let _isListening = false;

// 初始化识别器
function initRecognition(): SpeechRecognition | null {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    console.warn('[语音识别] 浏览器不支持 Web Speech API');
    return null;
  }

  if (_recognition) {
    return _recognition;
  }

  _recognition = new SpeechRecognitionAPI();
  _recognition.continuous = true;
  _recognition.interimResults = true;
  _recognition.lang = 'zh-CN';
  _recognition.maxAlternatives = 3;

  _recognition.onstart = () => {
    console.log('[语音识别] 开始监听');
    _isListening = true;
    _callbacks.onStart?.();
  };

  _recognition.onresult = (event) => {
    // 清除静音计时器
    if (_silenceTimer) {
      clearTimeout(_silenceTimer);
    }

    let finalTranscript = '';
    let interimTranscript = '';

    const results = event.results;
    for (let i = event.resultIndex; i < results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // 如果有临时结果，传递给回调
    if (interimTranscript) {
      console.log('[语音识别] 临时:', interimTranscript);
      _callbacks.onTranscript?.(interimTranscript, false);
    }

    // 如果有最终结果，传递给回调
    if (finalTranscript) {
      console.log('[语音识别] 最终:', finalTranscript);
      _callbacks.onTranscript?.(finalTranscript, true);
      // 最终结果后重启识别（continuous 模式可能自动停止）
      restartRecognition();
    }

    // 重置静音计时器
    _silenceTimer = setTimeout(() => {
      if (_isListening && finalTranscript) {
        console.log('[语音识别] 静音超时，停止识别');
        stopListening();
      }
    }, 3000);
  };

  _recognition.onerror = (event) => {
    console.error('[语音识别] 错误:', event.error);
    _isListening = false;
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      _callbacks.onError?.(event.error);
    }
  };

  _recognition.onend = () => {
    console.log('[语音识别] 结束');
    _isListening = false;
    if (_silenceTimer) {
      clearTimeout(_silenceTimer);
      _silenceTimer = null;
    }
    _callbacks.onEnd?.();
  };

  window._recognition = _recognition;
  return _recognition;
}

// 重启识别
function restartRecognition() {
  if (_recognition && _isListening) {
    try {
      _recognition.stop();
      setTimeout(() => {
        if (_isListening) {
          _recognition?.start();
        }
      }, 100);
    } catch (e) {
      // 忽略错误
    }
  }
}

// 开始监听
export function startListening(
  callbacks: VoiceRecognitionCallbacks = {}
): boolean {
  const { onTranscript, onEnd, onError, onStart } = callbacks;
  _callbacks = { onTranscript, onEnd, onError, onStart };

  const recognition = initRecognition();
  if (!recognition) {
    onError?.('浏览器不支持语音识别');
    return false;
  }

  if (_isListening) {
    console.log('[语音识别] 已在监听中');
    return true;
  }

  try {
    recognition.start();
    return true;
  } catch (error) {
    console.error('[语音识别] 启动失败:', error);
    // 如果已经在运行，先停止再启动
    try {
      recognition.stop();
      setTimeout(() => {
        recognition.start();
      }, 100);
      return true;
    } catch (e) {
      onError?.('启动语音识别失败');
      return false;
    }
  }
}

// 停止监听
export function stopListening(onEnd?: () => void): void {
  if (_silenceTimer) {
    clearTimeout(_silenceTimer);
    _silenceTimer = null;
  }

  if (_recognition) {
    try {
      _recognition.stop();
    } catch (e) {
      // 忽略错误
    }
  }
  _isListening = false;
  console.log('[语音识别] 已停止');
  onEnd?.();
}

// 检查是否正在监听
export function isListening(): boolean {
  return _isListening;
}

// 导出类型
export type { VoiceRecognitionCallbacks };

import { useState, useEffect } from 'react';

/**
 * 检测浏览器是否支持语音功能
 */
export const useSpeechSupport = () => {
  const [speechSupported, setSpeechSupported] = useState({
    recognition: false,
    synthesis: false,
    checked: false,
  });

  useEffect(() => {
    const checkSupport = () => {
      const recognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const synthesis = 'speechSynthesis' in window;
      
      setSpeechSupported({
        recognition,
        synthesis,
        checked: true,
      });
    };

    checkSupport();
  }, []);

  return speechSupported;
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { BAIDU_VOICES, getAvailableVoices, setBaiduVoice, getBaiduVoice } from '../lib/baiduVoice';

interface VoiceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState(getBaiduVoice());
  const voices = getAvailableVoices();

  useEffect(() => {
    setSelected(getBaiduVoice());
  }, [isOpen]);

  const handleSelect = (voiceId: number) => {
    setSelected(voiceId);
    setBaiduVoice(voiceId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl z-[201] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Volume2 size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">选择声音</h3>
                    <p className="text-xs text-slate-500">选择你喜欢的声音陪我读故事</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Voice options */}
            <div className="p-4 space-y-3">
              {voices.map((voice) => {
                const emoji = voice.id === BAIDU_VOICES.duxiaoduo.id ? '👧' :
                              voice.id === BAIDU_VOICES.qiqi.id ? '👧' :
                              voice.id === BAIDU_VOICES.xiaomei.id ? '👩' :
                              voice.id === BAIDU_VOICES.xiaojiao.id ? '👩' :
                              '👨';
                return (
                  <motion.button
                    key={voice.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(voice.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4",
                      selected === voice.id 
                        ? "border-amber-400 bg-amber-50" 
                        : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
                      selected === voice.id ? "bg-amber-200" : "bg-slate-100"
                    )}>
                      {emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-800">{voice.name}</p>
                      <p className="text-sm text-slate-500">{voice.desc}</p>
                    </div>
                    {selected === voice.id && (
                      <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Confirm button */}
            <div className="p-4 pt-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                确定
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceSelector;

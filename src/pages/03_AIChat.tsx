import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Volume2, Send, Square } from 'lucide-react';
import MobileShell from '../components/MobileShell';
import { cn } from '../lib/utils';
import { speakText, preloadVoices, stopSpeaking, startListening, stopListening } from '../lib/useSpeech';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';
import { getAIReply } from '../lib/cozeChat';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
}

const AIChat = () => {
  const navigate = useNavigate();
  const { profile, avatar, incrementIntimacy } = useUser();
  const { startTraining, incrementExpression, incrementChatMessage } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: `你好呀！我是${profile.name}！今天心情怎么样？` },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showIntimacyTip, setShowIntimacyTip] = useState(false);
  const [currentIntimacy, setCurrentIntimacy] = useState(profile.intimacy);
  const [tempTranscript, setTempTranscript] = useState('');
  const hasStartedTraining = useRef(false);
  const prevIntimacyRef = useRef(profile.intimacy);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 监听亲密度变化
  useEffect(() => {
    if (profile.intimacy > prevIntimacyRef.current) {
      setCurrentIntimacy(profile.intimacy);
      setShowIntimacyTip(true);
      setTimeout(() => setShowIntimacyTip(false), 2000);
    }
    prevIntimacyRef.current = profile.intimacy;
  }, [profile.intimacy]);

  // 预加载语音
  useEffect(() => {
    preloadVoices();
  }, []);

  // 进入页面时开始训练计时（只执行一次）
  useEffect(() => {
    let mounted = true;
    if (!hasStartedTraining.current && mounted) {
      hasStartedTraining.current = true;
      startTraining();
    }
    return () => {
      mounted = false;
    };
  }, []); // 空依赖，确保只执行一次

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPhrases = ['我开心 😊', '我要喝水 🚰', '我想玩球 🎾'];

  // 随机回复库
  const randomReplies: Record<string, string[]> = {
    'water': [
      '好渴啊！一起去倒杯水吧~',
      '喝水很重要！我们一起去拿杯子吧~',
      '记得多喝水哦，水是生命之源~',
      '我也有点渴了呢，我们一起喝水吧！',
    ],
    'happy': [
      '太棒了！开心的时候感觉整个世界都在笑呢~',
      '哇！开心的时候就应该大笑出来！哈哈哈哈哈！',
      '我也好开心！开心是会传染的哦~',
      '快乐的时候要分享！想不想和我玩个游戏？',
    ],
    'ball': [
      '玩球最开心了！你喜欢什么球？足球、篮球还是网球？',
      '我们来玩抛接球吧！准备好了吗？',
      '拍球可以练习手眼协调哦，一起来试试！',
      '玩球可以锻炼身体！你是怎么玩球的呀？',
    ],
    'sad': [
      '没关系，难过的时候可以哭一哭，没人会笑你的~',
      '我在这里陪着你哦，要不要听个温暖的故事？',
      '抱抱你~难过的事情会慢慢过去的~',
      '每个人都有难过的时候，我也很心疼你哦~',
    ],
    'angry': [
      '深呼吸~1...2...3...感觉好一点了吗？',
      '生气的时候可以数数，或者拍拍枕头发泄一下~',
      '深呼吸，慢慢来，我陪着你平静下来~',
      '生气是正常的，但我们要学会控制它哦~',
    ],
    'thanks': [
      '不客气！我们是好朋友，好朋友就是互相帮助的呀~',
      '谢谢你！帮助别人自己也会有好心情哦~',
      '不用谢！我很开心能帮到你~',
      '你太客气了！能帮到你我也觉得很开心呢！',
    ],
    'hello': [
      `你好呀！${profile.name}！见到你真开心！🌟`,
      `哈喽！${profile.name}！今天过得怎么样？`,
      `你好你好！我是你的小鸡猫朋友！🎉`,
      `嗨~${profile.name}！我们又见面啦~`,
    ],
    'default': [
      '嗯嗯，我听懂了！你继续说~',
      '原来是这样啊！然后呢？',
      '你说的话真有意思！',
      '我在认真听哦，继续说吧~',
      '哦~我明白了！这很有趣呢~',
      '真的吗？太棒了！',
      '这样啊~你懂得真多！',
      '嗯！我记住了！你真是个有趣的小朋友~',
    ],
  };

  // 随机选择回复
  const getRandomReply = (category: string): string => {
    const replies = randomReplies[category] || randomReplies['default'];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  // 调用 Coze API 获取智能回复
  const fetchAIReply = async (userMessage: string, history: { role: string; content: string }[]): Promise<string> => {
    try {
      // 使用优化后的 Coze Chat API（非流式，更可靠）
      const chatHistory = history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      }));
      
      const reply = await getAIReply(userMessage, chatHistory);
      return reply;
    } catch (error) {
      console.error('AI Chat Error:', error);
      // API 失败时使用随机回复
      return getRandomReply(classifyMessage(userMessage));
    }
  };

  // 判断消息类型
  const classifyMessage = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('水') || lowerText.includes('渴')) return 'water';
    if (lowerText.includes('开心') || lowerText.includes('高兴') || lowerText.includes('快乐')) return 'happy';
    if (lowerText.includes('球') || lowerText.includes('玩')) return 'ball';
    if (lowerText.includes('难过') || lowerText.includes('伤心') || lowerText.includes('不开心')) return 'sad';
    if (lowerText.includes('生气') || lowerText.includes('愤怒')) return 'angry';
    if (lowerText.includes('谢')) return 'thanks';
    if (lowerText.includes('你好') || lowerText.includes('嗨') || lowerText.includes('hi') || lowerText.includes('hello')) return 'hello';
    return 'default';
  };

  // 处理发送消息
  const handleSend = useCallback(async (text: String) => {
    // 清理emoji用于处理
    const cleanText = text.toString().replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    
    // 添加用户消息
    const userMsg: Message = { id: Date.now(), type: 'user', text: cleanText };
    setMessages(prev => [...prev, userMsg]);

    // 统计：增加主动表达次数和聊天消息数
    incrementExpression('chat');
    incrementChatMessage();
    
    // 增加亲密度 - 会在 useEffect 中检测并显示提示
    incrementIntimacy();

    // 构建对话历史
    const history = messages.map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // AI 响应 - 调用 LLM API 获取智能回复
    setIsAIThinking(true);
    try {
      const reply = await fetchAIReply(cleanText, history);
      
      const botMsg: Message = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: reply,
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsAIThinking(false);

      // AI 自动朗读回复
      speakText(reply);
    } catch (error) {
      console.error('AI 回复失败:', error);
      setIsAIThinking(false);
    }
  }, [profile.name, messages]);

  // 点击麦克风开始说话
  const handleMicClick = () => {
    if (isListening) {
      // 停止录音
      stopListening();
      setIsListening(false);
    } else {
      // 开始录音
      setIsListening(true);
      setTempTranscript('');

      startListening({
        onTranscript: (text: string, isFinal: boolean) => {
          if (isFinal) {
            setIsListening(false);
            setTempTranscript('');
            if (text.trim()) {
              handleSend(text.trim());
            }
          } else {
            setTempTranscript(text);
          }
        },
        onEnd: () => {
          setIsListening(false);
          setTempTranscript('');
        }
      });
    }
  };

  // 朗读按钮
  const handleReadAloud = (text: string) => {
    setIsSpeaking(true);
    speakText(text, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <MobileShell className="bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 云朵装饰 */}
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-20 left-8 text-4xl opacity-40"
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ x: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
          className="absolute top-32 right-10 text-3xl opacity-30"
        >
          ☁️
        </motion.div>
        {/* 星星装饰 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300"
            style={{ left: `${15 + i * 18}%`, top: `${10 + (i % 3) * 8}%` }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.3 }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="px-6 pt-4 flex items-center justify-center sticky top-0 bg-gradient-to-b from-amber-50/90 to-transparent z-10 pb-2">
        {/* 形象展示 */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={cn(
              "w-16 h-16 rounded-full p-1 shadow-lg border-3 border-white bg-gradient-to-br overflow-hidden",
              avatar.color
            )}
          >
            <img 
              src={avatar.image}
              alt={profile.name} 
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
          <span className={cn(
            "text-xs font-bold mt-1 px-3 py-0.5 rounded-full",
            isSpeaking ? 'bg-amber-100 text-amber-600' : isListening ? 'bg-rose-100 text-rose-500' : 'bg-sky-100 text-sky-500'
          )}>
          {isSpeaking ? '正在朗读' : isListening ? '正在听...' : profile.name}
          </span>
        </div>
      </div>

      {/* 亲密度增加提示 */}
      <AnimatePresence>
        {showIntimacyTip && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-pink-400 to-rose-400 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <span className="text-lg">💕</span>
            <span className="text-sm font-bold">亲密度+1</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto min-h-0 relative"
      >
        {/* 温馨提示 */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-5 py-2 self-center text-xs font-bold text-amber-600 flex items-center gap-2 shadow-sm">
          <span>🌟</span>
          <span>和{profile.name}聊聊天吧~</span>
        </div>
        
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "flex items-end gap-3 max-w-[88%]",
              msg.type === 'user' ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            {/* 头像 */}
            {msg.type === 'bot' && (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-10 h-10 rounded-full p-0.5 shadow-md border-2 border-white flex-shrink-0 bg-gradient-to-br overflow-hidden",
                  avatar.color
                )}
              >
                <img 
                  src={avatar.image}
                  alt={profile.name} 
                  className="w-full h-full object-cover rounded-full"
                />
              </motion.div>
            )}
            
            {/* 消息气泡 */}
            <div className={cn(
              "p-4 rounded-[24px] shadow-md relative",
              msg.type === 'user' 
                ? "bg-gradient-to-r from-sky-400 to-sky-500 text-white rounded-br-md" 
                : "bg-white text-slate-700 rounded-bl-md border border-slate-100"
            )}>
              {/* 消息内容 */}
              <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {/* Bot message controls */}
              {msg.type === 'bot' && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                      } else {
                        handleReadAloud(msg.text);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all shadow-sm",
                      isSpeaking 
                        ? "bg-rose-100 text-rose-500" 
                        : "bg-sky-50 text-sky-500 hover:bg-sky-100"
                    )}
                  >
                    {isSpeaking ? (
                      <>
                        <Square size={14} />
                        <span>停止</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} />
                        <span>朗读</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* 用户头像 */}
            {msg.type === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                我
              </div>
            )}
          </motion.div>
        ))}

        {/* AI 思考中的提示 - 紧跟在消息列表后面 */}
        {isAIThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "flex items-end gap-3 max-w-[88%] self-start"
            )}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn(
                "w-10 h-10 rounded-full p-0.5 shadow-md border-2 border-white flex-shrink-0 bg-gradient-to-br overflow-hidden",
                avatar.color
              )}
            >
              <img 
                src={avatar.image}
                alt={profile.name} 
                className="w-full h-full object-cover rounded-full"
              />
            </motion.div>
            <div className="p-4 rounded-[24px] shadow-md bg-white border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">星小宝在想</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-lg"
                >
                  ...
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-white to-amber-50/50 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] space-y-4">
        {/* Quick Phrases */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {quickPhrases.map(phrase => (
            <motion.button
              key={phrase}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(phrase)}
              className="px-4 py-2.5 bg-white text-slate-600 rounded-full text-sm font-bold whitespace-nowrap border-2 border-amber-100 shadow-sm hover:border-amber-300 hover:bg-amber-50 transition-all"
            >
              {phrase}
            </motion.button>
          ))}
        </div>

        {/* Voice Button */}
        <div className="flex flex-col items-center justify-center py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleMicClick}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-lg",
              isListening 
                ? "bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]" 
                : "bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_8px_20px_rgba(251,146,60,0.4)]"
            )}
          >
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 rounded-full bg-rose-300/40"
                  />
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                    className="absolute inset-0 rounded-full bg-rose-300/30"
                  />
                </>
              )}
            </AnimatePresence>
            <span className="text-4xl relative z-10">🎤</span>
          </motion.button>
          
          {/* 无提示文字 */}
        </div>

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center gap-3 py-2"
            >
              <div className="flex gap-1 items-end">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [12, 28, 12], scaleY: [0.5, 1, 0.5] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5, 
                      delay: i * 0.1 
                    }}
                    className="w-2 bg-gradient-to-t from-rose-400 to-pink-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-base text-rose-500 font-bold">在听你说哦~</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-amber-600 text-sm font-medium">
          {isListening ? '请说话哦~' : '说话后再次点击麦克风即可发送'}
        </p>
      </div>

    </MobileShell>
  );
};

export default AIChat;

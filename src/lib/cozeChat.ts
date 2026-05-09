import { CozeAPI, ChatEventType, MessageStatus } from '@coze/api';

const COZE_API_KEY = import.meta.env.VITE_COZE_API_KEY || '';
const BOT_ID = '7637378853279088686';

// 获取或创建用户ID
function getUserId(): string {
  let userId = localStorage.getItem('coze_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('coze_user_id', userId);
  }
  return userId;
}

interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

export async function getAIReply(
  userMessage: string,
  conversationHistory: CozeMessage[] = []
): Promise<string> {
  if (!COZE_API_KEY) {
    // 如果没有 API Key，返回一个友好的提示
    return '星小宝暂时无法回复，请稍后再试~';
  }

  const client = new CozeAPI({
    token: COZE_API_KEY,
    baseURL: 'https://api.coze.cn',
  });

  const userId = getUserId();

  try {
    // 准备历史消息（最近10条）
    const historyMessages = conversationHistory.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 发起聊天
    const chatResp = await client.chat.create({
      bot_id: BOT_ID,
      user_id: userId,
      query: userMessage,
      stream: false,
      auto_save_history: true,
      additional_messages: historyMessages.length > 0 ? historyMessages : undefined,
    });

    const { conversation_id, id: chat_id } = chatResp.chat;

    // 轮询获取结果
    const maxWaitTime = 15000; // 15秒超时
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const chatInfo = await client.chat.retrieve({ chat_id, conversation_id });

      if (chatInfo.status === MessageStatus.COMPLETED) {
        // 获取消息列表
        const messagesResp = await client.chat.message.list({ chat_id, conversation_id });

        // 找到助手的回复
        const assistantMessage = messagesResp.messages.find(
          (msg) => msg.role === 'assistant' && msg.type === 'answer'
        );

        if (assistantMessage && assistantMessage.content) {
          return assistantMessage.content.trim();
        }

        return '星小宝暂时不知道说什么~';
      } else if (chatInfo.status === MessageStatus.FAILED) {
        console.error('Chat failed:', chatInfo);
        return '星小宝遇到了一点小问题，稍等一下哦~';
      }

      // 等待1秒后再次检查
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return '星小宝思考中...请稍后再试';
  } catch (error: any) {
    console.error('Coze API Error:', error);
    
    if (error?.code === 4101) {
      return '星小宝暂时无法回复，请稍后再试~';
    }
    
    return '星小宝遇到了一点小问题，稍等一下哦~';
  }
}

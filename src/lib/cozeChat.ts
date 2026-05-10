const COZE_API_KEY = 'pat_gRm0YNMfdE0PcnRPJy0dSDfosq4j5ITVGLtLqSSR9CLJ4Q8bx9rUqplRfzsHXAA2';
const BOT_ID = '7637378853279088686';

// 获取或创建用户ID
function getUserId(): string {
  let userId = localStorage.getItem('coze_user_id');
  if (!userId) {
    userId = 'star_baby_user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('coze_user_id', userId);
  }
  return userId;
}

interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface CozeAPIResponse {
  code: number;
  msg: string;
  messages: Array<{
    role: string;
    type: string;
    content: string;
    content_type: string;
  }>;
  conversation_id: string;
}

export async function getAIReply(
  userMessage: string,
  conversationHistory: CozeMessage[] = []
): Promise<string> {
  if (!COZE_API_KEY) {
    return '星小宝暂时无法回复，请稍后再试~';
  }

  const userId = getUserId();

  try {
    // 使用 /open_api/v2/chat 非流式接口
    const response = await fetch('https://api.coze.cn/open_api/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': `Bearer ${COZE_API_KEY}`,
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user: userId,
        query: userMessage,
        stream: false,
      }),
    });

    const data: CozeAPIResponse = await response.json();

    if (data.code !== 0) {
      console.error('Coze API Error:', data.msg);
      return '星小宝遇到了一点小问题，稍等一下哦~';
    }

    // 找到助手的回答
    const answerMessage = data.messages.find(
      (msg) => msg.role === 'assistant' && msg.type === 'answer'
    );

    if (answerMessage && answerMessage.content) {
      return answerMessage.content.trim();
    }

    return '星小宝暂时不知道说什么~';
  } catch (error) {
    console.error('Coze API Error:', error);
    return '星小宝遇到了一点小问题，稍等一下哦~';
  }
}

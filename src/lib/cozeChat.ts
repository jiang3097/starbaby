// Coze Bot 聊天 API
const API_KEY = import.meta.env.VITE_COZE_API_KEY || 'cztei_lrQtHogJaQ13ppl2U8o0zjeil63jzagwJ79ge9LlSnzFwzfLAno6DmWftY37dOQ8a';
const BOT_ID = '7637378853279088686';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  content: string;
  conversationId: string;
  chatId: string;
}

// 获取 AI 回复
export async function getAIReply(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    // 准备上下文消息（最近10条）
    const recentHistory = history.slice(-10);
    
    // 构建 additional_messages
    const additionalMessages = recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      type: msg.role === 'user' ? 'question' : 'answer',
      content_type: 'text'
    }));

    // 发起对话
    const response = await fetch('https://api.coze.cn/v3/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user_id: `book_user_${Date.now()}`,
        query: userMessage,
        stream: true,
        auto_save_history: true,
        additional_messages: additionalMessages
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // 流式响应处理
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            // 跳过 ping 消息
            if (data.event === 'ping') continue;
            
            // 获取回复内容
            if (data.type === 'answer' && data.content) {
              fullContent += data.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    if (!fullContent) {
      throw new Error('No content received');
    }

    return fullContent;
  } catch (error) {
    console.error('Coze API error:', error);
    throw error;
  }
}

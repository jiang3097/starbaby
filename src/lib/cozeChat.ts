// Coze Bot 聊天 API - 优化版
const API_KEY = import.meta.env.VITE_COZE_API_KEY || 'cztei_lrQtHogJaQ13ppl2U8o0zjeil63jzagwJ79ge9LlSnzFwzfLAno6DmWftY37dOQ8a';
const BOT_ID = '7637378853279088686';
const API_BASE = 'https://api.coze.cn/v3/chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 获取 AI 回复
export async function getAIReply(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    // 准备上下文消息（最近6条对话）
    const recentHistory = history.slice(-6);
    
    // 构建 additional_messages
    const additionalMessages = recentHistory.length > 0 
      ? recentHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          type: msg.role === 'user' ? 'question' : 'answer',
          content_type: 'text'
        }))
      : [{ role: 'user', content: '你好', type: 'question', content_type: 'text' }];

    // 发起对话（非流式）
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user_id: `user_${Date.now()}`,
        query: userMessage,
        stream: false,
        auto_save_history: true,
        additional_messages: additionalMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API Error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 检查响应状态
    if (data.code !== 0) {
      console.error('Coze API code error:', data);
      throw new Error(data.msg || 'API error');
    }

    const chatId = data.data.id;
    const conversationId = data.data.conversation_id;

    // 轮询获取结果（最多等待15秒）
    const maxAttempts = 15;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(
        `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (!statusResponse.ok) {
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      
      if (statusData.data?.status === 'completed') {
        // 获取消息列表
        const messagesResponse = await fetch(
          `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          
          // 找到 assistant 的回复
          const assistantMessage = messagesData.data?.find(
            (msg: any) => msg.role === 'assistant' && msg.type === 'answer'
          );
          
          if (assistantMessage?.content) {
            return assistantMessage.content.trim();
          }
        }
        
        break;
      } else if (statusData.data?.status === 'failed') {
        throw new Error('Chat failed');
      }
      
      attempts++;
    }

    // 超时或失败时返回空
    throw new Error('Timeout');
  } catch (error) {
    console.error('Coze Chat Error:', error);
    throw error;
  }
}

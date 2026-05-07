// 讯飞 TTS 后端代理服务
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { WebSocket } from 'ws';
import http from 'http';

const app = express();
const PORT = 8088;

// 讯飞配置
const XF_APPID = '8fe5843b';
const XF_API_SECRET = 'YjIwNjg1Y2U2ODRiNDFiZmEyYjgzZTUy';
const XF_API_KEY = 'f0d034b0c856de0d831b8b246ae8cc29';
const XF_TTS_URL = 'wss://tts-api.xfyun.cn/v2/tts';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 创建 HTTP 服务器
const server = http.createServer(app);

// 生成讯飞鉴权
function createAuth() {
  const now = new Date();
  const dateStr = now.toUTCString();
  
  // 签名字符串（用 sha256）
  const signatureOrigin = `host: tts-api.xfyun.cn\ndate: ${dateStr}\nGET /v2/tts HTTP/1.1`;
  
  // HMAC-SHA256
  const hmac = crypto.createHmac('sha256', XF_API_SECRET);
  hmac.update(signatureOrigin);
  const signature = hmac.digest('base64');
  
  // 构造 authorization
  const authOrigin = `api_key="${XF_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authOrigin).toString('base64');
  
  return { authorization, date: dateStr };
}

// HTTP 接口 - 返回 base64 音频
app.post('/tts', async (req, res) => {
  try {
    const { text, vcn = 'aisbabyxu' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '文本不能为空' });
    }
    
    console.log('[HTTP] 收到请求:', text.substring(0, 30), 'vcn:', vcn);
    
    const { authorization, date } = createAuth();
    
    const params = new URLSearchParams({
      authorization,
      date,
      host: 'tts-api.xfyun.cn'
    });
    
    // 连接讯飞 WebSocket
    const wsUrl = XF_TTS_URL + '?' + params.toString();
    
    const audioData = await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const audioChunks = [];
      let timeout = setTimeout(() => {
        ws.close();
        reject(new Error('连接超时'));
      }, 10000);
      
      ws.on('open', () => {
        console.log('[讯飞] WebSocket 连接成功');
        
        const request = {
          common: { app_id: XF_APPID },
          business: {
            aue: 'lame',
            vcn: vcn,
            speed: 50,
            volume: 50,
            pitch: 50
          },
          data: {
            status: 2,
            text: Buffer.from(text, 'utf8').toString('base64')
          }
        };
        
        ws.send(JSON.stringify(request));
      });
      
      ws.on('message', (data) => {
        try {
          const resp = JSON.parse(data.toString());
          
          if (resp.code !== 0) {
            console.error('[讯飞] 错误:', resp.code, resp.message);
            reject(new Error('讯飞接口错误: ' + resp.code + ' - ' + resp.message));
            ws.close();
            return;
          }
          
          if (resp.data && resp.data.audio) {
            audioChunks.push(resp.data.audio);
          }
          
          if (resp.data && resp.data.status === 2) {
            console.log('[讯飞] 合成完成');
            clearTimeout(timeout);
            resolve(audioChunks.join(''));
            ws.close();
          }
        } catch (e) {
          // 忽略解析错误
        }
      });
      
      ws.on('error', (e) => {
        console.error('[讯飞] WebSocket 错误:', e.message);
        clearTimeout(timeout);
        reject(e);
      });
      
      ws.on('close', () => {
        console.log('[讯飞] 连接关闭');
        clearTimeout(timeout);
      });
    });
    
    console.log('[HTTP] 返回音频, 大小:', audioData.length);
    res.json({ audio: audioData });
    
  } catch (error) {
    console.error('[HTTP] 请求失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 语音列表
app.get('/voices', (req, res) => {
  res.json([
    { id: 'aishabxuu', name: '许小宝童声', vcn: 'aisbabyxu' },
    { id: 'xiaoyan', name: '小燕女声', vcn: 'x4_xiaoyan' },
    { id: 'xiaolu', name: '小露女声', vcn: 'x4_yezi' },
    { id: 'xiaojing', name: '小婧女声', vcn: 'aisjinger' },
    { id: 'jiuxu', name: '许久男声', vcn: 'aisjiuxu' },
  ]);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log('讯飞 TTS 代理服务运行在 http://localhost:' + PORT);
  console.log('HTTP 接口: POST /tts { text, vcn } -> { audio: base64 }');
});

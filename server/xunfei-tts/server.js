// 讯飞 TTS 后端代理服务 (WebSocket 版本)
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';
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

// WebSocket 服务器
const wss = new WebSocketServer({ server });

// 存储等待中的请求
const pendingRequests = new Map();

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
  
  // 构造 authorization（algorithm 用 hmac-sha256）
  const authOrigin = `api_key="${XF_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authOrigin).toString('base64');
  
  return { authorization, date: dateStr };
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('[WS] 新的 WebSocket 连接');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'request') {
        // 前端请求
        const requestId = data.id;
        const { text, vcn = 'aisbabyxu' } = data;
        
        console.log('[WS] 收到请求:', text.substring(0, 30), 'vcn:', vcn);
        
        // 连接讯飞 WebSocket
        const { authorization, date } = createAuth();
        
        const params = new URLSearchParams({
          authorization,
          date,
          host: 'tts-api.xfyun.cn'
        });
        
        const xfWs = new (require('ws'))(XF_TTS_URL + '?' + params.toString());
        let audioChunks = [];
        let closed = false;
        
        xfWs.on('open', () => {
          console.log('[讯飞] WebSocket 连接成功');
          
          const request = {
            common: { app_id: XF_APPID },
            business: {
              aue: 'lame',
              vcn: vcn,
              speed: 50,
              volume: 50,
              pitch: 50,
              sample_rate: 16000
            },
            data: {
              status: 2,
              text: Buffer.from(text, 'utf8').toString('base64')
            }
          };
          
          xfWs.send(JSON.stringify(request));
        });
        
        xfWs.on('message', (xfData) => {
          try {
            const resp = JSON.parse(xfData.toString());
            console.log('[讯飞] 响应:', resp.code, resp.message);
            
            if (resp.code !== 0) {
              ws.send(JSON.stringify({ type: 'error', id: requestId, error: resp.message }));
              xfWs.close();
              return;
            }
            
            if (resp.data?.audio) {
              audioChunks.push(resp.data.audio);
            }
            
            if (resp.data?.status === 2) {
              // 发送完成
              const allAudio = audioChunks.join('');
              ws.send(JSON.stringify({ 
                type: 'complete', 
                id: requestId, 
                audio: allAudio 
              }));
              xfWs.close();
            }
          } catch (e) {
            // 忽略解析错误
          }
        });
        
        xfWs.on('error', (e) => {
          console.error('[讯飞] 错误:', e.message);
          if (!closed) {
            ws.send(JSON.stringify({ type: 'error', id: requestId, error: e.message }));
          }
        });
        
        xfWs.on('close', () => {
          console.log('[讯飞] 连接关闭');
          closed = true;
        });
        
        ws.on('close', () => {
          if (!closed) {
            xfWs.close();
          }
        });
      }
    } catch (e) {
      console.error('[WS] 解析消息失败:', e);
    }
  });
  
  ws.on('error', (e) => {
    console.error('[WS] 错误:', e);
  });
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
  console.log(`讯飞 TTS 代理服务运行在 http://localhost:${PORT}`);
  console.log('WebSocket: ws://localhost:' + PORT);
  console.log('使用方法: 通过 WebSocket 发送 { type: "request", id, text, vcn }');
});

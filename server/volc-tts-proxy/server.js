import Koa from 'koa';
import cors from 'koa-cors';
import Router from 'koa-router';
import fetch from 'node-fetch';

const app = new Koa();
const router = new Router();

// 添加 body 解析中间件
app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST' && ctx.request.headers['content-type']?.includes('application/json')) {
    let body = '';
    for await (const chunk of ctx.req) {
      body += chunk;
    }
    ctx.request.body = JSON.parse(body || '{}');
  }
  await next();
});

// 火山引擎配置
const VOLC_CONFIG = {
  APP_ID: '1368516150',
  ACCESS_TOKEN: 'vkMSggBglPENCr3VMfMmECdwUBEac_Wy',
  TTS_URL: 'https://openspeech.bytedance.com/api/v1/tts'
};

// TTS 路由
router.post('/tts', async (ctx) => {
  const { text, voice = 'BV703', speed = 1.0, volume = 1.0, pitch = 1.0 } = ctx.request.body;

  if (!text) {
    ctx.status = 400;
    ctx.body = { error: '文本不能为空' };
    return;
  }

  try {
    console.log(`[火山TTS代理] 请求合成: "${text.substring(0, 20)}..." 声音: ${voice}`);

    const response = await fetch(VOLC_CONFIG.TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${VOLC_CONFIG.ACCESS_TOKEN}`,
        'Resource-Id': 'volc.megatts.2_0',
      },
      body: JSON.stringify({
        app: {
          appid: VOLC_CONFIG.APP_ID,
          token: VOLC_CONFIG.ACCESS_TOKEN,
          cluster: 'volc_megatts_cloud',
        },
        user: {
          uid: 'anonymous',
        },
        audio: {
          voice,
          encoding: 'mp3',
          speed_ratio: speed,
          volume_ratio: volume,
          pitch_ratio: pitch,
          rate: 24000,
        },
        request: {
          reqid: `tts_${Date.now()}`,
          text,
          text_type: 0,
          operation: 'submit',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[火山TTS代理] 火山引擎返回错误: ${response.status} - ${errorText}`);
      ctx.status = response.status;
      ctx.body = { error: `火山引擎错误: ${response.status}`, details: errorText };
      return;
    }

    // 获取音频数据
    const audioBuffer = await response.buffer();
    console.log(`[火山TTS代理] 合成成功，音频大小: ${audioBuffer.length} bytes`);

    // 返回音频
    ctx.type = 'audio/mp3';
    ctx.body = audioBuffer;
  } catch (error) {
    console.error(`[火山TTS代理] 请求失败:`, error);
    ctx.status = 500;
    ctx.body = { error: '请求失败', message: error.message };
  }
});

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', service: 'volc-tts-proxy' };
});

app.use(cors());
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 8089;
app.listen(PORT, () => {
  console.log(`[火山TTS代理] 服务运行在 http://localhost:${PORT}`);
  console.log(`[火山TTS代理] 使用声音: BV703 (俏皮女声)`);
});

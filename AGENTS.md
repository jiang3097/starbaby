## 项目概述
React + Vite + TypeScript + Tailwind CSS 的前端项目，支持多套 UI 组件库（Ant Design、MUI、Arco Design、TDesign）。

## 技术栈
- **运行时**: Node.js 24 (nodejs-24)
- **包管理器**: pnpm
- **构建工具**: Vite
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **UI 库**: Ant Design, MUI, Arco Design, TDesign, Radix UI

## 目录结构
```
/workspace/projects/
├── src/               # 源代码目录
│   ├── components/    # 组件
│   ├── framework/     # 框架相关
│   ├── lib/           # 工具库
│   ├── pages/         # 页面
│   ├── App.tsx        # 主应用入口
│   ├── main.tsx       # 入口文件
│   └── index.css      # 全局样式
├── scripts/           # 脚本目录
│   ├── build.sh       # 部署构建脚本
│   ├── run.sh         # 部署运行脚本
│   ├── coze-preview-build.sh   # 预览构建脚本
│   └── coze-preview-run.sh     # 预览运行脚本
├── index.html         # HTML 入口
├── vite.config.ts     # Vite 配置
├── tailwind.config.js # Tailwind 配置
├── tsconfig.json      # TypeScript 配置
└── package.json       # 项目依赖
```

## 关键入口
- **预览**: `pnpm dev` 或 `bash scripts/coze-preview-run.sh`（端口 5000）
- **构建**: `pnpm build` 或 `bash scripts/build.sh`（输出目录 dist/）
- **部署运行**: `bash scripts/run.sh`（端口 5000）

## 运行与预览
- 预览服务通过 `scripts/coze-preview-run.sh` 启动，强制使用 5000 端口
- 部署构建通过 `scripts/build.sh` 执行依赖安装和前端构建
- 部署运行通过 `scripts/run.sh` 使用 `npx serve` 提供 dist/ 静态文件，端口 5000

## 用户偏好与长期约束
- 只使用 pnpm 作为包管理器
- HTTP 服务端口固定为 5000
- Vite 构建输出目录默认为 `dist/`

## 常见问题和预防
- 预览链路与部署链路脚本分离，避免混淆
- 端口 5000 是唯一对外暴露端口，禁止使用其他端口

## 用户形象系统

使用 React Context 实现全局用户状态管理。

### 核心模块
- `src/context/UserContext.tsx` - 用户状态管理
- `src/pages/00_Welcome.tsx` - 欢迎/形象选择页面

### 形象数据 (STAR_AVATARS)
4种可爱形象可选：星星、月亮、太阳、云朵，每种包含：
- id: 唯一标识
- name: 默认名称
- color: 渐变色配置
- emoji: 对应表情
- image: 形象图片URL

### 使用方式
```typescript
import { useUser, STAR_AVATARS } from '../context/UserContext';

const MyComponent = () => {
  const { profile, avatar, updateProfile } = useUser();
  // profile: { avatarId, name }
  // avatar: STAR_AVATARS 中的完整对象
};
```

### 持久化
- 使用 localStorage 存储用户选择
- Key: `star_baby_profile`

## Coze AI 聊天功能

基于 Coze API 实现星小宝智能对话。

### 核心模块
- `src/lib/cozeChat.ts` - Coze 聊天 API 封装
- `src/pages/03_AIChat.tsx` - AI 宠物聊天页面

### API 配置
- **Bot ID**: `7637378853279088686`
- **API Endpoint**: `https://api.coze.cn/open_api/v2/chat`
- **Token**: 存储在 `.env` 的 `VITE_COZE_API_KEY`
- **Token 类型**: PAT (Personal Access Token)，建议在 https://www.coze.cn/user/profile 创建

### API 调用方式
```typescript
import { getAIReply } from '../lib/cozeChat';

// 调用星小宝回复
const reply = await getAIReply('你好');
```

### 注意事项
- Bot 需要发布「API」渠道才能通过 API 访问
- PAT token 有效期较长，但仍需定期检查
- 如果 token 过期，星小宝会回复"暂时无法回复"
- 用户 ID 存储在 localStorage (`coze_user_id`)，保持会话连贯

## 语音功能

基于 Web Speech API 实现，支持多种声音包选择。

### 核心模块
- `src/lib/useSpeech.ts` - 语音工具（朗读、语音识别、跟读）
- `src/components/VoiceSelector.tsx` - 声音选择组件

### 声音包
支持 4 种声音：标准女声、温暖男声、童声、爷爷声音

### 功能说明
1. **语音输入**: 点击麦克风按钮开始语音识别，自动将语音转换为文字
2. **AI 朗读**: AI 消息支持"朗读"按钮，点击后 TTS 朗读消息内容
3. **跟读功能**: 
   - 某些 AI 消息支持"跟读"按钮
   - 点击后 AI 先朗读一遍，然后进入跟读模式
   - 用户跟随朗读后，可点击"完成跟读"确认

### 技术实现
- SpeechRecognition API: 语音识别（Chrome/Safari/Edge 支持）
- SpeechSynthesis API: 语音合成（TTS）
- 中文优先语音选择
- 支持的回调: `onTranscript` 获取识别结果

## 绘本闯关功能
- `src/pages/05_BookInteraction.tsx` - 绘本互动页面

### 三个主题
1. **情绪识别** - 认识不同的情绪
2. **寻求帮助** - 学会正确表达需求
3. **日常使用** - 学习日常沟通表达

### 游戏流程
1. 展示故事图片
2. AI 朗读故事句子
3. 用户跟读
4. AI 提出问题
5. 用户用语音回答
6. 即时反馈 + 星星奖励

## 趣味训练游戏

### 1. 表情猜猜看
- `src/pages/09_EmotionGuess.tsx`
- 四种情绪：开心😊、难过😢、生气😠、害怕😨
- 显示人物图片 + 提示描述
- 2x2 选项选择
- 答对/答错即时反馈

### 2. 指令寻物
- `src/pages/10_InstructionFind.tsx`
- 展示场景图片
- AI 朗读问题
- 选择正确答案
- 支持重新听问题

### 3. 拼图表达
- `src/pages/11_PuzzleExpress.tsx` - 拖拽拼图游戏

#### 功能说明
- 4张图片：客厅、小狗等不同场景
- 拖拽玩法：将原图均等裁剪为4个正方形碎片（2x2）
- 参考图：游戏界面上方显示完整参考图
- 碎片打乱：初始位置随机分散
- 自动归位检测：碎片拖到正确位置附近自动标记
- 成功结算：全部归位后显示奖杯动画和完成的完整图片
- 导航：重新开始、下一关、返回选图

### 绘本闯关功能
- `src/pages/05_BookInteraction.tsx` - 绘本互动页面
- 点击播放按钮朗读当前句子
- 点击"跟读练习"按钮进入跟读模式
- 支持声音包选择（点击右上角喇叭图标）

## 训练数据统计系统

使用 React Context 实现全局训练数据统计。

### 核心模块
- `src/context/AppContext.tsx` - 统一管理训练数据和使用限制
- `src/components/TimeLimitModal.tsx` - 使用限制弹窗组件

### 统计数据
| 字段 | 说明 | 更新时机 |
|------|------|----------|
| trainingMinutes | 今日训练时长(分钟) | 进入训练页面时开始计时，每分钟+1 |
| expressionCount | 主动表达次数 | AI聊天发送消息 + 绘本答题完成 |
| gamePassCount | 趣味闯关通关次数 | 每完成趣味训练一道题 |
| chatMessages | AI聊天消息数 | AI聊天发送消息 |
| bookCompleted | 绘本完成题目数 | 绘本答题完成 |
| trainingGames | 趣味训练完成数 | 每个趣味训练游戏完成 |

### 周数据（本周活跃度）
- 存储结构：`WeeklyStats { [date: string]: { trainingMinutes, expressionCount, gamePassCount } }`
- 以天为单位记录本周数据（周一到周日）
- 存储在 localStorage，Key: `star_baby_weekly_stats`

### 使用限制功能
- 家长可在家长空间设置每日使用时长限制
- 预设选项：15分钟、30分钟、45分钟、1小时、1.5小时、2小时
- 支持自定义输入分钟数
- 达到限制时间后弹出温馨提醒弹窗
- 弹窗包含星小宝形象、温馨提醒语、家长密码输入
- 输入密码1234解除限制

### 数据重置
- 每日自动重置统计数据
- 周数据每周一自动重置
- 存储在 localStorage，Key: `star_baby_daily_stats`

### 页面关联
- AI聊天页面 (03_AIChat.tsx): 发送消息时计数，进入页面开始计时
- 绘本闯关页面 (05_BookInteraction.tsx): 答题完成时计数，进入页面开始计时
- 趣味训练页面 (09/10/11): 进入页面开始计时，每道题完成时趣味闯关+1
- 成长记录页面 (07_GrowthRecord.tsx): 读取并显示统计数据和折线图

### 使用方式
```typescript
import { useStats, getWeekDates } from '../context/StatsContext';

const MyComponent = () => {
  const { 
    dailyStats,           // 当前统计数据
    weeklyStats,         // 本周数据
    startTraining,        // 开始训练计时
    endTraining,          // 结束训练计时
    incrementExpression,  // 增加主动表达次数
    incrementGamePass,    // 增加闯关次数
  } = useStats();
};
```

### 成长记录折线图
- 本周语言活跃度折线图
- 权重计算：训练时长40% + 主动表达30% + 趣味闯关30%
- 以天为单位显示本周7天数据
- 今日数据高亮显示

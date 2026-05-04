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

## 语音功能（AI 宠物聊天）
基于 Web Speech API 实现，包含语音识别、语音合成和跟读功能。

### 核心模块
- `src/lib/useSpeech.ts` - 语音工具 Hook

### 功能说明
1. **语音输入**: 点击麦克风按钮开始语音识别，自动将语音转换为文字
2. **AI 朗读**: AI 消息支持"朗读"按钮，点击后 TTS 朗读消息内容
3. **跟读功能**: 
   - 某些 AI 消息支持"跟读"按钮
   - 点击后 AI 先朗读一遍，然后进入跟读模式
   - 用户跟随朗读后，可点击"完成跟读"确认
   - 系统会评估相似度并给出反馈

### 技术实现
- SpeechRecognition API: 语音识别（Chrome/Safari/Edge 支持）
- SpeechSynthesis API: 语音合成（TTS）
- 中文优先语音选择
- 支持的回调: `onTranscript` 获取识别结果

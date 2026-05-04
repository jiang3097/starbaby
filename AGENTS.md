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

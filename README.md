# mini_game_chess

> Tauri + React 国际象棋小游戏 支持桌面端运行

> 状态: 开发中 无发行版

## 功能

- 本地双人轮流下棋
- 加载/导出 FEN棋谱

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 桌面端 | Tauri 2 |
| 前端框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建工具 | Vite 8 |
| 状态管理 | Zustand 5 |
| 不可变数据 | Immer + use-immer |
| 表单 | react-hook-form |
| 包管理 | pnpm 12.11.2 |

## 环境

- Node.js ^18
- pnpm ^12.11.2
- Rust ^1.98.0
- cargo ^1.98.0

Windows 还需要 WebView2
macOS 需要 Xcode Command Line Tools
Linux 需要 WebKitGTK 等依赖，具体参考 [Tauri 官方文档](https://v2.tauri.app/zh-cn/start/prerequisites/)

## 项目启动

### 0. 安装 pnpm

如果本机没有 pnpm，可以通过 Corepack 启用：

```bash
corepack enable
corepack prepare pnpm@12.11.2 --activate
```

也可以直接安装：

```bash
npm install -g pnpm@12.11.2
```
### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动 Tauri 桌面端开发模式

```bash
pnpm tauri dev
```
## 目录结构

```text
hess/
├── .vscode/             # vscode配置文件
│   ├── extensions.json/ # Tauri推荐扩展
│   └── settings.json/   # 为rust-analyzer指定rust的项目目录
├── public/              # 静态资源
├── src/                 # React 前端源码
│   ├── assets/          # 图片、字体等资源
│   ├── components/      # 通用组件
│   ├── hooks/           # 钩子函数
│   │   └── stores/      # zustand Store
│   ├── types/           # 类型系统以及相关数据结构
│   ├── utils/           # 通用函数
│   ├── App.tsx          # 最外部组件
│   ├── Chess.module.css # 本体样式
│   ├── Chess.tsx        # 游戏本体组件
│   ├── index.css        # 全局样式
│   ├── main.tsx         # 前端入口
│   └── vite-env.d.ts
├── src-tauri/           # Tauri 桌面端源码
│   ├── capabilities/    # 配置插件许可
│   │   └── default.json
│   ├── icons/           # 图标
│   ├── src/             # Rust 源码
│   ├── .gitignore
│   ├── build.rs
│   ├── Cargo.lock
│   ├── Cargo.toml
│   └── tauri.conf.json  # Tauri 配置
├── .gitignore
├── index.html
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## TODO

### 未完成

#### 近期目标

- [ ] 悔棋
- [ ] 将军
- [ ] 将死
- [ ] 逼和
- [ ] 胜负和平局的判定
- [ ] 被将军攻击源指示
- [ ] 送将禁止格攻击源指示
- [ ] 设置表单及设置文件的本地化存储
- [ ] Config: 本地切换回合时棋盘旋转180deg
- [ ] Config: 取消落子时的不同色块提示
- [ ] Config: 摸子必落
- [ ] Config: 新增并允许切换 棋盘/棋子 样式
- [ ] Config?: 吃子不删除 放入'墓地'

#### 长期目标

- [ ] 完整可玩的Release版本发布
- [ ] 键盘控制
- [ ] 与其他记谱法的转换
- [ ] 本地人机对战
- [ ] 在线联机对战
- [ ] 移动端适配

### 已完成

- [x] 棋盘布局
- [x] 棋子选中时的落子提示
- [x] 棋子移动
- [x] 吃棋
- [x] 吃过路兵
- [x] 王车易位
- [x] 兵的升变
- [x] State转FEN
- [x] FEN转State
- [x] 加载FEN棋谱
- [x] 导出FEN棋谱
- [x] LAN记录

## 致谢

- Tauri
- React
- Vite
- Zustand
- 其他各库的贡献者
- 各技术文档编撰者
- 整个开源社区
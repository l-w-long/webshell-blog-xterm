# WebShell Blog

> 终端风格的博客系统，让阅读变成一场黑客体验

![Snazzy Theme](https://img.shields.io/badge/Theme-Snazzy-ff79c6?style=flat-square)
![Xterm.js](https://img.shields.io/badge/Terminal-Xterm.js-50fa7b?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-6272a4?style=flat-square)

## 特性

- 🖥️ **真实终端体验** - 完整的命令输入、Tab 补全、命令历史
- 📁 **Linux 命令兼容** - `ls`, `cd`, `cat`, `read` 等标准命令
- 🎨 **Snazzy 主题** - 漂亮的 Dracula 风格配色
- 📝 **文章管理** - 分类目录结构，支持 Markdown
- 🔗 **双面板联动** - 终端与浏览器同步操作
- 🌏 **中文支持** - 完善的中文目录和补全支持

## 快速开始

### 方式一：直接打开

```bash
# 直接用浏览器打开
open web/index.html
```

### 方式二：本地服务器

```bash
cd web
npx serve
# 访问 http://localhost:3000
```

### 方式三：Go 服务器

```bash
cd server
go run cmd/main.go
# 访问 http://localhost:8080
```

## 使用指南

### 基本命令

```bash
ls              # 列出目录
ll              # 详细列表
cd articles     # 进入目录
read 1          # 阅读文章
help            # 查看帮助
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 自动补全 |
| `↑` `↓` | 命令历史 |
| `Ctrl+C` | 中断输入 |
| `Ctrl+L` | 清屏 |

详细文档请查看 [docs/README.md](docs/README.md)

## 目录结构

```
webshellblog/
├── web/                    # 前端
│   ├── index.html          # 主页面
│   └── lib/                # 依赖库
├── server/                 # Go 后端
│   └── cmd/                # 入口
├── docs/                   # 文档
│   ├── README.md           # 功能说明
│   └── CHANGELOG.md       # 版本迭代
└── project.md              # 项目规划
```

## 技术栈

- **终端**: [Xterm.js](https://xtermjs.org/)
- **前端**: Vanilla JavaScript
- **后端**: Go + WebSocket
- **主题**: Snazzy (Dracula 变体)

## 截图预览

```
┌─────────────────────────────────────────────────┐
│  WebShell Blog // Terminal-style Blog System    │
├─────────────────────────────────────────────────┤
│  $ ls                                           │
│  articles/  posts/  readme.md                   │
│                                                 │
│  $ cd articles                                  │
│  [cd articles]                                  │
│                                                 │
│  $ ll                                           │
│  drwxr-xr-x   2 前端技术/                       │
│  drwxr-xr-x   2 后端技术/                       │
│  drwxr-xr-x   2 运维部署/                       │
│                                                 │
│  $ read 1                                      │
│  [Opening article...]                           │
└─────────────────────────────────────────────────┘
```

## License

MIT © WebShell Blog Team

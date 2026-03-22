# Iter01: 基础架构

## 目录结构

```
webshellblog/
├── web/
│   ├── index.html          # 主页面
│   ├── css/style.css       # 样式
│   ├── js/
│   │   ├── terminal.js     # 终端逻辑
│   │   ├── image-overlay.js # 图片叠加层
│   │   └── sixel.js        # Sixel 渲染
│   └── lib/                # 第三方库
│       ├── xterm.js
│       └── xterm-addon-fit.js
├── server/
│   ├── cmd/
│   │   ├── main.go         # WebSocket 服务器
│   │   └── image-server.go # 图片服务
│   └── go.mod
├── docs/
│   ├── README.md          # 功能文档
│   └── CHANGELOG.md        # 更新日志
└── README.md
```

## 运行方式

### 前端
```bash
cd web
npx serve
# 访问 http://localhost:3000
```

### 后端
```bash
cd server
go run cmd/main.go
# 访问 http://localhost:8080
```

## 特性

- Xterm.js 终端模拟
- Tab 补全
- 命令历史
- 图片内嵌显示（DOM 模式）
- Snazzy 主题

## 注意事项

此版本为原始代码，未做任何重构。

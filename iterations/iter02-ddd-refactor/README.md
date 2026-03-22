# Iter02: DDD 重构

## 概述

本次迭代对代码进行了领域驱动设计（DDD）重构，引入设计模式，提高代码的可维护性和扩展性。

## DDD 分层架构

```
web/js/
├── domain/              # 领域层 - 核心业务逻辑
│   ├── entities/        # 实体
│   │   └── index.js     # Terminal, Client, Article, Category
│   └── value-objects/   # 值对象
│       └── index.js     # Theme, Command, Message
├── application/         # 应用层 - 服务编排
│   └── command-registry.js
├── infrastructure/      # 基础设施层 - 技术实现
│   ├── adapters.js      # WebSocket, Terminal, Storage 适配器
│   └── image-renderer.js # 图片渲染策略
├── interfaces/          # 接口层 - 用户交互
│   └── terminal-controller.js
├── plugins/             # 插件系统
│   └── index.js
└── themes/              # 主题系统
    └── theme-manager.js
```

## 设计模式应用

### 1. 工厂模式 (Factory)
- `ImageRendererFactory`: 创建图片渲染器

### 2. 策略模式 (Strategy)
- `ImageRenderStrategy`: 图片渲染策略接口
- `DOMRenderStrategy`: DOM 渲染
- `SixelRenderStrategy`: Sixel 渲染

### 3. 单例模式 (Singleton)
- `ThemeManager`: 全局主题管理器
- `CommandRegistry`: 全局命令注册表

### 4. 观察者模式 (Observer)
- 事件监听系统

### 5. 装饰器模式 (Decorator)
- 命令中间件

## 领域模型

### Terminal (聚合根)
- 管理终端会话状态
- 维护客户端连接
- 处理命令历史

### Client (实体)
- WebSocket 连接管理
- 与 Terminal 关联

### Theme (值对象)
- 不可变的主题配置
- 支持序列化

### Command (值对象)
- 命令定义
- 执行逻辑

## 扩展点

### 命令扩展
```javascript
CommandRegistry.getInstance().register({
    name: 'custom',
    handler: (args, context) => { /* ... */ },
    description: 'Custom command'
});
```

### 图片渲染器扩展
```javascript
ImageRendererFactory.create('custom', { /* options */ });
```

## Go 后端 DDD 结构

```
server/internal/
├── domain/
│   ├── entities/
│   │   ├── terminal.go    # 终端实体
│   │   └── article.go    # 文章实体
│   └── services/         # 领域服务
├── application/
│   └── services.go       # 应用服务
└── infrastructure/
    └── websocket.go      # 基础设施
```

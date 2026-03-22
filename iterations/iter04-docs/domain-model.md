# DDD 领域模型设计文档

## 1. 项目概述

WebShell Blog 是一个终端风格的博客系统，采用 DDD（领域驱动设计）架构进行重构。

## 2. 领域模型

### 2.1 核心域 (Core Domain)

#### Terminal (终端)
- **职责**: 终端会话管理、命令解析、输出处理
- **聚合根**: Terminal
- **属性**:
  - `id`: 终端唯一标识
  - `width`: 终端宽度
  - `height`: 终端高度
  - `cwd`: 当前工作目录
  - `history`: 命令历史
  - `env`: 环境变量

#### Client (客户端)
- **职责**: WebSocket 客户端连接管理
- **实体**: Client
- **属性**:
  - `id`: 客户端唯一标识
  - `conn`: WebSocket 连接
  - `terminalId`: 关联的终端ID
  - `connectedAt`: 连接时间

#### Article (文章)
- **职责**: 博客文章管理
- **实体**: Article
- **属性**:
  - `id`: 文章ID
  - `title`: 标题
  - `content`: 内容
  - `category`: 分类
  - `tags`: 标签
  - `author`: 作者
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间

#### Category (分类)
- **职责**: 文章分类管理
- **实体**: Category
- **属性**:
  - `id`: 分类ID
  - `name`: 名称
  - `parentId`: 父分类ID
  - `icon`: 图标

### 2.2 支持域 (Supporting Domain)

#### Theme (主题)
- **职责**: 主题系统管理，支持扩展
- **值对象**: Theme
- **属性**:
  - `id`: 主题ID
  - `name`: 主题名称
  - `colors`: 颜色配置
  - `font`: 字体配置

#### ImageRenderer (图片渲染器)
- **职责**: 图片渲染策略
- **策略模式**: ImageRenderer
- **实现**:
  - `DOMRenderer`: DOM 叠加渲染
  - `SixelRenderer`: Sixel 协议渲染

### 2.3 通用域 (Generic Domain)

#### Command (命令)
- **职责**: 命令执行
- **实体**: Command
- **属性**:
  - `name`: 命令名称
  - `handler`: 命令处理器
  - `completions`: 自动补全

## 3. 设计模式应用

### 3.1 工厂模式 (Factory)
- `TerminalFactory`: 创建终端实例
- `CommandFactory`: 创建命令实例

### 3.2 策略模式 (Strategy)
- `ImageRenderStrategy`: 图片渲染策略接口
- `DOMRenderStrategy`: DOM 渲染策略
- `SixelRenderStrategy`: Sixel 渲染策略

### 3.3 观察者模式 (Observer)
- `TerminalObserver`: 终端事件观察者
- `ClientObserver`: 客户端事件观察者

### 3.4 装饰器模式 (Decorator)
- `CommandLogger`: 命令日志装饰器
- `CommandValidator`: 命令验证装饰器

### 3.5 单例模式 (Singleton)
- `ThemeManager`: 主题管理器（全局单例）
- `CommandRegistry`: 命令注册表

## 4. 扩展点设计

### 4.1 命令扩展
```javascript
// 注册新命令
CommandRegistry.register({
    name: 'custom',
    handler: (args) => { /* ... */ },
    completions: ['option1', 'option2']
});
```

### 4.2 主题扩展
```javascript
// 安装新主题
ThemeManager.install({
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: { /* ... */ }
});
```

### 4.3 图片渲染器扩展
```javascript
// 注册新的图片渲染器
ImageRendererRegistry.register('sixel', new SixelRenderer());
```

## 5. 迭代规划

### Iter01: 基础架构
- 原始代码整理
- 基础目录结构

### Iter02: DDD 重构
- 领域模型设计
- 设计模式应用
- 代码分层

### Iter03: 主题系统
- Theme Manager 实现
- 主题扩展能力
- 插件系统

### Iter04: 文档完善
- API 文档
- 使用指南

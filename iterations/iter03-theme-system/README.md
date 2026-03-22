# Iter03: 主题系统

## 概述

本次迭代实现了完整的主题系统，支持主题安装、切换、卸载，以及插件扩展能力。

## 主题系统架构

### ThemeManager (主题管理器)
- 单例模式，全局唯一
- 支持主题的安装、卸载、切换
- 事件监听机制

### 主题配置结构
```javascript
{
    id: 'theme-id',
    name: 'Theme Name',
    isDefault: false,
    colors: {
        bg: '#282a36',
        fg: '#f8f8f2',
        // ... 更多颜色
    },
    font: {
        family: 'monospace',
        size: '13px'
    }
}
```

## 内置主题

### 1. Snazzy (默认)
- Dracula 风格变体
- 粉紫色调

### 2. Dracula
- 经典 Dracula 主题

### 3. Monokai
- Sublime Text 风格

### 4. Nord
- 北欧风格冷色调

## 使用方法

### 获取主题管理器
```javascript
const themeManager = ThemeManager.getInstance();
```

### 安装主题
```javascript
themeManager.install({
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
        bg: '#0d0d0d',
        fg: '#00ff00',
        pink: '#ff00ff'
    }
});
```

### 切换主题
```javascript
themeManager.apply('cyberpunk');
```

### 监听主题变化
```javascript
themeManager.addListener((event, theme) => {
    console.log(`Theme ${event}: ${theme.name}`);
});
```

## 主题扩展 (插件)

### ThemePlugin 接口
```javascript
class MyThemePlugin extends ThemePlugin {
    onInstall(manager) {
        // 安装钩子
    }
    
    onApply(theme) {
        // 应用钩子
    }
}
```

### 创建自定义主题插件
```javascript
class CyberpunkPlugin extends ThemePlugin {
    constructor() {
        super({
            id: 'cyberpunk-plugin',
            name: 'Cyberpunk Theme Plugin',
            version: '1.0.0'
        });
    }
    
    onInstall(manager) {
        manager.install({
            id: 'cyberpunk',
            name: 'Cyberpunk',
            colors: {
                bg: '#0d0d0d',
                fg: '#00ff00',
                red: '#ff0000',
                cyan: '#00ffff'
            }
        });
    }
}
```

## CSS 变量

主题系统使用 CSS 变量:

```css
:root {
    --bg;
    --bg-alt;
    --fg;
    --comment;
    --pink;
    --green;
    --orange;
    --purple;
    --yellow;
    --cyan;
    --red;
    --border;
}
```

## 扩展能力

### 1. 字体扩展
```javascript
themeManager.install({
    id: 'custom',
    font: {
        family: '"Fira Code", monospace',
        size: '14px',
        weight: 'bold'
    }
});
```

### 2. 动画扩展
```javascript
themeManager.addListener((event, theme) => {
    if (event === 'apply') {
        document.body.style.transition = 'background 0.3s ease';
    }
});
```

### 3. 响应式主题
```javascript
const theme = {
    id: 'responsive',
    colors: {
        bg: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#282a36' : '#ffffff',
        fg: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#f8f8f2' : '#282a36'
    }
};
```

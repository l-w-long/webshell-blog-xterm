/**
 * WebShell Blog Server
 * 纯前端静态服务器 + 文章API
 * 无命令执行，安全无风险
 * 
 * 使用方法：
 *   npm install
 *   npm start
 *   访问 http://localhost:3000
 * 
 * 文章目录：./articles/
 * 新增文章：直接在 articles/ 目录创建 .md 文件
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 文章目录（在同级 articles 文件夹）
const ARTICLES_DIR = path.join(__dirname, 'articles');
const DOCS_DIR = path.join(__dirname, 'docs');

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ['.md', '.txt'];

// 静态文件服务（index.html, css, js 等）
app.use(express.static(__dirname));

// CORS 设置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

/**
 * 安全读取文件
 * 防护：路径遍历、非法文件类型
 */
function safeReadFile(filePath) {
    // 解析绝对路径
    const resolved = path.resolve(filePath);
    
    // 获取允许的目录
    const allowedDirs = [path.resolve(ARTICLES_DIR), path.resolve(DOCS_DIR)];
    
    // 检查文件是否在允许目录内
    const isAllowed = allowedDirs.some(dir => resolved.startsWith(dir));
    if (!isAllowed) {
        return { error: 'Forbidden: File outside allowed directory' };
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(resolved)) {
        return { error: 'File not found' };
    }
    
    // 检查文件类型
    const ext = path.extname(resolved).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { error: 'Invalid file type' };
    }
    
    try {
        const content = fs.readFileSync(resolved, 'utf-8');
        return { content };
    } catch (e) {
        return { error: 'Cannot read file: ' + e.message };
    }
}

/**
 * 扫描目录获取所有文章
 */
function scanArticles(dir, basePath = '') {
    const articles = [];
    
    if (!fs.existsSync(dir)) {
        return articles;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // 递归扫描子目录
            const subArticles = scanArticles(fullPath, path.join(basePath, item));
            articles.push(...subArticles);
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (ALLOWED_EXTENSIONS.includes(ext)) {
                const relativePath = path.join(basePath, item);
                const id = item.replace(ext, '');
                
                articles.push({
                    id: id,
                    path: '/' + relativePath.replace(/\\/g, '/'),
                    name: item,
                    dir: basePath
                });
            }
        }
    }
    
    return articles;
}

/**
 * 根据路径获取目录分类信息
 */
function getCategoryInfo(filePath) {
    const parts = filePath.split('/').filter(p => p);
    
    // articles/frontend/1.md -> ['articles', 'frontend', '1.md']
    const categoryMap = {
        'articles': { name: '技术文章', icon: '📁' },
        'posts': { name: '随笔', icon: '📝' },
        'docs': { name: '文档', icon: '📚' },
        'frontend': { name: '前端技术', icon: '🎨' },
        'backend': { name: '后端技术', icon: '⚙️' },
        'devops': { name: '运维部署', icon: '🚀' },
        'life': { name: '生活随笔', icon: '🌱' },
        'tech': { name: '技术分享', icon: '💡' }
    };
    
    let category = 'default';
    let displayPath = '';
    
    if (parts[0] === 'articles' || parts[0] === 'posts' || parts[0] === 'docs') {
        category = parts[0];
        displayPath = categoryMap[category]?.name || category;
        
        if (parts[1]) {
            const subCategory = categoryMap[parts[1]];
            if (subCategory) {
                category = parts[1];
                displayPath = subCategory.name;
            }
        }
    } else if (parts[0] === 'readme.md') {
        category = 'root';
        displayPath = '根目录';
    }
    
    const catInfo = categoryMap[category] || categoryMap[parts[1]] || { name: displayPath, icon: '📄' };
    
    return {
        category: category,
        displayName: catInfo.name,
        icon: catInfo.icon
    };
}

/**
 * API: 获取所有文章列表
 */
app.get('/api/articles', (req, res) => {
    const articles = [];
    
    // 扫描 articles 目录
    const articlesList = scanArticles(ARTICLES_DIR, 'articles');
    articles.push(...articlesList);
    
    // 扫描 docs 目录
    const docsList = scanArticles(DOCS_DIR, 'docs');
    articles.push(...docsList);
    
    // 添加根目录的 readme.md
    const readmePath = path.join(__dirname, 'readme.md');
    if (fs.existsSync(readmePath)) {
        articles.unshift({
            id: 'readme',
            path: '/readme.md',
            name: 'readme.md',
            dir: ''
        });
    }
    
    // 返回带分类信息的数据
    const result = articles.map(article => {
        const catInfo = getCategoryInfo(article.path);
        return {
            ...article,
            category: catInfo.category,
            categoryName: catInfo.displayName,
            icon: catInfo.icon
        };
    });
    
    res.json(result);
});

/**
 * API: 获取单个文章内容
 */
app.get('/api/articles/:id', (req, res) => {
    const id = req.params.id;
    let filePath;
    
    // 根据 ID 查找文件
    if (id === 'readme') {
        filePath = path.join(__dirname, 'readme.md');
    } else {
        // 搜索所有目录
        const searchDirs = [ARTICLES_DIR, DOCS_DIR];
        for (const dir of searchDirs) {
            const testPath = path.join(dir, id + '.md');
            if (fs.existsSync(testPath)) {
                filePath = testPath;
                break;
            }
        }
    }
    
    if (!filePath) {
        return res.status(404).json({ error: 'Article not found' });
    }
    
    const result = safeReadFile(filePath);
    
    if (result.error) {
        return res.status(403).json({ error: result.error });
    }
    
    // 获取文件元信息
    const stat = fs.statSync(filePath);
    const catInfo = getCategoryInfo(filePath.replace(__dirname, '').replace(/\\/g, '/'));
    
    res.json({
        content: result.content,
        id: id,
        path: filePath.replace(__dirname, '').replace(/\\/g, '/'),
        category: catInfo.category,
        categoryName: catInfo.displayName,
        icon: catInfo.icon,
        size: stat.size,
        updatedAt: stat.mtime
    });
});

/**
 * API: 刷新文章列表（供前端调用）
 */
app.post('/api/refresh', (req, res) => {
    // 重新扫描目录，触发前端刷新
    const articles = [];
    const articlesList = scanArticles(ARTICLES_DIR, 'articles');
    articles.push(...articlesList);
    const docsList = scanArticles(DOCS_DIR, 'docs');
    articles.push(...docsList);
    
    // 添加根目录 readme
    if (fs.existsSync(path.join(__dirname, 'readme.md'))) {
        articles.unshift({ id: 'readme', path: '/readme.md', name: 'readme.md', dir: '' });
    }
    
    res.json({ 
        success: true, 
        count: articles.length,
        message: 'Articles refreshed. Reload the page to see changes.'
    });
});

/**
 * 启动服务器
 */
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║            WebShell Blog Server Started               ║
╠══════════════════════════════════════════════════════╣
║  URL:          http://localhost:${PORT}                ║
║  Articles:     ${ARTICLES_DIR}              ║
║  Docs:         ${DOCS_DIR}                  ║
╠══════════════════════════════════════════════════════╣
║  使用说明:                                              ║
║    1. 在 articles/ 目录创建 .md 文件                  ║
║    2. 目录结构自动作为分类                              ║
║    3. 刷新页面即可看到新文章                            ║
║    4. 使用 refresh 命令重新加载文章列表                  ║
╚══════════════════════════════════════════════════════╝
`);
    
    // 创建必要的目录
    [ARTICLES_DIR, DOCS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created: ${dir}`);
        }
    });
    
    // 创建示例文章
    createSampleArticles();
});

/**
 * 创建示例文章（如果不存在）
 */
function createSampleArticles() {
    const sampleArticles = {
        'articles/frontend/1.md': `# Xterm.js 终端开发指南

本文介绍如何使用 Xterm.js 构建终端应用。

## 安装
\`\`\`bash
npm install xterm
\`\`\`

## 基本使用
\`\`\`javascript
const term = new Terminal();
term.open(document.getElementById("terminal"));
term.write("Hello World");
\`\`\`
`,
        'articles/frontend/2.md': `# CSS Grid 布局详解

深入理解 CSS Grid 布局系统。

## 基础概念
Grid 布局由两个概念组成：
1. Grid Container（网格容器）
2. Grid Item（网格项）
`,
        'articles/backend/3.md': `# Go WebSocket 实战

使用 Go 实现 WebSocket 服务器。

## 服务端代码
\`\`\`go
http.HandleFunc("/ws", wsHandler)
http.ListenAndServe(":8080", nil)
\`\`\`
`,
        'articles/backend/4.md': `# RESTful API 设计原则

RESTful API 设计的最佳实践。

## HTTP 方法
- GET - 查询资源
- POST - 创建资源
- PUT - 更新资源
- DELETE - 删除资源
`,
        'articles/devops/5.md': `# Docker 容器化部署

Docker 容器化部署实战。

## 常用命令
\`\`\`bash
docker build -t myapp .
docker run -p 8080:80 myapp
\`\`\`
`,
        'articles/life/6.md': `# 我的 2024 年计划

新一年的目标与规划。

## 技术目标
1. 深入学习 Go 语言
2. 掌握 Kubernetes
3. 完成博客系统重构

## 生活目标
- 每周运动 3 次
- 阅读 12 本书
`,
        'articles/tech/7.md': `# 如何高效学习新技术

分享我的学习方法与经验。

## 学习方法
1. 看官方文档
2. 动手实践
3. 总结输出
`,
        'readme.md': `# WebShell Blog

A terminal-style blog system.

## 命令
- \`ls\` - 列出文件
- \`cd <dir>\` - 切换目录
- \`cat <file>\` - 读取文件
- \`read <id>\` - 读取文章
- \`open <file>\` - 预览文件
- \`refresh\` - 刷新文章列表
`
    };
    
    for (const [filePath, content] of Object.entries(sampleArticles)) {
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, content);
            console.log(`Created sample: ${filePath}`);
        }
    }
    
    console.log('Server ready!');
}
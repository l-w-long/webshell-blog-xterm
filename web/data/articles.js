/**
 * WebShell Blog - Articles Data
 * 在此文件中新增/编辑文章，无需重启服务
 * 
 * 格式：
 * '/路径/文件名.md': {
 *     type: 'md',           // 文件类型: md, pdf, doc
 *     title: '标题',        // 显示标题
 *     content: '内容',      // Markdown 内容
 *     meta: {               // 元数据
 *         id: 1,            // 文章ID（必须唯一）
 *         author: '作者',
 *         date: '2024-01-01',
 *         tags: ['标签1', '标签2']
 *     }
 * }
 */

const ArticlesData = {
    // 根目录文件
    '/home/readme.md': {
        type: 'md',
        title: 'README',
        content: '# WebShell Blog\n\nA terminal-style blog system.\n\n## Commands\n- `ls` - List files\n- `cd <dir>` - Change directory\n- `cat <file` - Read file content\n- `read <id>` - Read article\n- `open `<file>` - Preview file',
        meta: { author: 'System', date: '2024-01-01' }
    },

    // 前端技术文章
    '/home/articles/frontend/1.md': {
        type: 'md',
        title: 'Xterm.js 终端开发指南',
        content: '# Xterm.js 终端开发指南\n\n本文介绍如何使用 Xterm.js 构建终端应用。\n\n## 安装\n```bash\nnpm install xterm\n```\n\n## 基本使用\n```javascript\nconst term = new Terminal();\nterm.open(document.getElementById("terminal"));\nterm.write("Hello World");\n```\n\n## 主题定制\nXterm.js 支持自定义主题：\n```javascript\nconst term = new Terminal({\n    theme: {\n        background: '#282a36',\n        foreground: '#f8f8f2'\n    }\n});\n```',
        meta: { id: 1, author: 'Dev', date: '2024-01-15', tags: ['Xterm.js', '前端'] }
    },
    '/home/articles/frontend/2.md': {
        type: 'md',
        title: 'CSS Grid 布局详解',
        content: '# CSS Grid 布局详解\n\n深入理解 CSS Grid 布局系统。\n\n## 基础概念\nGrid 布局由两个概念组成：\n1. Grid Container（网格容器）\n2. Grid Item（网格项）\n\n## 基本用法\n```css\n.container {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n}\n```',
        meta: { id: 2, author: 'UI', date: '2024-01-20', tags: ['CSS', '布局'] }
    },

    // 后端技术文章
    '/home/articles/backend/3.md': {
        type: 'md',
        title: 'Go WebSocket 实战',
        content: '# Go WebSocket 实战\n\n使用 Go 实现 WebSocket 服务器。\n\n## 服务端代码\n```go\npackage main\n\nimport (\n    "net/http"\n    "github.com/gorilla/websocket"\n)\n\nvar upgrader = websocket.Upgrader{\n    CheckOrigin: func(r *http.Request) bool {\n        return true\n    },\n}\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    conn, _ := upgrader.Upgrade(w, r, nil)\n    defer conn.Close()\n    \n    for {\n        mt, message, _ := conn.ReadMessage()\n        conn.WriteMessage(mt, message)\n    }\n}\n\nfunc main() {\n    http.HandleFunc("/ws", handler)\n    http.ListenAndServe(":8080", nil)\n}\n```',
        meta: { id: 3, author: 'Backend', date: '2024-01-25', tags: ['Go', 'WebSocket'] }
    },
    '/home/articles/backend/4.md': {
        type: 'md',
        title: 'RESTful API 设计原则',
        content: '# RESTful API 设计原则\n\nRESTful API 设计的最佳实践。\n\n## HTTP 方法\n- GET - 查询资源\n- POST - 创建资源\n- PUT - 更新资源（完整）\n- PATCH - 更新资源（部分）\n- DELETE - 删除资源\n\n## 状态码\n- 200 OK\n- 201 Created\n- 204 No Content\n- 400 Bad Request\n- 401 Unauthorized\n- 404 Not Found\n- 500 Internal Server Error',
        meta: { id: 4, author: 'API', date: '2024-02-01', tags: ['API', '架构'] }
    },

    // 运维部署文章
    '/home/articles/devops/5.md': {
        type: 'md',
        title: 'Docker 容器化部署',
        content: '# Docker 容器化部署\n\nDocker 容器化部署实战。\n\n## Dockerfile 示例\n```dockerfile\nFROM nginx:latest\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n```\n\n## 常用命令\n```bash\ndocker build -t myapp .\ndocker run -p 8080:80 myapp\ndocker ps\ndocker logs <container_id>\n```',
        meta: { id: 5, author: 'Ops', date: '2024-02-05', tags: ['Docker', '容器'] }
    },

    // 生活随笔
    '/home/posts/life/6.md': {
        type: 'md',
        title: '我的 2024 年计划',
        content: '# 我的 2024 年计划\n\n新一年的目标与规划。\n\n## 技术目标\n1. 深入学习 Go 语言\n2. 掌握 Kubernetes\n3. 完成博客系统重构\n\n## 生活目标\n- 每周运动 3 次\n- 阅读 12 本书\n- 学习一门新乐器',
        meta: { id: 6, author: 'Me', date: '2024-01-01', tags: ['计划'] }
    },

    // 技术分享
    '/home/posts/tech/7.md': {
        type: 'md',
        title: '如何高效学习新技术',
        content: '# 如何高效学习新技术\n\n分享我的学习方法与经验。\n\n## 学习方法\n1. **看官方文档** - 官方文档是最权威的来源\n2. **动手实践** - 光看不够，必须动手写代码\n3. **总结输出** - 写博客能加深理解\n4. **参与社区** - GitHub、Stack Overflow 都是好地方\n\n## 推荐资源\n- 官方文档\n- 技术博客\n- GitHub trending\n- 源码学习',
        meta: { id: 7, author: 'Me', date: '2024-01-30', tags: ['学习'] }
    },

    // 文档（PDF/DOC 示例）
    '/home/docs/guide.pdf': {
        type: 'pdf',
        title: '用户指南',
        content: '[PDF Document]\n这是一个 PDF 文档示例。\n\n在实际环境中，可以嵌入 PDF 预览组件。',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        meta: { author: 'System', date: '2024-01-01' }
    },
    '/home/docs/design.doc': {
        type: 'doc',
        title: '设计文档',
        content: '[Word Document]\n这是一个 Word 文档示例。\n\n在实际环境中，可以集成文档预览服务。',
        url: null,
        meta: { author: 'Designer', date: '2024-02-01' }
    }
};

// ==================== 新增文章示例 ====================
// 
// 要新增文章，只需在上面的 ArticlesData 对象中添加新条目：
//
// '/home/articles/frontend/8.md': {
//     type: 'md',
//     title: 'React Hooks 入门',
//     content: '# React Hooks 入门\n\n## useState\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n## useEffect\n```jsx\nuseEffect(() => {\n    document.title = `Count: ${count}`;\n}, [count]);\n```',
//     meta: { id: 8, author: 'React', date: '2024-02-10', tags: ['React', 'Hooks'] }
// },
//
// 保存后刷新页面即可看到新文章！
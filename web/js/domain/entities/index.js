/**
 * Terminal Entity - 终端实体
 * 核心领域模型，管理终端会话状态
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */
class Terminal {
    /**
     * @param {string} id - 终端唯一标识
     */
    constructor(id) {
        this._id = id;
        this._width = 80;
        this._height = 24;
        this._cwd = '/home';
        this._history = [];
        this._env = {};
        this._clients = new Set();
        this._createdAt = new Date();
    }

    get id() { return this._id; }
    get width() { return this._width; }
    get height() { return this._height; }
    get cwd() { return this._cwd; }
    get history() { return [...this._history]; }
    get env() { return { ...this._env }; }
    get createdAt() { return this._createdAt; }

    /**
     * 设置终端尺寸
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        this._width = width;
        this._height = height;
        this._notifyClients();
    }

    /**
     * 切换工作目录
     * @param {string} path 
     */
    changeDirectory(path) {
        this._cwd = path;
    }

    /**
     * 添加命令到历史
     * @param {string} command 
     */
    addToHistory(command) {
        this._history.push(command);
        if (this._history.length > 100) {
            this._history.shift();
        }
    }

    /**
     * 添加客户端连接
     * @param {Client} client 
     */
    addClient(client) {
        this._clients.add(client);
    }

    /**
     * 移除客户端连接
     * @param {Client} client 
     */
    removeClient(client) {
        this._clients.delete(client);
    }

    _notifyClients() {
        this._clients.forEach(client => {
            client.notifyResize(this._width, this._height);
        });
    }
}

/**
 * Client Entity - 客户端实体
 * 管理 WebSocket 客户端连接
 */
class Client {
    /**
     * @param {string} id 
     * @param {WebSocket} conn 
     */
    constructor(id, conn) {
        this._id = id;
        this._conn = conn;
        this._terminal = null;
        this._connectedAt = new Date();
        this._lastActivity = new Date();
    }

    get id() { return this._id; }
    get conn() { return this._conn; }
    get connectedAt() { return this._connectedAt; }

    /**
     * 关联终端
     * @param {Terminal} terminal 
     */
    setTerminal(terminal) {
        this._terminal = terminal;
        terminal.addClient(this);
    }

    /**
     * 发送消息
     * @param {Object} message 
     */
    send(message) {
        if (this._conn && this._conn.readyState === WebSocket.OPEN) {
            this._conn.send(JSON.stringify(message));
        }
    }

    /**
     * 通知终端尺寸变化
     * @param {number} width 
     * @param {number} height 
     */
    notifyResize(width, height) {
        this.send({
            type: 'resize',
            width: width,
            height: height
        });
    }

    /**
     * 更新最后活动时间
     */
    updateActivity() {
        this._lastActivity = new Date();
    }

    /**
     * 关闭连接
     */
    disconnect() {
        if (this._terminal) {
            this._terminal.removeClient(this);
        }
        if (this._conn) {
            this._conn.close();
        }
    }
}

/**
 * Article Entity - 文章实体
 * 博客文章领域模型
 */
class Article {
    /**
     * @param {number} id 
     * @param {string} title 
     * @param {string} content 
     */
    constructor(id, title, content = '') {
        this._id = id;
        this._title = title;
        this._content = content;
        this._category = null;
        this._tags = [];
        this._author = 'Anonymous';
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }

    get id() { return this._id; }
    get title() { return this._title; }
    get content() { return this._content; }
    get category() { return this._category; }
    get tags() { return [...this._tags]; }
    get author() { return this._author; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }

    setCategory(category) {
        this._category = category;
    }

    addTag(tag) {
        if (!this._tags.includes(tag)) {
            this._tags.push(tag);
        }
    }

    updateContent(content) {
        this._content = content;
        this._updatedAt = new Date();
    }
}

/**
 * Category Entity - 分类实体
 * 文章分类领域模型
 */
class Category {
    /**
     * @param {string} id 
     * @param {string} name 
     * @param {string} parentId 
     */
    constructor(id, name, parentId = null) {
        this._id = id;
        this._name = name;
        this._parentId = parentId;
        this._icon = '📁';
        this._articles = [];
        this._children = [];
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get parentId() { return this._parentId; }
    get icon() { return this._icon; }
    get articles() { return [...this._articles]; }
    get children() { return [...this._children]; }

    setIcon(icon) {
        this._icon = icon;
    }

    addArticle(article) {
        article.setCategory(this);
        this._articles.push(article);
    }

    addChild(category) {
        category._parentId = this._id;
        this._children.push(category);
    }
}

export { Terminal, Client, Article, Category };

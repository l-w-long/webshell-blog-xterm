/**
 * WebSocket Adapter - WebSocket 适配器
 * 基础设施层，处理网络通信
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */
class WebSocketAdapter {
    /**
     * @param {string} url - WebSocket URL
     */
    constructor(url) {
        this._url = url;
        this._ws = null;
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = 5;
        this._reconnectDelay = 3000;
        this._listeners = new Map();
        this._isConnected = false;
    }

    /**
     * 连接到服务器
     * @returns {Promise<void>}
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this._ws = new WebSocket(this._url);
                
                this._ws.onopen = () => {
                    this._isConnected = true;
                    this._reconnectAttempts = 0;
                    this._emit('open', null);
                    resolve();
                };

                this._ws.onmessage = (event) => {
                    this._emit('message', event.data);
                };

                this._ws.onclose = (event) => {
                    this._isConnected = false;
                    this._emit('close', event);
                    this._handleReconnect();
                };

                this._ws.onerror = (error) => {
                    this._emit('error', error);
                    if (!this._isConnected) {
                        reject(error);
                    }
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * 发送消息
     * @param {Object|string} data - 消息数据
     */
    send(data) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this._ws.send(message);
        }
    }

    /**
     * 关闭连接
     */
    close() {
        if (this._ws) {
            this._ws.close();
            this._ws = null;
        }
    }

    /**
     * 检查是否已连接
     * @returns {boolean}
     */
    isConnected() {
        return this._isConnected;
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * 处理重连
     * @private
     */
    _handleReconnect() {
        if (this._reconnectAttempts >= this._maxReconnectAttempts) {
            this._emit('reconnect-failed', null);
            return;
        }

        this._reconnectAttempts++;
        this._emit('reconnecting', { attempt: this._reconnectAttempts });

        setTimeout(() => {
            this.connect().catch(() => {});
        }, this._reconnectDelay);
    }

    /**
     * 触发事件
     * @param {string} event 
     * @param {*} data 
     * @private
     */
    _emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
}

/**
 * Terminal Adapter - 终端适配器
 * 封装 Xterm.js 操作
 */
class TerminalAdapter {
    /**
     * @param {HTMLElement} container - 终端容器
     */
    constructor(container) {
        this._container = container;
        this._term = null;
        this._fitAddon = null;
        this._listeners = new Map();
    }

    /**
     * 初始化终端
     * @param {Object} config - 终端配置
     */
    init(config = {}) {
        const defaultConfig = {
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 13,
            fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
            scrollback: 1000,
            theme: {
                background: '#282a36',
                foreground: '#f8f8f2',
                cursor: '#f8f8f2',
                cursorAccent: '#282a36',
                selectionBackground: '#44475a'
            }
        };

        this._term = new Terminal({ ...defaultConfig, ...config });
        
        this._fitAddon = new FitAddon.FitAddon();
        this._term.loadAddon(this._fitAddon);
        
        this._term.open(this._container);
        this._fitAddon.fit();

        this._bindEvents();
        
        return this;
    }

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        this._term.onData(data => {
            this._emit('data', data);
        });

        this._term.onResize(size => {
            this._emit('resize', size);
        });

        window.addEventListener('resize', () => {
            this.fit();
        });
    }

    /**
     * 写入数据
     * @param {string} text 
     */
    write(text) {
        this._term?.write(text);
    }

    /**
     * 写入行
     * @param {string} text 
     */
    writeln(text) {
        this._term?.write(text + '\r\n');
    }

    /**
     * 清屏
     */
    clear() {
        this._term?.clear();
    }

    /**
     * 自适应尺寸
     */
    fit() {
        this._fitAddon?.fit();
    }

    /**
     * 获取终端实例
     * @returns {Terminal}
     */
    getTerm() {
        return this._term;
    }

    /**
     * 获取列数
     * @returns {number}
     */
    get cols() {
        return this._term?.cols || 80;
    }

    /**
     * 获取行数
     * @returns {number}
     */
    get rows() {
        return this._term?.rows || 24;
    }

    /**
     * 添加事件监听
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
    }

    /**
     * 触发事件
     * @param {string} event 
     * @param {*} data 
     * @private
     */
    _emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
}

/**
 * Storage Adapter - 存储适配器
 * 封装 localStorage 操作
 */
class StorageAdapter {
    /**
     * @param {string} prefix - 键前缀
     */
    constructor(prefix = 'webshell_') {
        this._prefix = prefix;
    }

    /**
     * 设置值
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this._prefix + key, serialized);
        } catch (e) {
            console.error('Storage set error:', e);
        }
    }

    /**
     * 获取值
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(this._prefix + key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    /**
     * 删除值
     * @param {string} key 
     */
    remove(key) {
        localStorage.removeItem(this._prefix + key);
    }

    /**
     * 清空存储
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this._prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

export { WebSocketAdapter, TerminalAdapter, StorageAdapter };

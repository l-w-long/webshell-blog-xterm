/**
 * Theme Value Object - 主题值对象
 * 不可变的配置对象，表示主题样式
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */
class Theme {
    /**
     * @param {Object} config - 主题配置
     */
    constructor(config) {
        this._id = config.id;
        this._name = config.name;
        this._colors = Object.freeze({ ...config.colors });
        this._font = Object.freeze({ ...config.font });
        this._isDefault = config.isDefault || false;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get colors() { return this._colors; }
    get font() { return this._font; }
    get isDefault() { return this._isDefault; }

    /**
     * 获取颜色值
     * @param {string} key - 颜色键名
     * @returns {string} 颜色值
     */
    getColor(key) {
        return this._colors[key] || '#ffffff';
    }

    /**
     * 获取 ANSI 颜色代码
     * @param {string} name - 颜色名称
     * @returns {string} ANSI 代码
     */
    getAnsiCode(name) {
        const ansiMap = {
            black: '30',
            red: '31',
            green: '32',
            yellow: '33',
            blue: '34',
            magenta: '35',
            cyan: '36',
            white: '37',
            brightBlack: '90',
            brightRed: '91',
            brightGreen: '92',
            brightYellow: '93',
            brightBlue: '94',
            brightMagenta: '95',
            brightCyan: '96',
            brightWhite: '97'
        };
        return ansiMap[name] || '37';
    }

    /**
     * 序列化为 JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this._id,
            name: this._name,
            colors: { ...this._colors },
            font: { ...this._font },
            isDefault: this._isDefault
        };
    }
}

/**
 * Command Value Object - 命令值对象
 * 表示一个可执行的命令
 */
class Command {
    /**
     * @param {Object} config - 命令配置
     */
    constructor(config) {
        this._name = config.name;
        this._handler = config.handler;
        this._description = config.description || '';
        this._completions = config.completions || [];
        this._aliases = config.aliases || [];
    }

    get name() { return this._name; }
    get description() { return this._description; }
    get completions() { return [...this._completions]; }
    get aliases() { return [...this._aliases]; }

    /**
     * 执行命令
     * @param {Array} args - 命令参数
     * @param {Object} context - 执行上下文
     * @returns {*} 执行结果
     */
    execute(args, context) {
        return this._handler(args, context);
    }

    /**
     * 获取补全选项
     * @param {string} input - 当前输入
     * @returns {Array} 补全选项
     */
    getCompletions(input) {
        if (!input) {
            return this._completions;
        }
        return this._completions.filter(c => c.startsWith(input));
    }
}

/**
 * Message Value Object - 消息值对象
 * WebSocket 通信消息
 */
class Message {
    /**
     * @param {Object} data - 消息数据
     */
    constructor(data) {
        this._type = data.type;
        this._content = data.content || '';
        this._payload = data.payload || {};
        this._timestamp = new Date();
    }

    get type() { return this._type; }
    get content() { return this._content; }
    get payload() { return { ...this._payload }; }
    get timestamp() { return this._timestamp; }

    static create(type, content = '', payload = {}) {
        return new Message({ type, content, payload });
    }

    static fromJSON(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;
            return new Message(data);
        } catch (e) {
            return new Message({ type: 'raw', content: json });
        }
    }

    toJSON() {
        return {
            type: this._type,
            content: this._content,
            payload: this._payload,
            timestamp: this._timestamp.toISOString()
        };
    }
}

export { Theme, Command, Message };

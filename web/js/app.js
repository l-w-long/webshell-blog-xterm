/**
 * WebShell Blog - DDD Refactored Application
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */

(function(global) {
    'use strict';

    // ============================================
    // Domain Layer - 值对象
    // ============================================

    /**
     * Theme Value Object - 主题值对象
     */
    class Theme {
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

        getColor(key) {
            return this._colors[key] || '#ffffff';
        }

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
     */
    class Command {
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

        execute(args, context) {
            return this._handler(args, context);
        }

        getCompletions(input) {
            if (!input) return this._completions;
            return this._completions.filter(c => c.startsWith(input));
        }
    }

    /**
     * Message Value Object - 消息值对象
     */
    class Message {
        constructor(data) {
            this._type = data.type;
            this._content = data.content || '';
            this._payload = data.payload || {};
            this._timestamp = new Date();
        }

        get type() { return this._type; }
        get content() { return this._content; }
        get payload() { return { ...this._payload }; }

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
                payload: this._payload
            };
        }
    }

    // ============================================
    // Domain Layer - 实体
    // ============================================

    /**
     * Terminal Entity - 终端实体 (聚合根)
     */
    class Terminal {
        constructor(id) {
            this._id = id;
            this._width = 80;
            this._height = 24;
            this._cwd = '/home';
            this._history = [];
            this._clients = new Set();
            this._createdAt = new Date();
        }

        get id() { return this._id; }
        get cwd() { return this._cwd; }
        get history() { return [...this._history]; }

        resize(width, height) {
            this._width = width;
            this._height = height;
        }

        changeDirectory(path) {
            this._cwd = path;
        }

        addToHistory(command) {
            this._history.push(command);
            if (this._history.length > 100) {
                this._history.shift();
            }
        }

        addClient(client) {
            this._clients.add(client);
        }

        removeClient(client) {
            this._clients.delete(client);
        }
    }

    /**
     * Client Entity - 客户端实体
     */
    class Client {
        constructor(id) {
            this._id = id;
            this._terminal = null;
            this._connectedAt = new Date();
        }

        get id() { return this._id; }

        setTerminal(terminal) {
            this._terminal = terminal;
            terminal.addClient(this);
        }

        disconnect() {
            if (this._terminal) {
                this._terminal.removeClient(this);
            }
        }
    }

    // ============================================
    // Application Layer - 主题管理器 (单例)
    // ============================================

    /**
     * Theme Manager - 主题管理器
     */
    class ThemeManager {
        constructor() {
            if (ThemeManager._instance) {
                return ThemeManager._instance;
            }
            this._themes = new Map();
            this._currentTheme = null;
            this._listeners = new Set();
            ThemeManager._instance = this;
        }

        static getInstance() {
            if (!ThemeManager._instance) {
                ThemeManager._instance = new ThemeManager();
            }
            return ThemeManager._instance;
        }

        install(themeConfig) {
            const theme = new Theme(themeConfig);
            this._themes.set(theme.id, theme);
            if (!this._currentTheme || theme.isDefault) {
                this.apply(theme.id);
            }
            this._notifyListeners('install', theme);
            return theme;
        }

        apply(themeId) {
            const theme = this._themes.get(themeId);
            if (!theme) return false;
            this._currentTheme = theme;
            this._applyThemeToDOM(theme);
            this._notifyListeners('apply', theme);
            return true;
        }

        getCurrentTheme() {
            return this._currentTheme;
        }

        getAllThemes() {
            return Array.from(this._themes.values());
        }

        addListener(listener) {
            this._listeners.add(listener);
        }

        removeListener(listener) {
            this._listeners.delete(listener);
        }

        _applyThemeToDOM(theme) {
            const root = document.documentElement;
            const colors = theme.colors;
            Object.keys(colors).forEach(key => {
                root.style.setProperty(`--${key}`, colors[key]);
            });
        }

        _notifyListeners(event, theme) {
            this._listeners.forEach(listener => {
                try {
                    listener(event, theme);
                } catch (e) {
                    console.error('Theme listener error:', e);
                }
            });
        }
    }

    /**
     * Built-in Themes - 内置主题
     */
    const BUILT_IN_THEMES = {
        snazzy: {
            id: 'snazzy',
            name: 'Snazzy',
            isDefault: true,
            colors: {
                bg: '#282a36',
                bgAlt: '#1e1f29',
                fg: '#f8f8f2',
                comment: '#6272a4',
                pink: '#ff79c6',
                green: '#50fa7b',
                orange: '#ffb86c',
                purple: '#bd93f9',
                yellow: '#f1fa8c',
                cyan: '#8be9fd',
                red: '#ff5555',
                border: '#44475a'
            },
            font: {
                family: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
                size: '13px'
            }
        },
        dracula: {
            id: 'dracula',
            name: 'Dracula',
            colors: {
                bg: '#282a36',
                bgAlt: '#21222c',
                fg: '#f8f8f2',
                comment: '#6272a4',
                pink: '#ff79c6',
                green: '#50fa7b',
                orange: '#ffb86c',
                purple: '#bd93f9',
                yellow: '#f1fa8c',
                cyan: '#8be9fd',
                red: '#ff5555',
                border: '#44475a'
            },
            font: { family: 'Consolas, monospace', size: '14px' }
        },
        monokai: {
            id: 'monokai',
            name: 'Monokai',
            colors: {
                bg: '#272822',
                bgAlt: '#1e1f1c',
                fg: '#f8f8f2',
                comment: '#75715e',
                pink: '#f92672',
                green: '#a6e22e',
                orange: '#fd971f',
                purple: '#ae81ff',
                yellow: '#e6db74',
                cyan: '#66d9ef',
                red: '#f92672',
                border: '#3e3d32'
            },
            font: { family: '"Fira Code", monospace', size: '13px' }
        },
        nord: {
            id: 'nord',
            name: 'Nord',
            colors: {
                bg: '#2e3440',
                bgAlt: '#3b4252',
                fg: '#eceff4',
                comment: '#616e88',
                pink: '#b48ead',
                green: '#a3be8c',
                orange: '#d08770',
                purple: '#b48ead',
                yellow: '#ebcb8b',
                cyan: '#88c0d0',
                red: '#bf616a',
                border: '#4c566a'
            },
            font: { family: '"JetBrains Mono", monospace', size: '13px' }
        }
    };

    // ============================================
    // Application Layer - 命令注册表 (单例)
    // ============================================

    /**
     * Command Registry - 命令注册表
     */
    class CommandRegistry {
        constructor() {
            if (CommandRegistry._instance) {
                return CommandRegistry._instance;
            }
            this._commands = new Map();
            this._aliases = new Map();
            this._middleware = [];
            CommandRegistry._instance = this;
            this._registerBuiltInCommands();
        }

        static getInstance() {
            if (!CommandRegistry._instance) {
                CommandRegistry._instance = new CommandRegistry();
            }
            return CommandRegistry._instance;
        }

        register(config) {
            const command = new Command(config);
            this._commands.set(command.name, command);
            if (command.aliases) {
                command.aliases.forEach(alias => {
                    this._aliases.set(alias, command.name);
                });
            }
            return command;
        }

        unregister(name) {
            const command = this._commands.get(name);
            if (!command) return false;
            if (command.aliases) {
                command.aliases.forEach(alias => {
                    this._aliases.delete(alias);
                });
            }
            this._commands.delete(name);
            return true;
        }

        get(name) {
            const actualName = this._aliases.get(name) || name;
            return this._commands.get(actualName);
        }

        has(name) {
            return this._commands.has(name) || this._aliases.has(name);
        }

        getAll() {
            return Array.from(this._commands.values());
        }

        getCompletions(input) {
            if (!input) {
                return this.getAll().map(c => c.name);
            }
            const parts = input.trim().split(/\s+/);
            if (parts.length === 1) {
                const cmd = parts[0].toLowerCase();
                return this.getAll()
                    .filter(c => c.name.toLowerCase().startsWith(cmd))
                    .map(c => c.name);
            }
            const cmd = this.get(parts[0]);
            if (cmd) {
                return cmd.getCompletions(parts[1]);
            }
            return [];
        }

        execute(input, context) {
            const parts = input.trim().split(/\s+/);
            const cmdName = parts[0];
            const args = parts.slice(1);
            const command = this.get(cmdName);

            if (!command) {
                return { error: `command not found: ${cmdName}` };
            }

            for (const mw of this._middleware) {
                if (mw(input, context) === false) {
                    return { error: 'blocked by middleware' };
                }
            }

            try {
                return command.execute(args, context);
            } catch (e) {
                return { error: e.message };
            }
        }

        use(middleware) {
            this._middleware.push(middleware);
        }

        _registerBuiltInCommands() {
            this.register({
                name: 'help',
                description: 'Show available commands',
                handler: (args, context) => {
                    const commands = this.getAll();
                    const output = ['Available commands:'];
                    commands.forEach(cmd => {
                        output.push(`  ${cmd.name.padEnd(12)} - ${cmd.description}`);
                    });
                    return output.join('\n');
                }
            });

            this.register({
                name: 'clear',
                description: 'Clear the terminal screen',
                aliases: ['cls'],
                handler: () => ({ type: 'clear' })
            });

            this.register({
                name: 'ls',
                description: 'List directory contents',
                completions: ['-l', '-a', '-la'],
                handler: (args) => ({ type: 'ls', args: args })
            });

            this.register({
                name: 'cd',
                description: 'Change directory',
                handler: (args) => ({ type: 'cd', path: args[0] || '/home' })
            });

            this.register({
                name: 'pwd',
                description: 'Print working directory',
                handler: (args, ctx) => ctx.cwd || '/home'
            });

            this.register({
                name: 'cat',
                description: 'Display file contents',
                handler: (args) => ({ type: 'cat', file: args[0] })
            });

            this.register({
                name: 'read',
                description: 'Read article by ID',
                handler: (args) => ({ type: 'read', id: parseInt(args[0]) })
            });

            this.register({
                name: 'echo',
                description: 'Print text',
                handler: (args) => args.join(' ')
            });

            this.register({
                name: 'date',
                description: 'Show current date and time',
                handler: () => new Date().toString()
            });

            this.register({
                name: 'history',
                description: 'Show command history',
                handler: (args, ctx) => {
                    const history = ctx.history || [];
                    return history.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
                }
            });

            this.register({
                name: 'theme',
                description: 'Switch theme (snazzy, dracula, monokai, nord)',
                handler: (args) => {
                    if (args[0]) {
                        const result = ThemeManager.getInstance().apply(args[0]);
                        return result ? `\x1b[32mTheme switched to ${args[0]}\x1b[0m` : `\x1b[31mTheme not found: ${args[0]}\x1b[0m`;
                    }
                    const themes = ThemeManager.getInstance().getAllThemes();
                    return 'Available themes: ' + themes.map(t => t.name).join(', ');
                }
            });
        }
    }

    // ============================================
    // Infrastructure Layer - 图片渲染策略
    // ============================================

    /**
     * Image Render Strategy - 图片渲染策略
     */
    class ImageRenderStrategy {
        constructor() {
            this._enabled = true;
        }
        get enabled() { return this._enabled; }
        async render(url, options) {
            throw new Error('Method not implemented');
        }
        clear() {
            throw new Error('Method not implemented');
        }
    }

    /**
     * DOM Render Strategy - DOM 渲染策略
     */
    class DOMRenderStrategy extends ImageRenderStrategy {
        constructor(container, term) {
            super();
            this._container = container;
            this._term = term;
            this._images = [];
            this._charWidth = 0;
            this._charHeight = 0;
            this._updateDimensions();
        }

        _updateDimensions() {
            const dims = this._term?._core?._renderService?.dimensions;
            if (dims) {
                this._charWidth = dims.actualCellWidth;
                this._charHeight = dims.actualCellHeight;
            }
        }

        async render(url, options = {}) {
            const { width = 300, height = 'auto', row = null } = options;
            this._updateDimensions();

            const targetRow = row ?? this._term?.buffer?.active?.cursorY || 0;
            const pos = this._calculatePosition(targetRow);

            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.style.cssText = `position: absolute; top: ${pos.top}px; left: ${pos.left}px; z-index: 10;`;

            const placeholder = document.createElement('span');
            placeholder.className = 'loading-placeholder';
            placeholder.textContent = '[Loading Image...]';
            wrapper.appendChild(placeholder);

            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    wrapper.innerHTML = '';
                    const scale = width / img.naturalWidth;
                    const scaledHeight = img.naturalHeight * scale;
                    img.style.cssText = `max-width: ${width}px; height: ${height === 'auto' ? 'auto' : height + 'px'};`;
                    wrapper.appendChild(img);
                    this._container.appendChild(wrapper);

                    this._images.push({ element: wrapper, row: targetRow });
                    resolve({ success: true, rows: Math.ceil(scaledHeight / this._charHeight) });
                };
                img.onerror = () => {
                    placeholder.textContent = '[Image Load Failed]';
                    placeholder.style.color = 'var(--red)';
                    reject(new Error('Failed to load image'));
                };
                img.src = url;
            });
        }

        _calculatePosition(row) {
            const viewport = this._term?.buffer?.viewportY || 0;
            const absoluteRow = row + viewport;
            const termElement = this._term?.element;
            const parentRect = termElement?.parentElement?.getBoundingClientRect() || { top: 0, left: 0 };
            return {
                top: parentRect.top + (termElement?.offsetTop || 0) + (absoluteRow * this._charHeight) + 4,
                left: parentRect.left + (termElement?.offsetLeft || 0) + 8
            };
        }

        clear() {
            this._images.forEach(img => {
                if (img.element?.parentElement) img.element.remove();
            });
            this._images = [];
            this._container.querySelectorAll('.loading-placeholder').forEach(p => p.parentElement?.remove());
        }
    }

    /**
     * Image Renderer Factory - 图片渲染器工厂
     */
    class ImageRendererFactory {
        static create(type, options) {
            if (type === 'dom' || !type) {
                return new DOMRenderStrategy(options.container, options.term);
            }
            return new DOMRenderStrategy(options.container, options.term);
        }
    }

    // ============================================
    // Infrastructure Layer - 适配器
    // ============================================

    /**
     * WebSocket Adapter - WebSocket 适配器
     */
    class WebSocketAdapter {
        constructor(url) {
            this._url = url;
            this._ws = null;
            this._listeners = new Map();
            this._isConnected = false;
        }

        connect() {
            return new Promise((resolve, reject) => {
                try {
                    this._ws = new WebSocket(this._url);

                    this._ws.onopen = () => {
                        this._isConnected = true;
                        this._emit('open', null);
                        resolve();
                    };

                    this._ws.onmessage = (event) => {
                        this._emit('message', event.data);
                    };

                    this._ws.onclose = () => {
                        this._isConnected = false;
                        this._emit('close', null);
                    };

                    this._ws.onerror = (error) => {
                        this._emit('error', error);
                        if (!this._isConnected) reject(error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        }

        send(data) {
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
                const message = typeof data === 'string' ? data : JSON.stringify(data);
                this._ws.send(message);
            }
        }

        close() {
            if (this._ws) {
                this._ws.close();
                this._ws = null;
            }
        }

        isConnected() {
            return this._isConnected;
        }

        on(event, callback) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(callback);
        }

        _emit(event, data) {
            const listeners = this._listeners.get(event);
            if (listeners) {
                listeners.forEach(cb => cb(data));
            }
        }
    }

    // ============================================
    // Interfaces Layer - 终端控制器
    // ============================================

    /**
     * Terminal Controller - 终端控制器
     */
    class TerminalController {
        constructor(containerId) {
            this._container = document.getElementById(containerId);
            this._overlayContainer = document.getElementById('image-overlay');
            this._term = null;
            this._fitAddon = null;
            this._wsAdapter = null;
            this._imageRenderer = null;
            this._currentInput = '';
            this._commandHistory = [];
            this._historyIndex = -1;
            this._cwd = '/home';
            this._context = { cwd: this._cwd, history: this._commandHistory };
            this._commandRegistry = CommandRegistry.getInstance();
            this._themeManager = ThemeManager.getInstance();
        }

        init(options = {}) {
            this._initTerminal();
            this._initWebSocket(options.wsUrl);
            this._initImageRenderer();
            this._setupEventHandlers();
            this._showWelcome();
            return this;
        }

        _initTerminal() {
            // Install built-in themes
            Object.values(BUILT_IN_THEMES).forEach(config => {
                this._themeManager.install(config);
            });

            const currentTheme = this._themeManager.getCurrentTheme();
            const theme = currentTheme ? currentTheme.colors : {};

            this._term = new Terminal({
                cursorBlink: true,
                cursorStyle: 'block',
                fontSize: 13,
                fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
                scrollback: 1000,
                theme: {
                    background: theme.bg || '#282a36',
                    foreground: theme.fg || '#f8f8f2',
                    cursor: theme.fg || '#f8f8f2',
                    cursorAccent: theme.bg || '#282a36',
                    selectionBackground: theme.border || '#44475a'
                }
            });

            this._fitAddon = new FitAddon.FitAddon();
            this._term.loadAddon(this._fitAddon);
            this._term.open(this._container);
            this._fitAddon.fit();

            window.addEventListener('resize', () => {
                this._fitAddon.fit();
                if (this._imageRenderer) {
                    this._imageRenderer.updatePositions && this._imageRenderer.updatePositions();
                }
            });
        }

        _initWebSocket(url) {
            const wsUrl = url || `ws://${window.location.hostname || 'localhost'}:8080/ws`;
            this._wsAdapter = new WebSocketAdapter(wsUrl);

            this._wsAdapter.on('open', () => {
                this._write('\x1b[32m[Connected to server]\x1b[0m\r\n$ ');
            });

            this._wsAdapter.on('close', () => {
                this._write('\r\n\x1b[31m[Disconnected]\x1b[0m\r\n');
                this._write('Attempting to reconnect in 3 seconds...\r\n$ ');
            });

            this._wsAdapter.on('message', (data) => {
                this._handleServerMessage(data);
            });

            this._wsAdapter.connect().catch(() => {
                this._write('\x1b[33m[Running in offline mode]\x1b[0m\r\n');
            });
        }

        _initImageRenderer() {
            this._imageRenderer = ImageRendererFactory.create('dom', {
                container: this._overlayContainer,
                term: this._term
            });
        }

        _setupEventHandlers() {
            this._term.onData(data => this._handleInput(data));
        }

        _handleInput(data) {
            if (data === '\r') {
                this._executeInput();
            } else if (data === '\x7f') {
                if (this._currentInput.length > 0) {
                    this._currentInput = this._currentInput.slice(0, -1);
                    this._write('\b \b');
                }
            } else if (data === '\x1b[A') {
                if (this._commandHistory.length > 0 && this._historyIndex > 0) {
                    this._historyIndex--;
                    this._clearCurrentLine();
                    this._currentInput = this._commandHistory[this._historyIndex];
                    this._write(this._currentInput);
                }
            } else if (data === '\x1b[B') {
                if (this._historyIndex < this._commandHistory.length - 1) {
                    this._historyIndex++;
                    this._clearCurrentLine();
                    this._currentInput = this._commandHistory[this._historyIndex];
                    this._write(this._currentInput);
                } else {
                    this._historyIndex = this._commandHistory.length;
                    this._clearCurrentLine();
                    this._currentInput = '';
                }
            } else if (data === '\x03') {
                this._currentInput = '';
                this._write('^C\r\n' + this._getPrompt());
            } else if (data === '\t') {
                this._handleTabComplete();
            } else {
                this._currentInput += data;
                this._write(data);
            }
        }

        _executeInput() {
            this._write('\r\n');
            const cmd = this._currentInput.trim();

            if (cmd) {
                this._commandHistory.push(cmd);
                this._historyIndex = this._commandHistory.length;

                if (this._wsAdapter.isConnected()) {
                    this._wsAdapter.send(JSON.stringify({ type: 'command', content: cmd }));
                }

                this._executeLocalCommand(cmd);
            }

            this._currentInput = '';
            this._write(this._getPrompt());
        }

        _executeLocalCommand(cmd) {
            const result = this._commandRegistry.execute(cmd, this._context);

            if (result?.type === 'clear') {
                this._term.clear();
            } else if (result?.type === 'cd') {
                this._cwd = result.path;
                this._context.cwd = this._cwd;
                this._write(`\x1b[32m[cd ${result.path}]\x1b[0m\r\n`);
            } else if (result?.error) {
                this._write(`\x1b[31m${result.error}\x1b[0m\r\n`);
            } else if (result) {
                this._write(String(result) + '\r\n');
            }
        }

        _handleTabComplete() {
            const completions = this._commandRegistry.getCompletions(this._currentInput);

            if (completions.length === 1) {
                this._clearCurrentLine();
                this._currentInput = completions[0] + ' ';
                this._write(this._getPrompt() + this._currentInput);
            } else if (completions.length > 1) {
                this._write('\r\n' + completions.join('  ') + '\r\n' + this._getPrompt() + this._currentInput);
            }
        }

        _clearCurrentLine() {
            this._write('\r\x1b[K' + this._getPrompt());
        }

        _getPrompt() {
            return `\x1b[1m\x1b[36m${this._cwd}$\x1b[0m `;
        }

        _write(text) {
            this._term?.write(text);
        }

        _showWelcome() {
            const welcome = `
\x1b[36m╔═══════════════════════════════════════════════════════════╗
║                    WebShell Blog v2.0                       ║
║              DDD + Design Patterns Refactor              ║
║                                                           ║
║  Commands:                                                ║
║    ls              - List directory contents             ║
║    cd <dir>        - Change directory                    ║
║    theme <name>    - Switch theme                         ║
║    clear           - Clear screen                        ║
║    help            - Show this help                      ║
║                                                           ║
║  Themes: snazzy, dracula, monokai, nord                  ║
╚═══════════════════════════════════════════════════════════╝\x1b[0m
`;
            this._write(welcome);
            this._write(this._getPrompt());
        }

        _handleServerMessage(data) {
            try {
                const msg = Message.fromJSON(data);
                if (msg.type === 'output') {
                    this._write(msg.content);
                } else if (msg.type === 'clear') {
                    this._term.clear();
                    this._imageRenderer.clear();
                } else if (msg.type === 'image' && msg.payload?.url) {
                    this._imageRenderer.render(msg.payload.url, {
                        width: msg.payload.width || 300
                    }).then(() => {
                        this._write('\x1b[32m[Image loaded]\x1b[0m\r\n');
                    }).catch(err => {
                        this._write(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
                    });
                } else {
                    this._write(msg.content || data);
                }
            } catch (e) {
                this._write(data);
            }
        }

        getTerm() {
            return this._term;
        }
    }

    // ============================================
    // Export to global scope
    // ============================================

    global.WebShellBlog = {
        TerminalController,
        ThemeManager,
        CommandRegistry,
        Theme,
        Command,
        Message,
        BUILT_IN_THEMES
    };

})(typeof window !== 'undefined' ? window : global);

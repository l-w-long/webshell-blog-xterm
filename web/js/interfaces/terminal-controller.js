/**
 * Terminal Controller - 终端控制器
 * 接口层，处理用户输入和显示输出
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */
class TerminalController {
    constructor(containerId) {
        this._terminalAdapter = null;
        this._wsAdapter = null;
        this._themeManager = null;
        this._commandRegistry = null;
        this._imageRenderer = null;
        
        this._container = document.getElementById(containerId);
        this._overlayContainer = document.getElementById('image-overlay');
        
        this._currentInput = '';
        this._commandHistory = [];
        this._historyIndex = -1;
        this._cwd = '/home';
        
        this._context = {
            cwd: this._cwd,
            history: this._commandHistory
        };
    }

    /**
     * 初始化控制器
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
        this._initTerminal(options.theme);
        this._initWebSocket(options.wsUrl);
        this._initCommandRegistry();
        this._initImageRenderer(options.imageMode || 'dom');
        
        this._setupEventHandlers();
        this._showWelcome();
        
        return this;
    }

    /**
     * 初始化终端
     * @private
     */
    _initTerminal(themeConfig) {
        this._terminalAdapter = new TerminalAdapter(this._container);
        
        const themeManager = ThemeManager.getInstance();
        BUILT_IN_THEMES.forEach(config => {
            themeManager.install(config);
        });
        
        if (themeConfig) {
            themeManager.install(themeConfig);
        }
        
        const currentTheme = themeManager.getCurrentTheme();
        const theme = currentTheme ? currentTheme.colors : {};
        
        this._terminalAdapter.init({
            theme: {
                background: theme.bg || '#282a36',
                foreground: theme.fg || '#f8f8f2',
                cursor: theme.fg || '#f8f8f2',
                cursorAccent: theme.bg || '#282a36',
                selectionBackground: theme.border || '#44475a'
            }
        });
        
        this._themeManager = themeManager;
    }

    /**
     * 初始化 WebSocket
     * @private
     */
    _initWebSocket(url) {
        const wsUrl = url || `ws://${window.location.hostname || 'localhost'}:8080/ws`;
        
        this._wsAdapter = new WebSocketAdapter(wsUrl);
        
        this._wsAdapter.on('open', () => {
            this._terminalAdapter.write('\x1b[32m[Connected to server]\x1b[0m\r\n$ ');
        });

        this._wsAdapter.on('close', () => {
            this._terminalAdapter.write('\r\n\x1b[31m[Disconnected from server]\x1b[0m\r\n');
            this._terminalAdapter.write('Attempting to reconnect in 3 seconds...\r\n$ ');
        });

        this._wsAdapter.on('message', (data) => {
            this._handleServerMessage(data);
        });

        this._wsAdapter.on('error', () => {
            this._terminalAdapter.write('\x1b[33m[WebSocket not available, running in offline mode]\x1b[0m\r\n');
        });

        this._wsAdapter.connect().catch(() => {
            this._terminalAdapter.write('\x1b[33m[Running in offline mode]\x1b[0m\r\n');
        });
    }

    /**
     * 初始化命令注册表
     * @private
     */
    _initCommandRegistry() {
        this._commandRegistry = CommandRegistry.getInstance();
        
        this._commandRegistry.use(CommandMiddleware.logger());
    }

    /**
     * 初始化图片渲染器
     * @private
     */
    _initImageRenderer(mode) {
        this._imageRenderer = ImageRendererFactory.create(mode, {
            container: this._overlayContainer,
            term: this._terminalAdapter.getTerm()
        });
    }

    /**
     * 设置事件处理
     * @private
     */
    _setupEventHandlers() {
        this._terminalAdapter.on('data', (data) => this._handleInput(data));
    }

    /**
     * 处理用户输入
     * @private
     */
    _handleInput(data) {
        if (data === '\r') {
            this._executeInput();
        } else if (data === '\x7f') {
            this._handleBackspace();
        } else if (data === '\x1b[A') {
            this._handleHistoryUp();
        } else if (data === '\x1b[B') {
            this._handleHistoryDown();
        } else if (data === '\x03') {
            this._handleInterrupt();
        } else if (data === '\t') {
            this._handleTabComplete();
        } else {
            this._currentInput += data;
            this._terminalAdapter.write(data);
        }
    }

    /**
     * 执行输入
     * @private
     */
    _executeInput() {
        this._terminalAdapter.write('\r\n');
        
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
        this._terminalAdapter.write(this._getPrompt());
    }

    /**
     * 执行本地命令
     * @private
     */
    _executeLocalCommand(cmd) {
        const result = this._commandRegistry.execute(cmd, this._context);
        
        if (result?.type === 'clear') {
            this._terminalAdapter.clear();
        } else if (result?.type === 'ls') {
            this._handleLsCommand(result.args);
        } else if (result?.type === 'cd') {
            this._handleCdCommand(result.path);
        } else if (result?.type === 'read') {
            this._handleReadCommand(result.id);
        } else if (result?.error) {
            this._terminalAdapter.write(`\x1b[31m${result.error}\x1b[0m\r\n`);
        } else if (result) {
            this._terminalAdapter.write(String(result) + '\r\n');
        }
    }

    /**
     * 处理退格键
     * @private
     */
    _handleBackspace() {
        if (this._currentInput.length > 0) {
            this._currentInput = this._currentInput.slice(0, -1);
            this._terminalAdapter.write('\b \b');
        }
    }

    /**
     * 处理历史记录向上
     * @private
     */
    _handleHistoryUp() {
        if (this._commandHistory.length > 0 && this._historyIndex > 0) {
            this._historyIndex--;
            this._clearCurrentLine();
            this._currentInput = this._commandHistory[this._historyIndex];
            this._terminalAdapter.write(this._currentInput);
        }
    }

    /**
     * 处理历史记录向下
     * @private
     */
    _handleHistoryDown() {
        if (this._historyIndex < this._commandHistory.length - 1) {
            this._historyIndex++;
            this._clearCurrentLine();
            this._currentInput = this._commandHistory[this._historyIndex];
            this._terminalAdapter.write(this._currentInput);
        } else {
            this._historyIndex = this._commandHistory.length;
            this._clearCurrentLine();
            this._currentInput = '';
        }
    }

    /**
     * 处理中断
     * @private
     */
    _handleInterrupt() {
        this._currentInput = '';
        this._terminalAdapter.write('^C\r\n' + this._getPrompt());
    }

    /**
     * 处理 Tab 补全
     * @private
     */
    _handleTabComplete() {
        const completions = this._commandRegistry.getCompletions(this._currentInput);
        
        if (completions.length === 1) {
            const newInput = completions[0] + ' ';
            this._clearCurrentLine();
            this._currentInput = newInput;
            this._terminalAdapter.write(this._getPrompt() + this._currentInput);
        } else if (completions.length > 1) {
            this._terminalAdapter.write('\r\n');
            this._terminalAdapter.write(completions.join('  ') + '\r\n');
            this._terminalAdapter.write(this._getPrompt() + this._currentInput);
        }
    }

    /**
     * 清空当前行
     * @private
     */
    _clearCurrentLine() {
        this._terminalAdapter.write('\r\x1b[K' + this._getPrompt());
    }

    /**
     * 获取提示符
     * @returns {string}
     * @private
     */
    _getPrompt() {
        return `\x1b[1m\x1b[36m${this._cwd}$\x1b[0m `;
    }

    /**
     * 显示欢迎信息
     * @private
     */
    _showWelcome() {
        const welcome = `
\x1b[36m╔═══════════════════════════════════════════════════════════╗
║                    WebShell Blog v2.0                       ║
║              DDD + Design Patterns Refactor              ║
║                                                           ║
║  Commands:                                                ║
║    ls              - List directory contents             ║
║    cd <dir>        - Change directory                    ║
║    read <id>       - Read article                        ║
║    clear           - Clear screen                        ║
║    help            - Show this help                      ║
║                                                           ║
║  Try: img https://picsum.photos/400/300                    ║
╚═══════════════════════════════════════════════════════════╝\x1b[0m
`;
        this._terminalAdapter.write(welcome);
        this._terminalAdapter.write(this._getPrompt());
    }

    /**
     * 处理服务器消息
     * @private
     */
    _handleServerMessage(data) {
        try {
            const msg = Message.fromJSON(data);
            
            switch (msg.type) {
                case 'output':
                    this._terminalAdapter.write(msg.content);
                    break;
                case 'image':
                    this._handleImageMessage(msg);
                    break;
                case 'clear':
                    this._terminalAdapter.clear();
                    this._imageRenderer.clear();
                    break;
                default:
                    this._terminalAdapter.write(msg.content || data);
            }
        } catch (e) {
            this._terminalAdapter.write(data);
        }
    }

    /**
     * 处理图片消息
     * @private
     */
    _handleImageMessage(msg) {
        if (msg.payload?.url) {
            this._imageRenderer.render(msg.payload.url, {
                width: msg.payload.width || 300
            }).then(() => {
                this._terminalAdapter.write('\x1b[32m[Image loaded]\x1b[0m\r\n');
            }).catch(err => {
                this._terminalAdapter.write(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
            });
        }
    }

    /**
     * 处理 ls 命令
     * @private
     */
    _handleLsCommand(args) {
        this._terminalAdapter.write('articles/  posts/  readme.md\r\n');
    }

    /**
     * 处理 cd 命令
     * @private
     */
    _handleCdCommand(path) {
        this._cwd = path;
        this._context.cwd = this._cwd;
        this._terminalAdapter.write(`\x1b[32m[cd ${path}]\x1b[0m\r\n`);
    }

    /**
     * 处理 read 命令
     * @private
     */
    _handleReadCommand(id) {
        this._terminalAdapter.write(`\x1b[32m[Reading article ${id}]\x1b[0m\r\n`);
    }
}

export { TerminalController };

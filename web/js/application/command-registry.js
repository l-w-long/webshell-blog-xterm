/**
 * Command Registry - 命令注册表
 * 采用单例模式，管理所有可用命令
 * 支持命令的注册、查找、补全
 * 
 * @author WebShell Blog
 * @since 2026-03-22
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

    /**
     * 注册命令
     * @param {Object} config - 命令配置
     * @param {string} config.name - 命令名称
     * @param {Function} config.handler - 命令处理器
     * @param {string} config.description - 命令描述
     * @param {Array} config.completions - 自动补全选项
     * @param {Array} config.aliases - 命令别名
     */
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

    /**
     * 批量注册命令
     * @param {Array} commands - 命令配置数组
     */
    registerMany(commands) {
        commands.forEach(config => this.register(config));
    }

    /**
     * 注销命令
     * @param {string} name - 命令名称
     * @returns {boolean} 是否成功
     */
    unregister(name) {
        const command = this._commands.get(name);
        if (!command) {
            return false;
        }
        
        if (command.aliases) {
            command.aliases.forEach(alias => {
                this._aliases.delete(alias);
            });
        }
        
        this._commands.delete(name);
        return true;
    }

    /**
     * 获取命令
     * @param {string} name - 命令名称或别名
     * @returns {Command}
     */
    get(name) {
        const actualName = this._aliases.get(name) || name;
        return this._commands.get(actualName);
    }

    /**
     * 检查命令是否存在
     * @param {string} name 
     * @returns {boolean}
     */
    has(name) {
        return this._commands.has(name) || this._aliases.has(name);
    }

    /**
     * 获取所有命令
     * @returns {Array<Command>}
     */
    getAll() {
        return Array.from(this._commands.values());
    }

    /**
     * 获取命令补全
     * @param {string} input - 当前输入
     * @returns {Array<string>} 补全选项
     */
    getCompletions(input) {
        if (!input) {
            return this.getAll().map(c => c.name);
        }
        
        const parts = input.trim().split(/\s+/);
        
        if (parts.length === 1) {
            const cmd = parts[0].toLowerCase();
            const commands = this.getAll()
                .filter(c => c.name.toLowerCase().startsWith(cmd))
                .map(c => c.name);
            return commands;
        }
        
        const cmd = this.get(parts[0]);
        if (cmd) {
            return cmd.getCompletions(parts[1]);
        }
        
        return [];
    }

    /**
     * 执行命令
     * @param {string} input - 命令输入
     * @param {Object} context - 执行上下文
     * @returns {*} 执行结果
     */
    execute(input, context) {
        const parts = input.trim().split(/\s+/);
        const cmdName = parts[0];
        const args = parts.slice(1);
        
        const command = this.get(cmdName);
        
        if (!command) {
            return { error: `command not found: ${cmdName}` };
        }
        
        let result;
        
        for (const mw of this._middleware) {
            const middlewareResult = mw(input, context);
            if (middlewareResult === false) {
                return { error: 'blocked by middleware' };
            }
        }
        
        try {
            result = command.execute(args, context);
        } catch (e) {
            result = { error: e.message };
        }
        
        return result;
    }

    /**
     * 添加中间件
     * @param {Function} middleware - 中间件函数
     */
    use(middleware) {
        this._middleware.push(middleware);
    }

    /**
     * 注册内置命令
     * @private
     */
    _registerBuiltInCommands() {
        this.register({
            name: 'help',
            description: 'Show available commands',
            completions: [],
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
            handler: (args, context) => {
                return { type: 'clear' };
            }
        });

        this.register({
            name: 'ls',
            description: 'List directory contents',
            completions: ['-l', '-a', '-la'],
            handler: (args, context) => {
                return { type: 'ls', args: args };
            }
        });

        this.register({
            name: 'cd',
            description: 'Change directory',
            handler: (args, context) => {
                return { type: 'cd', path: args[0] || '/home' };
            }
        });

        this.register({
            name: 'pwd',
            description: 'Print working directory',
            handler: (args, context) => {
                return context.cwd || '/home';
            }
        });

        this.register({
            name: 'cat',
            description: 'Display file contents',
            handler: (args, context) => {
                return { type: 'cat', file: args[0] };
            }
        });

        this.register({
            name: 'read',
            description: 'Read article by ID',
            handler: (args, context) => {
                return { type: 'read', id: parseInt(args[0]) };
            }
        });

        this.register({
            name: 'echo',
            description: 'Print text',
            handler: (args) => {
                return args.join(' ');
            }
        });

        this.register({
            name: 'date',
            description: 'Show current date and time',
            handler: () => {
                return new Date().toString();
            }
        });

        this.register({
            name: 'history',
            description: 'Show command history',
            handler: (args, context) => {
                const history = context.history || [];
                return history.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
            }
        });
    }
}

/**
 * Middleware Factory - 中间件工厂
 */
class CommandMiddleware {
    /**
     * 日志中间件
     * @returns {Function}
     */
    static logger() {
        return (input, context) => {
            console.log(`[Command] ${input}`);
            return true;
        };
    }

    /**
     * 验证中间件
     * @param {Function} validator - 验证函数
     * @returns {Function}
     */
    static validator(validator) {
        return (input, context) => {
            if (!validator(input, context)) {
                return false;
            }
            return true;
        };
    }

    /**
     * 超时中间件
     * @param {number} timeout - 超时时间(ms)
     * @returns {Function}
     */
    static timeout(timeout) {
        return (input, context) => {
            setTimeout(() => {
                console.warn(`Command timeout: ${input}`);
            }, timeout);
            return true;
        };
    }
}

export { CommandRegistry, CommandMiddleware };

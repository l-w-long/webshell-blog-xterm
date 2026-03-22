/**
 * Theme Manager - 主题管理器
 * 主题系统的核心管理类，负责主题的安装、切换、卸载
 * 采用单例模式确保全局唯一
 * 
 * @author WebShell Blog
 * @since 2026-03-22
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

    /**
     * 安装主题
     * @param {Object} themeConfig - 主题配置
     * @returns {Theme} 安装的主题
     */
    install(themeConfig) {
        const theme = new Theme(themeConfig);
        this._themes.set(theme.id, theme);
        
        if (!this._currentTheme || theme.isDefault) {
            this.apply(theme.id);
        }
        
        this._notifyListeners('install', theme);
        return theme;
    }

    /**
     * 卸载主题
     * @param {string} themeId - 主题ID
     * @returns {boolean} 是否成功
     */
    uninstall(themeId) {
        const theme = this._themes.get(themeId);
        if (!theme) {
            return false;
        }
        
        if (theme.isDefault) {
            console.warn('Cannot uninstall default theme');
            return false;
        }
        
        this._themes.delete(themeId);
        this._notifyListeners('uninstall', theme);
        return true;
    }

    /**
     * 应用主题
     * @param {string} themeId - 主题ID
     * @returns {boolean} 是否成功
     */
    apply(themeId) {
        const theme = this._themes.get(themeId);
        if (!theme) {
            console.error(`Theme not found: ${themeId}`);
            return false;
        }
        
        this._currentTheme = theme;
        this._applyThemeToDOM(theme);
        this._notifyListeners('apply', theme);
        return true;
    }

    /**
     * 获取当前主题
     * @returns {Theme}
     */
    getCurrentTheme() {
        return this._currentTheme;
    }

    /**
     * 获取所有已安装主题
     * @returns {Array<Theme>}
     */
    getAllThemes() {
        return Array.from(this._themes.values());
    }

    /**
     * 获取主题
     * @param {string} themeId 
     * @returns {Theme}
     */
    getTheme(themeId) {
        return this._themes.get(themeId);
    }

    /**
     * 添加主题变更监听器
     * @param {Function} listener 
     */
    addListener(listener) {
        this._listeners.add(listener);
    }

    /**
     * 移除监听器
     * @param {Function} listener 
     */
    removeListener(listener) {
        this._listeners.delete(listener);
    }

    /**
     * 应用主题到 DOM
     * @param {Theme} theme 
     * @private
     */
    _applyThemeToDOM(theme) {
        const root = document.documentElement;
        const colors = theme.colors;
        
        Object.keys(colors).forEach(key => {
            root.style.setProperty(`--${key}`, colors[key]);
        });
        
        const font = theme.font;
        if (font) {
            root.style.setProperty('--font-family', font.family || 'monospace');
            root.style.setProperty('--font-size', font.size || '14px');
        }
    }

    /**
     * 通知监听器
     * @param {string} event 
     * @param {Theme} theme 
     * @private
     */
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
 * Theme Plugin Interface - 主题插件接口
 * 主题扩展插件需要实现的接口
 */
class ThemePlugin {
    /**
     * @param {Object} config - 插件配置
     */
    constructor(config) {
        this._id = config.id;
        this._name = config.name;
        this._version = config.version;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get version() { return this._version; }

    /**
     * 安装钩子
     * @param {ThemeManager} manager 
     */
    onInstall(manager) {}

    /**
     * 卸载钩子
     * @param {ThemeManager} manager 
     */
    onUninstall(manager) {}

    /**
     * 应用钩子
     * @param {Theme} theme 
     */
    onApply(theme) {}
}

/**
 * 内置主题定义
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
        font: {
            family: 'Consolas, monospace',
            size: '14px'
        }
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
        font: {
            family: '"Fira Code", monospace',
            size: '13px'
        }
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
        font: {
            family: '"JetBrains Mono", monospace',
            size: '13px'
        }
    }
};

export { ThemeManager, ThemePlugin, BUILT_IN_THEMES };

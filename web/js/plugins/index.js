/**
 * Plugin System - 插件系统
 * 提供扩展能力的核心接口
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */

/**
 * Plugin Interface - 插件接口
 * 所有插件必须实现此接口
 */
class Plugin {
    /**
     * @param {Object} config - 插件配置
     */
    constructor(config) {
        this._id = config.id;
        this._name = config.name;
        this._version = config.version;
        this._enabled = false;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get version() { return this._version; }
    get enabled() { return this._enabled; }

    /**
     * 插件安装钩子
     * @param {Application} app - 应用程序实例
     */
    onInstall(app) {}

    /**
     * 插件启用钩子
     * @param {Application} app - 应用程序实例
     */
    onEnable(app) {}

    /**
     * 插件禁用钩子
     * @param {Application} app - 应用程序实例
     */
    onDisable(app) {}

    /**
     * 插件卸载钩子
     * @param {Application} app - 应用程序实例
     */
    onUninstall(app) {}
}

/**
 * Plugin Manager - 插件管理器
 * 负责插件的安装、启用、禁用和卸载
 */
class PluginManager {
    constructor() {
        this._plugins = new Map();
        this._app = null;
    }

    /**
     * 设置应用实例
     * @param {Application} app 
     */
    setApp(app) {
        this._app = app;
    }

    /**
     * 安装插件
     * @param {Plugin} plugin 
     * @returns {boolean}
     */
    install(plugin) {
        if (this._plugins.has(plugin.id)) {
            console.warn(`Plugin ${plugin.id} already installed`);
            return false;
        }

        this._plugins.set(plugin.id, plugin);
        plugin.onInstall(this._app);
        
        if (plugin.enabled) {
            plugin.onEnable(this._app);
        }
        
        return true;
    }

    /**
     * 卸载插件
     * @param {string} pluginId 
     * @returns {boolean}
     */
    uninstall(pluginId) {
        const plugin = this._plugins.get(pluginId);
        if (!plugin) {
            return false;
        }

        if (plugin.enabled) {
            plugin.onDisable(this._app);
        }

        plugin.onUninstall(this._app);
        this._plugins.delete(pluginId);
        
        return true;
    }

    /**
     * 启用插件
     * @param {string} pluginId 
     * @returns {boolean}
     */
    enable(pluginId) {
        const plugin = this._plugins.get(pluginId);
        if (!plugin || plugin.enabled) {
            return false;
        }

        plugin._enabled = true;
        plugin.onEnable(this._app);
        
        return true;
    }

    /**
     * 禁用插件
     * @param {string} pluginId 
     * @returns {boolean}
     */
    disable(pluginId) {
        const plugin = this._plugins.get(pluginId);
        if (!plugin || !plugin.enabled) {
            return false;
        }

        plugin._enabled = false;
        plugin.onDisable(this._app);
        
        return true;
    }

    /**
     * 获取插件
     * @param {string} pluginId 
     * @returns {Plugin}
     */
    get(pluginId) {
        return this._plugins.get(pluginId);
    }

    /**
     * 获取所有插件
     * @returns {Array<Plugin>}
     */
    getAll() {
        return Array.from(this._plugins.values());
    }

    /**
     * 获取已启用的插件
     * @returns {Array<Plugin>}
     */
    getEnabled() {
        return this.getAll().filter(p => p.enabled);
    }
}

/**
 * Example Plugin - 示例插件
 * 展示如何创建插件
 */
class ExamplePlugin extends Plugin {
    constructor() {
        super({
            id: 'example',
            name: 'Example Plugin',
            version: '1.0.0'
        });
    }

    onInstall(app) {
        console.log('Example plugin installed');
    }

    onEnable(app) {
        console.log('Example plugin enabled');
        app.registerCommand({
            name: 'example',
            description: 'Example command from plugin',
            handler: (args) => {
                return 'Hello from example plugin!';
            }
        });
    }

    onDisable(app) {
        console.log('Example plugin disabled');
        app.unregisterCommand('example');
    }
}

export { Plugin, PluginManager, ExamplePlugin };

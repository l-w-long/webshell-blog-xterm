/**
 * Image Render Strategy - 图片渲染策略接口
 * 采用策略模式，支持多种图片渲染方式
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */

/**
 * 渲染策略基类
 */
class ImageRenderStrategy {
    constructor() {
        this._enabled = true;
    }

    get enabled() { return this._enabled; }

    /**
     * 渲染图片
     * @param {string} url - 图片URL
     * @param {Object} options - 渲染选项
     * @returns {Promise<Object>} 渲染结果
     */
    async render(url, options) {
        throw new Error('Method not implemented');
    }

    /**
     * 清除已渲染的图片
     */
    clear() {
        throw new Error('Method not implemented');
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }
}

/**
 * DOM 渲染策略 - 通过 DOM 叠加层渲染图片
 */
class DOMRenderStrategy extends ImageRenderStrategy {
    /**
     * @param {HTMLElement} container - 容器元素
     * @param {Object} term - 终端实例
     */
    constructor(container, term) {
        super();
        this._container = container;
        this._term = term;
        this._images = [];
        this._charWidth = 0;
        this._charHeight = 0;
        
        this._updateDimensions();
    }

    /**
     * 更新字符尺寸
     * @private
     */
    _updateDimensions() {
        const dims = this._term?._core?._renderService?.dimensions;
        if (dims) {
            this._charWidth = dims.actualCellWidth;
            this._charHeight = dims.actualCellHeight;
        }
    }

    /**
     * 渲染图片
     * @param {string} url - 图片URL
     * @param {Object} options - 渲染选项
     * @returns {Promise<Object>} 渲染结果
     */
    async render(url, options = {}) {
        const {
            width = 300,
            height = 'auto',
            row = null
        } = options;

        this._updateDimensions();
        
        const targetRow = row ?? this._term?.buffer?.active?.cursorY || 0;
        const pos = this._calculatePosition(targetRow);

        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.cssText = `
            position: absolute;
            top: ${pos.top}px;
            left: ${pos.left}px;
            z-index: 10;
        `;

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
                
                img.style.cssText = `
                    max-width: ${width}px;
                    height: ${height === 'auto' ? 'auto' : height + 'px'};
                `;
                
                wrapper.appendChild(img);
                this._container.appendChild(wrapper);
                
                const imageData = {
                    element: wrapper,
                    url: url,
                    row: targetRow,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                
                this._images.push(imageData);
                
                const outputRows = Math.ceil(scaledHeight / this._charHeight);
                resolve({
                    success: true,
                    rows: outputRows,
                    image: imageData
                });
            };
            
            img.onerror = () => {
                placeholder.textContent = '[Image Load Failed]';
                placeholder.style.color = 'var(--red)';
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    /**
     * 计算图片位置
     * @param {number} row - 行号
     * @returns {Object} 位置坐标
     * @private
     */
    _calculatePosition(row) {
        const viewport = this._term?.buffer?.viewportY || 0;
        const absoluteRow = row + viewport;
        
        const termElement = this._term?.element;
        const parentRect = termElement?.parentElement?.getBoundingClientRect() || { top: 0, left: 0 };
        
        return {
            top: parentRect.top + termElement?.offsetTop + (absoluteRow * this._charHeight) + 4,
            left: parentRect.left + termElement?.offsetLeft + 8
        };
    }

    /**
     * 清除所有图片
     */
    clear() {
        this._images.forEach(img => {
            if (img.element?.parentElement) {
                img.element.remove();
            }
        });
        this._images = [];
        
        const placeholders = this._container.querySelectorAll('.loading-placeholder');
        placeholders.forEach(p => p.parentElement?.remove());
    }

    /**
     * 更新图片位置（响应滚动和调整大小）
     */
    updatePositions() {
        this._updateDimensions();
        
        this._images.forEach(img => {
            const pos = this._calculatePosition(img.row);
            img.element.style.top = `${pos.top}px`;
            img.element.style.left = `${pos.left}px`;
        });
    }
}

/**
 * Sixel 渲染策略 - 通过 Sixel 协议渲染图片
 */
class SixelRenderStrategy extends ImageRenderStrategy {
    /**
     * @param {Object} term - 终端实例
     */
    constructor(term) {
        super();
        this._term = term;
    }

    /**
     * 渲染图片
     * @param {string} url - 图片URL
     * @param {Object} options - 渲染选项
     * @returns {Promise<Object>} 渲染结果
     */
    async render(url, options = {}) {
        const { width = 400 } = options;

        try {
            const canvas = await this._loadImageToCanvas(url, width);
            const sixelData = this._canvasToSixel(canvas);
            
            return {
                success: true,
                data: sixelData,
                type: 'sixel'
            };
        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    }

    /**
     * 加载图片到 Canvas
     * @param {string} url 
     * @param {number} maxWidth 
     * @returns {Promise<HTMLCanvasElement>}
     * @private
     */
    async _loadImageToCanvas(url, maxWidth) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    /**
     * 将 Canvas 转换为 Sixel 格式
     * @param {HTMLCanvasElement} canvas 
     * @returns {string} Sixel 数据
     * @private
     */
    _canvasToSixel(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        
        let sixel = '\x1bP0;0;8;q' + width + ';' + height + '#';
        
        const colorCache = new Map();
        let colorIndex = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];
                const a = imageData.data[idx + 3];
                
                if (a < 128) {
                    sixel += ' ';
                    continue;
                }
                
                const colorKey = `${r},${g},${b}`;
                let colorNum;
                
                if (colorCache.has(colorKey)) {
                    colorNum = colorCache.get(colorKey);
                } else {
                    colorNum = colorIndex++;
                    colorCache.set(colorKey, colorNum);
                    sixel += `\x1bP1;0;2;${colorNum};${r};${g};${b}$`;
                }
                
                sixel += String(colorNum);
            }
            sixel += '-';
        }
        
        sixel += '\x1b\\';
        return sixel;
    }

    /**
     * 清除图片
     */
    clear() {}
}

/**
 * Image Renderer Factory - 图片渲染器工厂
 * 工厂模式创建适合的渲染器
 */
class ImageRendererFactory {
    /**
     * 创建渲染器
     * @param {string} type - 渲染类型 ('dom' | 'sixel')
     * @param {Object} options - 选项
     * @returns {ImageRenderStrategy}
     */
    static create(type, options) {
        switch (type) {
            case 'sixel':
                return new SixelRenderStrategy(options.term);
            case 'dom':
            default:
                return new DOMRenderStrategy(options.container, options.term);
        }
    }
}

export { ImageRenderStrategy, DOMRenderStrategy, SixelRenderStrategy, ImageRendererFactory };

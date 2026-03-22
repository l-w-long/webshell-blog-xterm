class ImageOverlay {
    constructor(term, overlayContainer) {
        this.term = term;
        this.container = overlayContainer;
        this.images = [];
        this.charWidth = 0;
        this.charHeight = 0;
        this.terminalTop = 0;
        this.terminalLeft = 0;
        
        this.updateDimensions();
        this.bindScrollHandler();
        this.bindResizeHandler();
    }

    updateDimensions() {
        const dims = this.term._core?._renderService?.dimensions;
        if (dims) {
            this.charWidth = dims.actualCellWidth;
            this.charHeight = dims.actualCellHeight;
        }
        
        const termElement = this.term.element;
        if (termElement) {
            const parentRect = termElement.parentElement.getBoundingClientRect();
            this.terminalTop = parentRect.top + termElement.offsetTop;
            this.terminalLeft = parentRect.left + termElement.offsetLeft;
        }
    }

    getRowPosition(row) {
        const viewport = this.term.buffer.viewportY;
        const absoluteRow = row + viewport;
        return {
            top: this.terminalTop + (absoluteRow * this.charHeight) + 4,
            left: this.terminalLeft + 8
        };
    }

    injectImage(imageUrl, options = {}) {
        const {
            width = 300,
            height = 'auto',
            rows = 10,
            row = null
        } = options;

        this.updateDimensions();
        
        const targetRow = row ?? this.term.buffer.active.cursorY;
        const pos = this.getRowPosition(targetRow);

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
        img.onload = () => {
            wrapper.innerHTML = '';
            const scale = width / img.naturalWidth;
            const scaledHeight = img.naturalHeight * scale;
            
            img.style.cssText = `
                max-width: ${width}px;
                height: ${height === 'auto' ? 'auto' : height + 'px'};
            `;
            
            wrapper.appendChild(img);
            
            this.images.push({
                element: wrapper,
                row: targetRow,
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = () => {
            placeholder.textContent = '[Image Load Failed]';
            placeholder.style.color = '#ff6b6b';
        };

        img.src = imageUrl;
        this.container.appendChild(wrapper);

        const outputRows = Math.ceil((img.naturalHeight || 200) / this.charHeight);
        return outputRows;
    }

    injectBase64Image(base64Data, mimeType = 'image/png', options = {}) {
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        return this.injectImage(dataUrl, options);
    }

    clearAll() {
        this.images.forEach(img => {
            if (img.element.parentElement) {
                img.element.remove();
            }
        });
        this.images = [];
        
        const placeholders = this.container.querySelectorAll('.loading-placeholder');
        placeholders.forEach(p => p.parentElement?.remove());
    }

    bindScrollHandler() {
        this.term.onScroll(() => {
            this.updateDimensions();
            this.images.forEach(img => {
                const pos = this.getRowPosition(img.row);
                img.element.style.top = `${pos.top}px`;
                img.element.style.left = `${pos.left}px`;
            });
        });
    }

    bindResizeHandler() {
        window.addEventListener('resize', () => {
            this.updateDimensions();
            this.images.forEach(img => {
                const pos = this.getRowPosition(img.row);
                img.element.style.top = `${pos.top}px`;
                img.element.style.left = `${pos.left}px`;
            });
        });
    }

    removeImage(imageUrl) {
        const index = this.images.findIndex(img => 
            img.element.querySelector('img')?.src === imageUrl
        );
        if (index !== -1) {
            this.images[index].element.remove();
            this.images.splice(index, 1);
        }
    }
}

window.ImageOverlay = ImageOverlay;

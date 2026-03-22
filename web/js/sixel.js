class SixelRenderer {
    constructor(term) {
        this.term = term;
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    parseSixel(data) {
        const sixelRegex = /\x1bP0;0;8;q([0-9;]+)#([0-9]+)([0-9;\-!$%&'()*+.\/:<=>?@\[\] ^_`{|}~]*)\x1b\\/g;
        const results = [];
        let match;

        while ((match = sixelRegex.exec(data)) !== null) {
            const params = match[1].split(';').map(Number);
            const gridWidth = params[0];
            const gridHeight = params[1];
            
            results.push({
                width: gridWidth,
                height: gridHeight,
                raw: match[0]
            });
        }

        return results;
    }

    renderImage(url, options = {}) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxWidth = options.width || 400;
                const scale = Math.min(1, maxWidth / img.width);
                
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve({
                    url: canvas.toDataURL('image/png'),
                    width: canvas.width,
                    height: canvas.height
                });
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    isSixelData(data) {
        return /\x1bP0;0;8;q/.test(data);
    }
}

window.SixelRenderer = SixelRenderer;

class WebShellTerminal {
    constructor() {
        this.term = null;
        this.fitAddon = null;
        this.webLinksAddon = null;
        this.imageOverlay = null;
        this.ws = null;
        this.currentMode = 'dom';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        this.isConnected = false;

        this.init();
    }

    async init() {
        this.createTerminal();
        this.setupImageOverlay();
        this.setupControls();
        this.connectWebSocket();
        this.showWelcome();
    }

    createTerminal() {
        this.term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            fontSize: 14,
            fontWeight: '400',
            fontWeightBold: 'bold',
            lineHeight: 1.2,
            theme: {
                background: '#0a0e14',
                foreground: '#e6e6e6',
                cursor: '#00ff9f',
                cursorAccent: '#0a0e14',
                selection: 'rgba(0, 255, 159, 0.3)',
                black: '#1a1e26',
                red: '#ff6b6b',
                green: '#00ff9f',
                yellow: '#ffcc00',
                blue: '#00b4d8',
                magenta: '#ff6bff',
                cyan: '#00ffff',
                white: '#e6e6e6',
                brightBlack: '#6e7681',
                brightRed: '#ff8787',
                brightGreen: '#69ff94',
                brightYellow: '#ffd43b',
                brightBlue: '#74c0fc',
                brightMagenta: '#da77f2',
                brightCyan: '#66d9e8',
                brightWhite: '#ffffff'
            },
            allowProposedApi: true
        });

        this.fitAddon = new FitAddon.FitAddon();
        this.webLinksAddon = new WebLinksAddon.WebLinksAddon();

        this.term.loadAddon(this.fitAddon);
        this.term.loadAddon(this.webLinksAddon);

        const container = document.getElementById('terminal-container');
        this.term.open(container);
        this.fitAddon.fit();

        this.term.onData(data => this.handleInput(data));
        this.term.onResize(() => this.handleResize());
        
        window.addEventListener('resize', () => {
            this.fitAddon.fit();
            if (this.imageOverlay) {
                this.imageOverlay.updateDimensions();
            }
        });
    }

    setupImageOverlay() {
        const overlayContainer = document.getElementById('image-overlay');
        this.imageOverlay = new ImageOverlay(this.term, overlayContainer);
    }

    setupControls() {
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.term.clear();
            this.imageOverlay.clearAll();
        });

        document.getElementById('btn-mode').addEventListener('click', () => {
            this.toggleMode();
        });
    }

    toggleMode() {
        if (this.currentMode === 'dom') {
            this.currentMode = 'sixel';
            document.getElementById('btn-mode').textContent = 'SIXEL';
            this.writeLine('\x1b[33m[Sixel Mode Enabled]\x1b[0m');
        } else {
            this.currentMode = 'dom';
            document.getElementById('btn-mode').textContent = 'DOM';
            this.writeLine('\x1b[33m[DOM Mode Enabled]\x1b[0m');
        }
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.writeLine('\x1b[32m[Connected to server]\x1b[0m');
            };

            this.ws.onmessage = (event) => {
                this.handleServerMessage(event.data);
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.writeLine('\x1b[31m[Disconnected from server]\x1b[0m');
                this.writeLine('Attempting to reconnect in 3 seconds...');
                setTimeout(() => this.connectWebSocket(), 3000);
            };

            this.ws.onerror = () => {
                this.isConnected = false;
            };
        } catch (e) {
            this.writeLine('\x1b[31m[WebSocket not available, running in demo mode]\x1b[0m');
        }
    }

    handleServerMessage(data) {
        try {
            const msg = JSON.parse(data);
            
            switch (msg.type) {
                case 'output':
                    this.term.write(msg.content);
                    break;
                case 'image':
                    if (this.currentMode === 'dom') {
                        const rows = this.imageOverlay.injectImage(msg.url, {
                            width: msg.width || 300
                        });
                        this.term.write(`\r\n\x1b[2A`);
                    } else {
                        this.term.write(msg.sixelData);
                    }
                    break;
                case 'clear':
                    this.term.clear();
                    this.imageOverlay.clearAll();
                    break;
            }
        } catch (e) {
            this.term.write(data);
        }
    }

    showWelcome() {
        const welcome = `
\x1b[36m╔═══════════════════════════════════════════════════════════╗
║                    WebShell Blog v1.0                       ║
║                                                           ║
║  Commands:                                                ║
║    img <url>     - Display image inline                   ║
║    clear         - Clear screen                          ║
║    mode          - Toggle DOM/Sixel mode                 ║
║    help          - Show this help                        ║
║                                                           ║
║  Try: img https://picsum.photos/400/300                    ║
╚═══════════════════════════════════════════════════════════╝\x1b[0m
`;
        this.term.write(welcome);
        this.term.write('\r\n$ ');
    }

    handleInput(data) {
        if (data === '\r') {
            this.term.write('\r\n');
            const cmd = this.currentInput.trim();
            
            if (cmd) {
                this.commandHistory.push(cmd);
                this.historyIndex = this.commandHistory.length;
                this.executeCommand(cmd);
            }
            
            this.currentInput = '';
            if (this.isConnected) {
                this.ws.send(JSON.stringify({ type: 'command', content: cmd }));
            }
            this.term.write('$ ');
        } else if (data === '\x7f') {
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.term.write('\b \b');
            }
        } else if (data === '\x1b[A') {
            if (this.historyIndex > 0) {
                this.clearCurrentLine();
                this.historyIndex--;
                this.currentInput = this.commandHistory[this.historyIndex];
                this.term.write(this.currentInput);
            }
        } else if (data === '\x1b[B') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.clearCurrentLine();
                this.historyIndex++;
                this.currentInput = this.commandHistory[this.historyIndex];
                this.term.write(this.currentInput);
            } else {
                this.historyIndex = this.commandHistory.length;
                this.clearCurrentLine();
                this.currentInput = '';
            }
        } else {
            this.currentInput += data;
            this.term.write(data);
        }
    }

    clearCurrentLine() {
        this.term.write('\r\x1b[K$ ');
    }

    executeCommand(cmd) {
        const [command, ...args] = cmd.split(' ');

        switch (command.toLowerCase()) {
            case 'img':
            case 'image':
                const url = args[0];
                if (url) {
                    this.imageOverlay.injectImage(url);
                    this.writeLine('\x1b[32m[Loading image...]\x1b[0m');
                } else {
                    this.writeLine('\x1b[31mUsage: img <image-url>\x1b[0m');
                }
                break;

            case 'clear':
            case 'cls':
                this.term.clear();
                this.imageOverlay.clearAll();
                break;

            case 'mode':
                this.toggleMode();
                break;

            case 'help':
                this.writeLine('\x1b[36mAvailable commands:\x1b[0m');
                this.writeLine('  img <url>   - Display image inline');
                this.writeLine('  clear       - Clear screen');
                this.writeLine('  mode        - Toggle DOM/Sixel mode');
                this.writeLine('  history     - Show command history');
                this.writeLine('  demo        - Run demo');
                break;

            case 'history':
                this.commandHistory.forEach((cmd, i) => {
                    this.writeLine(`  ${i + 1}  ${cmd}`);
                });
                break;

            case 'demo':
                this.runDemo();
                break;

            default:
                this.writeLine(`\x1b[33mUnknown command: ${command}. Type 'help' for available commands.\x1b[0m`);
        }
    }

    writeLine(text) {
        this.term.write(text + '\r\n');
    }

    async runDemo() {
        this.writeLine('\x1b[32mRunning image demo...\x1b[0m');
        
        const demoImages = [
            'https://picsum.photos/400/200?random=1',
            'https://picsum.photos/300/300?random=2',
            'https://picsum.photos/500/250?random=3'
        ];

        for (const url of demoImages) {
            this.imageOverlay.injectImage(url, { width: 250 });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.writeLine('\x1b[32mDemo complete!\x1b[0m');
    }

    handleResize() {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'resize',
                cols: this.term.cols,
                rows: this.term.rows
            }));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new WebShellTerminal();
});

# AGENTS.md - WebShell Blog Development Guide

This file provides guidelines and commands for agentic coding agents working in this repository.

## Project Overview

WebShell Blog is a terminal-style blog system combining:
- **Frontend**: Xterm.js + Vanilla JavaScript (web/)
- **Backend**: Go + WebSocket (server/)
- **UI Theme**: Snazzy Theme (Dracula variant)

## Directory Structure

```
webshellblog/
├── web/                    # Frontend (Vanilla JS, no build)
│   ├── index.html          # Main entry point
│   ├── js/                 # JavaScript modules
│   ├── css/                # Stylesheets
│   └── lib/                # External dependencies (xterm.js)
├── server/                 # Go backend
│   ├── cmd/                # Entry points
│   │   ├── main.go         # WebSocket server
│   │   └── image-server.go # Image generation server
│   └── go.mod
├── pkg/                    # Shared packages (sixel, terminal)
└── docs/                   # Documentation
```

---

## Build & Run Commands

### Frontend (No build required)

```bash
# Direct browser open
open web/index.html

# Or use local server
cd web && npx serve
# Visit http://localhost:3000
```

### Go Backend

```bash
# Build server
cd server
go build -o server.exe ./cmd/main.go

# Run server
go run ./cmd/main.go
# Visit http://localhost:8080

# Run image server (separate)
go run ./cmd/image-server.go
# Serves on :8081
```

### Single File Execution

```bash
# Run specific Go file
go run server/cmd/main.go -addr :8080
```

---

## Testing

**Note**: This project currently has no automated tests.

For manual testing:
1. Open `web/index.html` in browser
2. Test terminal commands: `ls`, `cd`, `cat`, `read`, `help`
3. Test Tab completion and command history (↑↓)
4. Test image display: `img <url>`

---

## Code Style Guidelines

### Go (server/)

**Formatting & Style**
- Use `gofmt` for formatting: `gofmt -w server/`
- 4-space indentation (standard Go)
- Import grouping: stdlib first, then third-party
- Error handling: handle errors explicitly, avoid `_` ignores unless necessary

**Naming Conventions**
- PascalCase for exported: `NewTerminal()`, `type Client struct`
- camelCase for unexported: `readPump()`, `parseCommand()`
- Acronyms: `URL`, `ID` (capitalized)
- Package names: short, lowercase: `pkg/sixel/`

**Structure Example**
```go
type Terminal struct {
    width    int
    height   int
    clients  map[*Client]bool
    broadcast chan []byte
    mu       sync.RWMutex
}

func NewTerminal() *Terminal {
    return &Terminal{
        width:    80,
        height:   24,
        clients:  make(map[*Client]bool),
        broadcast: make(chan []byte, 256),
    }
}
```

**Error Handling**
- Return errors, don't panic
- Log errors with `log.Printf` or `log.Println`
- Use `defer` for cleanup (e.g., `defer resp.Body.Close()`)
- Check errors immediately after operations

**Concurrency**
- Use mutexes for shared state: `sync.RWMutex`
- RLock for reads, Lock for writes
- Always close channels in defer when appropriate

---

### JavaScript (web/js/)

**Formatting & Style**
- 4-space indentation (NO tabs)
- Class-based OOP with ES6 classes
- Semicolons required
- Line length: ~100 characters max

**Naming Conventions**
- PascalCase for classes: `class WebShellTerminal`, `class ImageOverlay`
- camelCase for methods/variables: `handleInput()`, `currentInput`
- UPPER_SNAKE for constants: `MAX_RECONNECT_ATTEMPTS`
- Private members: prefix with `_` (e.g., `_charWidth`)

**Class Structure Example**
```javascript
class ImageOverlay {
    constructor(term, overlayContainer) {
        this.term = term;
        this.container = overlayContainer;
        this.images = [];
        this._charWidth = 0;
        this._charHeight = 0;
        
        this.updateDimensions();
        this.bindScrollHandler();
    }
    
    updateDimensions() { /* ... */ }
    bindScrollHandler() { /* ... */ }
}
```

**Async/Promises**
- Use `async/await` over raw Promises
- Always handle errors with try/catch
```javascript
async runDemo() {
    try {
        const url = await this.fetchImage(src);
        this.injectImage(url);
    } catch (err) {
        this.writeLine(`\x1b[31mError: ${err.message}\x1b[0m`);
    }
}
```

---

### CSS (web/css/, inline styles)

**Styling Approach**
- Use CSS custom properties (variables) in `:root`
- Consistent with Snazzy theme colors
- Box-sizing: `border-box` always
- Use flexbox for layouts

**Theme Colors (Snazzy)**
```css
:root {
    --bg: #282a36;
    --fg: #f8f8f2;
    --pink: #ff79c6;
    --green: #50fa7b;
    --cyan: #8be9fd;
    --red: #ff5555;
    --yellow: #f1fa8c;
    --comment: #6272a4;
}
```

---

### Terminal Escape Codes

The project uses ANSI escape codes for terminal styling:

```javascript
// Color codes
'\x1b[31m' // red
'\x1b[32m' // green
'\x1b[33m' // yellow
'\x1b[36m' // cyan
'\x1b[0m'  // reset

// Examples
term.writeln('\x1b[32m[Success]\x1b[0m');
term.write('\x1b[31mError: \x1b[0m');
```

---

### HTML (web/index.html)

**Structure**
- Semantic HTML5 elements
- BEM-like class naming for TUI components
- Inline `<style>` for page-specific styles
- External stylesheet for shared styles

**TUI Component Classes**
```html
<div class="tui-container">
    <div class="tui-titlebar">...</div>
    <div class="tui-main">
        <div class="tui-panel">
            <div class="tui-panel-header">...</div>
            <div class="tui-panel-content">...</div>
        </div>
    </div>
    <div class="tui-statusbar">...</div>
</div>
```

---

## Error Handling

### JavaScript
```javascript
// Always use try/catch with async code
try {
    const data = JSON.parse(response);
    return data;
} catch (e) {
    console.error('Parse error:', e);
    return null;
}

// WebSocket error handling
ws.onerror = () => { /* handle */ };
ws.onclose = () => { /* handle, attempt reconnect */ };
```

### Go
```go
// Standard error pattern
if err != nil {
    log.Printf("error: %v", err)
    return err
}

// HTTP response errors
resp, err := http.Get(url)
if err != nil {
    return nil, err
}
defer resp.Body.Close()
```

---

## Best Practices

1. **No Magic Numbers**: Use named constants
   ```javascript
   const MAX_HISTORY_SIZE = 100;
   const DEFAULT_IMAGE_WIDTH = 300;
   ```

2. **Consistent APIs**: Follow existing patterns
   - Method naming: `getXxx()`, `setXxx()`, `handleXxx()`, `updateXxx()`
   - Event handlers: `onXxx()` for listeners

3. **Type Safety**: While this is vanilla JS, add JSDoc comments for complex types
   ```javascript
   /**
    * @typedef {Object} Message
    * @property {string} type
    * @property {string} [content]
    * @property {string} [url]
    */
   ```

4. **Accessibility**: Use keyboard shortcuts, ARIA labels where applicable

5. **Performance**: Avoid unnecessary DOM operations, cache references

---

## Common Development Tasks

### Adding a New Command
1. Add to command list in `terminal.js`/`index.html` switch statement
2. Implement handler function
3. Add Tab completion support
4. Update help text

### Adding a New Xterm.js Theme Color
1. Add to both JS `theme` object and CSS `:root` variables
2. Use escape codes in terminal output

### Adding WebSocket Message Types
1. Define message schema in both client and server
2. Add case in message handling switch
3. Document in docs/README.md

---

## Linting

No linting tools currently configured. When adding:
- **Go**: Use `golangci-lint run`
- **JavaScript**: Use ESLint with ES6+ rules
- Run before commits if configured

---

Last updated: 2026-03-22

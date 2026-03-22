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
├── web/                    # Frontend (Vanilla JS)
│   ├── index.html          # Main entry point
│   ├── js/                 # JavaScript modules (DDD architecture)
│   │   ├── domain/         # Domain layer
│   │   │   ├── entities/   # Terminal, Client, Article, Category
│   │   │   └── value-objects/ # Theme, Command, Message
│   │   ├── application/    # Application layer (CommandRegistry)
│   │   ├── infrastructure/ # Infrastructure (Adapters, ImageRenderer)
│   │   ├── interfaces/     # Interface layer (TerminalController)
│   │   ├── plugins/        # Plugin system
│   │   └── themes/         # Theme manager
│   ├── css/
│   └── lib/
├── server/                 # Go backend (DDD)
│   ├── cmd/                # Entry points
│   │   ├── main.go
│   │   └── image-server.go
│   └── internal/
│       ├── domain/         # Domain entities
│       ├── application/    # Application services
│       └── infrastructure/ # Infrastructure
├── iterations/             # Iteration documentation
│   ├── iter01-base/       # Original code
│   ├── iter02-ddd-refactor/ # DDD refactor
│   ├── iter03-theme-system/ # Theme system
│   └── iter04-docs/        # Documentation
└── docs/
```

---

## Build & Run Commands

### Frontend

```bash
# Direct browser open
open web/index.html

# Or use local server
cd web && npx serve
# Visit http://localhost:3000
```

### Go Backend

```bash
cd server
go build -o server.exe ./cmd/main.go
go run ./cmd/main.go
# Visit http://localhost:8080

# Image server
go run ./cmd/image-server.go
```

---

## Testing

Manual testing only - no automated tests.

1. Open `web/index.html` in browser
2. Test commands: `ls`, `cd`, `cat`, `read`, `help`
3. Test Tab completion and command history
4. Test theme switching

---

## Code Style Guidelines

### Go (server/)

**Formatting & Style**
- Use `gofmt`: `gofmt -w server/`
- 4-space indentation
- Import grouping: stdlib first, then third-party

**Naming Conventions**
- PascalCase for exported: `NewTerminal()`, `type Client struct`
- camelCase for unexported: `readPump()`, `parseCommand()`
- Acronyms: `URL`, `ID` (capitalized)
- Package names: short, lowercase

**Structure Example**
```go
type Terminal struct {
    ID        string
    Width     int
    Height    int
    Clients   map[*Client]bool
    mu        sync.RWMutex
}
```

**Error Handling**
- Return errors, don't panic
- Log with `log.Printf`
- Use `defer` for cleanup

---

### JavaScript (web/js/)

**Formatting & Style**
- 4-space indentation
- Class-based OOP with ES6 classes
- Semicolons required

**Naming Conventions**
- PascalCase for classes: `class ThemeManager`
- camelCase for methods: `handleInput()`
- Private members: prefix with `_`: `_charWidth`

**Class Structure**
```javascript
class ThemeManager {
    constructor() {
        this._themes = new Map();
    }
    
    install(themeConfig) { /* ... */ }
    apply(themeId) { /* ... */ }
}
```

**Async/Promises**
- Use `async/await`
- Always handle errors with try/catch

---

### CSS

- Use CSS custom properties in `:root`
- Follow Snazzy theme colors
- Box-sizing: `border-box`

**Theme Colors**
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

## Design Patterns

### 1. Factory
- `ImageRendererFactory`: Create renderers
- `TerminalFactory`: Create terminals

### 2. Strategy
- `ImageRenderStrategy`: Image rendering interface
- `DOMRenderStrategy`: DOM overlay rendering
- `SixelRenderStrategy`: Sixel protocol rendering

### 3. Singleton
- `ThemeManager`: Global theme manager
- `CommandRegistry`: Global command registry

### 4. Observer
- Event listener system for theme changes

### 5. Decorator
- Command middleware (logging, validation)

---

## Domain Models

### Core Domain Entities
- `Terminal`: Aggregate root, session management
- `Client`: Entity, WebSocket connection
- `Article`: Entity, blog article
- `Category`: Entity, article category

### Value Objects
- `Theme`: Immutable theme configuration
- `Command`: Executable command definition
- `Message`: WebSocket communication

---

## Extension Points

### Commands
```javascript
CommandRegistry.getInstance().register({
    name: 'custom',
    handler: (args, context) => { /* ... */ },
    description: 'Custom command',
    completions: ['opt1', 'opt2']
});
```

### Themes
```javascript
const manager = ThemeManager.getInstance();
manager.install({
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: { /* ... */ }
});
manager.apply('cyberpunk');
```

### Image Renderers
```javascript
ImageRendererFactory.create('sixel', { term: terminal });
```

### Plugins
```javascript
class MyPlugin extends Plugin {
    onEnable(app) { /* ... */ }
}
PluginManager.getInstance().install(new MyPlugin());
```

---

## Best Practices

1. **No Magic Numbers**: Use named constants
2. **Consistent APIs**: Follow existing patterns
3. **Error Handling**: Always handle errors
4. **Documentation**: Add JSDoc comments for complex types

---

## Iteration Documentation

See `iterations/` folder for detailed documentation:
- `iter01-base/`: Original code baseline
- `iter02-ddd-refactor/`: DDD architecture
- `iter03-theme-system/`: Theme system implementation
- `iter04-docs/`: Domain model documentation

---

## Linting

No linting tools configured. When adding:
- **Go**: `golangci-lint run`
- **JavaScript**: ESLint with ES6+ rules

---

Last updated: 2026-03-22

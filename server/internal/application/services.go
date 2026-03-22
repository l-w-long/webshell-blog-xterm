package application

import (
	"webshellblog/server/internal/domain"
)

/**
 * Terminal Service - 终端服务
 * 应用层服务，处理终端相关业务逻辑
 */
type TerminalService struct {
	terminals map[string]*domain.Terminal
}

func NewTerminalService() *TerminalService {
	return &TerminalService{
		terminals: make(map[string]*domain.Terminal),
	}
}

func (s *TerminalService) GetOrCreateTerminal(id string) *domain.Terminal {
	if term, ok := s.terminals[id]; ok {
		return term
	}
	term := domain.NewTerminal(id)
	s.terminals[id] = term
	return term
}

func (s *TerminalService) GetTerminal(id string) *domain.Terminal {
	return s.terminals[id]
}

/**
 * Command Service - 命令服务
 * 处理命令解析和执行
 */
type CommandService struct {
	handlers map[string]CommandHandler
}

type CommandHandler func(args []string, ctx map[string]interface{}) interface{}

func NewCommandService() *CommandService {
	s := &CommandService{
		handlers: make(map[string]CommandHandler),
	}
	s.registerDefaults()
	return s
}

func (s *CommandService) Register(name string, handler CommandHandler) {
	s.handlers[name] = handler
}

func (s *CommandService) Execute(cmd string, ctx map[string]interface{}) interface{} {
	args := parseCommandArgs(cmd)
	if len(args) == 0 {
		return nil
	}

	name := args[0]
	handler, ok := s.handlers[name]
	if !ok {
		return "command not found: " + name
	}

	return handler(args[1:], ctx)
}

func (s *CommandService) registerDefaults() {
	s.Register("help", func(args []string, ctx map[string]interface{}) interface{} {
		output := []string{"Available commands:"}
		for name := range s.handlers {
			output = append(output, "  "+name)
		}
		return joinLines(output)
	})

	s.Register("clear", func(args []string, ctx map[string]interface{}) interface{} {
		return map[string]string{"type": "clear"}
	})

	s.Register("ls", func(args []string, ctx map[string]interface{}) interface{} {
		return map[string]interface{}{"type": "ls", "args": args}
	})

	s.Register("cd", func(args []string, ctx map[string]interface{}) interface{} {
		path := "/home"
		if len(args) > 0 {
			path = args[0]
		}
		return map[string]string{"type": "cd", "path": path}
	})
}

func parseCommandArgs(cmd string) []string {
	var args []string
	var current []byte
	inQuote := false
	quoteChar := byte(0)

	for i := 0; i < len(cmd); i++ {
		c := cmd[i]

		if !inQuote && (c == '"' || c == '\'') {
			inQuote = true
			quoteChar = c
		} else if inQuote && c == quoteChar {
			inQuote = false
		} else if !inQuote && c == ' ' {
			if len(current) > 0 {
				args = append(args, string(current))
				current = nil
			}
		} else {
			current = append(current, c)
		}
	}

	if len(current) > 0 {
		args = append(args, string(current))
	}

	return args
}

func joinLines(lines []string) string {
	result := ""
	for i, line := range lines {
		if i > 0 {
			result += "\r\n"
		}
		result += line
	}
	return result
}

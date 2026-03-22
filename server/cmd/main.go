package main

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"
	"sync"

	"webshellblog/server/internal/application"
	"webshellblog/server/internal/domain"
	"webshellblog/server/internal/infrastructure"
)

/**
 * WebShell Blog Server
 * 采用 DDD 架构重构，支持设计模式和领域模型
 * 
 * @author WebShell Blog
 * @since 2026-03-22
 */

var upgrader = infrastructure.WebSocketHandler

type TerminalServer struct {
	terminalService  *application.TerminalService
	commandService   *application.CommandService
	globalTerminal   *domain.Terminal
	broadcast        chan []byte
	mu               sync.RWMutex
}

func NewTerminalServer() *TerminalServer {
	return &TerminalServer{
		terminalService: application.NewTerminalService(),
		commandService:  application.NewCommandService(),
		globalTerminal:  domain.NewTerminal("global"),
		broadcast:       make(chan []byte, 256),
	}
}

func (s *TerminalServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Handle(w, r)
	if err != nil {
		return
	}

	client := domain.NewClient("client-"+r.RemoteAddr, conn)
	client.SetTerminal(s.globalTerminal)

	go s.writePump(client)
	go s.readPump(client)
}

func (s *TerminalServer) readPump(client *domain.Client) {
	defer func() {
		client.Disconnect()
		conn := client.Conn.(*websocket.Conn)
		conn.Close()
	}()

	for {
		_, message, err := client.Conn.(*websocket.Conn).ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg domain.Message
		if err := json.Unmarshal(message, &msg); err != nil {
			s.globalTerminal.Broadcast(message)
			continue
		}

		switch msg.Type {
		case "command":
			s.executeCommand(client, msg.Content)
		case "resize":
			s.globalTerminal.Resize(msg.Cols, msg.Rows)
		}
	}
}

func (s *TerminalServer) writePump(client *domain.Client) {
	conn := client.Conn.(*websocket.Conn)
	defer func() {
		client.Disconnect()
		conn.Close()
	}()

	for {
		message, ok := <-client.SendChan
		if !ok {
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		n := len(client.SendChan)
		for i := 0; i < n; i++ {
			w.Write([]byte{'\n'})
			w.Write(<-client.SendChan)
		}

		if err := w.Close(); err != nil {
			return
		}
	}
}

func (s *TerminalServer) executeCommand(client *domain.Client, cmd string) {
	log.Printf("Executing command: %s", cmd)

	s.globalTerminal.AddToHistory(cmd)

	switch cmd {
	case "clear":
		msg := domain.Message{Type: "clear"}
		data, _ := json.Marshal(msg)
		s.globalTerminal.Broadcast(data)
		return
	}

	parts := parseCommand(cmd)
	if len(parts) == 0 {
		return
	}

	if parts[0] == "img" || parts[0] == "image" {
		if len(parts) > 1 {
			s.handleImageCommand(client, parts[1])
		}
		return
	}

	command := exec.Command("sh", "-c", cmd)
	command.Stdout = client
	command.Stderr = client

	if err := command.Run(); err != nil {
		client.Send([]byte("Error: " + err.Error() + "\r\n"))
	}
}

func (s *TerminalServer) handleImageCommand(client *domain.Client, url string) {
	data, err := fetchImage(url)
	if err != nil {
		client.Send([]byte("\r\n\x1b[31mFailed to fetch image: " + err.Error() + "\x1b[0m\r\n"))
		return
	}

	msg := domain.Message{
		Type:    "image",
		URL:     url,
		Width:   300,
		Content: base64.StdEncoding.EncodeToString(data),
	}

	jsonData, _ := json.Marshal(msg)
	s.globalTerminal.Broadcast(jsonData)
}

func (c *domain.Client) Write(p []byte) (n int, err error) {
	msg := domain.Message{
		Type:    "output",
		Content: string(p),
	}
	data, _ := json.Marshal(msg)
	c.Send(data)
	return len(p), nil
}

func parseCommand(cmd string) []string {
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

func fetchImage(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func serveStatic(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "./web/index.html")
		return
	}

	path := "./web" + r.URL.Path
	http.ServeFile(w, r, path)
}

func main() {
	addr := flag.String("addr", ":8080", "http service address")
	flag.Parse()

	server := NewTerminalServer()

	http.HandleFunc("/ws", server.handleWebSocket)
	http.HandleFunc("/", serveStatic)

	fmt.Printf("Server starting on %s\n", *addr)
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}

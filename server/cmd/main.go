package main

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"io"
	"log"
	"net/http"
	"os/exec"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	conn   *websocket.Conn
	send   chan []byte
	term   *Terminal
	width  int
	height int
}

type Terminal struct {
	width   int
	height  int
	clients map[*Client]bool
	broadcast chan []byte
	mu      sync.RWMutex
}

func NewTerminal() *Terminal {
	return &Terminal{
		width:    80,
		height:   24,
		clients:  make(map[*Client]bool),
		broadcast: make(chan []byte, 256),
	}
}

func (t *Terminal) Register(client *Client) {
	t.mu.Lock()
	t.clients[client] = true
	t.mu.Unlock()
}

func (t *Terminal) Unregister(client *Client) {
	t.mu.Lock()
	delete(t.clients, client)
	close(client.send)
	t.mu.Unlock()
}

func (t *Terminal) Broadcast(msg []byte) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	for client := range t.clients {
		select {
		case client.send <- msg:
		default:
			close(client.send)
			delete(t.clients, client)
		}
	}
}

func (t *Terminal) Resize(width, height int) {
	t.mu.Lock()
	t.width = width
	t.height = height
	t.mu.Unlock()
}

type Message struct {
	Type    string `json:"type"`
	Content string `json:"content,omitempty"`
	URL     string `json:"url,omitempty"`
	Width   int    `json:"width,omitempty"`
	Height  int    `json:"height,omitempty"`
	Cols    int    `json:"cols,omitempty"`
	Rows    int    `json:"rows,omitempty"`
}

func (c *Client) readPump() {
	defer func() {
		c.term.Unregister(c)
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			c.term.Broadcast(message)
			continue
		}

		switch msg.Type {
		case "command":
			c.executeCommand(msg.Content)
		case "resize":
			c.width = msg.Cols
			c.height = msg.Rows
			c.term.Resize(msg.Cols, msg.Rows)
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()

	for {
		message, ok := <-c.send
		if !ok {
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := c.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		n := len(c.send)
		for i := 0; i < n; i++ {
			w.Write([]byte{'\n'})
			w.Write(<-c.send)
		}

		if err := w.Close(); err != nil {
			return
		}
	}
}

func (c *Client) executeCommand(cmd string) {
	log.Printf("Executing command: %s", cmd)

	args := parseCommand(cmd)
	if len(args) == 0 {
		return
	}

	switch args[0] {
	case "img", "image":
		if len(args) > 1 {
			c.handleImageCommand(args[1])
		}
		return
	case "clear":
		msg := Message{Type: "clear"}
		data, _ := json.Marshal(msg)
		c.term.Broadcast(data)
		return
	}

	command := exec.Command("sh", "-c", cmd)
	command.Stdout = c
	command.Stderr = c

	if err := command.Run(); err != nil {
		c.Write([]byte("Error: " + err.Error() + "\r\n"))
	}
}

func (c *Client) handleImageCommand(url string) {
	data, err := fetchImage(url)
	if err != nil {
		c.Write([]byte("\r\n\x1b[31mFailed to fetch image: " + err.Error() + "\x1b[0m\r\n"))
		return
	}

	msg := Message{
		Type:    "image",
		URL:     url,
		Width:   300,
		Content: base64.StdEncoding.EncodeToString(data),
	}

	jsonData, _ := json.Marshal(msg)
	c.term.Broadcast(jsonData)
}

func (c *Client) Write(p []byte) (n int, err error) {
	msg := Message{
		Type:    "output",
		Content: string(p),
	}
	data, _ := json.Marshal(msg)
	c.term.Broadcast(data)
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

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}

	term := globalTerminal
	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		term:   term,
		width:  80,
		height: 24,
	}

	term.Register(client)

	go client.writePump()
	go client.readPump()
}

func serveStatic(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "./web/index.html")
		return
	}

	path := "./web" + r.URL.Path
	http.ServeFile(w, r, path)
}

var globalTerminal *Terminal

func main() {
	addr := flag.String("addr", ":8080", "http service address")
	flag.Parse()

	globalTerminal = NewTerminal()

	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/", serveStatic)

	log.Printf("Server starting on %s", *addr)
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}

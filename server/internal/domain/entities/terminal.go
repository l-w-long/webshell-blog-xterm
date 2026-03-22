package domain

import (
	"sync"
	"time"
)

// Terminal represents a terminal session - Aggregate Root
// 终端会话聚合根，管理终端状态和客户端连接
type Terminal struct {
	ID        string
	Width     int
	Height    int
	Cwd       string
	History   []string
	Env       map[string]string
	Clients   map[*Client]bool
	mu        sync.RWMutex
	CreatedAt time.Time
}

// NewTerminal creates a new terminal instance
func NewTerminal(id string) *Terminal {
	return &Terminal{
		ID:        id,
		Width:     80,
		Height:    24,
		Cwd:       "/home",
		History:   make([]string, 0, 100),
		Env:       make(map[string]string),
		Clients:   make(map[*Client]bool),
		CreatedAt: time.Now(),
	}
}

// Resize updates terminal dimensions
func (t *Terminal) Resize(width, height int) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Width = width
	t.Height = height
	t.notifyClients()
}

// ChangeDirectory changes current working directory
func (t *Terminal) ChangeDirectory(path string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Cwd = path
}

// AddToHistory adds command to history
func (t *Terminal) AddToHistory(cmd string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.History = append(t.History, cmd)
	if len(t.History) > 100 {
		t.History = t.History[1:]
	}
}

// RegisterClient registers a client to this terminal
func (t *Terminal) RegisterClient(client *Client) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.Clients[client] = true
}

// UnregisterClient removes a client from this terminal
func (t *Terminal) UnregisterClient(client *Client) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.Clients, client)
}

// Broadcast sends message to all connected clients
func (t *Terminal) Broadcast(msg []byte) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	for client := range t.Clients {
		select {
		case client.SendChan <- msg:
		default:
			close(client.SendChan)
			delete(t.Clients, client)
		}
	}
}

func (t *Terminal) notifyClients() {
	for client := range t.Clients {
		client.NotifyResize(t.Width, t.Height)
	}
}

// Client represents a WebSocket client connection - Entity
type Client struct {
	ID          string
	Conn        interface{}
	SendChan    chan []byte
	Terminal    *Terminal
	ConnectedAt time.Time
	LastActive  time.Time
}

// NewClient creates a new client instance
func NewClient(id string, conn interface{}) *Client {
	return &Client{
		ID:          id,
		Conn:        conn,
		SendChan:    make(chan []byte, 256),
		ConnectedAt: time.Now(),
		LastActive:  time.Now(),
	}
}

// SetTerminal associates client with a terminal
func (c *Client) SetTerminal(terminal *Terminal) {
	c.Terminal = terminal
	terminal.RegisterClient(c)
}

// Send sends a message to the client
func (c *Client) Send(msg []byte) {
	select {
	case c.SendChan <- msg:
	default:
	}
}

// NotifyResize notifies the client about terminal resize
func (c *Client) NotifyResize(width, height int) {
	msg := Message{
		Type:   "resize",
		Width:  width,
		Height: height,
	}
	data, _ := JSONMarshal(msg)
	c.Send(data)
}

// UpdateActivity updates last active time
func (c *Client) UpdateActivity() {
	c.LastActive = time.Now()
}

// Disconnect disconnects the client
func (c *Client) Disconnect() {
	if c.Terminal != nil {
		c.Terminal.UnregisterClient(c)
	}
	close(c.SendChan)
}

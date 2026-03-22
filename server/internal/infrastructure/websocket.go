package infrastructure

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

/**
 * WebSocket Handler - WebSocket 处理器
 * 基础设施层，处理网络连接
 */
type WebSocketHandler struct {
	upgrader websocket.Upgrader
}

func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h *WebSocketHandler) Handle(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return nil, err
	}
	return conn, nil
}

/**
 * Image Fetcher - 图片获取器
 * 基础设施层，处理图片请求
 */
type ImageFetcher struct {
	client *http.Client
}

func NewImageFetcher() *ImageFetcher {
	return &ImageFetcher{
		client: &http.Client{},
	}
}

func (f *ImageFetcher) Fetch(url string) ([]byte, error) {
	resp, err := f.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	buf := make([]byte, 0)
	buf = make([]byte, resp.ContentLength)
	_, err = resp.Body.Read(buf)
	return buf, err
}

package domain

import (
	"time"
)

// Article represents a blog article - Entity
type Article struct {
	ID        int
	Title     string
	Content   string
	Category  *Category
	Tags      []string
	Author    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// NewArticle creates a new article
func NewArticle(id int, title, content string) *Article {
	now := time.Now()
	return &Article{
		ID:        id,
		Title:     title,
		Content:   content,
		Tags:      make([]string, 0),
		Author:    "Anonymous",
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// SetCategory sets the article category
func (a *Article) SetCategory(category *Category) {
	a.Category = category
}

// AddTag adds a tag to the article
func (a *Article) AddTag(tag string) {
	for _, t := range a.Tags {
		if t == tag {
			return
		}
	}
	a.Tags = append(a.Tags, tag)
}

// UpdateContent updates article content
func (a *Article) UpdateContent(content string) {
	a.Content = content
	a.UpdatedAt = time.Now()
}

// Category represents article category - Entity
type Category struct {
	ID       string
	Name     string
	ParentID *string
	Icon     string
	Articles []*Article
	Children []*Category
}

// NewCategory creates a new category
func NewCategory(id, name string) *Category {
	return &Category{
		ID:       id,
		Name:     name,
		Icon:     "📁",
		Articles: make([]*Article, 0),
		Children: make([]*Category, 0),
	}
}

// SetIcon sets category icon
func (c *Category) SetIcon(icon string) {
	c.Icon = icon
}

// AddArticle adds an article to this category
func (c *Category) AddArticle(article *Article) {
	article.SetCategory(c)
	c.Articles = append(c.Articles, article)
}

// AddChild adds a child category
func (c *Category) AddChild(child *Category) {
	child.ParentID = &c.ID
	c.Children = append(c.Children, child)
}

// CommandValue represents a command value object
type CommandValue struct {
	Name        string
	Description string
	Handler     CommandHandler
	Completions  []string
	Aliases     []string
}

// CommandHandler is the function type for command execution
type CommandHandler func(args []string, context map[string]interface{}) interface{}

// ThemeValue represents a theme value object
type ThemeValue struct {
	ID       string
	Name     string
	Colors   map[string]string
	Font     map[string]string
	IsDefault bool
}

// GetColor returns color by key
func (t *ThemeValue) GetColor(key string) string {
	if color, ok := t.Colors[key]; ok {
		return color
	}
	return "#ffffff"
}

// Message represents a WebSocket message value object
type Message struct {
	Type      string `json:"type"`
	Content   string `json:"content,omitempty"`
	URL       string `json:"url,omitempty"`
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	Cols      int    `json:"cols,omitempty"`
	Rows      int    `json:"rows,omitempty"`
	Payload   map[string]interface{} `json:"payload,omitempty"`
}

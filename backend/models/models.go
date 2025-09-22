package models

import (
	"time"
)

type Admin struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Username string `json:"username" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"` // "-" excludes from JSON
}

type Category struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Slug         string    `json:"slug" gorm:"unique;not null"`
	Description  string    `json:"description"`
	ThumbnailURL string    `json:"thumbnail_url"`
	ParentID     *uint     `json:"parent_id" gorm:"default:null"`
	Parent       *Category `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children     []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Level        int       `json:"level" gorm:"default:0"`
	OrderIndex   int       `json:"order_index" gorm:"default:0"`
	DisplayOrder int       `json:"display_order" gorm:"default:0"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Post struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Title      string    `json:"title" gorm:"not null"`
	Content    string    `json:"content" gorm:"type:text"`
	Summary    string    `json:"summary"`
	ImageURL   string    `json:"image_url"`
	CategoryID uint      `json:"category_id" gorm:"not null"`
	Category   Category  `json:"category" gorm:"foreignKey:CategoryID"`
	Published  bool      `json:"published" gorm:"default:true"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Article struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	Title            string    `json:"title" gorm:"not null"`
	Content          string    `json:"content" gorm:"type:text;not null"`
	Summary          string    `json:"summary"`
	FeaturedImageURL string    `json:"featured_image_url"`
	CategoryID       uint      `json:"category_id" gorm:"not null"`
	Category         Category  `json:"category" gorm:"foreignKey:CategoryID"`
	Published        bool      `json:"published" gorm:"default:false"`
	Tags             string    `json:"tags"`
	MetaTitle        string    `json:"meta_title"`
	MetaDescription  string    `json:"meta_description"`
	Slug             string    `json:"slug" gorm:"unique;not null"`
	AuthorID         uint      `json:"author_id"`
	Author           Admin     `json:"author" gorm:"foreignKey:AuthorID"`
	ViewCount        int       `json:"view_count" gorm:"default:0"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	Admin Admin  `json:"admin"`
}

type CategoryOrderUpdate struct {
	ID           uint `json:"id" binding:"required"`
	DisplayOrder int  `json:"display_order" binding:"required"`
}

type CategoryOrderRequest struct {
	Categories []CategoryOrderUpdate `json:"categories" binding:"required"`
}

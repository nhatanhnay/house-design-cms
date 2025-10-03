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
	CategoryType string    `json:"category_type" gorm:"default:'parent'"` // 'parent' or 'regular'
	ParentID     *uint     `json:"parent_id" gorm:"default:null"`
	Parent       *Category `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children     []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Level        int       `json:"level" gorm:"default:0"`
	OrderIndex   int       `json:"order_index" gorm:"default:0"`
	DisplayOrder int       `json:"display_order" gorm:"default:0"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	// SEO Fields
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	MetaKeywords    string `json:"meta_keywords"`
	OGImageURL      string `json:"og_image_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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
	Views      int       `json:"views" gorm:"default:0"`
	// SEO Fields
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	FocusKeywords   string `json:"focus_keywords"`
	OGImageURL      string `json:"og_image_url"`
	Slug            string `json:"slug"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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

type HomeContent struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	HeroTitle             string    `json:"hero_title" gorm:"not null"`
	HeroDescription       string    `json:"hero_description" gorm:"type:text"`
	HeroStat1Number       string    `json:"hero_stat1_number"`
	HeroStat1Label        string    `json:"hero_stat1_label"`
	HeroStat2Number       string    `json:"hero_stat2_number"`
	HeroStat2Label        string    `json:"hero_stat2_label"`
	FeaturesTitle         string    `json:"features_title"`
	FeaturesDescription   string    `json:"features_description" gorm:"type:text"`
	FeaturesLogoURL       string    `json:"features_logo_url"`
	Feature1Icon          string    `json:"feature1_icon"`
	Feature1Title         string    `json:"feature1_title"`
	Feature1Description   string    `json:"feature1_description" gorm:"type:text"`
	Feature2Icon          string    `json:"feature2_icon"`
	Feature2Title         string    `json:"feature2_title"`
	Feature2Description   string    `json:"feature2_description" gorm:"type:text"`
	Feature3Icon          string    `json:"feature3_icon"`
	Feature3Title         string    `json:"feature3_title"`
	Feature3Description   string    `json:"feature3_description" gorm:"type:text"`
	Feature4Icon          string    `json:"feature4_icon"`
	Feature4Title         string    `json:"feature4_title"`
	Feature4Description   string    `json:"feature4_description" gorm:"type:text"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type FooterContent struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	CompanyName  string    `json:"company_name" gorm:"not null"`
	Address      string    `json:"address" gorm:"type:text"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	FacebookURL  string    `json:"facebook_url"`
	InstagramURL string    `json:"instagram_url"`
	YoutubeURL   string    `json:"youtube_url"`
	LinkedinURL  string    `json:"linkedin_url"`
	CopyrightText string   `json:"copyright_text"`
	Description   string   `json:"description" gorm:"type:text"`
	Services      string   `json:"services" gorm:"type:text"`
	SocialMedia   string   `json:"social_media" gorm:"type:text"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type GlobalSEOSettings struct {
	ID                      uint      `json:"id" gorm:"primaryKey"`
	SiteName                string    `json:"site_name" gorm:"not null"`
	DefaultMetaTitle        string    `json:"default_meta_title" gorm:"not null"`
	DefaultMetaDescription  string    `json:"default_meta_description" gorm:"type:text;not null"`
	DefaultOGImageURL       string    `json:"default_og_image_url"`
	GoogleAnalyticsID       string    `json:"google_analytics_id"`
	GoogleSearchConsoleID   string    `json:"google_search_console_id"`
	FacebookAppID           string    `json:"facebook_app_id"`
	TwitterHandle           string    `json:"twitter_handle"`
	CompanyName             string    `json:"company_name" gorm:"not null"`
	CompanyDescription      string    `json:"company_description" gorm:"type:text"`
	CompanyAddress          string    `json:"company_address" gorm:"type:text"`
	CompanyPhone            string    `json:"company_phone"`
	CompanyEmail            string    `json:"company_email"`
	CompanyLogoURL          string    `json:"company_logo_url"`
	BusinessHours           string    `json:"business_hours"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

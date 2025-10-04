package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"house-design-backend/database"
	"house-design-backend/middleware"
	"house-design-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Helper function to generate dynamic base URL
func getBaseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}

	// Check for X-Forwarded-Proto header (common in reverse proxy setups)
	if proto := c.GetHeader("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}

	host := c.Request.Host

	// Check for X-Forwarded-Host header (common in reverse proxy setups)
	if forwardedHost := c.GetHeader("X-Forwarded-Host"); forwardedHost != "" {
		host = forwardedHost
	}

	return fmt.Sprintf("%s://%s", scheme, host)
}

func Login(c *gin.Context) {
	var loginReq models.LoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var admin models.Admin
	err := database.DB.QueryRow("SELECT id, username, password FROM admin WHERE username = $1",
		loginReq.Username).Scan(&admin.ID, &admin.Username, &admin.Password)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(loginReq.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(admin.ID, admin.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: token,
		Admin: models.Admin{ID: admin.ID, Username: admin.Username},
	})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Categories handlers
func GetCategories(c *gin.Context) {
	rows, err := database.DB.Query(`SELECT id, name, slug, description, COALESCE(thumbnail_url, '') as thumbnail_url, COALESCE(category_type, 'parent') as category_type, parent_id, level, order_index, display_order, is_active,
		COALESCE(meta_title, '') as meta_title, COALESCE(meta_description, '') as meta_description, COALESCE(meta_keywords, '') as meta_keywords, COALESCE(og_image_url, '') as og_image_url,
		created_at, updated_at
		FROM categories ORDER BY category_type ASC, level ASC, display_order ASC, order_index ASC, created_at ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	defer rows.Close()

	var allCategories []models.Category
	categoryMap := make(map[uint]*models.Category)

	for rows.Next() {
		var category models.Category
		var parentID sql.NullInt64
		err := rows.Scan(&category.ID, &category.Name, &category.Slug, &category.Description, &category.ThumbnailURL,
			&category.CategoryType, &parentID, &category.Level, &category.OrderIndex, &category.DisplayOrder, &category.IsActive,
			&category.MetaTitle, &category.MetaDescription, &category.MetaKeywords, &category.OGImageURL,
			&category.CreatedAt, &category.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan category"})
			return
		}

		if parentID.Valid {
			parentIDUint := uint(parentID.Int64)
			category.ParentID = &parentIDUint
		}

		// Initialize Children slice
		category.Children = []models.Category{}

		allCategories = append(allCategories, category)
		categoryMap[category.ID] = &allCategories[len(allCategories)-1]
	}

	// Build the hierarchy - attach children to their parents
	for i := range allCategories {
		cat := &allCategories[i]
		if cat.ParentID != nil {
			// This is a child category, attach to parent
			if parent, exists := categoryMap[*cat.ParentID]; exists {
				parent.Children = append(parent.Children, *cat)
			}
		}
	}

	c.JSON(http.StatusOK, allCategories)
}

func CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug logging
	fmt.Printf("Creating category - Name: %s, Slug: %s, ParentID: %v\n", category.Name, category.Slug, category.ParentID)

	// Generate slug if not provided
	if category.Slug == "" {
		category.Slug = generateSlug(category.Name)
	}

	// Calculate level based on parent
	if category.ParentID != nil {
		// Get parent level and slug for subcategory slug generation
		var parentLevel int
		var parentSlug string
		err := database.DB.QueryRow("SELECT level, slug FROM categories WHERE id = $1", *category.ParentID).Scan(&parentLevel, &parentSlug)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent category"})
			return
		}
		category.Level = parentLevel + 1

		// Make slug unique for subcategories by prefixing with parent slug (only if not already prefixed)
		if !strings.HasPrefix(category.Slug, parentSlug+"-") {
			category.Slug = parentSlug + "-" + category.Slug
		}
	} else {
		category.Level = 0
	}

	// Check if slug already exists (for new categories only)
	var existingCount int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE slug = $1", category.Slug).Scan(&existingCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check slug uniqueness"})
		return
	}

	// If slug exists, generate a unique one by appending number
	if existingCount > 0 {
		fmt.Printf("Slug conflict detected for: %s, generating unique slug\n", category.Slug)
		originalSlug := category.Slug
		counter := 1
		for {
			category.Slug = fmt.Sprintf("%s-%d", originalSlug, counter)
			err := database.DB.QueryRow("SELECT COUNT(*) FROM categories WHERE slug = $1", category.Slug).Scan(&existingCount)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check slug uniqueness"})
				return
			}
			if existingCount == 0 {
				break
			}
			counter++
		}
		fmt.Printf("Final unique slug: %s\n", category.Slug)
	} else {
		fmt.Printf("No slug conflict, using: %s\n", category.Slug)
	}

	// Set default values
	if category.OrderIndex == 0 {
		// Get next order index for this level
		var maxOrder int
		if category.ParentID != nil {
			database.DB.QueryRow("SELECT COALESCE(MAX(order_index), 0) FROM categories WHERE parent_id = $1", *category.ParentID).Scan(&maxOrder)
		} else {
			database.DB.QueryRow("SELECT COALESCE(MAX(order_index), 0) FROM categories WHERE parent_id IS NULL").Scan(&maxOrder)
		}
		category.OrderIndex = maxOrder + 1
	}

	var newID uint
	err = database.DB.QueryRow(`INSERT INTO categories (name, slug, description, thumbnail_url, category_type, parent_id, level, order_index, is_active, meta_title, meta_description, meta_keywords, og_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
		category.Name, category.Slug, category.Description, category.ThumbnailURL, category.CategoryType, category.ParentID, category.Level, category.OrderIndex, category.IsActive, category.MetaTitle, category.MetaDescription, category.MetaKeywords, category.OGImageURL).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	category.ID = newID

	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug log to check received data
	fmt.Printf("📦 Updating category ID: %s with data: %+v\n", id, category)
	fmt.Printf("📝 SEO Fields Received: meta_title='%s', meta_description='%s', meta_keywords='%s', og_image_url='%s'\n",
		category.MetaTitle, category.MetaDescription, category.MetaKeywords, category.OGImageURL)

	// Get existing category to handle partial updates
	var existingCategory models.Category
	err := database.DB.QueryRow(`SELECT name, slug, description, COALESCE(thumbnail_url, '') as thumbnail_url,
		COALESCE(category_type, 'parent') as category_type, parent_id, level, order_index, is_active,
		COALESCE(meta_title, '') as meta_title, COALESCE(meta_description, '') as meta_description,
		COALESCE(meta_keywords, '') as meta_keywords, COALESCE(og_image_url, '') as og_image_url
		FROM categories WHERE id = $1`, id).Scan(
		&existingCategory.Name, &existingCategory.Slug, &existingCategory.Description,
		&existingCategory.ThumbnailURL, &existingCategory.CategoryType, &existingCategory.ParentID,
		&existingCategory.Level, &existingCategory.OrderIndex, &existingCategory.IsActive,
		&existingCategory.MetaTitle, &existingCategory.MetaDescription,
		&existingCategory.MetaKeywords, &existingCategory.OGImageURL)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Update fields - always update these core fields from request
	if category.Name != "" {
		existingCategory.Name = category.Name
	}
	if category.Slug != "" {
		existingCategory.Slug = category.Slug
	}
	// Always update these fields even if empty (user might want to clear them)
	existingCategory.Description = category.Description
	existingCategory.ThumbnailURL = category.ThumbnailURL

	// Always update category_type - this is critical for the fix
	if category.CategoryType != "" {
		existingCategory.CategoryType = category.CategoryType
		fmt.Printf("Updated CategoryType to: %s\n", category.CategoryType)
	}

	// Always update is_active as it can be false
	existingCategory.IsActive = category.IsActive

	// Update SEO fields (allow empty values to clear fields)
	existingCategory.MetaTitle = category.MetaTitle
	existingCategory.MetaDescription = category.MetaDescription
	existingCategory.MetaKeywords = category.MetaKeywords
	existingCategory.OGImageURL = category.OGImageURL

	// Handle parent_id updates - check if it's being set in the request
	// Note: We need to distinguish between nil (not provided) and explicitly null
	if category.ParentID != nil {
		// Setting a parent
		var parentLevel int
		err := database.DB.QueryRow("SELECT level FROM categories WHERE id = $1", *category.ParentID).Scan(&parentLevel)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent category"})
			return
		}
		existingCategory.Level = parentLevel + 1
		existingCategory.ParentID = category.ParentID
		fmt.Printf("Setting parent_id to: %v, level: %d\n", *category.ParentID, existingCategory.Level)
	}

	// Force business rules: Regular categories cannot have parents
	if existingCategory.CategoryType == "regular" {
		existingCategory.Level = 0
		existingCategory.ParentID = nil
		fmt.Printf("Forcing regular category to have no parent\n")
	}

	// If no parent is set and it's a parent category, make it a main category
	if existingCategory.ParentID == nil && existingCategory.CategoryType == "parent" {
		existingCategory.Level = 0
		fmt.Printf("Setting parent category as main category (level 0)\n")
	}

	fmt.Printf("Final category data before update: %+v\n", existingCategory)
	fmt.Printf("SEO fields to update: meta_title='%s', meta_description='%s', meta_keywords='%s', og_image_url='%s'\n",
		existingCategory.MetaTitle, existingCategory.MetaDescription, existingCategory.MetaKeywords, existingCategory.OGImageURL)

	result, err := database.DB.Exec(`UPDATE categories SET name = $2, slug = $3, description = $4, thumbnail_url = $5, category_type = $6, parent_id = $7,
		level = $8, order_index = $9, is_active = $10, meta_title = $11, meta_description = $12, meta_keywords = $13, og_image_url = $14, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, existingCategory.Name, existingCategory.Slug, existingCategory.Description, existingCategory.ThumbnailURL,
		existingCategory.CategoryType, existingCategory.ParentID, existingCategory.Level, existingCategory.OrderIndex, existingCategory.IsActive,
		existingCategory.MetaTitle, existingCategory.MetaDescription, existingCategory.MetaKeywords, existingCategory.OGImageURL)
	if err != nil {
		fmt.Printf("SQL UPDATE ERROR: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("UPDATE completed, rows affected: %d\n", rowsAffected)

	categoryID, _ := strconv.ParseUint(id, 10, 32)
	existingCategory.ID = uint(categoryID)

	fmt.Printf("Returning updated category: %+v\n", existingCategory)
	c.JSON(http.StatusOK, existingCategory)
}

func DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	_, err := database.DB.Exec("DELETE FROM categories WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

func UpdateCategoryOrder(c *gin.Context) {
	var req models.CategoryOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Begin transaction
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction"})
		return
	}
	defer tx.Rollback()

	// Update display order for each category
	for _, categoryUpdate := range req.Categories {
		_, err = tx.Exec(`UPDATE categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP
						  WHERE id = $2`, categoryUpdate.DisplayOrder, categoryUpdate.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category order"})
			return
		}
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category order updated successfully"})
}

// Posts handlers
func GetPosts(c *gin.Context) {
	categoryID := c.Query("category")

	query := `SELECT p.id, p.title, p.content, p.summary, p.image_url, p.category_id, 
			  p.published, p.created_at, p.updated_at, 
			  COALESCE(p.meta_title, '') as meta_title, COALESCE(p.meta_description, '') as meta_description,
			  COALESCE(p.focus_keywords, '') as focus_keywords, COALESCE(p.og_image_url, '') as og_image_url, COALESCE(p.slug, '') as slug,
			  c.name, c.slug, c.description
			  FROM posts p 
			  JOIN categories c ON p.category_id = c.id`

	var rows *sql.Rows
	var err error

	if categoryID != "" {
		query += " WHERE p.category_id = $1 ORDER BY p.created_at DESC"
		rows, err = database.DB.Query(query, categoryID)
	} else {
		query += " ORDER BY p.created_at DESC"
		rows, err = database.DB.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var category models.Category

		err := rows.Scan(&post.ID, &post.Title, &post.Content, &post.Summary, &post.ImageURL,
			&post.CategoryID, &post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.MetaTitle, &post.MetaDescription, &post.FocusKeywords, &post.OGImageURL, &post.Slug,
			&category.Name, &category.Slug, &category.Description)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan post"})
			return
		}

		category.ID = post.CategoryID
		post.Category = category
		posts = append(posts, post)
	}

	c.JSON(http.StatusOK, posts)
}

func GetPost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var post models.Post
	err = database.DB.QueryRow(`SELECT id, title, content, summary, image_url, category_id, published, 
		COALESCE(meta_title, '') as meta_title, COALESCE(meta_description, '') as meta_description,
		COALESCE(focus_keywords, '') as focus_keywords, COALESCE(og_image_url, '') as og_image_url, COALESCE(slug, '') as slug,
		created_at, updated_at
		FROM posts WHERE id = $1`, id).Scan(
		&post.ID, &post.Title, &post.Content, &post.Summary, &post.ImageURL, &post.CategoryID,
		&post.Published, &post.MetaTitle, &post.MetaDescription, &post.FocusKeywords, &post.OGImageURL, &post.Slug,
		&post.CreatedAt, &post.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch post"})
		return
	}

	// Get category information
	var category models.Category
	err = database.DB.QueryRow(`SELECT id, name, slug, description, created_at, updated_at
		FROM categories WHERE id = $1`, post.CategoryID).Scan(
		&category.ID, &category.Name, &category.Slug, &category.Description,
		&category.CreatedAt, &category.UpdatedAt)

	if err == nil {
		category.ID = post.CategoryID
		post.Category = category
	}

	c.JSON(http.StatusOK, post)
}

func CreatePost(c *gin.Context) {
	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var newID uint
	err := database.DB.QueryRow(`INSERT INTO posts (title, content, summary, image_url, category_id, published, views, meta_title, meta_description, focus_keywords, og_image_url, slug)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
		post.Title, post.Content, post.Summary, post.ImageURL, post.CategoryID, post.Published, post.Views, post.MetaTitle, post.MetaDescription, post.FocusKeywords, post.OGImageURL, post.Slug).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	post.ID = newID

	c.JSON(http.StatusCreated, post)
}

func UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := database.DB.Exec(`UPDATE posts SET title = $2, content = $3, summary = $4, image_url = $5,
		category_id = $6, published = $7, views = $8, meta_title = $9, meta_description = $10, focus_keywords = $11,
		og_image_url = $12, slug = $13, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, post.Title, post.Content, post.Summary, post.ImageURL, post.CategoryID, post.Published,
		post.Views, post.MetaTitle, post.MetaDescription, post.FocusKeywords, post.OGImageURL, post.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	postID, _ := strconv.ParseUint(id, 10, 32)
	post.ID = uint(postID)

	c.JSON(http.StatusOK, post)
}

func DeletePost(c *gin.Context) {
	id := c.Param("id")

	_, err := database.DB.Exec("DELETE FROM posts WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// UploadImage handles image upload for CKEditor
func UploadImage(c *gin.Context) {
	fmt.Println("Upload request received")

	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		fmt.Println("Unauthorized upload attempt - no user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fmt.Printf("Authenticated user ID: %d\n", userID)

	// Parse the multipart form
	file, header, err := c.Request.FormFile("upload")
	if err != nil {
		fmt.Printf("Error parsing form file: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	fmt.Printf("File received: %s, Size: %d, Type: %s\n", header.Filename, header.Size, header.Header.Get("Content-Type"))

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only images are allowed."})
		return
	}

	// Validate file size (5MB max)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 5MB."})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "./data/uploads/images"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filepath := filepath.Join(uploadsDir, filename)

	// Create the file
	dst, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL in CKEditor format
	baseURL := getBaseURL(c)
	imageURL := fmt.Sprintf("%s/data/uploads/images/%s", baseURL, filename)

	// Debug logging tiếng Việt cho category thumbnails
	fmt.Printf("✅ THUMBNAIL CATEGORY UPLOAD THÀNH CÔNG:\n")
	fmt.Printf("   📁 Thư mục lưu: %s\n", uploadsDir)
	fmt.Printf("   📄 Tên file: %s\n", filename)
	fmt.Printf("   🌐 Base URL: %s\n", baseURL)
	fmt.Printf("   🔗 URL trả về: %s\n", imageURL)

	c.JSON(http.StatusOK, gin.H{
		"url": imageURL,
	})
}

// UploadVideo handles video upload
func UploadVideo(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse the multipart form
	file, header, err := c.Request.FormFile("upload")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := map[string]bool{
		"video/mp4":  true,
		"video/avi":  true,
		"video/mov":  true,
		"video/wmv":  true,
		"video/webm": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only videos are allowed."})
		return
	}

	// Validate file size (50MB max for videos)
	const maxSize = 50 * 1024 * 1024 // 50MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 50MB."})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "./data/uploads/videos"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filepath := filepath.Join(uploadsDir, filename)

	// Create the file
	dst, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL
	baseURL := getBaseURL(c)
	videoURL := fmt.Sprintf("%s/data/uploads/videos/%s", baseURL, filename)
	c.JSON(http.StatusOK, gin.H{
		"url": videoURL,
	})
}

// Homepage handlers
func GetHomepageImages(c *gin.Context) {
	// Get the current working directory and use absolute paths
	workDir, _ := os.Getwd()
	imagesDir := filepath.Join(workDir, "homepage", "images")
	videoDir := filepath.Join(workDir, "homepage", "videos")

	// Tạo thư mục nếu chưa tồn tại
	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục images"})
		return
	}
	if err := os.MkdirAll(videoDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục videos"})
		return
	}

	// Lấy base URL một lần duy nhất
	baseURL := getBaseURL(c)

	// Đọc thư mục images
	imageFiles, err := os.ReadDir(imagesDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể đọc thư mục images"})
		return
	}

	// Đọc thư mục videos
	videoFiles, err := os.ReadDir(videoDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể đọc thư mục videos"})
		return
	}

	var images []string
	var videos []string

	// Xử lý file images
	for _, file := range imageFiles {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
				images = append(images, fmt.Sprintf("%s/homepage/images/%s", baseURL, file.Name()))
			}
		}
	}

	// Xử lý file videos
	for _, file := range videoFiles {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".mp4" || ext == ".avi" || ext == ".mov" || ext == ".wmv" || ext == ".webm" {
				videos = append(videos, fmt.Sprintf("%s/homepage/videos/%s", baseURL, file.Name()))
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"images": images,
		"videos": videos,
	})
}

func UploadHomepageImage(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse the multipart form
	file, header, err := c.Request.FormFile("upload")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only images are allowed."})
		return
	}

	// Validate file size (5MB max)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 5MB."})
		return
	}

	// Create homepage images directory if it doesn't exist
	// Get the current working directory and use absolute path
	workDir, _ := os.Getwd()
	uploadsDir := filepath.Join(workDir, "homepage", "images")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadsDir, filename)

	// Create the file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL
	baseURL := getBaseURL(c)
	imageURL := fmt.Sprintf("%s/homepage/images/%s", baseURL, filename)

	// Debug logging tiếng Việt
	fmt.Printf("✅ UPLOAD THÀNH CÔNG:\n")
	fmt.Printf("   📁 Thư mục lưu: %s\n", uploadsDir)
	fmt.Printf("   📄 Tên file: %s\n", filename)
	fmt.Printf("   🌐 Base URL: %s\n", baseURL)
	fmt.Printf("   🔗 URL trả về: %s\n", imageURL)

	c.JSON(http.StatusOK, gin.H{
		"url":      imageURL,
		"filename": filename,
	})
}

func UploadHomepageVideo(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse the multipart form
	file, header, err := c.Request.FormFile("upload")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := map[string]bool{
		"video/mp4":  true,
		"video/avi":  true,
		"video/mov":  true,
		"video/wmv":  true,
		"video/webm": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only videos are allowed."})
		return
	}

	// Validate file size (50MB max for videos)
	const maxSize = 50 * 1024 * 1024 // 50MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 50MB."})
		return
	}

	// Create homepage videos directory if it doesn't exist
	// Get the current working directory and use absolute path
	workDir, _ := os.Getwd()
	uploadsDir := filepath.Join(workDir, "homepage", "videos")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadsDir, filename)

	// Create the file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL
	baseURL := getBaseURL(c)
	videoURL := fmt.Sprintf("%s/homepage/videos/%s", baseURL, filename)
	c.JSON(http.StatusOK, gin.H{
		"url":      videoURL,
		"filename": filename,
	})
}

func DeleteHomepageMedia(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	filename := c.Param("filename")
	mediaType := c.Param("type") // "images" or "videos"

	if mediaType != "images" && mediaType != "videos" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media type. Must be 'images' or 'videos'"})
		return
	}

	// Get the current working directory and use absolute path
	workDir, _ := os.Getwd()
	filePath := filepath.Join(workDir, "homepage", mediaType, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

func ReplaceHomepageMedia(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	oldFilename := c.Param("filename")
	mediaType := c.Param("type") // "images" or "videos"

	if mediaType != "images" && mediaType != "videos" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media type. Must be 'images' or 'videos'"})
		return
	}

	// Parse the multipart form for new file
	file, header, err := c.Request.FormFile("upload")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type based on media type
	var allowedTypes map[string]bool
	var maxSize int64

	if mediaType == "images" {
		allowedTypes = map[string]bool{
			"image/jpeg": true,
			"image/jpg":  true,
			"image/png":  true,
			"image/gif":  true,
			"image/webp": true,
		}
		maxSize = 5 * 1024 * 1024 // 5MB
	} else {
		allowedTypes = map[string]bool{
			"video/mp4":  true,
			"video/avi":  true,
			"video/mov":  true,
			"video/wmv":  true,
			"video/webm": true,
		}
		maxSize = 50 * 1024 * 1024 // 50MB
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type for " + mediaType})
		return
	}

	// Validate file size
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large"})
		return
	}

	// Get the current working directory and use absolute path
	workDir, _ := os.Getwd()
	oldFilePath := filepath.Join(workDir, "homepage", mediaType, oldFilename)

	// Check if old file exists
	if _, err := os.Stat(oldFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Original file not found"})
		return
	}

	// Create the file (overwrite the old one)
	dst, err := os.Create(oldFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to replace file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL
	baseURL := getBaseURL(c)
	mediaURL := fmt.Sprintf("%s/homepage/%s/%s", baseURL, mediaType, oldFilename)
	c.JSON(http.StatusOK, gin.H{
		"url":      mediaURL,
		"filename": oldFilename,
		"message":  "File replaced successfully",
	})
}

// Helper function to generate slug from title
func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "'", "")
	slug = strings.ReplaceAll(slug, "\"", "")
	slug = strings.ReplaceAll(slug, ".", "")
	slug = strings.ReplaceAll(slug, ",", "")
	slug = strings.ReplaceAll(slug, "!", "")
	slug = strings.ReplaceAll(slug, "?", "")
	// Remove any non-alphanumeric characters except hyphens
	var result strings.Builder
	for _, char := range slug {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			result.WriteRune(char)
		}
	}
	return result.String()
}

// Home Content handlers
func GetHomeContent(c *gin.Context) {
	var homeContent models.HomeContent

	// Get the first (and should be only) home content record
	err := database.DB.QueryRow(`
		SELECT id, hero_title, hero_description, hero_stat1_number, hero_stat1_label,
		       hero_stat2_number, hero_stat2_label,
		       COALESCE(features_title, '') as features_title,
		       COALESCE(features_description, '') as features_description,
		       COALESCE(features_logo_url, '') as features_logo_url,
		       COALESCE(feature1_icon, '') as feature1_icon,
		       COALESCE(feature1_title, '') as feature1_title,
		       COALESCE(feature1_description, '') as feature1_description,
		       COALESCE(feature2_icon, '') as feature2_icon,
		       COALESCE(feature2_title, '') as feature2_title,
		       COALESCE(feature2_description, '') as feature2_description,
		       COALESCE(feature3_icon, '') as feature3_icon,
		       COALESCE(feature3_title, '') as feature3_title,
		       COALESCE(feature3_description, '') as feature3_description,
		       COALESCE(feature4_icon, '') as feature4_icon,
		       COALESCE(feature4_title, '') as feature4_title,
		       COALESCE(feature4_description, '') as feature4_description,
		       created_at, updated_at
		FROM home_content
		ORDER BY id LIMIT 1
	`).Scan(
		&homeContent.ID,
		&homeContent.HeroTitle,
		&homeContent.HeroDescription,
		&homeContent.HeroStat1Number,
		&homeContent.HeroStat1Label,
		&homeContent.HeroStat2Number,
		&homeContent.HeroStat2Label,
		&homeContent.FeaturesTitle,
		&homeContent.FeaturesDescription,
		&homeContent.FeaturesLogoURL,
		&homeContent.Feature1Icon,
		&homeContent.Feature1Title,
		&homeContent.Feature1Description,
		&homeContent.Feature2Icon,
		&homeContent.Feature2Title,
		&homeContent.Feature2Description,
		&homeContent.Feature3Icon,
		&homeContent.Feature3Title,
		&homeContent.Feature3Description,
		&homeContent.Feature4Icon,
		&homeContent.Feature4Title,
		&homeContent.Feature4Description,
		&homeContent.CreatedAt,
		&homeContent.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Home content not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch home content"})
		}
		return
	}

	c.JSON(http.StatusOK, homeContent)
}

func UpdateHomeContent(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var updateData models.HomeContent
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the home content (should be only one record)
	_, err := database.DB.Exec(`
		UPDATE home_content
		SET hero_title = $1, hero_description = $2, hero_stat1_number = $3,
		    hero_stat1_label = $4, hero_stat2_number = $5, hero_stat2_label = $6,
		    features_title = $7, features_description = $8, features_logo_url = $9,
		    feature1_icon = $10, feature1_title = $11, feature1_description = $12,
		    feature2_icon = $13, feature2_title = $14, feature2_description = $15,
		    feature3_icon = $16, feature3_title = $17, feature3_description = $18,
		    feature4_icon = $19, feature4_title = $20, feature4_description = $21,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = (SELECT id FROM home_content ORDER BY id LIMIT 1)
	`,
		updateData.HeroTitle,
		updateData.HeroDescription,
		updateData.HeroStat1Number,
		updateData.HeroStat1Label,
		updateData.HeroStat2Number,
		updateData.HeroStat2Label,
		updateData.FeaturesTitle,
		updateData.FeaturesDescription,
		updateData.FeaturesLogoURL,
		updateData.Feature1Icon,
		updateData.Feature1Title,
		updateData.Feature1Description,
		updateData.Feature2Icon,
		updateData.Feature2Title,
		updateData.Feature2Description,
		updateData.Feature3Icon,
		updateData.Feature3Title,
		updateData.Feature3Description,
		updateData.Feature4Icon,
		updateData.Feature4Title,
		updateData.Feature4Description,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update home content"})
		return
	}

	// Return the updated content
	GetHomeContent(c)
}

// UploadSvgIcon handles SVG icon uploads for the icon selector
func UploadSvgIcon(c *gin.Context) {
	fmt.Println("SVG icon upload request received")

	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		fmt.Println("Unauthorized upload attempt - no user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fmt.Printf("Authenticated user ID: %d\n", userID)

	// Parse the multipart form
	file, header, err := c.Request.FormFile("svg")
	if err != nil {
		fmt.Printf("Error parsing form file: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	fmt.Printf("SVG File received: %s, Size: %d, Type: %s\n", header.Filename, header.Size, header.Header.Get("Content-Type"))

	// Validate file type - only SVG allowed
	contentType := header.Header.Get("Content-Type")
	if contentType != "image/svg+xml" && !strings.HasSuffix(header.Filename, ".svg") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only SVG files are allowed."})
		return
	}

	// Validate file size (1MB max for SVG)
	const maxSize = 1 * 1024 * 1024 // 1MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 1MB."})
		return
	}

	// Create uploads directory for SVG icons
	uploadsDir := "./data/uploads/svg-icons"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadsDir, filename)

	// Create the file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Read SVG content for preview
	svgContent, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("Warning: Could not read SVG content: %v\n", err)
		svgContent = []byte("")
	}

	// Return the URL and SVG content
	baseURL := getBaseURL(c)
	iconURL := fmt.Sprintf("%s/data/uploads/svg-icons/%s", baseURL, filename)

	// Debug logging
	fmt.Printf("✅ SVG ICON UPLOAD SUCCESSFUL:\n")
	fmt.Printf("   📁 Save directory: %s\n", uploadsDir)
	fmt.Printf("   📄 File name: %s\n", filename)
	fmt.Printf("   🌐 Base URL: %s\n", baseURL)
	fmt.Printf("   🔗 URL returned: %s\n", iconURL)

	c.JSON(http.StatusOK, gin.H{
		"url":  iconURL,
		"svg":  string(svgContent),
		"name": strings.TrimSuffix(header.Filename, ext),
	})
}

// SocialMediaItem represents a single social media entry
type SocialMediaItem struct {
	Name string `json:"name"`
	URL  string `json:"url"`
	Icon string `json:"icon"`
}

// FooterContentResponse represents the API response structure with services as array
type FooterContentResponse struct {
	ID            uint              `json:"id"`
	CompanyName   string            `json:"company_name"`
	Address       string            `json:"address"`
	Phone         string            `json:"phone"`
	Email         string            `json:"email"`
	FacebookURL   string            `json:"facebook_url"`
	InstagramURL  string            `json:"instagram_url"`
	YoutubeURL    string            `json:"youtube_url"`
	LinkedinURL   string            `json:"linkedin_url"`
	CopyrightText string            `json:"copyright_text"`
	Description   string            `json:"description"`
	Services      []string          `json:"services"`
	SocialMedia   []SocialMediaItem `json:"social_media"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// Footer Content handlers
func GetFooterContent(c *gin.Context) {
	var footerContent models.FooterContent

	// Get the first (and should be only) footer content record
	err := database.DB.QueryRow(`
		SELECT id, company_name, address, phone, email,
		       COALESCE(facebook_url, '') as facebook_url,
		       COALESCE(instagram_url, '') as instagram_url,
		       COALESCE(youtube_url, '') as youtube_url,
		       COALESCE(linkedin_url, '') as linkedin_url,
		       copyright_text, description, COALESCE(services, '[]') as services,
		       COALESCE(social_media, '[]') as social_media,
		       created_at, updated_at
		FROM footer_content
		ORDER BY id LIMIT 1
	`).Scan(
		&footerContent.ID,
		&footerContent.CompanyName,
		&footerContent.Address,
		&footerContent.Phone,
		&footerContent.Email,
		&footerContent.FacebookURL,
		&footerContent.InstagramURL,
		&footerContent.YoutubeURL,
		&footerContent.LinkedinURL,
		&footerContent.CopyrightText,
		&footerContent.Description,
		&footerContent.Services,
		&footerContent.SocialMedia,
		&footerContent.CreatedAt,
		&footerContent.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Footer content not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch footer content"})
		}
		return
	}

	// Parse services JSON string to array
	var services []string
	if footerContent.Services != "" {
		if err := json.Unmarshal([]byte(footerContent.Services), &services); err != nil {
			fmt.Printf("Backend: Error unmarshaling services JSON: %v\n", err)
			fmt.Printf("Backend: Raw services string: %s\n", footerContent.Services)
			services = []string{}
		}
	} else {
		fmt.Printf("Backend: Services field is empty\n")
		services = []string{}
	}

	fmt.Printf("Backend: Parsed services array: %+v\n", services)

	// Parse social media JSON string to array
	var socialMedia []SocialMediaItem
	if footerContent.SocialMedia != "" {
		if err := json.Unmarshal([]byte(footerContent.SocialMedia), &socialMedia); err != nil {
			fmt.Printf("Backend: Error unmarshaling social media JSON: %v\n", err)
			fmt.Printf("Backend: Raw social media string: %s\n", footerContent.SocialMedia)
			socialMedia = []SocialMediaItem{}
		}
	} else {
		fmt.Printf("Backend: Social media field is empty\n")
		socialMedia = []SocialMediaItem{}
	}

	fmt.Printf("Backend: Parsed social media array: %+v\n", socialMedia)

	// Create response object
	response := FooterContentResponse{
		ID:            footerContent.ID,
		CompanyName:   footerContent.CompanyName,
		Address:       footerContent.Address,
		Phone:         footerContent.Phone,
		Email:         footerContent.Email,
		FacebookURL:   footerContent.FacebookURL,
		InstagramURL:  footerContent.InstagramURL,
		YoutubeURL:    footerContent.YoutubeURL,
		LinkedinURL:   footerContent.LinkedinURL,
		CopyrightText: footerContent.CopyrightText,
		Description:   footerContent.Description,
		Services:      services,
		SocialMedia:   socialMedia,
		CreatedAt:     footerContent.CreatedAt,
		UpdatedAt:     footerContent.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

func UpdateFooterContent(c *gin.Context) {
	// Check authentication
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var updateData FooterContentResponse
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Backend: Received footer content update: %+v\n", updateData)
	fmt.Printf("Backend: Services received: %+v\n", updateData.Services)
	fmt.Printf("Backend: Social media received: %+v\n", updateData.SocialMedia)

	// Convert services array to JSON string
	servicesJSON, err := json.Marshal(updateData.Services)
	if err != nil {
		fmt.Printf("Backend: Error marshaling services: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to process services data"})
		return
	}

	// Convert social media array to JSON string
	socialMediaJSON, err := json.Marshal(updateData.SocialMedia)
	if err != nil {
		fmt.Printf("Backend: Error marshaling social media: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to process social media data"})
		return
	}

	fmt.Printf("Backend: Services JSON: %s\n", string(servicesJSON))
	fmt.Printf("Backend: Social media JSON: %s\n", string(socialMediaJSON))

	// Update the footer content (should be only one record)
	_, err = database.DB.Exec(`
		UPDATE footer_content
		SET company_name = $1, address = $2, phone = $3, email = $4,
		    facebook_url = $5, instagram_url = $6, youtube_url = $7, linkedin_url = $8,
		    copyright_text = $9, description = $10, services = $11, social_media = $12, updated_at = CURRENT_TIMESTAMP
		WHERE id = (SELECT id FROM footer_content ORDER BY id LIMIT 1)
	`,
		updateData.CompanyName,
		updateData.Address,
		updateData.Phone,
		updateData.Email,
		updateData.FacebookURL,
		updateData.InstagramURL,
		updateData.YoutubeURL,
		updateData.LinkedinURL,
		updateData.CopyrightText,
		updateData.Description,
		string(servicesJSON),
		string(socialMediaJSON),
	)

	if err != nil {
		fmt.Printf("Backend: Database update error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update footer content"})
		return
	}

	fmt.Printf("Backend: Footer content updated successfully\n")

	// Return the updated content
	GetFooterContent(c)
}

// GetGlobalSEOSettings retrieves the global SEO settings
func GetGlobalSEOSettings(c *gin.Context) {
	settings, err := database.GetGlobalSEOSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch SEO settings"})
		return
	}

	if settings == nil {
		// No settings found, return empty/default
		c.JSON(http.StatusOK, models.GlobalSEOSettings{
			SiteName:               "MMA Architectural Design",
			DefaultMetaTitle:       "MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự",
			DefaultMetaDescription: "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Uy tín tại 37 tỉnh thành, hơn 500 dự án hoàn thành.",
			CompanyName:            "MMA Architectural Design",
			CompanyDescription:     "Công ty chuyên thiết kế và thi công biệt thự, nhà ở cao cấp",
			CompanyAddress:         "123 Đường ABC, Quận XYZ, TP.HCM",
			CompanyPhone:           "0123 456 789",
			CompanyEmail:           "contact@mma-design.com",
			BusinessHours:          "Mo-Fr 08:00-17:00, Sa 08:00-12:00",
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateGlobalSEOSettings updates or creates global SEO settings
func UpdateGlobalSEOSettings(c *gin.Context) {
	var updateData models.GlobalSEOSettings
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If ID is 0, get the existing settings to update
	if updateData.ID == 0 {
		existing, err := database.GetGlobalSEOSettings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch existing settings"})
			return
		}
		if existing != nil {
			updateData.ID = existing.ID
		}
	}

	err := database.UpdateGlobalSEOSettings(&updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update SEO settings"})
		return
	}

	// Return the updated settings
	GetGlobalSEOSettings(c)
}

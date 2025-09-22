package handlers

import (
	"database/sql"
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
	rows, err := database.DB.Query(`SELECT id, name, slug, description, COALESCE(thumbnail_url, '') as thumbnail_url, COALESCE(category_type, 'product') as category_type, parent_id, level, order_index, display_order, is_active, created_at, updated_at
		FROM categories ORDER BY category_type ASC, level ASC, display_order ASC, order_index ASC, created_at ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		var parentID sql.NullInt64
		err := rows.Scan(&category.ID, &category.Name, &category.Slug, &category.Description, &category.ThumbnailURL,
			&category.CategoryType, &parentID, &category.Level, &category.OrderIndex, &category.DisplayOrder, &category.IsActive,
			&category.CreatedAt, &category.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan category"})
			return
		}

		if parentID.Valid {
			parentIDUint := uint(parentID.Int64)
			category.ParentID = &parentIDUint
		}

		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, categories)
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
	err = database.DB.QueryRow(`INSERT INTO categories (name, slug, description, thumbnail_url, category_type, parent_id, level, order_index, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
		category.Name, category.Slug, category.Description, category.ThumbnailURL, category.CategoryType, category.ParentID, category.Level, category.OrderIndex, category.IsActive).Scan(&newID)
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
	fmt.Printf("Updating category ID: %s with data: %+v\n", id, category)

	// Get existing category to handle partial updates
	var existingCategory models.Category
	err := database.DB.QueryRow(`SELECT name, slug, description, COALESCE(thumbnail_url, '') as thumbnail_url,
		COALESCE(category_type, 'product') as category_type, parent_id, level, order_index, is_active
		FROM categories WHERE id = $1`, id).Scan(
		&existingCategory.Name, &existingCategory.Slug, &existingCategory.Description,
		&existingCategory.ThumbnailURL, &existingCategory.CategoryType, &existingCategory.ParentID,
		&existingCategory.Level, &existingCategory.OrderIndex, &existingCategory.IsActive)
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

	// Force business rules: News categories cannot have parents
	if existingCategory.CategoryType == "news" {
		existingCategory.Level = 0
		existingCategory.ParentID = nil
		fmt.Printf("Forcing news category to have no parent\n")
	}

	// If no parent is set and it's a product category, make it a main category
	if existingCategory.ParentID == nil && existingCategory.CategoryType == "product" {
		existingCategory.Level = 0
		fmt.Printf("Setting product category as main category (level 0)\n")
	}

	fmt.Printf("Final category data before update: %+v\n", existingCategory)

	_, err = database.DB.Exec(`UPDATE categories SET name = $2, slug = $3, description = $4, thumbnail_url = $5, category_type = $6, parent_id = $7,
		level = $8, order_index = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, existingCategory.Name, existingCategory.Slug, existingCategory.Description, existingCategory.ThumbnailURL,
		existingCategory.CategoryType, existingCategory.ParentID, existingCategory.Level, existingCategory.OrderIndex, existingCategory.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

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
			  p.published, p.created_at, p.updated_at, c.name, c.slug, c.description
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
	err = database.DB.QueryRow(`SELECT id, title, content, summary, image_url, category_id, published, created_at, updated_at
		FROM posts WHERE id = $1`, id).Scan(
		&post.ID, &post.Title, &post.Content, &post.Summary, &post.ImageURL, &post.CategoryID,
		&post.Published, &post.CreatedAt, &post.UpdatedAt)

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
	err := database.DB.QueryRow(`INSERT INTO posts (title, content, summary, image_url, category_id, published)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		post.Title, post.Content, post.Summary, post.ImageURL, post.CategoryID, post.Published).Scan(&newID)
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
		category_id = $6, published = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, post.Title, post.Content, post.Summary, post.ImageURL, post.CategoryID, post.Published)
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

// Article handlers
func GetArticles(c *gin.Context) {
	categoryID := c.Query("category")
	published := c.Query("published")
	tag := c.Query("tag")
	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")

	query := `SELECT a.id, a.title, a.content, a.summary, a.featured_image_url, a.category_id,
			  a.published, a.tags, a.meta_title, a.meta_description, a.slug, a.author_id,
			  a.view_count, a.created_at, a.updated_at,
			  c.name, c.slug, c.description,
			  admin.username
			  FROM articles a
			  JOIN categories c ON a.category_id = c.id
			  LEFT JOIN admin ON a.author_id = admin.id
			  WHERE 1=1`

	var args []interface{}
	argCount := 0

	if categoryID != "" {
		argCount++
		query += fmt.Sprintf(" AND a.category_id = $%d", argCount)
		args = append(args, categoryID)
	}

	if published != "" {
		argCount++
		query += fmt.Sprintf(" AND a.published = $%d", argCount)
		args = append(args, published == "true")
	}

	if tag != "" {
		argCount++
		query += fmt.Sprintf(" AND a.tags ILIKE $%d", argCount)
		args = append(args, "%"+tag+"%")
	}

	query += " ORDER BY a.created_at DESC"

	if limit != "0" {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, limit)
	}

	if offset != "0" {
		argCount++
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, offset)
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
		return
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var article models.Article
		var category models.Category
		var authorName sql.NullString

		err := rows.Scan(&article.ID, &article.Title, &article.Content, &article.Summary,
			&article.FeaturedImageURL, &article.CategoryID, &article.Published, &article.Tags,
			&article.MetaTitle, &article.MetaDescription, &article.Slug, &article.AuthorID,
			&article.ViewCount, &article.CreatedAt, &article.UpdatedAt,
			&category.Name, &category.Slug, &category.Description, &authorName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan article"})
			return
		}

		category.ID = article.CategoryID
		article.Category = category

		if authorName.Valid {
			article.Author.Username = authorName.String
		}

		articles = append(articles, article)
	}

	c.JSON(http.StatusOK, articles)
}

func GetArticle(c *gin.Context) {
	identifier := c.Param("identifier")
	var query string
	var args []interface{}

	// Check if identifier is numeric (ID) or string (slug)
	if id, err := strconv.Atoi(identifier); err == nil {
		query = `SELECT a.id, a.title, a.content, a.summary, a.featured_image_url, a.category_id,
				a.published, a.tags, a.meta_title, a.meta_description, a.slug, a.author_id,
				a.view_count, a.created_at, a.updated_at,
				c.name, c.slug, c.description,
				admin.username
				FROM articles a
				JOIN categories c ON a.category_id = c.id
				LEFT JOIN admin ON a.author_id = admin.id
				WHERE a.id = $1`
		args = append(args, id)
	} else {
		query = `SELECT a.id, a.title, a.content, a.summary, a.featured_image_url, a.category_id,
				a.published, a.tags, a.meta_title, a.meta_description, a.slug, a.author_id,
				a.view_count, a.created_at, a.updated_at,
				c.name, c.slug, c.description,
				admin.username
				FROM articles a
				JOIN categories c ON a.category_id = c.id
				LEFT JOIN admin ON a.author_id = admin.id
				WHERE a.slug = $1`
		args = append(args, identifier)
	}

	var article models.Article
	var category models.Category
	var authorName sql.NullString

	err := database.DB.QueryRow(query, args...).Scan(&article.ID, &article.Title, &article.Content,
		&article.Summary, &article.FeaturedImageURL, &article.CategoryID, &article.Published,
		&article.Tags, &article.MetaTitle, &article.MetaDescription, &article.Slug,
		&article.AuthorID, &article.ViewCount, &article.CreatedAt, &article.UpdatedAt,
		&category.Name, &category.Slug, &category.Description, &authorName)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
		return
	}

	category.ID = article.CategoryID
	article.Category = category

	if authorName.Valid {
		article.Author.Username = authorName.String
	}

	// Increment view count if accessing by slug
	if _, err := strconv.Atoi(identifier); err != nil {
		database.DB.Exec("UPDATE articles SET view_count = view_count + 1 WHERE id = $1", article.ID)
		article.ViewCount++
	}

	c.JSON(http.StatusOK, article)
}

func CreateArticle(c *gin.Context) {
	var article models.Article
	if err := c.ShouldBindJSON(&article); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate slug if not provided
	if article.Slug == "" {
		article.Slug = generateSlug(article.Title)
	}

	// Get author ID from JWT token
	authorID, exists := c.Get("userID")
	if exists {
		article.AuthorID = authorID.(uint)
	}

	var newID uint
	err := database.DB.QueryRow(`INSERT INTO articles (title, content, summary, featured_image_url,
		category_id, published, tags, meta_title, meta_description, slug, author_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
		article.Title, article.Content, article.Summary, article.FeaturedImageURL,
		article.CategoryID, article.Published, article.Tags, article.MetaTitle,
		article.MetaDescription, article.Slug, article.AuthorID).Scan(&newID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "Article with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
		return
	}

	article.ID = newID
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()

	c.JSON(http.StatusCreated, article)
}

func UpdateArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article
	if err := c.ShouldBindJSON(&article); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate slug if not provided
	if article.Slug == "" {
		article.Slug = generateSlug(article.Title)
	}

	_, err := database.DB.Exec(`UPDATE articles SET title = $1, content = $2, summary = $3,
		featured_image_url = $4, category_id = $5, published = $6, tags = $7, meta_title = $8,
		meta_description = $9, slug = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11`,
		article.Title, article.Content, article.Summary, article.FeaturedImageURL,
		article.CategoryID, article.Published, article.Tags, article.MetaTitle,
		article.MetaDescription, article.Slug, id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "Article with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article"})
		return
	}

	articleID, _ := strconv.ParseUint(id, 10, 32)
	article.ID = uint(articleID)
	article.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, article)
}

func DeleteArticle(c *gin.Context) {
	id := c.Param("id")

	_, err := database.DB.Exec("DELETE FROM articles WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete article"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Article deleted successfully"})
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
	imageURL := fmt.Sprintf("http://localhost:8080/data/uploads/images/%s", filename)
	fmt.Printf("Upload successful, returning URL: %s\n", imageURL)

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
	videoURL := fmt.Sprintf("http://localhost:8080/data/uploads/videos/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"url": videoURL,
	})
}

// Homepage handlers
func GetHomepageImages(c *gin.Context) {
	imagesDir := "./homepage/images"
	videoDir := "./homepage/videos"

	// Read images directory
	imageFiles, err := os.ReadDir(imagesDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read images directory"})
		return
	}

	// Read videos directory
	videoFiles, err := os.ReadDir(videoDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read videos directory"})
		return
	}

	var images []string
	var videos []string

	// Process image files
	for _, file := range imageFiles {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
				images = append(images, fmt.Sprintf("http://localhost:8080/homepage/images/%s", file.Name()))
			}
		}
	}

	// Process video files
	for _, file := range videoFiles {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".mp4" || ext == ".avi" || ext == ".mov" || ext == ".wmv" || ext == ".webm" {
				videos = append(videos, fmt.Sprintf("http://localhost:8080/homepage/videos/%s", file.Name()))
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
	uploadsDir := "./homepage/images"
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
	imageURL := fmt.Sprintf("http://localhost:8080/homepage/images/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"url": imageURL,
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
	uploadsDir := "./homepage/videos"
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
	videoURL := fmt.Sprintf("http://localhost:8080/homepage/videos/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"url": videoURL,
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

	filePath := filepath.Join("./homepage", mediaType, filename)

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

	oldFilePath := filepath.Join("./homepage", mediaType, oldFilename)

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
	mediaURL := fmt.Sprintf("http://localhost:8080/homepage/%s/%s", mediaType, oldFilename)
	c.JSON(http.StatusOK, gin.H{
		"url": mediaURL,
		"filename": oldFilename,
		"message": "File replaced successfully",
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

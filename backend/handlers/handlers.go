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
	rows, err := database.DB.Query(`SELECT id, name, slug, description, parent_id, level, order_index, is_active, created_at, updated_at
		FROM categories ORDER BY level ASC, order_index ASC, created_at ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		var parentID sql.NullInt64
		err := rows.Scan(&category.ID, &category.Name, &category.Slug, &category.Description,
			&parentID, &category.Level, &category.OrderIndex, &category.IsActive,
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

	// Calculate level based on parent
	if category.ParentID != nil {
		// Get parent level
		var parentLevel int
		err := database.DB.QueryRow("SELECT level FROM categories WHERE id = $1", *category.ParentID).Scan(&parentLevel)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent category"})
			return
		}
		category.Level = parentLevel + 1
	} else {
		category.Level = 0
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

	result, err := database.DB.Exec(`INSERT INTO categories (name, slug, description, parent_id, level, order_index, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		category.Name, category.Slug, category.Description, category.ParentID, category.Level, category.OrderIndex, category.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	id, _ := result.LastInsertId()
	category.ID = uint(id)

	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate level based on parent if parent_id changed
	if category.ParentID != nil {
		// Get parent level
		var parentLevel int
		err := database.DB.QueryRow("SELECT level FROM categories WHERE id = $1", *category.ParentID).Scan(&parentLevel)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent category"})
			return
		}
		category.Level = parentLevel + 1
	} else {
		category.Level = 0
	}

	_, err := database.DB.Exec(`UPDATE categories SET name = $2, slug = $3, description = $4, parent_id = $5,
		level = $6, order_index = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, category.Name, category.Slug, category.Description, category.ParentID,
		category.Level, category.OrderIndex, category.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	categoryID, _ := strconv.ParseUint(id, 10, 32)
	category.ID = uint(categoryID)

	c.JSON(http.StatusOK, category)
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

	result, err := database.DB.Exec(`INSERT INTO posts (title, content, summary, image_url, category_id, published) 
		VALUES ($1, $2, $3, $4, $5, $6)`,
		post.Title, post.Content, post.Summary, post.ImageURL, post.CategoryID, post.Published)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	id, _ := result.LastInsertId()
	post.ID = uint(id)

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

	result, err := database.DB.Exec(`INSERT INTO articles (title, content, summary, featured_image_url,
		category_id, published, tags, meta_title, meta_description, slug, author_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		article.Title, article.Content, article.Summary, article.FeaturedImageURL,
		article.CategoryID, article.Published, article.Tags, article.MetaTitle,
		article.MetaDescription, article.Slug, article.AuthorID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "Article with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
		return
	}

	id, _ := result.LastInsertId()
	article.ID = uint(id)
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

package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"house-design-backend/config"
	"house-design-backend/database"
	"house-design-backend/handlers"
	"house-design-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		log.Println("Warning: Failed to load .env file:", err)
	}

	// Initialize database
	database.InitDatabase()
	defer database.DB.Close()

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware - use AllowOriginFunc to accept http/https forms of the public IP
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			// allow localhost dev origins
			if origin == "http://localhost:4200" || origin == "http://localhost:4201" {
				return true
			}

			// allow the public IP over http/https and with/without port
			if strings.HasPrefix(origin, "http://157.66.26.139") || strings.HasPrefix(origin, "https://157.66.26.139") {
				return true
			}

			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
		}

		// Public routes
		api.GET("/categories", handlers.GetCategories)
		api.GET("/posts", handlers.GetPosts)
		api.GET("/posts/:id", handlers.GetPost)
		api.GET("/articles", handlers.GetArticles)
		api.GET("/articles/:identifier", handlers.GetArticle)
		api.GET("/homepage/media", handlers.GetHomepageImages)
		api.GET("/home-content", handlers.GetHomeContent)

		// Protected routes (require authentication)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Categories management
			protected.POST("/categories", handlers.CreateCategory)
			protected.PUT("/categories/:id", handlers.UpdateCategory)
			protected.PUT("/categories/update-order", handlers.UpdateCategoryOrder)
			protected.DELETE("/categories/:id", handlers.DeleteCategory)

			// Posts management
			protected.POST("/posts", handlers.CreatePost)
			protected.PUT("/posts/:id", handlers.UpdatePost)
			protected.DELETE("/posts/:id", handlers.DeletePost)

			// Articles management
			protected.POST("/articles", handlers.CreateArticle)
			protected.PUT("/articles/:id", handlers.UpdateArticle)
			protected.DELETE("/articles/:id", handlers.DeleteArticle)

			// Media uploads
			protected.POST("/upload", handlers.UploadImage)
			protected.POST("/upload-video", handlers.UploadVideo)
			protected.POST("/upload-svg-icon", handlers.UploadSvgIcon)

			// Homepage media management
			protected.POST("/homepage/upload-image", handlers.UploadHomepageImage)
			protected.POST("/homepage/upload-video", handlers.UploadHomepageVideo)
			protected.DELETE("/homepage/:type/:filename", handlers.DeleteHomepageMedia)
			protected.PUT("/homepage/:type/:filename", handlers.ReplaceHomepageMedia)

			// Home content management
			protected.PUT("/home-content", handlers.UpdateHomeContent)
		}
	}

	// Serve static files for uploaded media using absolute paths
	workDir, _ := os.Getwd()
	r.Static("/data", filepath.Join(workDir, "data"))
	r.Static("/homepage", filepath.Join(workDir, "homepage"))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "House Design API is running",
		})
	})

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	address := "0.0.0.0:" + port
	log.Printf("Server starting on %s", address)
	if err := r.Run(address); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

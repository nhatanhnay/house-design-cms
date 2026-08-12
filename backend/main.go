package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

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

	// JWT secret phải đọc sau LoadEnv, vì biến package-level của middleware
	// được khởi tạo trước khi main() chạy.
	if err := middleware.InitJWTSecret(); err != nil {
		log.Fatal("JWT secret không hợp lệ: ", err)
	}

	// Initialize database
	database.InitDatabase()
	defer database.DB.Close()

	// Initialize Gin router
	r := gin.Default()

	// Chỉ tin proxy nội bộ (nginx chạy cùng máy). Nếu tin mọi proxy thì
	// X-Forwarded-For giả mạo được, làm sai số liệu bảng visitors.
	if err := r.SetTrustedProxies([]string{"127.0.0.1"}); err != nil {
		log.Fatal("Failed to set trusted proxies:", err)
	}

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

			// Allow production domain
			if origin == "https://mmadesign.vn" || origin == "http://mmadesign.vn" ||
				origin == "https://www.mmadesign.vn" || origin == "http://www.mmadesign.vn" {
				return true
			}

			// Allow if origin is empty (same-origin requests or server-to-server)
			if origin == "" {
				return true
			}

			// For production: allow domain if configured via env
			allowedDomain := os.Getenv("ALLOWED_ORIGIN")
			if allowedDomain != "" && (origin == allowedDomain || strings.HasPrefix(origin, allowedDomain)) {
				return true
			}

			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // Cache preflight for 12 hours
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

		// Public read routes.
		// Cache-Control thay cho ?_t=<timestamp> phía frontend: cache-buster khiến
		// trình duyệt và CDN không tái sử dụng được request nào.
		public := api.Group("")
		public.Use(middleware.PublicCache(60*time.Second, 300*time.Second))
		{
			public.GET("/categories", handlers.GetCategories)
			public.GET("/posts", handlers.GetPosts)
			public.GET("/posts/:id", handlers.GetPost)
			public.GET("/posts/slug/:slug", handlers.GetPostBySlug)
			public.GET("/products", handlers.GetProducts)
			public.GET("/products/:id", handlers.GetProduct)
			public.GET("/products/slug/:slug", handlers.GetProductBySlug)
			public.GET("/search", handlers.SearchContent)
			public.GET("/homepage/media", handlers.GetHomepageImages)
			public.GET("/home-content", handlers.GetHomeContent)
			public.GET("/footer-content", handlers.GetFooterContent)
			public.GET("/seo-settings", handlers.GetGlobalSEOSettings)
			public.GET("/navbar/logo", handlers.GetNavbarLogo)
		}

		// Form tư vấn là endpoint công khai không token: chặn bot đổ rác vào
		// hộp thư quản trị bằng giới hạn 5 lần / 10 phút cho mỗi IP.
		api.POST("/consultations",
			middleware.RateLimit(5, 10*time.Minute),
			handlers.CreateConsultation)

		// Public tracking endpoints
		api.POST("/posts/:id/view", handlers.IncrementPostView)
		api.POST("/products/:id/view", handlers.IncrementProductView)
		api.POST("/track-visitor", handlers.TrackVisitor)

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

			// Products management
			protected.POST("/products", handlers.CreateProduct)
			protected.PUT("/products/:id", handlers.UpdateProduct)
			protected.DELETE("/products/:id", handlers.DeleteProduct)
			protected.POST("/products/:id/images", handlers.AddProductImage)
			protected.DELETE("/products/:id/images/:imageId", handlers.DeleteProductImage)
			protected.PUT("/products/:id/images/order", handlers.UpdateProductImageOrder)

			// Media uploads
			protected.POST("/upload", handlers.UploadImage)
			protected.POST("/upload-video", handlers.UploadVideo)
			protected.POST("/upload-svg-icon", handlers.UploadSvgIcon)

			// Homepage media management
			protected.POST("/homepage/upload-image", handlers.UploadHomepageImage)
			protected.POST("/homepage/upload-video", handlers.UploadHomepageVideo)
			protected.DELETE("/homepage/:type/:filename", handlers.DeleteHomepageMedia)
			protected.PUT("/homepage/:type/:filename", handlers.ReplaceHomepageMedia)

			// Navbar logo management
			protected.POST("/navbar/upload-logo", handlers.UploadNavbarLogo)
			protected.DELETE("/navbar/logo", handlers.DeleteNavbarLogo)

			// Home content management
			protected.PUT("/home-content", handlers.UpdateHomeContent)

			// Footer content management
			protected.PUT("/footer-content", handlers.UpdateFooterContent)

			// SEO settings management
			protected.PUT("/seo-settings", handlers.UpdateGlobalSEOSettings)
			protected.POST("/seo/upload-og-image", handlers.UploadOGImage)

			// Consultations management
			protected.GET("/consultations", handlers.GetConsultations)
			protected.PUT("/consultations/:id/status", handlers.UpdateConsultationStatus)
			protected.DELETE("/consultations/:id", handlers.DeleteConsultation)

			// Visitor stats (admin only)
			protected.GET("/visitor-stats", handlers.GetVisitorStats)
			protected.GET("/daily-visitors", handlers.GetDailyVisitors)
		}
	}

	// Serve static files for uploaded media using absolute paths
	workDir, _ := os.Getwd()
	r.Static("/data", filepath.Join(workDir, "data"))
	r.Static("/homepage", filepath.Join(workDir, "homepage"))
	r.Static("/uploads", filepath.Join(workDir, "data", "uploads"))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "House Design API is running",
		})
	})

	// Sitemap.xml endpoint. Lưu ý: nginx phải proxy /sitemap.xml về backend,
	// nếu không try_files sẽ rơi vào index.html của Angular.
	r.GET("/sitemap.xml", middleware.PublicCache(3600*time.Second, 86400*time.Second), handlers.GenerateSitemap)

	// Robots.txt endpoint
	r.GET("/robots.txt", func(c *gin.Context) {
		robotsTxt := `User-agent: *
Allow: /

Sitemap: https://mmadesign.vn/sitemap.xml`
		c.Header("Content-Type", "text/plain; charset=utf-8")
		c.String(200, robotsTxt)
	})

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	// Mặc định chỉ bind loopback: nginx là cửa vào duy nhất nên không cần phơi
	// port 8080 ra internet. Đặt SERVER_HOST=0.0.0.0 nếu thật sự cần.
	host := os.Getenv("SERVER_HOST")
	if host == "" {
		host = "127.0.0.1"
	}

	address := host + ":" + port
	log.Printf("Server starting on %s", address)
	if err := r.Run(address); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

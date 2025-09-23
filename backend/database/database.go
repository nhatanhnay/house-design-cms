package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"house-design-backend/models"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

func InitDatabase() {
	var err error

	// Get database configuration from environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "house_design")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	// Create PostgreSQL connection string
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	DB, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Connected to PostgreSQL database successfully")
	createTables()
	migrateCategoriesTable()
	seedAdminUser()
}

// Helper function to get environment variables with default values
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func createTables() {
	// Create admin table
	adminTable := `
	CREATE TABLE IF NOT EXISTS admin (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL
	)`

	// Create categories table
	categoriesTable := `
	CREATE TABLE IF NOT EXISTS categories (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		slug VARCHAR(255) UNIQUE NOT NULL,
		description TEXT,
		thumbnail_url VARCHAR(500),
		category_type VARCHAR(50) DEFAULT 'product',
		parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
		level INTEGER DEFAULT 0,
		order_index INTEGER DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	// Create articles table (enhanced posts for rich text content)
	articlesTable := `
	CREATE TABLE IF NOT EXISTS articles (
		id SERIAL PRIMARY KEY,
		title VARCHAR(500) NOT NULL,
		content TEXT NOT NULL,
		summary TEXT,
		featured_image_url VARCHAR(500),
		category_id INTEGER NOT NULL,
		published BOOLEAN DEFAULT FALSE,
		tags VARCHAR(1000),
		meta_title VARCHAR(255),
		meta_description TEXT,
		slug VARCHAR(500) UNIQUE NOT NULL,
		author_id INTEGER REFERENCES admin(id),
		view_count INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
	)`

	// Keep existing posts table for backward compatibility
	postsTable := `
	CREATE TABLE IF NOT EXISTS posts (
		id SERIAL PRIMARY KEY,
		title VARCHAR(500) NOT NULL,
		content TEXT,
		summary TEXT,
		image_url VARCHAR(500),
		category_id INTEGER NOT NULL,
		published BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
	)`

	// Create home_content table
	homeContentTable := `
	CREATE TABLE IF NOT EXISTS home_content (
		id SERIAL PRIMARY KEY,
		hero_title VARCHAR(500) NOT NULL,
		hero_description TEXT,
		hero_stat1_number VARCHAR(50),
		hero_stat1_label VARCHAR(255),
		hero_stat2_number VARCHAR(50),
		hero_stat2_label VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	tables := []string{adminTable, categoriesTable, articlesTable, postsTable, homeContentTable}

	for _, table := range tables {
		if _, err := DB.Exec(table); err != nil {
			log.Fatal("Failed to create table:", err)
		}
	}

	log.Println("Database tables created successfully")
}

func migrateCategoriesTable() {
	// Check if the new columns exist, and add them if they don't
	migrations := []string{
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500)",
		"ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'product'",
	}

	for _, migration := range migrations {
		if _, err := DB.Exec(migration); err != nil {
			log.Printf("Migration warning: %v", err)
		}
	}

	// Update existing categories to have proper order_index and display_order
	_, err := DB.Exec("UPDATE categories SET order_index = id WHERE order_index = 0")
	if err != nil {
		log.Printf("Failed to update order_index: %v", err)
	}

	_, err = DB.Exec("UPDATE categories SET display_order = id WHERE display_order = 0")
	if err != nil {
		log.Printf("Failed to update display_order: %v", err)
	}

	log.Println("Categories table migration completed")
}

func seedAdminUser() {
	// Check if admin user exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM admin").Scan(&count)
	if err != nil {
		log.Fatal("Failed to check admin user:", err)
	}

	if count == 0 {
		// Create default admin user (password: admin123)
		// In production, use proper password hashing
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash password:", err)
		}

		_, err = DB.Exec("INSERT INTO admin (username, password) VALUES ($1, $2)", "admin", string(hashedPassword))
		if err != nil {
			log.Fatal("Failed to create admin user:", err)
		}
		log.Println("Default admin user created (username: admin, password: admin123)")
	}
	// Seed some default categories and home content
	seedDefaultCategories()
	seedDefaultHomeContent()
}

func seedDefaultCategories() {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM categories").Scan(&count)
	if err != nil {
		log.Fatal("Failed to check categories:", err)
	}

	if count == 0 {
		defaultCategories := []models.Category{
			{Name: "Mẫu Thiết Kế", Slug: "mau-thiet-ke", Description: "Các mẫu thiết kế nhà hiện đại"},
			{Name: "Tin Tức", Slug: "tin-tuc", Description: "Tin tức về kiến trúc và xây dựng"},
			{Name: "Sản Phẩm", Slug: "san-pham", Description: "Sản phẩm và dịch vụ"},
			{Name: "Báo Chí", Slug: "bao-chi", Description: "Báo chí về công ty"},
		}

		for _, category := range defaultCategories {
			_, err := DB.Exec("INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)",
				category.Name, category.Slug, category.Description)
			if err != nil {
				log.Printf("Failed to seed category %s: %v", category.Name, err)
			}
		}
		log.Println("Default categories seeded")
	}
}

func seedDefaultHomeContent() {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM home_content").Scan(&count)
	if err != nil {
		log.Fatal("Failed to check home content:", err)
	}

	if count == 0 {
		defaultHomeContent := models.HomeContent{
			HeroTitle:       "MMA Architectural Design",
			HeroDescription: "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo",
			HeroStat1Number: "37",
			HeroStat1Label:  "Tỉnh Thành Phủ Sóng",
			HeroStat2Number: "500+",
			HeroStat2Label:  "Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp",
		}

		_, err := DB.Exec(`
			INSERT INTO home_content (hero_title, hero_description, hero_stat1_number, hero_stat1_label, hero_stat2_number, hero_stat2_label)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			defaultHomeContent.HeroTitle,
			defaultHomeContent.HeroDescription,
			defaultHomeContent.HeroStat1Number,
			defaultHomeContent.HeroStat1Label,
			defaultHomeContent.HeroStat2Number,
			defaultHomeContent.HeroStat2Label,
		)
		if err != nil {
			log.Printf("Failed to seed home content: %v", err)
		} else {
			log.Println("Default home content seeded")
		}
	}
}

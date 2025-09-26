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
	dbPassword := getEnv("DB_PASSWORD", "12346789")
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
	migrateHomeContentTable()
	createFooterContentTable()
	migrateFooterContentTable()
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

func migrateHomeContentTable() {
	// Add new features section columns to home_content table
	migrations := []string{
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS features_title VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS features_description TEXT",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS features_logo_url VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature1_icon VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature1_title VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature1_description TEXT",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature2_icon VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature2_title VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature2_description TEXT",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature3_icon VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature3_title VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature3_description TEXT",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature4_icon VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature4_title VARCHAR(500)",
		"ALTER TABLE home_content ADD COLUMN IF NOT EXISTS feature4_description TEXT",
	}

	for _, migration := range migrations {
		if _, err := DB.Exec(migration); err != nil {
			log.Printf("Home content migration warning: %v", err)
		}
	}

	// Update existing records with default feature4 values if they don't exist
	_, err := DB.Exec(`
		UPDATE home_content
		SET feature4_icon = COALESCE(feature4_icon, 'verified'),
		    feature4_title = COALESCE(feature4_title, 'Uy Tín 37 Tỉnh Thành'),
		    feature4_description = COALESCE(feature4_description, 'Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.'),
		    features_title = COALESCE(features_title, 'Ưu Thế MMA Architectural Design'),
		    feature1_icon = COALESCE(feature1_icon, 'architecture'),
		    feature2_icon = COALESCE(feature2_icon, 'engineering'),
		    feature3_icon = COALESCE(feature3_icon, 'business')
		WHERE feature4_title IS NULL OR feature4_title = ''
	`)
	if err != nil {
		log.Printf("Failed to update existing home content with feature4 defaults: %v", err)
	}

	log.Println("Home content table migration completed")
}

func createFooterContentTable() {
	// Create footer_content table
	footerContentTable := `
	CREATE TABLE IF NOT EXISTS footer_content (
		id SERIAL PRIMARY KEY,
		company_name VARCHAR(500) NOT NULL,
		address TEXT,
		phone VARCHAR(50),
		email VARCHAR(255),
		facebook_url VARCHAR(500),
		instagram_url VARCHAR(500),
		youtube_url VARCHAR(500),
		linkedin_url VARCHAR(500),
		copyright_text VARCHAR(500),
		description TEXT,
		services TEXT DEFAULT '[]',
		social_media TEXT DEFAULT '[]',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	if _, err := DB.Exec(footerContentTable); err != nil {
		log.Fatal("Failed to create footer_content table:", err)
	}

	log.Println("Footer content table created successfully")
}

func migrateFooterContentTable() {
	// Add services and social_media columns to footer_content table if they don't exist
	migrations := []string{
		"ALTER TABLE footer_content ADD COLUMN IF NOT EXISTS services TEXT DEFAULT '[]'",
		"ALTER TABLE footer_content ADD COLUMN IF NOT EXISTS social_media TEXT DEFAULT '[]'",
	}

	for _, migration := range migrations {
		if _, err := DB.Exec(migration); err != nil {
			log.Printf("Footer content migration warning: %v", err)
		}
	}

	// Update existing records that might have NULL services or social_media
	_, err := DB.Exec("UPDATE footer_content SET services = '[]' WHERE services IS NULL OR services = ''")
	if err != nil {
		log.Printf("Failed to update existing footer content services: %v", err)
	} else {
		log.Println("Updated existing footer content with default services")
	}

	// Set default social media for existing records
	defaultSocialMedia := `[{"name":"Facebook","url":"https://facebook.com/company","icon":"facebook"},{"name":"Instagram","url":"https://instagram.com/company","icon":"photo_camera"},{"name":"YouTube","url":"https://youtube.com/company","icon":"play_circle"},{"name":"LinkedIn","url":"https://linkedin.com/company/company","icon":"business"}]`
	_, err = DB.Exec("UPDATE footer_content SET social_media = $1 WHERE social_media IS NULL OR social_media = '' OR social_media = '[]'", defaultSocialMedia)
	if err != nil {
		log.Printf("Failed to update existing footer content social media: %v", err)
	} else {
		log.Println("Updated existing footer content with default social media")
	}

	log.Println("Footer content table migration completed")
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
	seedDefaultFooterContent()
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
			HeroTitle:             "MMA Architectural Design",
			HeroDescription:       "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo",
			HeroStat1Number:       "37",
			HeroStat1Label:        "Tỉnh Thành Phủ Sóng",
			HeroStat2Number:       "500+",
			HeroStat2Label:        "Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp",
			FeaturesTitle:         "Ưu Thế MMA Architectural Design",
			FeaturesDescription:   "",
			FeaturesLogoURL:       "",
			Feature1Icon:          "architecture",
			Feature1Title:         "Thiết Kế Kiến Trúc Độc Đáo",
			Feature1Description:   "Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.",
			Feature2Icon:          "engineering",
			Feature2Title:         "Thi Công Chất Lượng Cao",
			Feature2Description:   "Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.",
			Feature3Icon:          "business",
			Feature3Title:         "Dịch Vụ Toàn Diện",
			Feature3Description:   "Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.",
			Feature4Icon:          "verified",
			Feature4Title:         "Uy Tín 37 Tỉnh Thành",
			Feature4Description:   "Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.",
		}

		_, err := DB.Exec(`
			INSERT INTO home_content (hero_title, hero_description, hero_stat1_number, hero_stat1_label,
			                         hero_stat2_number, hero_stat2_label, features_title, features_description, features_logo_url,
			                         feature1_icon, feature1_title, feature1_description,
			                         feature2_icon, feature2_title, feature2_description,
			                         feature3_icon, feature3_title, feature3_description,
			                         feature4_icon, feature4_title, feature4_description)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
			defaultHomeContent.HeroTitle,
			defaultHomeContent.HeroDescription,
			defaultHomeContent.HeroStat1Number,
			defaultHomeContent.HeroStat1Label,
			defaultHomeContent.HeroStat2Number,
			defaultHomeContent.HeroStat2Label,
			defaultHomeContent.FeaturesTitle,
			defaultHomeContent.FeaturesDescription,
			defaultHomeContent.FeaturesLogoURL,
			defaultHomeContent.Feature1Icon,
			defaultHomeContent.Feature1Title,
			defaultHomeContent.Feature1Description,
			defaultHomeContent.Feature2Icon,
			defaultHomeContent.Feature2Title,
			defaultHomeContent.Feature2Description,
			defaultHomeContent.Feature3Icon,
			defaultHomeContent.Feature3Title,
			defaultHomeContent.Feature3Description,
			defaultHomeContent.Feature4Icon,
			defaultHomeContent.Feature4Title,
			defaultHomeContent.Feature4Description,
		)
		if err != nil {
			log.Printf("Failed to seed home content: %v", err)
		} else {
			log.Println("Default home content seeded")
		}
	}
}

func seedDefaultFooterContent() {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM footer_content").Scan(&count)
	if err != nil {
		log.Fatal("Failed to check footer content:", err)
	}

	if count == 0 {
		defaultFooterContent := models.FooterContent{
			CompanyName:   "MMA Architectural Design",
			Address:       "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
			Phone:         "0123 456 789",
			Email:         "contact@mmadesign.com",
			FacebookURL:   "https://facebook.com/mmadesign",
			InstagramURL:  "https://instagram.com/mmadesign",
			YoutubeURL:    "https://youtube.com/mmadesign",
			LinkedinURL:   "https://linkedin.com/company/mmadesign",
			CopyrightText: "© 2024 MMA Architectural Design. All rights reserved.",
			Description:   "Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Đội ngũ kiến trúc sư giàu kinh nghiệm, cam kết mang đến những công trình chất lượng cao.",
		}

		// Default services as JSON string
		defaultServices := `["Thiết kế kiến trúc", "Thi công xây dựng", "Nội thất cao cấp", "Tư vấn phong thủy"]`
		// Default social media as JSON string
		defaultSocialMedia := `[{"name":"Facebook","url":"https://facebook.com/mmadesign","icon":"facebook"},{"name":"Instagram","url":"https://instagram.com/mmadesign","icon":"photo_camera"},{"name":"YouTube","url":"https://youtube.com/mmadesign","icon":"play_circle"},{"name":"LinkedIn","url":"https://linkedin.com/company/mmadesign","icon":"business"}]`

		_, err := DB.Exec(`
			INSERT INTO footer_content (company_name, address, phone, email, facebook_url, instagram_url,
			                           youtube_url, linkedin_url, copyright_text, description, services, social_media)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			defaultFooterContent.CompanyName,
			defaultFooterContent.Address,
			defaultFooterContent.Phone,
			defaultFooterContent.Email,
			defaultFooterContent.FacebookURL,
			defaultFooterContent.InstagramURL,
			defaultFooterContent.YoutubeURL,
			defaultFooterContent.LinkedinURL,
			defaultFooterContent.CopyrightText,
			defaultFooterContent.Description,
			defaultServices,
			defaultSocialMedia,
		)
		if err != nil {
			log.Printf("Failed to seed footer content: %v", err)
		} else {
			log.Println("Default footer content seeded")
		}
	}
}

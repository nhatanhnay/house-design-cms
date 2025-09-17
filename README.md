# Modern House Design Website

## Mô tả dự án

Website thiết kế nhà hiện đại với hệ thống quản lý nội dung admin. Dự án bao gồm:

- **Frontend**: Angular 17+ với TypeScript và Angular Material
- **Backend**: Go với Gin framework và PostgreSQL database
- **Chức năng**: Landing page, quản lý danh mục, quản lý bài đăng, xác thực admin

## Cấu trúc dự án

```
├── backend/           # Go backend API
│   ├── main.go        # Entry point
│   ├── go.mod         # Go dependencies
│   ├── models/        # Data models
│   ├── handlers/      # API handlers
│   ├── middleware/    # Authentication middleware
│   └── database/      # Database setup
├── frontend/          # Angular frontend
│   ├── src/app/       # Angular application
│   ├── package.json   # Node dependencies
│   └── angular.json   # Angular configuration
└── .github/           # GitHub configuration
    └── copilot-instructions.md
```

## Cách chạy dự án

### 1. Database (PostgreSQL)

```bash
# Sử dụng Docker Compose (khuyến nghị)
docker-compose up -d postgres

# Hoặc cài đặt PostgreSQL local và tạo database
createdb house_design
```

### 2. Backend (Go)

```bash
cd backend
go mod download
# Copy environment config
cp .env.example .env
# Chỉnh sửa .env với thông tin database của bạn
go run main.go
```

Server chạy trên http://localhost:8080

### 2. Frontend (Angular)

```bash
cd frontend
npm install
ng serve
```

Application chạy trên http://localhost:4200

## Thông tin đăng nhập Admin

- **Tên đăng nhập**: admin
- **Mật khẩu**: admin123

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập admin
- `POST /api/auth/logout` - Đăng xuất

### Categories (Public)

- `GET /api/categories` - Lấy danh sách danh mục

### Categories (Admin - cần xác thực)

- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/:id` - Cập nhật danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

### Posts (Public)

- `GET /api/posts` - Lấy danh sách bài viết
- `GET /api/posts?category=:id` - Lấy bài viết theo danh mục

### Posts (Admin - cần xác thực)

- `POST /api/posts` - Tạo bài viết mới
- `PUT /api/posts/:id` - Cập nhật bài viết
- `DELETE /api/posts/:id` - Xóa bài viết

## Màu sắc chủ đạo

- Primary Blue: #72b0e0
- Light Blue: #92c2e7
- Dark Red: #601516
- Brown: #9e7f62
- Gray Blue: #a1bbcd
- Dark Blue: #283e54

## Tính năng chính

### Frontend

- ✅ Landing page với hero section và showcase
- ✅ Navigation bar động từ database
- ✅ Footer với thông tin liên hệ
- ✅ Trang admin với quản lý danh mục và bài viết
- ✅ Responsive design cho mobile
- ✅ Material Design UI components

### Backend

- ✅ RESTful API với Gin framework
- ✅ PostgreSQL database với auto-migration
- ✅ Environment-based configuration
- ✅ JWT authentication cho admin
- ✅ CORS setup cho frontend
- ✅ Structured error handling

## Cơ sở dữ liệu

### Bảng admin

- id (PRIMARY KEY)
- username (UNIQUE)
- password (bcrypt hash)

### Bảng categories

- id (PRIMARY KEY)
- name
- slug (UNIQUE)
- description
- created_at, updated_at

### Bảng posts

- id (PRIMARY KEY)
- title
- content
- summary
- image_url
- category_id (FOREIGN KEY)
- published (BOOLEAN)
- created_at, updated_at

## Phát triển tiếp

### Tính năng cần bổ sung

- [ ] Dialog forms cho CRUD operations trong admin panel
- [ ] Image upload functionality
- [ ] Rich text editor cho bài viết
- [ ] Search functionality
- [ ] Pagination cho danh sách
- [ ] Email contact form
- [ ] SEO optimization

### Cải tiến kỹ thuật

- ✅ Production database (PostgreSQL)
- ✅ Docker containerization
- ✅ Environment configuration
- [ ] CI/CD pipeline
- [ ] Logging system
- [ ] Unit tests

## Hỗ trợ

Để được hỗ trợ hoặc báo lỗi, vui lòng tạo issue trên GitHub repository.

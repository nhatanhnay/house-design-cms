# Copilot Instructions

This project is a modern house design website with separate `backend/` (Go) and `frontend/` (Angular) directories.

## Architecture Overview

- **Backend**: Go with Gin framework, SQLite/PostgreSQL database
- **Frontend**: Angular 17+ with TypeScript, Angular Material UI
- **Communication**: RESTful API with JSON payloads
- **Purpose**: Showcase modern house designs with admin content management

## Development Workflow

### Getting Started

```bash
# Backend dependencies
cd backend && go mod download

# Frontend dependencies
cd ../frontend && npm install
```

### Running the Application

```bash
# Backend (typically runs on :8080)
cd backend && go run main.go

# Frontend (typically runs on :4200)
cd frontend && ng serve
```

### Testing

```bash
# Backend tests
cd backend && go test ./...

# Frontend tests
cd frontend && ng test
```

## Project Structure & Features

### Core Components

- **Landing Page**: Hero section, navigation, footer with company info
- **Dynamic Navigation**: Admin-managed categories displayed in navbar
- **Admin Panel**: Content management for categories and posts (news, products, designs)
- **Post System**: CRUD operations for articles, designs, and product showcases

### API Endpoints Pattern

```go
// Authentication
POST /api/auth/login
POST /api/auth/logout

// Categories management
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

// Posts management
GET    /api/posts?category=:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
```

### Frontend Structure

- `src/app/components/` - Reusable UI components (navbar, footer)
- `src/app/pages/` - Route components (home, admin, category pages)
- `src/app/services/` - API communication services
- `src/app/models/` - TypeScript interfaces for data models

### Database Schema

- `admin` table: Single admin user credentials
- `categories` table: Navigation menu items
- `posts` table: Content with category relationships

## Authentication Flow

- Single admin account authentication
- JWT token-based sessions
- Angular guards protecting admin routes
- Go middleware validating tokens on protected endpoints

---

_Note: This file should be updated as the project evolves. Remove placeholder sections and add specific examples from the actual codebase._

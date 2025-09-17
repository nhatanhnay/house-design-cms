# Testing the Articles Feature

## How to Test the Articles Feature

The articles feature has been successfully implemented! Here's how to access and test it:

### 1. Navigation
- **Public Access**: Click on "Articles" in the main navigation bar
- **Admin Access**:
  - Go to `/admin` after logging in
  - Click on the "Quản Lý Articles" tab
  - Use the "Quản Lý Articles" or "Tạo Article Mới" buttons

### 2. Available Routes
- `/articles` - List all published articles
- `/articles/[slug]` - View a specific article by slug
- `/admin/articles` - Admin article management (requires login)
- `/admin/articles/create` - Create new article (requires login)
- `/admin/articles/edit/[id]` - Edit existing article (requires login)

### 3. Features Implemented

#### Frontend (Angular + CKEditor 5)
- **Rich Text Editor**: Full CKEditor 5 implementation with toolbar
- **Article List**: Grid layout with filtering and pagination
- **Article Detail**: SEO-optimized article display
- **Admin Management**: Complete CRUD interface

#### Backend (Go + PostgreSQL)
- **Database Schema**: Enhanced articles table with SEO fields
- **REST API**: Full CRUD operations with filtering
- **Features**: Slug generation, view counting, author attribution

### 4. To Start Testing

1. **Start Backend**:
   ```bash
   cd /home/na/Projects/backend
   go run main.go
   ```

2. **Start Frontend**:
   ```bash
   cd /home/na/Projects/frontend
   ng serve
   ```

3. **Access Application**:
   - Public: http://localhost:4200/articles
   - Admin: http://localhost:4200/admin (login with admin/admin123)

### 5. Key Features to Test

1. **Create Article**: Use CKEditor 5 for rich content
2. **SEO Fields**: Meta title, description, tags
3. **Categories**: Assign articles to categories
4. **Draft/Publish**: Toggle publication status
5. **Slug Generation**: Auto-generate URL-friendly slugs
6. **Filtering**: Filter by category, tags, published status
7. **Responsive Design**: Test on mobile devices
8. **View Tracking**: Article view counts increment

The feature is now fully integrated and ready for use!
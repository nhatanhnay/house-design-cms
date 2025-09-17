#!/bin/bash
echo "Converting SQLite ? placeholders to PostgreSQL \$n placeholders..."

# Fix database.go
sed -i 's/VALUES (?, ?, ?)/VALUES ($1, $2, $3)/g' /home/na/Projects/backend/database/database.go

# Fix handlers.go - this is more complex, need to handle different parameter counts
cd /home/na/Projects/backend

# Single parameter
sed -i 's/WHERE username = ?/WHERE username = $1/g' handlers/handlers.go
sed -i 's/WHERE id = ?/WHERE id = $1/g' handlers/handlers.go
sed -i 's/WHERE p.category_id = ?/WHERE p.category_id = $1/g' handlers/handlers.go

# Three parameters  
sed -i 's/VALUES (?, ?, ?)/VALUES ($1, $2, $3)/g' handlers/handlers.go

# Four parameters
sed -i 's/name = ?, slug = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?/name = $1, slug = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4/g' handlers/handlers.go

# Six parameters
sed -i 's/VALUES (?, ?, ?, ?, ?, ?)/VALUES ($1, $2, $3, $4, $5, $6)/g' handlers/handlers.go

# Seven parameters
sed -i 's/title = ?, content = ?, summary = ?, image_url = ?,/title = $1, content = $2, summary = $3, image_url = $4,/g' handlers/handlers.go
sed -i 's/category_id = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?/category_id = $5, published = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7/g' handlers/handlers.go

echo "Conversion completed!"

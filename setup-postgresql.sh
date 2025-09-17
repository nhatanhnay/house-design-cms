#!/bin/bash

echo "PostgreSQL Setup Guide for Modern House Design Website"
echo "======================================================"
echo ""

echo "Option 1: Using Docker (Recommended)"
echo "-------------------------------------"
echo "1. Install Docker and Docker Compose"
echo "2. Run: docker compose up -d"
echo "3. Database will be available at localhost:5432"
echo ""

echo "Option 2: Local PostgreSQL Installation"
echo "---------------------------------------"
echo "1. Install PostgreSQL:"
echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
echo "   macOS: brew install postgresql"
echo "   Windows: Download from https://www.postgresql.org/download/"
echo ""
echo "2. Create database and user:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE house_design;"
echo "   CREATE USER house_user WITH PASSWORD 'house_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE house_design TO house_user;"
echo "   \\q"
echo ""

echo "3. Update your .env file with correct database URL:"
echo "   DATABASE_URL=postgres://house_user:house_password@localhost:5432/house_design?sslmode=disable"
echo ""

echo "4. Run the backend:"
echo "   cd backend && go run main.go"
echo ""

echo "Database will be automatically migrated on first run!"

-- Run this script to add the missing home_content table
-- Execute this in your PostgreSQL database

-- Run the home_content migration
\i database/migrations/003_create_home_content_table.sql

-- Verify the table was created
SELECT COUNT(*) FROM home_content;
SELECT * FROM home_content LIMIT 1;
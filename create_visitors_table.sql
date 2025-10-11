-- Create visitors table for tracking website visitors
CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    visit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_visitors_ip_date ON visitors(ip_address, visit_date);
CREATE INDEX idx_visitors_date ON visitors(visit_date);

-- Create a view for daily unique visitors
CREATE OR REPLACE VIEW daily_unique_visitors AS
SELECT
    visit_date,
    COUNT(DISTINCT ip_address) as unique_visitors,
    COUNT(*) as total_visits
FROM visitors
GROUP BY visit_date
ORDER BY visit_date DESC;

-- Create a view for total stats
CREATE OR REPLACE VIEW visitor_stats AS
SELECT
    COUNT(DISTINCT ip_address) as total_unique_visitors,
    COUNT(*) as total_visits,
    COUNT(DISTINCT visit_date) as total_days
FROM visitors;

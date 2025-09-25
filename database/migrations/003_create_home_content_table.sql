-- Create home_content table for homepage management
-- This migration adds the missing home_content table

-- Create home_content table with all required fields
CREATE TABLE IF NOT EXISTS home_content (
    id SERIAL PRIMARY KEY,
    hero_title VARCHAR(255) NOT NULL DEFAULT 'MMA Architectural Design',
    hero_description TEXT DEFAULT 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
    hero_stat1_number VARCHAR(50) DEFAULT '37',
    hero_stat1_label VARCHAR(255) DEFAULT 'Tỉnh Thành Phủ Sóng',
    hero_stat2_number VARCHAR(50) DEFAULT '500+',
    hero_stat2_label VARCHAR(255) DEFAULT 'Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp',
    features_title VARCHAR(255) DEFAULT 'Ưu Thế MMA Architectural Design',
    features_description TEXT DEFAULT '',
    features_logo_url VARCHAR(500) DEFAULT '',
    feature1_icon VARCHAR(100) DEFAULT 'architecture',
    feature1_title VARCHAR(255) DEFAULT 'Thiết Kế Kiến Trúc Độc Đáo',
    feature1_description TEXT DEFAULT 'Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.',
    feature2_icon VARCHAR(100) DEFAULT 'engineering',
    feature2_title VARCHAR(255) DEFAULT 'Thi Công Chất Lượng Cao',
    feature2_description TEXT DEFAULT 'Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.',
    feature3_icon VARCHAR(100) DEFAULT 'business',
    feature3_title VARCHAR(255) DEFAULT 'Dịch Vụ Toàn Diện',
    feature3_description TEXT DEFAULT 'Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.',
    feature4_icon VARCHAR(100) DEFAULT 'verified',
    feature4_title VARCHAR(255) DEFAULT 'Uy Tín 37 Tỉnh Thành',
    feature4_description TEXT DEFAULT 'Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_home_content_updated_at ON home_content;
CREATE TRIGGER update_home_content_updated_at
    BEFORE UPDATE ON home_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default home content record
INSERT INTO home_content (id, hero_title, hero_description, hero_stat1_number, hero_stat1_label,
                         hero_stat2_number, hero_stat2_label, features_title, features_description,
                         features_logo_url, feature1_icon, feature1_title, feature1_description,
                         feature2_icon, feature2_title, feature2_description, feature3_icon,
                         feature3_title, feature3_description, feature4_icon, feature4_title,
                         feature4_description) VALUES
(1, 'MMA Architectural Design',
 'Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo',
 '37', 'Tỉnh Thành Phủ Sóng',
 '500+', 'Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp',
 'Ưu Thế MMA Architectural Design', '', '',
 'architecture', 'Thiết Kế Kiến Trúc Độc Đáo',
 'Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.',
 'engineering', 'Thi Công Chất Lượng Cao',
 'Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.',
 'business', 'Dịch Vụ Toàn Diện',
 'Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.',
 'verified', 'Uy Tín 37 Tỉnh Thành',
 'Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.')
ON CONFLICT (id) DO NOTHING;

-- Update sequence
SELECT setval('home_content_id_seq', (SELECT MAX(id) FROM home_content) + 1);

COMMIT;
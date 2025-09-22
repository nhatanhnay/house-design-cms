-- Seed initial data for house design CMS
-- Run this after 001_initial_schema.sql

-- Insert default admin user (password: admin123)
-- Note: In production, change this password immediately
INSERT INTO admin (username, password) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, description, level, order_index, display_order, is_active) VALUES
('Mẫu Thiết Kế', 'mau-thiet-ke', 'Các mẫu thiết kế nhà hiện đại, biệt thự, nhà phố', 0, 1, 1, true),
('Tin Tức', 'tin-tuc', 'Tin tức mới nhất về kiến trúc và xây dựng', 0, 2, 2, true),
('Sản Phẩm', 'san-pham', 'Sản phẩm và dịch vụ thiết kế xây dựng', 0, 3, 3, true),
('Báo Chí', 'bao-chi', 'Báo chí về công ty và dự án', 0, 4, 4, true),
('Dự Án', 'du-an', 'Các dự án đã hoàn thành', 0, 5, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for design types
INSERT INTO categories (name, slug, description, parent_id, level, order_index, display_order, is_active) VALUES
-- Mẫu Thiết Kế subcategories (assuming parent category id = 1)
('Biệt Thự', 'biet-thu', 'Thiết kế biệt thự hiện đại', 1, 1, 1, 1, true),
('Nhà Phố', 'nha-pho', 'Thiết kế nhà phố đẹp', 1, 1, 2, 2, true),
('Chung Cư', 'chung-cu', 'Thiết kế nội thất chung cư', 1, 1, 3, 3, true),
('Văn Phòng', 'van-phong', 'Thiết kế văn phòng làm việc', 1, 1, 4, 4, true),

-- Sản Phẩm subcategories (assuming parent category id = 3)  
('Thiết Kế Kiến Trúc', 'thiet-ke-kien-truc', 'Dịch vụ thiết kế kiến trúc', 3, 1, 1, 1, true),
('Thi Công Xây Dựng', 'thi-cong-xay-dung', 'Dịch vụ thi công xây dựng', 3, 1, 2, 2, true),
('Nội Thất', 'noi-that', 'Thiết kế và thi công nội thất', 3, 1, 3, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample articles
INSERT INTO articles (title, content, summary, category_id, published, slug, meta_title, meta_description, tags) VALUES
('Xu Hướng Thiết Kế Nhà Hiện Đại 2024', 
 '<h2>Xu hướng thiết kế nhà hiện đại</h2><p>Trong năm 2024, xu hướng thiết kế nhà hiện đại tập trung vào sự tối giản, thân thiện với môi trường và công nghệ thông minh.</p><h3>Các đặc điểm nổi bật:</h3><ul><li>Sử dụng màu sắc trung tính</li><li>Không gian mở</li><li>Ánh sáng tự nhiên</li><li>Vật liệu bền vững</li></ul>',
 'Khám phá xu hướng thiết kế nhà hiện đại năm 2024 với phong cách tối giản và thân thiện môi trường',
 1, true, 'xu-huong-thiet-ke-nha-hien-dai-2024',
 'Xu Hướng Thiết Kế Nhà Hiện Đại 2024 | House Design',
 'Khám phá xu hướng thiết kế nhà hiện đại năm 2024 với phong cách tối giản, thân thiện môi trường và công nghệ thông minh',
 'thiết kế nhà, hiện đại, xu hướng 2024, kiến trúc'),

('Cách Tối Ưu Hóa Không Gian Nhỏ',
 '<h2>Tối ưu hóa không gian nhỏ</h2><p>Với diện tích hạn chế, việc tối ưu hóa không gian trở nên quan trọng hơn bao giờ hết.</p><h3>Giải pháp thông minh:</h3><ul><li>Nội thất đa năng</li><li>Sử dụng màu sáng</li><li>Gương tạo cảm giác rộng rãi</li><li>Tận dụng chiều cao</li></ul>',
 'Những mẹo hay để tối ưu hóa không gian nhỏ, tạo cảm giác rộng rãi và thoáng đãng',
 1, true, 'cach-toi-uu-hoa-khong-gian-nho',
 'Cách Tối Ưu Hóa Không Gian Nhỏ | House Design',
 'Những mẹo hay để tối ưu hóa không gian nhỏ, tạo cảm giác rộng rãi và thoáng đãng cho ngôi nhà của bạn',
 'không gian nhỏ, tối ưu hóa, nội thất, thiết kế'),

('Công Ty Nhận Giải Thưởng Kiến Trúc Xuất Sắc',
 '<h2>Giải thưởng kiến trúc xuất sắc</h2><p>Chúng tôi vinh dự nhận giải thưởng "Kiến trúc xuất sắc 2024" cho dự án biệt thự hiện đại tại Quận 2.</p><p>Dự án nổi bật với thiết kế độc đáo, kết hợp hài hòa giữa kiến trúc hiện đại và yếu tố truyền thống Việt Nam.</p>',
 'Công ty vinh dự nhận giải thưởng kiến trúc xuất sắc 2024 cho dự án biệt thự hiện đại',
 4, true, 'nhan-giai-thuong-kien-truc-xuat-sac-2024',
 'Nhận Giải Thưởng Kiến Trúc Xuất Sắc 2024 | House Design',
 'Công ty vinh dự nhận giải thưởng kiến trúc xuất sắc 2024 cho dự án biệt thự hiện đại tại Quận 2',
 'giải thưởng, kiến trúc, xuất sắc, biệt thự, dự án')
ON CONFLICT (slug) DO NOTHING;

-- Update sequences to start from a higher number to avoid conflicts
SELECT setval('admin_id_seq', (SELECT MAX(id) FROM admin) + 1);
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories) + 1);
SELECT setval('articles_id_seq', (SELECT MAX(id) FROM articles) + 1);

COMMIT;
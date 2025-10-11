-- Create consultations table for storing consultation requests
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Insert sample data for testing
INSERT INTO consultations (name, phone, email, details, status) VALUES
('Nguyễn Văn A', '0901234567', 'nguyenvana@gmail.com', 'Tôi muốn tư vấn thiết kế nhà 2 tầng hiện đại', 'pending'),
('Trần Thị B', '0912345678', 'tranthib@gmail.com', 'Cần tư vấn chi phí xây nhà phố 3 tầng', 'contacted'),
('Lê Văn C', '0923456789', 'levanc@gmail.com', 'Muốn xem mẫu biệt thự sân vườn', 'pending');

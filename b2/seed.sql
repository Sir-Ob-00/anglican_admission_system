-- SQL script to seed the database with initial admin credentials
-- Password: 12345678 (hashed with argon2)

INSERT INTO "User" (id, name, email, password, role, createdAt, updatedAt) VALUES
  ('admin-001', 'Admin User', 'admin@example.com', '$argon2id$v=19$m=65536,t=3,p=4$Kop36J1wSWPXa9YXIqcpOA$v2lXjURXiN12vwy305h8OX/KmByJlSjBxKsmYZRCM2E', 'ADMIN', NOW(), NOW());

-- Login credentials:
-- Email: admin@example.com
-- Password: 12345678
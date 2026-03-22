-- SQL script to seed the database with initial admin credentials data using argon2 for password hashing
INSERT INTO "User" (email, password, role) VALUES
  ('admin@example.com', '$2b$10$...', 'ADMIN');
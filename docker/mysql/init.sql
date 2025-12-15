-- =============================================================================
-- HotGigs Platform - MySQL Initialization Script
-- =============================================================================
-- This script runs automatically when the MySQL container starts for the first time
-- =============================================================================

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists (already created by MYSQL_DATABASE env var)
-- CREATE DATABASE IF NOT EXISTS hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hotgigs;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON hotgigs.* TO 'hotgigs'@'%';
FLUSH PRIVILEGES;

-- Log initialization complete
SELECT 'HotGigs database initialized successfully' AS status;

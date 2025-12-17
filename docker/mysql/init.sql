-- HotGigs Platform Database Schema
-- Generated for Docker deployment
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotgigs;

-- Note: Complete schema will be applied via Drizzle migrations
-- This file ensures the database exists and is ready for migrations

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT
);

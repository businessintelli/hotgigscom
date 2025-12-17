-- =============================================================================
-- HotGigs Platform - Database Seed Script
-- =============================================================================
-- This script populates the database with initial data for testing
-- Run this after migrations are complete
-- =============================================================================

USE hotgigs;

-- Note: This is a placeholder seed script
-- The actual seeding is done via the Node.js seed scripts:
-- - pnpm db:seed (runs server/scripts/seed-comprehensive-data.mjs)
-- 
-- To seed the database in Docker:
-- 1. docker-compose exec app pnpm db:push (run migrations)
-- 2. docker-compose exec app pnpm db:seed (seed data)

-- Create default admin user (will be created by seed script)
-- Email: info@hotgigs.com
-- Role: admin

-- Create default company admin (will be created by seed script)
-- Email: pratap@businessintelli.com
-- Role: company_admin

SELECT 'Database seed placeholder created. Run pnpm db:seed to populate data.' AS message;

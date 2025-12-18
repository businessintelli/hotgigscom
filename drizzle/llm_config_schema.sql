-- LLM Configuration Management Schema
-- This allows admins to configure LLM providers from the UI

CREATE TABLE IF NOT EXISTS llm_configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL COMMENT 'manus, gemini, openai, ollama',
  is_active BOOLEAN DEFAULT FALSE COMMENT 'Whether this provider is currently active',
  priority INT DEFAULT 0 COMMENT 'Priority order for fallback (higher = higher priority)',
  
  -- API Configuration (encrypted in production)
  api_key TEXT COMMENT 'API key for cloud providers (Gemini, OpenAI)',
  api_url VARCHAR(500) COMMENT 'API endpoint URL (for Ollama or custom endpoints)',
  model_name VARCHAR(100) COMMENT 'Specific model to use (e.g., gemini-1.5-flash, gpt-4)',
  
  -- Provider Settings
  max_tokens INT DEFAULT 4096 COMMENT 'Maximum tokens per request',
  temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT 'Temperature for response generation',
  timeout_seconds INT DEFAULT 30 COMMENT 'Request timeout in seconds',
  
  -- Usage Tracking
  total_requests INT DEFAULT 0 COMMENT 'Total API requests made',
  total_tokens_used BIGINT DEFAULT 0 COMMENT 'Total tokens consumed',
  last_used_at TIMESTAMP NULL COMMENT 'Last time this provider was used',
  
  -- Status and Health
  status VARCHAR(50) DEFAULT 'unconfigured' COMMENT 'unconfigured, healthy, error, rate_limited',
  last_error TEXT COMMENT 'Last error message if any',
  last_health_check TIMESTAMP NULL COMMENT 'Last health check timestamp',
  
  -- Metadata
  configured_by INT COMMENT 'User ID who configured this provider',
  notes TEXT COMMENT 'Admin notes about this configuration',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_provider (provider),
  KEY idx_is_active (is_active),
  KEY idx_priority (priority),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LLM Usage Logs for analytics
CREATE TABLE IF NOT EXISTS llm_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(100),
  
  -- Request Details
  feature VARCHAR(100) COMMENT 'Which feature used the LLM (resume_parsing, job_matching, etc.)',
  user_id INT COMMENT 'User who triggered the request',
  
  -- Token Usage
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  
  -- Performance
  response_time_ms INT COMMENT 'Response time in milliseconds',
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Cost Estimation
  estimated_cost_usd DECIMAL(10,6) COMMENT 'Estimated cost in USD',
  
  -- Metadata
  request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_provider (provider),
  KEY idx_feature (feature),
  KEY idx_user_id (user_id),
  KEY idx_timestamp (request_timestamp),
  KEY idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configurations for all providers
INSERT INTO llm_configurations (provider, priority, model_name, notes) VALUES
('manus', 100, 'default', 'Manus Forge API - Automatic on Manus platform'),
('gemini', 90, 'gemini-1.5-flash', 'Google Gemini - Recommended for cost efficiency'),
('openai', 80, 'gpt-3.5-turbo', 'OpenAI GPT - Industry standard'),
('ollama', 70, 'deepseek-vl2', 'Self-hosted Ollama - For high volume')
ON DUPLICATE KEY UPDATE priority=VALUES(priority);

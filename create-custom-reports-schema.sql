-- Custom Reports Table
CREATE TABLE IF NOT EXISTS custom_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  selectedFields JSON NOT NULL, -- Array of field names to include in report
  filters JSON, -- Array of filter conditions {field, operator, value}
  groupBy VARCHAR(100), -- Field to group by (job, recruiter, status, date)
  sortBy VARCHAR(100), -- Field to sort by
  sortOrder ENUM('asc', 'desc') DEFAULT 'asc',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Report Schedules Table
CREATE TABLE IF NOT EXISTS report_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  reportId INT, -- NULL for standard reports, set for custom reports
  reportType VARCHAR(100) NOT NULL, -- 'custom', 'submissions', 'placements', 'by_job', 'backed_out', 'feedback'
  frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
  dayOfWeek INT, -- 0-6 for weekly (0=Sunday)
  dayOfMonth INT, -- 1-31 for monthly
  timeOfDay TIME DEFAULT '09:00:00', -- Time to send report
  recipients JSON NOT NULL, -- Array of email addresses
  isActive BOOLEAN DEFAULT TRUE,
  lastSentAt TIMESTAMP NULL,
  nextSendAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (reportId) REFERENCES custom_reports(id) ON DELETE CASCADE
);

-- Report Executions Table (audit trail)
CREATE TABLE IF NOT EXISTS report_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheduleId INT NOT NULL,
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
  pdfUrl VARCHAR(500), -- S3 URL of generated PDF
  errorMessage TEXT,
  recipientCount INT DEFAULT 0,
  FOREIGN KEY (scheduleId) REFERENCES report_schedules(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_custom_reports_company ON custom_reports(companyId);
CREATE INDEX idx_custom_reports_user ON custom_reports(userId);
CREATE INDEX idx_report_schedules_company ON report_schedules(companyId);
CREATE INDEX idx_report_schedules_next_send ON report_schedules(nextSendAt, isActive);
CREATE INDEX idx_report_executions_schedule ON report_executions(scheduleId);
CREATE INDEX idx_report_executions_date ON report_executions(executedAt);

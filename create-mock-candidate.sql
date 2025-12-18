-- Create mock candidate user (ID 2)
INSERT INTO users (id, openId, email, name, role, loginMethod, createdAt, updatedAt, lastSignedIn)
VALUES (2, 'mock-candidate-open-id', 'test@candidate.com', 'Test Candidate', 'user', 'oauth', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE email = 'test@candidate.com';

-- Create mock candidate profile
INSERT INTO candidates (userId, title, location, phone, bio, skills, experience, resumeUrl, resumeFileName, createdAt, updatedAt)
VALUES (
  2,
  'Full-Stack Developer',
  'San Francisco, CA',
  '+1-555-9999',
  'Experienced full-stack developer with 5 years of experience building web applications.',
  'JavaScript, TypeScript, React, Node.js, Python, SQL',
  5,
  'https://example.com/resume.pdf',
  'test-candidate-resume.pdf',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE title = 'Full-Stack Developer';

-- Create mock recruiter profile for user ID 1
INSERT INTO recruiters (userId, companyName, phone, bio, createdAt, updatedAt)
VALUES (
  1,
  'TechRecruit Solutions',
  '+1-555-1234',
  'Professional recruiter specializing in tech talent acquisition.',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE companyName = 'TechRecruit Solutions';

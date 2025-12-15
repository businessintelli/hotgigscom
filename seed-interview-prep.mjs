import { createPool } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const pool = createPool(process.env.DATABASE_URL);

const interviewQuestions = [
  // Software Engineer - Technical
  { role: 'Software Engineer', category: 'Technical', question: 'Explain the difference between == and === in JavaScript.', sampleAnswer: '== performs type coercion before comparison, while === checks both value and type without coercion. For example, "5" == 5 is true, but "5" === 5 is false.', difficulty: 'easy', tags: JSON.stringify(['javascript', 'fundamentals']) },
  { role: 'Software Engineer', category: 'Technical', question: 'What is the time complexity of binary search?', sampleAnswer: 'O(log n) - Binary search divides the search space in half with each iteration, making it very efficient for sorted arrays.', difficulty: 'easy', tags: JSON.stringify(['algorithms', 'complexity']) },
  { role: 'Software Engineer', category: 'Technical', question: 'Explain closures in JavaScript with an example.', sampleAnswer: 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned. Example: function outer() { let count = 0; return function() { return ++count; } }', difficulty: 'medium', tags: JSON.stringify(['javascript', 'closures']) },
  { role: 'Software Engineer', category: 'System Design', question: 'Design a URL shortening service like bit.ly', sampleAnswer: 'Key components: 1) Hash function to generate short codes 2) Database to store mappings 3) Redirect service 4) Analytics tracking. Consider scalability, collision handling, and expiration policies.', difficulty: 'hard', tags: JSON.stringify(['system-design', 'scalability']) },
  { role: 'Software Engineer', category: 'Behavioral', question: 'Tell me about a time you debugged a complex production issue.', sampleAnswer: 'Use STAR method: Describe the Situation, Task, Action taken (logs, monitoring, reproduction), and Result (fix deployed, lessons learned).', difficulty: 'medium', tags: JSON.stringify(['behavioral', 'problem-solving']) },
  
  // Product Manager
  { role: 'Product Manager', category: 'Product Strategy', question: 'How would you prioritize features for the next quarter?', sampleAnswer: 'Use frameworks like RICE (Reach, Impact, Confidence, Effort) or Value vs Effort matrix. Consider business goals, user needs, technical feasibility, and competitive landscape.', difficulty: 'medium', tags: JSON.stringify(['prioritization', 'strategy']) },
  { role: 'Product Manager', category: 'Product Strategy', question: 'How do you measure product success?', sampleAnswer: 'Define clear KPIs aligned with business objectives: user engagement metrics, retention rates, revenue impact, NPS scores, and feature adoption rates. Use both leading and lagging indicators.', difficulty: 'medium', tags: JSON.stringify(['metrics', 'kpis']) },
  { role: 'Product Manager', category: 'Behavioral', question: 'Describe a time you had to make a difficult trade-off decision.', sampleAnswer: 'Explain the competing priorities, stakeholders involved, data used for decision-making, and how you communicated the decision and its rationale.', difficulty: 'medium', tags: JSON.stringify(['behavioral', 'decision-making']) },
  { role: 'Product Manager', category: 'Case Study', question: 'How would you improve Uber Eats?', sampleAnswer: 'Identify user pain points (delivery time, food quality, pricing), analyze data, propose solutions (better restaurant recommendations, real-time tracking improvements, loyalty program), and define success metrics.', difficulty: 'hard', tags: JSON.stringify(['case-study', 'product-thinking']) },
  
  // Data Scientist
  { role: 'Data Scientist', category: 'Technical', question: 'Explain the bias-variance tradeoff.', sampleAnswer: 'Bias is error from overly simplistic models (underfitting), variance is error from overly complex models (overfitting). Goal is to find the sweet spot that minimizes total error.', difficulty: 'medium', tags: JSON.stringify(['machine-learning', 'fundamentals']) },
  { role: 'Data Scientist', category: 'Technical', question: 'What is the difference between L1 and L2 regularization?', sampleAnswer: 'L1 (Lasso) adds absolute value of coefficients as penalty, can lead to sparse models. L2 (Ridge) adds squared coefficients, shrinks all coefficients but rarely to zero.', difficulty: 'medium', tags: JSON.stringify(['machine-learning', 'regularization']) },
  { role: 'Data Scientist', category: 'Case Study', question: 'How would you detect credit card fraud?', sampleAnswer: 'Approach: 1) Feature engineering (transaction patterns, amounts, locations) 2) Handle class imbalance 3) Choose model (Random Forest, XGBoost, Neural Networks) 4) Real-time scoring 5) Continuous monitoring and retraining.', difficulty: 'hard', tags: JSON.stringify(['case-study', 'fraud-detection']) },
  
  // Frontend Developer
  { role: 'Frontend Developer', category: 'Technical', question: 'Explain React hooks and when to use them.', sampleAnswer: 'Hooks like useState, useEffect, useContext allow functional components to have state and lifecycle methods. Use useState for component state, useEffect for side effects, useMemo for expensive computations.', difficulty: 'medium', tags: JSON.stringify(['react', 'hooks']) },
  { role: 'Frontend Developer', category: 'Technical', question: 'How do you optimize website performance?', sampleAnswer: 'Techniques: Code splitting, lazy loading, image optimization, CDN usage, caching strategies, minimize bundle size, use production builds, optimize critical rendering path.', difficulty: 'medium', tags: JSON.stringify(['performance', 'optimization']) },
  { role: 'Frontend Developer', category: 'Technical', question: 'Explain CSS specificity and the cascade.', sampleAnswer: 'Specificity determines which CSS rules apply: inline styles (1000) > IDs (100) > classes/attributes (10) > elements (1). Cascade resolves conflicts using specificity, source order, and importance.', difficulty: 'easy', tags: JSON.stringify(['css', 'fundamentals']) },
  
  // Backend Developer
  { role: 'Backend Developer', category: 'Technical', question: 'Explain database indexing and when to use it.', sampleAnswer: 'Indexes speed up data retrieval by creating a data structure (B-tree, hash) that allows quick lookups. Use on frequently queried columns, foreign keys, and WHERE/JOIN conditions. Trade-off: slower writes.', difficulty: 'medium', tags: JSON.stringify(['database', 'indexing']) },
  { role: 'Backend Developer', category: 'Technical', question: 'What is the difference between SQL and NoSQL databases?', sampleAnswer: 'SQL: structured, ACID compliant, schema-based, good for complex queries. NoSQL: flexible schema, horizontally scalable, eventual consistency, good for large-scale distributed systems.', difficulty: 'easy', tags: JSON.stringify(['database', 'fundamentals']) },
  { role: 'Backend Developer', category: 'System Design', question: 'Design a rate limiting system.', sampleAnswer: 'Approaches: Token bucket, leaky bucket, fixed/sliding window. Implementation: Redis for distributed rate limiting, consider per-user and per-IP limits, handle edge cases like burst traffic.', difficulty: 'hard', tags: JSON.stringify(['system-design', 'rate-limiting']) },
  
  // DevOps Engineer
  { role: 'DevOps Engineer', category: 'Technical', question: 'Explain CI/CD and its benefits.', sampleAnswer: 'CI/CD automates code integration, testing, and deployment. Benefits: faster releases, early bug detection, consistent deployments, reduced manual errors, better collaboration.', difficulty: 'easy', tags: JSON.stringify(['cicd', 'automation']) },
  { role: 'DevOps Engineer', category: 'Technical', question: 'How do you handle secrets management in production?', sampleAnswer: 'Use dedicated tools like HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets. Never commit secrets to version control. Rotate secrets regularly. Use IAM roles and least privilege access.', difficulty: 'medium', tags: JSON.stringify(['security', 'secrets-management']) },
  { role: 'DevOps Engineer', category: 'Technical', question: 'Explain container orchestration with Kubernetes.', sampleAnswer: 'Kubernetes manages containerized applications: automatic scaling, load balancing, self-healing, rolling updates, service discovery. Key concepts: Pods, Services, Deployments, ConfigMaps, Secrets.', difficulty: 'hard', tags: JSON.stringify(['kubernetes', 'containers']) },
];

const companyProfiles = [
  {
    companyName: 'Google',
    industry: 'Technology',
    description: 'Multinational technology company specializing in Internet-related services and products.',
    culture: 'Innovation-driven, data-focused, collaborative environment with emphasis on engineering excellence and user-centric design.',
    interviewProcess: 'Typically 4-6 rounds: Phone screen, technical phone interview, onsite interviews (coding, system design, behavioral), hiring committee review.',
    commonQuestions: JSON.stringify([
      'Design a web crawler',
      'Implement LRU cache',
      'How would you design Google Maps?',
      'Tell me about a time you solved a complex technical problem'
    ]),
    tips: 'Focus on algorithms and data structures. Practice coding on whiteboard. Be prepared for system design questions. Demonstrate problem-solving approach clearly.',
    website: 'https://careers.google.com',
    logoUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
  },
  {
    companyName: 'Amazon',
    industry: 'E-commerce & Cloud Computing',
    description: 'Global e-commerce and cloud computing leader.',
    culture: 'Customer-obsessed, data-driven, high ownership culture guided by 16 Leadership Principles.',
    interviewProcess: '5-7 rounds focusing on Leadership Principles, technical skills, and system design. Expect behavioral questions using STAR method.',
    commonQuestions: JSON.stringify([
      'Tell me about a time you failed',
      'Design a recommendation system',
      'How do you handle tight deadlines?',
      'Implement a thread-safe singleton'
    ]),
    tips: 'Study Amazon Leadership Principles thoroughly. Prepare STAR stories for each principle. Practice system design at scale. Show customer focus in answers.',
    website: 'https://www.amazon.jobs',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  {
    companyName: 'Microsoft',
    industry: 'Technology',
    description: 'Leading technology company developing software, hardware, and cloud services.',
    culture: 'Growth mindset culture, collaborative, focus on diversity and inclusion, emphasis on continuous learning.',
    interviewProcess: '4-5 rounds: Recruiter screen, technical phone screen, onsite loop (coding, design, behavioral), as-appropriate interview with senior leader.',
    commonQuestions: JSON.stringify([
      'Design a parking lot system',
      'Implement a binary search tree',
      'How do you prioritize competing projects?',
      'Tell me about your most challenging project'
    ]),
    tips: 'Demonstrate growth mindset. Show collaboration skills. Be prepared for both coding and system design. Understand Microsoft products and services.',
    website: 'https://careers.microsoft.com',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'
  },
  {
    companyName: 'Meta (Facebook)',
    industry: 'Social Media & Technology',
    description: 'Social technology company building platforms for connection and community.',
    culture: 'Move fast, bold thinking, impact-focused, collaborative and open culture.',
    interviewProcess: '4-5 rounds: Recruiter call, technical phone screen, onsite interviews (2 coding, 1 system design, 1 behavioral).',
    commonQuestions: JSON.stringify([
      'Design Facebook News Feed',
      'Implement graph algorithms',
      'How would you improve Instagram Stories?',
      'Tell me about a time you influenced without authority'
    ]),
    tips: 'Focus on impact and scale. Practice graph problems. Understand Meta products deeply. Show initiative and ownership.',
    website: 'https://www.metacareers.com',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'
  },
  {
    companyName: 'Apple',
    industry: 'Technology & Consumer Electronics',
    description: 'Innovative technology company known for premium hardware and software products.',
    culture: 'Design-focused, attention to detail, secretive, high standards for quality and user experience.',
    interviewProcess: '4-6 rounds: Phone screen, technical interviews, onsite loop including hands-on technical assessment and team fit evaluation.',
    commonQuestions: JSON.stringify([
      'Design an iOS app architecture',
      'Optimize memory usage in mobile apps',
      'How do you ensure code quality?',
      'Tell me about a time you paid attention to detail'
    ]),
    tips: 'Show passion for Apple products. Emphasize design thinking. Demonstrate attention to detail. Be prepared for technical depth.',
    website: 'https://www.apple.com/careers',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'
  }
];

async function seedInterviewPrep() {
  try {
    console.log('Starting interview prep data seeding...');
    
    // Insert interview questions
    for (const question of interviewQuestions) {
      await pool.execute(
        `INSERT INTO interview_prep_questions (role, category, question, sampleAnswer, difficulty, tags) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE question = VALUES(question)`,
        [question.role, question.category, question.question, question.sampleAnswer, question.difficulty, question.tags]
      );
    }
    console.log(`✓ Inserted ${interviewQuestions.length} interview questions`);
    
    // Insert company profiles
    for (const company of companyProfiles) {
      await pool.execute(
        `INSERT INTO company_profiles (companyName, industry, description, culture, interviewProcess, commonQuestions, tips, website, logoUrl) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           industry = VALUES(industry),
           description = VALUES(description),
           culture = VALUES(culture),
           interviewProcess = VALUES(interviewProcess),
           commonQuestions = VALUES(commonQuestions),
           tips = VALUES(tips),
           website = VALUES(website),
           logoUrl = VALUES(logoUrl)`,
        [company.companyName, company.industry, company.description, company.culture, 
         company.interviewProcess, company.commonQuestions, company.tips, company.website, company.logoUrl]
      );
    }
    console.log(`✓ Inserted ${companyProfiles.length} company profiles`);
    
    console.log('✅ Interview prep data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding interview prep data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedInterviewPrep();

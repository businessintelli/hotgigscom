#!/usr/bin/env node

/**
 * HotGigs Database Seed Script
 * 
 * This script populates the database with sample data for testing and demos.
 * Run with: pnpm db:seed
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Sample data
const SAMPLE_USERS = [
  // Admin user
  {
    name: 'Admin User',
    email: 'admin@hotgigs.com',
    password: 'Admin123!',
    role: 'admin',
    loginMethod: 'password',
    emailVerified: true,
  },
  // Recruiters
  {
    name: 'Sarah Johnson',
    email: 'sarah.recruiter@techcorp.com',
    password: 'Recruiter123!',
    role: 'recruiter',
    loginMethod: 'password',
    emailVerified: true,
  },
  {
    name: 'Michael Chen',
    email: 'michael.recruiter@innovate.io',
    password: 'Recruiter123!',
    role: 'recruiter',
    loginMethod: 'password',
    emailVerified: true,
  },
  // Candidates
  {
    name: 'Emily Davis',
    email: 'emily.candidate@email.com',
    password: 'Candidate123!',
    role: 'candidate',
    loginMethod: 'password',
    emailVerified: true,
  },
  {
    name: 'James Wilson',
    email: 'james.candidate@email.com',
    password: 'Candidate123!',
    role: 'candidate',
    loginMethod: 'password',
    emailVerified: true,
  },
  {
    name: 'Priya Patel',
    email: 'priya.candidate@email.com',
    password: 'Candidate123!',
    role: 'candidate',
    loginMethod: 'password',
    emailVerified: true,
  },
  {
    name: 'Alex Thompson',
    email: 'alex.candidate@email.com',
    password: 'Candidate123!',
    role: 'candidate',
    loginMethod: 'password',
    emailVerified: true,
  },
  // Panelists
  {
    name: 'Dr. Robert Kim',
    email: 'robert.panelist@techcorp.com',
    password: 'Panelist123!',
    role: 'panelist',
    loginMethod: 'password',
    emailVerified: true,
  },
];

const SAMPLE_RECRUITERS = [
  {
    userEmail: 'sarah.recruiter@techcorp.com',
    companyName: 'TechCorp Industries',
    phoneNumber: '+1-555-0101',
    bio: 'Senior Technical Recruiter with 8+ years of experience in hiring top tech talent.',
    profileCompleted: true,
    profileCompletionStep: 5,
  },
  {
    userEmail: 'michael.recruiter@innovate.io',
    companyName: 'Innovate.io',
    phoneNumber: '+1-555-0102',
    bio: 'Talent Acquisition Lead specializing in startup hiring and scaling teams.',
    profileCompleted: true,
    profileCompletionStep: 5,
  },
];

const SAMPLE_CANDIDATES = [
  {
    userEmail: 'emily.candidate@email.com',
    title: 'Senior Full Stack Developer',
    phoneNumber: '+1-555-0201',
    location: 'San Francisco, CA',
    bio: 'Passionate full-stack developer with 6 years of experience building scalable web applications.',
    skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL']),
    experience: '6 years',
    education: 'BS Computer Science, Stanford University',
    linkedinUrl: 'https://linkedin.com/in/emilydavis',
    githubUrl: 'https://github.com/emilydavis',
    availability: 'immediate',
    expectedSalaryMin: 150000,
    expectedSalaryMax: 180000,
    profileCompleted: true,
    profileCompletionStep: 5,
  },
  {
    userEmail: 'james.candidate@email.com',
    title: 'Data Scientist',
    phoneNumber: '+1-555-0202',
    location: 'New York, NY',
    bio: 'Data scientist specializing in machine learning and predictive analytics.',
    skills: JSON.stringify(['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Spark', 'Tableau', 'R']),
    experience: '4 years',
    education: 'MS Data Science, MIT',
    linkedinUrl: 'https://linkedin.com/in/jameswilson',
    availability: '2-weeks',
    expectedSalaryMin: 140000,
    expectedSalaryMax: 170000,
    profileCompleted: true,
    profileCompletionStep: 5,
  },
  {
    userEmail: 'priya.candidate@email.com',
    title: 'DevOps Engineer',
    phoneNumber: '+1-555-0203',
    location: 'Seattle, WA',
    bio: 'DevOps engineer with expertise in cloud infrastructure and CI/CD pipelines.',
    skills: JSON.stringify(['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Jenkins', 'Ansible', 'Linux']),
    experience: '5 years',
    education: 'BS Computer Engineering, University of Washington',
    linkedinUrl: 'https://linkedin.com/in/priyapatel',
    availability: '1-month',
    expectedSalaryMin: 145000,
    expectedSalaryMax: 175000,
    profileCompleted: true,
    profileCompletionStep: 5,
  },
  {
    userEmail: 'alex.candidate@email.com',
    title: 'Product Manager',
    phoneNumber: '+1-555-0204',
    location: 'Austin, TX',
    bio: 'Product manager with a technical background and experience launching B2B SaaS products.',
    skills: JSON.stringify(['Product Strategy', 'Agile', 'User Research', 'SQL', 'Figma', 'Jira', 'Analytics']),
    experience: '7 years',
    education: 'MBA, Harvard Business School',
    linkedinUrl: 'https://linkedin.com/in/alexthompson',
    availability: '2-weeks',
    expectedSalaryMin: 160000,
    expectedSalaryMax: 200000,
    profileCompleted: true,
    profileCompletionStep: 5,
  },
];

const SAMPLE_CUSTOMERS = [
  {
    name: 'TechCorp Industries',
    industry: 'Technology',
    website: 'https://techcorp.com',
    description: 'Leading enterprise software company specializing in cloud solutions.',
    contactEmail: 'hiring@techcorp.com',
    contactPhone: '+1-555-1000',
    address: '100 Tech Plaza, San Francisco, CA 94105',
  },
  {
    name: 'Innovate.io',
    industry: 'Technology',
    website: 'https://innovate.io',
    description: 'Fast-growing startup building AI-powered productivity tools.',
    contactEmail: 'careers@innovate.io',
    contactPhone: '+1-555-2000',
    address: '50 Innovation Way, Palo Alto, CA 94301',
  },
  {
    name: 'HealthTech Solutions',
    industry: 'Healthcare Technology',
    website: 'https://healthtech.com',
    description: 'Digital health platform improving patient outcomes through technology.',
    contactEmail: 'jobs@healthtech.com',
    contactPhone: '+1-555-3000',
    address: '200 Medical Center Dr, Boston, MA 02115',
  },
];

const SAMPLE_JOBS = [
  {
    title: 'Senior Full Stack Engineer',
    companyName: 'TechCorp Industries',
    description: 'We are looking for a Senior Full Stack Engineer to join our platform team. You will be responsible for building and maintaining our core product features, working with modern technologies and best practices.',
    requirements: 'Required: 5+ years of experience with React and Node.js. Strong understanding of TypeScript, RESTful APIs, and database design. Experience with cloud services (AWS/GCP) preferred.',
    responsibilities: 'Design and implement new features. Code review and mentoring junior developers. Collaborate with product and design teams. Maintain and improve existing codebase.',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'full-time',
    salaryMin: 150000,
    salaryMax: 200000,
    status: 'active',
    isPublic: true,
  },
  {
    title: 'Machine Learning Engineer',
    companyName: 'Innovate.io',
    description: 'Join our AI team to build cutting-edge machine learning models that power our productivity suite. You will work on natural language processing, recommendation systems, and predictive analytics.',
    requirements: 'MS/PhD in Computer Science, Machine Learning, or related field. 3+ years of experience with Python, TensorFlow/PyTorch. Strong foundation in statistics and algorithms.',
    responsibilities: 'Develop and deploy ML models. Research and implement state-of-the-art techniques. Collaborate with data engineers on pipeline development. Present findings to stakeholders.',
    location: 'Remote (US)',
    employmentType: 'full-time',
    salaryMin: 160000,
    salaryMax: 220000,
    status: 'active',
    isPublic: true,
  },
  {
    title: 'DevOps Lead',
    companyName: 'HealthTech Solutions',
    description: 'Lead our DevOps team in building and maintaining HIPAA-compliant infrastructure. You will be responsible for our cloud architecture, CI/CD pipelines, and security practices.',
    requirements: '7+ years of DevOps experience. Expert knowledge of AWS/GCP, Kubernetes, Terraform. Experience with healthcare compliance (HIPAA, SOC2) strongly preferred.',
    responsibilities: 'Lead a team of 4 DevOps engineers. Design and implement cloud architecture. Ensure security and compliance. Manage incident response and on-call rotation.',
    location: 'Boston, MA (On-site)',
    employmentType: 'full-time',
    salaryMin: 170000,
    salaryMax: 210000,
    status: 'active',
    isPublic: true,
  },
  {
    title: 'Product Manager - Growth',
    companyName: 'Innovate.io',
    description: 'Drive user acquisition and retention for our flagship product. You will own the growth roadmap, run experiments, and work closely with engineering and marketing teams.',
    requirements: '5+ years of product management experience. Strong analytical skills and experience with A/B testing. Background in B2B SaaS preferred.',
    responsibilities: 'Define and execute growth strategy. Analyze user behavior and identify opportunities. Collaborate with cross-functional teams. Report on KPIs to leadership.',
    location: 'Palo Alto, CA (Hybrid)',
    employmentType: 'full-time',
    salaryMin: 140000,
    salaryMax: 180000,
    status: 'active',
    isPublic: true,
  },
  {
    title: 'Frontend Developer (React)',
    companyName: 'TechCorp Industries',
    description: 'Build beautiful, responsive user interfaces for our enterprise platform. You will work with our design system and contribute to our component library.',
    requirements: '3+ years of React experience. Strong CSS skills and experience with modern styling solutions. Understanding of accessibility standards.',
    responsibilities: 'Implement UI designs with pixel-perfect accuracy. Optimize performance and accessibility. Contribute to design system. Write unit and integration tests.',
    location: 'San Francisco, CA (Remote OK)',
    employmentType: 'full-time',
    salaryMin: 120000,
    salaryMax: 160000,
    status: 'active',
    isPublic: true,
  },
  {
    title: 'Data Analyst Intern',
    companyName: 'HealthTech Solutions',
    description: 'Summer internship opportunity for aspiring data analysts. You will work on real projects analyzing healthcare data and creating dashboards.',
    requirements: 'Currently pursuing degree in Data Science, Statistics, or related field. Proficiency in SQL and Python. Experience with visualization tools (Tableau, Power BI).',
    responsibilities: 'Analyze datasets and create reports. Build dashboards for stakeholders. Support data team with ad-hoc requests. Present findings to team.',
    location: 'Boston, MA (On-site)',
    employmentType: 'internship',
    salaryMin: 30,
    salaryMax: 40,
    status: 'active',
    isPublic: true,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(connectionString);
  const db = drizzle(connection);

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE applications');
    await connection.execute('TRUNCATE TABLE jobs');
    await connection.execute('TRUNCATE TABLE customerContacts');
    await connection.execute('TRUNCATE TABLE customers');
    await connection.execute('TRUNCATE TABLE candidates');
    await connection.execute('TRUNCATE TABLE recruiters');
    await connection.execute('TRUNCATE TABLE users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared\n');

    // Insert users
    console.log('👤 Creating users...');
    const userIds = {};
    for (const user of SAMPLE_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const [result] = await connection.execute(
        `INSERT INTO users (name, email, passwordHash, role, loginMethod, emailVerified, createdAt, updatedAt, lastSignedIn) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [user.name, user.email, passwordHash, user.role, user.loginMethod, user.emailVerified]
      );
      userIds[user.email] = result.insertId;
      console.log(`  ✅ Created user: ${user.name} (${user.role})`);
    }
    console.log('');

    // Insert recruiters
    console.log('🏢 Creating recruiter profiles...');
    const recruiterIds = {};
    for (const recruiter of SAMPLE_RECRUITERS) {
      const userId = userIds[recruiter.userEmail];
      const [result] = await connection.execute(
        `INSERT INTO recruiters (userId, companyName, phoneNumber, bio, profileCompleted, profileCompletionStep, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, recruiter.companyName, recruiter.phoneNumber, recruiter.bio, recruiter.profileCompleted, recruiter.profileCompletionStep]
      );
      recruiterIds[recruiter.userEmail] = result.insertId;
      console.log(`  ✅ Created recruiter profile: ${recruiter.companyName}`);
    }
    console.log('');

    // Insert candidates
    console.log('👨‍💼 Creating candidate profiles...');
    const candidateIds = {};
    for (const candidate of SAMPLE_CANDIDATES) {
      const userId = userIds[candidate.userEmail];
      const [result] = await connection.execute(
        `INSERT INTO candidates (userId, title, phoneNumber, location, bio, skills, experience, education, linkedinUrl, githubUrl, availability, expectedSalaryMin, expectedSalaryMax, profileCompleted, profileCompletionStep, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, candidate.title, candidate.phoneNumber, candidate.location, candidate.bio, candidate.skills, candidate.experience, candidate.education, candidate.linkedinUrl, candidate.githubUrl || null, candidate.availability, candidate.expectedSalaryMin, candidate.expectedSalaryMax, candidate.profileCompleted, candidate.profileCompletionStep]
      );
      candidateIds[candidate.userEmail] = result.insertId;
      console.log(`  ✅ Created candidate profile: ${candidate.title}`);
    }
    console.log('');

    // Insert customers
    console.log('🏭 Creating customer companies...');
    const customerIds = {};
    const adminUserId = userIds['admin@hotgigs.com'];
    for (const customer of SAMPLE_CUSTOMERS) {
      const [result] = await connection.execute(
        `INSERT INTO customers (name, industry, website, description, contactEmail, contactPhone, address, createdBy, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [customer.name, customer.industry, customer.website, customer.description, customer.contactEmail, customer.contactPhone, customer.address, adminUserId]
      );
      customerIds[customer.name] = result.insertId;
      console.log(`  ✅ Created customer: ${customer.name}`);
    }
    console.log('');

    // Insert jobs
    console.log('💼 Creating job postings...');
    const recruiterUserIds = {
      'TechCorp Industries': userIds['sarah.recruiter@techcorp.com'],
      'Innovate.io': userIds['michael.recruiter@innovate.io'],
      'HealthTech Solutions': userIds['admin@hotgigs.com'],
    };
    for (const job of SAMPLE_JOBS) {
      const postedBy = recruiterUserIds[job.companyName] || adminUserId;
      const customerId = customerIds[job.companyName] || null;
      await connection.execute(
        `INSERT INTO jobs (title, companyName, description, requirements, responsibilities, location, employmentType, salaryMin, salaryMax, customerId, status, isPublic, postedBy, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [job.title, job.companyName, job.description, job.requirements, job.responsibilities, job.location, job.employmentType, job.salaryMin, job.salaryMax, customerId, job.status, job.isPublic, postedBy]
      );
      console.log(`  ✅ Created job: ${job.title} at ${job.companyName}`);
    }
    console.log('');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Users: ${SAMPLE_USERS.length}`);
    console.log(`   - Recruiters: ${SAMPLE_RECRUITERS.length}`);
    console.log(`   - Candidates: ${SAMPLE_CANDIDATES.length}`);
    console.log(`   - Customers: ${SAMPLE_CUSTOMERS.length}`);
    console.log(`   - Jobs: ${SAMPLE_JOBS.length}`);
    console.log('\n📝 Test Credentials:');
    console.log('   Admin:     admin@hotgigs.com / Admin123!');
    console.log('   Recruiter: sarah.recruiter@techcorp.com / Recruiter123!');
    console.log('   Candidate: emily.candidate@email.com / Candidate123!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();

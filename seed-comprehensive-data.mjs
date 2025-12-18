import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Starting comprehensive database seeding...\n');

// Clear existing data (except mock users 1 and 2)
console.log('Clearing existing data...');
try {
  await connection.execute('DELETE FROM aiInterviewResponses WHERE 1=1');
} catch (e) { /* Table may not exist */ }
try {
  await connection.execute('DELETE FROM aiInterviewQuestions WHERE 1=1');
} catch (e) { /* Table may not exist */ }
try {
  await connection.execute('DELETE FROM aiInterviews WHERE 1=1');
} catch (e) { /* Table may not exist */ }
await connection.execute('DELETE FROM interviews WHERE 1=1');
await connection.execute('DELETE FROM applications WHERE 1=1');
await connection.execute('DELETE FROM jobs WHERE 1=1');
await connection.execute('DELETE FROM customerContacts WHERE 1=1');
await connection.execute('DELETE FROM customers WHERE 1=1');
await connection.execute('DELETE FROM candidates WHERE userId NOT IN (2)');
await connection.execute('DELETE FROM recruiters WHERE userId NOT IN (1)');
await connection.execute('DELETE FROM users WHERE id NOT IN (1, 2)');

// Create additional users (3-15)
console.log('Creating users...');
const userInserts = [
  { id: 3, openId: 'user-3', email: 'sarah.johnson@email.com', name: 'Sarah Johnson', role: 'user' },
  { id: 4, openId: 'user-4', email: 'michael.chen@email.com', name: 'Michael Chen', role: 'user' },
  { id: 5, openId: 'user-5', email: 'emily.rodriguez@email.com', name: 'Emily Rodriguez', role: 'user' },
  { id: 6, openId: 'user-6', email: 'david.kim@email.com', name: 'David Kim', role: 'user' },
  { id: 7, openId: 'user-7', email: 'jessica.patel@email.com', name: 'Jessica Patel', role: 'user' },
  { id: 8, openId: 'user-8', email: 'robert.williams@email.com', name: 'Robert Williams', role: 'user' },
  { id: 9, openId: 'user-9', email: 'amanda.brown@email.com', name: 'Amanda Brown', role: 'user' },
  { id: 10, openId: 'user-10', email: 'james.garcia@email.com', name: 'James Garcia', role: 'user' },
  { id: 11, openId: 'user-11', email: 'lisa.martinez@email.com', name: 'Lisa Martinez', role: 'user' },
  { id: 12, openId: 'user-12', email: 'chris.anderson@email.com', name: 'Chris Anderson', role: 'user' },
  { id: 13, openId: 'user-13', email: 'maria.lopez@email.com', name: 'Maria Lopez', role: 'user' },
  { id: 14, openId: 'user-14', email: 'kevin.taylor@email.com', name: 'Kevin Taylor', role: 'user' },
  { id: 15, openId: 'user-15', email: 'rachel.white@email.com', name: 'Rachel White', role: 'user' },
];

for (const user of userInserts) {
  await db.insert(schema.users).values({
    ...user,
    loginMethod: 'oauth',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}

// Create candidate profiles
console.log('Creating candidate profiles...');
const candidateProfiles = [
  { userId: 3, title: 'Senior Full-Stack Developer', location: 'San Francisco, CA', phoneNumber: '+1-555-0103', bio: '8 years of experience building scalable web applications with React, Node.js, and AWS. Passionate about clean code and user experience.', skills: 'JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, GraphQL', experience: '8 years', education: 'BS Computer Science, Stanford University' },
  { userId: 4, title: 'DevOps Engineer', location: 'Seattle, WA', phoneNumber: '+1-555-0104', bio: 'Experienced DevOps engineer specializing in Kubernetes, CI/CD pipelines, and cloud infrastructure automation.', skills: 'Kubernetes, Docker, Terraform, AWS, GCP, Jenkins, Python, Bash', experience: '6 years', education: 'BS Software Engineering, University of Washington' },
  { userId: 5, title: 'UX/UI Designer', location: 'New York, NY', phoneNumber: '+1-555-0105', bio: 'Creative designer with a strong focus on user-centered design and accessibility. Expert in Figma and design systems.', skills: 'Figma, Sketch, Adobe XD, User Research, Prototyping, Design Systems, HTML/CSS', experience: '5 years', education: 'BFA Design, Parsons School of Design' },
  { userId: 6, title: 'Data Scientist', location: 'Boston, MA', phoneNumber: '+1-555-0106', bio: 'Data scientist with expertise in machine learning, statistical analysis, and data visualization. PhD in Statistics.', skills: 'Python, R, SQL, TensorFlow, PyTorch, Pandas, Scikit-learn, Tableau', experience: '7 years', education: 'PhD Statistics, MIT' },
  { userId: 7, title: 'Product Manager', location: 'Austin, TX', phoneNumber: '+1-555-0107', bio: 'Strategic product manager with 6 years of experience in B2B SaaS. Strong analytical and communication skills.', skills: 'Product Strategy, Agile, Jira, Data Analysis, User Research, Roadmapping, SQL', experience: '6 years', education: 'MBA, University of Texas' },
  { userId: 8, title: 'Backend Engineer', location: 'Denver, CO', phoneNumber: '+1-555-0108', bio: 'Backend specialist focused on building high-performance APIs and microservices architecture.', skills: 'Java, Spring Boot, Microservices, PostgreSQL, Redis, Kafka, AWS', experience: '5 years', education: 'BS Computer Science, Colorado State University' },
  { userId: 9, title: 'Frontend Developer', location: 'Portland, OR', phoneNumber: '+1-555-0109', bio: 'Frontend developer passionate about creating beautiful, accessible, and performant user interfaces.', skills: 'React, Vue.js, TypeScript, CSS, Tailwind, Next.js, Webpack', experience: '4 years', education: 'BS Web Development, Portland State University' },
  { userId: 10, title: 'Machine Learning Engineer', location: 'San Jose, CA', phoneNumber: '+1-555-0110', bio: 'ML engineer specializing in NLP and computer vision. Experience deploying models at scale.', skills: 'Python, TensorFlow, PyTorch, NLP, Computer Vision, MLOps, Kubernetes', experience: '5 years', education: 'MS Computer Science, UC Berkeley' },
  { userId: 11, title: 'QA Engineer', location: 'Chicago, IL', phoneNumber: '+1-555-0111', bio: 'Quality assurance engineer with expertise in test automation and performance testing.', skills: 'Selenium, Cypress, Jest, JMeter, Python, JavaScript, CI/CD', experience: '4 years', education: 'BS Information Technology, University of Illinois' },
  { userId: 12, title: 'Security Engineer', location: 'Washington, DC', phoneNumber: '+1-555-0112', bio: 'Cybersecurity professional focused on application security and penetration testing.', skills: 'Security Auditing, Penetration Testing, OWASP, Python, Burp Suite, Wireshark', experience: '6 years', education: 'BS Cybersecurity, George Washington University' },
  { userId: 13, title: 'Mobile Developer', location: 'Los Angeles, CA', phoneNumber: '+1-555-0113', bio: 'Mobile developer with experience building native iOS and Android applications.', skills: 'Swift, Kotlin, React Native, iOS, Android, Firebase, REST APIs', experience: '5 years', education: 'BS Computer Science, UCLA' },
  { userId: 14, title: 'Solutions Architect', location: 'Atlanta, GA', phoneNumber: '+1-555-0114', bio: 'Solutions architect designing scalable cloud architectures for enterprise clients.', skills: 'AWS, Azure, System Design, Microservices, API Design, Cloud Architecture', experience: '9 years', education: 'MS Software Engineering, Georgia Tech' },
  { userId: 15, title: 'Technical Writer', location: 'Remote', phoneNumber: '+1-555-0115', bio: 'Technical writer creating clear documentation for developers and end users.', skills: 'Technical Writing, Documentation, Markdown, API Documentation, Git', experience: '3 years', education: 'BA English, University of Michigan' },
];

for (const profile of candidateProfiles) {
  await db.insert(schema.candidates).values({
    ...profile,
    resumeUrl: `https://storage.example.com/resumes/${profile.userId}.pdf`,
    resumeFilename: `resume_${profile.userId}.pdf`,
    resumeUploadedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// Create customer companies
console.log('Creating customer companies...');
const customers = [
  { name: 'TechCorp Solutions', industry: 'Software', website: 'https://techcorp.example.com', description: 'Leading enterprise software provider', contactEmail: 'hr@techcorp.example.com', contactPhone: '+1-555-1001', address: '123 Tech Street, San Francisco, CA 94105' },
  { name: 'DataDriven Inc', industry: 'Analytics', website: 'https://datadriven.example.com', description: 'Data analytics and business intelligence platform', contactEmail: 'hiring@datadriven.example.com', contactPhone: '+1-555-1002', address: '456 Data Ave, Boston, MA 02108' },
  { name: 'CloudScale Systems', industry: 'Cloud Computing', website: 'https://cloudscale.example.com', description: 'Cloud infrastructure and DevOps solutions', contactEmail: 'jobs@cloudscale.example.com', contactPhone: '+1-555-1003', address: '789 Cloud Blvd, Seattle, WA 98101' },
  { name: 'FinTech Innovations', industry: 'Financial Technology', website: 'https://fintech-innov.example.com', description: 'Revolutionary financial services platform', contactEmail: 'careers@fintech-innov.example.com', contactPhone: '+1-555-1004', address: '321 Finance St, New York, NY 10004' },
  { name: 'HealthTech Partners', industry: 'Healthcare Technology', website: 'https://healthtech.example.com', description: 'Healthcare software and telemedicine solutions', contactEmail: 'recruiting@healthtech.example.com', contactPhone: '+1-555-1005', address: '654 Health Way, Austin, TX 78701' },
];

const customerIds = [];
for (const customer of customers) {
  const [result] = await db.insert(schema.customers).values({
    ...customer,
    createdBy: 1, // Created by mock recruiter
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  customerIds.push(result.insertId);
}

// Create job postings
console.log('Creating job postings...');
const jobs = [
  { customerId: customerIds[0], title: 'Senior Full-Stack Engineer', location: 'San Francisco, CA', employmentType: 'full-time', salaryMin: 150000, salaryMax: 200000, salaryCurrency: '$', description: 'We are seeking an experienced full-stack engineer to join our growing engineering team. You will work on building scalable web applications using modern technologies.', requirements: 'Required: 5+ years of experience with JavaScript/TypeScript, React, Node.js. Experience with cloud platforms (AWS/GCP). Strong problem-solving skills. Preferred: Experience with microservices, Docker, Kubernetes.', status: 'active' },
  { customerId: customerIds[1], title: 'Data Scientist', location: 'Boston, MA', employmentType: 'full-time', salaryMin: 130000, salaryMax: 180000, salaryCurrency: '$', description: 'We are looking for a data scientist to analyze complex datasets and provide actionable insights to drive business decisions.', requirements: 'Required: 3+ years of data science experience. Strong statistical analysis skills. Proficiency in Python/R and SQL. Preferred: Experience with A/B testing, causal inference, data visualization.', status: 'active' },
  { customerId: customerIds[2], title: 'DevOps Engineer', location: 'Seattle, WA', employmentType: 'full-time', salaryMin: 140000, salaryMax: 190000, salaryCurrency: '$', description: 'We need a skilled DevOps engineer to help us scale our infrastructure and improve our deployment processes. You will work on automation, monitoring, and reliability.', requirements: 'Required: 3+ years of DevOps experience. Strong knowledge of Kubernetes, Terraform, CI/CD. Experience with AWS or GCP. Preferred: Experience with monitoring tools (Prometheus, Grafana), Python scripting.', status: 'active' },
  { customerId: customerIds[0], title: 'Product Manager - B2B SaaS', location: 'Remote', employmentType: 'full-time', salaryMin: 120000, salaryMax: 160000, salaryCurrency: '$', description: 'Join our product team to drive the vision and execution of our flagship B2B SaaS platform. Work closely with engineering, design, and customers to deliver impactful features.', requirements: 'Required: 4+ years of product management experience in B2B SaaS. Strong analytical and communication skills. Experience with Agile methodologies. Preferred: Technical background, experience with enterprise software.', status: 'active' },
  { customerId: customerIds[1], title: 'Machine Learning Engineer', location: 'Boston, MA', employmentType: 'full-time', salaryMin: 145000, salaryMax: 195000, salaryCurrency: '$', description: 'Join our data science team to build and deploy machine learning models that power our analytics platform. Work on cutting-edge ML problems at scale.', requirements: 'Required: MS/PhD in Computer Science or related field. 3+ years of ML experience. Strong Python skills, experience with TensorFlow/PyTorch. Preferred: Experience with MLOps, real-time inference, NLP.', status: 'active' },
  { customerId: customerIds[3], title: 'Senior UX Designer', location: 'New York, NY', employmentType: 'full-time', salaryMin: 110000, salaryMax: 150000, salaryCurrency: '$', description: 'Looking for a creative and strategic UX designer to elevate our product experience. You will lead design initiatives from research to final implementation.', requirements: 'Required: 5+ years of UX/UI design experience. Expert in Figma and design systems. Strong portfolio demonstrating user-centered design. Preferred: Experience with B2B products, accessibility expertise.', status: 'active' },
  { customerId: customerIds[2], title: 'Backend Engineer - Java', location: 'Seattle, WA', employmentType: 'full-time', salaryMin: 130000, salaryMax: 170000, salaryCurrency: '$', description: 'Backend engineer to build high-performance APIs and microservices for our cloud platform.', requirements: 'Required: 4+ years Java development. Spring Boot, microservices architecture. PostgreSQL, Redis. Preferred: Kafka, AWS, Docker.', status: 'active' },
  { customerId: customerIds[4], title: 'Frontend Developer - React', location: 'Austin, TX', employmentType: 'full-time', salaryMin: 100000, salaryMax: 140000, salaryCurrency: '$', description: 'Frontend developer to create beautiful, accessible user interfaces for our healthcare platform.', requirements: 'Required: 3+ years React experience. TypeScript, CSS, responsive design. Preferred: Next.js, Tailwind, accessibility (WCAG).', status: 'active' },
  { customerId: customerIds[3], title: 'Security Engineer', location: 'New York, NY', employmentType: 'full-time', salaryMin: 140000, salaryMax: 180000, salaryCurrency: '$', description: 'Security engineer to protect our financial platform and ensure compliance with industry standards.', requirements: 'Required: 4+ years security experience. Penetration testing, OWASP, security auditing. Preferred: CISSP, financial industry experience.', status: 'active' },
  { customerId: customerIds[0], title: 'Mobile Developer - iOS', location: 'San Francisco, CA', employmentType: 'full-time', salaryMin: 120000, salaryMax: 160000, salaryCurrency: '$', description: 'iOS developer to build native mobile applications for our enterprise platform.', requirements: 'Required: 4+ years iOS development. Swift, UIKit, SwiftUI. REST APIs. Preferred: Firebase, Core Data, App Store publishing.', status: 'active' },
  { customerId: customerIds[1], title: 'QA Engineer - Automation', location: 'Boston, MA', employmentType: 'full-time', salaryMin: 90000, salaryMax: 130000, salaryCurrency: '$', description: 'QA engineer to build and maintain automated test suites for our analytics platform.', requirements: 'Required: 3+ years QA experience. Selenium, Cypress, or similar. CI/CD integration. Preferred: Performance testing, API testing.', status: 'active' },
  { customerId: customerIds[4], title: 'Solutions Architect', location: 'Remote', employmentType: 'full-time', salaryMin: 160000, salaryMax: 210000, salaryCurrency: '$', description: 'Solutions architect to design scalable cloud architectures for our healthcare clients.', requirements: 'Required: 7+ years experience. AWS/Azure expertise. System design, microservices. Preferred: Healthcare domain knowledge, certifications.', status: 'active' },
  { customerId: customerIds[2], title: 'Technical Writer', location: 'Remote', employmentType: 'contract', salaryMin: 70000, salaryMax: 100000, salaryCurrency: '$', description: 'Technical writer to create documentation for our developer tools and APIs.', requirements: 'Required: 2+ years technical writing. API documentation, developer guides. Markdown, Git. Preferred: Software development background.', status: 'active' },
  { customerId: customerIds[0], title: 'Engineering Manager', location: 'San Francisco, CA', employmentType: 'full-time', salaryMin: 180000, salaryMax: 240000, salaryCurrency: '$', description: 'Engineering manager to lead a team of 8-10 engineers building our core platform.', requirements: 'Required: 3+ years management experience. 8+ years engineering. Strong technical and leadership skills. Preferred: Startup experience, remote team management.', status: 'active' },
  { customerId: customerIds[3], title: 'Junior Full-Stack Developer', location: 'New York, NY', employmentType: 'full-time', salaryMin: 80000, salaryMax: 110000, salaryCurrency: '$', description: 'Entry-level full-stack developer to join our growing engineering team. Great learning opportunity.', requirements: 'Required: 1-2 years experience or recent graduate. JavaScript, React, Node.js basics. Eager to learn. Preferred: Internship experience, personal projects.', status: 'active' },
];

const jobIds = [];
for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  // Create varied deadlines for testing:
  // - Some urgent (1-2 days)
  // - Some moderate (3-7 days)
  // - Some comfortable (8-30 days)
  // - Some without deadlines
  let applicationDeadline = null;
  if (i % 4 !== 3) { // 75% of jobs have deadlines
    const daysUntilDeadline = i % 3 === 0 ? 2 : i % 3 === 1 ? 5 : 15; // Varied urgency
    applicationDeadline = new Date();
    applicationDeadline.setDate(applicationDeadline.getDate() + daysUntilDeadline);
  }
  
  const [result] = await db.insert(schema.jobs).values({
    ...job,
    postedBy: 1, // Posted by mock recruiter
    applicationDeadline,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  jobIds.push(result.insertId);
}

// Get candidate IDs from database
const [candidateRows] = await connection.execute('SELECT id FROM candidates');
const candidateIds = candidateRows.map(row => row.id);

// Create applications
console.log('Creating applications...');
const applicationStatuses = ['submitted', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected'];
const applications = [];

// Create varied applications
for (let i = 0; i < 35; i++) {
  const candidateId = candidateIds[i % candidateIds.length];
  const jobId = jobIds[i % jobIds.length];
  const status = applicationStatuses[Math.floor(Math.random() * applicationStatuses.length)];
  
  applications.push({
    jobId,
    candidateId,
    status,
    coverLetter: `I am excited to apply for this position. With my background in software development and passion for technology, I believe I would be a great fit for your team. I have experience with the required technologies and am eager to contribute to your company's success.`,
    submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  });
}

const applicationIds = [];
for (const app of applications) {
  const [result] = await db.insert(schema.applications).values({
    ...app,
    updatedAt: new Date(),
  });
  applicationIds.push(result.insertId);
}

// Get recruiter IDs
const [recruiterRows] = await connection.execute('SELECT id FROM recruiters');
const recruiterIds = recruiterRows.map(row => row.id);

// Create interviews
console.log('Creating interviews...');
const interviewTypes = ['phone', 'video', 'in-person', 'ai-interview'];

for (let i = 0; i < 12; i++) {
  const applicationId = applicationIds[i];
  const type = interviewTypes[i % interviewTypes.length];
  const status = i < 8 ? 'completed' : 'scheduled';
  const scheduledDate = new Date(Date.now() + (i - 6) * 24 * 60 * 60 * 1000);
  
  // Get application details for foreign keys
  const [appRows] = await connection.execute('SELECT jobId, candidateId FROM applications WHERE id = ?', [applicationId]);
  const app = appRows[0];
  
  await db.insert(schema.interviews).values({
    applicationId,
    recruiterId: recruiterIds[0],
    candidateId: app.candidateId,
    jobId: app.jobId,
    scheduledAt: scheduledDate,
    duration: 60,
    type,
    status,
    location: type === 'in-person' ? '123 Office St, San Francisco' : null,
    meetingLink: type === 'video' ? 'https://zoom.us/j/123456789' : null,
    notes: status === 'completed' ? 'Great interview, candidate showed strong technical skills.' : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

console.log('\n✅ Database seeding completed successfully!');
console.log(`
Summary:
- Users: ${userInserts.length + 2} (including 2 mock users)
- Candidates: ${candidateProfiles.length + 1}
- Customers: ${customers.length}
- Jobs: ${jobs.length}
- Applications: ${applications.length}
- Interviews: 12
`);

await connection.end();

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    // Create demo recruiter user
    const [recruiterUserResult] = await db.insert(schema.users).values({
      openId: 'demo-recruiter-' + Date.now(),
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techrecruit.com',
      loginMethod: 'email',
      role: 'admin',
      lastSignedIn: new Date(),
    });
    const recruiterUserId = Number(recruiterUserResult.insertId);
    console.log('✅ Created demo recruiter user');

    // Create recruiter profile
    const [recruiterResult] = await db.insert(schema.recruiters).values({
      userId: recruiterUserId,
      companyName: 'TechRecruit Solutions',
      phoneNumber: '+1-555-0123',
      bio: 'Senior Technical Recruiter with 8+ years of experience in placing top tech talent. Specializing in software engineering, data science, and product management roles.',
    });
    const recruiterId = Number(recruiterResult.insertId);
    console.log('✅ Created recruiter profile');

    // Create demo candidates
    const candidatesData = [
      {
        name: 'Alex Chen',
        email: 'alex.chen@email.com',
        title: 'Senior Full-Stack Developer',
        phoneNumber: '+1-555-0201',
        location: 'San Francisco, CA',
        bio: 'Passionate full-stack developer with 6 years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture.',
        skills: JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL']),
        experience: JSON.stringify([
          { company: 'TechCorp', role: 'Senior Developer', duration: '2021-Present' },
          { company: 'StartupXYZ', role: 'Full-Stack Developer', duration: '2018-2021' }
        ]),
        education: JSON.stringify([
          { degree: 'BS Computer Science', school: 'UC Berkeley', year: '2018' }
        ]),
      },
      {
        name: 'Maria Rodriguez',
        email: 'maria.rodriguez@email.com',
        title: 'Product Manager',
        phoneNumber: '+1-555-0202',
        location: 'New York, NY',
        bio: 'Strategic product manager with a track record of launching successful B2B SaaS products. Strong analytical skills and customer-centric approach.',
        skills: JSON.stringify(['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmapping', 'Stakeholder Management']),
        experience: JSON.stringify([
          { company: 'SaaS Inc', role: 'Senior PM', duration: '2020-Present' },
          { company: 'Enterprise Co', role: 'Product Manager', duration: '2017-2020' }
        ]),
        education: JSON.stringify([
          { degree: 'MBA', school: 'NYU Stern', year: '2017' },
          { degree: 'BS Business', school: 'Boston University', year: '2015' }
        ]),
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        title: 'DevOps Engineer',
        phoneNumber: '+1-555-0203',
        location: 'Austin, TX',
        bio: 'DevOps engineer passionate about automation, infrastructure as code, and building reliable systems at scale.',
        skills: JSON.stringify(['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Python', 'Monitoring', 'Linux']),
        experience: JSON.stringify([
          { company: 'CloudTech', role: 'DevOps Engineer', duration: '2019-Present' },
          { company: 'Infrastructure Ltd', role: 'Systems Engineer', duration: '2016-2019' }
        ]),
        education: JSON.stringify([
          { degree: 'BS Information Systems', school: 'UT Austin', year: '2016' }
        ]),
      },
      {
        name: 'Emily Zhang',
        email: 'emily.zhang@email.com',
        title: 'UX/UI Designer',
        phoneNumber: '+1-555-0204',
        location: 'Seattle, WA',
        bio: 'Creative UX/UI designer focused on creating intuitive, accessible, and beautiful digital experiences. 5 years of experience in product design.',
        skills: JSON.stringify(['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility', 'HTML/CSS']),
        experience: JSON.stringify([
          { company: 'Design Studio', role: 'Senior UX Designer', duration: '2021-Present' },
          { company: 'Tech Startup', role: 'Product Designer', duration: '2019-2021' }
        ]),
        education: JSON.stringify([
          { degree: 'BFA Interaction Design', school: 'Parsons', year: '2019' }
        ]),
      },
      {
        name: 'David Kim',
        email: 'david.kim@email.com',
        title: 'Data Scientist',
        phoneNumber: '+1-555-0205',
        location: 'Boston, MA',
        bio: 'Data scientist with expertise in machine learning, statistical modeling, and turning data into actionable business insights.',
        skills: JSON.stringify(['Python', 'R', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Visualization', 'Statistics']),
        experience: JSON.stringify([
          { company: 'Analytics Corp', role: 'Senior Data Scientist', duration: '2020-Present' },
          { company: 'Finance Inc', role: 'Data Analyst', duration: '2017-2020' }
        ]),
        education: JSON.stringify([
          { degree: 'MS Data Science', school: 'MIT', year: '2017' },
          { degree: 'BS Mathematics', school: 'UCLA', year: '2015' }
        ]),
      },
    ];

    const candidateIds = [];
    for (const candidate of candidatesData) {
      // Create user for candidate
      const [userResult] = await db.insert(schema.users).values({
        openId: `demo-candidate-${candidate.email}-${Date.now()}`,
        name: candidate.name,
        email: candidate.email,
        loginMethod: 'email',
        role: 'user',
        lastSignedIn: new Date(),
      });
      const userId = Number(userResult.insertId);

      // Create candidate profile
      const [candidateResult] = await db.insert(schema.candidates).values({
        userId,
        title: candidate.title,
        phoneNumber: candidate.phoneNumber,
        location: candidate.location,
        bio: candidate.bio,
        skills: candidate.skills,
        experience: candidate.experience,
        education: candidate.education,
      });
      candidateIds.push(Number(candidateResult.insertId));
    }
    console.log(`✅ Created ${candidatesData.length} demo candidates`);

    // Create demo customers
    const customersData = [
      {
        name: 'Acme Corporation',
        industry: 'Technology',
        website: 'https://acme-corp.example.com',
        address: '123 Tech Street, San Francisco, CA 94105',
        contactPhone: '+1-555-1000',
        contactEmail: 'contact@acme-corp.example.com',
        description: 'Fortune 500 tech company, high-volume hiring needs',
      },
      {
        name: 'GlobalTech Solutions',
        industry: 'Software',
        website: 'https://globaltech.example.com',
        address: '456 Innovation Ave, Austin, TX 78701',
        contactPhone: '+1-555-2000',
        contactEmail: 'hr@globaltech.example.com',
        description: 'Fast-growing SaaS company, focus on senior roles',
      },
      {
        name: 'DataDriven Inc',
        industry: 'Analytics',
        website: 'https://datadriven.example.com',
        address: '789 Analytics Blvd, Boston, MA 02108',
        contactPhone: '+1-555-3000',
        contactEmail: 'hiring@datadriven.example.com',
        description: 'Data analytics firm, looking for ML engineers and data scientists',
      },
    ];

    const customerIds = [];
    for (const customer of customersData) {
      const [customerResult] = await db.insert(schema.customers).values({
        ...customer,
        createdBy: recruiterUserId,
      });
      customerIds.push(Number(customerResult.insertId));
    }
    console.log(`✅ Created ${customersData.length} demo customers`);

    // Create demo jobs
    const jobsData = [
      {
        customerId: customerIds[0],
        title: 'Senior Full-Stack Engineer',
        description: 'We are seeking an experienced full-stack engineer to join our growing engineering team. You will work on building scalable web applications using modern technologies.',
        requirements: 'Required: 5+ years of experience with JavaScript/TypeScript, React, Node.js. Experience with cloud platforms (AWS/GCP). Strong problem-solving skills. Preferred: Experience with microservices, Docker, Kubernetes.',
        location: 'San Francisco, CA (Hybrid)',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
      {
        customerId: customerIds[1],
        title: 'Product Manager - B2B SaaS',
        description: 'Join our product team to drive the vision and execution of our flagship B2B SaaS platform. Work closely with engineering, design, and customers to deliver impactful features.',
        requirements: 'Required: 4+ years of product management experience in B2B SaaS. Strong analytical and communication skills. Experience with Agile methodologies. Preferred: Technical background, experience with enterprise software.',
        location: 'Austin, TX (Remote)',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
      {
        customerId: customerIds[0],
        title: 'DevOps Engineer',
        description: 'We need a skilled DevOps engineer to help us scale our infrastructure and improve our deployment processes. You will work on automation, monitoring, and reliability.',
        requirements: 'Required: 3+ years of DevOps experience. Strong knowledge of Kubernetes, Terraform, CI/CD. Experience with AWS or GCP. Preferred: Experience with monitoring tools (Prometheus, Grafana), Python scripting.',
        location: 'San Francisco, CA (Hybrid)',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
      {
        customerId: customerIds[1],
        title: 'Senior UX Designer',
        description: 'Looking for a creative and strategic UX designer to elevate our product experience. You will lead design initiatives from research to final implementation.',
        requirements: 'Required: 5+ years of UX/UI design experience. Expert in Figma and design systems. Strong portfolio demonstrating user-centered design. Preferred: Experience with B2B products, accessibility expertise.',
        location: 'Remote',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
      {
        customerId: customerIds[2],
        title: 'Machine Learning Engineer',
        description: 'Join our data science team to build and deploy machine learning models that power our analytics platform. Work on cutting-edge ML problems at scale.',
        requirements: 'Required: MS/PhD in Computer Science or related field. 3+ years of ML experience. Strong Python skills, experience with TensorFlow/PyTorch. Preferred: Experience with MLOps, real-time inference, NLP.',
        location: 'Boston, MA (Hybrid)',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
      {
        customerId: customerIds[2],
        title: 'Data Scientist',
        description: 'We are looking for a data scientist to analyze complex datasets and provide actionable insights to drive business decisions.',
        requirements: 'Required: 3+ years of data science experience. Strong statistical analysis skills. Proficiency in Python/R and SQL. Preferred: Experience with A/B testing, causal inference, data visualization.',
        location: 'Boston, MA (Remote)',
        employmentType: 'full-time',
        status: 'active',
        isPublic: true,
      },
    ];

    const jobIds = [];
    for (const job of jobsData) {
      const [jobResult] = await db.insert(schema.jobs).values({
        ...job,
        postedBy: recruiterUserId,
        postedAt: new Date(),
      });
      jobIds.push(Number(jobResult.insertId));
    }
    console.log(`✅ Created ${jobsData.length} demo jobs`);

    // Create demo applications (matching candidates to jobs)
    const applicationsData = [
      { candidateId: candidateIds[0], jobId: jobIds[0], status: 'interviewing', aiScore: 92 }, // Alex -> Full-Stack
      { candidateId: candidateIds[0], jobId: jobIds[2], status: 'submitted', aiScore: 78 }, // Alex -> DevOps
      { candidateId: candidateIds[1], jobId: jobIds[1], status: 'offered', aiScore: 95 }, // Maria -> PM
      { candidateId: candidateIds[2], jobId: jobIds[2], status: 'interviewing', aiScore: 88 }, // James -> DevOps
      { candidateId: candidateIds[2], jobId: jobIds[0], status: 'submitted', aiScore: 72 }, // James -> Full-Stack
      { candidateId: candidateIds[3], jobId: jobIds[3], status: 'reviewing', aiScore: 90 }, // Emily -> UX
      { candidateId: candidateIds[4], jobId: jobIds[4], status: 'interviewing', aiScore: 94 }, // David -> ML Engineer
      { candidateId: candidateIds[4], jobId: jobIds[5], status: 'submitted', aiScore: 91 }, // David -> Data Scientist
    ];

    for (const app of applicationsData) {
      await db.insert(schema.applications).values({
        ...app,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
      });
    }
    console.log(`✅ Created ${applicationsData.length} demo applications`);

    // Create some demo interviews
    const interviewsData = [
      {
        applicationId: 1, // Alex -> Full-Stack
        recruiterId,
        candidateId: candidateIds[0],
        jobId: jobIds[0],
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 60,
        type: 'video',
        status: 'scheduled',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Technical interview - focus on React and system design',
      },
      {
        applicationId: 3, // Maria -> PM
        recruiterId,
        candidateId: candidateIds[1],
        jobId: jobIds[1],
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        duration: 45,
        type: 'video',
        status: 'scheduled',
        meetingLink: 'https://zoom.us/j/123456789',
        notes: 'Final round - meet with VP of Product',
      },
      {
        applicationId: 4, // James -> DevOps
        recruiterId,
        candidateId: candidateIds[2],
        jobId: jobIds[2],
        scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        duration: 60,
        type: 'ai-interview',
        status: 'completed',
        notes: 'AI interview completed - review results',
      },
    ];

    for (const interview of interviewsData) {
      await db.insert(schema.interviews).values(interview);
    }
    console.log(`✅ Created ${interviewsData.length} demo interviews`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nDemo Data Summary:');
    console.log(`- 1 Recruiter (sarah.johnson@techrecruit.com)`);
    console.log(`- ${candidatesData.length} Candidates`);
    console.log(`- ${customersData.length} Customers`);
    console.log(`- ${jobsData.length} Jobs`);
    console.log(`- ${applicationsData.length} Applications`);
    console.log(`- ${interviewsData.length} Interviews`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

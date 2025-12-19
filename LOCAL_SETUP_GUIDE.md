# HotGigs Platform - Local Setup Guide

This comprehensive guide provides step-by-step instructions for setting up the HotGigs AI-powered recruitment platform on your local machine for development and testing purposes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Methods](#quick-start-methods)
3. [Method 1: Automated Installation with install.sh](#method-1-automated-installation-with-installsh)
4. [Method 2: Interactive Setup with setup-wizard.sh](#method-2-interactive-setup-with-setup-wizardsh)
5. [Method 3: Manual Setup](#method-3-manual-setup)
6. [Understanding the Seed Script](#understanding-the-seed-script)
7. [Understanding the Budget Initialization Script](#understanding-the-budget-initialization-script)
8. [Post-Installation Steps](#post-installation-steps)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before beginning the installation process, ensure your system meets the following requirements and has the necessary software installed.

### System Requirements

Your development machine should meet these minimum specifications to run HotGigs smoothly. The platform requires at least **2 CPU cores**, though 4 cores are recommended for better performance during development. **Memory requirements** start at 4GB RAM minimum, with 8GB recommended to comfortably run all services including the application server, MySQL database, Redis cache, and development tools. **Storage needs** include at least 20GB of free disk space for the application, database, node_modules, and Docker images.

### Required Software

Several software components must be installed before running the setup scripts. **Node.js version 20.x or higher** is required for running the application and build tools. You can verify your Node.js installation by running `node --version` in your terminal. If Node.js is not installed or you have an older version, download the latest LTS version from [nodejs.org](https://nodejs.org/) or use a version manager like nvm.

**pnpm** is the package manager used by HotGigs for faster and more efficient dependency management. If you have Node.js installed but not pnpm, the install script will automatically install it for you. You can also install it manually with `npm install -g pnpm`.

**Git** is required for cloning the repository and version control. Most systems come with Git pre-installed, but if needed, download it from [git-scm.com](https://git-scm.com/) or install via your package manager.

**MySQL 8.0 or higher** (or MariaDB 10.5+) is required for the database. The install script can help you install MySQL if it's not already present, or you can use Docker to run MySQL in a container without installing it system-wide.

**Docker and Docker Compose** (optional but recommended) provide the easiest way to run all services in isolated containers. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/) for Windows and macOS, or use your package manager for Linux.

### API Keys and Credentials

The HotGigs platform integrates with several external services that require API credentials. Before starting the setup, gather the following:

**OpenAI API Key** (required for AI features): Create an account at [platform.openai.com](https://platform.openai.com/) and generate an API key from the API Keys section. This key enables resume parsing, candidate-job matching, AI interview questions, and response evaluation.

**Email Service API Key** (required for notifications): Choose either SendGrid or Resend for transactional email delivery. For SendGrid, sign up at [sendgrid.com](https://sendgrid.com/) and create an API key with "Mail Send" permissions. For Resend, sign up at [resend.com](https://resend.com/) and generate an API key from your dashboard.

**Manus OAuth Credentials** (required for authentication): If deploying in the Manus environment, these are provided automatically. For standalone deployments, you'll need to configure your own OAuth provider or use the platform's built-in authentication.

## Quick Start Methods

HotGigs provides three different setup methods to accommodate different user preferences and use cases. Choose the method that best fits your experience level and requirements.

### Comparison of Setup Methods

| Feature | install.sh | setup-wizard.sh | Manual Setup |
|---------|-----------|----------------|--------------|
| **Difficulty** | Easy | Easy | Advanced |
| **Time Required** | 5-10 minutes | 10-15 minutes | 15-30 minutes |
| **User Input** | Minimal | Guided prompts | Full control |
| **Dependency Checking** | Automatic | Automatic | Manual |
| **Configuration** | Auto-generated | Interactive | Manual editing |
| **Best For** | Quick setup | First-time users | Experienced developers |
| **Customization** | Limited | Moderate | Complete |

### Choosing Your Setup Method

**Use install.sh** if you want the fastest setup with minimal interaction. This script automatically detects your operating system, checks for required dependencies, installs missing components, and generates a working configuration. It's ideal for developers who want to get started quickly and don't need to customize every detail.

**Use setup-wizard.sh** if you prefer a guided experience with more control over configuration options. The wizard walks you through each setup step with clear explanations and prompts for all configuration values. It's perfect for first-time users who want to understand what's being configured and why.

**Use manual setup** if you're an experienced developer who wants complete control over every aspect of the installation. This method requires more time and knowledge but allows for maximum customization and is ideal for production deployments or complex environments.

## Method 1: Automated Installation with install.sh

The automated installation script provides the fastest path to a working HotGigs installation with minimal user interaction.

### What install.sh Does

The install script performs a comprehensive setup process that handles all the technical details automatically. It begins with **operating system detection**, identifying whether you're running Linux (Ubuntu, Debian, CentOS, RHEL, Fedora), macOS, or Windows with WSL2. This allows the script to use the appropriate package managers and installation commands for your system.

Next comes **dependency verification and installation**. The script checks for Node.js 20.x or higher and offers to install it if missing or outdated. It verifies pnpm is installed and installs it globally if needed. Git installation is checked and installed if necessary. MySQL or MariaDB presence is detected, with an option to install MySQL if no database server is found.

The script then handles **project dependency installation** by running `pnpm install` to download all required npm packages. This includes React, Express, tRPC, Drizzle ORM, and dozens of other dependencies needed for the application to function.

**Environment configuration** is automated through the creation of a `.env` file from the `.env.example` template. The script generates a secure random JWT secret using OpenSSL, sets default values for database connection, and prompts for essential API keys like OpenAI and email service credentials.

Finally, the script offers **database initialization** with options to create the database, run schema migrations using Drizzle ORM, and optionally seed sample data for testing.

### Step-by-Step Installation Process

Begin by opening your terminal and navigating to a directory where you want to install HotGigs. Clone the repository from GitHub:

```bash
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom
```

Make the installation script executable:

```bash
chmod +x scripts/install.sh
```

Run the installation script:

```bash
./scripts/install.sh
```

The script will display a welcome banner and begin the installation process. You'll see colored output indicating the progress of each step:

- **Blue [INFO]** messages show what the script is currently doing
- **Green [SUCCESS]** messages confirm completed steps
- **Yellow [WARNING]** messages highlight items that need your attention
- **Red [ERROR]** messages indicate problems that need to be resolved

### Interactive Prompts

During installation, the script may prompt you for input in several scenarios:

**MySQL Installation Prompt**: If no database server is detected, you'll see:
```
[WARNING] No database server detected
HotGigs requires MySQL 8.0+ or MariaDB 10.5+
Install MySQL now? (y/N)
```

Press `y` to install MySQL automatically, or `N` to skip and configure it manually later.

**Database Creation Prompt**: After dependencies are installed, you'll be asked:
```
Do you want to create the database and run migrations now? (y/N)
```

Press `y` to create the database and run migrations immediately, or `N` to do this manually later.

**Database Root Password**: If you choose to create the database, you'll need to enter your MySQL root password:
```
Please enter your MySQL root password when prompted...
```

**Data Seeding Prompt**: After migrations complete, you'll be asked:
```
Do you want to seed the database with sample data? (y/N)
```

Press `y` to populate the database with demo accounts, jobs, candidates, and applications for testing.

### What Gets Installed

The install script sets up a complete development environment with all necessary components:

**Application Files**:
- Complete source code in `client/` and `server/` directories
- Configuration files (`.env`, `tsconfig.json`, `vite.config.ts`)
- Database schema definitions in `drizzle/schema.ts`

**Dependencies** (over 200 packages):
- **Frontend**: React 19, React Router, TailwindCSS, shadcn/ui components
- **Backend**: Express, tRPC, Drizzle ORM, bcrypt, jsonwebtoken
- **AI Integration**: OpenAI SDK, LangChain utilities
- **File Processing**: PDF parsing, DOCX parsing, file upload handling
- **Development Tools**: TypeScript, Vite, ESLint, Prettier

**Database**:
- MySQL database named `hotgigs` (or your configured name)
- Complete schema with 30+ tables for users, jobs, applications, interviews, etc.
- Indexes and foreign key constraints for data integrity

**Configuration**:
- `.env` file with generated JWT secret and default values
- Database connection string
- API key placeholders for OpenAI, SendGrid/Resend

### Post-Installation Configuration

After the install script completes, you need to configure your API keys and credentials. Open the `.env` file in your preferred text editor:

```bash
nano .env
# or
code .env
# or
vim .env
```

Update the following required values:

```env
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Email Service (choose one)
SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key-here
# OR
RESEND_API_KEY=re_your-actual-resend-api-key-here

# Manus OAuth (if using Manus authentication)
VITE_APP_ID=your-manus-app-id
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_KEY=your-manus-frontend-api-key
```

Save the file and start the development server:

```bash
pnpm dev
```

The application will start on http://localhost:3000. Open your browser and navigate to this URL to see the HotGigs platform running.

### Verifying the Installation

After starting the development server, verify everything is working correctly:

1. **Check the application loads**: Navigate to http://localhost:3000 and confirm the home page displays
2. **Test database connectivity**: Try logging in with a demo account (if you seeded data)
3. **Verify API functionality**: Browse jobs or view the recruiter dashboard
4. **Check console for errors**: Open browser developer tools and look for any error messages

If you encounter any issues, refer to the [Troubleshooting](#troubleshooting) section below.

## Method 2: Interactive Setup with setup-wizard.sh

The interactive setup wizard provides a guided experience with step-by-step prompts for all configuration values.

### What setup-wizard.sh Does

The setup wizard takes you through a comprehensive configuration process divided into seven distinct steps. Each step focuses on a specific aspect of the setup, ensuring you understand what's being configured and why.

**Step 1: Deployment Type Selection** asks you to choose between local development, cloud production, or Docker container deployment. This determines which default values and optimizations are applied to your configuration.

**Step 2: Database Configuration** prompts for all database connection details including host, port, database name, username, and password. The wizard constructs a proper DATABASE_URL connection string from these values.

**Step 3: Application Configuration** collects application-specific settings like the port number, application title for branding, and automatically generates a secure JWT secret for session management.

**Step 4: Manus OAuth Configuration** guides you through setting up authentication credentials including the Manus App ID, server-side API key, frontend API key, and OAuth server URLs.

**Step 5: AI Service Configuration** prompts for your OpenAI API key and explains which features require AI integration (resume parsing, candidate matching, interview questions).

**Step 6: Email Service Configuration** offers a choice between SendGrid and Resend for transactional email delivery, then prompts for the appropriate API key.

**Step 7: Optional Services** asks about additional integrations like Redis caching, video conferencing (Zoom/Teams), and LinkedIn integration.

After collecting all configuration values, the wizard generates a complete `.env` file, installs dependencies, creates the database, runs migrations, and optionally seeds sample data.

### Step-by-Step Wizard Process

Begin by cloning the repository and navigating to the project directory:

```bash
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom
```

Make the setup wizard executable:

```bash
chmod +x scripts/setup-wizard.sh
```

Run the setup wizard:

```bash
./scripts/setup-wizard.sh
```

The wizard displays a welcome banner and begins the interactive setup process. Each step is clearly labeled with progress indicators (Step 1/7, Step 2/7, etc.).

### Detailed Step Walkthrough

**Step 1: Choose Deployment Type**

The wizard presents three deployment options:

```
Step 1/7: Choose Deployment Type

  1) Local Development (for testing and development)
  2) Cloud Production (for deployment on cloud servers)
  3) Docker Container (containerized deployment)

Select deployment type [1-3]:
```

Enter `1` for local development, which sets `NODE_ENV=development` and uses development-optimized settings. Enter `2` for cloud production, which sets `NODE_ENV=production` and enables production optimizations. Enter `3` for Docker deployment, which configures settings optimized for containerized environments.

**Step 2: Database Configuration**

The wizard prompts for database connection details:

```
Step 2/7: Database Configuration

Database host [localhost]:
Database port [3306]:
Database name [hotgigs]:
Database user [hotgigs]:
Database password:
```

Press Enter to accept default values shown in brackets, or type custom values. The password input is hidden for security. The wizard constructs a complete DATABASE_URL from these values.

**Step 3: Application Configuration**

Configure application-specific settings:

```
Step 3/7: Application Configuration

Application port [3000]:
Application title [HotGigs - AI-Powered Recruitment]:
```

The wizard automatically generates a secure JWT secret using `openssl rand -base64 32` and displays a confirmation message.

**Step 4: Manus OAuth Configuration**

Set up authentication credentials:

```
Step 4/7: Manus OAuth Configuration

You'll need Manus OAuth credentials from https://portal.manus.im

Manus App ID:
Manus API Key (server-side):
Manus API Key (frontend):
OAuth Server URL [https://api.manus.im]:
OAuth Portal URL [https://portal.manus.im]:
```

If you're not using Manus authentication, you can press Enter to skip these prompts and configure alternative authentication later.

**Step 5: AI Service Configuration**

Configure OpenAI integration:

```
Step 5/7: AI Service Configuration

The following features require OpenAI API access:
  - Resume parsing and skill extraction
  - Candidate-job matching with AI scores
  - AI interview question generation
  - Interview response evaluation

OpenAI API Key:
```

Enter your OpenAI API key starting with `sk-`. This is required for AI-powered features to function.

**Step 6: Email Service Configuration**

Choose and configure your email provider:

```
Step 6/7: Email Service Configuration

Select email service provider:
  1) SendGrid
  2) Resend
  3) Skip (configure later)

Select email provider [1-3]:
```

Enter `1` for SendGrid and you'll be prompted for your SendGrid API key. Enter `2` for Resend and you'll be prompted for your Resend API key. Enter `3` to skip email configuration and set it up manually later.

**Step 7: Optional Services**

Configure additional integrations:

```
Step 7/7: Optional Services

Configure Redis caching? (y/N):
Configure Zoom integration? (y/N):
Configure Teams integration? (y/N):
Configure LinkedIn integration? (y/N):
```

Answer `y` to configure each service, or `N` to skip. For each service you choose to configure, the wizard will prompt for the necessary credentials.

### Configuration Summary and Confirmation

After collecting all values, the wizard displays a summary of your configuration:

```
Configuration Summary:
======================
Deployment Type: Local Development
Database: mysql://hotgigs:***@localhost:3306/hotgigs
Application Port: 3000
OpenAI Integration: Enabled
Email Service: SendGrid
Redis Caching: Disabled
Video Conferencing: Disabled
LinkedIn Integration: Disabled

Proceed with installation? (y/N):
```

Review the summary carefully. Enter `y` to proceed with installation, or `N` to cancel and start over.

### Automated Installation Steps

Once you confirm, the wizard automatically performs these steps:

1. **Creates .env file** with all configured values
2. **Installs dependencies** using `pnpm install`
3. **Creates database** using MySQL commands
4. **Runs migrations** using `pnpm db:push`
5. **Seeds sample data** (if you choose yes when prompted)
6. **Starts development server** using `pnpm dev`

Each step displays progress messages and confirms successful completion. The entire process takes 5-10 minutes depending on your internet connection.

### Accessing the Application

After the wizard completes, you'll see a success message with access information:

```
[SUCCESS] HotGigs Platform setup completed successfully!

Access your application at:
  Application: http://localhost:3000
  phpMyAdmin: http://localhost:8080 (if using Docker)

Demo Accounts (if you seeded data):
  Admin: admin@hotgigs.com / Admin123!
  Recruiter: sarah.recruiter@techcorp.com / Recruiter123!
  Candidate: emily.candidate@email.com / Candidate123!

Next Steps:
  1. Open http://localhost:3000 in your browser
  2. Log in with a demo account to explore features
  3. Review the documentation in README.md
  4. Start developing!
```

## Method 3: Manual Setup

Manual setup provides complete control over every aspect of the installation process and is recommended for experienced developers or production deployments.

### Step 1: Clone the Repository

Open your terminal and clone the HotGigs repository:

```bash
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom
```

### Step 2: Install Dependencies

Install all required Node.js packages using pnpm:

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

This downloads over 200 packages and may take 2-5 minutes depending on your internet connection.

### Step 3: Configure Environment Variables

Create your environment configuration file:

```bash
cp .env.example .env
```

Open the `.env` file in your text editor and configure all required values:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=mysql://hotgigs:your_password@localhost:3306/hotgigs

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Manus OAuth Configuration
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# ============================================
# AI & LLM CONFIGURATION
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_KEY=your-manus-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# ============================================
# EMAIL CONFIGURATION (choose one)
# ============================================
# SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# OR Resend
RESEND_API_KEY=re_your-resend-api-key

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
VITE_APP_TITLE=HotGigs - AI-Powered Recruitment Platform
VITE_APP_LOGO=/logo.svg

# ============================================
# OPTIONAL: REDIS CACHE
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# OPTIONAL: VIDEO CONFERENCING
# ============================================
# Zoom
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_ACCOUNT_ID=your-zoom-account-id

# Microsoft Teams
TEAMS_CLIENT_ID=your-teams-client-id
TEAMS_CLIENT_SECRET=your-teams-client-secret
TEAMS_TENANT_ID=your-teams-tenant-id

# ============================================
# OPTIONAL: LINKEDIN INTEGRATION
# ============================================
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_API_KEY=your-linkedin-api-key

# ============================================
# OPTIONAL: ANALYTICS
# ============================================
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### Step 4: Set Up the Database

Create the MySQL database and user:

```bash
# Connect to MySQL as root
mysql -u root -p

# In the MySQL shell, run these commands:
CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hotgigs'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hotgigs.* TO 'hotgigs'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Run database migrations to create the schema:

```bash
pnpm db:push
```

This command reads the schema definition from `drizzle/schema.ts` and creates all necessary tables, indexes, and constraints in your database.

### Step 5: Seed Sample Data (Optional)

Populate the database with realistic test data:

```bash
pnpm db:seed
```

This creates demo accounts, job postings, candidates, applications, and interviews for testing purposes.

### Step 6: Start the Development Server

Launch the application in development mode:

```bash
pnpm dev
```

The server will start on http://localhost:3000. You'll see output indicating the server is running:

```
VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

[OAuth] Initialized with baseURL: https://api.manus.im
Server running on http://localhost:3000/
```

### Step 7: Verify the Installation

Open your browser and navigate to http://localhost:3000. You should see the HotGigs home page with options to sign in as a recruiter or candidate.

If you seeded data, try logging in with a demo account:
- **Recruiter**: sarah.recruiter@techcorp.com / Recruiter123!
- **Candidate**: emily.candidate@email.com / Candidate123!

Explore the platform features to ensure everything is working correctly.

## Understanding the Seed Script

The `seed.mjs` script is a crucial tool for development and testing that populates your database with realistic sample data.

### Purpose and Benefits

The seed script serves multiple important purposes in the development workflow. It **accelerates development** by eliminating the need to manually create test data, providing immediate access to a fully populated system, and enabling testing of features that require existing data like search, filtering, and analytics.

It **enables comprehensive testing** by creating diverse candidate profiles to test matching algorithms, generating job postings across different industries and roles, establishing applications in various stages of the recruitment pipeline, and scheduling interviews with different statuses and types.

The script **supports demonstrations** through ready-to-use demo accounts for different user roles, realistic data for client presentations and stakeholder reviews, and complete workflows from job posting to candidate hiring.

### What the Seed Script Creates

The seed script generates a comprehensive dataset that mirrors real-world usage patterns:

**User Accounts** (30 total):
- 1 Platform Admin with full system access
- 1 Company Admin for company-level management
- 5 Recruiters from different companies
- 3 Panelists for interview evaluation
- 20 Candidates with diverse backgrounds

**Company Data**:
- 5 Companies representing different industries (technology, finance, healthcare, retail, consulting)
- Company profiles with descriptions and locations
- Budget allocations for recruitment activities

**Job Postings** (15 total):
- Technology roles: Senior Full-Stack Developer, Frontend Engineer, DevOps Engineer, Data Scientist
- Marketing roles: Digital Marketing Manager, Content Strategist
- Sales roles: Sales Development Representative, Account Executive
- Operations roles: Operations Manager, HR Business Partner
- Each job includes detailed descriptions, requirements, responsibilities, and salary ranges

**Candidate Profiles** (20 total):
- Diverse skill sets across technology, marketing, sales, and operations
- Experience levels ranging from entry-level to senior
- Complete profiles with skills, education, work history, and certifications
- Resume data including parsed information from realistic resumes

**Applications** (30 total):
- Distributed across different jobs and candidates
- Various statuses: pending, under_review, shortlisted, interview_scheduled, rejected, hired
- Application dates spanning several months
- Cover letters and application notes

**Interviews** (10 total):
- Different types: phone, video, in-person, ai-interview
- Various statuses: scheduled, completed, cancelled, no-show
- Interview notes and feedback
- AI evaluation scores for completed AI interviews

**AI Match Scores**:
- Pre-calculated candidate-job match percentages
- Skill alignment analysis
- Experience level matching
- Location compatibility scores

**Email Campaigns** (5 total):
- Sample recruitment marketing campaigns
- Different campaign types and statuses
- Recipient lists and engagement metrics

### Running the Seed Script

Execute the seed script after setting up your database schema:

```bash
# Ensure database migrations are up to date
pnpm db:push

# Run the seed script
pnpm db:seed
```

The script takes approximately 30-60 seconds to complete and provides detailed progress output:

```
[Seed] Starting database seeding...
[Seed] Clearing existing data...
[Seed] Creating users...
[Seed] ✓ Created 30 users (1 admin, 1 company admin, 5 recruiters, 3 panelists, 20 candidates)
[Seed] Creating companies...
[Seed] ✓ Created 5 companies
[Seed] Creating recruiter profiles...
[Seed] ✓ Created 5 recruiters
[Seed] Creating candidate profiles...
[Seed] ✓ Created 20 candidates with complete profiles
[Seed] Creating job postings...
[Seed] ✓ Created 15 job postings across various roles
[Seed] Creating applications...
[Seed] ✓ Created 30 applications with varied statuses
[Seed] Creating interviews...
[Seed] ✓ Created 10 interviews (scheduled and completed)
[Seed] Creating AI match scores...
[Seed] ✓ Created match scores for candidate-job pairs
[Seed] Creating email campaigns...
[Seed] ✓ Created 5 sample email campaigns
[Seed] Seeding completed successfully!

Demo Accounts:
  Platform Admin: admin@hotgigs.com / Admin123!
  Company Admin: company.admin@techcorp.com / Admin123!
  Recruiter: sarah.recruiter@techcorp.com / Recruiter123!
  Panelist: robert.panelist@techcorp.com / Panelist123!
  Candidate: emily.candidate@email.com / Candidate123!
```

### Demo Account Credentials

The seed script creates several demo accounts for testing different user roles:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Platform Admin | admin@hotgigs.com | Admin123! | Full platform administration |
| Company Admin | company.admin@techcorp.com | Admin123! | Company-level management |
| Recruiter | sarah.recruiter@techcorp.com | Recruiter123! | Job posting, candidate screening |
| Recruiter | michael.recruiter@innovate.io | Recruiter123! | Alternative recruiter account |
| Panelist | robert.panelist@techcorp.com | Panelist123! | Interview evaluation |
| Candidate | emily.candidate@email.com | Candidate123! | Job browsing, applications |
| Candidate | james.candidate@email.com | Candidate123! | Alternative candidate account |

### Customizing Seed Data

You can modify the seed script to create custom test data that matches your specific testing needs. The script is located at `scripts/seed.mjs` and is well-commented for easy customization.

To add more candidates, modify the `SAMPLE_CANDIDATES` array:

```javascript
const SAMPLE_CANDIDATES = [
  {
    name: 'Your Custom Candidate',
    email: 'custom@email.com',
    password: 'Candidate123!',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: 5,
    location: 'San Francisco, CA',
    // ... additional fields
  },
  // ... existing candidates
];
```

To add more job postings, modify the `SAMPLE_JOBS` array:

```javascript
const SAMPLE_JOBS = [
  {
    title: 'Your Custom Job Title',
    companyName: 'Your Company',
    description: 'Detailed job description...',
    requirements: ['Requirement 1', 'Requirement 2'],
    location: 'Remote',
    salaryMin: 80000,
    salaryMax: 120000,
    // ... additional fields
  },
  // ... existing jobs
];
```

After modifying the seed script, re-run it to apply your changes:

```bash
pnpm db:seed
```

### Resetting Seed Data

To clear existing data and re-run the seed script with fresh data:

```bash
# Option 1: Drop and recreate the database
mysql -u root -p -e "DROP DATABASE hotgigs; CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm db:push
pnpm db:seed

# Option 2: Use the database backup/restore scripts
./scripts/backup-database.sh  # Create a backup first
./scripts/restore-database.sh backups/empty_schema.sql  # Restore empty schema
pnpm db:seed
```

## Understanding the Budget Initialization Script

The `initialize-budgets.mjs` script sets up default monthly budget limits for company accounts, enabling cost control and usage tracking.

### Purpose and Importance

Budget management is a critical feature for companies using the HotGigs platform to control recruitment spending. The initialize-budgets script serves several key purposes in the platform's financial management system.

It **establishes spending limits** by assigning a default $500/month budget to all companies without existing budgets, preventing unlimited spending on AI features and premium services, and establishing baseline budget tracking for new companies.

The script **enables cost tracking** through automatic monitoring of AI API usage costs (resume parsing, candidate matching, interview evaluation), job posting fees for premium listings, premium feature consumption (video interviews, advanced analytics), and email campaign costs.

It **supports financial planning** by providing visibility into recruitment costs across the organization, enabling budget alerts and notifications when approaching limits, facilitating cost allocation across departments or teams, and helping companies forecast recruitment expenses.

### What the Script Does

The initialize-budgets script performs several operations to establish budget controls:

1. **Identifies companies without budgets**: Queries the database for company records that don't have corresponding budget entries in the `company_budgets` table.

2. **Creates default budget entries**: Inserts new budget records with these default values:
   - Monthly budget limit: $500
   - Current spending: $0
   - Billing cycle: Monthly, starting from current date
   - Alert thresholds: 80% (warning) and 100% (limit reached)

3. **Enables budget notifications**: Activates automatic email notifications when companies approach or exceed their budget limits.

4. **Logs initialization results**: Provides detailed output showing how many companies were initialized with budgets.

### When to Run the Script

Run the budget initialization script in several scenarios:

**After initial deployment**: When first setting up the platform, run the script to establish budgets for all companies created during the seeding process.

**After adding new companies**: Whenever new client companies are onboarded to the platform, run the script to ensure they have budget entries.

**After data migration**: If you migrate data from another system or restore from a backup, run the script to ensure all companies have budget records.

**Periodic maintenance**: Schedule the script to run monthly as part of regular maintenance to catch any companies that might be missing budget entries.

**Before budget reporting**: Run the script before generating financial reports to ensure all companies are included in budget analysis.

### Running the Budget Initialization Script

The script requires the application server to be running because it calls a tRPC API endpoint. Follow these steps:

**Step 1: Start the application server** (if not already running):

```bash
pnpm dev
```

Wait for the server to fully start. You should see:

```
Server running on http://localhost:3000/
```

**Step 2: Run the budget initialization script** in a separate terminal:

```bash
node scripts/initialize-budgets.mjs
```

The script connects to the running application and calls the `budgetManagement.initializeDefaultBudgets` tRPC procedure.

**Step 3: Review the output**:

```
[Budget Init] Starting budget initialization...
[Budget Init] Connecting to API at http://localhost:3000
[Budget Init] Success: { result: { data: { initialized: 5 } } }
[Budget Init] Initialized 5 company budgets
[Budget Init] All companies now have budget entries
```

The output shows how many companies were initialized with default budgets.

### Script Configuration

The script can be configured through environment variables:

```bash
# Set custom API URL (default: http://localhost:3000)
API_URL=http://localhost:3000 node scripts/initialize-budgets.mjs

# For production deployments
API_URL=https://hotgigs.yourdomain.com node scripts/initialize-budgets.mjs
```

### Customizing Default Budget Amounts

To change the default budget amount, modify the backend tRPC procedure in `server/routers.ts`:

```typescript
initializeDefaultBudgets: protectedProcedure
  .mutation(async ({ ctx }) => {
    // Change this value to set a different default budget
    const DEFAULT_MONTHLY_BUDGET = 1000; // Changed from $500 to $1000
    
    // Find companies without budgets
    const companiesWithoutBudgets = await ctx.db
      .select()
      .from(companies)
      .leftJoin(companyBudgets, eq(companies.id, companyBudgets.companyId))
      .where(isNull(companyBudgets.id));
    
    // Create default budget entries
    const budgetEntries = companiesWithoutBudgets.map(({ companies: company }) => ({
      companyId: company.id,
      monthlyBudget: DEFAULT_MONTHLY_BUDGET,
      currentSpending: 0,
      billingCycleStart: new Date(),
      alertThreshold: 0.8, // 80% warning
    }));
    
    await ctx.db.insert(companyBudgets).values(budgetEntries);
    
    return { initialized: budgetEntries.length };
  }),
```

After modifying the code, restart the application server and re-run the script.

### Verifying Budget Initialization

After running the script, verify that budgets were created correctly:

**Option 1: Using MySQL command line**:

```bash
mysql -u hotgigs -p hotgigs -e "SELECT c.name, cb.monthlyBudget, cb.currentSpending FROM companies c LEFT JOIN company_budgets cb ON c.id = cb.companyId;"
```

**Option 2: Using phpMyAdmin**:

1. Navigate to http://localhost:8080
2. Log in with root credentials
3. Select the `hotgigs` database
4. Browse the `company_budgets` table
5. Verify all companies have budget entries

**Option 3: Using the application**:

1. Log in as a company admin
2. Navigate to Settings → Budget Management
3. Verify the budget limit and current spending are displayed

### Budget Tracking and Alerts

Once budgets are initialized, the platform automatically tracks spending and sends alerts:

**Automatic Tracking**: Every AI API call, job posting, and premium feature usage is logged and added to the company's current spending.

**80% Warning Alert**: When a company reaches 80% of their monthly budget, an email alert is sent to company admins warning them they're approaching their limit.

**100% Limit Alert**: When a company reaches 100% of their monthly budget, an email alert is sent and certain features may be restricted until the next billing cycle or the budget is increased.

**Monthly Reset**: At the start of each billing cycle (typically the 1st of the month), the `currentSpending` is reset to $0 and tracking begins for the new month.

### Managing Budgets

Company admins can manage their budgets through the platform interface:

1. Log in as a company admin
2. Navigate to **Settings → Budget Management**
3. View current budget limit and spending
4. Request budget increases by contacting platform administrators
5. View spending history and detailed usage reports

Platform administrators can modify budgets directly in the database or through admin tools:

```sql
-- Increase budget for a specific company
UPDATE company_budgets 
SET monthlyBudget = 1000 
WHERE companyId = 'company-id-here';

-- Reset current spending (use with caution)
UPDATE company_budgets 
SET currentSpending = 0 
WHERE companyId = 'company-id-here';
```

## Post-Installation Steps

After completing the installation using any of the three methods, follow these steps to ensure everything is configured correctly and to familiarize yourself with the platform.

### Verify All Services Are Running

Check that all required services are operational:

**Application Server**: Navigate to http://localhost:3000 and confirm the home page loads without errors.

**Database**: Test database connectivity by logging in with a demo account or checking the application logs for successful database connections.

**Development Tools**: Open browser developer tools (F12) and check the Console tab for any error messages. The Network tab should show successful API requests.

### Test Core Features

Verify key platform features are working correctly:

**Authentication**: Log in with a demo account to ensure OAuth or password authentication is functioning.

**Job Browsing**: Navigate to the jobs page and verify job listings are displayed correctly.

**Candidate Profiles**: View candidate profiles to ensure data is loading from the database.

**AI Features**: Try uploading a resume or running a candidate-job match to verify OpenAI integration is working.

**Email Notifications**: Trigger an email notification (like applying for a job) to verify email service integration.

### Configure Additional Settings

Customize the platform for your needs:

**Branding**: Update `VITE_APP_TITLE` and `VITE_APP_LOGO` in your `.env` file to customize the application name and logo.

**Email Templates**: Review and customize email templates in `server/email-templates/` for notifications.

**Company Settings**: Log in as a company admin and configure company-specific settings like budget limits, notification preferences, and branding.

### Set Up Development Tools

Configure your development environment for optimal productivity:

**IDE Configuration**: If using VS Code, install recommended extensions (ESLint, Prettier, Tailwind CSS IntelliSense).

**Database Tools**: Set up a database client like MySQL Workbench or DBeaver for easier database management.

**API Testing**: Install tools like Postman or Insomnia for testing tRPC endpoints.

### Review Documentation

Familiarize yourself with the platform's documentation:

- **README.md**: Project overview and quick start guide
- **DEPLOYMENT.md**: Comprehensive deployment instructions
- **API.md**: tRPC API endpoint documentation
- **CONTRIBUTING.md**: Guidelines for contributing to the project
- **LLM_INTEGRATION.md**: Details on AI feature integration

### Join the Community

Connect with other developers and users:

- **GitHub Issues**: Report bugs or request features at https://github.com/businessintelli/hotgigscom/issues
- **Community Forum**: Join discussions and ask questions
- **Slack Channel**: Connect with the development team and other users

## Troubleshooting

### Common Installation Issues

**Issue: Node.js version too old**

Symptoms: Installation script fails with "Node.js 20.x or higher is required"

Solution: Update Node.js to version 20 or higher. Download from [nodejs.org](https://nodejs.org/) or use a version manager like nvm:

```bash
# Using nvm
nvm install 20
nvm use 20
```

**Issue: pnpm command not found**

Symptoms: "pnpm: command not found" error when running installation commands

Solution: Install pnpm globally:

```bash
npm install -g pnpm
```

**Issue: MySQL connection refused**

Symptoms: "Error: connect ECONNREFUSED 127.0.0.1:3306" in application logs

Solution: Ensure MySQL is running and accessible:

```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql

# Test connection
mysql -u hotgigs -p
```

**Issue: Database migrations fail**

Symptoms: "Error: Table already exists" or "Migration failed" when running `pnpm db:push`

Solution: Check current database state and reset if necessary:

```bash
# View existing tables
mysql -u hotgigs -p hotgigs -e "SHOW TABLES;"

# If tables exist and you want to start fresh (WARNING: deletes all data)
mysql -u hotgigs -p -e "DROP DATABASE hotgigs; CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Re-run migrations
pnpm db:push
```

**Issue: OpenAI API errors**

Symptoms: "OpenAI API error" or "Invalid API key" when using AI features

Solution: Verify your OpenAI API key:

1. Check the key is correctly set in `.env`: `OPENAI_API_KEY=sk-...`
2. Verify the key is valid at https://platform.openai.com/api-keys
3. Check your OpenAI account has available credits
4. Test the key with curl:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Issue: Port 3000 already in use**

Symptoms: "Error: listen EADDRINUSE: address already in use :::3000"

Solution: Find and stop the process using port 3000, or change the port:

```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3001
```

**Issue: Seed script fails**

Symptoms: Errors when running `pnpm db:seed`

Solution: Ensure migrations are up to date and database is accessible:

```bash
# Re-run migrations
pnpm db:push

# Check database connectivity
mysql -u hotgigs -p hotgigs -e "SELECT 1;"

# Try seeding again
pnpm db:seed
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check application logs**: Look for error messages in the terminal where you started the dev server
2. **Review browser console**: Open developer tools (F12) and check for JavaScript errors
3. **Search GitHub issues**: https://github.com/businessintelli/hotgigscom/issues
4. **Ask the community**: Post your question in the community forum or Slack channel
5. **Contact support**: Email support@hotgigs.com for assistance

### Diagnostic Commands

Use these commands to gather information for troubleshooting:

```bash
# Check Node.js and pnpm versions
node --version
pnpm --version

# Check MySQL status and version
mysql --version
sudo systemctl status mysql

# Test database connection
mysql -u hotgigs -p hotgigs -e "SELECT 1;"

# View application logs
pnpm dev 2>&1 | tee app.log

# Check environment variables
cat .env | grep -v "PASSWORD\|SECRET\|KEY"

# View database tables
mysql -u hotgigs -p hotgigs -e "SHOW TABLES;"

# Check disk space
df -h

# Check available memory
free -h
```

---

## Additional Resources

- **GitHub Repository**: https://github.com/businessintelli/hotgigscom
- **Deployment Guide**: See DEPLOYMENT.md for production deployment instructions
- **API Documentation**: See API.md for tRPC endpoint documentation
- **Contributing Guide**: See CONTRIBUTING.md for development guidelines
- **License**: MIT License - see LICENSE file for details

---

**Document Version**: 1.0  
**Last Updated**: December 19, 2025  
**Maintained By**: HotGigs Development Team

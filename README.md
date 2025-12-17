# HotGigs - AI-Powered Recruitment Platform

A comprehensive multi-tenant SaaS recruitment platform with AI-powered candidate matching, resume parsing, video interviews, and automated workflows.

## 🚀 Features

### Core Recruitment Features
- **Multi-Tenant Architecture**: 4-tier role system (Admin, Company Admin, Recruiter, Candidate)
- **Job Management**: Create, edit, and manage job postings with AI-generated descriptions
- **Application Tracking**: Complete ATS with status tracking and pipeline management
- **Resume Management**: Multiple resume profiles per candidate with AI parsing
- **Video Introductions**: 15-minute video recordings for candidate profiles

### AI-Powered Features
- **AI Resume Parsing**: Automatic extraction of skills, experience, and education
- **AI Matching Algorithm**: Intelligent candidate-job matching with percentage scores
- **AI Interview System**: Automated video interviews with transcription and evaluation
- **AI Career Coach**: Context-aware AI assistant for candidates
- **AI Recruiting Assistant**: Data-driven insights for recruiters
- **Predictive Success Scoring**: ML-based application ranking
- **Bias Detection**: Automated fairness checks for resumes and job descriptions

### Advanced Automation
- **Automated Candidate Sourcing**: LinkedIn and GitHub profile discovery
- **Email Campaign Management**: Personalized outreach with follow-up sequences
- **Auto-Scheduling**: Intelligent interview booking for high-scoring candidates
- **Interview Reminders**: Automated 24h and 1h email notifications
- **Application Status Notifications**: Real-time updates via email and in-app

### Interview Management
- **Multiple Interview Types**: Phone, Video, In-Person, AI Bot
- **Interview Panel Management**: Invite panel members, collect feedback
- **Video Conferencing Integration**: Zoom and Microsoft Teams
- **Calendar Integration**: Google Calendar, Outlook, Calendly
- **Interview Feedback System**: Structured evaluation with ratings

### Analytics & Reporting
- **Recruitment Analytics**: Funnel metrics, time-to-hire, conversion rates
- **Email Campaign Analytics**: Open rates, click rates, response tracking
- **Automation Analytics**: ROI tracking for sourcing and scheduling
- **Custom Report Builder**: Drag-and-drop report creation
- **Scheduled Reports**: Automated email delivery of reports

### Communication
- **Real-Time Messaging**: Recruiter-candidate communication
- **Email Notifications**: Comprehensive notification system
- **Notification Preferences**: Granular control over email alerts
- **In-App Notifications**: Real-time notification bell with unread badges

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **React Query** for data fetching

### Backend
- **Node.js 22** with TypeScript
- **Express 4** web framework
- **tRPC 11** for API layer
- **Drizzle ORM** for database
- **MySQL 8.0** database
- **Redis** for caching (optional)

### AI & ML
- **OpenAI GPT-4** for LLM features
- **Manus Forge API** for built-in AI services
- **Whisper API** for voice transcription
- **face-api.js** for fraud detection

### Infrastructure
- **Docker** for containerization
- **MinIO** for S3-compatible storage
- **SendGrid/Resend** for email delivery
- **Zoom/Teams** for video conferencing

## 📋 Prerequisites

- **Node.js** 22.x or higher
- **pnpm** 10.x or higher
- **MySQL** 8.0 or higher
- **Docker** & Docker Compose (for containerized deployment)
- **OpenAI API Key** (for AI features)
- **SendGrid or Resend API Key** (for email)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hotgigs-platform.git
cd hotgigs-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Set up the database**
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
pnpm db:push

# Seed sample data (optional)
pnpm db:seed
```

5. **Start the development server**
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Docker Deployment

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hotgigs-platform.git
cd hotgigs-platform
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec app pnpm db:push
```

5. **Seed sample data (optional)**
```bash
docker-compose exec app pnpm db:seed
```

6. **Access the application**
- **Application**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **MinIO Console**: http://localhost:9001

## 📚 Documentation

### Database Schema
The platform uses 70+ tables organized into these categories:
- **Core**: users, companies, roles
- **Recruitment**: jobs, applications, interviews
- **Candidates**: profiles, resumes, skills
- **AI**: predictions, matching, evaluations
- **Communication**: messages, notifications, emails
- **Analytics**: metrics, reports, logs

### API Documentation
The platform uses tRPC for type-safe APIs. Key routers:
- `auth`: Authentication and session management
- `candidate`: Candidate profile and applications
- `recruiter`: Job management and candidate review
- `companyAdmin`: Company-wide administration
- `admin`: Platform administration

### LLM Integration
The platform integrates with multiple AI services:

**Manus Forge API** (Built-in):
- Automatic configuration via environment variables
- No manual setup required
- Includes LLM, storage, notifications

**OpenAI API** (Optional):
- Set `OPENAI_API_KEY` in environment
- Used for advanced AI features
- Fallback to Manus API if not configured

**Usage Example**:
```typescript
import { invokeLLM } from './server/_core/llm';

const response = await invokeLLM({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Analyze this resume...' }
  ]
});
```

## 🔐 Default Accounts

After seeding, these accounts are available:

**Platform Admin**:
- Email: `info@hotgigs.com`
- Password: `Admin123!`
- Role: `admin`

**Company Admin**:
- Email: `pratap@businessintelli.com`
- Password: `Demo123!`
- Role: `company_admin`

**Recruiter**:
- Email: `bhimireddy@gmail.com`
- Password: `Demo123!`
- Role: `recruiter`

**Candidate**:
- Email: `pathmaker@gmail.com`
- Password: `Demo123!`
- Role: `candidate`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 📦 Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Run database migrations
docker-compose exec app pnpm db:push

# Seed database
docker-compose exec app pnpm db:seed

# Access MySQL shell
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs

# Access Redis CLI
docker-compose exec redis redis-cli
```

## 🔧 Configuration

### Email Service
Configure either SendGrid or Resend:

**SendGrid**:
```env
SENDGRID_API_KEY=SG.your-api-key
```

**Resend**:
```env
RESEND_API_KEY=re_your-api-key
```

### Video Conferencing
Configure Zoom or Microsoft Teams:

**Zoom**:
```env
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
ZOOM_ACCOUNT_ID=your-account-id
```

**Microsoft Teams**:
```env
TEAMS_CLIENT_ID=your-client-id
TEAMS_CLIENT_SECRET=your-client-secret
TEAMS_TENANT_ID=your-tenant-id
```

### File Storage
Configure S3-compatible storage:

**AWS S3**:
```env
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=hotgigs-files
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
```

**MinIO (Local)**:
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
```

## 📊 Database Management

### Migrations
```bash
# Generate migration
pnpm db:generate

# Apply migrations
pnpm db:push

# Drop database (caution!)
pnpm db:drop
```

### Seeding
```bash
# Seed comprehensive sample data
pnpm db:seed

# Seed coding challenges
node server/scripts/seed-challenges.mjs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@hotgigs.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Built with [Manus Platform](https://manus.im)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

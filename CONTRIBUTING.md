# Contributing to HotGigs Platform

Thank you for your interest in contributing to HotGigs! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Submitting Changes](#submitting-changes)
7. [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- pnpm 10.x or higher
- MySQL 8.0 or higher
- Docker (optional, for containerized development)

### Setup Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/hotgigs-platform.git
cd hotgigs-platform
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/hotgigs-platform.git
```

4. **Install dependencies**:
```bash
pnpm install
```

5. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. **Set up database**:
```bash
pnpm db:push
pnpm db:seed
```

7. **Start development server**:
```bash
pnpm dev
```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Creating a Feature Branch

```bash
# Update your local repository
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write code** following our coding standards
2. **Test your changes** thoroughly
3. **Commit your changes** with clear messages
4. **Push to your fork**
5. **Create a Pull Request**

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(candidate): add resume parsing with AI

Implement automatic resume parsing using OpenAI API to extract
skills, experience, and education from uploaded PDF/DOCX files.

Closes #123
```

```
fix(recruiter): resolve application status update bug

Fix issue where application status wasn't updating correctly
when recruiter changed status from the dashboard.

Fixes #456
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types
- Use proper type annotations

**Good**:
```typescript
interface Candidate {
  id: number;
  name: string;
  email: string;
}

function getCandidateById(id: number): Promise<Candidate | null> {
  // implementation
}
```

**Bad**:
```typescript
function getCandidateById(id: any): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Implement error boundaries

**Good**:
```typescript
interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (id: number) => void;
}

export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  return (
    <div onClick={() => onSelect(candidate.id)}>
      <h3>{candidate.name}</h3>
      <p>{candidate.email}</p>
    </div>
  );
}
```

### tRPC Procedures

- Use proper input validation with Zod
- Implement proper error handling
- Use `protectedProcedure` for authenticated endpoints
- Keep procedures focused and single-purpose

**Good**:
```typescript
getCandidateById: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    const candidate = await db.getCandidateById(input.id);
    if (!candidate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Candidate not found',
      });
    }
    return candidate;
  }),
```

### Database Queries

- Use Drizzle ORM for all database operations
- Keep queries in `server/db.ts`
- Use transactions for multi-step operations
- Implement proper error handling

**Good**:
```typescript
export async function createApplication(data: NewApplication) {
  return await db.insert(applications).values(data).returning();
}

export async function getApplicationById(id: number) {
  return await db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      candidate: true,
      job: true,
    },
  });
}
```

### Styling

- Use Tailwind CSS for styling
- Use shadcn/ui components when possible
- Keep custom CSS minimal
- Follow mobile-first approach

**Good**:
```tsx
<div className="flex flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
  <Card className="flex-1">
    <CardHeader>
      <CardTitle>Candidate Profile</CardTitle>
    </CardHeader>
    <CardContent>
      {/* content */}
    </CardContent>
  </Card>
</div>
```

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Database queries
- Business logic

```typescript
import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from './matching';

describe('calculateMatchScore', () => {
  it('should return 100 for perfect match', () => {
    const score = calculateMatchScore(
      ['JavaScript', 'TypeScript', 'React'],
      ['JavaScript', 'TypeScript', 'React']
    );
    expect(score).toBe(100);
  });

  it('should return 0 for no match', () => {
    const score = calculateMatchScore(
      ['JavaScript', 'TypeScript'],
      ['Python', 'Django']
    );
    expect(score).toBe(0);
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
import { describe, it, expect } from 'vitest';
import { createCaller } from '../routers';

describe('candidate router', () => {
  it('should get candidate by id', async () => {
    const caller = createCaller({ user: mockUser });
    const candidate = await caller.candidate.getById({ id: 1 });
    expect(candidate).toBeDefined();
    expect(candidate.id).toBe(1);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Submitting Changes

### Pull Request Process

1. **Update your branch** with latest changes:
```bash
git checkout develop
git pull upstream develop
git checkout feature/your-feature-name
git rebase develop
```

2. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

3. **Create Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference related issues
   - Describe your changes
   - Add screenshots for UI changes
   - Check all CI tests pass

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Code Review Process

- All PRs require at least one approval
- Address all review comments
- Keep PRs focused and reasonably sized
- Be responsive to feedback

## Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., 22.0.0]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Mockups, examples, or other context
```

## Development Tips

### Database Changes

1. **Update schema** in `drizzle/schema.ts`
2. **Generate migration**: `pnpm db:generate`
3. **Apply migration**: `pnpm db:push`
4. **Update seed script** if needed

### Adding New Features

1. **Database**: Update schema if needed
2. **Backend**: Add procedures to routers
3. **Frontend**: Create UI components
4. **Tests**: Add unit and integration tests
5. **Documentation**: Update README and docs

### Debugging

**Backend**:
```bash
# Enable debug logging
LOG_LEVEL=debug pnpm dev
```

**Frontend**:
```typescript
// Use React DevTools
// Add console.log for debugging
console.log('Debug info:', data);
```

**Database**:
```bash
# Access MySQL shell
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs

# View query logs
docker-compose logs mysql
```

## Questions?

- Open an issue for questions
- Join our Discord community
- Email: dev@hotgigs.com

Thank you for contributing to HotGigs! 🎉

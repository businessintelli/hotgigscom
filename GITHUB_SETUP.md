# GitHub Setup Guide

This guide explains how to push the HotGigs platform to GitHub and set up the repository.

## Prerequisites

- GitHub account
- Git installed locally
- SSH key configured with GitHub (recommended) or HTTPS credentials

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `hotgigs-platform` (or your preferred name)
   - **Description**: "AI-Powered Recruitment Platform with Resume Parsing, Video Interviews, and Automated Workflows"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Linux: See https://github.com/cli/cli#installation
# Windows: See https://github.com/cli/cli#installation

# Login to GitHub
gh auth login

# Create repository
gh repo create hotgigs-platform --public --description "AI-Powered Recruitment Platform"
# Or for private:
gh repo create hotgigs-platform --private --description "AI-Powered Recruitment Platform"
```

## Step 2: Initialize Git Repository (if not already done)

```bash
cd /path/to/hotgigs-platform

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: HotGigs Platform with AI-powered recruitment features"
```

## Step 3: Connect to GitHub Repository

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/hotgigs-platform.git

# Or using SSH (recommended):
git remote add origin git@github.com:YOUR_USERNAME/hotgigs-platform.git

# Verify remote
git remote -v
```

## Step 4: Push to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 5: Verify Upload

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/hotgigs-platform`
2. Verify all files are present
3. Check that README.md is displayed on the repository homepage

## Step 6: Configure Repository Settings

### Branch Protection (Recommended for teams)

1. Go to repository Settings → Branches
2. Click "Add rule" under "Branch protection rules"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Save changes

### Secrets for GitHub Actions

If you want to use the CI/CD workflow, add these secrets:

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add these secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token

### Topics (for discoverability)

1. Go to repository homepage
2. Click the gear icon next to "About"
3. Add topics:
   - `recruitment`
   - `ai`
   - `typescript`
   - `react`
   - `nodejs`
   - `mysql`
   - `docker`
   - `trpc`
   - `ats`
   - `hiring`

## Step 7: Create Development Branch (Optional)

```bash
# Create and switch to develop branch
git checkout -b develop

# Push develop branch
git push -u origin develop
```

## Common Git Commands

### Daily Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: add new feature"

# Push changes
git push

# Pull latest changes
git pull
```

### Branch Management

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# List branches
git branch -a

# Delete branch
git branch -d feature/old-feature
```

### Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View changes
git diff
```

## Troubleshooting

### Authentication Issues

**HTTPS Authentication**:
```bash
# Use personal access token instead of password
# Create token at: https://github.com/settings/tokens
```

**SSH Authentication**:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub
# Copy key: cat ~/.ssh/id_ed25519.pub
# Add at: https://github.com/settings/keys
```

### Large Files

If you have files larger than 100MB:

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd"
git lfs track "*.mp4"

# Add .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

### Removing Sensitive Data

If you accidentally committed sensitive data:

```bash
# Remove file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (caution!)
git push origin --force --all
```

**Better approach**: Use environment variables and never commit `.env` files.

### Undoing Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Discard local changes
git checkout -- filename.txt

# Discard all local changes
git reset --hard HEAD
```

## Best Practices

### Commit Messages

Follow Conventional Commits:

```
feat: add AI resume parsing
fix: resolve application status bug
docs: update deployment guide
style: format code with prettier
refactor: reorganize database queries
test: add unit tests for matching algorithm
chore: update dependencies
```

### .gitignore

Ensure these are in `.gitignore`:

```
node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
```

### Security

**Never commit**:
- `.env` files
- API keys
- Passwords
- Private keys
- Sensitive user data

**Always use**:
- Environment variables
- GitHub Secrets for CI/CD
- `.env.example` for documentation

## Next Steps

After pushing to GitHub:

1. **Add collaborators**: Settings → Collaborators
2. **Set up GitHub Actions**: Workflows will run automatically
3. **Create issues**: Track bugs and features
4. **Set up project board**: Organize tasks
5. **Write wiki**: Document architecture and processes
6. **Enable discussions**: Community engagement

## Resources

- [GitHub Documentation](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git LFS](https://git-lfs.github.com/)

## Support

If you encounter issues:

1. Check GitHub Status: https://www.githubstatus.com/
2. Review Git documentation
3. Search GitHub Community: https://github.community/
4. Open an issue in the repository

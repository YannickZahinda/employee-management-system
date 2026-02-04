#!/bin/bash

echo "🚀 Setting up GitHub repository..."

# Create directories
mkdir -p .github/ISSUE_TEMPLATE .github/workflows

# Create workflows
cp .github/workflows/ci.yml .github/workflows/
cp .github/workflows/pr-quality.yml .github/workflows/
cp .github/workflows/auto-assign.yml .github/workflows/
cp .github/workflows/project-automation.yml .github/workflows/
cp .github/workflows/release.yml .github/workflows/

# Create issue templates
cp .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/
cp .github/ISSUE_TEMPLATE/feature_request.md .github/ISSUE_TEMPLATE/
cp .github/ISSUE_TEMPLATE/security.md .github/ISSUE_TEMPLATE/

# Create other GitHub files
cp .github/PULL_REQUEST_TEMPLATE.md .github/
cp .github/SECURITY.md .github/
cp .github/CODEOWNERS .github/

# Create CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Docker, PostgreSQL, Redis
- Complete authentication system with JWT
- Employee CRUD operations
- Attendance tracking system
- Email queue processing
- Swagger API documentation
- GitHub Actions CI/CD pipeline
- Issue templates and project automation
EOF

echo "✅ GitHub setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository"
echo "2. Add secrets to repository:"
echo "   - DOCKERHUB_USERNAME"
echo "   - DOCKERHUB_TOKEN"
echo "   - SLACK_WEBHOOK_URL (optional)"
echo "   - SNYK_TOKEN (optional)"
echo "3. Create a GitHub Project board"
echo "4. Push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/employee-management.git"
echo "   git push -u origin main"
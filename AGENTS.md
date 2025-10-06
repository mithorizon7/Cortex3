# AGENTS.md - CORTEX™ Executive AI Readiness Assessment

**Repository:** CORTEX  
**Last Updated:** September 15, 2025  
**Version:** 1.0.0

## 1. Purpose and Scope

### Repository Overview
CORTEX is a web-based executive AI readiness assessment platform that helps leadership teams evaluate their organization's preparedness for AI adoption. The system provides a structured assessment flow consisting of a context profile questionnaire, pulse check evaluation, and comprehensive results with tailored guidance.

### Directory Structure
```
├── client/src/           # React frontend application
├── server/              # Express.js backend API
├── shared/              # Shared types, schemas, and utilities
├── tests/               # Test suites (unit, integration, e2e)
├── docs/                # Project documentation
└── AGENTS.md           # This file - agent instructions
```

### AGENTS Hierarchy
- This root AGENTS.md governs the entire repository
- Nested AGENTS.md files may override these rules within their subdirectories
- All automated agents and contributors must follow these guidelines

## 2. Coding Standards

### Language Versions
- **Node.js:** 20+ (primary runtime)
- **TypeScript:** Latest stable version
- **React:** 18+ with modern hooks pattern

### Style Guide
- **TypeScript/JavaScript:** Follow existing ESLint configuration
- **React:** Functional components with hooks, no class components
- **CSS:** Tailwind CSS utility-first approach with shadcn/ui components
- **Visual Design:** Follow the CORTEX Color Style Guide (see `docs/STYLE_GUIDE.md`)
  - Comprehensive color palette and usage guidelines
  - 60-30-10 color distribution (neutral base, secondary accents, primary brand)
  - Accessibility and semantic color requirements
  - Quick reference available in `docs/STYLE_GUIDE_QUICK_REFERENCE.md`

### Naming Conventions
- **Files:** kebab-case (e.g., `context-profile.tsx`, `assessment-service.ts`)
- **Components:** PascalCase (e.g., `ContextProfile`, `AssessmentService`)
- **Functions/Variables:** camelCase (e.g., `createAssessment`, `userId`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `ASSESSMENT_CONFIG`)
- **Types/Interfaces:** PascalCase (e.g., `Assessment`, `ContextProfile`)

### Formatting Rules
- **Indentation:** 2 spaces (no tabs)
- **Line Length:** 100 characters maximum
- **Import Ordering:** External packages → internal modules → relative imports
- **Semicolons:** Required for TypeScript/JavaScript
- **Quotes:** Single quotes for strings, double quotes for JSX attributes

### Comment & Documentation Style
- **TypeScript:** JSDoc comments for public APIs
- **React Components:** JSDoc with component description and prop types
- **Functions:** Describe purpose, parameters, and return values
- **Inline Comments:** Explain complex business logic, especially assessment algorithms

## 3. Repository Workflow

### Branching Model
- **Main Branch:** Direct commits allowed for maintainers
- **Feature Development:** Feature branches → Pull Requests for external contributors
- **Hotfixes:** Direct to main with immediate testing

### Commit Message Format
Follow Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
Scopes: `frontend`, `backend`, `shared`, `tests`, `docs`

Examples:
- `feat(frontend): add options studio comparison interface`
- `fix(backend): resolve database connection timeout in storage.ts`
- `docs: update AGENTS.md with new testing requirements`

### Pull Request Requirements
- **Approval:** At least one maintainer review required
- **Testing:** All tests must pass
- **Type Safety:** No TypeScript compilation errors
- **Documentation:** Update relevant docs if needed
- **Rebase Strategy:** Squash and merge for cleaner history

## 4. Testing & Verification

### Running Tests
```bash
# Full test suite
npx vitest run

# Watch mode for development
npx vitest

# Specific test files
npx vitest run tests/unit/assessment.service.test.ts

# Coverage report
npx vitest run --coverage
```

### Code Quality Commands
```bash
# Type checking
npx tsc --noEmit

# Linting (automatic via TypeScript LSP)
# No separate linter - rely on TypeScript compiler

# Code formatting (automatic via Prettier integration)
# Formatting handled by editor/IDE integration
```

### Testing Standards
- **Unit Tests:** Required for all service classes and utility functions
- **Integration Tests:** Required for API endpoints and database operations
- **E2E Tests:** Required for critical user flows (assessment completion)
- **Coverage:** Minimum 90% for business logic, 80% overall
- **Test Structure:** Use descriptive test names and organize by feature

### Continuous Integration
- Tests run automatically on workflow restart
- All tests must pass before considering changes complete
- Use `run_test` tool for playwright-based feature testing

## 5. File & Directory Conventions

### Frontend Structure (`client/src/`)
```
components/
├── ui/                 # shadcn/ui components
├── auth/              # Authentication components
├── navigation/        # Navigation components
└── [feature].tsx      # Feature-specific components

pages/                 # Route components
hooks/                 # Custom React hooks
lib/                   # Utility libraries
contexts/              # React contexts
```

### Backend Structure (`server/`)
```
services/              # Business logic services
middleware/            # Express middleware
utils/                 # Utility functions
lib/                   # External service integrations
constants/             # Application constants
```

### Shared Structure (`shared/`)
```
schema.ts             # Database schemas and types
options-studio-data.ts # Options Studio content
scale-utils.ts        # Scaling and utility functions
```

### Testing Structure (`tests/`)
```
unit/                 # Unit tests
integration/          # Integration tests
e2e/                  # End-to-end tests
```

### File Placement Rules
- **Components:** Place in appropriate subdirectory based on responsibility
- **Types:** Define in `shared/schema.ts` for cross-system types
- **Constants:** Place in `server/constants/` or component-level files
- **Tests:** Mirror source structure in `tests/` directory

## 6. Dependencies & Environment

### Supported Platforms
- **Primary:** Linux (Replit NixOS environment)
- **Development:** macOS, Windows (via WSL2)
- **Runtime:** Node.js 20+ on any Unix-like system

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database setup (if using PostgreSQL)
npm run db:push
```

### Dependency Management
- **Package Manager:** npm (lock file: `package-lock.json`)
- **Adding Dependencies:** Use `packager_tool` for automated installation
- **Version Updates:** Test thoroughly, especially for major versions
- **Security:** Regular dependency audits with `npm audit`

### Environment Variables
- **Frontend:** Prefix with `VITE_` for Vite access
- **Backend:** Standard Node.js environment variables
- **Database:** `DATABASE_URL` for PostgreSQL connection
- **Secrets:** Use Replit secrets management, never commit secrets

## 7. Documentation Rules

### Documentation Standards
- **API Documentation:** JSDoc comments for all public APIs
- **Component Documentation:** PropTypes and usage examples
- **README Updates:** Keep current with major feature changes
- **Architecture Documentation:** Update `replit.md` for system changes

### Documentation Locations
- **Project Overview:** `replit.md` (primary source of truth)
- **API Reference:** JSDoc comments in source code
- **User Guides:** Embedded in application interface
- **Agent Instructions:** This file (`AGENTS.md`)

### Maintenance Guidelines
- Update `replit.md` immediately after architectural changes
- Update `AGENTS.md` when adding new conventions or requirements
- Document breaking changes in commit messages
- Include documentation updates in feature PRs

## 8. Security & Privacy

### Secrets Management
- **Never commit:** API keys, passwords, tokens, private keys
- **Environment Variables:** Use Replit secrets for sensitive data
- **Database Credentials:** Always use `DATABASE_URL` environment variable
- **Client Secrets:** Use server-side proxy for sensitive API calls

### Security Practices
- **Input Sanitization:** Use DOMPurify for HTML content
- **XSS Prevention:** Sanitize all user inputs before rendering
- **Authentication:** Firebase Auth with proper token verification
- **Authorization:** Middleware-based user context and permissions
- **CORS:** Configured for allowed origins only

### Vulnerability Management
- **Dependency Scanning:** Regular `npm audit` checks
- **Security Updates:** Apply security patches immediately
- **Reporting:** Contact maintainers for security vulnerabilities
- **Disclosure:** Responsible disclosure with 90-day timeline

## 9. Communication & Support

### Issue Management
- **Bug Reports:** Use detailed issue templates with reproduction steps
- **Feature Requests:** Include business justification and acceptance criteria
- **Security Issues:** Private disclosure to maintainers
- **Questions:** Use discussion forums or issue tracker

### Development Process
- **Code Reviews:** Focus on security, performance, and maintainability
- **Testing:** Comprehensive test coverage for all changes
- **Documentation:** Update docs alongside code changes
- **Deployment:** Use Replit publishing for production releases

### Release Process
- **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH)
- **Changelog:** Document all user-facing changes
- **Deployment:** Automated via Replit publishing system
- **Rollback:** Checkpoint-based rollback available

## 10. Development Guidelines

### Code Quality Standards
- **Type Safety:** Strict TypeScript configuration, no `any` types
- **Error Handling:** Comprehensive error boundaries and user feedback
- **Performance:** Optimize for executive user experience
- **Accessibility:** WCAG 2.1 AA compliance for inclusive design
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)

### Testing Requirements
```bash
# Before committing changes
npx tsc --noEmit          # Type checking
npx vitest run            # Full test suite
# Manual testing of changed features
```

### PR Checklist
- [ ] TypeScript compilation passes
- [ ] All tests pass (unit, integration, e2e)
- [ ] Manual testing completed for changed features
- [ ] Documentation updated if needed
- [ ] Security considerations reviewed
- [ ] Performance impact assessed
- [ ] Accessibility verified for UI changes

## 11. Project-Specific Guidelines

### Assessment Logic
- **Context Profile:** 12 organizational context questions with validation
- **Pulse Check:** 18 binary questions across 6 domains
- **Scoring Algorithm:** Mathematical precision in pillar score calculations
- **Gate Evaluation:** Context-driven requirements based on risk factors

### Data Management
- **Storage:** Prefer in-memory storage for development
- **Database:** PostgreSQL with Drizzle ORM for production
- **Schemas:** Centralized in `shared/schema.ts`
- **Validation:** Zod schemas for runtime type checking

### UI/UX Requirements
- **Design System:** shadcn/ui with Tailwind CSS
- **Responsive:** Mobile-first responsive design
- **Accessibility:** Screen reader support and keyboard navigation
- **Performance:** Optimized loading and smooth interactions
- **Executive Focus:** Professional, clean interface for leadership use

## 12. Versioning & Maintenance

### Document Maintenance
- **Update Frequency:** With every significant repository change
- **Version Control:** Increment version number for major changes
- **Review Process:** Include AGENTS.md updates in relevant PRs
- **Validation:** Ensure guidelines remain practical and enforceable

### Contributing to AGENTS.md
1. Propose changes via Pull Request
2. Include justification for new or modified rules
3. Update version number and last updated date
4. Ensure consistency with existing conventions
5. Test proposed guidelines with real examples

### Nested AGENTS.md Files
- **Override Rules:** Subdirectory files can override root rules
- **Documentation:** Document any overrides clearly
- **Consistency:** Maintain alignment with root principles
- **Examples:** Provide specific examples for complex subdirectories

---

**Remember:** This document serves both human developers and automated agents. Keep instructions clear, specific, and actionable. When in doubt, prioritize security, user experience, and code maintainability.

**Questions or Suggestions?** Submit a Pull Request with proposed changes to improve these guidelines.
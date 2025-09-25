# CORTEX™ Executive AI Readiness Assessment

## Overview

CORTEX is a web-based executive AI readiness assessment platform that helps leadership teams evaluate their organization's preparedness for AI adoption. The application provides a structured assessment flow consisting of a context profile questionnaire, pulse check evaluation, and comprehensive results with tailored guidance. The system evaluates organizations across six core domains (Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution) to provide actionable insights for AI strategy and implementation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based single-page application (SPA) architecture built with TypeScript and Vite. The frontend follows a component-based design pattern with shadcn/ui components for consistent UI elements. The application uses Wouter for client-side routing, providing three main routes: context profile creation, pulse check assessment, and results display. State management is handled through React hooks and TanStack Query for server state management, enabling efficient data fetching and caching.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript. The architecture follows a layered approach with separate concerns for routing, storage, and business logic. The API provides endpoints for creating assessments, updating pulse responses, and retrieving results. Currently implements an in-memory storage solution for development, with the infrastructure ready for database integration through the storage abstraction layer.

### Data Storage Solutions
The application uses Drizzle ORM as the database abstraction layer with PostgreSQL as the target database (configured for Neon serverless). The schema defines assessments with JSONB fields for flexible storage of context profiles, pulse responses, pillar scores, and triggered gates. The current implementation includes an in-memory storage adapter for development purposes, with the production database configuration ready for deployment.

### Assessment Flow Design
The system implements a three-stage assessment workflow: context profile collection (12 organizational context questions), pulse check evaluation (18 binary questions across 6 domains), and results generation with context-aware guidance. The application calculates maturity scores based on pulse responses and applies context-driven "gates" or requirements based on the organization's risk profile and operational constraints.

### UI/UX Architecture
The interface uses a progress-based design with clear visual indicators for assessment completion. The results page features a distinctive honeycomb radar visualization with equal-area rings for maturity representation. The design system leverages CSS custom properties for theming and includes responsive layouts optimized for executive-level users who prefer clear, actionable insights over technical complexity.

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database for production data storage
- **Drizzle ORM**: Database toolkit and ORM for type-safe database operations
- **@neondatabase/serverless**: Neon-specific database driver for serverless environments

### Frontend Libraries
- **React & Ecosystem**: Core framework with React DOM for rendering
- **TanStack Query**: Server state management and data fetching with caching
- **React Hook Form**: Form state management with validation
- **Wouter**: Lightweight client-side routing solution
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling

### UI Component System
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for managing component variants
- **clsx & tailwind-merge**: Conditional class name utilities

### Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Static type checking for enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **Zod**: Schema validation for type-safe data handling

## Documentation Architecture

### Core Documentation Files
- **replit.md**: Primary project documentation and system overview (this file)
- **AGENTS.md**: Comprehensive guidelines for automated agents and contributors
- **README.md**: User-facing project introduction and setup instructions

### Documentation Maintenance Process
The project follows a structured documentation update process:
1. **Immediate Updates**: Update `replit.md` for architectural changes and user preferences
2. **Agent Guidelines**: Update `AGENTS.md` when adding new conventions, workflows, or requirements  
3. **Version Control**: Both documentation files are versioned and maintained alongside code changes
4. **Review Process**: Documentation updates are included in relevant Pull Requests
5. **Consistency**: All documentation must remain aligned with current system implementation

### Documentation Standards
- **Technical Accuracy**: All documentation must reflect current system state
- **Agent Compatibility**: Guidelines must be clear for both human developers and automated agents
- **User Focus**: Maintain simple, everyday language per user preferences
- **Completeness**: Cover security, testing, architecture, and development processes comprehensively

## Recent Changes

### User Dashboard Implementation (September 2025)
- **Assessment History Dashboard**: Created a comprehensive user dashboard at `/dashboard` route displaying assessment history with completed and in-progress sections
- **Enhanced User Experience**: Users can now easily access previous assessments, view completion status, and see overall maturity scores without bookmarking URLs
- **Secure API Integration**: Added authenticated `/api/assessments` endpoint with proper Firebase token validation to fetch user-specific assessment data
- **Storage Layer Enhancement**: Extended both DatabaseStorage and MemStorage with `getUserAssessments()` method for consistent data retrieval across storage implementations
- **Navigation Improvements**: Dashboard includes direct links to resume in-progress assessments and view completed results, significantly improving returning user experience

### Documentation & Agent Guidelines (September 2025)
- **AGENTS.md Creation**: Added comprehensive agent guidelines covering coding standards, workflows, testing, security, and project-specific requirements
- **Documentation Process**: Established structured maintenance process for keeping documentation current with system changes
- **Version Control**: Implemented versioning system for documentation files with update tracking

### Security & Production Readiness Enhancements (September 2025)
- **Critical Security Fixes**: Resolved XSS vulnerabilities by implementing DOMPurify sanitization with strict allowlists for HTML content rendering in value-overlay and chart components
- **Enhanced Accessibility**: Added skip navigation links, proper ARIA landmarks, and reduced motion support for users with motion sensitivity preferences
- **Performance Optimizations**: Enhanced font preloading, implemented proper easing functions, and added motion-safe CSS transitions
- **Design System Enhancement**: Added semantic design tokens following MIT-inspired color palette for improved consistency and maintainability

### Technical Stability Improvements (September 2025)
- **Test Suite Fixes**: Resolved all failing tests including DATABASE_URL dependencies, TypeScript compilation errors, and environment-specific middleware tests
- **Database Integration**: Implemented lazy database loading to support testing without database connections
- **Type Safety**: Fixed all TypeScript compilation issues across frontend and backend components
- **CI/CD Stability**: Achieved 124 passing tests across 13 test files with zero failures

### UI/UX Improvements (September 2025)
- **Header Consolidation**: Successfully consolidated double headers into a single AppHeader component with inline identity display and integrated Help functionality
- **Enhanced AppHeader**: Added flexible props system for route-specific customization including `showIdentityInline`, `identityText`, `showHelp`, and `onHelpClick`
- **Responsive Design**: Implemented responsive Help button behavior (text button on desktop, icon on mobile) with proper accessibility attributes
- **Executive-Focused Design**: Eliminated visual clutter and competing branding elements for a cleaner, more professional appearance
- **Comprehensive Testing**: Added E2E test coverage for header functionality across desktop and mobile viewports

### Assessment Logic
The application includes embedded assessment logic based on the CORTEX methodology, with predefined questions, scoring algorithms, and guidance content. Context-aware gate evaluation determines organizational requirements based on regulatory intensity, data sensitivity, and other risk factors collected in the context profile. The honeycomb radar visualization uses mathematically correct equal-area ring calculations for accurate data representation.
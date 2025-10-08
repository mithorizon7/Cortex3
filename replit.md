# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform designed to help leadership teams evaluate their organization's preparedness for AI adoption. It offers a structured assessment, including a context profile and a pulse check, delivering comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform's primary purpose is to provide actionable insights for strategic AI adoption, addressing business vision, market potential, and project ambitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is a modern React-based Single-Page Application (SPA) built with TypeScript and Vite. It utilizes a component-based design with `shadcn/ui` for consistent UI and Wouter for client-side routing. State management is handled by React hooks and TanStack Query for data fetching and caching. The UI/UX features a progress-based design with a honeycomb radar visualization for results, employing CSS custom properties for theming and responsiveness. The platform adheres to a strict color palette for brand consistency and executive-grade data visualization. Accessibility is prioritized.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript, following a layered architecture for routing, storage, and business logic. It provides endpoints for assessment creation, pulse response updates, and results retrieval.

### Data Storage Solutions
Drizzle ORM is used as the database abstraction layer, targeting PostgreSQL (configured for Neon serverless) with JSONB fields for flexibility. An in-memory adapter is used for development.

### Assessment Flow Design
The system utilizes a three-stage assessment workflow:
1.  **Context Profile Collection**: 12 organizational context questions.
2.  **Pulse Check Evaluation**: 18 questions with 4-level partial credit scoring (No=0, Started=0.25, Mostly=0.5, Yes=1.0) across 6 domains. Response accumulation is handled via explicit query refetch after each domain submission.
3.  **Results Generation**: Context-aware guidance based on maturity scores (0-3 fractional range per pillar) and "gates" derived from organizational risk and operational constraints, visualized with a honeycomb radar.

### Security Architecture
A comprehensive Content Security Policy (CSP) is implemented in production environments to protect against XSS attacks and control resource loading. This CSP includes directives for `default-src`, `style-src`, `script-src`, `img-src`, `connect-src`, `font-src`, `object-src`, `media-src`, and `frame-src`, with specific allowances for Firebase and Google OAuth domains. Firebase Authentication requirements are managed. Rate limiting is implemented, with hybrid user-based tracking for authenticated users and IP-based limits for anonymous traffic.

### PDF Generation
The platform includes robust PDF generation capabilities for executive briefs with a line-based spacing system ensuring consistent visual hierarchy across all three PDF generators (Core/Pulse Brief, Options Studio, Enhanced Brief).

**Line-Based Spacing Architecture**:
- **Line-Based System**: All spacing uses the L(n) = n * PAGE.line formula (where PAGE.line = 4.2mm) for scalable, maintainable vertical rhythm
- **"Before > After" Philosophy**: Larger spacing before headings, smaller after for superior visual flow:
  - `sectionGap: L(3.5) = 14.7mm` - Gap between major H1 sections
  - `h1Before: L(3.0) = 12.6mm, h1After: L(1.5) = 6.3mm` - H1 spacing (before > after)
  - `h2Before: L(2.0) = 8.4mm, h2After: L(1.0) = 4.2mm` - H2 spacing (before > after)
  - `paraGap: L(1.5) = 6.3mm` - Paragraph spacing
  - `listGap: L(1.2) = 5.04mm` - List item spacing
  - `headerPad: L(1.5) = 6.3mm` - Extra padding under running headers
  - `domainSeparator: L(2.5) = 10.5mm` - Domain separator spacing

**Key Features**:
- Comprehensive error handling and data validation
- Pagination protection with dynamic height measurements to prevent white gaps
- Running headers support for multi-page sections
- Zero hardcoded spacing values - all spacing derived from line-based SPACING constants
- Heading helpers own all vertical spacing (before + after) to prevent scattered y += statements
- Three-tier spacing hierarchy (section > heading > paragraph) for clear visual structure

## External Dependencies

### Database Services
-   **Neon PostgreSQL**: Serverless PostgreSQL database.
-   **Drizzle ORM**: Database toolkit and ORM.
-   **@neondatabase/serverless**: Neon-specific database driver.

### Frontend Libraries
-   **React**: Core UI framework.
-   **TanStack Query**: Server state management.
-   **React Hook Form**: Form management.
-   **Wouter**: Client-side routing.
-   **shadcn/ui**: Component library.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Radix UI**: Unstyled, accessible UI primitives.
-   **Lucide React**: Icon library.

### Development Tools
-   **Vite**: Build tool.
-   **TypeScript**: Static type checking.
-   **Zod**: Schema validation.
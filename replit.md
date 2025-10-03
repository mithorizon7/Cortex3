# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform designed to help leadership teams evaluate their organization's preparedness for AI adoption. It offers a structured assessment including a context profile and a pulse check, delivering comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform's primary purpose is to provide actionable insights for strategic AI adoption, addressing business vision, market potential, and project ambitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is a modern React-based Single-Page Application (SPA) built with TypeScript and Vite. It utilizes a component-based design with `shadcn/ui` for consistent UI and Wouter for client-side routing. State management is handled by React hooks and TanStack Query for data fetching and caching. The UI/UX features a progress-based design with a honeycomb radar visualization for results, employing CSS custom properties for theming and responsiveness. The platform adheres to a strict color palette for brand consistency and executive-grade data visualization. Accessibility is prioritized, with features like proper button semantics, keyboard navigation support, and `aria` attributes.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript, following a layered architecture for routing, storage, and business logic. It provides endpoints for assessment creation, pulse response updates, and results retrieval.

### Data Storage Solutions
Drizzle ORM is used as the database abstraction layer, targeting PostgreSQL (configured for Neon serverless) with JSONB fields for flexibility. An in-memory adapter is used for development.

### Assessment Flow Design
The system utilizes a three-stage assessment workflow:
1.  **Context Profile Collection**: 12 organizational context questions.
2.  **Pulse Check Evaluation**: 18 questions with 4-level partial credit scoring (No=0, Started=0.25, Mostly=0.5, Yes=1.0) across 6 domains. Response accumulation is handled via explicit query refetch after each domain submission to ensure all previous responses persist across the multi-domain flow.
3.  **Results Generation**: Context-aware guidance based on maturity scores (0-3 fractional range per pillar) and "gates" derived from organizational risk and operational constraints, visualized with a honeycomb radar.

**Recent Fixes (Oct 2025):**
- **Pulse Check Response Accumulation**: Fixed critical bug where domain responses were being overwritten instead of accumulated. Solution: After successful mutation, explicitly refetch assessment data using `queryClient.fetchQuery()`, update local state with complete merged responses, then navigate. Includes error handling for network failures during refetch.
- **Brand Color Consistency**: Updated step badge colors on homepage from generic (blue/purple/amber) to CORTEX brand palette (MIT Rosewood #750014, Pine Green #007561, Orange Peel #FF9F1C).

### Security Architecture
A comprehensive Content Security Policy (CSP) is implemented in production environments to protect against XSS attacks and control resource loading. This CSP includes directives for `default-src`, `style-src`, `script-src`, `img-src`, `connect-src`, `font-src`, `object-src`, `media-src`, and `frame-src`, with specific allowances for Firebase and Google OAuth domains. Firebase Authentication requirements are managed, including authorized domains and the use of `signInWithRedirect` in production. New external services require updating the CSP configuration in `server/middleware/security.ts`.

### PDF Generation
The platform includes robust PDF generation capabilities for executive briefs, featuring comprehensive error handling, data validation, and pagination protection to ensure reliable output for multi-page documents with varying content lengths.

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

### UI Component System
-   **Radix UI**: Unstyled, accessible UI primitives.
-   **Lucide React**: Icon library.

### Development Tools
-   **Vite**: Build tool.
-   **TypeScript**: Static type checking.
-   **Zod**: Schema validation.
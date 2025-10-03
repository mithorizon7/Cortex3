# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform that helps leadership teams evaluate their organization's preparedness for AI adoption. It provides a structured assessment including a context profile, a pulse check, and comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform aims to deliver actionable insights for strategic AI adoption.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is a modern React-based Single-Page Application (SPA) built with TypeScript and Vite. It features a component-based design using `shadcn/ui` for consistent UI and Wouter for client-side routing. State management is handled by React hooks and TanStack Query for data fetching and caching. The UI/UX includes a progress-based design with a honeycomb radar visualization for results, utilizing CSS custom properties for theming and responsiveness.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript, following a layered architecture for routing, storage, and business logic. It provides endpoints for assessment creation, pulse response updates, and results retrieval. An in-memory storage solution is used for development, with a database abstraction layer for PostgreSQL.

### Data Storage Solutions
Drizzle ORM is used as the database abstraction layer, targeting PostgreSQL (configured for Neon serverless) with JSONB fields for flexibility. An in-memory adapter is used for development.

### Assessment Flow Design
The system utilizes a three-stage assessment workflow:
1.  **Context Profile Collection**: 12 organizational context questions.
2.  **Pulse Check Evaluation**: 18 binary questions across 6 domains.
3.  **Results Generation**: Context-aware guidance based on maturity scores and "gates" derived from organizational risk and operational constraints, visualized with a honeycomb radar.

### Security Architecture
A comprehensive Content Security Policy (CSP) is implemented in production environments to protect against XSS attacks and control resource loading. This CSP includes directives for `default-src`, `style-src`, `script-src`, `img-src`, `connect-src`, `font-src`, `object-src`, `media-src`, and `frame-src`, with specific allowances for Firebase and Google OAuth domains. CSP violation reporting is configured but requires an endpoint implementation. Firebase Authentication requirements are carefully managed, including authorized domains and the use of `signInWithRedirect` in production. New external services require updating the CSP configuration in `server/middleware/security.ts`.

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
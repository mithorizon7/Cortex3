# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform designed to help leadership teams evaluate their organization's preparedness for AI adoption. It offers a structured assessment including a context profile and a pulse check, delivering comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform's primary purpose is to provide actionable insights for strategic AI adoption, addressing business vision, market potential, and project ambitions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is a modern React-based Single-Page Application (SPA) built with TypeScript and Vite. It utilizes a component-based design with `shadcn/ui` for consistent UI and Wouter for client-side routing. State management is handled by React hooks and TanStack Query for data fetching and caching. The UI/UX features a progress-based design with a honeycomb radar visualization for results, employing CSS custom properties for theming and responsiveness. The platform adheres to a strict color palette for brand consistency and executive-grade data visualization (documented in `docs/STYLE_GUIDE.md`). Accessibility is prioritized, with features like proper button semantics, keyboard navigation support, and `aria` attributes.

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
- **CRITICAL: Pulse Response Overwriting Bug (Oct 6)**: Fixed critical bug where domain responses were being completely replaced instead of accumulated. When saving responses for a new domain (e.g., domain X), it was overwriting all previously saved domain responses (C, O, R, T, E) instead of merging them. Solution: Modified `updatePulseResponses()` in assessment.service.ts to first fetch the existing assessment, then merge new responses with existing ones before saving. This ensures all 6 domains are properly accumulated and the assessment can be completed. Verified fix with end-to-end testing confirming all domains now save correctly.
- **Authentication Error Detection (Oct 6)**: Enhanced error handling to detect and clearly communicate authentication failures to users. Fixed `throwIfResNotOk()` in queryClient to always attach statusCode to thrown errors (previously only attached when incidentId was present). Updated domain-questions page to specifically detect 401/403 status codes and display "Authentication Required" message, preventing silent data loss when users are logged out mid-assessment.
- **CRITICAL: Pulse Response Saving Bug (Oct 6)**: Fixed critical backend bug preventing pulse responses from being saved. The issue was a missing userId parameter in the update flow - routes received userId but didn't pass it to service layer, causing storage ownership verification to fail silently. Solution: Added userId parameter to `updatePulseResponses()`, `updateAssessmentData()`, and `completeAssessment()` service methods, updated all three PATCH routes (`/pulse`, main update, and `/complete`) to pass `req.userId` through the entire chain (routes → service → storage). This ensures ownership verification succeeds and responses are properly persisted to the database.
- **Assessment Completion Flow Optimization (Oct 6)**: Moved completion trigger from results page to final domain submission. Assessment now completes immediately after domain X is saved, before navigating to results. This eliminates race conditions with results-page auto-completion while maintaining error handling fallback.
- **Legacy Pulse Check Page Cleanup (Oct 6)**: Converted pulse-check.tsx to redirect-only component, removing obsolete boolean/null UI while preserving domain calculation logic for smooth routing to correct starting domain.
- **Partial Credit Scoring UI Alignment (Oct 6)**: Removed all "Unsure" option remnants from UI text and tooltips, updated domain intro footer to reflect 4-option system (Yes/Mostly/Started/No) for clarity and consistency.
- **Zero Score Visualization (Oct 6)**: Honeycomb radar now displays zero scores as small center dots with legend clarification, distinguishing answered-zero from unanswered domains without disrupting existing visualization.
- **Auto-Save Safeguards (Oct 6)**: Added beforeunload warnings and cleanup auto-save on domain-questions page to prevent data loss when users navigate away with unsaved responses. Tracks saved vs current responses, uses navigator.sendBeacon for reliable background save on unmount.
- **Pulse Check Response Accumulation**: Fixed critical bug where domain responses were being overwritten instead of accumulated. Solution: After successful mutation, explicitly refetch assessment data using `queryClient.fetchQuery()`, update local state with complete merged responses, then navigate. Includes error handling for network failures during refetch.
- **Official CORTEX Domain Color Scheme**: Implemented the official color palette for all six domains with vibrant, distinct colors:
  - C (Clarity & Command): Blue #0C63D6
  - O (Operations & Data): Pine Green #007561
  - R (Risk/Trust/Security): Rosewood #750014
  - T (Talent & Culture): Orange #FFA72E
  - E (Ecosystem & Infrastructure): Teal #339181
  - X (Experimentation & Evolution): Light Blue #69B3FF
  - Each color includes light tints (50) for backgrounds and dark variants (500-dark) for dark mode
  - Applied consistently across domain intro pages, questions pages, honeycomb radar visualization, and navigation badges
  - Replaced generic primary colors with domain-specific colors for better visual identity and wayfinding
- **Domain Colors in Results Page (Oct 6)**: Extended domain-specific colors to Strategic Maturity Profile sections for improved visual consistency and wayfinding. Domain colors now appear in:
  - Domain Breakdown section: Colored dots next to each domain name and progress bars using domain-specific colors
  - Detailed Domain Analysis: Icon backgrounds use domain-specific colors instead of maturity-stage colors
  - Text colors remain standard (text-foreground) for accessibility compliance, meeting WCAG AA contrast requirements
- **Domain Navigation Safety**: Added null checks and 404 redirects for invalid domain parameters in domain intro/questions pages to prevent runtime crashes when accessing undefined pillar data.

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
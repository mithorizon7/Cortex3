# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform that helps leadership teams evaluate their organization's preparedness for AI adoption. It provides a structured assessment including a context profile, a pulse check, and comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform aims to deliver actionable insights for strategic AI adoption.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### October 3, 2025 - Strategic Profile Navigation Button
**Feature**: Added prominent "Strategic Profile" navigation button in the application header for quick access to assessment results.

**Implementation Details**:
1. **Button State Logic** (app-header.tsx):
   - Checks if `latestAssessment?.pillarScores` exists to determine completion status
   - Disabled state: Grey button with ghost variant, shows tooltip on hover/focus
   - Enabled state: Prominent blue button (default variant) that navigates to `/results/{assessmentId}`

2. **Pulse Check Response Persistence**:
   - Responses automatically saved via PATCH `/api/assessments/:id/pulse` after each domain
   - Loaded on component mount in domain-questions.tsx (lines 45-50)
   - Users can navigate back to see their previous answers at any time
   - Backend calculates `pillarScores` when responses are submitted, indicating completion

3. **Accessibility Features**:
   - Wrapper span with `role="button"` for semantic meaning
   - `aria-disabled="true"` indicates disabled state to screen readers
   - `aria-label` provides descriptive text for screen reader users
   - `tabIndex={0}` on wrapper, `tabIndex={-1}` on inner button prevents double focus
   - `pointer-events-none` on button allows tooltip to trigger on wrapper

4. **Tooltip Functionality**:
   - Desktop: "Complete the pulse check to view your strategic profile"
   - Mobile: "Complete the pulse check first"
   - Works for both hover and keyboard focus

5. **Responsive Design**:
   - Desktop: Full "Strategic Profile" text with larger icon
   - Mobile: Shortened "Profile" text to save space

**Bug Fixed** (useLatestAssessment.ts):
- Hook was incorrectly filtering out in-progress assessments by checking `completedAt`
- Fixed to return assessment regardless of completion status
- Button now correctly shows (disabled) for in-progress assessments
- Enables proper loading of previous responses when revisiting questions

**Impact**: Users can now quickly access their completed assessment results from any page without navigating through the full assessment flow. The button provides clear visual feedback about completion status and helpful guidance when disabled. Previous answers persist automatically and can be reviewed at any time.

### October 3, 2025 - Comprehensive PDF Generation Reliability Improvements
**Issues Addressed**: The PDF generation system had several vulnerabilities that could cause failures in production:
1. Multi-page PDFs failed with "Invalid arguments passed to jsPDF.line" error
2. Long text content could overflow past page footer causing jsPDF range errors
3. Missing data validation allowed incomplete assessments to trigger cryptic errors
4. Partial pillar data could cause averaging and rendering failures

**Solutions Implemented**:

1. **Fixed jsPDF Page Size Access** (pdf-generator.ts lines 239-243):
   - Changed from incorrect destructuring to proper method calls: `.getWidth()` and `.getHeight()`
   - Prevents NaN coordinate values that caused line drawing failures

2. **Enhanced Text Rendering Pagination** (pdf-generator.ts lines 262-314):
   - Updated `drawBody`, `drawBullets`, `drawPrompts` to accept optional `runHeader` parameter
   - When provided, functions call `addPageIfNeeded` for each line to prevent overflow
   - Applied runHeader parameter to all text rendering calls in Executive Brief generation

3. **Comprehensive Data Validation**:
   - In `results.tsx` (lines 165-172): Added contextProfile existence check before PDF generation
   - In `generateExecutiveBriefPDF` (lines 875-921): Added thorough validation:
     - Data object, assessment ID, and context profile existence
     - Pillar scores object type validation
     - Non-empty pillar scores validation
     - Valid numeric scores validation (no NaN)
     - All 6 CORTEX pillars present validation
   - All validations provide clear, actionable error messages

4. **Improved Error Handling** (pdf-generator.ts lines 169-192):
   - Enhanced logo loading with response.ok validation and FileReader error handling
   - Structured console warnings with error details, impact, and suggested actions
   - Graceful degradation: PDF generates successfully even if logo loading fails

**Impact**: The PDF generation system is now production-ready with comprehensive error handling, data validation, and pagination protection. Multi-page PDFs with any content length now generate reliably without crashes.

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
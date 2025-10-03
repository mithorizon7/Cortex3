# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform that helps leadership teams evaluate their organization's preparedness for AI adoption. It provides a structured assessment including a context profile, a pulse check, and comprehensive results with tailored guidance across six core domains: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution. The platform aims to deliver actionable insights for strategic AI adoption.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### October 3, 2025 - Comprehensive CORTEX Color Palette Compliance Audit
**Objective**: Ensure 100% compliance with CORTEX Light Theme Color Style Guide across all visualizations, charts, and UI elements.

**Files Updated**:
1. **MATURITY_STAGES Colors** (`client/src/lib/cortex.ts`):
   - Nascent (0): #8B959E (Silver Gray)
   - Emerging (1): #750014 (MIT Rosewood)
   - Integrated (2): #007561 (Pine Green)
   - Leading (3): #FF9F1C (Orange Peel)
   - Fixed getStageColor fallback from #64748b to #8B959E

2. **PDF Generator PALETTE** (`client/src/lib/pdf-generator.ts`):
   - ink: #011627 (Rich Black)
   - inkSubtle: #8B959E (Silver Gray)
   - accent: #007561 (Pine Green)
   - success: #007561 (Pine Green)
   - warning: #FF9F1C (Orange Peel)
   - danger: #750014 (MIT Rosewood)
   - line: #DDE1E6 (Light Gray 2)
   - tint: #F2F4F8 (Light Gray 1)

3. **Seven Lenses Radar** (`client/src/components/seven-lenses-radar.tsx`):
   - Updated CHART_COLORS sequence: Pine Green → Orange Peel → Rosewood → Rich Black → Silver Gray
   - Ensures executive-grade data visualization with brand colors

4. **Admin Dashboard** (`client/src/pages/admin-dashboard.tsx`):
   - Updated all Bar chart fills to #007561 (Pine Green)
   - Removed unused COLORS array

5. **Tailwind Config** (`tailwind.config.ts`):
   - Updated all cortex-* status colors to official CORTEX palette

6. **Home Page Assessment Scale** (`client/src/pages/home.tsx`):
   - Level 0: #8B959E (Silver Gray)
   - Level 1: #750014 (MIT Rosewood)
   - Level 2: #007561 (Pine Green)
   - Level 3: #FF9F1C (Orange Peel) - removed gradient with off-palette color

**Verification**: Repository-wide scan confirmed no hardcoded hex colors remain outside the approved CORTEX palette (5 core colors + supporting grays).

**Impact**: All visualizations, charts, and UI elements now strictly adhere to the CORTEX Light Theme Color Palette, ensuring consistent brand identity and executive-grade presentation across the entire platform.

### October 3, 2025 - Value Overlay Metric Badges: Tooltip Replaced with Clickable Dialog
**Issue**: Value Overlay metric badges used a hover-only tooltip to display metric information, which was:
- Confusing due to `cursor-help` and Info icon suggesting clickability but not being clickable
- Inaccessible on touch devices (mobile/tablet)
- Easy to miss or accidentally lose
- Limited to brief information only

**Solution**: Replaced confusing tooltip with fully accessible clickable dialog:
- **File Modified**: `client/src/components/value-overlay.tsx`
- Changed metric badge from Badge to Button component with Info icon
- Implemented Dialog pattern with DialogTrigger for proper accessibility
- Two separate controlled dialogs: metric info and metric change

**Dialog Content**:
1. **Quick Definition**: Shows what the metric measures in a highlighted section
2. **Context Explanation**: Displays personalized "Why this metric fits your organization" if available
3. **Full Measurement Guide**: Complete guide with Definition, Scope, How to get it, Quality note, and Cadence
4. **Formatted Content**: Bold text (**text**) and proper paragraph spacing using DOMPurify

**Accessibility Improvements**:
- Proper button semantics for screen readers
- Keyboard navigation support
- Works on all devices including touch screens
- `aria-expanded` state management via Dialog component
- Clear visual affordance (button with icon)

**Impact**: Users can now reliably access comprehensive metric information through a clickable interface that works everywhere. The dialog provides much more information than the tooltip could, including the full measurement guide. All interactive elements follow proper accessibility patterns.

### October 3, 2025 - Domain Intro Pages Restored with Session-Only Skip
**Issue**: Domain introduction pages were being hidden by default due to persistent localStorage setting from "Skip intros next time" checkbox.

**Solution**: Changed skip preference from localStorage to sessionStorage:
- **Files Modified**: `domain-intro.tsx`, `domain-questions.tsx`, `pulse-check.tsx`
- Changed all `localStorage.getItem/setItem('cortex_skip_intros')` to `sessionStorage`
- Skip preference now only persists for current browser session
- Intro pages show by default for all new sessions

**Behavior**:
- Domain intro pages display by default before each pulse check section (C, O, R, T, E, X)
- If user checks "Skip intros next time", intros are skipped only for current session
- Closing browser or starting new session resets to showing intros
- Provides consistent onboarding experience while allowing temporary skip for repeat visits

**Impact**: Users now see domain introduction pages by default, ensuring they understand each pillar before answering questions. The skip option remains available but is session-scoped to prevent accidental permanent hiding.

### October 3, 2025 - PDF Logo Error Handling
**Issue**: PDF generation failed with "CRC mismatch for chunk iTXt" error when embedding logo due to PNG metadata chunks that jsPDF cannot process.

**Solution**: Added try-catch error handling around logo embedding in `finalizeFooters()` function (pdf-generator.ts lines 177-186):
- Logo embedding wrapped in try-catch block
- If logo fails to load, logs warning and continues PDF generation without logo
- Ensures PDF generation completes successfully even if logo has compatibility issues

**Impact**: Situation Assessment PDFs now generate reliably without crashing due to logo metadata issues. The PDF completes successfully with or without the logo.

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
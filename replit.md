# CORTEX™ Executive AI Readiness Assessment

## Overview
CORTEX is a web-based executive AI readiness assessment platform designed to help leadership teams evaluate their organization's preparedness for AI adoption. The platform provides a structured assessment flow, including a context profile questionnaire, a pulse check evaluation, and comprehensive results with tailored guidance. It evaluates organizations across six core domains (Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, and Experimentation & Evolution) to deliver actionable insights for AI strategy and implementation. The project aims to provide clear, actionable insights for executive-level users, focusing on strategic AI adoption.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based Single-Page Application (SPA) built with TypeScript and Vite. It follows a component-based design with `shadcn/ui` for consistent UI elements and Wouter for client-side routing. State management is handled by React hooks and TanStack Query for efficient data fetching and caching. The UI/UX features a progress-based design with a distinctive honeycomb radar visualization for results, leveraging CSS custom properties for theming and responsive layouts.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript, following a layered architecture for routing, storage, and business logic. It provides endpoints for creating assessments, updating pulse responses, and retrieving results. An in-memory storage solution is used for development, with a database abstraction layer ready for PostgreSQL integration.

### Data Storage Solutions
Drizzle ORM is used as the database abstraction layer, targeting PostgreSQL (configured for Neon serverless). The schema stores assessments with JSONB fields for flexibility. An in-memory adapter facilitates development, while production is set for Neon.

### Assessment Flow Design
The system implements a three-stage assessment workflow:
1.  **Context Profile Collection**: 12 organizational context questions.
2.  **Pulse Check Evaluation**: 18 binary questions across 6 domains.
3.  **Results Generation**: Context-aware guidance based on maturity scores and "gates" derived from the organization's risk profile and operational constraints. The honeycomb radar visualization uses equal-area rings for accurate data representation.

### Security Architecture

#### Content Security Policy (CSP) Configuration

The application implements a comprehensive Content Security Policy to protect against XSS attacks and ensure secure loading of external resources. The CSP configuration is managed in `server/middleware/security.ts` and is **only applied in production environments**.

##### Current CSP Directives (Production Only)

The exact CSP configuration from `server/middleware/security.ts`:

```
default-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
script-src 'self' https://apis.google.com https://www.gstatic.com;
img-src 'self' data: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com;
connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://accounts.google.com https://firebase.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
object-src 'none';
media-src 'self';
frame-src 'self' https://cortex3-790ee.firebaseapp.com https://accounts.google.com;
report-uri /api/csp-violation-report
```

**Directive Breakdown**:
- **default-src**: `'self'` - Default policy for all resource types
- **style-src**: `'self'`, `'unsafe-inline'` (required for inline styles), `https://fonts.googleapis.com` (Google Fonts)
- **script-src**: `'self'`, `https://apis.google.com` (Google APIs), `https://www.gstatic.com` (Google static resources)
- **img-src**: `'self'`, `data:` (inline images), `https://lh3.googleusercontent.com` (Google profile images), `https://firebasestorage.googleapis.com` (Firebase Storage)
- **connect-src**: `'self'`, Firebase domains, `https://accounts.google.com` (Google OAuth)
- **font-src**: `'self'`, `https://fonts.gstatic.com` (Google Fonts)
- **object-src**: `'none'` (no plugins)
- **media-src**: `'self'` (application media only)
- **frame-src**: `'self'`, `https://cortex3-790ee.firebaseapp.com` (Firebase project domain), `https://accounts.google.com` (Google OAuth)
- **report-uri**: `/api/csp-violation-report` (violation reporting endpoint)

##### Environment-Specific Behavior

**Development Environment**:
- **NO CSP** is applied in development (`NODE_ENV !== 'production'`)
- Only basic security headers are set (`X-Content-Type-Options: nosniff`)
- This prevents interference with Vite dev server and development tools

**Production Environment**:
- Full CSP as documented above is enforced
- All security headers are applied
- CSP violation reporting is enabled

##### CSP Violation Monitoring

**Violation Reporting Configuration**:
- CSP includes `report-uri /api/csp-violation-report`
- **Note**: The violation reporting endpoint is not currently implemented in the codebase
- Violations are reported to the specified URI but require endpoint implementation

**To Implement Violation Monitoring**:
Add the following endpoint to your Express routes:
```typescript
app.post('/api/csp-violation-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const violation = req.body['csp-report'];
  console.log('CSP Violation:', {
    blockedURI: violation['blocked-uri'],
    violatedDirective: violation['violated-directive'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number']
  });
  res.status(204).send();
});
```

##### Firebase Authentication Requirements

**Firebase Authentication Domains**:
- `https://identitytoolkit.googleapis.com`: Core Firebase Auth API
- `https://securetoken.googleapis.com`: Token refresh and validation
- `https://firebaseinstallations.googleapis.com`: Firebase app installations
- `https://firebase.googleapis.com`: Firebase general API
- `https://cortex3-790ee.firebaseapp.com`: Project-specific Firebase domain (hosts OAuth handler)
- `https://accounts.google.com`: Google OAuth flows

**Important**: Production domains (cortexindex.com, horizoncortex.replit.app) must be added to Firebase Console → Authentication → Settings → Authorized domains for OAuth redirects to work correctly.

**OAuth Flow Configuration**:
- **authDomain**: Always uses `${projectId}.firebaseapp.com` because Firebase's auth handler endpoints (`/__/auth/handler`) only exist on this domain
- **Production Redirect Flow**: Production automatically uses `signInWithRedirect` instead of `signInWithPopup` to avoid browser popup blockers
- **Development Popup Flow**: Development uses popup for better UX, with automatic fallback to redirect if popup is blocked
- **Cross-Origin Handling**: The redirect flow naturally handles cross-origin OAuth without third-party cookie restrictions

##### Adding New External Services

When integrating new external services:

1. **Identify Required Domains**: Determine all domains the service needs
2. **Update CSP Configuration**: Modify the CSP string in `server/middleware/security.ts` (lines 94-105)
3. **Add Domains to Appropriate Directives**:
   - Scripts: Add to `script-src`
   - API calls: Add to `connect-src`
   - Images: Add to `img-src`
   - Fonts: Add to `font-src`
   - Frames/iframes: Add to `frame-src`
4. **Test in Production**: CSP only applies in production, so test thoroughly
5. **Monitor for Violations**: Check browser console for CSP violation errors
6. **Document Changes**: Update this documentation with new requirements

##### Common CSP Issues and Solutions

**Firebase Authentication Failures**:
- Verify Firebase project domain in `frame-src`: `https://cortex3-790ee.firebaseapp.com`
- Ensure `https://accounts.google.com` is in both `connect-src` and `frame-src`
- Check that all Firebase domains are in `connect-src`

**Google Fonts Loading Issues**:
- Confirm `https://fonts.googleapis.com` is in `style-src`
- Ensure `https://fonts.gstatic.com` is in `font-src`

**Third-Party API Integration**:
- Add API domains to `connect-src`
- Add script domains to `script-src` if loading external scripts
- Test integration in production environment where CSP is active

##### CSP Debugging

**Testing CSP Changes**:
1. Deploy to production environment (CSP not active in development)
2. Open browser developer tools
3. Look for "Content Security Policy" violation errors
4. Check which directive was violated and which resource was blocked
5. Update CSP configuration accordingly

**Development Testing**:
To test CSP in development, temporarily modify the environment check in `server/middleware/security.ts`:
```typescript
// Change line 83 from:
if (process.env.NODE_ENV === 'production') {
// To:
if (true) { // Force CSP in development for testing
```
Remember to revert this change before committing.

## External Dependencies

### Database Services
-   **Neon PostgreSQL**: Serverless PostgreSQL database for production.
-   **Drizzle ORM**: Database toolkit and ORM.
-   **@neondatabase/serverless**: Neon-specific database driver.

### Frontend Libraries
-   **React & Ecosystem**: Core framework for rendering.
-   **TanStack Query**: Server state management and data fetching.
-   **React Hook Form**: Form state management with validation.
-   **Wouter**: Lightweight client-side routing.
-   **shadcn/ui**: Component library built on Radix UI.
-   **Tailwind CSS**: Utility-first CSS framework.

### UI Component System
-   **Radix UI**: Unstyled, accessible UI primitives.
-   **Lucide React**: Icon library.
-   **class-variance-authority**: Utility for managing component variants.
-   **clsx & tailwind-merge**: Conditional class name utilities.

### Development Tools
-   **Vite**: Build tool and development server.
-   **TypeScript**: Static type checking.
-   **ESBuild**: Fast JavaScript bundler.
-   **Zod**: Schema validation.
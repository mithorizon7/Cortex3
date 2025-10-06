# CORTEX Documentation

This directory contains comprehensive documentation for the CORTEX Executive AI Readiness Assessment platform.

## Available Documentation

### Style Guides

#### [STYLE_GUIDE.md](./STYLE_GUIDE.md)
**Comprehensive visual design system documentation**

The complete reference for CORTEX's color palette, typography, component styling, and accessibility guidelines. This guide ensures consistency and professionalism across all UI elements.

**Topics covered:**
- Core color palette (MIT Rosewood, Pine Green, Orange Peel)
- Text colors and typography rules
- Background and surface colors
- Button styling (primary, secondary, destructive, disabled)
- Chart and data visualization colors
- Form inputs and validation states
- Semantic colors (success, warning, error)
- Accessibility guidelines (WCAG AA compliance)
- Implementation in CSS custom properties
- Common pitfalls and best practices

**When to use:** Reference this guide before implementing any new UI components or modifying existing visual elements.

#### [STYLE_GUIDE_QUICK_REFERENCE.md](./STYLE_GUIDE_QUICK_REFERENCE.md)
**Fast lookup guide for developers**

A condensed version of the style guide for quick reference during active development. Includes code snippets, color values, and common patterns.

**Contents:**
- Color palette cheat sheet with hex and HSL values
- Component quick guide (buttons, text, backgrounds)
- CSS custom property reference
- Common patterns with code examples
- Accessibility checklist
- Common mistakes to avoid

**When to use:** Keep this open while coding for instant access to color values and component patterns.

---

## Project Documentation Structure

```
docs/
├── README.md                         # This file - documentation index
├── STYLE_GUIDE.md                    # Comprehensive visual design guide
└── STYLE_GUIDE_QUICK_REFERENCE.md    # Quick lookup for developers
```

---

## Related Documentation Files

### Repository Root

- **[AGENTS.md](../AGENTS.md)** - Coding standards, repository workflow, testing requirements
- **[replit.md](../replit.md)** - Project overview, architecture, and system changes

### Frontend

- **[client/src/index.css](../client/src/index.css)** - CSS custom properties and design tokens
- **[tailwind.config.ts](../tailwind.config.ts)** - Tailwind CSS configuration
- **[client/src/components/ui/](../client/src/components/ui/)** - shadcn/ui component library

---

## Contributing to Documentation

### When to Update Documentation

Update documentation when:
- Adding new design patterns or components
- Modifying color palette or design tokens
- Changing accessibility standards
- Implementing new UI features
- Receiving user feedback indicating design improvements

### Documentation Standards

- **Clarity:** Write in simple, everyday language
- **Examples:** Include code snippets and visual examples
- **Accessibility:** Always mention accessibility considerations
- **Maintenance:** Update version history and last modified dates
- **Cross-references:** Link to related documentation

### Commit Message Format

When updating documentation:
```
docs: update STYLE_GUIDE.md with new button variants
docs(style): add dark mode color specifications
docs: fix color value typo in quick reference
```

---

## Quick Links

- **CSS Variables:** See `client/src/index.css` for implementation
- **Tailwind Config:** See `tailwind.config.ts` for theme extensions
- **Component Examples:** Browse `client/src/components/` for real implementations
- **Color Testing:** Use browser DevTools to inspect computed CSS custom properties

---

## Getting Help

1. **For style questions:** Check `STYLE_GUIDE.md` first
2. **For quick lookups:** Use `STYLE_GUIDE_QUICK_REFERENCE.md`
3. **For implementation details:** Review existing components in `client/src/components/`
4. **For coding standards:** Consult `AGENTS.md`
5. **For architecture questions:** Reference `replit.md`

---

**Last Updated:** October 6, 2025  
**Maintained by:** CORTEX Development Team

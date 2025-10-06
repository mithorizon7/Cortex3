# CORTEX Light Theme Color Style Guide

**Version:** 1.0.0  
**Last Updated:** October 6, 2025

## Overview

This comprehensive style guide defines the visual design system for the CORTEX Executive AI Readiness Assessment platform. The guide ensures consistency, professionalism, and accessibility across all UI components, maintaining an executive-grade aesthetic appropriate for leadership teams in regulated industries.

## Core Design Philosophy

CORTEX follows a **60-30-10 color distribution**:
- **60%**: Neutral base (Baby Powder/white backgrounds)
- **30%**: Secondary accents (Pine Green for actions and links)
- **10%**: Primary brand color (MIT Rosewood for high-impact elements)

This balanced approach creates a professional, trustworthy aesthetic with generous white space and strategic use of color to guide attention.

---

## Color Palette

### Primary Colors

#### MIT Rosewood (`#750014`)
- **HSL:** `350 100% 22.94%`
- **Role:** Core brand color, primary call-to-action
- **Usage:** ~10% of UI
- **Applications:**
  - Primary buttons (Submit, Save, Start Assessment)
  - Logo and brand elements
  - Important icons and indicators
  - Occasional heading emphasis
  - Active/selected states
- **Connotations:** Passion, urgency, authority
- **Important:** Use sparingly for maximum impact. Avoid large area fills.

#### Pine Green (`#007561`)
- **HSL:** `170 100% 23%`
- **Role:** Secondary accent, success indicator
- **Usage:** ~20-30% of UI
- **Applications:**
  - Link text (default color for all hyperlinks)
  - Secondary buttons and toggles
  - Icon accents
  - Interactive state indicators (hover/focus outlines)
  - Success messages and positive states
  - Chart series (growth/progress metrics)
- **Connotations:** Growth, stability, success
- **Important:** Provides contrast to Rosewood while maintaining professionalism

#### Orange Peel (`#FF9F1C`)
- **HSL:** `35 100% 55%`
- **Role:** Tertiary accent, warning indicator
- **Usage:** ~10% or less of UI
- **Applications:**
  - Warning messages and alerts
  - Important metric highlights
  - Badge notifications
  - Chart accents (emphasis series)
  - Focus states (alternative to Pine Green)
- **Connotations:** Energy, caution, attention
- **Important:** Use sparingly to avoid oversaturation

### Neutral Colors

#### Baby Powder (`#FDFFFC`)
- **HSL:** `0 0% 99%` (approximately)
- **Role:** Base page background
- **Applications:**
  - Main page backgrounds
  - Large content areas
  - Provides clean, airy canvas
- **Important:** Creates maximum contrast with text and data

#### Rich Black (`#011627`)
- **HSL:** `203 100% 8%`
- **Role:** Primary text color
- **Applications:**
  - Body text and paragraphs
  - Headings (default)
  - Maximum legibility content
  - Chart baseline series (when needed)
- **Connotations:** Seriousness, precision, sophistication
- **Contrast:** Exceeds WCAG AA standards on Baby Powder backgrounds

### Supporting Neutrals

#### Light Gray 1 (`#F2F4F8`)
- **HSL:** `220 30% 96.08%`
- **Role:** Elevated surfaces, secondary backgrounds
- **Applications:**
  - Card backgrounds (alternative to pure white)
  - Form section backgrounds
  - Sidebar backgrounds
  - Disabled button fills

#### Light Gray 2 (`#DDE1E6`)
- **HSL:** `213.33 15.25% 88.43%`
- **Role:** Borders and dividers
- **Applications:**
  - Input field borders (default)
  - Card borders
  - Horizontal rules and dividers
  - Disabled button borders

#### Silver Gray (`#8B959E`)
- **HSL:** `208.42 8.92% 58.24%`
- **Role:** Muted/secondary text
- **Applications:**
  - Timestamps and captions
  - Placeholder text
  - Disabled labels
  - Secondary information
- **Contrast:** ≥4.5:1 on white backgrounds (WCAG AA compliant)

---

## Text Colors

### Body Text
- **Color:** Rich Black (`#011627`)
- **Usage:** All standard paragraph text, long-form content
- **Rationale:** Excellent contrast on light backgrounds while being softer than pure black

### Headings
- **Primary:** Rich Black (`#011627`)
- **Brand Emphasis (Optional):** MIT Rosewood (`#750014`)
- **Guidelines:**
  - Use Rich Black for most headings (consistency)
  - Reserve Rosewood for hero titles, logo text, or occasional section emphasis
  - Distinguish headings primarily by size/weight, not color

### Muted/Secondary Text
- **Color:** Silver Gray (`#8B959E`)
- **Usage:** Meta info, captions, placeholders, disabled labels
- **Contrast:** ≥4.5:1 on white (accessible)

### Link Text
- **Color:** Pine Green (`#007561`)
- **Hover State:** Slightly darker Pine Green (~10% darker) or add underline
- **Guidelines:**
  - Always underline links in body copy (clarity)
  - Pine Green provides professional alternative to bright blue
  - Avoid using Rosewood for links (can be mistaken for errors)
  - Optional: Orange Peel hover state for extra attention (use sparingly)

### Inverted Text
- **Color:** Baby Powder (`#FDFFFC`) or pure white
- **Usage:** Text on dark backgrounds (badges, buttons with brand fills)
- **Applications:** White text on Rosewood/Pine Green buttons, dark chart segments

---

## Background Colors

### Page Background
- **Color:** Baby Powder (`#FDFFFC`) or pure white (`#FFFFFF`)
- **Usage:** Main page background, large content areas
- **Style:** Minimal, open, airy with ample whitespace

### Elevated Surfaces (Cards, Modals, Panels)

**Option A: Pure White with Borders**
- Background: `#FFFFFF`
- Border: Light Gray 2 (`#DDE1E6`), 1px
- Style: Minimalist, distinguished by subtle border or shadow

**Option B: Light Gray with Contrast**
- Background: Light Gray 1 (`#F2F4F8`)
- Border: Optional (Light Gray 2 if needed)
- Style: Gentle contrast against white base

### Form Fields
- **Background:** White (`#FFFFFF`)
- **Alternative:** Light Gray 1 (`#F2F4F8`) for "filled" style
- **Border:** Light Gray 2 (`#DDE1E6`)
- **Rationale:** Clean, expected, integrates with design

### Interactive Hover States
- **Hover:** `rgba(0,0,0,0.03)` (--elevate-1)
- **Active:** `rgba(0,0,0,0.08)` (--elevate-2)
- **Style:** Ultra-light tint overlay, subtle elevation
- **Applications:** Menu items, list rows, clickable cards
- **Important:** Avoid bright color changes; maintain subtle feedback

---

## Button Colors

### Primary Button (Action)
- **Background:** MIT Rosewood (`#750014`)
- **Text:** White/Baby Powder
- **Hover:** Slightly lighter Rosewood (5-10% brightness increase) OR increased saturation
- **Focus:** 2px outline in contrasting color (Orange Peel or bright neutral)
- **Active:** Slightly darker shade or maintain with darker outline
- **Examples:** Submit, Save, Start Assessment, Continue

### Secondary Button

**Option A: Outlined Style**
- **Background:** White/neutral
- **Border:** 1px Rosewood
- **Text:** Rosewood
- **Hover:** Light Rosewood tint background (10% opacity) OR subtle shadow
- **Style:** Less dominant than primary, brand-connected

**Option B: Pine Green Fill**
- **Background:** Pine Green (`#007561`)
- **Text:** White
- **Hover:** Slightly lighter or more saturated Pine Green
- **Style:** Two-color hierarchy (red primary, green secondary)
- **Important:** Use consistently if chosen

### Destructive Button (Danger)
- **Background:** MIT Rosewood (`#750014`)
- **Text:** White
- **Hover:** Darken slightly OR add red shadow for intensity
- **Alternative:** Outlined Rosewood style if primary is also Rosewood
- **Label:** Clear and explicit (e.g., "Delete", "Remove User")
- **Enhancement:** Consider warning icon alongside text
- **Optional:** Orange Peel accent icon to reinforce warning

### Disabled Button
- **Background:** Light Gray 1 (`#F2F4F8`)
- **Border:** Light Gray 2 (`#DDE1E6`)
- **Text/Icon:** Silver Gray (`#8B959E`)
- **Hover:** None or minimal (cursor: not-allowed)
- **Style:** Clearly "off" and non-interactive
- **Contrast:** ≥3:1 for legibility (even if low priority)

### Button Accessibility
- **Focus Indicators:** Always include visible focus ring (2px outline)
- **Colors:** Pine Green or Rosewood for focus ring
- **Keyboard Navigation:** Ensure all buttons are keyboard accessible
- **Contrast Ratios:** Maintain WCAG AA standards for all text

---

## Chart and Data Visualization Colors

### Recommended Color Sequence

**Series 1: Pine Green** (`#007561`)
- Strong, cool color
- Connotations: Growth, progress
- Excellent visibility on white

**Series 2: Orange Peel** (`#FF9F1C`)
- Bright, warm accent
- High contrast to green
- Eye-catching for emphasis
- Note: Ensure sufficient line thickness on white

**Series 3: MIT Rosewood** (`#750014`)
- Deep, dark tone
- Brand connection
- Use for benchmarks or targets
- Ensure separation from dark text/axes

**Series 4: Rich Black** (`#011627`)
- Maximum contrast
- Use for baseline or reference series
- Alternative: Silver Gray (`#8B959E`) for subtle baseline

**Series 5+: Extended Palette**
- Lighter teal/blue-green (Pine Green family)
- Golden amber (Orange Peel variant)
- Desaturated orange (neutral tone)
- Use different stroke patterns or marker shapes

### Chart Accessibility
- **Color Blindness:** Combine red/green with distinct markers or patterns
- **Grid Lines:** Light Gray 2 (`#DDE1E6`)
- **Axis Text:** Rich Black or dark gray
- **Hover Highlights:** Use accent colors (Rosewood/Orange) with halo effect
- **Filled Areas:** Use 50% opacity for overlapping visibility
- **Labels:** Always include clear legends and labels

### Auxiliary Elements
- **Grid Lines:** Light Gray 2 (`#DDE1E6`)
- **Axes:** Rich Black or dark gray text
- **Interactive Highlights:** Rosewood or Orange halo on hover
- **Transparency:** 50% opacity for filled areas (area charts, radar polygons)

---

## Form Inputs and Borders

### Input Fields
- **Background:** White (`#FFFFFF`)
- **Text:** Rich Black (filled) / Silver Gray (placeholder)
- **Border:** Light Gray 2 (`#DDE1E6`), 1px
- **Border Radius:** 4-8px (modern, rounded)

### Focus State
- **Border:** Pine Green (`#007561`) OR 2px shadow in Pine Green
- **Alternative:** Orange Peel (high visibility, but consider consistency)
- **Rationale:** Calm "active focus" without implying error
- **Accessibility:** Visible focus state (WCAG compliant)

### Hover State (Optional)
- **Overlay:** `rgba(0,0,0,0.03)` (--elevate-1)
- **Border:** Slightly darker shade
- **Usage:** Read-only fields, dropdowns before opening

### Validation States

**Error State**
- **Border:** Rosewood or similar red
- **Message:** Rosewood text below field
- **Icon:** Error icon in Rosewood

**Success State** (Optional)
- **Border:** Pine Green
- **Message:** Pine Green text
- **Icon:** Checkmark in Pine Green

**Important:** Don't confuse focus with validation (use different styles/shades)

### Dividers and Borders
- **Color:** Light Gray 2 (`#DDE1E6`)
- **Width:** 1px
- **Usage:** Fieldset lines, card containers, table cells, horizontal rules
- **Style:** Subtle, polished, understated

---

## Semantic Colors (Success, Warning, Error)

### Success
- **Color:** Pine Green (`#007561`)
- **Background:** Light green tint (~15% opacity) → `#E6F4F1`
- **Border:** Pine Green or slightly darker
- **Icon:** Checkmark in Pine Green
- **Text:** Rich Black for message body, Pine Green for title/header
- **Usage:** "Data saved successfully", positive status indicators
- **Connotations:** Affirmative, calming

### Warning
- **Color:** Orange Peel (`#FF9F1C`)
- **Background:** Light amber/orange → `#FFF4E5`
- **Border:** Orange Peel
- **Icon:** Warning triangle or info icon in Orange
- **Text:** Rich Black for message body, Orange Peel for title
- **Usage:** "Password expiring soon", "Are you sure?" prompts
- **Connotations:** Caution without negative implication

### Error
- **Color:** MIT Rosewood (`#750014`)
- **Background:** Light rose tint (~10-15% opacity) → `#FCE4E4` or similar
- **Border:** Rosewood
- **Icon:** Error icon (X or alert) in Rosewood
- **Text:** Rich Black for message body, Rosewood for title
- **Usage:** Form validation errors, critical failures, destructive confirmations
- **Connotations:** Urgent, requires immediate attention
- **Accessibility:** Ensure sufficient contrast on light rose background

### Info (Optional)
- **Color:** Info Blue (`#0C63D6`) or alternative neutral
- **Background:** Light blue tint → `#E9F3FF`
- **Border:** Info Blue
- **Icon:** Info icon in Info Blue
- **Text:** Rich Black for message body
- **Usage:** Informational notices, helpful tips
- **Note:** Not part of core 5-color palette; use if additional semantic color needed

---

## Implementation in Code

### CSS Custom Properties

The style guide is implemented in `client/src/index.css`:

```css
:root {
  /* Official MIT brand colors */
  --primary: 350 100% 22.94%;  /* MIT Red #750014 */
  --primary-foreground: 0 0% 100%;
  
  --accent: 170 100% 23%; /* Pine Green #007561 */
  --accent-foreground: 0 0% 100%;
  
  --warning: 35 100% 55%; /* Orange Peel #FF9F1C */
  --warning-foreground: 0 0% 100%;
  
  /* Neutrals */
  --foreground: 220 10% 12%; /* Rich Black #011627 */
  --background: 0 0% 100%; /* Baby Powder/White */
  --border: 213 15% 88%; /* Light Gray 2 #DDE1E6 */
  
  --muted: 220 30% 96.08%; /* Light Gray 1 #F2F4F8 */
  --muted-foreground: 208.42 8.92% 58.24%; /* Silver Gray #8B959E */
  
  /* Semantic */
  --success: 170 100% 23%; /* Pine Green */
  --destructive: 350 100% 22.94%; /* Rosewood */
  
  /* Interactive elevations */
  --elevate-1: rgba(0,0,0, .03); /* Hover */
  --elevate-2: rgba(0,0,0, .08); /* Active */
}
```

### Tailwind Utility Classes

All colors are available as Tailwind utilities:
- `bg-primary`, `text-primary`, `border-primary`
- `bg-accent`, `text-accent`, `border-accent`
- `bg-muted`, `text-muted-foreground`
- `bg-destructive`, `text-destructive`
- And more...

### Elevation System

Custom utilities for interactive states:
- `hover-elevate` - Subtle hover effect
- `active-elevate-2` - Stronger active/pressed effect
- `toggle-elevate` + `toggle-elevated` - Toggle states

**Important:** These utilities do not work with `overflow-hidden`

---

## Accessibility Guidelines

### Contrast Ratios (WCAG AA)
- **Body Text:** ≥4.5:1 (Rich Black on Baby Powder exceeds this)
- **Large Text (18pt+):** ≥3:0:1
- **UI Components:** ≥3:0:1
- **Muted Text:** ≥4.5:1 (Silver Gray on white meets standard)

### Focus Indicators
- **Visibility:** Always include visible focus ring
- **Width:** 2px minimum
- **Color:** High contrast (Pine Green or Orange Peel)
- **Offset:** Consider outline-offset for clarity

### Color Blindness
- **Red-Green:** Use markers/patterns when combining Rosewood and Pine Green
- **General:** Don't rely solely on color to convey information
- **Charts:** Include labels, legends, and distinct shapes

### Motion Accessibility
- Respect `prefers-reduced-motion` media query
- Provide alternatives to animation-dependent interactions

---

## Design Best Practices

### Whitespace
- **Generous:** Maintain ample breathing room between elements
- **Hierarchy:** Use spacing to establish visual hierarchy
- **Consistency:** Apply consistent spacing scale (small, medium, large)

### Typography
- **Headings:** Primarily Rich Black, occasional Rosewood emphasis
- **Body:** Rich Black for maximum readability
- **Links:** Pine Green with underline (especially in body copy)
- **Hierarchy:** Establish through size/weight, not just color

### Borders and Shadows
- **Subtlety:** Use sparingly and subtly
- **Drop Shadows:** Only on floating elements (modals, toasts) or same-background surfaces
- **Border Radius:** Small (`rounded-md` in Tailwind ≈ 6px)
- **Consistency:** Choose bordered or flat design approach and stick with it

### Interactive Elements
- **Hover:** Subtle elevation or color change
- **Active:** Slightly stronger feedback
- **Disabled:** Clearly "off" appearance (grayed out)
- **Transitions:** Smooth but not excessive (200-300ms)

### Component Hierarchy
- **Primary Actions:** Rosewood buttons (most important)
- **Secondary Actions:** Pine Green or outlined Rosewood (less emphasis)
- **Destructive Actions:** Rosewood with clear labeling and warnings
- **Links:** Pine Green, underlined

---

## Common Pitfalls to Avoid

❌ **Overusing Rosewood:** It's meant for ~10% of UI, not everywhere  
❌ **Bright hover backgrounds:** Keep hover states subtle (use elevation overlays)  
❌ **Confusing focus and validation:** Use different colors/styles  
❌ **Red-green only charts:** Add patterns for color blindness  
❌ **Pure black text:** Use Rich Black for softer, modern look  
❌ **Inconsistent button hierarchy:** Maintain clear primary/secondary distinction  
❌ **Forgetting focus indicators:** Always visible for accessibility  
❌ **Large orange fills:** Orange Peel is tertiary accent, use sparingly  

---

## Quick Reference

| Element | Color | Hex | HSL |
|---------|-------|-----|-----|
| Primary Brand | MIT Rosewood | `#750014` | `350 100% 22.94%` |
| Secondary Accent | Pine Green | `#007561` | `170 100% 23%` |
| Tertiary Accent | Orange Peel | `#FF9F1C` | `35 100% 55%` |
| Body Text | Rich Black | `#011627` | `203 100% 8%` |
| Background | Baby Powder | `#FDFFFC` | ~`0 0% 99%` |
| Muted Text | Silver Gray | `#8B959E` | `208.42 8.92% 58.24%` |
| Borders | Light Gray 2 | `#DDE1E6` | `213.33 15.25% 88.43%` |
| Surfaces | Light Gray 1 | `#F2F4F8` | `220 30% 96.08%` |

---

## Resources

- **Main CSS File:** `client/src/index.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Component Library:** shadcn/ui components in `client/src/components/ui/`
- **Icon Library:** lucide-react
- **Fonts:** Space Grotesk (display), Inter (UI), IBM Plex Mono (data)

---

## Version History

- **1.0.0** (October 6, 2025): Initial comprehensive style guide documentation

---

## Maintenance

This style guide should be updated whenever:
- New colors are added to the palette
- Design tokens change in `index.css`
- New UI patterns are established
- Accessibility standards evolve
- User feedback indicates design improvements

**Responsibility:** All contributors should reference this guide before implementing UI changes.

# CORTEX Style Guide - Quick Reference

**For immediate reference during development. See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for comprehensive details.**

---

## Color Palette Cheat Sheet

```typescript
// Core Brand Colors
MIT Rosewood  → #750014 → hsl(350 100% 22.94%)  → Primary actions, brand
Pine Green    → #007561 → hsl(170 100% 23%)     → Links, secondary, success
Orange Peel   → #FF9F1C → hsl(35 100% 55%)      → Warnings, tertiary accent

// Neutrals
Rich Black    → #011627 → hsl(203 100% 8%)      → Body text
Baby Powder   → #FDFFFC → ~hsl(0 0% 99%)        → Page background
Silver Gray   → #8B959E → hsl(208 8.92% 58.24%) → Muted text
Light Gray 1  → #F2F4F8 → hsl(220 30% 96.08%)   → Card backgrounds
Light Gray 2  → #DDE1E6 → hsl(213 15% 88%)      → Borders
```

---

## Usage Rules (60-30-10)

- **60%** Neutral base (white/Baby Powder)
- **30%** Pine Green (links, secondary actions)
- **10%** MIT Rosewood (primary actions, brand)
- **<10%** Orange Peel (warnings, occasional accents)

---

## Component Quick Guide

### Buttons

```tsx
// Primary Action
<Button variant="default">      {/* Rosewood bg, white text */}

// Secondary Action  
<Button variant="outline">      {/* White bg, Rosewood border/text */}
<Button variant="secondary">    {/* Alternative: Pine Green fill */}

// Destructive
<Button variant="destructive">  {/* Rosewood bg, white text */}

// Disabled
<Button disabled>               {/* Light gray, muted */}
```

### Text Colors

```tsx
// Body text (default)
<p className="text-foreground">     {/* Rich Black */}

// Muted/secondary text
<p className="text-muted-foreground"> {/* Silver Gray */}

// Links
<a className="text-accent">         {/* Pine Green */}

// On dark backgrounds
<span className="text-primary-foreground"> {/* White */}
```

### Backgrounds

```tsx
// Page background (default)
<div className="bg-background">  {/* Baby Powder/White */}

// Card/elevated surface
<Card>                           {/* White with border */}
<div className="bg-secondary">   {/* Light Gray 1 */}

// Interactive hover
<div className="hover-elevate">  {/* Subtle elevation */}
<div className="active-elevate-2"> {/* Stronger press effect */}
```

### Semantic States

```tsx
// Success
<Alert className="border-success bg-success/10">
  <CheckIcon className="text-success" />
  {/* Body text stays foreground (Rich Black) */}
</Alert>

// Warning
<Alert className="border-warning bg-warning/10">
  <AlertTriangle className="text-warning" />
</Alert>

// Error
<Alert className="border-destructive bg-destructive/10">
  <XCircle className="text-destructive" />
</Alert>
```

### Form Inputs

```tsx
// Standard input
<Input className="border-border focus:border-accent" />
       {/* Light Gray 2 border → Pine Green on focus */}

// Error state
<Input className="border-destructive" />

// Success state (optional)
<Input className="border-success" />
```

---

## CSS Custom Properties Reference

```css
/* Directly in className or style */
bg-primary        /* MIT Rosewood */
text-primary      /* MIT Rosewood */
border-primary    /* MIT Rosewood */

bg-accent         /* Pine Green */
text-accent       /* Pine Green */
border-accent     /* Pine Green */

bg-secondary      /* Light Gray 1 */
text-secondary-foreground

bg-destructive    /* Rosewood */
text-destructive  /* Rosewood */

bg-muted          /* Light Gray 1 */
text-muted-foreground /* Silver Gray */

border-border     /* Light Gray 2 */
```

---

## Chart Colors (in order)

1. **Pine Green** (`#007561`) - Growth/progress
2. **Orange Peel** (`#FF9F1C`) - Highlights
3. **MIT Rosewood** (`#750014`) - Brand/benchmark
4. **Rich Black** (`#011627`) - Baseline
5. **Extended variants** - Lighter teal, golden amber

**Important:** Use distinct markers/patterns when combining red and green (color blindness)

---

## Typography

```tsx
// Headings - primarily Rich Black
<h1 className="text-foreground">

// Occasional brand emphasis
<h1 className="text-primary">  {/* Rosewood - use sparingly */}

// Body text
<p className="text-foreground"> {/* Rich Black */}

// Links
<a className="text-accent underline-offset-4 hover:underline">
   {/* Pine Green with underline */}
```

---

## Accessibility Checklist

✅ **Contrast:** Rich Black on white = excellent (>7:1)  
✅ **Focus:** Always visible focus ring (2px, Pine Green)  
✅ **Links:** Underlined in body copy  
✅ **Charts:** Labels + patterns for color blindness  
✅ **Motion:** Respect `prefers-reduced-motion`  
✅ **Disabled:** ≥3:1 contrast (still legible)

---

## Common Patterns

### Primary CTA Button
```tsx
<Button 
  variant="default" 
  className="bg-primary hover-elevate"
  data-testid="button-submit"
>
  Submit Assessment
</Button>
```

### Secondary Action
```tsx
<Button 
  variant="outline"
  className="border-primary text-primary"
>
  Cancel
</Button>
```

### Link in Body Text
```tsx
<p>
  Read our <a href="#" className="text-accent hover:underline">
    privacy policy
  </a> for details.
</p>
```

### Success Message
```tsx
<div className="p-4 rounded-md border-success bg-success/10">
  <div className="flex gap-3">
    <CheckCircle className="h-5 w-5 text-success" />
    <div>
      <h4 className="font-medium text-success">Success</h4>
      <p className="text-sm text-foreground">
        Your assessment has been saved.
      </p>
    </div>
  </div>
</div>
```

### Warning Alert
```tsx
<Alert className="border-warning bg-warning/10">
  <AlertTriangle className="h-4 w-4 text-warning" />
  <AlertTitle className="text-warning">Warning</AlertTitle>
  <AlertDescription className="text-foreground">
    Your session will expire in 5 minutes.
  </AlertDescription>
</Alert>
```

---

## Don'ts ❌

- ❌ Don't use Rosewood for >10% of UI
- ❌ Don't use Orange Peel as large fills
- ❌ Don't use pure black (`#000000`) - use Rich Black
- ❌ Don't use Rosewood for regular links
- ❌ Don't combine red/green charts without patterns
- ❌ Don't forget focus indicators
- ❌ Don't use bright hover backgrounds
- ❌ Don't nest Cards inside Cards
- ❌ Don't use `hover-elevate` with `overflow-hidden`

---

## File Locations

- **Full Guide:** `docs/STYLE_GUIDE.md`
- **CSS Variables:** `client/src/index.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Components:** `client/src/components/ui/`

---

## When in Doubt

1. Check existing components in `client/src/components/`
2. Review `client/src/index.css` for color values
3. Consult full `docs/STYLE_GUIDE.md`
4. Ask: "Does this maintain the 60-30-10 balance?"
5. Ask: "Is this accessible (contrast, focus)?"

---

**Last Updated:** October 6, 2025

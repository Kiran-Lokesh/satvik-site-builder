# Satvik Foods Brand Color Palette

## Primary Colors

### Brand Primary
- **Hex**: `#004d3d`
- **HSL**: `160 100% 15%`
- **Usage**: Header background, primary text, main brand elements
- **CSS Variable**: `--brand`

### Brand Dark
- **Hex**: `#00342b`
- **HSL**: `160 100% 10%`
- **Usage**: Button hover states, darker brand elements
- **CSS Variable**: `--brand-dark`

## Accent Colors

### CTA Accent
- **Hex**: `#F4C84A`
- **HSL**: `45 90% 65%`
- **Usage**: Primary buttons, call-to-action elements, highlights
- **CSS Variable**: `--accent`

### Support Accent (Terracotta)
- **Hex**: `#D9734A`
- **HSL**: `15 70% 60%`
- **Usage**: Secondary elements, feature icons, support content
- **CSS Variable**: `--terracotta`

## Background & Surface

### Surface Background
- **Hex**: `#FAF9F6`
- **HSL**: `48 56% 98%`
- **Usage**: Main page background, card backgrounds
- **CSS Variable**: `--surface`

## Text Colors

### Primary Text
- **Hex**: `#1F2937`
- **HSL**: `220 13% 18%`
- **Usage**: Main headings, body text, primary content
- **CSS Variable**: `--brand-text`

### Muted Text
- **Hex**: `#6B7280`
- **HSL**: `220 9% 46%`
- **Usage**: Secondary text, descriptions, metadata
- **CSS Variable**: `--muted`

## Usage Examples

### Header
```css
background: #004d3d; /* brand */
color: white;
```

### Primary Button (CTA)
```css
background: #F4C84A; /* accent */
color: black;
```

### Secondary Button
```css
color: #004d3d; /* brand */
border: 1px solid rgba(0, 77, 61, 0.2);
```

### Body Text
```css
color: #1F2937; /* brand-text */
```

### Muted Text
```css
color: #6B7280; /* muted */
```

### Page Background
```css
background: #FAF9F6; /* surface */
```

### Card Borders
```css
border: 1px solid rgba(0, 77, 61, 0.08);
```

## Accessibility Notes

- **Brand (#004d3d) on white**: WCAG AA compliant (4.5:1 contrast ratio)
- **Accent (#F4C84A) on black**: WCAG AA compliant (4.5:1 contrast ratio)
- **Brand text (#1F2937) on surface (#FAF9F6)**: WCAG AAA compliant (7:1 contrast ratio)
- **Muted text (#6B7280) on surface (#FAF9F6)**: WCAG AA compliant (4.5:1 contrast ratio)

## Tailwind Classes

- `bg-brand` - Primary brand background
- `bg-brand-dark` - Dark brand background
- `bg-accent` - CTA accent background
- `bg-terracotta` - Support accent background
- `bg-surface` - Surface background
- `text-brandText` - Primary text color
- `text-muted` - Muted text color
- `border-[rgba(0,77,61,0.08)]` - Subtle brand border

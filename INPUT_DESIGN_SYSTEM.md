# Input Fields & Box Shadow Design System

## Overview
The BuzzFiling input design system provides consistent, accessible, and modern form inputs with detailed specifications for box shadows, hover states, focus states, and responsive behavior.

---

## Input Component Specifications

### Base Input Styling
```typescript
// File: /components/ui/input.tsx
className={cn(
  "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors",
  "placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 focus:border-[#ff0d13]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
  className,
)}
```

### Input States

#### 1. Default State
- **Height**: `h-11` (44px)
- **Border**: `1px solid oklch(0.92 0 0)` (Light slate-200)
- **Background**: `oklch(1 0 0)` (White)
- **Text Color**: `oklch(0.15 0 0)` (Slate-900)
- **Padding**: `px-4 py-2.5` (16px horizontal, 10px vertical)
- **Border Radius**: `rounded-lg` (0.5rem / 8px)
- **Placeholder**: `oklch(0.55 0 0)` (Slate-400)
- **Box Shadow**: None (clean, flat design)
- **Transition**: `transition-colors` (200ms default)

#### 2. Focus State
- **Border Color**: `#ff0d13` (Brand red)
- **Ring**: `focus:ring-2 focus:ring-[#ff0d13]/20`
  - Ring width: 2px
  - Ring color: Red with 20% opacity (soft glow effect)
  - Creates visual feedback without harsh outline
- **Outline**: `focus:outline-none` (removes default browser outline)
- **Animation**: Smooth color transition (200ms)

#### 3. Hover State
- **Inherited**: Default hover behavior from transition-colors
- **Custom Implementation**: Optional subtle shadow elevation
- **Suggestion**: Add `hover:shadow-sm hover:border-slate-300` for elevation effect

#### 4. Disabled State
- **Opacity**: `disabled:opacity-50` (50% transparent)
- **Background**: `disabled:bg-slate-50` (Slightly darker white)
- **Cursor**: `disabled:cursor-not-allowed` (Not-allowed cursor)
- **Text**: Automatically fades due to opacity
- **Interaction**: No focus ring, no hover effects

#### 5. Error State
- **Border**: `border-red-600` or `border-[#ef4444]`
- **Ring**: `focus:ring-red-500/20` (red glow)
- **Error Text**: `text-xs text-red-600` (below input, 12px)
- **Error Icon**: Optional red exclamation (Lucide: AlertCircle)
- **Animation**: Subtle shake or fade-in animation

#### 6. Success State
- **Border**: `border-green-600` or `border-[#10b981]`
- **Ring**: `focus:ring-green-500/20` (green glow)
- **Success Icon**: Optional green checkmark (Lucide: CheckCircle2)
- **Background**: Optional very subtle green tint: `bg-green-50`

---

## Box Shadow Specifications

### Shadow System
BuzzFiling uses Tailwind's shadow scale with custom enhancements:

```css
/* Defined in globals.css */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Input Shadow Scenarios

#### No Shadow (Default)
- **Use Case**: Default input state
- **Value**: `none` or no shadow class
- **Reasoning**: Keeps form clean and minimal

#### Hover Elevation (Optional)
- **Class**: `hover:shadow-sm`
- **Value**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Use Case**: Desktop hover state for interactive feedback
- **Not Applied**: To avoid visual clutter on focus

#### Focus Shadow (Recommended)
- **Instead of**: Box shadow
- **Use**: Focus ring system (ring-2 ring-[color]/20)
- **Advantage**: More subtle, modern appearance
- **Color Blend**: 20% opacity creates soft glow without harsh shadow

#### Error State Shadow
- **Class**: `shadow-sm` (optional)
- **Ring**: `ring-2 ring-red-500/20`
- **Combined**: Subtle shadow + red glow creates urgency
- **Example**: `shadow-sm focus:ring-2 focus:ring-red-500/20`

#### Card/Wrapper Shadow
- **Class**: `shadow-md` or `shadow-lg`
- **Use Case**: Form container, modal backgrounds
- **Value**: Medium shadow for depth separation
- **Dark Mode**: Reduce opacity or use `dark:shadow-none dark:border-[1px]`

---

## Input Variants

### Icon Input (Left Icon)
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
  <Input
    className="pl-10" // Adds left padding for icon space
    placeholder="you@example.com"
  />
</div>
```

**Specifications**:
- Icon size: `w-5 h-5` (20px × 20px)
- Icon color: `text-slate-400` (Gray, non-intrusive)
- Icon position: `left-3` (12px from left)
- Icon spacing: `pl-10` on input (40px left padding)
- `pointer-events-none`: Prevents clicking icon

### Icon Input (Right Icon - Password Toggle)
```tsx
<div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    className="pr-10" // Adds right padding for toggle
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer"
  >
    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
  </button>
</div>
```

**Specifications**:
- Button position: `right-3 top-1/2 -translate-y-1/2`
- Icon size: `w-5 h-5` (20px × 20px)
- Icon color: `text-slate-600` (Darker gray for interactivity)
- Input padding: `pr-10` (40px right padding)
- Cursor: `cursor-pointer` on button

### Label Styling
```tsx
<Label 
  htmlFor="email" 
  className="text-sm font-medium text-slate-900"
>
  Email Address
</Label>
```

**Specifications**:
- Font size: `text-sm` (14px)
- Font weight: `font-medium` (500)
- Text color: `text-slate-900` (Dark, readable)
- Margin bottom: `mb-2` (8px spacing from input)
- Required indicator: `<span className="text-red-600">*</span>`

### Helper Text Styling
```tsx
<p className="text-xs text-slate-500">
  We'll send order updates to this email
</p>
```

**Specifications**:
- Font size: `text-xs` (12px)
- Text color: `text-slate-500` (Light gray, secondary information)
- Margin top: `mt-1.5` (6px spacing below input)
- Line height: Default or `leading-relaxed`

### Error Message Styling
```tsx
{errors.email && (
  <p className="text-xs text-red-600">{errors.email}</p>
)}
```

**Specifications**:
- Font size: `text-xs` (12px)
- Text color: `text-red-600` (Brand red for error)
- Margin top: `mt-1` (4px)
- Animation: Fade-in (optional)

---

## Dark Mode Specifications

### Dark Mode Color Overrides
```css
.dark {
  --input: oklch(0.15 0 0); /* Very dark gray */
  --border: oklch(0.2 0 0); /* Slightly lighter gray */
  --foreground: oklch(0.98 0 0); /* Off-white text */
  --primary: oklch(0.45 0.18 25); /* Brighter red for contrast */
}
```

### Dark Mode Input Styling
```tsx
// Add to input classes:
"dark:bg-slate-900 dark:border-slate-700 dark:text-white"
"dark:placeholder:text-slate-500"
"dark:focus:ring-[#ff3b30]/30" // Slightly brighter ring in dark mode
```

**Dark Mode Specifications**:
- **Background**: `oklch(0.08 0 0)` (Very dark gray, not pure black for readability)
- **Border**: `oklch(0.18 0 0)` (Subtle gray border)
- **Text**: `oklch(0.98 0 0)` (Off-white, not pure white for eye comfort)
- **Placeholder**: `oklch(0.55 0 0)` (Medium gray)
- **Focus Ring**: Brighter red `oklch(0.45 0.18 25)` for contrast
- **Ring Opacity**: `20-30%` (slightly higher than light mode for visibility)

---

## Accessibility Standards

### WCAG 2.1 Compliance

#### Color Contrast
- **Minimum Ratio**: 4.5:1 for normal text (AA level)
- **Text vs Background**: Slate-900 on white = 12.63:1 (AAA level)
- **Border vs Background**: Slate-200 on white = 2.5:1 (good for borders)
- **Focus Ring**: Red ring on white = 3.2:1 (good for distinguishing focus)

#### Focus Indicators
- **Visible**: 2px focus ring with strong color contrast
- **Keyboard Navigation**: Tab key shows clear focus state
- **Touch Targets**: Minimum 44px height for mobile accessibility

#### Labels
- **Always Present**: Every input must have an associated `<label>`
- **htmlFor Attribute**: Connects label to input via ID
- **Screen Readers**: Labels announced when input receives focus

#### Error Messages
- **Association**: Connected via `aria-describedby` on input
- **Clarity**: Clear, specific error messages in plain language
- **Timing**: Error appears after validation, not on blur

### Screen Reader Markup
```tsx
<input
  id="email"
  type="email"
  aria-label="Email Address"
  aria-describedby="email-error email-helper"
  required
/>
<p id="email-helper" className="text-xs text-slate-500">
  We'll send order updates to this email
</p>
{errors.email && (
  <p id="email-error" className="text-xs text-red-600" role="alert">
    {errors.email}
  </p>
)}
```

---

## Animation & Transitions

### Timing Functions
- **Default**: `transition-colors` (200ms ease)
- **Focus**: Instant ring appearance (no delay)
- **Hover**: 150-200ms smooth transition
- **Disabled**: Instant (no animation needed)

### Transition Example
```tsx
className="transition-all duration-200 ease-in-out"
// Animates:
// - Border color on focus
// - Shadow on hover
// - Ring on focus
// - Background on disabled state
```

---

## Usage Examples

### Complete Form Input
```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-sm font-medium text-slate-900">
    Email Address
  </Label>
  <div className="relative">
    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="pl-10"
      aria-describedby="email-error email-helper"
    />
  </div>
  {errors.email && (
    <p id="email-error" className="text-xs text-red-600 break-words">
      {errors.email}
    </p>
  )}
  <p id="email-helper" className="text-xs text-slate-500">
    We'll send order updates to this email
  </p>
</div>
```

---

## Best Practices

1. **Always include labels** - Required for accessibility and user clarity
2. **Use consistent spacing** - `space-y-2` or `space-y-3` between form groups
3. **Provide helper text** - Explain what the input expects
4. **Show errors clearly** - Red text, icon, and specific message
5. **Keep shadows minimal** - Use rings instead for focus states
6. **Test in dark mode** - Ensure sufficient contrast
7. **Mobile optimization** - Ensure 44px minimum touch target
8. **Icon placement** - Icons should be decorative, not interactive (unless toggle/button)
9. **Consistent heights** - All inputs should be `h-11` (44px) for alignment
10. **Error timing** - Show errors after submission or debounced validation, not on blur

---

## Component Files
- Main component: `/components/ui/input.tsx`
- Label component: `/components/ui/label.tsx`
- Example usage: `/components/checkout/account-step.tsx`
- Theme config: `/app/globals.css` (color variables)

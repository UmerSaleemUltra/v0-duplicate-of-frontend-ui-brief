# BuzzFiling Design System Documentation

> Complete UI/UX reference guide for building consistent interfaces. Use this as the foundation for ITINConnect or any sister project.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Components](#components)
8. [Animations](#animations)
9. [Dark Mode (Admin)](#dark-mode-admin)
10. [Utility Classes](#utility-classes)
11. [Page Patterns](#page-patterns)

---

## Brand Identity

| Property | Value |
|----------|-------|
| **Primary Brand Color** | Red `#ff0d13` |
| **Secondary Brand Color** | Dark Red `#880000` |
| **Brand Gradient** | `linear-gradient(to right, #880000, #ff0d13)` |
| **Font Family** | Unbounded (Google Fonts) |
| **Default Theme** | Light (public), Dark (admin) |
| **Border Radius Base** | `0.5rem` (8px) |

---

## Color System

### Design Tokens (CSS Variables)

```css
:root {
  /* Core Colors */
  --background: oklch(1 0 0);           /* White */
  --foreground: oklch(0.15 0 0);        /* Near Black */
  --card: oklch(1 0 0);                 /* White */
  --card-foreground: oklch(0.15 0 0);   /* Near Black */
  
  /* Primary (Red) */
  --primary: oklch(0.35 0.15 25);       /* Dark Red */
  --primary-foreground: oklch(1 0 0);   /* White */
  
  /* Secondary */
  --secondary: oklch(0.97 0 0);         /* Light Gray */
  --secondary-foreground: oklch(0.15 0 0);
  
  /* Muted */
  --muted: oklch(0 0 0);
  --muted-foreground: oklch(0.15 0 0);
  
  /* Accent */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.15 0 0);
  
  /* Destructive */
  --destructive: oklch(0.5 0.2 25);
  --destructive-foreground: oklch(1 0 0);
  
  /* Border & Input */
  --border: oklch(0.92 0 0);
  --input: oklch(0.92 0 0);
  --ring: oklch(0.35 0.15 25);
  
  /* Radius */
  --radius: 0.5rem;
}
```

### Brand Colors (Direct Use)

```css
@theme inline {
  --color-brand: #ff0d13;
  --color-brand-hover: #d81c20;
  --color-brand-light: #fff5f5;
  --color-brand-secondary: #880000;
  
  /* Status Colors */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  
  /* Glass Effects */
  --color-glass-surface: rgba(255, 255, 255, 0.7);
  --color-glass-sidebar: rgba(255, 255, 255, 0.6);
  --color-glass-topbar: rgba(255, 255, 255, 0.8);
  --color-glass-modal: rgba(255, 255, 255, 0.9);
  --color-glass-border: rgba(0, 0, 0, 0.08);
  --color-glass-hover: rgba(255, 255, 255, 0.85);
}
```

### Color Usage Guidelines

| Context | Color | Tailwind Class |
|---------|-------|----------------|
| Primary Action | `#ff0d13` | `bg-[#ff0d13]` or `bg-brand` |
| Primary Gradient | `#880000 → #ff0d13` | `bg-gradient-to-r from-[#880000] to-[#ff0d13]` |
| Text Primary | `#1A1A1A` | `text-slate-900` |
| Text Secondary | `#6B7280` | `text-slate-600` |
| Background | `#FFFFFF` | `bg-white` |
| Border | `#E5E7EB` | `border-slate-200` |
| Success | `#10B981` | `text-emerald-500` |
| Warning | `#F59E0B` | `text-amber-500` |
| Error | `#EF4444` | `text-red-500` |

---

## Typography

### Font Family

```css
@theme inline {
  --font-sans: var(--font-unbounded), ui-sans-serif, system-ui, sans-serif;
}
```

### Font Import (layout.tsx)

```tsx
import { Unbounded } from "next/font/google"

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})
```

### Heading Styles

```css
h1 {
  @apply text-2xl font-semibold tracking-tight text-slate-900;
  @apply sm:text-3xl lg:text-4xl;
}

h2 {
  @apply text-xl font-semibold tracking-tight text-slate-900;
  @apply sm:text-2xl lg:text-3xl;
}

h3 {
  @apply text-lg font-medium tracking-tight text-slate-900;
  @apply sm:text-xl lg:text-2xl;
}

h4 {
  @apply text-base font-medium tracking-tight text-slate-900;
  @apply sm:text-lg;
}

h5 {
  @apply text-sm font-medium tracking-tight text-slate-900;
  @apply sm:text-base;
}

h6 {
  @apply text-sm font-medium tracking-tight text-slate-900;
}
```

### Text Size Scale

| Name | Size | Use Case |
|------|------|----------|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Body text, descriptions |
| `text-base` | 16px | Default body |
| `text-lg` | 18px | Large body, intro text |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Hero subheadings |
| `text-4xl` | 36px | Hero headings |
| `text-5xl` | 48px | Large hero |
| `text-6xl` | 60px | Extra large hero |

---

## Spacing & Layout

### Spacing Scale

| Name | Value | Use Case |
|------|-------|----------|
| `p-1` | 4px | Tight padding |
| `p-2` | 8px | Small padding |
| `p-3` | 12px | Medium padding |
| `p-4` | 16px | Default padding |
| `p-5` | 20px | Large padding |
| `p-6` | 24px | Card padding |
| `p-8` | 32px | Section padding |
| `p-10` | 40px | Large section padding |
| `p-12` | 48px | Hero padding |
| `p-16` | 64px | Section vertical spacing |

### Container

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

### Grid Layouts

```html
<!-- 2 Column -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

<!-- 3 Column -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- 4 Column -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```

---

## Border Radius

### Radius Scale

```css
--radius-sm: calc(var(--radius) - 2px);  /* 6px */
--radius-md: var(--radius);               /* 8px */
--radius-lg: calc(var(--radius) + 2px);  /* 10px */
--radius-xl: calc(var(--radius) + 4px);  /* 12px */
```

### Usage

| Element | Class | Value |
|---------|-------|-------|
| Small buttons, badges | `rounded-md` | 6px |
| Buttons, inputs | `rounded-lg` | 8px |
| Cards | `rounded-xl` | 12px |
| Large cards, modals | `rounded-2xl` | 16px |
| Hero cards, pricing | `rounded-3xl` | 24px |
| Pills, tags | `rounded-full` | 9999px |

---

## Shadows

### Shadow Scale

| Class | CSS | Use Case |
|-------|-----|----------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Default cards |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Elevated cards |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Popovers |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Hero elements |

### Dark Mode Shadows

```css
.dark .shadow-lg  { box-shadow: 0 4px 28px rgba(0,0,0,0.6) !important; }
.dark .shadow-xl  { box-shadow: 0 8px 40px rgba(0,0,0,0.7) !important; }
.dark .shadow-sm  { box-shadow: 0 1px 8px rgba(0,0,0,0.5) !important; }
```

---

## Components

### Button

```tsx
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 shadow-sm",
        destructive: "bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 shadow-sm",
        outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-sm",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        link: "text-[#ff0d13] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-6 py-3",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Button Examples

```html
<!-- Primary (Gradient) -->
<button class="bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white rounded-lg px-5 py-2.5 font-medium hover:opacity-90 shadow-sm">
  Start Your Business
</button>

<!-- Primary (Solid) -->
<button class="bg-[#ff0d13] text-white rounded-lg px-5 py-2.5 font-medium hover:bg-[#d81c20]">
  Apply Now
</button>

<!-- Outline -->
<button class="border border-slate-200 bg-white text-slate-900 rounded-lg px-5 py-2.5 font-medium hover:bg-slate-50 shadow-sm">
  Learn More
</button>

<!-- Ghost -->
<button class="hover:bg-slate-100 text-slate-900 rounded-lg px-5 py-2.5 font-medium">
  Cancel
</button>

<!-- Pill Button (Hero/CTA) -->
<button class="bg-white text-[#ff0d13] rounded-full px-8 py-3.5 font-semibold hover:bg-white/90 shadow-lg">
  Start Your Business <ArrowRight />
</button>

<!-- Inverted Pill (on gradient bg) -->
<button class="border-2 border-white text-white rounded-full px-8 py-2.5 hover:bg-white/10 font-semibold">
  Login
</button>
```

### Card

```tsx
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
```

#### Card Examples

```html
<!-- Basic Card -->
<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
  <h3 class="text-lg font-semibold mb-2">Card Title</h3>
  <p class="text-slate-600">Card description text.</p>
</div>

<!-- Stat Card -->
<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
  <div class="flex items-center justify-between mb-4">
    <span class="text-slate-600 text-sm">Total Revenue</span>
    <DollarSign class="h-5 w-5 text-emerald-500" />
  </div>
  <p class="text-3xl font-bold text-slate-900">$125,430</p>
  <p class="text-sm text-emerald-600 mt-2">+12.5% from last month</p>
</div>

<!-- Pricing Card (Gradient) -->
<div class="bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-2xl p-8">
  <h3 class="text-white text-2xl font-medium mb-4">Starter Package</h3>
  <span class="text-white text-5xl font-bold">$149</span>
  <span class="text-white text-xl ml-2">+ State Fee</span>
  <button class="w-full bg-white text-[#ff0d13] rounded-full py-4 px-8 mt-8 font-semibold">
    Apply Now
  </button>
</div>
```

### Input

```tsx
<input
  className={cn(
    "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors",
    "placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 focus:border-[#ff0d13]",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
  )}
/>
```

### Badge

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-white",
        secondary: "border-transparent bg-gray-100 text-gray-900",
        outline: "text-foreground border-glass-border",
      },
    },
  }
)
```

#### Badge Examples

```html
<!-- Primary Badge -->
<span class="inline-flex items-center rounded-full bg-[#ff0d13] text-white px-3 py-1 text-xs font-semibold">
  New
</span>

<!-- Status Badges -->
<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
  Completed
</span>
<span class="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
  Pending
</span>
<span class="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
  Failed
</span>
<span class="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
  In Progress
</span>
```

### Avatar

```html
<div class="h-10 w-10 rounded-full bg-[#ff0d13]/10 flex items-center justify-center">
  <span class="text-[#ff0d13] text-sm font-medium">AU</span>
</div>
```

### Table

```html
<table class="w-full">
  <thead>
    <tr class="border-b border-slate-200">
      <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
      <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-slate-100">
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-4 px-4 text-sm text-slate-900">John Doe</td>
      <td class="py-4 px-4">
        <span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
          Active
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

---

## Animations

### Keyframes

```css
@keyframes shimmer {
  100% { transform: translateX(200%); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}

@keyframes marquee-reverse {
  0% { transform: translateX(-33.333%); }
  100% { transform: translateX(0); }
}

/* Skeleton Shimmer (Dark Mode) */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Animation Classes

```css
.animate-marquee {
  display: flex;
  gap: 1rem;
  animation: marquee 20s linear infinite;
  will-change: transform;
}

.animate-marquee-reverse {
  display: flex;
  gap: 1rem;
  animation: marquee-reverse 20s linear infinite;
  will-change: transform;
}

/* Mobile - faster */
@media (max-width: 768px) {
  .animate-marquee { animation: marquee 10s linear infinite; }
  .animate-marquee-reverse { animation: marquee-reverse 10s linear infinite; }
}
```

### Transitions

```css
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Dark Mode (Admin)

The admin panel uses a **pure black (#000000)** base with red accents.

### Dark Mode Variables

```css
.dark {
  --background: oklch(0 0 0);          /* Pure Black */
  --foreground: oklch(0.98 0 0);       /* White */
  --card: oklch(0.1 0 0);              /* #1a1a1a */
  --card-foreground: oklch(0.98 0 0);
  --primary: oklch(0.45 0.18 25);      /* Brighter Red */
  --primary-foreground: oklch(1 0 0);
  --muted: oklch(0.2 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --border: oklch(0.2 0 0);
  --input: oklch(0.15 0 0);
}
```

### Dark Mode Background Mapping

| Light Class | Dark Value |
|-------------|------------|
| `bg-white` | `#0d0d0d` |
| `bg-slate-50` | `#050505` |
| `bg-slate-100` | `#111111` |
| `bg-slate-200` | `#181818` |
| `bg-background` | `#000000` |

### Dark Mode Text

| Light Class | Dark Color |
|-------------|------------|
| `text-slate-900` | `#ffffff` |
| `text-slate-600` | `rgba(255,255,255,0.45)` |
| `text-slate-400` | `rgba(255,255,255,0.45)` |

### Dark Mode Borders

```css
.dark .border { border-color: rgba(255,255,255,0.08) !important; }
.dark .border-slate-200 { border-color: rgba(255,255,255,0.1) !important; }
```

### Dark Mode Skeleton Shimmer

```css
.dark .animate-pulse > * {
  background-image: linear-gradient(
    90deg,
    #111111 0%,
    #1a0000 40%,
    #2a0a0a 50%,
    #1a0000 60%,
    #111111 100%
  ) !important;
  background-size: 200% 100% !important;
  animation: skeleton-shimmer 1.8s ease-in-out infinite !important;
}
```

---

## Utility Classes

### Glass Card

```css
.glass-card {
  @apply bg-white/90 backdrop-blur-sm;
}

.dark .glass-card {
  @apply bg-slate-900/80 backdrop-blur-sm;
}
```

### Text Wrapping

```css
.text-balance { text-wrap: balance; }
.text-pretty { text-wrap: pretty; }
```

### Scrollbar Hide

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### Safe Area Padding

```css
@supports (padding: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## Page Patterns

### Hero Section

```html
<div class="bg-gradient-to-r from-[#880000] to-[#ff0d13] py-16 md:py-24">
  <div class="max-w-7xl mx-auto px-4 text-center">
    <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-6">
      Start Your U.S. Business Fast & Fully Online
    </h1>
    <p class="text-lg text-white/90 mb-8 max-w-3xl mx-auto">
      Form your LLC, get your EIN, open a business bank account & stay compliant.
    </p>
    <a href="/checkout" class="inline-flex items-center gap-2 bg-white text-[#ff0d13] rounded-full px-8 py-3.5 font-semibold shadow-lg hover:bg-white/90">
      Start Your Business <ArrowRight />
    </a>
  </div>
</div>
```

### Navbar

```html
<header class="bg-gradient-to-r from-[#880000] to-[#ff0d13]">
  <div class="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
    <img src="/logo-white.png" alt="Logo" class="h-12" />
    <nav class="hidden lg:flex items-center gap-8">
      <a href="#" class="text-white text-lg font-semibold border-b-2 border-white pb-1">Home</a>
      <a href="#" class="text-white text-lg hover:text-white/80">Pricing</a>
    </nav>
    <div class="flex items-center gap-4">
      <a href="/login" class="text-white border-2 border-white rounded-full px-6 py-2 font-semibold hover:bg-white/10">Login</a>
      <a href="/checkout" class="bg-white text-[#ff0d13] rounded-full px-6 py-2.5 font-semibold shadow-lg">Start Now</a>
    </div>
  </div>
</header>
```

### Footer

```html
<footer class="bg-gradient-to-r from-[#880000] to-[#ff0d13] pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
      <div class="md:col-span-2">
        <img src="/logo-white.png" alt="Logo" class="h-12 mb-6" />
        <p class="text-white/90 max-w-sm">Your trusted partner in building global businesses.</p>
      </div>
      <div>
        <h4 class="text-white font-bold mb-4">Services</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-white/80 hover:text-white">LLC Formation</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/20 pt-8 flex justify-between items-center">
      <p class="text-white/80 text-sm">© 2024 BuzzFiling. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-white hover:text-white/80"><Youtube /></a>
        <a href="#" class="text-white hover:text-white/80"><Instagram /></a>
      </div>
    </div>
  </div>
</footer>
```

### Section with Label

```html
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-4">
    <div class="text-center mb-12">
      <span class="text-sm font-bold text-[#ff0d13] uppercase tracking-wide">Pricing Plans</span>
      <h2 class="text-3xl md:text-4xl font-semibold text-slate-900 mt-4 mb-4">Simple, Transparent Pricing</h2>
      <p class="text-slate-600 text-lg max-w-3xl mx-auto">Transparent plans with no hidden fees.</p>
    </div>
    <!-- Content -->
  </div>
</section>
```

### Admin Page Header

```html
<div class="mb-8">
  <h1 class="text-2xl font-semibold text-foreground">Dashboard</h1>
  <p class="text-muted-foreground mt-1">Welcome back, Admin</p>
</div>
```

### Admin Stat Cards Grid

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <div class="bg-card rounded-xl border p-6 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <span class="text-muted-foreground text-sm">Total Revenue</span>
      <div class="p-2 rounded-lg bg-emerald-500/10">
        <DollarSign class="h-5 w-5 text-emerald-500" />
      </div>
    </div>
    <p class="text-3xl font-bold">$125,430</p>
    <div class="flex items-center gap-1 mt-2 text-sm text-emerald-600">
      <ArrowUpRight class="h-4 w-4" />
      <span>+12.5%</span>
    </div>
  </div>
</div>
```

---

## Feature Checkmarks

```html
<div class="flex items-start gap-3">
  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff0d13] flex items-center justify-center">
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
      <path d="M1 5.5L5 9.5L13 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <span class="text-slate-900 text-base">LLC Formation</span>
</div>
```

---

## Adapting for ITINConnect

To use this design system for ITINConnect with a different brand color:

### 1. Replace Brand Colors

Change all instances of:
- `#ff0d13` → Your primary color (e.g., `#E84D1A` for orange)
- `#880000` → Your secondary/darker shade
- `from-[#880000] to-[#ff0d13]` → Your gradient

### 2. Update CSS Variables

```css
:root {
  --primary: oklch(/* your color */);
  --ring: oklch(/* your color */);
}

@theme inline {
  --color-brand: #YOUR_COLOR;
  --color-brand-hover: #YOUR_DARKER_COLOR;
  --color-brand-secondary: #YOUR_SECONDARY;
}
```

### 3. Update Components

Replace Tailwind classes:
- `text-[#ff0d13]` → `text-[#YOUR_COLOR]`
- `bg-[#ff0d13]` → `bg-[#YOUR_COLOR]`
- `focus:ring-[#ff0d13]/20` → `focus:ring-[#YOUR_COLOR]/20`
- `bg-gradient-to-r from-[#880000] to-[#ff0d13]` → Your gradient

---

## File Structure

```
/app
  /globals.css          # All CSS variables, dark mode, utilities
  /layout.tsx           # Font imports, metadata
  
/components
  /ui
    /button.tsx         # Button variants
    /card.tsx           # Card components
    /input.tsx          # Input component
    /badge.tsx          # Badge variants
    ...
  /sections
    /navbar.tsx         # Navigation
    /hero.tsx           # Hero section
    /footer.tsx         # Footer
    /pricing.tsx        # Pricing cards
    ...
  /admin
    /admin-shell.tsx    # Admin layout wrapper
    ...
```

---

This documentation provides a complete reference for recreating the BuzzFiling aesthetic in ITINConnect or any other project while maintaining consistency and quality.

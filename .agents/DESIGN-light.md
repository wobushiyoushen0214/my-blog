---
name: light
colors:
  surface: "#faf9f7"
  surface-dim: "#dadad8"
  surface-bright: "#faf9f7"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f4f3f1"
  surface-container: "#efeeec"
  surface-container-high: "#e9e8e6"
  surface-container-highest: "#e3e2e0"
  on-surface: "#1a1c1b"
  on-surface-variant: "#444748"
  inverse-surface: "#2f3130"
  inverse-on-surface: "#f1f1ef"
  outline: "#747878"
  outline-variant: "#c4c7c7"
  surface-tint: "#5f5e5e"
  primary: "#000000"
  on-primary: "#ffffff"
  primary-container: "#1c1b1b"
  on-primary-container: "#858383"
  inverse-primary: "#c8c6c5"
  secondary: "#665d51"
  on-secondary: "#ffffff"
  secondary-container: "#ebdece"
  on-secondary-container: "#6b6155"
  tertiary: "#000000"
  on-tertiary: "#ffffff"
  tertiary-container: "#1c1c19"
  on-tertiary-container: "#85847f"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#e5e2e1"
  primary-fixed-dim: "#c8c6c5"
  on-primary-fixed: "#1c1b1b"
  on-primary-fixed-variant: "#474746"
  secondary-fixed: "#eee0d1"
  secondary-fixed-dim: "#d1c5b5"
  on-secondary-fixed: "#211b11"
  on-secondary-fixed-variant: "#4e463a"
  tertiary-fixed: "#e5e2dd"
  tertiary-fixed-dim: "#c9c6c1"
  on-tertiary-fixed: "#1c1c19"
  on-tertiary-fixed-variant: "#474743"
  background: "#faf9f7"
  on-background: "#1a1c1b"
  surface-variant: "#e3e2e0"
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 64px
    fontWeight: "400"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: "400"
    lineHeight: "1.2"
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: "400"
    lineHeight: "1.3"
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system embodies "Serene Luxury"—a philosophy of essentialism, calm, and architectural precision. It targets a discerning audience that values quiet sophistication over loud branding. The aesthetic is a hybrid of **High-End Minimalism** and **Refined Glassmorphism**, creating a digital environment that feels like a physical gallery space.

The emotional response should be one of immediate decompression. The UI uses expansive whitespace (or "air"), delicate 0.5px borders, and deep Gaussian blurs to simulate layers of frosted glass and light. Every interaction is intentional, discarding decorative clutter in favor of structural elegance and tactile depth.

## Colors

The palette is rooted in a "Warm Stone" spectrum. In this light mode variant, the primary canvas is **#F9F8F6 (Warm White)**, providing a softer, more organic foundation than pure white.

- **Primary (#1A1A1A):** Used for high-contrast typography and structural anchors.
- **Secondary (#9D9284):** A soft linen tone for subtle UI elements and secondary text.
- **Tertiary (#E5E2DD):** A light stone grey for borders, dividers, and surface depth.
- **Surface Blurs:** Glassmorphic containers utilize a semi-transparent white (rgba 255, 255, 255, 0.4) with a high-saturation background blur (32px to 64px) to maintain legibility against the warm background.

## Typography

The typography system relies on the tension between the classical elegance of **EB Garamond** and the modern, technical precision of **Hanken Grotesk**.

Headlines should be set with tight tracking to emphasize the serif's silhouette. Body text in Hanken Grotesk is generously spaced to ensure maximum readability and a "breathable" feel. Use the `label-caps` style for navigation and small headers to add a rhythmic, architectural quality to the page layout.

## Layout & Spacing

The layout follows a **Fluid Grid** with generous outer margins to frame the content like an art book. A 12-column system is used for desktop, but the layout philosophy prioritizes "asymmetric balance"—allowing for significant negative space on one side of the screen to guide the eye.

Spacing should always feel "too large" rather than "too small." Use the 8px base unit, but lean towards larger increments (e.g., 64px, 128px) for section vertical padding to maintain the sense of luxury and scale.

## Elevation & Depth

Depth is achieved through **optical layering** rather than traditional drop shadows. This system uses:

1.  **Backdrop Blurs:** 32px to 48px Gaussian blurs on containers to create a "frosted glass" effect.
2.  **Fine Lines:** 0.5px solid borders in `#E5E2DD` or `rgba(0,0,0,0.1)` to define edges without adding visual weight.
3.  **Tonal Stacking:** Elevating a component means moving from the `#F9F8F6` background to a slightly lighter, glass-filtered surface.
4.  **Shadows:** When necessary for functional depth (e.g., a floating menu), use an ultra-diffused shadow: `0 20px 50px rgba(26, 26, 26, 0.05)`.

## Shapes

Shapes are disciplined and mostly **Soft (0.25rem)**. This slight rounding takes the "edge" off the brutalist origins of the grid, making it feel more human and tactile. Interactive elements like buttons and input fields use the base 4px radius, while larger containers may occasionally use 8px (`rounded-lg`) to maintain a consistent visual curvature relative to their size.

## Components

- **Buttons:** Primary buttons are solid `#1A1A1A` with white Hanken Grotesk text. Secondary buttons are ghost-style with a 0.5px border. Transitions should be slow (300ms) and ease-in-out.
- **Input Fields:** Minimalist underlines or 0.5px boxed borders. The focus state shifts the border color to a soft gold or primary black with no glow.
- **Cards:** Use glassmorphic backgrounds (`rgba(255, 255, 255, 0.4)`) with a 0.5px border. Cards should not have shadows; depth is provided by the backdrop blur.
- **Chips:** Small, uppercase Hanken Grotesk labels inside a pill-shaped container with a light stone fill (`#E5E2DD`).
- **Navigation:** Top-tier navigation uses high-contrast typography with significant horizontal spacing. Active states are indicated by a simple 0.5px underline or a weight shift.

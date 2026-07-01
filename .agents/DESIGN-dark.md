---
name: dark
colors:
  surface: "#131313"
  surface-dim: "#131313"
  surface-bright: "#393939"
  surface-container-lowest: "#0e0e0e"
  surface-container-low: "#1c1b1b"
  surface-container: "#1F2020"
  surface-container-high: "#2a2a2a"
  surface-container-highest: "#353534"
  on-surface: "#e5e2e1"
  on-surface-variant: "#c8c7be"
  inverse-surface: "#e5e2e1"
  inverse-on-surface: "#313030"
  outline: "#929189"
  outline-variant: "#474741"
  surface-tint: "#c9c6c2"
  primary: "#ffffff"
  on-primary: "#31302d"
  primary-container: "#e5e2dd"
  on-primary-container: "#656461"
  inverse-primary: "#5f5e5b"
  secondary: "#cfc5b6"
  on-secondary: "#353025"
  secondary-container: "#4f483d"
  on-secondary-container: "#c1b7a9"
  tertiary: "#ffffff"
  on-tertiary: "#333031"
  tertiary-container: "#e7e1e2"
  on-tertiary-container: "#676364"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e5e2dd"
  primary-fixed-dim: "#c9c6c2"
  on-primary-fixed: "#1c1c19"
  on-primary-fixed-variant: "#474743"
  secondary-fixed: "#ece1d2"
  secondary-fixed-dim: "#cfc5b6"
  on-secondary-fixed: "#201b12"
  on-secondary-fixed-variant: "#4c463b"
  tertiary-fixed: "#e7e1e2"
  tertiary-fixed-dim: "#cbc5c6"
  on-tertiary-fixed: "#1d1b1c"
  on-tertiary-fixed-variant: "#494647"
  background: "#131313"
  on-background: "#e5e2e1"
  surface-variant: "#353534"
  glass-stroke: rgba(255, 255, 255, 0.2)
  glass-fill: rgba(255, 255, 255, 0.1)
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 84px
    fontWeight: "400"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: "400"
    lineHeight: "1.2"
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: "400"
    lineHeight: "1.2"
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "500"
    lineHeight: "1.5"
    letterSpacing: 0.2em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 64px
  gutter: 32px
  margin-mobile: 24px
  stack-xl: 120px
  stack-md: 48px
---

## Brand & Style

This design system embodies the "Luxury of Silence," focusing on a meditative and high-end aesthetic. It is defined by a blend of **Minimalism** and **Glassmorphism**, designed to evoke feelings of calm, groundedness, and intentionality. The visual language prioritizes the "luxury of space," utilizing expansive white space and atmospheric blurs to create depth and focus.

The personality is quiet and contemplative, catering to wellness or high-end architectural lifestyle platforms. Interactions are intentionally slow-paced, replacing frantic digital feedback with ethereal, graceful transitions and a refined editorial feel.

## Colors

The palette is rooted in muted earth tones—cream, charcoal, and stone. It avoids clinical whites and harsh blacks in favor of natural, material-inspired hues.

- **Primary**: A warm, luminous cream (#F5F2ED) used for high-contrast typography and essential UI triggers against dark surfaces.
- **Secondary**: A desaturated taupe (#A89F91) for metadata, subtle borders, and secondary hierarchy.
- **Neutral**: Deep charcoal (#131313) provides the sophisticated, foundational surface.

The system relies heavily on semi-transparency. Rather than solid fills, use glassmorphic layers (10-20% opacity) over blurred imagery to maintain an atmospheric quality.

## Typography

This system pairs a historical, graceful serif with a sharp, modern sans-serif to bridge the gap between tradition and contemporary luxury.

- **Headlines (EB Garamond)**: The brand's primary voice. Use Italic and Regular weights. Lowercase treatments are encouraged for a poetic, softer feel in display settings.
- **Body & Navigation (Hanken Grotesk)**: Provides a functional, modern edge. It ensures high readability for descriptions and interface elements.
- **Labels**: Small caps with generous (0.2em) letter-spacing are used for navigational coordinates, UI instructions, and metadata.

## Layout & Spacing

The layout philosophy centers on a **Fluid Grid** with extreme emphasis on vertical rhythm and negative space.

- **Grid Model**: A 12-column desktop grid with 32px gutters. Content should avoid "boxy" layouts, opting for asymmetrical or centered compositions that feel curated.
- **Margins**: A 64px "safe area" frames the content on desktop, reducing to 24px on mobile to maintain an editorial border.
- **Corner Positioning**: Primary navigation and utility links (e.g., coordinates, audio toggles) should be pinned to the extreme corners of the viewport, leaving the center of the screen open for atmospheric content.
- **Stacking**: Use `stack-xl` (120px) to separate major content sections, ensuring every element has room to "breathe."

## Elevation & Depth

Hierarchy is achieved through **Atmospheric Layers** and transparency rather than traditional drop shadows.

- **Glassmorphism**: Interactive surfaces use a white fill at 10-20% opacity paired with a `backdrop-blur` of at least 20px. This allows background imagery to bleed through as softened light.
- **Ambient Occlusion**: When separation is strictly necessary (e.g., floating cards), use large, diffused shadows with 5% opacity and no spread to create a soft, natural lift.
- **Borders**: Define boundaries with ultra-fine lines (0.5px to 1px) at 20% opacity. These act as architectural guides rather than heavy structural containers.

## Shapes

The shape language is a balance between soft-modern architecture and perfect geometric circles.

- **Containers**: Standard UI cards and containers use a 0.5rem (8px) radius to soften the digital experience.
- **Perfect Circles**: Specifically reserved for high-intent interactive triggers. Progress rings, play buttons, and "Hold to Enter" actions should be rendered as thin-stroked circles.
- **Forms**: Input fields are stripped of boxy borders, using only 0.5px bottom strokes.

## Components

- **Navigation**: Minimalist text links in the `label-caps` style. Hover states should feature a slow fade in opacity or the appearance of a 0.5px underline.
- **Interactive Circles**: For primary "moment" actions, use a circular stroke-dash array. As the user interacts (e.g., "Hold to Enter"), the circle's border weight or color should fill progressively.
- **Glassmorphic Cards**: Used for overlays. These should have a 10% white background blur and a 0.5px white border at 20% opacity.
- **Buttons**: Primary buttons are either pill-shaped with a fine outline or simple text-links. Avoid heavy solid fills.
- **Input Fields**: Minimalist design with floating labels. Focus states are indicated by a slight increase in the bottom-stroke opacity or color shift to Primary Cream.
- **Progress Indicators**: Linear or circular, using fine line weights (1px or less) to track user journeys without cluttering the view.

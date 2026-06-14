# Portfolio Features Roadmap

This document outlines the ordered implementation plan for the Framer Motion-inspired visual and interactive features. Each feature is detailed with what you should expect to see upon successful completion.

---

## Completed Features

### 1. Custom SVG Outline Preloader
*   **What you see**: A circular white badge (black in light mode) fades and focuses onto the screen. Inside, your profile logo is hollowed out (showing the background). A diagonal glossy sheen sweeps across the badge, after which it fades out to reveal the page.

---

## Proposed Roadmap & Visual Expectations

### Phase 1: Core Interaction Upgrades (Replacing existing elements)

#### 2. Modern CSS Grid-Track Accordions (Upgrade)
*   **Implementation Order**: First (quickest win with highest layout impact).
*   **What you will see**: Clicking a project accordion in the Projects section will slide open its details smoothly to its exact content height. There will be no hardcoded height limits (cutting off text) and no speed lag (animating empty space), resulting in a perfect fluid expansion.

#### 3. Spring Physics Solver for Magnetic Buttons (Upgrade)
*   **Implementation Order**: Second (interactive polish).
*   **What you will see**: Buttons (social links, theme toggles, Back-to-Top, contact submit) will feel tactile and springy. When you move your cursor near them, they pull toward the mouse. When your cursor leaves, they overshoot their resting position and bounce (oscillate) slightly before settling, instead of sliding back linearly.

#### 4. Card Border Spotlight Glow (Upgrade)
*   **Implementation Order**: Third (visual polish).
*   **What you will see**: The full background spotlight glow behind project rows is replaced. Instead, only the borders of the project card nearest your cursor will illuminate, revealing the card boundaries dynamically.

---

### Phase 2: Navigation & Scroll Indicators (Adding page-wide features)

#### 5. Shared Layout Navigation Indicator (Sliding Pill)
*   **Implementation Order**: Fourth (high aesthetic wow-factor).
*   **What you will see**: A glassmorphic, rounded capsule background sits behind your header menu items. When you hover from "Projects" to "Experience", the pill slides and stretches dynamically from link to link in a single fluid motion. When you leave the menu, it returns to the active section.

#### 6. Scroll-Linked Progress Ring (SVG Circle)
*   **Implementation Order**: Fifth (minimalist feedback).
*   **What you will see**: A thin, circular progress ring wraps around the "Back to Top" button in the bottom-right corner. As you scroll down the page, the ring fills clockwise with your theme accent color. When you scroll back up, it empties.

---

### Phase 3: Layout & Media Showcases (For project screenshots & self-photos)

#### 7. Scroll-Triggered Section Entrances
*   **Implementation Order**: Sixth (layout choreography).
*   **What you will see**: Sections and timeline cards start invisible. As you scroll down, they fade in and translate upward by `20px` in a staggered sequence, preventing the page from looking static.

#### 8. 3D Hover-Tilt Cards & Clipped Parallax (Screenshots)
*   **Implementation Order**: Seventh (screenshot showcase).
*   **What you will see**: Hovering over a project screenshot tilts the card in 3D space based on mouse position. The image inside zooms and pans slightly in the opposite direction (parallax depth), and a glass-like diagonal sheen sweeps across it.

#### 9. Fan-Out Picture Deck (Profile Photos)
*   **Implementation Order**: Eighth (self-photos showcase).
*   **What you will see**: 2-3 photos of yourself (Minecraft style, tech style, etc.) look like a stacked, slightly rotated deck of cards. Hovering over the stack spreads the cards out side-by-side using spring physics, letting you hover over any image to bring it to the foreground.

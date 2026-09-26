# Page Banners & Configuration Layout Specification

This document details the visual architecture, layout hierarchy, and design patterns established for the **Asset Manager** interface (specifically the Page Banners component). The focus is on the structural arrangement, component relationships, and interactive zones designed for this concept.

## 1. High-Level Layout Philosophy
The interface is designed as a **vertical stack of distinct functional zones**, constrained within a fixed-width panel (right 50% of screen). The layout emphasizes:
*   **Vertical Hierarchy**: Top-down flow from high-level mode selection -> content browsing -> fine-tuning/configuration.
*   **Shape Consistency**: Uniform use of `rounded-2xl` for major containers and `rounded-xl` for internal modules to create a soft, modern feel.
*   **Visual Feedback**: Heavy reliance on gradients and active-state borders to communicate context without text overload.

---

## 2. Header Zone (Mode Selection)
The top-most section is a **Two-Column Control Area** designed to manage the primary state of the application.

### Left Column: Entity Selector (Orb/Theme)
*   **Structure**: Vertical stack.
*   **Navigation**: A segmented toggle switch (pill-shaped) at the top allows switching between two distinct entity types.
*   **Visual Anchor**: Below the toggle sits a **Fixed-Shape Container** (Square with Rounded Corners).
    *   **Purpose**: Prevents layout shift when switching modes.
    *   **Design**: Uses a gradient background and a central iconic glyph to represent the active entity. It scales slightly on activation to provide tactile feedback.

### Right Column: View Selector (Page/App)
*   **Structure**: Vertical stack, mirroring the Left Column for symmetry.
*   **Navigation**: A segmented toggle switch compatible with the left column's design.
*   **Visual Anchor**: A **Wide Aspect-Ratio Container** (Rectangle).
    *   **Purpose**: Acts as a preview area/placeholder for the banner.
    *   **Design**: Maintains a fixed height to align baselines with the Left Column. The background gradient shifts hue to distinctively color-code the active view mode (e.g., Cool tones for Page, Warm tones for App).

---

## 3. Carousel Zone (Content Navigation)
Located immediately below the header, this section serves as the primary navigation engine for selecting content presets.

### Header: Drill-Down Navigation
Instead of a static title, the header features a **Breadcrumb/Tab Hybrid**.
*   **Tabs**: "Folder" vs. "File".
*   **Behavior**:
    *   **Folder View**: default state, displays high-level categories.
    *   **File View**: initially disabled, becomes active only after a folder selection.
*   **Action**: Includes a "Back" button mechanism within the card list itself to traverse up the hierarchy.

### Scrollable viewport
*   **Layout**: Horizontal scrolling flex container.
*   **Card Design**:
    *   **Folders**: Vertical cards. Top section contains a visual preview (image or color). Bottom section contains labeling. Includes overlay badges (e.g., item count) to signify "container" status.
    *   **Files**: Similar aspect ratio but distinguished by visual density (e.g., different overlay icons).
    *   **Placeholders**: Dashed-border items at the end of lists serve as specific "Add New" actions.

---

## 4. Configuration Zone (Fine-Tuning)
The bottom section is a bounded, scrollable panel containing all manipulation controls. It uses a **Nested Grid Layout** to pack high-density controls into a compact space.

### Column 1: Spatial Controls (Quadrants)
*   **Width**: Fixed width (narrower column).
*   **Components**:
    *   **Toggle Row**: A text label paired with a pill-shaped toggle switch.
    *   **Quadrant Grid**: A 2x2 grid of square buttons representing screen corners.
    *   **Action Button**: A full-width secondary button for navigation to advanced settings.
*   **Design**: Containerized with a darker background to distinguish it as a discrete control unit.

### Column 2: Properties & Adjustments
*   **Width**: Flexible (takes remaining space).
*   **Layout**: Vertical stack of two primary modules.

#### Module A: Properties Header (Compacted)
A highly dense row containing three distinct control types, aligned horizontally:
1.  **Color Palette**:
    *   **Layout**: Split into **Two Rows**.
    *   **Design**: Small, circular swatches. Tightly packed to minimize vertical footprint.
2.  **Theme Selector**:
    *   **Location**: Middle / Center.
    *   **Design**: Standard dropdown input, vertically aligned with the valid click targets of the palette.
3.  **Context Selector**:
    *   **Location**: Right side.
    *   **Design**: Standard dropdown input, mirroring the Theme Selector for visual balance.

#### Module B: Transformation Sliders
*   **Layout**: 2x2 Grid (on standard displays) or Stacked (on narrow displays).
*   **Input Design**:
    *   **Header**: Label (Icon + Text) and Value readout (Monospace font for precision) aligned to opposite sides.
    *   **Track**: Minimalist horizontal range slider below the header.

---

## Summary of Interaction Patterns
1.  **Mode Switching**: Occurs at the top (Header). Changes the context for the entire panel.
2.  **Category Drill-Down**: Occurs in the middle (Carousel). User selects a Folder -> Carousel refreshes with Files -> User selects a File.
3.  **Property Tuning**: Occurs at the bottom (Config). Changes apply to the selection made in the Carousel.

# Asset Manager Page Documentation

## Overview

The **Asset Manager Page** (`AssetManagerPage.jsx`) is a centralized hub designed to manage, browse, and configure the visual assets of the application. It consolidates the configuration for **Orb Presets**, **Page Banners** (Layer 2), **App Assets**, and **Themes** into a single, unified interface.

This page replaces scattered configuration screens with a cohesive **4-tab workflow**, allowing users to contextually switch between different asset types while maintaining a consistent set of adjustment tools (Spatial Controls, Properties).

## Key Features

-   **Unified 4-Tab Navigation**: Seamlessly switch between **Orb**, **Page**, **App**, and **Theme** contexts.
-   **Contextual Content Carousel**: Displays relevant assets (e.g., Orb Presets, Page Banners) based on the active tab.
    -   **Orb Tab**: Features a horizontal carousel with **Spill Reflecting** visuals, matching the live Orb menu appearance.

-   **Spatial Configuration**: Precise controls for positioning assets (Top-Left, Top-Right, etc.) and fine-tuning coordinates.
    -   **Orb Config**: Dedicated **Spill Visualizer** and **Advanced Crop** integration.
-   **Property Adjustments**: Global controls for **Scale**, **Opacity**, and **Offsets**.

---

## Page Layout & Zones

The page is organized into three distinct vertical zones:

### 1. Header & Navigation (Zone 0)
Located at the very top of the page, this zone contains the primary navigation:
-   **Orb Tab**: Manage generic and custom Orbs, including advanced spill and crop settings.
-   **Page Tab**: Manage Page Banners (Layer 2 images) and their folder associations.
-   **App Tab**: (Placeholder) Future home for application icons and window assets.
-   **Theme Tab**: (Placeholder) Future home for global color themes and styling.

The navigation is centered and provides visual feedback for the active state.

### 2. Content Carousel (Zone 1)
The main interactive area for browsing assets. The horizontal carousel takes up the majority of the page height.
-   **Dynamic Content**:
    -   **Active Tab = Orb**: Displays the **Orb Presets Carousel** containing only independent presets and Group Leaders.
        -   **Spill Reflection**: Presets display their actual spill configuration (elements breaking the circle bounds) exactly as they appear in the top application menu.
        -   **Group Navigation**: Group Leaders feature a "View Group" button (grid icon) to open the `OrbGroupColumn`.
            -   **Group Member Config**: Within `OrbGroupColumn`, members now have direct sliders for **Scale**, **X-Offset**, **Y-Offset**, and **Spill Toggles**, replacing the previous folder/playlist assignment UI.
        -   **Hover Actions**: Quick access to **Folder Assignments**, **Playlist Overrides**, and **Delete**.
    -   **Active Tab = Page**: Displays the **Page Banners Carousel** containing only independent banners and Group Leaders.
        -   **Group Navigation**: Group Leaders feature a "View Group" button to open the `PageGroupColumn`.
            -   **Group Member Config**: Within `PageGroupColumn`, members now have direct sliders for **Scale**, **X-Offset**, and **Y-Offset**.
    -   **App/Theme**: Displays "Coming Soon" placeholders.

### 3. Configuration Panel (Zone 2)
A fixed-height panel at the bottom for fine-tuning the selected asset.

#### For Orb Tab:
-   **Spill Visualizer**: A graphical representation of the Orb with toggleable quadrants (TL, TR, BL, BR) to enable/disable spill masked areas.
    -   **Advanced Crop**: A button to open the **OrbCropModal** for precise mask editing per quadrant.
    -   **Upload/Remove**: Direct controls to upload a new source image or remove the current one.
    -   **Note**: The spill visualizer intentionally hides the image opacity to focus on the mask shape, though the clip path remains active.
-   **Property Sliders**:
    -   **Scale**: 0.5x to 3.0x (with store persistence).
    -   **X-Offset**: -100px to +100px.
    -   **Y-Offset**: -100px to +100px.
-   **Save Actions**:
    -   **Save as New Leader**: Saves the current configuration as a new, independent Orb preset (Group Leader).
    -   **Save to Group**: Select an existing Group Leader from the dropdown and click "Add" to save the current configuration as a subordinate member of that group.

#### For Page Tab:
-   **Preview Area**: Large 16:9 preview of the current page banner image.
    -   **Upload/Remove**: Buttons to upload a new page banner or remove the current selection.
-   **Property Controls**:
    -   **Scale**: 50% to 200%.
    -   **BG Color**: Color picker to set the paired background color (Layer 1).
    -   **X/Y Offsets**: 0-100% positioning sliders.
-   **Save Actions**:
    -   **Save as New Leader**: Save the new banner as an independent Group Leader.
    -   **Save to Group**: Assign the new banner as a subordinate to an existing Group Leader.
    -   **Update**: (When editing) Save changes to the existing banner.
    -   **Reset**: Restore default properties.

#### For App/Theme Tabs (Placeholder):
-   **Spatial Controls**: (Legacy/Standard) A 2x2 grid representing screen quadrants for quick anchor positioning.
-   **Context Selectors**: Dropdowns for "Theme" and "Context".

---

## State Management

The page utilizes local state for interface control and global stores for data persistence.

### Local State (`AssetManagerPage.jsx`)
-   `activeTab`: Strings `'orb' | 'page' | 'app' | 'theme'`. Determines the top-level context.
-   `browserMode`: Strings `'folder' | 'file'`. Determines the sub-view mode for the carousel.
-   `isCropModalOpen`: Boolean. Controls the visibility of the `OrbCropModal`.
-   `hoveredFavoriteId`, `folderAssignmentOpenId`, `playlistAssignmentOpenId`: ID strings. Manage hover and dropdown states for Orb presets.

### Global Dependencies (`useConfigStore`)
-   **Data Sources**:
    -   `layer2Folders`: Source for Page Banner images.
    -   `orbFavorites`: Source for Orb Presets.
    -   `orbSpill`, `orbImageScale`, `orbImageXOffset`, `orbImageYOffset`, `orbAdvancedMasks`, `orbMaskRects`: Source for live Orb configuration.
-   **Actions**:
    -   `applyLayer2Image(img)`: Sets the global background/banner image.
    -   `applyOrbFavorite(item)`: Sets the global Orb configuration.
    -   `setOrbSpill`, `setOrbImageScale`, etc.: Direct setters for Orb properties.
    -   `updateOrbFavoriteFolders`, `updateOrbFavoritePlaylists`: Manage associations.

---

## Future Roadmap

1.  **App Tab Implementation**: Add management for application dock icons, tray icons, and window decorations.
2.  **Theme Tab Implementation**: Expose a color token editor for global theme customization.
3.  **File View Integration**: Activate the 'File' browser mode to allow managing raw assets (uploads/deletes) independent of their logical folders.

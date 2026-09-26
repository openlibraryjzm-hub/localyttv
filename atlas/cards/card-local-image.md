# Local Image Card Design & Layout

This document describes the design system, aspect-ratio handling, and layout rules for the Local Image Card component (`LocalImageCard.jsx`).

**Related Documentation:**
- `local-images.md` — Local image pipeline integration (backend and processing)
- `cards/card-video.md` — Standard video card layouts
- `ui-layout.md` — App grid system and layout shells

---

## 1. Visual & Layout Design (YouTube Style)

Unlike standard video cards which follow YouTube's structured design (bordered card body, white metadata bar below the thumbnail, title visible permanently), the default **YouTube style** Local Image Card adopts a frameless, transparent aesthetic that maximizes image focus:

- **Frameless Aesthetic**:
  - No solid card borders, shadow boundaries, or purple outlines (unless currently selected or playing).
  - Designed to mimic the organic feel of a file explorer.
  - Transparent backgrounds allow the app/page background to bleed through cropped border areas.

- **Expanded Thumbnail Area**:
  - The white title/metadata strip below the thumbnail is **removed**.
  - The image expands to fill the entire card bounds, utilizing all available vertical and horizontal space.

- **Interactive Hover Overlays**:
  - **Header Gradient Overlay**: Hovering the card reveals a black-to-transparent gradient header (`bg-gradient-to-b from-black/85 via-black/50 to-transparent`) overlaying white text:
    - **Title**: Absolute file base name (truncated with ellipse).
    - **Subtitle**: `"Local Image"` category tag.
  - **Action Menu**: A translucent action button (`bg-black/60 hover:bg-black/80`) is positioned in the **bottom-right** corner on hover, launching the `VideoCardThreeDotMenu`.

- **Card Badges**:
  - **Top-left (Watch Count)**: If the image has been viewed/opened (`watchCount > 0`), a green checkmark watch-count pill is rendered.
  - **Pin Badges**: Pin cycling badges render in the top corners when active.

---

## 2. Aspect Ratio & Portrait Alignment

Local images can be in landscape or portrait layout. `LocalImageCard` dynamically adapts its rendering style to prevent visual stretching:

### Portrait Images (`naturalHeight > naturalWidth`)
- Detected on image load and cached using a React ref (`hasCheckedRef`) to prevent forced synchronous layout thrashing (see `local-images.md` Section 6 for details):
  ```javascript
  const handleImageLoad = (e) => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalHeight > naturalWidth) {
      setIsPortrait(true);
    }
  };
  ```
- Renders with **`object-fit: contain`**.
- Sets background color to **`transparent`**.
- **Result**: Vertical/portrait images scale to fit the card width without cropping the top or bottom, and have transparent flanking borders showing the page background rather than solid black bars.
- **Lazy Loading**: `<img>` tags utilize the `loading="lazy"` attribute to delay loading and decoding until they scroll into view.

### Landscape Images
- Renders with **`object-fit: cover`**.
- Fits cleanly within the aspect bounds.

---

## 3. Twitter Style Variant

When `cardStyle === 'twitter'` is active, `LocalImageCard` switches to a social feed style card:
- Draws a subtle, bordered card background with rounded corners.
- Renders a mock author profile image and user handle (defaulting to `"Local Image"` / `@Local Image`).
- Renders the image thumbnail with letterboxing inside the card top margins, placing text descriptions below it.

---

## 4. Grid Height Collapse Fixes

Because local images lack a text/metadata bottom bar, they have **zero natural content height** (images are absolute, title overlays are hover-only). 

In CSS Grid layouts, if grid rows have no explicit height and grid items lack a natural min-content height, the row collapses to `0px` height, rendering the cards invisible. To resolve this:

1. **Card Component Aspect Ratio**:
   In [LocalImageCard.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/LocalImageCard.jsx), the YouTube layout root element is styled with:
   ```tailwind
   aspect-[4/3] w-full
   ```
   This locks the card container to a 4:3 ratio based on the column width.

2. **Parent Grid Wrapper Heights**:
   In [VideosPage.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/VideosPage.jsx), the wrapper `div` that represents the grid cell applies a conditional height:
   ```javascript
   const isImage = video.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);

   return (
     <div key={video.id} className={`w-full ${isImage ? 'h-auto' : 'h-full'} flex flex-col justify-center`}>
       <VideoCard {...commonProps} cardStyle={videoCardStyle} />
     </div>
   );
   ```
   - **`h-auto`** (for images) prevents circular flex height calculations from overriding the `aspect-[4/3]` of the child, correctly propagating the card height to the grid row.
   - **`h-full`** (for standard videos) ensures regular cards still expand and stretch uniformly to match the height of the tallest card in the row.

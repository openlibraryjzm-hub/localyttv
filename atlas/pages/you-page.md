# YouPage

YouPage is a dedicated page for profile and signature configuration, accessed via the "You" button in the Settings Page navigation. It appears as a full page below the Page Banner.

**Related Documentation:**
- **Settings Page**: See `ui-pages.md` (Section 4.1.8) for Settings Page overview
- **State Management**: See `state-management.md` for configStore details

---

## 1: User-Perspective Description

- **Page Structure**:
  - **Page Banner**: "Signature & Profile" title with description
  - **Back Button**: "Back to Settings" button in banner's top-right corner
  - **Navigation Buttons**: Four buttons (Orb, You, Page, App) positioned at bottom of Page Banner
  - **Sticky Toolbar**: Contains Colored Prism Bar
  - **Scrollable Content**: Profile configuration below the banner

- **Profile Configuration Section** (collapsible, starts collapsed):
  - **Collapse/Expand Toggle**: Button in section header to show/hide configuration
  - **Left Side** (max-width 50%):
    - **Name / Pseudonym**: Text input for user's display name
    - **Default Signatures**: Grid of lenny face signatures (3 columns)
      - Click any signature to apply it
      - Selected signature highlighted with sky-blue border
  - **Right Side**:
    - **Custom ASCII Avatar Editor**: Multi-line textarea for custom ASCII art
      - Supports multi-line ASCII art
      - Help text below editor
      - Resizable vertically

- **Preview Section** (below configuration):
  - Shows banner preview with name and signature
  - Auto-detects layout (single-line vs multi-line)

- **External Link Banner**:
  - Link to EmojiCombos.com for finding more ASCII art

## 2: File Manifest

**UI/Components:**
- `src/components/YouPage.jsx`: Dedicated profile and signature configuration page component
- `src/components/PageBanner.jsx`: Page banner with back button

**State Management:**
- `src/store/configStore.js`:
  - `userName`, `setUserName`: User's display name
  - `userAvatar`, `setUserAvatar`: User's ASCII signature

## 3: The Logic & State Chain

**Configuration Flow:**
1. User enters name → `setUserName()` updates store → Persisted to localStorage
2. User selects default signature → `setUserAvatar()` updates store → Persisted to localStorage
3. User types custom ASCII art → `setUserAvatar()` updates store → Persisted to localStorage
4. Changes immediately reflected in preview and page banners

**Source of Truth:**
- `configStore.userName`: User's display name
- `configStore.userAvatar`: User's ASCII signature/avatar
- All state persisted to `localStorage` via Zustand persist middleware

**State Dependencies:**
- When `userName` changes → Preview updates → Page banners reflect new name
- When `userAvatar` changes → Preview updates → Page banners reflect new signature

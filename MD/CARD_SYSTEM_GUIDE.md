# Card System Guide

## Overview

The new card system makes it **easy and safe** to add complex functionality to cards without breaking existing behavior. No more gambling with click handlers!

## Core Components

### 1. `Card` - The Foundation
Handles all click logic automatically. Action areas won't trigger card clicks.

```jsx
<Card
  onClick={handleCardClick}
  selected={isSelected}
  playing={isPlaying}
>
  {/* Your card content */}
</Card>
```

### 2. `CardThumbnail` - Image/Video Thumbnail
Consistent thumbnail display with badges and overlays.

```jsx
<CardThumbnail
  src={thumbnailUrl}
  alt="Video title"
  badges={[
    { component: <Badge />, position: 'top-right' },
  ]}
  overlay={<PlayButton />}
/>
```

### 3. `CardContent` - Text Content
Title, subtitle, metadata, and action buttons.

```jsx
<CardContent
  title="Video Title"
  subtitle="Video description"
  metadata="32 videos"
  actions={<CardActions />}
/>
```

### 4. `CardActions` - Action Buttons & Menus
Quick actions and dropdown menus.

```jsx
<CardActions
  quickActions={[
    { icon: <StarIcon />, onClick: handleStar, title: "Assign" }
  ]}
  menuOptions={[
    { label: 'Delete', action: 'delete', danger: true }
  ]}
  onMenuOptionClick={handleMenuClick}
/>
```

### 5. `CardMenu` - Enhanced Dropdown
Supports submenus for complex options (like folder selection).

```jsx
<CardMenu
  options={[
    { label: 'Assign to Folder', submenu: 'folders' }
  ]}
  submenuOptions={{
    folders: [
      { label: 'Red', action: 'assignFolder', folderColor: 'red' }
    ]
  }}
  onOptionClick={handleClick}
/>
```

## Example: Video Card

See `VideoCard.jsx` for a complete example showing:
- Delete functionality
- Quick assign to folder (star button)
- Assign to any folder (menu → submenu)
- Set quick assign folder (menu → submenu)
- All without breaking card click behavior!

## Adding New Functionality

### Step 1: Add Quick Action Button
```jsx
quickActions={[
  {
    icon: <YourIcon />,
    onClick: handleYourAction,
    title: "Your Action",
    color: "#ff0000" // optional
  }
]}
```

### Step 2: Add Menu Option
```jsx
menuOptions={[
  {
    label: 'Your Action',
    icon: <YourIcon />,
    action: 'yourAction',
    danger: false // true for red styling
  }
]}
```

### Step 3: Handle the Action
```jsx
const handleMenuClick = (option) => {
  switch(option.action) {
    case 'yourAction':
      // Do your thing
      break;
  }
};
```

## Benefits

✅ **No more click handler conflicts** - Action areas automatically don't trigger card clicks
✅ **Easy to extend** - Just add options to arrays
✅ **Consistent styling** - All cards look and behave the same
✅ **Submenu support** - Complex options (like 16 folders) work cleanly
✅ **Type-safe** - Clear prop interfaces
✅ **Reusable** - Use same components for playlists, videos, etc.

## Migration

To migrate existing cards:

1. Replace card div with `<Card>` component
2. Move thumbnail to `<CardThumbnail>`
3. Move content to `<CardContent>`
4. Move action buttons to `<CardActions>`
5. Remove all `stopPropagation` calls - they're handled automatically!

See `VideoCard.jsx` for a complete example.


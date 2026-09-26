# Audio Visualizer Implementation Specification
## Exact Rainmeter Widget Replication

**Source**: VisBubble v3.1 (undefinist)  
**Config Files**: `BarExtrude.ini` + `Settings.inc`

---

## Exact Parameter Values

### Visualization Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Bar Count** | `113` | High count for smooth circle |
| **Bar Width** | `4` px | Line width |
| **Base Radius** | `76` px | Distance from center to bar start |
| **Max Bar Length** | `76` px | Maximum extension from base radius |
| **Min Bar Length** | `7` px | Minimum extension (base offset) |
| **Total Visual Radius** | `152` px | 76px + 76px (perfect for 154px orb!) |
| **Color** | `255,255,255,255` | White (RGBA) |
| **Smoothing** | `0` | No smoothing (raw frequency) |
| **Angle Coverage** | `360°` | Full circle |
| **Start Angle** | `270°` | Bottom (6 o'clock position) |
| **Direction** | Clockwise | `ClockWise = 1` |
| **Bar Direction** | Outward | `Inward = 0` |

### Audio Processing Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **FFT Size** | `2048` | High resolution frequency analysis |
| **FFT Overlap** | `1024` | Half of FFTSize |
| **FFT Attack** | `237` ms | Attack time |
| **FFT Decay** | `39` ms | Decay time |
| **Frequency Min** | `60` Hz | Low frequency cutoff |
| **Frequency Max** | `11000` Hz | High frequency cutoff |
| **Sensitivity** | `64` | Gain multiplier |
| **Update Rate** | `25` ms | 40 FPS refresh rate |

---

## Component API Specification

### AudioVisualizer Component Props

```typescript
interface AudioVisualizerProps {
  enabled: boolean;
  orbSize: number;              // 154px (for positioning)
  
  // Visualization
  barCount: number;             // 113
  barWidth: number;             // 4
  radius: number;               // 76
  radiusY?: number;             // 76 (optional, for elliptical)
  maxBarLength: number;         // 76
  minBarLength: number;         // 7
  colors: string | number[];    // "255,255,255,255" or [255,255,255,255]
  smoothing: number;             // 0 (0-1 range)
  
  // Geometry
  angleTotal: number;           // Math.PI * 2 (360°)
  angleStart: number;            // -Math.PI / 2 (270°)
  clockwise: boolean;            // true
  inward: boolean;              // false
  
  // Audio Processing
  fftSize: number;               // 2048
  freqMin: number;               // 60 (Hz)
  freqMax: number;               // 11000 (Hz)
  sensitivity: number;           // 64
  updateRate: number;            // 25 (ms)
}
```

### Default Props (Exact Rainmeter Match)

```javascript
const defaultProps = {
  barCount: 113,
  barWidth: 4,
  radius: 76,
  radiusY: 76,
  maxBarLength: 76,
  minBarLength: 7,
  colors: [255, 255, 255, 255],  // White RGBA
  smoothing: 0,
  angleTotal: Math.PI * 2,       // 360°
  angleStart: -Math.PI / 2,      // 270° (bottom)
  clockwise: true,
  inward: false,
  fftSize: 2048,
  freqMin: 60,
  freqMax: 11000,
  sensitivity: 64,
  updateRate: 25,                // 40 FPS
};
```

---

## Implementation Details

### 1. Coordinate System

**Rainmeter Coordinate System:**
- 0° = Right (3 o'clock)
- 90° = Bottom (6 o'clock) 
- 180° = Left (9 o'clock)
- 270° = Top (12 o'clock)

**Standard Math Coordinate System:**
- 0° = Right (3 o'clock)
- 90° = Top (12 o'clock)
- 180° = Left (9 o'clock)
- 270° = Bottom (6 o'clock)

**Our Implementation:**
- Use standard math coordinates
- Start at `-Math.PI / 2` (270° = bottom/6 o'clock)
- Rotate clockwise: `true`

### 2. Bar Positioning Formula

```javascript
// For each bar i (0 to barCount-1):
const angle = angleStart + (angleTotal / barCount) * (clockwise ? i : (barCount - 1 - i));
const normalizedAngle = angle % (Math.PI * 2);

// Base position (at radius)
const baseX = centerX + radius * Math.cos(normalizedAngle);
const baseY = centerY + radiusY * Math.sin(normalizedAngle);

// Bar length from frequency data
const frequencyValue = frequencyData[i]; // 0-255
const normalizedValue = frequencyValue / 255; // 0-1
const barLength = minBarLength + (normalizedValue * (maxBarLength - minBarLength));

// End position (extended)
const endX = baseX + barLength * Math.cos(normalizedAngle);
const endY = baseY + barLength * Math.sin(normalizedAngle);
```

### 3. Smoothing (Currently Disabled)

With `Smoothing = 0`, no smoothing is applied. If smoothing were enabled:

```javascript
// Neighbor averaging (3-bar average for full circle)
const prevValue = frequencyData[(i - 1 + barCount) % barCount];
const currValue = frequencyData[i];
const nextValue = frequencyData[(i + 1) % barCount];
const smoothedValue = (prevValue + currValue + nextValue) / 3;
```

### 4. Frequency Band Mapping

```javascript
// Map 113 bars to frequency spectrum
// FFT gives us frequencyBinCount = fftSize / 2 = 1024 bins
// We need to map these to 113 bars

const frequencyBinCount = fftSize / 2; // 1024
const binsPerBar = frequencyBinCount / barCount; // ~9 bins per bar

for (let i = 0; i < barCount; i++) {
  const startBin = Math.floor(i * binsPerBar);
  const endBin = Math.floor((i + 1) * binsPerBar);
  
  // Average or max value in this range
  let sum = 0;
  for (let bin = startBin; bin < endBin; bin++) {
    sum += frequencyData[bin];
  }
  barValues[i] = sum / (endBin - startBin);
}
```

### 5. Color Format

**Input Format**: `"255,255,255,255"` (RGBA string) or `[255,255,255,255]` (array)

**Canvas Format**: `"rgba(255,255,255,255)"` or `"#FFFFFF"`

**Conversion:**
```javascript
function parseColor(color) {
  if (typeof color === 'string') {
    const [r, g, b, a = 255] = color.split(',').map(Number);
    return `rgba(${r},${g},${b},${a / 255})`;
  } else if (Array.isArray(color)) {
    const [r, g, b, a = 255] = color;
    return `rgba(${r},${g},${b},${a / 255})`;
  }
  return color; // Already formatted
}
```

---

## Integration with Orb Menu

### Positioning

```javascript
// Orb is 154px diameter, centered
const orbSize = 154;
const orbCenterX = orbSize / 2;
const orbCenterY = orbSize / 2;

// Visualizer extends from 76px to 152px radius
// Total canvas size needed: 152px * 2 = 304px
// But we can position it around the orb

const canvasSize = orbSize + (maxBarLength * 2); // 154 + 152 = 306px
```

### Z-Index Layering

```
Background (z-0)
  ↓
Visualizer Canvas (z-5) - Below orb buttons
  ↓
Orb Image (z-40)
  ↓
Orb Buttons (z-50) - On hover
```

---

## Performance Considerations

### Optimizations

1. **Update Rate**: 25ms = 40 FPS (matches Rainmeter)
2. **FFT Size**: 2048 (high quality, but manageable)
3. **Bar Count**: 113 (high count, but Canvas can handle it)
4. **No Smoothing**: Reduces computation (Smoothing = 0)

### Expected Performance

- **CPU Usage**: 1-3% (similar to Rainmeter)
- **Memory**: Minimal (small frequency arrays)
- **Frame Rate**: 40 FPS (25ms updates)

---

## Testing Checklist

- [ ] 113 bars render correctly in full circle
- [ ] Bars start at bottom (270°) and rotate clockwise
- [ ] Bars extend outward (not inward)
- [ ] Bar length ranges from 7px to 76px
- [ ] White color (`255,255,255,255`) displays correctly
- [ ] 4px bar width matches Rainmeter
- [ ] 40 FPS update rate (25ms)
- [ ] Frequency mapping (60Hz - 11kHz range)
- [ ] FFT 2048 resolution
- [ ] Positioning around 154px orb (76px radius + 76px max = 152px total)

---

## Next Steps

1. ✅ Settings extracted - Ready for implementation
2. Implement WASAPI audio capture (Rust backend)
3. Create AudioVisualizer component (React frontend)
4. Integrate with PlayerController orb section
5. Test and tune to match Rainmeter widget exactly

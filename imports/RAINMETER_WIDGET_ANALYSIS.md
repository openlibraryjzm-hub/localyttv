# Rainmeter Widget Configuration Analysis
## BarExtrude.ini (VisBubble v3.1)

**Source File**: `imports/BarExtrude.ini`  
**Widget Name**: VisBubble  
**Author**: undefinist  
**Version**: 3.1

---

## Extracted Configuration Parameters

### Update Rate
- **Update**: `25` (milliseconds)
- **FPS**: ~40 FPS (1000ms / 25ms = 40)
- **Note**: This is the refresh rate for the visualizer

### Audio Source
- **Plugin**: `AudioLevel` (WASAPI loopback capture)
- **Measure**: `mAudioOut`
- **Bands**: `(#NumOfItems#+4)` - Number of frequency bands (depends on NumOfItems variable)

### Visualization Type
- **Meter Type**: `Roundline` (circular bars extending outward)
- **Style**: `styleLine`
- **Rendering**: Circular bars positioned around a center point

### Key Variables (Referenced but defined in Settings.inc)

The following variables are referenced in the formulas but need to be extracted from `Settings.inc`:

1. **`NumOfItems`** - Number of bars in the visualizer
   - Used in: Bar count, band measures, factory scripts
   - Formula: `Bands=(#NumOfItems#+4)`

2. **`ItemColor`** - Color of the bars
   - Used in: `LineColor=#ItemColor#`
   - May support gradients (see Color.lua script)

3. **`ItemWidth`** - Width of each bar
   - Used in: `LineWidth=(#ItemWidth#/2)`

4. **`Radius`** - Base radius from center
   - Used in: X position calculation: `#Radius#*Cos(#FORMULA_THETA#%(PI*2))+#Radius#+#ExtrudeMax#`

5. **`RadiusY`** - Y-axis radius (for elliptical shapes)
   - Used in: Y position calculation: `#RadiusY#*Sin(#FORMULA_THETA#%(PI*2))+#RadiusY#+#ExtrudeMax#`

6. **`ExtrudeMax`** - Maximum bar length (outward extension)
   - Used in: Position and length calculations

7. **`ExtrudeMin`** - Minimum bar length (base offset)
   - Used in: `LineLength` formula

8. **`Smoothing`** - Smoothing factor for bar animation
   - Used in: `FORMULA_AVG` calculations
   - Formula: `((#FORMULA_AVG#-[mBand%%])*{#Smoothing#}+[mBand%%])`
   - Range: 0-1 (0 = no smoothing, 1 = maximum smoothing)

9. **`AngleTotal`** - Total angle coverage (in radians)
   - Used in: `FORMULA_THETA` calculation
   - Full circle: `PI * 2` (6.28318...)
   - Partial circle: Less than `PI * 2`

10. **`AngleStart`** - Starting angle offset (in radians)
    - Used in: `FORMULA_THETA` calculation
    - Default: Usually 0 (starts at top/12 o'clock)

11. **`ClockWise`** - Direction of bar arrangement
    - Used in: `FORMULA_THETA` calculation
    - `0` = counter-clockwise, `1` = clockwise

12. **`Inward`** - Bar direction
    - Used in: `RotationAngle=(#Inward#*PI)`
    - `0` = outward (bars extend away from center)
    - `1` = inward (bars extend toward center)

### Formulas

**Theta (Angle) Calculation:**
```
FORMULA_THETA = (#AngleTotal# - #AngleTotal#/#NumOfItems# * (#ClockWise#=0?%%:#NumOfItems#-%%-1) + #AngleStart#)
```

**Smoothing Formula (Average):**
```
FORMULA_AVG = FORMULA_SUM / FORMULA_AVG_NUM
```

**Bar Length Calculation:**
```
LineLength = ((#FORMULA_AVG#=0) ? 
  {#ExtrudeMin#=0?-1:#ExtrudeMin#} : 
  (((#FORMULA_AVG#-[mBand%%])*{#Smoothing#}+[mBand%%])*{#ExtrudeMax#-#ExtrudeMin#}+#ExtrudeMin#))
```

**Position Calculations:**
```
X = #Radius# * Cos(FORMULA_THETA % (PI*2)) + #Radius# + #ExtrudeMax#
Y = #RadiusY# * Sin(FORMULA_THETA % (PI*2)) + #RadiusY# + #ExtrudeMax#
```

### Color System

- **Base Color**: `#ItemColor#` (defined in Settings.inc)
- **Color Script**: `Color.lua` - Handles gradient colors
- **Gradient Format** (commented example):
  ```
  C4FB7200:0|C4FB72cc:30|85ECF099:60|85ECF099:80|85ECF000
  ```
  - Format: `Color:Position|Color:Position|...`
  - Positions likely represent frequency bands or bar indices

### Factory Scripts

The widget uses Lua factory scripts to dynamically generate:
1. **Band Measures** (`Factory.lua` + `BandMeasures.inc`)
   - Creates `mBand0`, `mBand1`, ... `mBand{NumOfItems-1}`
   - Each measure reads a frequency band from AudioLevel plugin

2. **Bar Meters** (`Factory.lua` + `Lines.inc`)
   - Creates Roundline meters for each bar
   - Positions bars in circular pattern

---

## Actual Settings Values (From Settings.inc)

✅ **All values extracted from `Settings.inc`:**

1. **`NumOfItems`** = `113` - Number of bars
2. **`ItemColor`** = `255,255,255,255` - White color (RGBA format)
3. **`ItemWidth`** = `4` - Bar width in pixels
4. **`Radius`** = `76` - Base radius (pixels)
5. **`RadiusY`** = `76` - Y-axis radius (circular, not elliptical)
6. **`ExtrudeMax`** = `76` - Maximum bar extension (pixels)
7. **`ExtrudeMin`** = `7` - Minimum bar extension (pixels)
8. **`Smoothing`** = `0` - No smoothing (raw frequency data)
9. **`AngleTotalDeg`** = `360` - Full circle coverage
10. **`AngleTotal`** = `Rad(360)` = `2π` (6.28318... radians)
11. **`AngleStartDeg`** = `270` - Starts at bottom (12 o'clock = 0°, 3 o'clock = 90°, 6 o'clock = 180°, 9 o'clock = 270°)
12. **`AngleStart`** = `Rad(270)` = `-π/2` or `3π/2` (radians)
13. **`ClockWise`** = `1` - Clockwise direction
14. **`Inward`** = `0` - Bars extend outward (not inward)

### FFT/Audio Processing Settings

15. **`FFTSize`** = `2048` - FFT window size (frequency resolution)
16. **`FFTOverlap`** = `1024` - FFT overlap (half of FFTSize)
17. **`FFTAttack`** = `237` - Attack time (ms)
18. **`FFTDecay`** = `39` - Decay time (ms)
19. **`FreqMin`** = `60` - Minimum frequency (Hz)
20. **`FreqMax`** = `11000` - Maximum frequency (Hz)
21. **`Sensitivity`** = `64` - Sensitivity/gain multiplier
22. **`AudioDeviceID`** = (empty) - Default audio device
23. **`AudioDevicePort`** = `Output` - Output device (loopback)

---

## Implementation Mapping

### To Our Audio Visualizer Component

| Rainmeter Variable | Our Component Prop | Type | Notes |
|-------------------|-------------------|------|-------|
| `NumOfItems` | `barCount` | number | Number of bars |
| `ItemColor` | `colors` | string/array | Color(s) for bars |
| `ItemWidth` | `barWidth` | number | Width in pixels |
| `Radius` | `radius` | number | Base radius from orb center |
| `RadiusY` | `radiusY` (optional) | number | For elliptical shapes |
| `ExtrudeMax` | `maxBarLength` | number | Maximum bar extension |
| `ExtrudeMin` | `minBarLength` | number | Minimum bar offset |
| `Smoothing` | `smoothing` | number (0-1) | Animation smoothing |
| `AngleTotal` | `angleTotal` | number (radians) | Total coverage angle |
| `AngleStart` | `angleStart` | number (radians) | Starting angle |
| `ClockWise` | `clockwise` | boolean | Direction |
| `Inward` | `inward` | boolean | Bar direction |
| `Update` (25ms) | `updateRate` | number (ms) | Refresh rate |

### Exact Configuration Summary

**Visualization:**
- **113 bars** arranged in a **full circle (360°)**
- **Clockwise** direction
- **Starts at 270°** (bottom of circle, 6 o'clock position)
- **Bars extend outward** from center
- **White color** (`255,255,255,255` RGBA)
- **4px bar width**

**Dimensions:**
- **Base radius**: 76px (from center)
- **Bar extension range**: 7px (min) to 76px (max)
- **Total visual radius**: 76px + 76px = **152px total** (matches orb size of 154px!)

**Audio Processing:**
- **FFT Size**: 2048 (high resolution)
- **Frequency range**: 60Hz - 11kHz
- **No smoothing** (raw frequency response)
- **Sensitivity**: 64 (moderate gain)

**Update Rate:**
- **25ms** = **40 FPS**

---

## Implementation Mapping (Exact Values)

### Component Props (Exact Match)

```javascript
<AudioVisualizer
  enabled={true}
  barCount={113}                    // NumOfItems
  barWidth={4}                      // ItemWidth
  radius={76}                        // Radius
  radiusY={76}                       // RadiusY (circular)
  maxBarLength={76}                 // ExtrudeMax
  minBarLength={7}                  // ExtrudeMin
  smoothing={0}                      // Smoothing (0 = no smoothing)
  angleTotal={Math.PI * 2}           // 360° = full circle
  angleStart={-Math.PI / 2}         // 270° = bottom (6 o'clock)
  clockwise={true}                   // ClockWise = 1
  inward={false}                     // Inward = 0 (outward bars)
  colors={[255, 255, 255, 255]}     // ItemColor (RGBA white)
  updateRate={25}                    // 25ms = 40 FPS
  fftSize={2048}                     // FFTSize
  freqMin={60}                       // FreqMin (Hz)
  freqMax={11000}                    // FreqMax (Hz)
  sensitivity={64}                   // Sensitivity
/>
```

### Key Implementation Notes

1. **113 bars** - High bar count for smooth circular visualization
2. **76px radius** - Perfect match for 154px orb (76px + 76px max = 152px, fits perfectly!)
3. **No smoothing** - Raw frequency data (Smoothing = 0)
4. **Clockwise from bottom** - Starts at 270° (6 o'clock), rotates clockwise
5. **White bars** - Simple white color (can be customized later)
6. **FFT 2048** - High resolution frequency analysis
7. **40 FPS** - Smooth animation at 25ms update rate

### Coordinate System Conversion

Rainmeter uses:
- **0° = Right (3 o'clock)**
- **90° = Bottom (6 o'clock)**
- **180° = Left (9 o'clock)**
- **270° = Top (12 o'clock)**

But the widget starts at **270°** (which is actually **top/12 o'clock** in standard math, but Rainmeter considers it **bottom**).

For our implementation:
- Start angle: `-Math.PI / 2` (270° in standard math = bottom/6 o'clock)
- Rotate clockwise: `true`
- Full circle: `Math.PI * 2` (360°)

---

## Implementation Ready ✅

All settings have been extracted! Ready to implement with exact Rainmeter widget parameters.

---

## Technical Notes

- **AudioLevel Plugin**: Uses WASAPI loopback (same as our approach)
- **Update Rate**: 25ms = 40 FPS (we can match or adjust)
- **Smoothing**: Uses neighbor averaging (3-bar average for full circle)
- **Positioning**: Uses polar coordinates (angle + radius)
- **Rendering**: Roundline meters (we'll use Canvas lines)

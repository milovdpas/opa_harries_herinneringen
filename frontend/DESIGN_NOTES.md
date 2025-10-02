# Design Notes - Opa Harry's Herinneringen

## Visual Concept

### Background
- **Deep black matte background** (#0a0a0a) with a subtle radial gradient
- Creates a theatrical, gallery-like atmosphere
- Evokes the feeling of a memorial exhibition or cinema
- Fixed background that doesn't move during interactions

### Layering & Depth
1. **Base Layer**: Black gradient background (always visible)
2. **Mosaic Layer**: Portrait of Opa Harry composed of memory cards (floats on top)
3. **Interactive Layer**: Individual cards that can flip/zoom
4. **UI Layer**: Buttons, controls overlay

### Color Palette
- **Background**: Deep blacks (#0a0a0a to #1a1a1a)
- **Empty Cards**: Subtle gray (#333333 - barely visible against black)
- **Photo Cards**: Full color photos stand out beautifully against dark background
- **Text**: White (#ffffff) for maximum contrast and readability
- **Accents**: Light grays for secondary elements

### Why This Works
1. **Focus**: Dark background eliminates distractions, all attention on memories
2. **Emotional Impact**: Black evokes memorial, remembrance, respect
3. **Photo Quality**: Photos pop with vibrant color against dark matte
4. **Depth**: Creates 3D layering effect, mosaic appears to float
5. **Timeless**: Classic gallery/museum aesthetic that won't feel dated

### Animations (GSAP Business)
- Photos flying in from darkness, assembling into portrait
- Smooth card flips revealing memories
- Gentle parallax effects on hover
- Zoom transitions that feel cinematic
- All animations choreographed against stable dark background

### Typography
- Clean, emotional fonts for Dutch text
- High contrast (white on black) for readability
- Generous spacing for elegance and breathing room

### Responsive Considerations
- Dark background reduces battery usage on OLED screens (mobile)
- High contrast ensures readability in various lighting conditions
- Gradient subtle enough not to distract on small screens


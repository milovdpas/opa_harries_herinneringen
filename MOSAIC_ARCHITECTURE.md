# Mosaic Architecture & Implementation Plan

## 🎨 Chosen Approach: True Photomosaic (Option A)

### Concept
The cards themselves recreate the reference photo through strategic placement and coloring:
- Reference photo is analyzed to extract color/brightness data for each grid position
- Empty cards display with background colors matching that area of the reference photo
- As memories are uploaded, photos replace the colored placeholders
- The overall effect: Opa Harrie's face is visible from afar, individual memories up close

### Visual Flow
```
Reference Photo (not displayed directly)
    ↓ [Algorithm analyzes]
Color/Brightness Map (data structure)
    ↓ [Renders as]
Grid of Colored Cards (recreates the photo)
    ↓ [User uploads memories]
Grid of Memory Photos (still recreates the photo, but with real memories)
```

---

## 📐 Technical Implementation

### Phase 1: Grid Size Calculation

**Dynamic Grid Size Based on Reference Photo:**
- Reference photo aspect ratio determines grid proportions
- Desktop: ~30-40 cards on longest edge (e.g., 30x40 for portrait = 1,200 cards)
- Mobile: ~15-20 cards on longest edge (responsive scaling)
- Square cards for simplicity and visual consistency

**Example:**
- Reference photo: 800x1200px (portrait, 2:3 ratio)
- Desktop grid: 30 cards wide × 45 cards tall = 1,350 cards
- Mobile grid: Same ratio, but cards are larger (fewer visible at once, zoom to see all)

### Phase 2: Photomosaic Algorithm

**Steps:**
1. **Load Reference Photo** (stored in code/Firebase)
2. **Analyze Image:**
   - Divide into grid sections (e.g., 30x45)
   - For each section, extract average color (RGB)
   - Store brightness value (for contrast)
3. **Generate Card Data:**
   ```typescript
   interface CardData {
     id: string
     position: { row: number, col: number }
     backgroundColor: string // RGB from reference photo
     brightness: number // 0-255
     memoryId?: string // null if empty
   }
   ```
4. **Render Cards:**
   - Empty cards show with backgroundColor from reference photo
   - Hover shows "Add Memory" hint
   - When memory uploaded, card shows the actual photo

### Phase 3: Memory Placement Strategy

**Current (MVP):** Fill next empty spot in order (top-left to bottom-right)

**Future Enhancement:** Algorithmic placement
- Analyze uploaded photo's average color
- Place it where it best matches the reference photo's color in that area
- Creates better visual cohesion

---

## 🔧 Technology Stack for Mosaic

### Libraries to Consider:

1. **Canvas API** (built-in)
   - For analyzing reference photo
   - Extracting color data per grid section
   - Lightweight, no dependencies

2. **Vibrant.js** (optional)
   - Better color extraction
   - Palette generation
   - More sophisticated than basic averaging

3. **CSS Grid**
   - For rendering the card grid
   - Responsive by nature
   - Easy to manipulate

### No Library Needed Initially
We can implement the basic algorithm ourselves using Canvas API!

---

## 📦 Data Structure

### Simplified Data Structure:

**In Code (Static Config):**
```typescript
// Reference photo path
const REFERENCE_PHOTO = '/opa-harrie.jpg'

// Grid dimensions calculated from photo
// Card colors calculated from photo analysis
```

**In Firestore (Dynamic Data):**
```
memories/
  └─ {memoryId}/
      - photoUrl: string (required - displayed in mosaic card)
      - type?: 'quote' | 'audio' | 'video' (optional)
      - typeInput?: string (optional - quote text, audio URL, or video URL)
      - gridPosition: {row, col}
      - submitterName?: string (optional)
      - timestamp: Date
      - averageColor?: string (for future algorithmic placement)
      - brightness?: number (for future algorithmic placement)
```

**Memory Structure Explanation:**
- Every memory MUST have a photo (goes in the mosaic card)
- Type is OPTIONAL - can submit just a photo without additional content
- typeInput contains the additional content (only if type is set):
  - If type='quote': typeInput is the quote text
  - If type='audio': typeInput is the Firebase Storage URL to audio file
  - If type='video': typeInput is the Firebase Storage URL to video file

---

## 🎯 Implementation Steps (Phase 1)

### Step 1: Reference Photo Setup
- [ ] Add reference photo to `/public` folder or Firebase Storage
- [ ] Create utility to load and analyze reference photo
- [ ] Extract color data for each grid position

### Step 2: Data Models
- [ ] Create TypeScript interfaces
- [ ] Set up Pinia store for mosaic configuration
- [ ] Set up Pinia store for memories

### Step 3: Mosaic Grid Component
- [ ] Calculate grid dimensions based on reference photo
- [ ] Render grid with CSS Grid
- [ ] Apply background colors from reference photo analysis

### Step 4: Card Component
- [ ] Empty state: colored background from reference photo
- [ ] Hover state: "Add Memory" overlay
- [ ] Filled state: display memory photo
- [ ] Responsive sizing

### Step 5: Photo Analysis Algorithm
```typescript
// Pseudocode
function analyzeReferencePhoto(imageUrl, gridWidth, gridHeight) {
  1. Load image into canvas
  2. Calculate cell width = imageWidth / gridWidth
  3. Calculate cell height = imageHeight / gridHeight
  4. For each grid cell:
     - Extract pixel data for that section
     - Calculate average RGB values
     - Calculate brightness (luminance)
     - Store in cardColors array
  5. Return cardColors data structure
}
```

---

## 🎨 Visual Design Details

### Empty Card Appearance:
- Background: RGB color from reference photo analysis
- Border: Subtle dark outline (1px)
- Hover: 
  - Semi-transparent overlay
  - "+" icon or "Add Memory" text
  - Slight scale/glow effect

### Filled Card Appearance:
- Background: The actual memory photo (fills card)
- Hover: Slightly zoom/highlight
- Click: Flip to show details (Phase 2)

### Color Accuracy:
- Empty cards collectively recreate reference photo
- From distance: Clear image of Opa Harrie
- Up close: Individual colored squares
- As memories fill in: Colored squares → Real photos

---

## 📱 Responsive Strategy

### Desktop (>1024px):
- Grid: Full resolution (e.g., 30x45 cards)
- Card size: ~40-50px per card
- Mosaic fills viewport width (max-width: 1400px)
- Hover effects enabled

### Tablet (768px - 1024px):
- Grid: Same resolution, smaller cards
- Card size: ~30-35px per card
- Touch interactions enabled

### Mobile (<768px):
- Grid: Same resolution (maintains aspect ratio)
- Card size: ~20-25px per card
- Pinch-to-zoom enabled
- Tap interactions (no hover)
- Initial view: Zoomed to show full mosaic
- Can zoom in to see individual cards

---

## 🔄 Memory Upload Flow

1. User clicks "Herinnering Delen" button
2. Upload form opens
3. User uploads a **photo** (required - will be displayed in mosaic card)
4. User OPTIONALLY selects type: Quote, Audio, or Video (or can skip)
5. If type selected, user provides additional content:
   - **Quote**: Enters quote text
   - **Audio**: Uploads audio file
   - **Video**: Uploads video file
6. User optionally provides their name
7. User submits
8. **Algorithm finds next empty spot** (for now: sequential)
9. Photo uploaded to Firebase Storage → photoUrl
10. Additional content uploaded/stored → typeInput
11. Memory saved to Firestore with grid position
12. Card updates in real-time to show the photo
13. Click card to flip and see additional content (quote/audio/video)
14. Mosaic evolves as more memories are added

---

## 🚀 MVP Deliverables (Phase 1)

By end of Phase 1, we should have:
- ✅ Reference photo analyzed and color data extracted
- ✅ Grid of cards displaying in correct colors (recreating reference photo)
- ✅ Responsive layout working on desktop and mobile
- ✅ Empty cards show "Add Memory" on hover
- ✅ Basic zoom functionality
- ✅ Data models and Pinia stores ready
- ✅ Visual confirmation that mosaic recreates Opa Harrie's face

---

## 📝 Notes

- **Reference Photo Management**: Hardcoded in code (simpler, no Firestore needed)
- **Mosaic Config**: Calculated in code from reference photo (not stored in Firestore)
- **Grid Size**: Will be determined by reference photo aspect ratio
- **Card Shape**: Square for visual consistency
- **Color Extraction**: Start simple (average RGB), can enhance later
- **Performance**: ~1,000-1,500 cards is manageable with modern browsers
- **Memory Structure**: Every memory has a photo + optional additional content (quote/audio/video)

---

*This architecture ensures a beautiful, meaningful mosaic that honors Opa Harrie while being technically feasible.*


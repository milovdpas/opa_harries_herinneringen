# Test Instructions - Photomosaic Analyzer

## 🧪 Testing the Algorithm

The photomosaic analyzer is ready to test! Follow these steps:

### Step 1: Add a Test Photo

1. **Get your test image** (any format: JPG, PNG, WebP, AVIF, etc.)
   - Ideally a portrait photo (will work with any aspect ratio)
   - Recommended size: 800-2000px on the longest edge
   - For best results, use a photo with good contrast and distinct features

2. **Place the image in the `public` folder:**
   ```
   frontend/public/grandpa.png
   ```
   Or any other filename - just update the path in `MosaicTest.vue` if you use a different name.

### Step 2: Update the Test Component (Optional)

If you named your test photo something other than `grandpa.png`, edit:
```
frontend/src/components/MosaicTest.vue
```

Line ~18:
```typescript
const referencePhoto = '/grandpa.png'  // Change this to match your filename
```

### Step 3: Run the Dev Server

```bash
cd frontend
npm run dev
```

### Step 4: Open in Browser

Navigate to `http://localhost:5173`

### Step 5: Check Results

The test will automatically run and show:

**On the Page:**
- ✅ Status of the analysis
- ✅ Grid dimensions (e.g., 30×40)
- ✅ Total number of cards
- ✅ Visual samples of the first 10 cards with their extracted colors

**In the Browser Console (F12):**
- 📊 Detailed grid information
- 🎨 Color data for sample cards
- 📸 RGB values and brightness levels
- ✅ Success/error messages

## 🎨 What to Look For

### Good Results:
- Grid dimensions should match image aspect ratio
- Colors should represent different areas of the photo
- Brightness values should vary (not all the same)
- Console shows "✅ Mosaic initialized successfully"

### Potential Issues:
- If you see CORS errors: Make sure image is in `/public` folder
- If grid is all one color: Image might not be loading correctly
- If analysis fails: Check console for error messages

## 🔍 Understanding the Output

Each card will show:
- **Position**: `[row, col]` in the grid
- **Color**: Hex color code (e.g., `#A3B5C7`)
- **Brightness**: Value 0-255 (luminance)

The algorithm extracts the **average color** from each section of the reference photo.

## 📝 Example Output

```
✅ Test Results:
📊 Grid: 34x45 = 1530 cards
🎨 Sample colors (first 10):
  Card [0,0]: #2a2b2d (brightness: 43)
  Card [0,1]: #3f4144 (brightness: 65)
  Card [0,2]: #525558 (brightness: 85)
  ...
```

## ✅ Next Steps

Once you verify the algorithm works:
1. Replace test photo with actual reference photo of Opa Harry
2. Build the actual mosaic components to display the colored cards
3. Add zoom and interaction features

---

**Need help?** Check the browser console for detailed error messages.


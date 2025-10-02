# Memory Structure Documentation

## 📸 Core Concept

Every memory in Opa Harry's memorial has **two parts**:

1. **Photo** (Required) - Displayed in the mosaic card
2. **Additional Content** (Optional) - Quote, Audio, or Video (or just a photo with no additional content)

## 🎨 Memory Types

### Type: `quote`
- **Photo**: Required - shows in mosaic card
- **Additional Content**: Quote text about Opa Harry
- **Example**: 
  - Photo: Family gathering photo
  - Quote: "Opa Harry always said, 'Family is everything'"

### Type: `audio`
- **Photo**: Required - shows in mosaic card  
- **Additional Content**: Audio recording (story, message, song)
- **Example**:
  - Photo: Opa Harry at the piano
  - Audio: Recording of him playing his favorite song

### Type: `video`
- **Photo**: Required - shows in mosaic card (thumbnail/representative image)
- **Additional Content**: Video clip
- **Example**:
  - Photo: Still frame from the video
  - Video: Home movie of Opa Harry at a birthday party

## 📦 Data Structure

```typescript
interface Memory {
  id: string
  type?: 'quote' | 'audio' | 'video' // Optional - can be just a photo
  
  // Required - always displayed in mosaic card
  photoUrl: string
  
  // Additional content based on type (optional)
  typeInput?: string // quote text OR audio URL OR video URL
  
  // Optional metadata
  submitterName?: string
  timestamp: Date
  gridPosition: { row: number, col: number }
}
```

## 🔄 Upload Flow

### Step 1: Upload Photo (Required)
```
User selects photo file
  ↓
Photo uploaded to Firebase Storage
  ↓
photoUrl generated
```

### Step 2: Choose Memory Type (Optional)
```
User can optionally select: Quote | Audio | Video
Or skip this step to submit just a photo
```

### Step 3: Provide Additional Content

**If Quote:**
```
User types quote in text area
  ↓
Quote text stored in typeInput
```

**If Audio:**
```
User uploads audio file
  ↓
Audio uploaded to Firebase Storage
  ↓
Audio URL stored in typeInput
```

**If Video:**
```
User uploads video file
  ↓
Video uploaded to Firebase Storage
  ↓
Video URL stored in typeInput
```

### Step 4: Optional Info
```
User optionally provides their name (submitterName)
```

### Step 5: Save
```
Memory saved to Firestore
  ↓
Card in mosaic updates to show photo
  ↓
Click card to flip and see additional content
```

## 🎯 User Experience

### From Distance:
- Mosaic shows all photos
- Creates image of Opa Harry's face
- Beautiful collective display

### Up Close:
- Individual photos are visible
- Hover shows "View Memory" hint
- Click to flip card

### Card Flipped:
- **Quote**: Shows quote text beautifully formatted
- **Audio**: Shows audio player with play button
- **Video**: Shows video player with play button

## ✅ Validation Rules

1. **Photo**: Always required (cannot submit without photo)
2. **Type**: Optional (can submit just a photo)
3. **TypeInput** (only if type is selected): 
   - For quote: Text is required (min 5 characters)
   - For audio: File is required (.mp3, .wav, .m4a)
   - For video: File is required (.mp4, .mov, .avi)
4. **SubmitterName**: Optional

## 📱 Storage Paths

### Firebase Storage Structure:
```
memories/
  └─ {memoryId}/
      ├─ photo.jpg          (the mosaic card photo)
      ├─ audio.mp3          (if type='audio')
      └─ video.mp4          (if type='video')
```

### Firestore Document Examples:

**Photo with Quote:**
```json
{
  "id": "mem_123",
  "type": "quote",
  "photoUrl": "https://storage.../memories/mem_123/photo.jpg",
  "typeInput": "Opa Harry was the kindest man I ever knew",
  "submitterName": "Jan",
  "gridPosition": { "row": 5, "col": 12 },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Just a Photo:**
```json
{
  "id": "mem_124",
  "photoUrl": "https://storage.../memories/mem_124/photo.jpg",
  "submitterName": "Maria",
  "gridPosition": { "row": 5, "col": 13 },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

*This structure ensures every card in the mosaic has a photo, while allowing rich additional content to honor Opa Harry's memory.*


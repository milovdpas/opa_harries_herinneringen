# Firebase Integration Documentation

## 🔥 Overview

This application uses Firebase for backend services:
- **Firebase Storage**: Stores uploaded photos, audio files, and videos
- **Firestore**: Stores memory metadata and provides real-time updates

## 📁 Project Structure

```
frontend/src/
├── config/
│   └── firebase.ts           # Firebase initialization
├── services/
│   ├── storage.ts            # Firebase Storage upload functions
│   └── firestore.ts          # Firestore CRUD operations
└── stores/
    └── memories.ts           # Pinia store with real-time listener
```

## 🔧 Firebase Services

### Storage Service (`services/storage.ts`)

Handles file uploads to Firebase Storage:

```typescript
// Upload photo (required for every memory)
const photoUrl = await uploadPhoto(memoryId, photoFile)

// Upload audio (optional)
const audioUrl = await uploadAudio(memoryId, audioFile)

// Upload video (optional)
const videoUrl = await uploadVideo(memoryId, videoFile)
```

**Storage Structure:**
```
memories/
  └─ {memoryId}/
      ├─ photo.jpg          # Always present
      ├─ audio.mp3          # Optional (if type='audio')
      └─ video.mp4          # Optional (if type='video')
```

### Firestore Service (`services/firestore.ts`)

Handles database operations:

```typescript
// Save a memory to Firestore
await saveMemory(memoryData)

// Load all memories (one-time fetch)
const memories = await loadMemories()

// Subscribe to real-time updates
const unsubscribe = subscribeToMemories((memories) => {
  // Callback fired whenever memories change
  console.log('Updated memories:', memories)
})

// Cleanup
unsubscribe()
```

## 📦 Data Flow

### Submission Flow

```
1. User fills out form
   ↓
2. Upload photo to Storage → photoUrl
   ↓
3. Upload audio/video (if provided) → typeInput (URL)
   ↓
4. Save memory document to Firestore
   ↓
5. Real-time listener updates UI automatically
```

### Real-time Updates

The `memoriesStore` uses Firestore's real-time listener:

```typescript
// In stores/memories.ts
const loadMemories = async () => {
  // Subscribe to real-time updates
  unsubscribe = subscribeToMemories((updatedMemories) => {
    memories.value = updatedMemories
  })
}
```

**Benefits:**
- Instant UI updates when new memories are added
- Multiple users can submit simultaneously
- No manual refresh needed
- Mosaic updates in real-time

## 🗄️ Firestore Schema

### Collection: `memories`

```typescript
{
  id: string                    // "mem_1234567890_abc123"
  type?: 'quote' | 'audio' | 'video'  // Optional
  photoUrl: string              // Firebase Storage URL (required)
  typeInput?: string            // Quote text OR audio/video URL (optional)
  gridPosition: {
    row: number
    col: number
  }
  submitterName?: string        // Optional
  timestamp: Firestore.Timestamp
  averageColor?: string         // For future algorithmic placement
  brightness?: number           // For future algorithmic placement
}
```

### Example Documents

**Photo with Quote:**
```json
{
  "id": "mem_1234567890_abc123",
  "type": "quote",
  "photoUrl": "https://firebasestorage.googleapis.com/.../photo.jpg",
  "typeInput": "Opa Harrie was de liefste man die ik kende",
  "submitterName": "Jan",
  "gridPosition": { "row": 5, "col": 12 },
  "timestamp": Timestamp(...)
}
```

**Photo Only:**
```json
{
  "id": "mem_1234567891_def456",
  "photoUrl": "https://firebasestorage.googleapis.com/.../photo.jpg",
  "gridPosition": { "row": 5, "col": 13 },
  "timestamp": Timestamp(...)
}
```

**Photo with Audio:**
```json
{
  "id": "mem_1234567892_ghi789",
  "type": "audio",
  "photoUrl": "https://firebasestorage.googleapis.com/.../photo.jpg",
  "typeInput": "https://firebasestorage.googleapis.com/.../audio.mp3",
  "submitterName": "Maria",
  "gridPosition": { "row": 5, "col": 14 },
  "timestamp": Timestamp(...)
}
```

## 🔒 Security Rules

**Current:** Test mode (open access)

**Recommended for production:**
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /memories/{memoryId} {
      // Anyone can read
      allow read: if true;
      
      // Anyone can create (for family submissions)
      // But only with valid data structure
      allow create: if request.resource.data.photoUrl is string
                    && request.resource.data.gridPosition is map;
      
      // Prevent updates/deletes (memories are permanent)
      allow update, delete: if false;
    }
  }
}
```

```javascript
// Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /memories/{memoryId}/{fileName} {
      // Anyone can read
      allow read: if true;
      
      // Anyone can upload (for family submissions)
      // Max file size: 10MB for images, 50MB for audio/video
      allow write: if request.resource.size < 50 * 1024 * 1024;
    }
  }
}
```

## ⚡ Performance Considerations

### Current Implementation

✅ **Real-time updates**: Instant UI sync across all users
✅ **Optimistic UI**: Form closes immediately, updates arrive via listener
✅ **Efficient queries**: Ordered by timestamp (indexed)
✅ **No over-fetching**: Only subscribe to memories collection

### Future Optimizations

- **Pagination**: Load memories in batches if count grows large
- **Image optimization**: Compress images before upload
- **Lazy loading**: Load full-resolution media only when needed
- **Caching**: Use service worker to cache uploaded media

## 🧪 Testing Firebase Integration

### 1. Test Photo Upload
```javascript
// Open browser console
const testMemory = {
  type: 'quote',
  photoUrl: '...', // Will be uploaded
  typeInput: 'Test quote',
  gridPosition: { row: 0, col: 0 }
}
```

### 2. Check Firebase Console
- **Storage**: Verify files are uploaded to `memories/{memoryId}/`
- **Firestore**: Check `memories` collection for new documents
- **Real-time**: Submit from one device, watch update on another

### 3. Monitor Console Logs
```
📤 Uploading photo to Firebase Storage...
✅ Photo uploaded: https://...
💾 Saving memory mem_... to Firestore...
✅ Memory mem_... saved to Firestore
🔄 Real-time update: 1 memories
```

## 🚨 Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  // Upload files
  const photoUrl = await uploadPhoto(memoryId, photoFile)
  
  // Save to Firestore
  await saveMemory(memoryData)
  
} catch (err) {
  // User-friendly error message in Dutch
  error.value = 'Het opslaan is mislukt. Probeer het opnieuw.'
  console.error('Error:', err)
}
```

**Common Errors:**
- **Network failure**: Retry upload
- **Storage quota**: Check Firebase billing
- **Permission denied**: Review security rules
- **Invalid file type**: Validate before upload

## 📝 Environment Variables

Required in `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...  # Optional
```

---

*Firebase integration is now live! Memories are automatically synced in real-time across all devices.* 🎉


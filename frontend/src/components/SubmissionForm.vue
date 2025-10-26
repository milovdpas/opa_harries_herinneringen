<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useMemoriesStore } from '@/stores/memories'
import { useMosaicStore } from '@/stores/mosaic'
import type { MemoryType } from '@/types'
import { uploadPhoto, uploadAudio, uploadVideo } from '@/services/storage'
import imageCompression from 'browser-image-compression'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const uiStore = useUIStore()
const memoriesStore = useMemoriesStore()
const mosaicStore = useMosaicStore()

// Form state
const memoryType = ref<MemoryType | null>(null)
const originalPhotoFile = ref<File | null>(null) // Original uncropped for gallery
const gridPhotoFile = ref<File | null>(null) // Cropped square for mosaic
const photoPreview = ref<string>('')
const typeInputText = ref('') // For quotes
const typeInputFile = ref<File | null>(null) // For audio/video
const submitterName = ref('')
const isSubmitting = ref(false)
const isCompressing = ref(false)
const error = ref<string | null>(null)
const isInteractive = ref(true) // Prevent immediate clicks after opening

// Cropper state
const showCropper = ref(false)
const cropperImage = ref<string>('')
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

// Watch for form opening to prevent immediate clicks
watch(() => uiStore.isSubmissionFormOpen, (isOpen) => {
  if (isOpen) {
    // Disable interactions briefly when form opens
    isInteractive.value = false
    setTimeout(() => {
      isInteractive.value = true
    }, 300) // 300ms delay before allowing interactions
  }
})

// Validation
const isPhotoValid = computed(() => originalPhotoFile.value !== null && gridPhotoFile.value !== null)
const isTypeInputValid = computed(() => {
  // If no type selected, no additional content needed
  if (!memoryType.value) {
    return true
  }
  
  // If type is selected, validate the input
  if (memoryType.value === 'quote' || memoryType.value === 'speech') {
    return typeInputText.value.trim().length >= 5
  } else {
    return typeInputFile.value !== null
  }
})
// Form is valid if either:
// 1. There's a photo (with optional content)
// 2. OR there's a quote/speech (without photo)
const isFormValid = computed(() => {
  const hasPhoto = isPhotoValid.value
  const hasText = (memoryType.value === 'quote' || memoryType.value === 'speech') && typeInputText.value.trim().length >= 5
  
  // Must have either photo or text content
  if (!hasPhoto && !hasText) {
    return false
  }
  
  // If has photo, validate additional content (if any)
  if (hasPhoto && memoryType.value && !isTypeInputValid.value) {
    return false
  }
  
  return true
})

// Handle photo upload - save original and show cropper
const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = 'Selecteer alsjeblieft een afbeeldingsbestand'
      return
    }
    
    // Validate file size (max 10MB for original file)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'Afbeelding moet kleiner zijn dan 10MB'
      return
    }
    
    error.value = null
    
    try {
      isCompressing.value = true
      
      // Compress original for gallery (reasonable quality, no cropping)
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)
      console.log(`🖼️ Original image: ${originalSizeMB} MB`)
      
      const compressionOptions = {
        maxSizeMB: 3, // Generous limit for gallery
        maxWidthOrHeight: 2048, // High resolution for gallery
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.92, // High quality for gallery
      }
      
      const compressedOriginal = await imageCompression(file, compressionOptions)
      
      const compressedSizeMB = (compressedOriginal.size / 1024 / 1024).toFixed(2)
      console.log(`✅ Compressed original for gallery: ${compressedSizeMB} MB`)
      
      // Store original (uncropped) for gallery
      originalPhotoFile.value = compressedOriginal
      
      // Load image into cropper for grid version
      const reader = new FileReader()
      reader.onload = (e) => {
        cropperImage.value = e.target?.result as string
        showCropper.value = true
      }
      reader.readAsDataURL(file)
      
    } catch (err) {
      console.error('❌ Error processing image:', err)
      error.value = 'Fout bij het verwerken van de afbeelding. Probeer opnieuw.'
    } finally {
      isCompressing.value = false
    }
  }
}

// Handle crop confirmation - save cropped version for grid
const handleCropConfirm = async () => {
  if (!cropperRef.value) return
  
  try {
    isCompressing.value = true
    error.value = null
    
    // Get cropped canvas at FULL resolution
    const { canvas } = cropperRef.value.getResult()
    
    if (!canvas) {
      error.value = 'Kon afbeelding niet bijsnijden'
      return
    }
    
    console.log(`🖼️ Cropped canvas size: ${canvas.width}x${canvas.height}px`)
    
    // Convert canvas to blob at HIGH quality (98%)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/jpeg', 0.98) // Higher quality!
    })
    
    // Convert blob to file
    const croppedFile = new File([blob], 'grid-image.jpg', { type: 'image/jpeg' })
    
    const originalSizeMB = (croppedFile.size / 1024 / 1024).toFixed(2)
    console.log(`📦 Cropped grid file size: ${originalSizeMB} MB`)
    
    // Smart compression: Only compress if needed, with quality preservation
    let finalFile = croppedFile
    
    if (croppedFile.size > 2 * 1024 * 1024) {
      // Only compress if larger than 2MB (smaller for grid)
      console.log('📉 Grid file is large, applying compression...')
      
      const options = {
        maxSizeMB: 2, // Smaller limit for grid
        maxWidthOrHeight: 1024, // Smaller resolution for grid (mosaic display)
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.88, // Good quality for grid
      }
      
      finalFile = await imageCompression(croppedFile, options)
      
      const compressedSizeMB = (finalFile.size / 1024 / 1024).toFixed(2)
      console.log(`✅ Compressed grid image to: ${compressedSizeMB} MB`)
    } else {
      console.log('✅ Grid file size is good')
    }
    
    // Store cropped version for grid
    gridPhotoFile.value = finalFile
    
    // Create preview from cropped version
    photoPreview.value = canvas.toDataURL('image/jpeg', 0.95)
    
    // Close cropper
    showCropper.value = false
    cropperImage.value = ''
    
  } catch (err) {
    console.error('❌ Error processing image:', err)
    error.value = 'Fout bij het verwerken van de afbeelding. Probeer opnieuw.'
  } finally {
    isCompressing.value = false
  }
}

// Handle crop cancel
const handleCropCancel = () => {
  showCropper.value = false
  cropperImage.value = ''
  originalPhotoFile.value = null // Also clear original
  // Reset file input
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][accept^="image/"]')
  if (fileInput) {
    fileInput.value = ''
  }
}

// Handle type input file upload (audio/video)
const handleTypeInputFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const isAudio = memoryType.value === 'audio'
    const isVideo = memoryType.value === 'video'
    
    // Validate file type
    if (isAudio && !file.type.startsWith('audio/')) {
      error.value = 'Please select an audio file'
      return
    }
    if (isVideo && !file.type.startsWith('video/')) {
      error.value = 'Please select a video file'
      return
    }
    
    // Validate file size (max 50MB for audio/video)
    if (file.size > 50 * 1024 * 1024) {
      error.value = `${isAudio ? 'Audio' : 'Video'} must be smaller than 50MB`
      return
    }
    
    typeInputFile.value = file
    error.value = null
  }
}

// Reset form
const resetForm = () => {
  memoryType.value = null
  originalPhotoFile.value = null
  gridPhotoFile.value = null
  photoPreview.value = ''
  typeInputText.value = ''
  typeInputFile.value = null
  submitterName.value = ''
  error.value = null
}

// Close form
const closeForm = () => {
  resetForm()
  uiStore.closeSubmissionForm()
}

// Submit form
const submitForm = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    console.log('📝 Submitting memory...')
    
    // Use selected position if available, otherwise get next empty position
    let targetPosition = uiStore.selectedCardPosition
    
    console.log('🔍 Selected position from UI:', targetPosition)
    
    if (!targetPosition) {
      // No specific position selected, use next available
      console.log('🎲 No position selected, getting random middle position...')
      targetPosition = memoriesStore.getNextEmptyPosition(
        mosaicStore.gridWidth,
        mosaicStore.gridHeight,
      )
    } else {
      console.log('✅ Using clicked position:', targetPosition)
    }
    
    if (!targetPosition) {
      throw new Error('Mosaic is vol! Er zijn geen lege posities meer beschikbaar.')
    }
    
    // Check if selected position is already filled
    if (memoriesStore.hasMemoryAt(targetPosition)) {
      // Position is filled, get next available instead
      targetPosition = memoriesStore.getNextEmptyPosition(
        mosaicStore.gridWidth,
        mosaicStore.gridHeight,
      )
      if (!targetPosition) {
        throw new Error('Mosaic is vol! Er zijn geen lege posities meer beschikbaar.')
      }
    }
    
    // Generate unique memory ID
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Step 1: Upload both photo versions to Firebase Storage (if photo provided)
    let photoUrl: string | undefined
    let gridPhotoUrl: string | undefined
    
    if (originalPhotoFile.value && gridPhotoFile.value) {
      console.log('📤 Uploading gallery photo (original) to Firebase Storage...')
      photoUrl = await uploadPhoto(memoryId, originalPhotoFile.value)
      
      console.log('📤 Uploading grid photo (cropped) to Firebase Storage...')
      gridPhotoUrl = await uploadPhoto(`${memoryId}_grid`, gridPhotoFile.value)
    } else {
      console.log('📝 No photo provided, will use heart icon')
    }
    
    // Step 2: Upload audio/video or use quote/speech text (optional)
    let typeInput: string | undefined
    if (memoryType.value === 'quote' || memoryType.value === 'speech') {
      typeInput = typeInputText.value.trim()
    } else if (memoryType.value === 'audio' && typeInputFile.value) {
      console.log('🎵 Uploading audio to Firebase Storage...')
      typeInput = await uploadAudio(memoryId, typeInputFile.value)
    } else if (memoryType.value === 'video' && typeInputFile.value) {
      console.log('🎥 Uploading video to Firebase Storage...')
      typeInput = await uploadVideo(memoryId, typeInputFile.value)
    }
    
    // Step 3: Save memory to Firestore
    // Build memory object, only include fields that have values
    const memoryData: any = {
      gridPosition: targetPosition,
    }
    
    // Only add photo URLs if provided
    if (photoUrl) {
      memoryData.photoUrl = photoUrl
    }
    if (gridPhotoUrl) {
      memoryData.gridPhotoUrl = gridPhotoUrl
    }
    
    // Only add optional fields if they have values
    if (memoryType.value) {
      memoryData.type = memoryType.value
    }
    
    if (typeInput) {
      memoryData.typeInput = typeInput
    }
    
    if (submitterName.value.trim()) {
      memoryData.submitterName = submitterName.value.trim()
    }
    
    await memoriesStore.addMemory(memoryData)
    
    // Clear selected position
    uiStore.selectCard(null)
    
    console.log('✅ Memory submitted successfully!')
    
    // Close form and reset
    setTimeout(() => {
      closeForm()
      isSubmitting.value = false
    }, 500)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Het opslaan is mislukt. Probeer het opnieuw.'
    console.error('❌ Error submitting memory:', err)
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Image Cropper Modal -->
  <Transition name="modal">
    <div v-if="showCropper" class="cropper-modal-overlay" @click="handleCropCancel">
      <div class="cropper-modal-container" @click.stop>
        <div class="cropper-header">
          <h2>Bijsnijden naar Vierkant</h2>
          <button class="close-btn" @click="handleCropCancel" aria-label="Sluiten">×</button>
        </div>
        
        <div class="cropper-content">
          <p class="cropper-help">Sleep en zoom om een vierkant gebied te selecteren</p>
          
          <Cropper
            ref="cropperRef"
            class="cropper"
            :src="cropperImage"
            :stencil-props="{
              aspectRatio: 1
            }"
            :canvas="{
              maxWidth: 2048,
              maxHeight: 2048,
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high'
            }"
          />
          
          <div class="cropper-actions">
            <button type="button" @click="handleCropCancel" class="btn-secondary">
              Annuleren
            </button>
            <button type="button" @click="handleCropConfirm" class="btn-primary" :disabled="isCompressing">
              <span v-if="isCompressing">Verwerken...</span>
              <span v-else>✓ Bevestigen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Main Submission Form Modal -->
  <Transition name="modal">
    <div v-if="uiStore.isSubmissionFormOpen" class="modal-overlay" @click="closeForm">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Herinnering Delen</h2>
          <button class="close-btn" @click="closeForm" aria-label="Sluiten">×</button>
        </div>

        <form @submit.prevent="submitForm" class="submission-form" :style="{ pointerEvents: isInteractive ? 'auto' : 'none' }">
          <!-- Error message -->
          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>

          <!-- Step 1: Upload Photo -->
          <div class="form-section">
            <h3>1. Upload Foto (optioneel)</h3>
            <p class="help-text">Upload een foto of laat leeg voor alleen een citaat met hart-icoon</p>
            
            <div class="photo-upload">
              <!-- Compressing state -->
              <div v-if="isCompressing" class="compressing-state">
                <div class="spinner"></div>
                <p>Afbeelding wordt gecomprimeerd...</p>
              </div>
              
              <!-- Photo preview -->
              <div v-else-if="photoPreview" class="photo-preview">
                <img :src="photoPreview" alt="Preview" />
                <button type="button" @click="originalPhotoFile = null; gridPhotoFile = null; photoPreview = ''" class="remove-btn">
                  Verwijderen
                </button>
              </div>
              
              <!-- Upload placeholder -->
              <label v-else class="upload-label">
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handlePhotoUpload"
                  hidden
                />
                <div class="upload-placeholder">
                  <span class="upload-icon">📸</span>
                  <span>Klik om foto te uploaden</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 2: Choose Type -->
          <div class="form-section">
            <h3>2. Kies Type <span v-if="!isPhotoValid" class="required">*</span><span v-else>(optioneel)</span></h3>
            <p class="help-text">
              <span v-if="!isPhotoValid">Selecteer "Citaat" of "Toespraak" om een herinnering zonder foto toe te voegen</span>
              <span v-else>Voeg eventueel extra inhoud toe aan de foto</span>
            </p>
            <div class="type-selector">
              <label class="type-option">
                <input type="radio" value="quote" v-model="memoryType" />
                <span class="type-label">
                  <span class="type-icon">💬</span>
                  <span>Citaat</span>
                </span>
              </label>
              <label class="type-option">
                <input type="radio" value="speech" v-model="memoryType" />
                <span class="type-label">
                  <span class="type-icon">📜</span>
                  <span>Toespraak</span>
                </span>
              </label>
              <label class="type-option">
                <input type="radio" value="audio" v-model="memoryType" />
                <span class="type-label">
                  <span class="type-icon">🎵</span>
                  <span>Audio</span>
                </span>
              </label>
              <label class="type-option">
                <input type="radio" value="video" v-model="memoryType" />
                <span class="type-label">
                  <span class="type-icon">🎥</span>
                  <span>Video</span>
                </span>
              </label>
            </div>
            <button
              v-if="memoryType"
              type="button"
              @click="memoryType = null; typeInputText = ''; typeInputFile = null"
              class="clear-type-btn"
            >
              × Geen extra inhoud
            </button>
          </div>

          <!-- Step 3: Add Content (only shown if type is selected) -->
          <div v-if="memoryType" class="form-section">
            <h3>3. Voeg Inhoud Toe <span class="required">*</span></h3>
            
            <!-- Quote input -->
            <div v-if="memoryType === 'quote'">
              <textarea
                v-model="typeInputText"
                placeholder="Typ hier een citaat of herinnering van Opa Harrie..."
                rows="5"
                class="text-input"
              ></textarea>
              <small class="char-count">{{ typeInputText.length }} karakters (minimaal 5)</small>
            </div>
            
            <!-- Speech input -->
            <div v-else-if="memoryType === 'speech'">
              <textarea
                v-model="typeInputText"
                placeholder="Typ hier de volledige toespraak...&#10;&#10;Je kunt meerdere alinea's toevoegen door Enter te gebruiken."
                rows="15"
                class="text-input speech-textarea"
              ></textarea>
              <small class="char-count">{{ typeInputText.length }} karakters (minimaal 5)</small>
            </div>

            <!-- Audio input -->
            <div v-else-if="memoryType === 'audio'" class="file-input-wrapper">
              <label class="file-input-label">
                <input 
                  type="file" 
                  accept="audio/*" 
                  @change="handleTypeInputFileUpload"
                  hidden
                />
                <span v-if="typeInputFile">
                  ✅ {{ typeInputFile.name }}
                </span>
                <span v-else>
                  🎵 Klik om audiobestand te uploaden (.mp3, .wav, .m4a)
                </span>
              </label>
            </div>

            <!-- Video input -->
            <div v-else-if="memoryType === 'video'" class="file-input-wrapper">
              <label class="file-input-label">
                <input 
                  type="file" 
                  accept="video/*" 
                  @change="handleTypeInputFileUpload"
                  hidden
                />
                <span v-if="typeInputFile">
                  ✅ {{ typeInputFile.name }}
                </span>
                <span v-else>
                  🎥 Klik om videobestand te uploaden (.mp4, .mov)
                </span>
              </label>
            </div>
          </div>

          <!-- Step 4: Optional Name -->
          <div class="form-section">
            <h3>{{ memoryType ? '4' : '3' }}. Jouw Naam (optioneel)</h3>
            <input
              v-model="submitterName"
              type="text"
              placeholder="Bijv. Jan"
              class="text-input"
              maxlength="50"
            />
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn btn-secondary">
              Annuleren
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="!isFormValid || isSubmitting"
            >
              {{ isSubmitting ? 'Bezig met toevoegen...' : 'Herinnering Toevoegen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-medium);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  background: var(--color-background);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-background-secondary);
}

.submission-form {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.required {
  color: #ff6b6b;
}

.help-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* Photo upload */
.photo-upload {
  margin-top: 1rem;
}

.compressing-state {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--color-background-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-background-secondary);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.compressing-state p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.upload-label {
  display: block;
  cursor: pointer;
}

.upload-placeholder {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all var(--transition-fast);
}

.upload-placeholder:hover {
  border-color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.photo-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.photo-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Type selector */
.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

@media (min-width: 769px) {
  .type-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}

.type-option input[type="radio"] {
  display: none;
}

.type-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-option input[type="radio"]:checked + .type-label {
  border-color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

.type-label:hover {
  border-color: var(--color-text-primary);
}

.type-icon {
  font-size: 2rem;
}

/* Form inputs */
.text-input,
.file-input-label {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-text-primary);
}

textarea.text-input {
  resize: vertical;
}

.char-count {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.file-input-label {
  display: block;
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
}

.file-input-label:hover {
  border-color: var(--color-text-primary);
}

/* Form actions */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-text-primary);
  color: var(--color-background);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-type-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-type-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* Image Cropper Modal */
.cropper-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.cropper-modal-container {
  background: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.cropper-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.cropper-content {
  padding: 1.5rem;
}

.cropper-help {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.95rem;
}

.cropper {
  width: 100%;
  height: 450px;
  background: var(--color-background-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.cropper-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cropper-actions .btn-secondary,
.cropper-actions .btn-primary {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cropper-actions .btn-secondary {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.cropper-actions .btn-secondary:hover {
  background: var(--color-border);
}

.cropper-actions .btn-primary {
  background: var(--color-text-primary);
  color: var(--color-background);
}

.cropper-actions .btn-primary:hover:not(:disabled) {
  opacity: 0.8;
}

.cropper-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .type-selector {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .cropper-modal-overlay {
    padding: 1rem;
  }
  
  .cropper {
    height: 350px;
  }
  
  .cropper-actions {
    flex-direction: column-reverse;
  }
}
</style>


<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useMemoriesStore } from '@/stores/memories'
import { useMosaicStore } from '@/stores/mosaic'
import type { MemoryType } from '@/types'
import { uploadPhoto, uploadAudio, uploadVideo } from '@/services/storage'
import imageCompression from 'browser-image-compression'

const uiStore = useUIStore()
const memoriesStore = useMemoriesStore()
const mosaicStore = useMosaicStore()

// Form state
const memoryType = ref<MemoryType | null>(null)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string>('')
const typeInputText = ref('') // For quotes
const typeInputFile = ref<File | null>(null) // For audio/video
const submitterName = ref('')
const isSubmitting = ref(false)
const isCompressing = ref(false)
const error = ref<string | null>(null)

// Validation
const isPhotoValid = computed(() => photoFile.value !== null)
const isTypeInputValid = computed(() => {
  // If no type selected, no additional content needed
  if (!memoryType.value) {
    return true
  }
  
  // If type is selected, validate the input
  if (memoryType.value === 'quote') {
    return typeInputText.value.trim().length >= 5
  } else {
    return typeInputFile.value !== null
  }
})
const isFormValid = computed(() => isPhotoValid.value && isTypeInputValid.value)

// Handle photo upload
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
    
    try {
      isCompressing.value = true
      error.value = null
      
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)
      console.log(`🖼️ Original image: ${originalSizeMB} MB`)
      
      // Compress image using browser-image-compression
      const options = {
        maxSizeMB: 2, // Max file size in MB
        maxWidthOrHeight: 1920, // Max width or height
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/jpeg', // Convert to JPEG for better compression
      }
      
      const compressedFile = await imageCompression(file, options)
      
      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2)
      console.log(`✅ Compressed image: ${compressedSizeMB} MB`)
      
      photoFile.value = compressedFile
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        photoPreview.value = e.target?.result as string
      }
      reader.readAsDataURL(compressedFile)
      
    } catch (err) {
      console.error('❌ Error compressing image:', err)
      error.value = 'Fout bij het comprimeren van de afbeelding. Probeer een andere foto.'
    } finally {
      isCompressing.value = false
    }
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
  photoFile.value = null
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
    
    if (!targetPosition) {
      // No specific position selected, use next available
      targetPosition = memoriesStore.getNextEmptyPosition(
        mosaicStore.gridWidth,
        mosaicStore.gridHeight,
      )
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
    
    // Step 1: Upload photo to Firebase Storage (required)
    console.log('📤 Uploading photo to Firebase Storage...')
    const photoUrl = await uploadPhoto(memoryId, photoFile.value!)
    
    // Step 2: Upload audio/video or use quote text (optional)
    let typeInput: string | undefined
    if (memoryType.value === 'quote') {
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
      photoUrl,
      gridPosition: targetPosition,
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
  <Transition name="modal">
    <div v-if="uiStore.isSubmissionFormOpen" class="modal-overlay" @click="closeForm">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Herinnering Delen</h2>
          <button class="close-btn" @click="closeForm" aria-label="Sluiten">×</button>
        </div>

        <form @submit.prevent="submitForm" class="submission-form">
          <!-- Error message -->
          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>

          <!-- Step 1: Upload Photo -->
          <div class="form-section">
            <h3>1. Upload Foto <span class="required">*</span></h3>
            <p class="help-text">Deze foto wordt getoond in het mozaïek</p>
            
            <div class="photo-upload">
              <!-- Compressing state -->
              <div v-if="isCompressing" class="compressing-state">
                <div class="spinner"></div>
                <p>Afbeelding wordt gecomprimeerd...</p>
              </div>
              
              <!-- Photo preview -->
              <div v-else-if="photoPreview" class="photo-preview">
                <img :src="photoPreview" alt="Preview" />
                <button type="button" @click="photoFile = null; photoPreview = ''" class="remove-btn">
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
            <h3>2. Kies Type (optioneel)</h3>
            <p class="help-text">Voeg eventueel extra inhoud toe aan de foto</p>
            <div class="type-selector">
              <label class="type-option">
                <input type="radio" value="quote" v-model="memoryType" />
                <span class="type-label">
                  <span class="type-icon">💬</span>
                  <span>Citaat</span>
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
                placeholder="Typ hier een citaat of herinnering van Opa Harry..."
                rows="5"
                class="text-input"
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
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

/* Responsive */
@media (max-width: 768px) {
  .type-selector {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>


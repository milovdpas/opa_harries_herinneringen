<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useMemoriesStore } from '@/stores/memories'
import { useMosaicStore } from '@/stores/mosaic'
import QuoteDisplay from './QuoteDisplay.vue'
import AudioPlayer from './AudioPlayer.vue'
import VideoPlayer from './VideoPlayer.vue'

const uiStore = useUIStore()
const memoriesStore = useMemoriesStore()
const mosaicStore = useMosaicStore()

// Touch/swipe state
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50 // Minimum distance (px) to trigger swipe

// Get current memory
const currentMemory = computed(() => {
  if (!uiStore.openMemoryPosition) return null
  return memoriesStore.getMemoryAt(uiStore.openMemoryPosition)
})

// Check if modal is open
const isOpen = computed(() => !!uiStore.openMemoryPosition)

// Navigation: Get next/previous filled positions
const canNavigatePrevious = computed(() => {
  if (!uiStore.openMemoryPosition) return false
  const prev = getPreviousMemoryPosition()
  return prev !== null
})

const canNavigateNext = computed(() => {
  if (!uiStore.openMemoryPosition) return false
  const next = getNextMemoryPosition()
  return next !== null
})

const getPreviousMemoryPosition = () => {
  if (!uiStore.openMemoryPosition) return null
  
  const currentPos = uiStore.openMemoryPosition
  const allMemories = memoriesStore.memories
  
  // Sort memories by grid position (row-major order)
  const sortedMemories = [...allMemories].sort((a, b) => {
    if (a.gridPosition.row !== b.gridPosition.row) {
      return a.gridPosition.row - b.gridPosition.row
    }
    return a.gridPosition.col - b.gridPosition.col
  })
  
  // Find current memory index
  const currentIndex = sortedMemories.findIndex(
    m => m.gridPosition.row === currentPos.row && m.gridPosition.col === currentPos.col
  )
  
  // Return previous memory position (if exists)
  if (currentIndex > 0) {
    const prevMemory = sortedMemories[currentIndex - 1]
    return prevMemory ? prevMemory.gridPosition : null
  }
  
  return null
}

const getNextMemoryPosition = () => {
  if (!uiStore.openMemoryPosition) return null
  
  const currentPos = uiStore.openMemoryPosition
  const allMemories = memoriesStore.memories
  
  // Sort memories by grid position (row-major order)
  const sortedMemories = [...allMemories].sort((a, b) => {
    if (a.gridPosition.row !== b.gridPosition.row) {
      return a.gridPosition.row - b.gridPosition.row
    }
    return a.gridPosition.col - b.gridPosition.col
  })
  
  // Find current memory index
  const currentIndex = sortedMemories.findIndex(
    m => m.gridPosition.row === currentPos.row && m.gridPosition.col === currentPos.col
  )
  
  // Return next memory position (if exists)
  if (currentIndex >= 0 && currentIndex < sortedMemories.length - 1) {
    const nextMemory = sortedMemories[currentIndex + 1]
    return nextMemory ? nextMemory.gridPosition : null
  }
  
  return null
}

const navigatePrevious = () => {
  const prev = getPreviousMemoryPosition()
  if (prev) {
    uiStore.navigateToMemory(prev)
  }
}

const navigateNext = () => {
  const next = getNextMemoryPosition()
  if (next) {
    uiStore.navigateToMemory(next)
  }
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  
  switch (e.key) {
    case 'Escape':
      uiStore.closeMemory()
      break
    case 'ArrowLeft':
      navigatePrevious()
      break
    case 'ArrowRight':
      navigateNext()
      break
    case ' ':
      e.preventDefault()
      uiStore.flipMemory()
      break
  }
}

// Touch/swipe handlers
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches[0]) {
    touchStartX.value = e.touches[0].clientX
    touchEndX.value = e.touches[0].clientX
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches[0]) {
    touchEndX.value = e.touches[0].clientX
  }
}

const handleTouchEnd = () => {
  const distance = touchStartX.value - touchEndX.value
  const isSwipe = Math.abs(distance) > minSwipeDistance
  
  if (isSwipe) {
    if (distance > 0) {
      // Swiped left → navigate next
      navigateNext()
    } else {
      // Swiped right → navigate previous
      navigatePrevious()
    }
  }
  
  // Reset
  touchStartX.value = 0
  touchEndX.value = 0
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen && currentMemory" class="modal-overlay" @click="uiStore.closeMemory()">
      <!-- Modal Content -->
      <div 
        class="modal-content" 
        @click.stop
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Close Button -->
        <button class="close-btn" @click="uiStore.closeMemory()">
          <span>✕</span>
        </button>
        
        <!-- Navigation: Previous -->
        <button
          v-if="canNavigatePrevious"
          class="nav-btn nav-prev"
          @click="navigatePrevious"
          title="Vorige herinnering (←)"
        >
          <span>‹</span>
        </button>
        
        <!-- Navigation: Next -->
        <button
          v-if="canNavigateNext"
          class="nav-btn nav-next"
          @click="navigateNext"
          title="Volgende herinnering (→)"
        >
          <span>›</span>
        </button>
        
        <!-- Card Container (with 3D flip) -->
        <div class="card-container" :class="{ flipped: uiStore.isMemoryFlipped }">
          <!-- Front: Photo -->
          <div class="card-side card-front">
            <img
              :src="currentMemory.photoUrl"
              :alt="`Memory by ${currentMemory.submitterName || 'Unknown'}`"
              class="memory-image"
            />
            
            <!-- Flip Button (only show if there's content on back) -->
            <button
              v-if="currentMemory.type"
              class="flip-btn"
              @click="uiStore.flipMemory()"
              title="Draai kaart om (spatiebalk)"
            >
              <span v-if="currentMemory.type === 'quote'">💬 Toon Citaat</span>
              <span v-else-if="currentMemory.type === 'audio'">🎵 Beluister Audio</span>
              <span v-else-if="currentMemory.type === 'video'">🎥 Bekijk Video</span>
            </button>
          </div>
          
          <!-- Back: Quote/Audio/Video -->
          <div class="card-side card-back">
            <!-- Quote -->
            <QuoteDisplay
              v-if="currentMemory.type === 'quote' && currentMemory.typeInput"
              :quote="currentMemory.typeInput"
              :submitter-name="currentMemory.submitterName"
            />
            
            <!-- Audio -->
            <AudioPlayer
              v-else-if="currentMemory.type === 'audio' && currentMemory.typeInput"
              :audio-url="currentMemory.typeInput"
              :submitter-name="currentMemory.submitterName"
            />
            
            <!-- Video -->
            <VideoPlayer
              v-else-if="currentMemory.type === 'video' && currentMemory.typeInput"
              :video-url="currentMemory.typeInput"
              :submitter-name="currentMemory.submitterName"
            />
            
            <!-- Flip back button -->
            <button
              class="flip-back-btn"
              @click="uiStore.flipMemory()"
              title="Draai terug (spatiebalk)"
            >
              ↩ Terug naar foto
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 900px;
  height: 80vh;
  max-height: 700px;
  perspective: 2000px; /* For 3D flip effect */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Close button */
.close-btn {
  position: absolute;
  top: -3rem;
  right: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* Navigation buttons */
.nav-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 4rem;
  height: 4rem;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 2.5rem;
  line-height: 1;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  z-index: 1010;
  backdrop-filter: blur(10px);
}

.nav-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.3rem; /* Fine-tune vertical alignment */
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-50%) scale(1.1);
}

.nav-prev {
  left: calc(50% - 550px); /* Position outside modal */
}

.nav-next {
  right: calc(50% - 550px); /* Position outside modal */
}

/* Fallback for smaller screens */
@media (max-width: 1200px) {
  .nav-prev {
    left: 1rem;
  }
  
  .nav-next {
    right: 1rem;
  }
}

/* Card container (3D flip) */
.card-container {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-container.flipped {
  transform: rotateY(180deg);
}

.card-container.flipped .card-front {
  display: none; /* Remove front from layout when flipped */
}

.card-container:not(.flipped) .card-back {
  display: none; /* Remove back from layout when not flipped */
}

.card-side {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-background-secondary);
}

.card-front {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-back {
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Photo */
.memory-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* Flip button (on front) */
.flip-btn {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.8rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
}

.flip-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateX(-50%) scale(1.05);
}

/* Flip back button (on back) */
.flip-back-btn {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1.2rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.flip-back-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-content {
    height: 70vh;
  }
  
  .nav-prev {
    left: 0;
    bottom: -4rem;
    top: auto;
    transform: none;
  }
  
  .nav-next {
    right: 0;
    bottom: -4rem;
    top: auto;
    transform: none;
  }
  
  .nav-btn {
    width: 3rem;
    height: 3rem;
    font-size: 2.5rem;
  }
  
  .close-btn {
    top: -2.5rem;
    right: 0.5rem;
  }
}
</style>


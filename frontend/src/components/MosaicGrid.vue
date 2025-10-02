<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted, nextTick, watch } from 'vue'
import { useMosaicStore } from '@/stores/mosaic'
import { useMemoriesStore } from '@/stores/memories'
import { useUIStore } from '@/stores/ui'
import MemoryCard from './MemoryCard.vue'
import type { CardData } from '@/types'
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom'

const props = withDefaults(
  defineProps<{
    referencePhotoUrl: string
    targetCards?: number
    usePregenerated?: boolean // Use pre-generated config instead of analyzing
  }>(),
  {
    targetCards: 2400,
    usePregenerated: false,
  },
)

const mosaicStore = useMosaicStore()
const memoriesStore = useMemoriesStore()
const uiStore = useUIStore()

// Panzoom instance
const containerRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
let panzoomInstance: PanzoomObject | null = null

// Loading state
const isLoading = computed(() => mosaicStore.isLoading || memoriesStore.isLoading)

// Zoom hint visibility
const showZoomHint = ref(true)
let inactivityTimer: number | null = null

// Hide hint after 5 seconds, show again after 30 seconds of inactivity
const hideZoomHint = () => {
  setTimeout(() => {
    showZoomHint.value = false
  }, 5000)
}

const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
  showZoomHint.value = false
  inactivityTimer = window.setTimeout(() => {
    showZoomHint.value = true
    hideZoomHint()
  }, 30000) // 30 seconds
}

// Initialize mosaic on mount
onMounted(async () => {
  try {
    if (props.usePregenerated) {
      // Load pre-generated config from file (instant!)
      mosaicStore.isLoading = true
      const { MOSAIC_CONFIG } = await import('@/config/mosaicConfig')
      mosaicStore.config = {
        ...MOSAIC_CONFIG,
        lastUpdated: new Date(MOSAIC_CONFIG.lastUpdated),
      }
      console.log('✅ Loaded pre-generated mosaic config (instant!)')
      mosaicStore.isLoading = false
    } else {
      // Analyze photo (slower, for testing)
      await mosaicStore.initializeConfig(props.referencePhotoUrl, props.targetCards)
    }

    // Load memories from Firestore
    await memoriesStore.loadMemories()
  } catch (error) {
    console.error('❌ Error initializing mosaic:', error)
    mosaicStore.isLoading = false
    memoriesStore.isLoading = false
  }
})

// Initialize Panzoom when loading is complete and grid is rendered
watch(isLoading, async (loading) => {
  if (!loading && !panzoomInstance) {
    // Wait for next tick to ensure DOM is updated
    await nextTick()
    
    if (gridRef.value && containerRef.value) {
      console.log('🔍 Initializing Panzoom...')
      
      try {
        panzoomInstance = Panzoom(gridRef.value, {
          maxScale: 12,
          minScale: 0.5,
          startScale: 1,
          step: 0.3,
          canvas: true,
          contain: 'outside',
          cursor: 'move',
        })
        
        // Enable mouse wheel zoom
        const handleWheel = (event: WheelEvent) => {
          if (!panzoomInstance) return
          event.preventDefault()
          panzoomInstance.zoomWithWheel(event)
          resetInactivityTimer()
        }
        
        // Track user activity for inactivity timer
        const handleActivity = () => {
          resetInactivityTimer()
        }
        
        containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
        containerRef.value.addEventListener('mousedown', handleActivity)
        containerRef.value.addEventListener('touchstart', handleActivity)
        
        // Listen to Panzoom events to track panning state
        // Add leniency: only set hasActuallyPanned if movement is significant (not just a tiny accidental move)
        let hasActuallyPanned = false
        let lastPanzoomPosition = { x: 0, y: 0 }
        const PAN_THRESHOLD = 8 // pixels, adjust as needed

        gridRef.value.addEventListener('panzoomstart', (e: any) => {
          hasActuallyPanned = false
          // Get initial position from panzoom
          if (panzoomInstance) {
            const pan = panzoomInstance.getPan()
            lastPanzoomPosition = { x: pan.x, y: pan.y }
          }
        })

        gridRef.value.addEventListener('panzoomchange', (e: any) => {
          // Get current position/scale
          if (panzoomInstance) {
            const pan = panzoomInstance.getPan()
            const dx = Math.abs(pan.x - lastPanzoomPosition.x)
            const dy = Math.abs(pan.y - lastPanzoomPosition.y)
            // Only consider as "actual pan" if moved enough (ignore zoom-only changes)
            if (!hasActuallyPanned && (dx > PAN_THRESHOLD || dy > PAN_THRESHOLD)) {
              hasActuallyPanned = true
              uiStore.setIsPanning(true)
            }
          }
        })

        gridRef.value.addEventListener('panzoomend', () => {
          // Always reset isPanning, even if no actual pan happened (safety net)
          if (hasActuallyPanned) {
            // Small delay to prevent click right after pan ends
            setTimeout(() => {
              uiStore.setIsPanning(false)
              hasActuallyPanned = false
            }, 100)
          } else {
            // Immediate reset if no panning occurred
            uiStore.setIsPanning(false)
          }
        })
        
        // Show hint at start, then hide after 5 seconds
        hideZoomHint()
        
        console.log('✅ Zoom enabled! (scroll/pinch to zoom, drag to pan)')
      } catch (error) {
        console.error('❌ Error initializing Panzoom:', error)
      }
    } else {
      console.warn('⚠️ Grid or container ref not available')
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (panzoomInstance) {
    panzoomInstance.destroy()
  }
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
})

// Zoom controls
const zoomIn = () => {
  if (panzoomInstance) {
    panzoomInstance.zoomIn()
  }
}

const zoomOut = () => {
  if (panzoomInstance) {
    panzoomInstance.zoomOut()
  }
}

const resetZoom = () => {
  if (panzoomInstance) {
    panzoomInstance.reset({
      animate: true,
    })
  }
}

// Generate card data by combining mosaic config with memories
const cardData = computed<CardData[]>(() => {
  const cards: CardData[] = []
  
  for (let row = 0; row < mosaicStore.gridHeight; row++) {
    for (let col = 0; col < mosaicStore.gridWidth; col++) {
      const position = { row, col }
      const colorData = mosaicStore.getCardColor(row, col)
      const memory = memoriesStore.getMemoryAt(position)
      
      cards.push({
        position,
        backgroundColor: colorData?.backgroundColor || '#333333',
        brightness: colorData?.brightness || 0,
        alpha: colorData?.alpha,
        memory,
        isEmpty: !memory,
      })
    }
  }
  
  return cards
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${mosaicStore.gridWidth}, 1fr)`,
  gridTemplateRows: `repeat(${mosaicStore.gridHeight}, 1fr)`,
}))
</script>

<template>
  <div class="mosaic-container" ref="containerRef">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p v-if="mosaicStore.isLoading">🎨 Loading mosaic configuration...</p>
      <p v-else-if="memoriesStore.isLoading">📸 Loading memories...</p>
      <p v-else>Loading...</p>
    </div>

    <!-- Mosaic grid (zoomable) -->
    <div v-else class="mosaic-grid" ref="gridRef" :style="gridStyle">
      <MemoryCard
        v-for="card in cardData"
        :key="`${card.position.row}-${card.position.col}`"
        :card="card"
      />
    </div>

    <!-- Zoom Controls -->
    <div v-if="!isLoading" class="zoom-controls">
      <button @click="zoomIn" class="zoom-btn" title="Zoom In">
        <span>+</span>
      </button>
      <button @click="resetZoom" class="zoom-btn" title="Reset Zoom">
        <span>⟲</span>
      </button>
      <button @click="zoomOut" class="zoom-btn" title="Zoom Out">
        <span>−</span>
      </button>
    </div>

    <!-- Zoom hint (shows temporarily at start and on inactivity) -->
    <Transition name="fade">
      <div v-if="showZoomHint && !isLoading" class="zoom-hint">
        🔍 Scroll/pinch to zoom, drag to pan
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mosaic-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: self-start;
  justify-content: center;
  position: relative;
  background: var(--color-background);
  overflow: hidden;
  touch-action: none; /* Prevent browser zoom, use Panzoom instead */
}

.loading {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 50px;
  height: 50px;
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

.mosaic-grid {
  display: grid;
  gap: 0;
  width: 100%;
  max-width: 1400px;
  /* Aspect ratio maintained by grid-template-rows */
}

/* Zoom hint */
.zoom-hint {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Zoom Controls */
.zoom-controls {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 100;
}

.zoom-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.zoom-btn:hover {
  background: var(--color-text-primary);
  color: var(--color-background);
  transform: scale(1.1);
}

.zoom-btn:active {
  transform: scale(0.95);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .zoom-controls {
    bottom: 5rem; /* Above the "Add Memory" button */
  }
  
  .zoom-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
  
  .mosaic-info {
    font-size: 0.7rem;
    padding: 0.4rem 0.8rem;
  }
}
</style>


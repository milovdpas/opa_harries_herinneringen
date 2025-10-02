<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import OpenSeadragon from 'openseadragon'
import { useMosaicStore } from '@/stores/mosaic'
import { useMemoriesStore } from '@/stores/memories'
import { useUIStore } from '@/stores/ui'

const props = withDefaults(
  defineProps<{
    referencePhotoUrl: string
    targetCards?: number
    usePregenerated?: boolean
    scaleFactor?: number // Scale factor for memory positions (e.g., 0.5 = half grid)
  }>(),
  {
    targetCards: 6000,
    usePregenerated: false,
    scaleFactor: 1,
  },
)

const mosaicStore = useMosaicStore()
const memoriesStore = useMemoriesStore()
const uiStore = useUIStore()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const viewerContainerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let viewer: OpenSeadragon.Viewer | null = null
let ctx: CanvasRenderingContext2D | null = null

// Canvas dimensions (will be set based on reference image)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Card size in pixels (larger = more detail, better image quality)
// Auto-adjust based on scale factor: half grid = double card size
const CARD_SIZE = 100

// State
const isInitializing = ref(true)
const imagesLoaded = ref(false)
const memoryImages = new Map<string, HTMLImageElement>()
const referenceImage = ref<HTMLImageElement | null>(null)

// Hover state
const hoveredCard = ref<{ row: number; col: number } | null>(null)
const hoverOverlayStyle = ref<any>(null)

// Touch feedback animation
const touchFeedback = ref<{ row: number; col: number; style: any } | null>(null)
let touchFeedbackTimeout: number | null = null

// Loading state
const isLoading = computed(() => 
  mosaicStore.isLoading || memoriesStore.isLoading || !imagesLoaded.value
)

// Scale factor for template access
const scaleFactor = computed(() => props.scaleFactor)

// Initialize mosaic configuration
onMounted(async () => {
  try {
    // Load memories first to check how many we have
    await memoriesStore.loadMemories()
    
    if (props.usePregenerated) {
      // Load pre-generated config
      mosaicStore.isLoading = true
      const { MOSAIC_CONFIG } = await import('@/config/mosaicConfig')
      mosaicStore.config = {
        ...MOSAIC_CONFIG,
        lastUpdated: new Date(MOSAIC_CONFIG.lastUpdated),
      }
      console.log('✅ Loaded pre-generated mosaic config')
      mosaicStore.isLoading = false
    } else {
      // Calculate minimum cards needed for all memories with scaling
      const memoryCount = memoriesStore.memories.length
      const scaledMemoryCount = Math.ceil(memoryCount * props.scaleFactor * props.scaleFactor)
      const minCards = Math.max(props.targetCards, scaledMemoryCount * 1.5) // 1.5x for empty space
      
      console.log(`📊 Memories: ${memoryCount}, Scaled need: ${scaledMemoryCount}, Using: ${minCards} cards`)
      
      // Analyze photo with adjusted card count
      await mosaicStore.initializeConfig(props.referencePhotoUrl, minCards)
    }

    // Wait for DOM update
    await nextTick()
    
    // Initialize canvas and OpenSeadragon
    await initCanvas()
  } catch (error) {
    console.error('❌ Error initializing alternative mosaic:', error)
    mosaicStore.isLoading = false
    memoriesStore.isLoading = false
  }
})

// Load reference image
const loadReferenceImage = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Enable CORS
    img.onload = () => {
      referenceImage.value = img
      console.log(`✅ Reference image loaded: ${img.width}x${img.height}`)
      resolve()
    }
    img.onerror = reject
    img.src = props.referencePhotoUrl
  })
}

// Load all memory images
const loadMemoryImages = async () => {
  const memories = memoriesStore.memories
  memoryImages.clear()
  
  const loadPromises: Promise<void>[] = []
  
  for (const memory of memories) {
    // Use gridPhotoUrl for mosaic display if available, otherwise use photoUrl
    const imageUrl = memory.gridPhotoUrl || memory.photoUrl
    
    if (imageUrl) {
      const promise = new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous' // Enable CORS
        img.onload = () => {
          const key = `${memory.gridPosition.row}-${memory.gridPosition.col}`
          memoryImages.set(key, img)
          resolve()
        }
        img.onerror = () => resolve() // Continue even if one fails
        img.src = imageUrl
      })
      loadPromises.push(promise)
    }
  }
  
  await Promise.all(loadPromises)
  console.log(`📸 Loaded ${memoryImages.size} memory images`)
}

// Initialize canvas
const initCanvas = async () => {
  if (!canvasRef.value) {
    console.warn('⚠️ Canvas ref not available')
    return
  }

  console.log('🎨 Initializing canvas...')

  // Load reference image first
  await loadReferenceImage()
  
  if (!referenceImage.value) {
    console.error('❌ Reference image failed to load')
    return
  }

  // Set canvas dimensions based on grid and card size
  canvasWidth.value = mosaicStore.gridWidth * CARD_SIZE
  canvasHeight.value = mosaicStore.gridHeight * CARD_SIZE

  const canvas = canvasRef.value
  canvas.width = canvasWidth.value
  canvas.height = canvasHeight.value

  ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) {
    console.error('❌ Failed to get canvas context')
    return
  }

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  console.log(`✅ Canvas initialized: ${canvasWidth.value}x${canvasHeight.value}px (${mosaicStore.gridWidth}x${mosaicStore.gridHeight} cards)`)

  // Load memory images (CORS is now configured!)
  await loadMemoryImages()
  imagesLoaded.value = true

  // Draw initial mosaic
  drawMosaic()

  // Initialize OpenSeadragon
  initOpenSeadragon()
}

// Draw the entire mosaic
const drawMosaic = () => {
  if (!ctx || !referenceImage.value) return

  console.log('🎨 Drawing alternative mosaic...')

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Draw base reference image (grandpa)
  ctx.drawImage(referenceImage.value, 0, 0, canvasWidth.value, canvasHeight.value)

  // Draw overlays for each card
  for (let row = 0; row < mosaicStore.gridHeight; row++) {
    for (let col = 0; col < mosaicStore.gridWidth; col++) {
      drawCardOverlay(row, col)
    }
  }

  console.log('✅ Mosaic drawn!')
}

// Draw overlay for a single card
const drawCardOverlay = (row: number, col: number) => {
  if (!ctx || !referenceImage.value) return

  const x = col * CARD_SIZE
  const y = row * CARD_SIZE
  
  // Scale position to find memory in original grid
  const originalRow = Math.floor(row / props.scaleFactor)
  const originalCol = Math.floor(col / props.scaleFactor)
  const memory = memoriesStore.getMemoryAt({ row: originalRow, col: originalCol })
  
  const colorData = mosaicStore.getCardColor(row, col)
  const alpha = colorData?.alpha ?? 1

  // Skip transparent areas
  if (alpha < 0.1) return

  if (memory && memory.photoUrl) {
    // Filled card: blend uploaded photo with grandpa's image colors
    const key = `${originalRow}-${originalCol}`
    const img = memoryImages.get(key)
    
    if (img) {
      // Save context
      ctx.save()
      
      // First, ensure grandpa's image is visible at this position (already drawn in drawMosaic)
      // Now blend the memory photo on top
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.85
      ctx.drawImage(img, x, y, CARD_SIZE, CARD_SIZE)
      
      // Restore context
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.restore()
    }
  } else {
    // Empty card: draw semi-transparent gray overlay
    ctx.fillStyle = 'rgba(128, 128, 128, 0.6)'
    ctx.fillRect(x, y, CARD_SIZE, CARD_SIZE)
  }
}

// Initialize OpenSeadragon viewer
const initOpenSeadragon = () => {
  if (!viewerContainerRef.value || !canvasRef.value) {
    console.warn('⚠️ Viewer container or canvas not available')
    return
  }

  console.log('🔍 Initializing OpenSeadragon...')

  try {
    // Create a simple tile source from our canvas
    let canvasDataUrl
    try {
      canvasDataUrl = canvasRef.value.toDataURL()
    } catch (corsError) {
      console.error('❌ CORS error when exporting canvas:', corsError)
      console.log('💡 Note: Images must be served with proper CORS headers for canvas export.')
      // Use a placeholder or the reference image directly
      canvasDataUrl = props.referencePhotoUrl
    }

    const tileSources = {
      type: 'image',
      url: canvasDataUrl,
      buildPyramid: false,
    }

    viewer = OpenSeadragon({
      element: viewerContainerRef.value,
      tileSources: tileSources,
      prefixUrl: '//openseadragon.github.io/openseadragon/images/',
      showNavigationControl: false, // Hide built-in controls, use custom buttons
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: false,
      maxZoomPixelRatio: 2,
      minZoomLevel: 0.5,
      visibilityRatio: 0.1,
      zoomPerScroll: 1.2,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
      },
    })
    
    // Track panning state to prevent clicks during pan
    viewer.addHandler('canvas-drag', () => {
      uiStore.setIsPanning(true)
    })
    
    viewer.addHandler('canvas-drag-end', () => {
      // Small delay to prevent click right after pan
      setTimeout(() => {
        uiStore.setIsPanning(false)
      }, 100)
    })

    // Add click handler
    viewer.addHandler('canvas-click', handleCanvasClick)

    // Add mouse tracker for hover effects
    const tracker = new OpenSeadragon.MouseTracker({
      element: viewer.canvas,
      moveHandler: handleMouseMove,
      exitHandler: handleMouseLeave,
    })

    // Also handle zoom/pan changes to update hover overlay
    viewer.addHandler('animation', () => {
      // Recalculate hover overlay position if hovering
      if (hoveredCard.value && viewer) {
        const { row, col } = hoveredCard.value
        const cardTopLeft = viewer.viewport.imageToViewportCoordinates(
          new OpenSeadragon.Point(col * CARD_SIZE, row * CARD_SIZE)
        )
        const cardBottomRight = viewer.viewport.imageToViewportCoordinates(
          new OpenSeadragon.Point((col + 1) * CARD_SIZE, (row + 1) * CARD_SIZE)
        )
        const topLeftPixel = viewer.viewport.pixelFromPoint(cardTopLeft)
        const bottomRightPixel = viewer.viewport.pixelFromPoint(cardBottomRight)
        const width = bottomRightPixel.x - topLeftPixel.x
        const height = bottomRightPixel.y - topLeftPixel.y
        hoverOverlayStyle.value = {
          left: `${topLeftPixel.x}px`,
          top: `${topLeftPixel.y}px`,
          width: `${width}px`,
          height: `${height}px`,
        }
      }
    })

    console.log('✅ OpenSeadragon initialized!')
    isInitializing.value = false
  } catch (error) {
    console.error('❌ Error initializing OpenSeadragon:', error)
  }
}

// Handle canvas click
const handleCanvasClick = (event: any) => {
  if (!viewer || uiStore.isPanning) return

  // Get click position in viewport coordinates
  const viewportPoint = viewer.viewport.pointFromPixel(event.position)
  
  // Convert to image coordinates
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint)
  
  // Convert to grid position (in new scaled grid)
  const col = Math.floor(imagePoint.x / CARD_SIZE)
  const row = Math.floor(imagePoint.y / CARD_SIZE)

  // Check if within grid
  if (row < 0 || row >= mosaicStore.gridHeight || col < 0 || col >= mosaicStore.gridWidth) {
    return
  }

  // Check if clickable (not transparent)
  const colorData = mosaicStore.getCardColor(row, col)
  const alpha = colorData?.alpha ?? 1
  if (alpha < 0.1) return

  // Scale position back to original grid for memory lookup
  const originalRow = Math.floor(row / props.scaleFactor)
  const originalCol = Math.floor(col / props.scaleFactor)
  const originalPosition = { row: originalRow, col: originalCol }
  const memory = memoriesStore.getMemoryAt(originalPosition)

  if (memory) {
    // Open memory modal with original position
    uiStore.openMemory(originalPosition)
  } else {
    // Open submission form with original position
    uiStore.selectCard(originalPosition)
    uiStore.openSubmissionForm()
  }
}

// Handle mouse move for hover effects
const handleMouseMove = (event: any) => {
  if (!viewer || !containerRef.value) return

  const viewportPoint = viewer.viewport.pointFromPixel(event.position)
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint)

  const col = Math.floor(imagePoint.x / CARD_SIZE)
  const row = Math.floor(imagePoint.y / CARD_SIZE)

  // Check if within grid bounds
  if (row < 0 || row >= mosaicStore.gridHeight || col < 0 || col >= mosaicStore.gridWidth) {
    hoveredCard.value = null
    hoverOverlayStyle.value = null
    return
  }

  // Check if card is clickable (not transparent)
  const colorData = mosaicStore.getCardColor(row, col)
  const alpha = colorData?.alpha ?? 1
  if (alpha < 0.1) {
    hoveredCard.value = null
    hoverOverlayStyle.value = null
    return
  }

  // Check if position changed
  if (hoveredCard.value?.row !== row || hoveredCard.value?.col !== col) {
    hoveredCard.value = { row, col }

    // Calculate overlay position in viewport coordinates
    const cardTopLeft = viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point(col * CARD_SIZE, row * CARD_SIZE)
    )
    const cardBottomRight = viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point((col + 1) * CARD_SIZE, (row + 1) * CARD_SIZE)
    )

    // Convert viewport coordinates to pixel coordinates
    const topLeftPixel = viewer.viewport.pixelFromPoint(cardTopLeft)
    const bottomRightPixel = viewer.viewport.pixelFromPoint(cardBottomRight)

    // Calculate size and position
    const width = bottomRightPixel.x - topLeftPixel.x
    const height = bottomRightPixel.y - topLeftPixel.y

    hoverOverlayStyle.value = {
      left: `${topLeftPixel.x}px`,
      top: `${topLeftPixel.y}px`,
      width: `${width}px`,
      height: `${height}px`,
    }

    // Show touch feedback animation (helpful for mobile users)
    showTouchFeedback(row, col, topLeftPixel.x, topLeftPixel.y, width, height)
  }
}

// Show brief touch feedback animation to indicate clickability
const showTouchFeedback = (row: number, col: number, x: number, y: number, width: number, height: number) => {
  // Clear any existing timeout
  if (touchFeedbackTimeout) {
    clearTimeout(touchFeedbackTimeout)
  }

  // Set touch feedback
  touchFeedback.value = {
    row,
    col,
    style: {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    }
  }

  // Clear after animation completes
  touchFeedbackTimeout = window.setTimeout(() => {
    touchFeedback.value = null
  }, 800) // Match animation duration
}

// Handle mouse leave
const handleMouseLeave = () => {
  hoveredCard.value = null
  hoverOverlayStyle.value = null
}

// Watch for memory updates to redraw
watch(() => memoriesStore.memories.length, () => {
  if (ctx && imagesLoaded.value && viewer && canvasRef.value) {
    console.log('🔄 Memories updated, reloading images and redrawing...')
    loadMemoryImages().then(() => {
      drawMosaic()
      // Recreate the tile source with updated canvas
      try {
        viewer!.open({
          type: 'image',
          url: canvasRef.value!.toDataURL(),
          buildPyramid: false,
        })
        console.log('✅ Updated OpenSeadragon view')
      } catch (error) {
        console.error('❌ Error updating OpenSeadragon image:', error)
      }
    })
  }
})

// Custom zoom controls
const zoomIn = () => {
  if (viewer) {
    viewer.viewport.zoomBy(1.2)
    viewer.viewport.applyConstraints()
  }
}

const zoomOut = () => {
  if (viewer) {
    viewer.viewport.zoomBy(0.8)
    viewer.viewport.applyConstraints()
  }
}

const resetZoom = () => {
  if (viewer) {
    viewer.viewport.goHome()
  }
}

// Cleanup
onUnmounted(() => {
  if (viewer) {
    viewer.destroy()
  }
  if (touchFeedbackTimeout) {
    clearTimeout(touchFeedbackTimeout)
  }
})
</script>

<template>
  <div class="alternative-mosaic-container" ref="containerRef">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p v-if="mosaicStore.isLoading">🎨 Loading mosaic configuration...</p>
      <p v-else-if="!imagesLoaded">📸 Loading images...</p>
      <p v-else>Loading...</p>
    </div>

    <!-- Hidden canvas for rendering -->
    <canvas
      ref="canvasRef"
      style="display: none;"
    ></canvas>

    <!-- OpenSeadragon viewer container -->
    <div
      v-show="!isLoading"
      ref="viewerContainerRef"
      class="openseadragon-viewer"
    ></div>

    <!-- Touch Feedback Animation (ripple effect to show clickability) -->
    <div
      v-if="touchFeedback"
      class="touch-feedback"
      :style="touchFeedback.style"
    ></div>

    <!-- Hover Overlay -->
    <div
      v-if="hoverOverlayStyle && hoveredCard"
      class="hover-overlay"
      :style="hoverOverlayStyle"
    >
      <!-- Show "+" icon only for empty cards -->
      <div 
        v-if="!memoriesStore.getMemoryAt({ 
          row: Math.floor(hoveredCard.row / scaleFactor), 
          col: Math.floor(hoveredCard.col / scaleFactor) 
        })" 
        class="hover-icon"
      >
        +
      </div>
    </div>

    <!-- Custom Zoom Controls -->
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
  </div>
</template>

<style scoped>
.alternative-mosaic-container {
  width: 100%;
  height: calc(100vh - 150px);
  position: relative;
  background: var(--color-background);
}

.loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-background-secondary);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.openseadragon-viewer {
  width: 100%;
  height: 100%;
}

/* Override OpenSeadragon default styles */
:deep(.openseadragon-canvas) {
  outline: none;
}

:deep(.navigator) {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* Touch Feedback Animation */
.touch-feedback {
  position: absolute;
  pointer-events: none;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  z-index: 49;
  animation: touchPulse 0.8s ease-out forwards;
}

@keyframes touchPulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
    box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.3);
  }
  100% {
    transform: scale(1);
    opacity: 0;
    box-shadow: 0 0 40px 15px rgba(255, 255, 255, 0);
  }
}

/* Hover Overlay */
.hover-overlay {
  position: absolute;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.1s ease;
}

.hover-icon {
  font-size: 2rem; /* Smaller to fit better when zoomed out */
  font-weight: 200; /* Lighter weight */
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  line-height: 0.8; /* Tighter line height for better centering */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.35rem; /* Fine-tune vertical centering */
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

@media (max-width: 768px) {
  .alternative-mosaic-container {
    height: calc(100vh - 120px);
  }
  
  .zoom-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
}
</style>


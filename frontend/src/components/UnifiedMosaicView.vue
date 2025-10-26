<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import OpenSeadragon from 'openseadragon'
import { useMosaicStore } from '@/stores/mosaic'
import { useMemoriesStore } from '@/stores/memories'
import { useUIStore } from '@/stores/ui'
import { resolveAllMemoryPositions, type MosaicMode, MODE_SCALE_FACTORS } from '@/utils/positionResolver'

const props = withDefaults(
  defineProps<{
    referencePhotoUrl: string
    targetCards?: number
    usePregenerated?: boolean
    showHintOnEntry?: boolean
  }>(),
  {
    targetCards: 6000,
    usePregenerated: false,
    showHintOnEntry: false,
  },
)

const emit = defineEmits<{
  ready: []
}>()

const mosaicStore = useMosaicStore()
const memoriesStore = useMemoriesStore()
const uiStore = useUIStore()

// Mode state
const currentMode = ref<MosaicMode>('abstract')

// Refs
const containerRef = ref<HTMLElement | null>(null)
const viewerContainerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let viewer: OpenSeadragon.Viewer | null = null
let ctx: CanvasRenderingContext2D | null = null

// Canvas dimensions
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Card size in pixels
const CARD_SIZE = 100

// Mobile detection and scaling
const isMobile = () => window.innerWidth <= 768

// Detect device capabilities once on mount (cached)
const deviceCapabilities = ref({ scaleFactor: 1, gridScale: 1 })

const detectDeviceCapabilities = () => {
  const mobile = isMobile()
  if (!mobile) {
    deviceCapabilities.value = { scaleFactor: 1, gridScale: 1 }
    return
  }
  
  // Try to detect low-end devices
  const nav = navigator as any // Type assertion for experimental APIs
  const isLowEnd = 
    // Low memory (< 4GB) - using experimental API
    (nav.deviceMemory && nav.deviceMemory < 4) ||
    // Slow CPU (< 4 cores)
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
    // Check for older devices via user agent (basic detection)
    /Android [4-6]|iPhone OS [7-9]_/i.test(navigator.userAgent)
  
  if (isLowEnd) {
    console.log('📱 Low-end device detected, applying aggressive optimization')
    deviceCapabilities.value = { scaleFactor: 0.25, gridScale: 0.6 } // Even more aggressive
  } else {
    console.log('📱 Mobile device detected, applying standard mobile optimization')
    deviceCapabilities.value = { scaleFactor: 0.4, gridScale: 0.8 }
  }
}

const getCanvasScaleFactor = () => {
  return deviceCapabilities.value.scaleFactor
}

// Retry handler
const handleRetry = () => {
  loadError.value = null
  window.location.reload()
}

// State
const isInitializing = ref(true)
const imagesLoaded = ref(false)
const isInitialLoadComplete = ref(false)
const loadError = ref<string | null>(null)
const memoryImages = new Map<string, HTMLImageElement>()
const referenceImage = ref<HTMLImageElement | null>(null)
const heartImage = ref<HTMLImageElement | null>(null)

// Canvas caching for fast mode switching
const canvasCache = new Map<MosaicMode, string>() // Cache canvas data URLs
const isSwitchingMode = ref(false)

// Hover state
const hoveredCard = ref<{ row: number; col: number } | null>(null)
const hoverOverlayStyle = ref<any>(null)
const showMemoryHint = ref(false)

// Calculate icon size based on card size
const hoverIconSize = computed(() => {
  if (!hoverOverlayStyle.value) return '2rem'
  
  // Get card width from style (e.g., "50px" -> 50)
  const width = parseFloat(hoverOverlayStyle.value.width)
  
  // Scale icon: 2rem for 100px cards, minimum 1rem, maximum 3rem
  const fontSize = Math.max(1, Math.min(3, (width / 100) * 2))
  return `${fontSize}rem`
})

// Touch feedback animation
const touchFeedback = ref<{ row: number; col: number; style: any } | null>(null)
let touchFeedbackTimeout: number | null = null

// Zoom hint state
const showZoomHint = ref(false)
let inactivityTimeout: number | null = null

// Zoom tracking (to prevent clicks during pinch-to-zoom)
const isZooming = ref(false)
let zoomTimeout: number | null = null
const isPinching = ref(false)
let pinchCooldown = false


// Loading state
const isLoading = computed(() => 
  mosaicStore.isLoading || memoriesStore.isLoading || !imagesLoaded.value
)

// Track when hint was shown to prevent immediate hiding
const hintShownAt = ref<number | null>(null)

// Watch for showHintOnEntry prop - simple and reliable!
watch(() => props.showHintOnEntry, (shouldShow) => {
  if (shouldShow && !showZoomHint.value) {
    showZoomHint.value = true
    hintShownAt.value = Date.now()
    startInactivityTimer()
  }
})

// Computed grid dimensions based on mode and device capabilities
const gridWidth = computed(() => {
  const modeScaleFactor = MODE_SCALE_FACTORS[currentMode.value]
  const deviceGridScale = deviceCapabilities.value.gridScale
  return Math.floor(mosaicStore.gridWidth * modeScaleFactor * deviceGridScale)
})

const gridHeight = computed(() => {
  const modeScaleFactor = MODE_SCALE_FACTORS[currentMode.value]
  const deviceGridScale = deviceCapabilities.value.gridScale
  return Math.floor(mosaicStore.gridHeight * modeScaleFactor * deviceGridScale)
})

// Resolved memory positions for current mode
const resolvedPositions = computed(() => {
  return resolveAllMemoryPositions(
    memoriesStore.memories,
    currentMode.value,
    mosaicStore,
    memoriesStore,
  )
})

// Get memory at a given position in current mode
const getMemoryAtPosition = (row: number, col: number) => {
  // Find memory whose resolved position matches this position
  for (const memory of memoriesStore.memories) {
    const originalKey = `${memory.gridPosition.row}-${memory.gridPosition.col}`
    const resolved = resolvedPositions.value.get(originalKey)
    
    if (resolved && resolved.row === row && resolved.col === col) {
      return memory
    }
  }
  return null
}

// Toggle mode with animation and caching
const toggleMode = async () => {
  const newMode: MosaicMode = currentMode.value === 'abstract' ? 'realistic' : 'abstract'
  
  console.log(`🔄 Switching to ${newMode} mode...`)
  
  // Set switching state for button animation
  isSwitchingMode.value = true
  
  // Switch mode (button animation will play)
  currentMode.value = newMode
  
  // Check if we have cached canvas for this mode
  const cached = canvasCache.get(newMode)
  
  if (cached && viewer) {
    // Use cached version (instant!)
    console.log(`✅ Using cached ${newMode} canvas`)
    
    viewer.open({
      type: 'image',
      url: cached,
      buildPyramid: false,
    })
    
    // Update canvas dimensions for hover detection
    updateCanvasDimensions()
    
    // Reset switching state after button animation
    setTimeout(() => {
      isSwitchingMode.value = false
    }, 300)
  } else {
    // No cache, need to redraw
    console.log(`🎨 Drawing new ${newMode} canvas...`)
    await initCanvas()
    
    // Reset switching state
    setTimeout(() => {
      isSwitchingMode.value = false
    }, 300)
  }
}

// Update canvas dimensions (for cached mode switching)
const updateCanvasDimensions = () => {
  const scaleFactor = getCanvasScaleFactor()
  canvasWidth.value = Math.floor(gridWidth.value * CARD_SIZE * scaleFactor)
  canvasHeight.value = Math.floor(gridHeight.value * CARD_SIZE * scaleFactor)
}

// Initialize mosaic configuration
onMounted(async () => {
  try {
    // Detect device capabilities first (before any calculations)
    detectDeviceCapabilities()
    
    // Load memories first
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
      // Analyze photo
      const memoryCount = memoriesStore.memories.length
      const minCards = Math.max(props.targetCards, memoryCount * 1.5)
      
      console.log(`📊 Memories: ${memoryCount}, Using: ${minCards} cards`)
      
      await mosaicStore.initializeConfig(props.referencePhotoUrl, minCards)
    }

    // Wait for DOM update
    await nextTick()
    
    // Initialize canvas and OpenSeadragon
    await initCanvas()
  } catch (error) {
    console.error('❌ Error initializing unified mosaic:', error)
    mosaicStore.isLoading = false
    memoriesStore.isLoading = false
  }
})

// Load reference image
const loadReferenceImage = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      referenceImage.value = img
      console.log(`✅ Reference image loaded: ${img.width}x${img.height}`)
      resolve()
    }
    img.onerror = reject
    img.src = props.referencePhotoUrl
  })
}

// Load heart icon image
const loadHeartImage = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      heartImage.value = img
      console.log(`✅ Heart image loaded`)
      resolve()
    }
    img.onerror = () => {
      console.warn('⚠️ Heart image failed to load')
      resolve() // Don't fail if heart doesn't load
    }
    img.src = '/heart.svg'
  })
}

// Load all memory images
const loadMemoryImages = async () => {
  const memories = memoriesStore.memories
  memoryImages.clear()
  
  const loadPromises: Promise<void>[] = []
  
  for (const memory of memories) {
    // Use gridPhotoUrl for mosaic, fallback to photoUrl
    const imageUrl = memory.gridPhotoUrl || memory.photoUrl
    
    if (imageUrl) {
      const promise = new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const key = `${memory.gridPosition.row}-${memory.gridPosition.col}`
          memoryImages.set(key, img)
          resolve()
        }
        img.onerror = () => resolve()
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
  try {
    if (!canvasRef.value) {
      console.warn('⚠️ Canvas ref not available')
      return
    }

    console.log(`🎨 Initializing canvas for ${currentMode.value} mode...`)

    // Load reference image first
    if (!referenceImage.value) {
      await loadReferenceImage()
    }
    
    if (!referenceImage.value) {
      console.error('❌ Reference image failed to load')
      loadError.value = 'Kon afbeelding niet laden. Probeer de pagina te verversen.'
      return
    }
    
    // Load heart image if not loaded
    if (!heartImage.value) {
      await loadHeartImage()
    }

    // Set canvas dimensions based on current mode grid
    const scaleFactor = getCanvasScaleFactor()
    const targetWidth = Math.floor(gridWidth.value * CARD_SIZE * scaleFactor)
    const targetHeight = Math.floor(gridHeight.value * CARD_SIZE * scaleFactor)
    
    // Check if dimensions are reasonable for this device
    const maxDimension = 8192 // Safe maximum for most devices
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      console.log(`📐 Optimizing canvas size from ${targetWidth}x${targetHeight} to fit ${maxDimension}px limit`)
      const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight)
      canvasWidth.value = Math.floor(targetWidth * scale)
      canvasHeight.value = Math.floor(targetHeight * scale)
    } else {
      canvasWidth.value = targetWidth
      canvasHeight.value = targetHeight
    }

    const canvas = canvasRef.value
    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value

    ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })
    if (!ctx) {
      console.error('❌ Failed to get canvas context')
      loadError.value = 'Apparaat ondersteunt helaas geen grafische weergave.'
      return
    }

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    console.log(`✅ Canvas initialized: ${canvasWidth.value}x${canvasHeight.value}px (${gridWidth.value}x${gridHeight.value} cards)`)

    // Load memory images
    await loadMemoryImages()
    imagesLoaded.value = true

    // Draw mosaic
    drawMosaic()

    // Initialize or update OpenSeadragon
    if (!viewer) {
      await initOpenSeadragon()
    } else {
      await updateOpenSeadragonImage()
    }
  } catch (error) {
    console.error('❌ Error initializing canvas:', error)
    loadError.value = 'Het laden van het mozaïek is mislukt. Dit apparaat ondersteunt mogelijk de grafische weergave niet.'
  }
}

// Draw a heart icon on the canvas
const drawHeartIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  color: string
) => {
  if (!heartImage.value) return
  
  context.save()
  
  // Add shadow
  context.shadowColor = 'rgba(0, 0, 0, 0.3)'
  context.shadowBlur = size * 0.1
  context.shadowOffsetY = size * 0.05
  
  // If white color is requested, invert the image
  if (color === 'white') {
    context.filter = 'brightness(0) invert(1)'
  }
  
  // Draw heart image centered
  const drawSize = size * 2 // Make it a bit larger for visibility
  context.drawImage(
    heartImage.value,
    centerX - drawSize / 2,
    centerY - drawSize / 2,
    drawSize,
    drawSize
  )
  
  context.restore()
}

// Draw the entire mosaic
const drawMosaic = () => {
  if (!ctx || !referenceImage.value) return

  console.log(`🎨 Drawing ${currentMode.value} mosaic...`)

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  if (currentMode.value === 'realistic') {
    // Realistic mode: Draw reference image as base
    ctx.drawImage(referenceImage.value, 0, 0, canvasWidth.value, canvasHeight.value)

    // Draw overlays for each card
    for (let row = 0; row < gridHeight.value; row++) {
      for (let col = 0; col < gridWidth.value; col++) {
        drawRealisticCard(row, col)
      }
    }
  } else {
    // Abstract mode: Draw cards with background colors
    for (let row = 0; row < gridHeight.value; row++) {
      for (let col = 0; col < gridWidth.value; col++) {
        drawAbstractCard(row, col)
      }
    }
  }

  console.log('✅ Mosaic drawn!')
  
  // Cache the canvas for this mode
  try {
    const dataUrl = canvasRef.value?.toDataURL()
    if (dataUrl) {
      canvasCache.set(currentMode.value, dataUrl)
      console.log(`💾 Cached ${currentMode.value} canvas`)
    }
  } catch (error) {
    console.warn('⚠️ Could not cache canvas:', error)
  }
}

// Draw card in realistic mode (blended with grandpa image)
const drawRealisticCard = (row: number, col: number) => {
  if (!ctx || !referenceImage.value) return

  const scaleFactor = getCanvasScaleFactor()
  const x = col * CARD_SIZE * scaleFactor
  const y = row * CARD_SIZE * scaleFactor
  const cardSize = CARD_SIZE * scaleFactor
  
  const memory = getMemoryAtPosition(row, col)
  
  // Get color data from ORIGINAL grid position
  const originalRow = Math.floor(row / MODE_SCALE_FACTORS.realistic)
  const originalCol = Math.floor(col / MODE_SCALE_FACTORS.realistic)
  const colorData = mosaicStore.getCardColor(originalRow, originalCol)
  const alpha = colorData?.alpha ?? 1

  // Skip transparent areas
  if (alpha < 0.1) return

  if (memory) {
    // Filled card: check if has photo or just quote
    const originalKey = `${memory.gridPosition.row}-${memory.gridPosition.col}`
    const img = memoryImages.get(originalKey)
    
    if (img) {
      // Has photo: blend uploaded photo with grandpa's image
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.85
      ctx.drawImage(img, x, y, cardSize, cardSize)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.restore()
    } else {
      // No photo (quote-only): draw heart icon
      ctx.save()
      ctx.globalAlpha = 0.4
      drawHeartIcon(ctx, x + cardSize / 2, y + cardSize / 2, cardSize * 0.3, 'white')
      ctx.restore()
    }
  } else {
    // Empty card: semi-transparent gray overlay
    ctx.fillStyle = 'rgba(128, 128, 128, 0.6)'
    ctx.fillRect(x, y, cardSize, cardSize)
  }
}

// Draw card in abstract mode (color background with photo)
const drawAbstractCard = (row: number, col: number) => {
  if (!ctx) return

  const scaleFactor = getCanvasScaleFactor()
  const x = col * CARD_SIZE * scaleFactor
  const y = row * CARD_SIZE * scaleFactor
  const cardSize = CARD_SIZE * scaleFactor
  
  const memory = getMemoryAtPosition(row, col)
  const colorData = mosaicStore.getCardColor(row, col)
  
  if (!colorData) return

  const alpha = colorData.alpha ?? 1

  // Skip transparent cards
  if (alpha < 0.1) return

  // Draw background color
  ctx.fillStyle = colorData.backgroundColor
  ctx.fillRect(x, y, cardSize, cardSize)

  if (memory) {
    // Check if has photo or just quote
    const originalKey = `${memory.gridPosition.row}-${memory.gridPosition.col}`
    const img = memoryImages.get(originalKey)
    
    if (img) {
      // Has photo: draw memory photo on top (blended)
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.85
      ctx.drawImage(img, x, y, cardSize, cardSize)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.restore()
    } else {
      // No photo (quote-only): draw heart icon in center
      ctx.save()
      drawHeartIcon(ctx, x + cardSize / 2, y + cardSize / 2, cardSize * 0.3, 'white')
      ctx.restore()
    }
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
    let canvasDataUrl
    try {
      canvasDataUrl = canvasRef.value.toDataURL()
    } catch (corsError) {
      console.error('❌ CORS error when exporting canvas:', corsError)
      canvasDataUrl = props.referencePhotoUrl
    }

    const tileSources = {
      type: 'image',
      url: canvasDataUrl,
      buildPyramid: false,
    }

    // Check if mobile
    const isMobileDevice = window.innerWidth <= 768
    
    viewer = OpenSeadragon({
      element: viewerContainerRef.value,
      tileSources: tileSources,
      prefixUrl: '//openseadragon.github.io/openseadragon/images/',
      showNavigationControl: false,
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
      // Desktop: start at minimum zoom, Mobile: let it fit viewport
      defaultZoomLevel: isMobileDevice ? 1 : 0.5,
      homeFillsViewer: false,
    })
    
    // Track panning and zooming
    let dragStartPos: any = null
    let hasDragged = false
    let previousZoom = viewer.viewport.getZoom()
    
    viewer.addHandler('canvas-press', (event: any) => {
      dragStartPos = event.position
      hasDragged = false
      uiStore.setIsPanning(false) // Reset on press
    })
    
    viewer.addHandler('canvas-drag', (event: any) => {
      if (dragStartPos) {
        const dx = Math.abs(event.position.x - dragStartPos.x)
        const dy = Math.abs(event.position.y - dragStartPos.y)
        // Only consider it panning if moved more than 5 pixels
        if (dx > 5 || dy > 5) {
          hasDragged = true
          uiStore.setIsPanning(true)
          resetInactivityTimer()
        }
      }
    })
    
    viewer.addHandler('canvas-drag-end', () => {
      dragStartPos = null
      // Only delay reset if we actually dragged
      if (hasDragged) {
        setTimeout(() => {
          uiStore.setIsPanning(false)
          hasDragged = false
        }, 100)
      } else {
        uiStore.setIsPanning(false)
        hasDragged = false
      }
    })
    
    viewer.addHandler('canvas-release', () => {
      // Immediate reset on release if no drag happened
      if (!hasDragged) {
        uiStore.setIsPanning(false)
      }
      dragStartPos = null
    })
    
    // Track zooming
    viewer.addHandler('zoom', () => {
      if (!viewer) return
      
      const currentZoom = viewer.viewport.getZoom()
      
      // Check if zoom level actually changed (not just an event trigger)
      if (Math.abs(currentZoom - previousZoom) > 0.01) {
        isZooming.value = true
        
        // Clear any existing timeout
        if (zoomTimeout) {
          clearTimeout(zoomTimeout)
        }
        
        // Reset isZooming after a longer delay (to handle staggered finger release)
        zoomTimeout = window.setTimeout(() => {
          isZooming.value = false
        }, 400) // Increased from 200ms to 400ms
      }
      
      previousZoom = currentZoom
      resetInactivityTimer()
    })
    
    // Add touch event listeners to detect pinch gestures
    if (viewer.canvas) {
      viewer.canvas.addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches.length > 1) {
          isPinching.value = true
          pinchCooldown = false
        }
      })
      
      viewer.canvas.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches.length > 1) {
          isPinching.value = true
        }
      })
      
      viewer.canvas.addEventListener('touchend', (e: TouchEvent) => {
        // If all fingers are lifted and we were pinching
        if (e.touches.length === 0 && isPinching.value) {
          // Set cooldown to prevent clicks right after pinch
          pinchCooldown = true
          setTimeout(() => {
            pinchCooldown = false
          }, 300)
          isPinching.value = false
        }
      })
    }

    // Click handler
    viewer.addHandler('canvas-click', handleCanvasClick)

    // Mouse tracker for hover
    const tracker = new OpenSeadragon.MouseTracker({
      element: viewer.canvas,
      moveHandler: handleMouseMove,
      leaveHandler: handleMouseLeave,
    })

    // Update hover on zoom/pan
    viewer.addHandler('animation', () => {
      if (hoveredCard.value && viewer) {
        const { row, col } = hoveredCard.value
        const scaleFactor = getCanvasScaleFactor()
        const scaledCardSize = CARD_SIZE * scaleFactor
        const cardTopLeft = viewer.viewport.imageToViewportCoordinates(
          new OpenSeadragon.Point(col * scaledCardSize, row * scaledCardSize)
        )
        const cardBottomRight = viewer.viewport.imageToViewportCoordinates(
          new OpenSeadragon.Point((col + 1) * scaledCardSize, (row + 1) * scaledCardSize)
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

    // Set initial zoom to minimum level after initialization (desktop only)
    viewer.addHandler('open', () => {
      if (viewer) {
        viewer.viewport.goHome(false) // false = no animation, instant
        viewer.viewport.zoomTo(isMobileDevice ? 1 : 0.5, undefined, true) // true = immediately
      }
    })

    console.log('✅ OpenSeadragon initialized!')
    isInitializing.value = false
  } catch (error) {
    console.error('❌ Error initializing OpenSeadragon:', error)
  }
}

// Show zoom hint temporarily (for subsequent appearances after inactivity)
const showZoomHintTemporarily = () => {
  showZoomHint.value = true
  setTimeout(() => {
    showZoomHint.value = false
  }, 5000) // Show for 5 seconds
}

// Hide hint and start inactivity timer (called on user interaction)
const resetInactivityTimer = () => {
  const now = Date.now()
  const timeSinceHintShown = hintShownAt.value ? now - hintShownAt.value : 999999
  
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
  }
  
  // Only hide hint if it's been visible for at least 1 second
  // (This prevents hiding from init events right after showing)
  if (showZoomHint.value && timeSinceHintShown >= 1000) {
    showZoomHint.value = false
  }
  
  // After 30 seconds of inactivity, show hint again temporarily
  inactivityTimeout = window.setTimeout(() => {
    showZoomHintTemporarily()
  }, 30000)
}

// Start inactivity timer without hiding hint (for initial hint)
const startInactivityTimer = () => {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
  }
  
  // Don't hide the hint, just start watching for inactivity
  inactivityTimeout = window.setTimeout(() => {
    showZoomHintTemporarily()
  }, 30000)
}

// Update OpenSeadragon image (when mode changes)
const updateOpenSeadragonImage = async () => {
  if (!viewer || !canvasRef.value) return

  console.log('🔄 Updating OpenSeadragon image...')

  try {
    const canvasDataUrl = canvasRef.value.toDataURL()
    
    // Update cache for current mode
    canvasCache.set(currentMode.value, canvasDataUrl)
    console.log(`💾 Updated cache for ${currentMode.value} mode`)

    viewer.open({
      type: 'image',
      url: canvasDataUrl,
      buildPyramid: false,
    })

    console.log('✅ OpenSeadragon image updated')
    
    // Emit ready event on first complete load
    if (!isInitialLoadComplete.value) {
      isInitialLoadComplete.value = true
      emit('ready')
    }
  } catch (error) {
    console.error('❌ Error updating OpenSeadragon image:', error)
  }
}

// Handle canvas click
const handleCanvasClick = (event: any) => {
  // Ignore clicks during panning, zooming, pinching, or during pinch cooldown
  if (!viewer || uiStore.isPanning || isZooming.value || isPinching.value || pinchCooldown) return

  const viewportPoint = viewer.viewport.pointFromPixel(event.position)
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint)
  
  const scaleFactor = getCanvasScaleFactor()
  const scaledCardSize = CARD_SIZE * scaleFactor
  const col = Math.floor(imagePoint.x / scaledCardSize)
  const row = Math.floor(imagePoint.y / scaledCardSize)

  // Check if within grid
  if (row < 0 || row >= gridHeight.value || col < 0 || col >= gridWidth.value) {
    return
  }

  // Check if clickable (not transparent)
  const originalRow = currentMode.value === 'realistic' 
    ? Math.floor(row / MODE_SCALE_FACTORS.realistic)
    : row
  const originalCol = currentMode.value === 'realistic'
    ? Math.floor(col / MODE_SCALE_FACTORS.realistic)
    : col
  const colorData = mosaicStore.getCardColor(originalRow, originalCol)
  const alpha = colorData?.alpha ?? 1
  if (alpha < 0.1) return

  const memory = getMemoryAtPosition(row, col)

  if (memory) {
    // Open memory modal with ORIGINAL position
    uiStore.openMemory(memory.gridPosition)
  } else {
    // Open submission form - need to determine original position
    // For now, use a proportional position in the original grid
    const originalPosition = {
      row: currentMode.value === 'realistic' 
        ? Math.floor(row / MODE_SCALE_FACTORS.realistic)
        : row,
      col: currentMode.value === 'realistic'
        ? Math.floor(col / MODE_SCALE_FACTORS.realistic)
        : col,
    }
    uiStore.selectCard(originalPosition)
    uiStore.openSubmissionForm()
  }
}

// Handle mouse move for hover
const handleMouseMove = (event: any) => {
  if (!viewer || !containerRef.value) return

  const viewportPoint = viewer.viewport.pointFromPixel(event.position)
  const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint)

  const scaleFactor = getCanvasScaleFactor()
  const scaledCardSize = CARD_SIZE * scaleFactor
  const col = Math.floor(imagePoint.x / scaledCardSize)
  const row = Math.floor(imagePoint.y / scaledCardSize)

  // Check bounds
  if (row < 0 || row >= gridHeight.value || col < 0 || col >= gridWidth.value) {
    hoveredCard.value = null
    hoverOverlayStyle.value = null
    showMemoryHint.value = false
    return
  }

  // Check if clickable
  const originalRow = currentMode.value === 'realistic'
    ? Math.floor(row / MODE_SCALE_FACTORS.realistic)
    : row
  const originalCol = currentMode.value === 'realistic'
    ? Math.floor(col / MODE_SCALE_FACTORS.realistic)
    : col
  const colorData = mosaicStore.getCardColor(originalRow, originalCol)
  const alpha = colorData?.alpha ?? 1
  if (alpha < 0.1) {
    hoveredCard.value = null
    hoverOverlayStyle.value = null
    showMemoryHint.value = false
    return
  }

  // Update hover
  if (hoveredCard.value?.row !== row || hoveredCard.value?.col !== col) {
    hoveredCard.value = { row, col }

    const cardTopLeft = viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point(col * scaledCardSize, row * scaledCardSize)
    )
    const cardBottomRight = viewer.viewport.imageToViewportCoordinates(
      new OpenSeadragon.Point((col + 1) * scaledCardSize, (row + 1) * scaledCardSize)
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

    // Show memory hint for filled cards
    const hasMemory = getMemoryAtPosition(row, col)
    showMemoryHint.value = !!hasMemory

    // Show touch feedback
    showTouchFeedback(row, col, topLeftPixel.x, topLeftPixel.y, width, height)
  }
}

// Show touch feedback
const showTouchFeedback = (row: number, col: number, x: number, y: number, width: number, height: number) => {
  if (touchFeedbackTimeout) {
    clearTimeout(touchFeedbackTimeout)
  }

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

  touchFeedbackTimeout = window.setTimeout(() => {
    touchFeedback.value = null
  }, 800)
}

// Handle mouse leave
const handleMouseLeave = () => {
  hoveredCard.value = null
  hoverOverlayStyle.value = null
  showMemoryHint.value = false
}

// Watch for memory updates
watch(() => memoriesStore.memories.length, () => {
  if (ctx && imagesLoaded.value && viewer && canvasRef.value) {
    console.log('🔄 Memories updated, reloading images and redrawing...')
    
    // Clear cache since memories changed
    canvasCache.clear()
    console.log('🗑️ Cache cleared due to memory update')
    
    loadMemoryImages().then(() => {
      drawMosaic()
      updateOpenSeadragonImage()
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
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
  }
})
</script>

<template>
  <div class="unified-mosaic-container" ref="containerRef">
    <!-- Mode Toggle -->
    <div v-if="!isLoading" class="mode-toggle">
      <button 
        :class="['mode-btn', { active: currentMode === 'abstract' }]"
        @click="currentMode = 'abstract'; initCanvas()"
        title="Abstract mosaic with color blocks"
      >
        Abstract
      </button>
      <button 
        :class="['mode-btn', { active: currentMode === 'realistic' }]"
        @click="currentMode = 'realistic'; initCanvas()"
        title="Realistic view blended with photo"
      >
        Realistic
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p v-if="mosaicStore.isLoading">🎨 Loading mosaic configuration...</p>
      <p v-else-if="!imagesLoaded">📸 Loading memories...</p>
      <p v-else>📸 Loading memories...</p>
    </div>

    <!-- Error state -->
    <div v-if="loadError" class="load-error">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ loadError }}</p>
      <button @click="handleRetry" class="retry-btn">
        Opnieuw proberen
      </button>
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

    <!-- Touch Feedback Animation -->
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
        v-if="!getMemoryAtPosition(hoveredCard.row, hoveredCard.col)" 
        class="hover-icon"
        :style="{ fontSize: hoverIconSize }"
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

    <!-- Zoom Hint -->
    <Transition name="fade">
      <div v-if="showZoomHint" class="zoom-hint">
        <span class="desktop-hint">Scroll om te zoomen, sleep om te verplaatsen</span>
        <span class="mobile-hint">Zoom in of sleep om te verplaatsen</span>
      </div>
    </Transition>

    <!-- Memory Hover Hint -->
    <Transition name="fade">
      <div v-if="showMemoryHint" class="zoom-hint">
        Klik om herinnering te bekijken
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.unified-mosaic-container {
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--color-background);
  overflow: hidden;
  z-index: 1;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text-secondary);
  z-index: 10;
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

/* Error state */
.load-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  max-width: 400px;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-text-primary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.openseadragon-viewer {
  width: 100%;
  height: 100%;
  background-color: var(--color-background);
}

:deep(.openseadragon-canvas) {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

:deep(.openseadragon-canvas:active) {
  cursor: grabbing;
}

/* Mode Toggle */
.mode-toggle {
  position: fixed;
  top: 6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998; /* Ensure controls are above header (z-index: 10) but below modals */
  display: flex;
  gap: 0;
  background: var(--color-background-secondary);
  border: 2px solid var(--color-border);
  border-radius: 50px;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.mode-btn {
  padding: 0.625rem 1.5rem;
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.mode-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: var(--color-text-primary);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease-out, height 0.3s ease-out;
  z-index: -1;
}

.mode-btn:hover {
  color: var(--color-text-primary);
  transform: scale(1.05);
}

.mode-btn.active {
  background: var(--color-text-primary);
  color: var(--color-background);
  transform: scale(1);
}

.mode-btn.active::before {
  width: 200%;
  height: 200%;
}

/* Pulse animation when switching */
@keyframes modePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.mode-btn.active {
  animation: modePulse 0.3s ease-out;
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
  /* font-size is set dynamically via :style binding */
  font-weight: 200;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Zoom Controls */
.zoom-controls {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9998; /* Ensure controls are above header (z-index: 10) but below modals */
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

/* Zoom Hint */
.zoom-hint {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-text-primary);
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 0.95rem;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  text-align: center;
}

.zoom-hint .mobile-hint {
  display: none;
}

.zoom-hint .desktop-hint {
  display: inline;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .unified-mosaic-container {
    height: 100vh;
  }
  
  .mode-toggle {
    top: 7.5rem;
  }
  
  .mode-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .zoom-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
  
  .zoom-hint {
    bottom: 1rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.85rem;
  }
  
  .zoom-hint .desktop-hint {
    display: none;
  }
  
  .zoom-hint .mobile-hint {
    display: inline;
  }
}
</style>


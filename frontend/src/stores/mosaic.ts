import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MosaicConfig, CardColorData } from '@/types'

/**
 * Mosaic configuration store
 * Manages the photomosaic grid settings and reference photo data
 */
export const useMosaicStore = defineStore('mosaic', () => {
    // State
    const config = ref<MosaicConfig | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const gridWidth = computed(() => config.value?.gridWidth ?? 0)
    const gridHeight = computed(() => config.value?.gridHeight ?? 0)
    const totalCards = computed(() => gridWidth.value * gridHeight.value)
    const cardColors = computed(() => config.value?.cardColors ?? [])
    const referencePhotoUrl = computed(() => config.value?.referencePhotoUrl ?? '')

    /**
     * Get color data for a specific grid position
     */
    const getCardColor = (row: number, col: number): CardColorData | null => {
        return (
            cardColors.value.find((c) => c.position.row === row && c.position.col === col) ?? null
        )
    }

    /**
     * Initialize mosaic configuration
     * Analyzes the reference photo and extracts color data for each grid position
     */
    const initializeConfig = async (referencePhotoUrl: string, targetCards: number = 1200) => {
        isLoading.value = true
        error.value = null

        try {
            // Dynamic import to avoid loading utility in SSR
            const { calculateGridDimensions, analyzeReferencePhoto } = await import(
                '@/utils/photoAnalyzer'
            )

            console.log('🎨 Initializing mosaic from reference photo:', referencePhotoUrl)

            // Calculate optimal grid dimensions based on image aspect ratio
            const { gridWidth, gridHeight } = await calculateGridDimensions(
                referencePhotoUrl,
                targetCards,
            )

            // Analyze the photo and extract color data for each grid cell
            const cardColors = await analyzeReferencePhoto(referencePhotoUrl, gridWidth, gridHeight)

            // Store configuration
            config.value = {
                referencePhotoUrl,
                gridWidth,
                gridHeight,
                cardColors,
                lastUpdated: new Date(),
            }

            console.log('✅ Mosaic initialized successfully')
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to initialize mosaic'
            console.error('Error initializing mosaic:', err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Set card colors after photo analysis
     */
    const setCardColors = (colors: CardColorData[]) => {
        if (config.value) {
            config.value.cardColors = colors
        }
    }

    return {
        // State
        config,
        isLoading,
        error,

        // Getters
        gridWidth,
        gridHeight,
        totalCards,
        cardColors,
        referencePhotoUrl,

        // Actions
        getCardColor,
        initializeConfig,
        setCardColors,
    }
})


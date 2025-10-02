import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GridPosition } from '@/types'

/**
 * UI state store
 * Manages zoom level, selected cards, modals, etc.
 */
export const useUIStore = defineStore('ui', () => {
    // State
    const zoomLevel = ref(1) // 1 = 100%
    const selectedCardPosition = ref<GridPosition | null>(null)
    const isSubmissionFormOpen = ref(false)
    const isLoading = ref(false)

    // Memory modal state
    const openMemoryPosition = ref<GridPosition | null>(null) // Which memory is open in the modal
    const isMemoryFlipped = ref(false) // Is the card flipped to show the back?

    // Panning state (set by Panzoom)
    const isPanning = ref(false)

    // Actions
    const setZoomLevel = (level: number) => {
        zoomLevel.value = Math.max(0.5, Math.min(5, level)) // Clamp between 0.5x and 5x
    }

    const zoomIn = () => {
        setZoomLevel(zoomLevel.value + 0.25)
    }

    const zoomOut = () => {
        setZoomLevel(zoomLevel.value - 0.25)
    }

    const resetZoom = () => {
        zoomLevel.value = 1
    }

    const selectCard = (position: GridPosition | null) => {
        selectedCardPosition.value = position
    }

    const openSubmissionForm = () => {
        isSubmissionFormOpen.value = true
    }

    const closeSubmissionForm = () => {
        isSubmissionFormOpen.value = false
    }

    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    // Memory modal actions
    const openMemory = (position: GridPosition) => {
        openMemoryPosition.value = position
        isMemoryFlipped.value = false // Reset to front when opening
    }

    const closeMemory = () => {
        openMemoryPosition.value = null
        isMemoryFlipped.value = false
    }

    const flipMemory = () => {
        isMemoryFlipped.value = !isMemoryFlipped.value
    }

    const navigateToMemory = (position: GridPosition) => {
        openMemoryPosition.value = position
        isMemoryFlipped.value = false // Reset to front when navigating
    }

    // Panning actions
    const setIsPanning = (panning: boolean) => {
        isPanning.value = panning
    }

    return {
        // State
        zoomLevel,
        selectedCardPosition,
        isSubmissionFormOpen,
        isLoading,
        openMemoryPosition,
        isMemoryFlipped,
        isPanning,

        // Actions
        setZoomLevel,
        zoomIn,
        zoomOut,
        resetZoom,
        selectCard,
        openSubmissionForm,
        closeSubmissionForm,
        setLoading,
        openMemory,
        closeMemory,
        flipMemory,
        navigateToMemory,
        setIsPanning,
    }
})


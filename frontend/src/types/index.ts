// Type definitions for Opa Harry's Herinneringen

/**
 * Additional content types for memories
 * Every memory has a photo, plus optional additional content
 */
export type MemoryType = 'quote' | 'audio' | 'video'

/**
 * Position of a card in the grid
 */
export interface GridPosition {
    row: number
    col: number
}

/**
 * Color data extracted from reference photo for a specific grid position
 */
export interface CardColorData {
    position: GridPosition
    backgroundColor: string // RGB hex color
    brightness: number // 0-255, luminance value
    alpha?: number // 0-1, transparency (0 = fully transparent, 1 = fully opaque)
}

/**
 * Configuration for the mosaic
 */
export interface MosaicConfig {
    referencePhotoUrl: string
    gridWidth: number // number of cards horizontally
    gridHeight: number // number of cards vertically
    cardColors: CardColorData[]
    lastUpdated: Date
}

/**
 * A memory submitted by a family member
 * Every memory has a photo (displayed in the mosaic card)
 * Plus optional additional content (quote, audio, or video)
 */
export interface Memory {
    id: string
    type?: MemoryType // Optional - can be just a photo
    gridPosition: GridPosition
    photoUrl: string // Required - the photo displayed in the mosaic card
    typeInput?: string // Optional - quote text, audio URL, or video URL
    submitterName?: string // Optional - who submitted this memory
    timestamp: Date

    // Metadata for algorithmic placement (future)
    averageColor?: string // RGB hex color of uploaded photo
    brightness?: number // 0-255
}

/**
 * Memory submission form data
 */
export interface MemorySubmission {
    type?: MemoryType // Optional - can submit just a photo
    photoFile: File // Required - the photo for the mosaic card
    typeInputFile?: File // For 'audio' or 'video' types - the audio/video file
    typeInputText?: string // For 'quote' type - the quote text
    submitterName?: string // Optional
}

/**
 * UI state for zoom and interactions
 */
export interface UIState {
    zoomLevel: number // 1 = 100%, 2 = 200%, etc.
    selectedCardPosition: GridPosition | null
    isSubmissionFormOpen: boolean
    isLoading: boolean
}

/**
 * Card data combining configuration and memory
 */
export interface CardData {
    position: GridPosition
    backgroundColor: string
    brightness: number
    alpha?: number // 0-1, transparency
    memory: Memory | null // null if empty
    isEmpty: boolean
}


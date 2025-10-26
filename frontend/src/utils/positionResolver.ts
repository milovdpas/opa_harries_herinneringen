// Position resolution utilities for mosaic modes
import type { GridPosition } from '@/types'
import { useMosaicStore } from '@/stores/mosaic'
import { useMemoriesStore } from '@/stores/memories'

// Infer store types
type MosaicStore = ReturnType<typeof useMosaicStore>
type MemoriesStore = ReturnType<typeof useMemoriesStore>

export type MosaicMode = 'abstract' | 'realistic'

// Scale factors for each mode
export const MODE_SCALE_FACTORS = {
    abstract: 1, // Original grid (89x67)
    realistic: 0.5, // Half grid (44x33)
} as const

/**
 * Resolve a memory's position based on the current mosaic mode
 * In abstract mode: Use original position
 * In realistic mode: Scale down and find valid position
 */
export function resolveMemoryPosition(
    originalPosition: GridPosition,
    mode: MosaicMode,
    mosaicStore: MosaicStore,
    memoriesStore: MemoriesStore,
): GridPosition {
    // Abstract mode: use original position
    if (mode === 'abstract') {
        return originalPosition
    }

    // Realistic mode: scale down
    const scaleFactor = MODE_SCALE_FACTORS.realistic
    const scaledPosition: GridPosition = {
        row: Math.floor(originalPosition.row * scaleFactor),
        col: Math.floor(originalPosition.col * scaleFactor),
    }

    // Check if scaled position is valid
    if (isValidPosition(scaledPosition, mode, mosaicStore, memoriesStore)) {
        return scaledPosition
    }

    // Fallback: find nearest valid position
    const nearestPosition = findNearestValidPosition(
        scaledPosition,
        mode,
        mosaicStore,
        memoriesStore,
    )

    return nearestPosition || scaledPosition // Return scaled if no valid found (shouldn't happen)
}

/**
 * Check if a position is valid (within bounds, not transparent, not already filled)
 */
function isValidPosition(
    position: GridPosition,
    mode: MosaicMode,
    mosaicStore: MosaicStore,
    memoriesStore: MemoriesStore,
): boolean {
    const { row, col } = position

    // Check bounds
    if (row < 0 || row >= mosaicStore.gridHeight || col < 0 || col >= mosaicStore.gridWidth) {
        return false
    }

    // Check if transparent (outside face)
    const colorData = mosaicStore.getCardColor(row, col)
    const alpha = colorData?.alpha ?? 1
    if (alpha < 0.1) {
        return false
    }

    // Check if already filled (by another memory)
    if (memoriesStore.hasMemoryAt(position)) {
        return false
    }

    return true
}

/**
 * Find the nearest valid position using spiral search
 */
function findNearestValidPosition(
    startPosition: GridPosition,
    mode: MosaicMode,
    mosaicStore: MosaicStore,
    memoriesStore: MemoriesStore,
): GridPosition | null {
    const maxRadius = Math.max(mosaicStore.gridWidth, mosaicStore.gridHeight)

    // Spiral search outward from start position
    for (let radius = 1; radius <= maxRadius; radius++) {
        const candidates = getSpiralPositions(startPosition, radius)

        for (const candidate of candidates) {
            if (isValidPosition(candidate, mode, mosaicStore, memoriesStore)) {
                return candidate
            }
        }
    }

    return null
}

/**
 * Get positions in a spiral pattern at a given radius
 */
function getSpiralPositions(center: GridPosition, radius: number): GridPosition[] {
    const positions: GridPosition[] = []

    // Top and bottom rows
    for (let col = center.col - radius; col <= center.col + radius; col++) {
        positions.push({ row: center.row - radius, col })
        positions.push({ row: center.row + radius, col })
    }

    // Left and right columns (excluding corners already added)
    for (let row = center.row - radius + 1; row < center.row + radius; row++) {
        positions.push({ row, col: center.col - radius })
        positions.push({ row, col: center.col + radius })
    }

    return positions
}

/**
 * Get all resolved positions for all memories in a given mode
 * Returns a map of original position to resolved position
 */
export function resolveAllMemoryPositions(
    memories: Array<{ gridPosition: GridPosition }>,
    mode: MosaicMode,
    mosaicStore: MosaicStore,
    memoriesStore: MemoriesStore,
): Map<string, GridPosition> {
    const resolutionMap = new Map<string, GridPosition>()
    const usedPositions = new Set<string>()

    // Create a temporary memories store to track used positions during resolution
    const tempUsedPositions = new Set<string>()

    for (const memory of memories) {
        const originalKey = `${memory.gridPosition.row}-${memory.gridPosition.col}`

        if (mode === 'abstract') {
            // Abstract mode: use original positions
            resolutionMap.set(originalKey, memory.gridPosition)
        } else {
            // Realistic mode: resolve with collision detection
            const resolved = resolvePositionWithCollisionCheck(
                memory.gridPosition,
                mode,
                mosaicStore,
                tempUsedPositions,
            )
            resolutionMap.set(originalKey, resolved)
            tempUsedPositions.add(`${resolved.row}-${resolved.col}`)
        }
    }

    return resolutionMap
}

/**
 * Resolve position with collision checking against already-resolved positions
 */
function resolvePositionWithCollisionCheck(
    originalPosition: GridPosition,
    mode: MosaicMode,
    mosaicStore: MosaicStore,
    usedPositions: Set<string>,
): GridPosition {
    const scaleFactor = MODE_SCALE_FACTORS.realistic
    const scaledPosition: GridPosition = {
        row: Math.floor(originalPosition.row * scaleFactor),
        col: Math.floor(originalPosition.col * scaleFactor),
    }

    // Check if scaled position is valid and not used
    const scaledKey = `${scaledPosition.row}-${scaledPosition.col}`
    if (
        isPositionValidForResolution(scaledPosition, mosaicStore, usedPositions) &&
        !usedPositions.has(scaledKey)
    ) {
        return scaledPosition
    }

    // Find nearest valid unused position
    const nearest = findNearestValidUnusedPosition(scaledPosition, mosaicStore, usedPositions)
    return nearest || scaledPosition
}

/**
 * Check if position is valid for resolution (within bounds, not transparent)
 */
function isPositionValidForResolution(
    position: GridPosition,
    mosaicStore: MosaicStore,
    usedPositions: Set<string>,
): boolean {
    const { row, col } = position

    // Check bounds
    if (row < 0 || row >= mosaicStore.gridHeight || col < 0 || col >= mosaicStore.gridWidth) {
        return false
    }

    // Check if transparent
    const colorData = mosaicStore.getCardColor(row, col)
    const alpha = colorData?.alpha ?? 1
    if (alpha < 0.1) {
        return false
    }

    // Check if already used in this resolution batch
    const posKey = `${row}-${col}`
    if (usedPositions.has(posKey)) {
        return false
    }

    return true
}

/**
 * Find nearest valid unused position
 */
function findNearestValidUnusedPosition(
    startPosition: GridPosition,
    mosaicStore: MosaicStore,
    usedPositions: Set<string>,
): GridPosition | null {
    const maxRadius = Math.max(mosaicStore.gridWidth, mosaicStore.gridHeight)

    for (let radius = 1; radius <= maxRadius; radius++) {
        const candidates = getSpiralPositions(startPosition, radius)

        for (const candidate of candidates) {
            if (isPositionValidForResolution(candidate, mosaicStore, usedPositions)) {
                return candidate
            }
        }
    }

    return null
}


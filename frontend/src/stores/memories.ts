import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { Memory, GridPosition } from '@/types'
import { subscribeToMemories, saveMemory } from '@/services/firestore'
import { useMosaicStore } from './mosaic'

/**
 * Memories store
 * Manages all uploaded family memories
 */
export const useMemoriesStore = defineStore('memories', () => {
    // State
    const memories = ref<Memory[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Real-time subscription
    let unsubscribe: (() => void) | null = null

    // Getters
    const totalMemories = computed(() => memories.value.length)

    const memoriesByPosition = computed(() => {
        const map = new Map<string, Memory>()
        memories.value.forEach((memory) => {
            const key = `${memory.gridPosition.row}-${memory.gridPosition.col}`
            map.set(key, memory)
        })
        return map
    })

    /**
     * Get memory at a specific grid position
     */
    const getMemoryAt = (position: GridPosition): Memory | null => {
        const key = `${position.row}-${position.col}`
        return memoriesByPosition.value.get(key) ?? null
    }

    /**
     * Check if a position has a memory
     */
    const hasMemoryAt = (position: GridPosition): boolean => {
        return getMemoryAt(position) !== null
    }

    /**
     * Get all empty positions
     */
    const getEmptyPositions = (gridWidth: number, gridHeight: number): GridPosition[] => {
        const empty: GridPosition[] = []
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                if (!hasMemoryAt({ row, col })) {
                    empty.push({ row, col })
                }
            }
        }
        return empty
    }

    /**
     * Get next available empty position (random placement in middle area)
     * Skips transparent positions (where alpha < 0.1)
     * Prioritizes positions in the middle 70% of the grid
     */
    const getNextEmptyPosition = (gridWidth: number, gridHeight: number): GridPosition | null => {
        const mosaicStore = useMosaicStore()

        // Collect all valid empty positions
        const emptyPositions: GridPosition[] = []
        const middlePositions: GridPosition[] = []

        // Define middle area boundaries (inner 70% of grid)
        const marginPercentage = 0.15 // 15% margin on each side = 70% middle area
        const minRow = Math.floor(gridHeight * marginPercentage)
        const maxRow = Math.ceil(gridHeight * (1 - marginPercentage))
        const minCol = Math.floor(gridWidth * marginPercentage)
        const maxCol = Math.ceil(gridWidth * (1 - marginPercentage))

        console.log(`🎯 Grid size: ${gridWidth}x${gridHeight}`)
        console.log(`📍 Middle area: rows ${minRow}-${maxRow}, cols ${minCol}-${maxCol}`)

        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                const position = { row, col }

                // Skip if position already has a memory
                if (hasMemoryAt(position)) {
                    continue
                }

                // Skip if position is transparent (outside of reference photo)
                const colorData = mosaicStore.getCardColor(row, col)
                if (!colorData || (colorData.alpha ?? 1) < 0.1) {
                    continue
                }

                // Valid empty position!
                emptyPositions.push(position)

                // Check if it's in the middle area
                if (row >= minRow && row < maxRow && col >= minCol && col < maxCol) {
                    middlePositions.push(position)
                }
            }
        }

        console.log(`✅ Found ${emptyPositions.length} total empty positions`)
        console.log(`🎯 Found ${middlePositions.length} middle area positions`)

        // No empty positions at all
        if (emptyPositions.length === 0) {
            return null
        }

        // Prefer middle positions if available
        const positionsToChooseFrom = middlePositions.length > 0 ? middlePositions : emptyPositions

        // Pick a random position
        const randomIndex = Math.floor(Math.random() * positionsToChooseFrom.length)
        const selectedPosition = positionsToChooseFrom[randomIndex] ?? null

        console.log(`🎲 Selected random position:`, selectedPosition)

        return selectedPosition
    }

    /**
     * Load memories from Firestore with real-time updates
     */
    const loadMemories = async () => {
        isLoading.value = true
        error.value = null

        try {
            console.log('📸 Setting up real-time listener for memories...')

            // Subscribe to real-time updates
            unsubscribe = subscribeToMemories((updatedMemories) => {
                memories.value = updatedMemories
                isLoading.value = false
            })

            console.log('✅ Real-time listener active')
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load memories'
            console.error('Error loading memories:', err)
            isLoading.value = false
        }
    }

    /**
     * Stop listening to real-time updates
     */
    const stopListening = () => {
        if (unsubscribe) {
            unsubscribe()
            unsubscribe = null
            console.log('👋 Stopped listening to real-time updates')
        }
    }

    // Cleanup on store unmount
    onUnmounted(() => {
        stopListening()
    })

    /**
     * Add a new memory to Firestore
     */
    const addMemory = async (memory: Omit<Memory, 'id' | 'timestamp'>) => {
        try {
            console.log('💾 Adding memory to Firestore:', memory)

            // Generate unique ID
            const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            const newMemory: Memory = {
                ...memory,
                id: memoryId,
                timestamp: new Date(),
            }

            // Save to Firestore (real-time listener will update the UI)
            await saveMemory(newMemory)

            console.log('✅ Memory added successfully')
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to add memory'
            console.error('❌ Error adding memory:', err)
            throw err
        }
    }

    /**
     * Delete a memory
     */
    const deleteMemory = async (memoryId: string) => {
        try {
            // TODO: Implement Firestore deletion
            console.log('Deleting memory:', memoryId)

            // Temporary: remove from local state
            memories.value = memories.value.filter((m) => m.id !== memoryId)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to delete memory'
            console.error('Error deleting memory:', err)
            throw err
        }
    }

    return {
        // State
        memories,
        isLoading,
        error,

        // Getters
        totalMemories,
        memoriesByPosition,

        // Actions
        getMemoryAt,
        hasMemoryAt,
        getEmptyPositions,
        getNextEmptyPosition,
        loadMemories,
        stopListening,
        addMemory,
        deleteMemory,
    }
})


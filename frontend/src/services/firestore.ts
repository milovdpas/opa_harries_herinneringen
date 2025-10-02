/**
 * Firestore Service
 * Handles saving and loading memories from Firestore
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Memory, GridPosition } from '@/types'

const memoriesCollection = collection(db, 'memories')

/**
 * Save a memory to Firestore
 */
export async function saveMemory(memory: Omit<Memory, 'timestamp'> & { timestamp?: Date }): Promise<void> {
    const memoryDoc = doc(memoriesCollection, memory.id)

    // Convert Date to Firestore Timestamp
    const firestoreData = {
        ...memory,
        timestamp: memory.timestamp ? Timestamp.fromDate(memory.timestamp) : Timestamp.now(),
    }

    console.log(`💾 Saving memory ${memory.id} to Firestore...`)

    await setDoc(memoryDoc, firestoreData)

    console.log(`✅ Memory ${memory.id} saved to Firestore`)
}

/**
 * Load all memories from Firestore (one-time fetch)
 */
export async function loadMemories(): Promise<Memory[]> {
    console.log('📥 Loading memories from Firestore...')

    const q = query(memoriesCollection, orderBy('timestamp', 'asc'))
    const snapshot = await getDocs(q)

    const memories: Memory[] = []

    snapshot.forEach((doc) => {
        const data = doc.data()
        memories.push({
            id: doc.id,
            type: data.type,
            photoUrl: data.photoUrl,
            typeInput: data.typeInput,
            gridPosition: data.gridPosition as GridPosition,
            submitterName: data.submitterName,
            timestamp: (data.timestamp as Timestamp).toDate(),
            averageColor: data.averageColor,
            brightness: data.brightness,
        })
    })

    console.log(`✅ Loaded ${memories.length} memories from Firestore`)

    return memories
}

/**
 * Subscribe to real-time updates for memories
 * @param callback - Function to call when memories update
 * @returns Unsubscribe function
 */
export function subscribeToMemories(callback: (memories: Memory[]) => void): () => void {
    console.log('👂 Subscribing to real-time memory updates...')

    const q = query(memoriesCollection, orderBy('timestamp', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const memories: Memory[] = []

        snapshot.forEach((doc) => {
            const data = doc.data()
            memories.push({
                id: doc.id,
                type: data.type,
                photoUrl: data.photoUrl,
                typeInput: data.typeInput,
                gridPosition: data.gridPosition as GridPosition,
                submitterName: data.submitterName,
                timestamp: (data.timestamp as Timestamp).toDate(),
                averageColor: data.averageColor,
                brightness: data.brightness,
            })
        })

        console.log(`🔄 Real-time update: ${memories.length} memories`)
        callback(memories)
    })

    return unsubscribe
}


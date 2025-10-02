/**
 * Firebase Storage Service
 * Handles uploading photos and media files to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/config/firebase'

/**
 * Upload a photo to Firebase Storage
 * @param memoryId - Unique ID for this memory
 * @param file - The photo file to upload
 * @returns Download URL of the uploaded photo
 */
export async function uploadPhoto(memoryId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `memories/${memoryId}/photo.jpg`)

    console.log(`📤 Uploading photo for memory ${memoryId}...`)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    console.log(`✅ Photo uploaded: ${downloadURL}`)

    return downloadURL
}

/**
 * Upload an audio file to Firebase Storage
 * @param memoryId - Unique ID for this memory
 * @param file - The audio file to upload
 * @returns Download URL of the uploaded audio
 */
export async function uploadAudio(memoryId: string, file: File): Promise<string> {
    // Get file extension
    const extension = file.name.split('.').pop() || 'mp3'
    const storageRef = ref(storage, `memories/${memoryId}/audio.${extension}`)

    console.log(`📤 Uploading audio for memory ${memoryId}...`)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    console.log(`✅ Audio uploaded: ${downloadURL}`)

    return downloadURL
}

/**
 * Upload a video file to Firebase Storage
 * @param memoryId - Unique ID for this memory
 * @param file - The video file to upload
 * @returns Download URL of the uploaded video
 */
export async function uploadVideo(memoryId: string, file: File): Promise<string> {
    // Get file extension
    const extension = file.name.split('.').pop() || 'mp4'
    const storageRef = ref(storage, `memories/${memoryId}/video.${extension}`)

    console.log(`📤 Uploading video for memory ${memoryId}...`)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    console.log(`✅ Video uploaded: ${downloadURL}`)

    return downloadURL
}


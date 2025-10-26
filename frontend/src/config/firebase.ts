import { initializeApp, type FirebaseApp } from 'firebase/app'
import { type Firestore, persistentLocalCache, initializeFirestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate required environment variables
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
]

const missingEnvVars = requiredEnvVars.filter((envVar) => !import.meta.env[envVar])

if (missingEnvVars.length > 0) {
    console.error(
        'Missing required Firebase environment variables:',
        missingEnvVars.join(', '),
    )
    console.error('Please copy .env.example to .env and fill in your Firebase credentials.')
}

// Initialize Firebase
let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage

try {
    app = initializeApp(firebaseConfig)

    // Initialize Firestore with persistent cache for better mobile experience
    // This allows the app to work offline and sync when connection is restored
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            // Optional: Configure cache size (default is 40MB)
            // cacheSizeBytes: 100 * 1024 * 1024, // 100MB
        })
    })

    storage = getStorage(app)

    console.log('Firebase initialized successfully with persistent cache')
} catch (error) {
    console.error('Error initializing Firebase:', error)
    throw error
}

export { app, db, storage }


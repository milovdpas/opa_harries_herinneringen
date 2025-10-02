import type { CardColorData, GridPosition } from '@/types'

/**
 * Photomosaic Analysis Utility
 * Analyzes a reference photo and extracts color data for each grid position
 * to recreate the photo as a mosaic of colored cards
 */

/**
 * Load an image and return as HTMLImageElement
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous' // Handle CORS for external images
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

/**
 * Calculate luminance (brightness) from RGB values
 * Uses the relative luminance formula: 0.299*R + 0.587*G + 0.114*B
 * Returns value between 0-255
 */
const calculateBrightness = (r: number, g: number, b: number): number => {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

/**
 * Convert RGB values to hex color string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Extract average color from a section of the canvas
 * Also calculates average alpha (transparency)
 */
const getAverageColor = (
    imageData: ImageData,
    startX: number,
    startY: number,
    width: number,
    height: number,
    canvasWidth: number,
): { r: number; g: number; b: number; a: number } => {
    let totalR = 0
    let totalG = 0
    let totalB = 0
    let totalA = 0
    let pixelCount = 0

    // Loop through each pixel in the section
    for (let y = startY; y < startY + height; y++) {
        for (let x = startX; x < startX + width; x++) {
            // Calculate pixel index in the flat ImageData array
            const index = (y * canvasWidth + x) * 4

            totalR += imageData.data[index] ?? 0 // Red
            totalG += imageData.data[index + 1] ?? 0 // Green
            totalB += imageData.data[index + 2] ?? 0 // Blue
            totalA += imageData.data[index + 3] ?? 255 // Alpha (0-255)

            pixelCount++
        }
    }

    // Calculate average
    return {
        r: totalR / pixelCount,
        g: totalG / pixelCount,
        b: totalB / pixelCount,
        a: totalA / pixelCount / 255, // Normalize to 0-1
    }
}

/**
 * Analyze a reference photo and extract color data for each grid position
 *
 * @param imageUrl - Path or URL to the reference photo
 * @param gridWidth - Number of cards horizontally
 * @param gridHeight - Number of cards vertically
 * @returns Array of CardColorData for each grid position
 */
export const analyzeReferencePhoto = async (
    imageUrl: string,
    gridWidth: number,
    gridHeight: number,
): Promise<CardColorData[]> => {
    try {
        // Load the image
        const img = await loadImage(imageUrl)

        // Create canvas and get context
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        if (!ctx) {
            throw new Error('Could not get canvas context')
        }

        // Set canvas size to match image
        canvas.width = img.width
        canvas.height = img.height

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0)

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Calculate cell dimensions
        const cellWidth = Math.floor(canvas.width / gridWidth)
        const cellHeight = Math.floor(canvas.height / gridHeight)

        const cardColors: CardColorData[] = []

        // Analyze each grid cell
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                // Calculate section boundaries
                const startX = col * cellWidth
                const startY = row * cellHeight
                const width = Math.min(cellWidth, canvas.width - startX)
                const height = Math.min(cellHeight, canvas.height - startY)

                // Get average color for this section (including alpha)
                const { r, g, b, a } = getAverageColor(imageData, startX, startY, width, height, canvas.width)

                // Calculate brightness
                const brightness = calculateBrightness(r, g, b)

                // Convert to hex
                const backgroundColor = rgbToHex(r, g, b)

                // Store card data with alpha
                cardColors.push({
                    position: { row, col },
                    backgroundColor,
                    brightness,
                    alpha: a, // Store alpha transparency (0-1)
                })
            }
        }

        console.log(
            `✅ Analyzed reference photo: ${gridWidth}x${gridHeight} = ${cardColors.length} cards`,
        )

        return cardColors
    } catch (error) {
        console.error('Error analyzing reference photo:', error)
        throw error
    }
}

/**
 * Calculate optimal grid dimensions based on image aspect ratio
 * Aims for approximately targetCards total cards
 *
 * @param imageUrl - Path or URL to the reference photo
 * @param targetCards - Approximate number of cards desired (default: 1200)
 * @returns { gridWidth, gridHeight }
 */
export const calculateGridDimensions = async (
    imageUrl: string,
    targetCards: number = 1200,
): Promise<{ gridWidth: number; gridHeight: number; aspectRatio: number }> => {
    const img = await loadImage(imageUrl)

    const aspectRatio = img.width / img.height

    // Calculate grid dimensions maintaining aspect ratio
    // width * height ≈ targetCards
    // width / height = aspectRatio
    // So: width = aspectRatio * height
    // Therefore: aspectRatio * height * height = targetCards
    // height = sqrt(targetCards / aspectRatio)

    const gridHeight = Math.round(Math.sqrt(targetCards / aspectRatio))
    const gridWidth = Math.round(gridHeight * aspectRatio)

    console.log(
        `📐 Grid dimensions: ${gridWidth}x${gridHeight} = ${gridWidth * gridHeight} cards (aspect ratio: ${aspectRatio.toFixed(2)})`,
    )

    return {
        gridWidth,
        gridHeight,
        aspectRatio,
    }
}


/**
 * Share Utility
 * 
 * Functions for sharing the application via various platforms.
 */

/**
 * Shares the current page URL via WhatsApp
 */
export function shareViaWhatsApp(): void {
    const url = window.location.href
    const message = `Bekijk de herinneringen aan Opa Harrie 💙\n\n${url}`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`

    // Open WhatsApp in a new window
    window.open(whatsappUrl, '_blank')
}

/**
 * Checks if the Web Share API is available (native mobile sharing)
 */
export function canUseNativeShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator
}

/**
 * Shares via native share dialog (if available)
 */
export async function shareNative(): Promise<void> {
    if (!canUseNativeShare()) {
        throw new Error('Native sharing not supported')
    }

    try {
        await navigator.share({
            title: "Opa Harrie's Herinneringen",
            text: 'Bekijk de herinneringen aan Opa Harrie 💙',
            url: window.location.href,
        })
    } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error)
    }
}

/**
 * Copies the current URL to clipboard
 */
export async function copyUrlToClipboard(): Promise<void> {
    const url = window.location.href

    if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        await navigator.clipboard.writeText(url)
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            document.execCommand('copy')
            textArea.remove()
        } catch (error) {
            console.error('Failed to copy:', error)
            textArea.remove()
            throw error
        }
    }
}


import {
  addNotification,
  setError,
  setLoading,
  clearError
} from '../stores/ui.js'

/**
 * Enhanced error handling utilities with retry logic
 */

/**
 * Retry configuration for different types of operations
 */
const RETRY_CONFIG = {
  network: {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000 // 10 seconds
  },
  api: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000
  }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @returns {number} - Delay in milliseconds
 */
function calculateDelay(attempt, baseDelay, maxDelay) {
  const delay = baseDelay * Math.pow(2, attempt)
  return Math.min(delay + Math.random() * 1000, maxDelay) // Add jitter
}

/**
 * Enhanced fetch with retry logic and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} operationName - Name for tracking/logging
 * @param {string} retryType - Type of retry config to use
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithRetry(
  url,
  options = {},
  operationName,
  retryType = 'network'
) {
  console.log(operationName)
  const config = RETRY_CONFIG[retryType] || RETRY_CONFIG.network
  let lastError

  setLoading(operationName, true)

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      clearError(operationName)

      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      setLoading(operationName, false)
      return response
    } catch (error) {
      lastError = error

      // Don't retry on certain errors
      if (
        error.name === 'AbortError' ||
        error.status === 404 ||
        error.status === 403
      ) {
        break
      }

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay)

        addNotification({
          type: 'warning',
          message: `Retrying ${operationName} in ${Math.round(delay / 1000)}s... (attempt ${attempt + 2}/${config.maxRetries + 1})`,
          duration: delay
        })

        await sleep(delay)
      }
    }
  }

  // All retries failed
  setLoading(operationName, false)
  setError(operationName, lastError)

  addNotification({
    type: 'error',
    message: `Failed to load ${operationName}: ${lastError.message}`,
    duration: 10000
  })

  throw lastError
}

/**
 * User-friendly error messages for common errors
 */
const ERROR_MESSAGES = {
  'Failed to fetch':
    'Network connection failed. Please check your internet connection.',
  NetworkError: 'Network error occurred. Please try again.',
  'TypeError: Failed to fetch':
    'Unable to connect to server. Please check your connection.',
  'HTTP 404': 'The requested resource was not found.',
  'HTTP 403':
    'Access denied. You may not have permission to access this resource.',
  'HTTP 500': 'Server error occurred. Please try again later.',
  AbortError: 'Request timed out. Please try again.',
  SyntaxError: 'Invalid data received from server.',
  'JSON.parse': 'Invalid JSON data received.'
}

/**
 * Convert technical errors to user-friendly messages
 * @returns {string} - User-friendly error message
 */
export function getUserFriendlyError(error) {
  const errorString = error?.message || error?.toString() || 'Unknown error'

  // Check for specific error patterns
  for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.includes(pattern)) {
      return message
    }
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Handle errors with consistent logging and user notification
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @param {boolean} [notify=true] - Whether to show user notification
 */
export function handleError(error, context, notify = true) {
  console.error(`Error in ${context}:`, error)

  if (notify) {
    addNotification({
      type: 'error',
      message: getUserFriendlyError(error),
      duration: 8000
    })
  }
}

/**
 * Wrapper for async operations with error handling
 * @param {Function} operation - Async operation to execute
 * @param {string} context - Context description
 * @param {Object} options - Options
 * @param {boolean} [options.notify=true] - Show notifications
 * @param {boolean} [options.rethrow=false] - Re-throw errors
 * @returns {Promise} - Operation result or null on error
 */
export async function withErrorHandling(operation, context, options = {}) {
  const { notify = true, rethrow = false } = options

  try {
    return await operation()
  } catch (error) {
    handleError(error, context, notify)

    if (rethrow) {
      throw error
    }

    return null
  }
}

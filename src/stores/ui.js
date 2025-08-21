import { writable } from 'svelte/store'
import { persist, localStorage } from '@macfja/svelte-persistent-store'

/**
 * UI state management for loading, errors, and notifications
 */

// Loading states for different operations
export const loadingStates = writable({
  channels: false,
  users: false,
  roles: false,
  emojis: false,
  spreadsheet: false,
  guide: false
})

// Error states with retry capabilities
export const errorStates = writable({
  channels: null,
  users: null,
  roles: null,
  emojis: null,
  spreadsheet: null,
  guide: null,
  network: null
})

// Notification system
export const notifications = writable([])

// Editor enhancement feature flags - VS Code mode is now always enabled
// Kept for backward compatibility but no longer used
export const editorFeatures = writable({
  jsonModeEnabled: true,  // Always enabled
  smartModeDetection: true,  // Always enabled
  enhancedFolding: true  // Always enabled
})

// Discord theme configuration - persistent across sessions
export const discordTheme = persist(writable('theme-dark'), localStorage(), 'discordTheme')

// Editor theme configuration - persistent across sessions
export const editorTheme = persist(writable('vscode-json'), localStorage(), 'editorTheme')

/**
 * Add a notification to the queue
 * @param {Object} notification - Notification object
 * @param {string} notification.type - 'success', 'error', 'warning', 'info'
 * @param {string} notification.message - Notification message
 * @param {number} [notification.duration] - Auto-dismiss duration in ms
 */
export function addNotification(notification) {
  const id = Date.now() + Math.random()
  const notificationWithId = {
    id,
    duration: 5000, // Default 5 seconds
    ...notification
  }

  notifications.update((items) => [...items, notificationWithId])

  // Auto-dismiss if duration is set
  if (notificationWithId.duration > 0) {
    setTimeout(() => {
      dismissNotification(id)
    }, notificationWithId.duration)
  }

  return id
}

/**
 * Dismiss a notification by ID
 * @param {string|number} id - Notification ID
 */
export function dismissNotification(id) {
  notifications.update((items) => items.filter((item) => item.id !== id))
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  notifications.set([])
}

/**
 * Set loading state for a specific operation
 * @param {string} operation - Operation name
 * @param {boolean} isLoading - Loading state
 */
export function setLoading(operation, isLoading) {
  loadingStates.update((states) => ({
    ...states,
    [operation]: isLoading
  }))
}

/**
 * Set error state for a specific operation
 * @param {string} operation - Operation name
 * @param {Error|string|null} error - Error object or message
 */
export function setError(operation, error) {
  errorStates.update((states) => ({
    ...states,
    [operation]: error
  }))
}

/**
 * Clear error for a specific operation
 * @param {string} operation - Operation name
 */
export function clearError(operation) {
  setError(operation, null)
}

/**
 * Check if any operation is currently loading
 * @param {Object} states - Loading states object
 * @returns {boolean} - True if any operation is loading
 */
export function isAnyLoading(states) {
  return Object.values(states).some(Boolean)
}

/**
 * HTML sanitization utilities to prevent XSS attacks
 */

/**
 * List of allowed HTML tags for Discord content
 * Currently not used but kept for future implementation of more granular sanitization
 */
// const ALLOWED_TAGS = [
//   'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
//   'h1', 'h2', 'h3', 'a', 'div', 'span', 'ul', 'ol', 'li'
// ]

/**
 * List of allowed attributes for specific tags
 * Currently not used but kept for future implementation of more granular sanitization
 */
// const ALLOWED_ATTRIBUTES = {
//   'a': ['href', 'title'],
//   'span': ['class'],
//   'div': ['class'],
//   'code': ['class'],
//   'blockquote': ['class']
// }

/**
 * Allowed CSS classes (Discord-specific)
 */
const ALLOWED_CLASSES = [
  'd-mention',
  'd-channel',
  'd-user',
  'd-role',
  'blockquoteContainer',
  'blockquoteDivider',
  'inline',
  'hljs',
  'discord-subtext'
]

/**
 * Basic HTML sanitizer that removes potentially dangerous content
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove dangerous event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocols
  html = html.replace(/javascript:/gi, '')

  // Remove data: protocols (except for images)
  html = html.replace(/\s*href\s*=\s*["']data:(?!image\/)[^"']*["']/gi, '')

  // Remove style attributes (potential for CSS injection)
  html = html.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')

  // Sanitize class attributes to only allow known safe classes
  html = html.replace(/\s*class\s*=\s*["']([^"']*)["']/gi, (match, classes) => {
    const safeClasses = classes
      .split(/\s+/)
      .filter((cls) => ALLOWED_CLASSES.includes(cls))
      .join(' ')
    return safeClasses ? ` class="${safeClasses}"` : ''
  })

  return html
}

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHTML(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (s) => entityMap[s])
}

/**
 * Validate and sanitize URLs
 * @param {string} url - URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    const parsed = new URL(url)

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    // Block potentially dangerous domains
    const dangerousDomains = ['javascript', 'data', 'vbscript']
    if (dangerousDomains.some((domain) => parsed.hostname.includes(domain))) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize Discord markdown content before rendering
 * @param {string} content - Discord markdown content
 * @returns {string} - Sanitized content
 */
export function sanitizeDiscordContent(content) {
  if (!content) {
    return ''
  }

  // First pass: sanitize the HTML
  let sanitized = sanitizeHTML(content)

  // Additional Discord-specific sanitization
  // Remove potential embed injection attempts
  sanitized = sanitized.replace(/<iframe[^>]*>/gi, '')
  sanitized = sanitized.replace(/<object[^>]*>/gi, '')
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '')

  return sanitized
}

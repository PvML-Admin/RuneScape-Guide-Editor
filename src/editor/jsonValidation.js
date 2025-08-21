/**
 * JSON Validation with VS Code-like error highlighting
 */

/**
 * Validate JSON and add error markers like VS Code
 * @param {CodeMirror} editor - CodeMirror instance
 * @param {string} text - Text to validate
 */
export function validateJsonWithMarkers(editor, text) {
  if (!editor || !text) return
  
  // Clear existing markers
  editor.getAllMarks().forEach(mark => {
    if (mark.className && mark.className.includes('json-error')) {
      mark.clear()
    }
  })
  
  // Extract JSON blocks from Discord content
  const jsonBlocks = extractJsonBlocks(text)
  
  jsonBlocks.forEach(block => {
    validateJsonBlock(editor, block)
  })
}

/**
 * Extract JSON blocks from Discord text
 * @param {string} text - Full editor text
 * @returns {Array} Array of JSON block objects
 */
function extractJsonBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let currentBlock = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Start of JSON block
    if (line.startsWith('.embed:json') || line.startsWith('.componentsV2:json')) {
      currentBlock = {
        startLine: i + 1,
        endLine: null,
        content: '',
        type: line.startsWith('.embed:json') ? 'embed' : 'components'
      }
    }
    // End of JSON block
    else if (currentBlock && (line.startsWith('.') || i === lines.length - 1)) {
      currentBlock.endLine = i
      currentBlock.content = lines.slice(currentBlock.startLine, currentBlock.endLine).join('\n')
      if (currentBlock.content.trim()) {
        blocks.push(currentBlock)
      }
      currentBlock = null
    }
  }
  
  // Handle case where JSON block goes to end of file
  if (currentBlock) {
    currentBlock.endLine = lines.length
    currentBlock.content = lines.slice(currentBlock.startLine).join('\n')
    if (currentBlock.content.trim()) {
      blocks.push(currentBlock)
    }
  }
  
  return blocks
}

/**
 * Validate a single JSON block and add error markers
 * @param {CodeMirror} editor - CodeMirror instance
 * @param {Object} block - JSON block object
 */
function validateJsonBlock(editor, block) {
  try {
    JSON.parse(block.content)
    // Valid JSON - no errors to mark
  } catch (error) {
    // Parse error - add VS Code-like error marker
    const errorInfo = parseJsonError(error.message, block.content)
    addErrorMarker(editor, block, errorInfo)
  }
}

/**
 * Parse JSON error message to extract position information
 * @param {string} errorMessage - JSON parse error message
 * @param {string} content - JSON content
 * @returns {Object} Error information
 */
function parseJsonError(errorMessage, content) {
  // Try to extract position from error message
  const positionMatch = errorMessage.match(/position (\d+)/)
  const lineMatch = errorMessage.match(/line (\d+)/)
  
  let line = 0
  let ch = 0
  
  if (positionMatch) {
    const position = parseInt(positionMatch[1])
    const lines = content.substring(0, position).split('\n')
    line = lines.length - 1
    ch = lines[lines.length - 1].length
  } else if (lineMatch) {
    line = parseInt(lineMatch[1]) - 1
  }
  
  return {
    line,
    ch,
    message: errorMessage,
    type: 'syntax-error'
  }
}

/**
 * Add VS Code-like error marker to the editor
 * @param {CodeMirror} editor - CodeMirror instance
 * @param {Object} block - JSON block object
 * @param {Object} errorInfo - Error information
 */
function addErrorMarker(editor, block, errorInfo) {
  const actualLine = block.startLine + errorInfo.line
  const actualCh = errorInfo.ch
  
  // Create error marker element
  const errorElement = document.createElement('span')
  errorElement.className = 'json-error-marker'
  errorElement.title = errorInfo.message
  errorElement.style.cssText = `
    border-bottom: 2px wavy #f14c4c;
    position: relative;
    cursor: help;
  `
  
  // Add squiggly underline to the problematic area
  const from = { line: actualLine, ch: Math.max(0, actualCh - 1) }
  const to = { line: actualLine, ch: actualCh + 1 }
  
  editor.markText(from, to, {
    className: 'json-error-squiggle',
    title: errorInfo.message,
    css: 'border-bottom: 2px wavy #f14c4c; cursor: help;'
  })
  
  // Add error icon in the gutter
  const errorIcon = document.createElement('div')
  errorIcon.className = 'json-error-gutter'
  errorIcon.innerHTML = '●'
  errorIcon.style.cssText = `
    color: #f14c4c;
    font-weight: bold;
    cursor: help;
    width: 16px;
    text-align: center;
  `
  errorIcon.title = errorInfo.message
  
  editor.setGutterMarker(actualLine, 'json-errors', errorIcon)
}

/**
 * Initialize JSON validation for an editor
 * @param {CodeMirror} editor - CodeMirror instance
 */
export function initJsonValidation(editor) {
  if (!editor) return
  
  // Add error gutter
  const gutters = editor.getOption('gutters') || []
  if (!gutters.includes('json-errors')) {
    editor.setOption('gutters', [...gutters, 'json-errors'])
  }
  
  // Validate on content change (debounced)
  let validationTimeout
  editor.on('change', () => {
    clearTimeout(validationTimeout)
    validationTimeout = setTimeout(() => {
      validateJsonWithMarkers(editor, editor.getValue())
    }, 500) // 500ms debounce
  })
  
  // Initial validation
  validateJsonWithMarkers(editor, editor.getValue())
}

/**
 * Clean up JSON validation
 * @param {CodeMirror} editor - CodeMirror instance
 */
export function cleanupJsonValidation(editor) {
  if (!editor) return
  
  // Clear all error markers
  editor.getAllMarks().forEach(mark => {
    if (mark.className && mark.className.includes('json-error')) {
      mark.clear()
    }
  })
  
  // Clear gutter markers
  editor.clearGutter('json-errors')
}

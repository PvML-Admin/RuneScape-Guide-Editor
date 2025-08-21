/**
 * JSON Mode Enhancements for CodeMirror Editor
 * Provides VS Code-like JSON editing experience while preserving Discord functionality
 */

import { initJsonValidation, cleanupJsonValidation } from './jsonValidation.js'

/**
 * Detect if content should use JSON mode
 * @param {string} text - Editor content
 * @returns {boolean} - True if JSON mode should be active
 */
export function shouldUseJsonMode(text) {
  if (!text || text.trim().length === 0) return false
  
  const lines = text.split('\n')
  
  // Check for JSON embed commands
  const hasJsonEmbed = lines.some(line => {
    const trimmed = line.trim()
    return trimmed.startsWith('.embed:json') || 
           trimmed.startsWith('.componentsV2:json')
  })
  
  // Check for JSON-like structure in content blocks
  const hasJsonStructure = text.includes('{') && text.includes('}')
  
  // Check for JSON content after commands
  let inJsonBlock = false
  for (const line of lines) {
    if (line.trim().startsWith('.embed:json') || line.trim().startsWith('.componentsV2:json')) {
      inJsonBlock = true
      continue
    }
    if (line.trim().startsWith('.') && line.trim().length > 1) {
      inJsonBlock = false
      continue
    }
    if (inJsonBlock && (line.trim().startsWith('{') || line.trim().startsWith('['))) {
      return true
    }
  }
  
  return hasJsonEmbed && hasJsonStructure
}

/**
 * Get enhanced editor options for JSON mode
 * @param {Object} baseOptions - Existing editor options
 * @param {boolean} enableJsonMode - Whether to enable JSON features
 * @returns {Object} - Enhanced options
 */
export function getEnhancedOptions(baseOptions, enableJsonMode = false) {
  if (!enableJsonMode) {
    return baseOptions
  }
  
  return {
    ...baseOptions,
    mode: "vscode-json-enhanced", // Use our enhanced VS Code JSON mode
    theme: "vscode-json", // Use VS Code-like theme
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    indentUnit: 2,
    smartIndent: true,
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: {
      pairs: "()[]{}\"\"",
      explode: "[]{}"
    },
    matchBrackets: {
      strict: true,
      afterCursor: true
    },
    showTrailingSpace: true,
    styleActiveLine: true
  }
}

/**
 * Apply JSON mode to existing editor instance
 * @param {CodeMirror} editor - CodeMirror editor instance
 * @param {boolean} enable - Whether to enable JSON mode
 */
export function toggleJsonMode(editor, enable = true) {
  if (!editor) return
  
  if (enable) {
    // Enable VS Code-like JSON mode
    editor.setOption('mode', 'vscode-json-enhanced')
    editor.setOption('theme', 'vscode-json')
    editor.setOption('foldGutter', true)
    editor.setOption('gutters', ["CodeMirror-linenumbers", "CodeMirror-foldgutter"])
    editor.setOption('indentUnit', 2)
    editor.setOption('smartIndent', true)
    
    // Disabled JSON validation to match VS Code behavior
    // initJsonValidation(editor)
  } else {
    // Clean up JSON validation
    // cleanupJsonValidation(editor)
    
    // Revert to basic theme and mode (keeping VS Code as default)
    editor.setOption('mode', null)
    editor.setOption('theme', 'vscode-json')  // Keep VS Code theme even when disabled
    editor.setOption('foldGutter', false)
    editor.setOption('gutters', ["CodeMirror-linenumbers"])
  }
  
  // Refresh editor to apply changes
  editor.refresh()
}

/**
 * Smart indent for JSON content within Discord messages
 * @param {CodeMirror} editor - CodeMirror editor instance
 */
export function smartIndentJson(editor) {
  if (!editor) return
  
  const selections = editor.listSelections()
  
  selections.forEach(selection => {
    const from = selection.anchor
    const to = selection.head
    
    // Get selected text or current line
    let text
    if (from.line === to.line && from.ch === to.ch) {
      // No selection, format current line
      text = editor.getLine(from.line)
      const formatted = formatJsonLine(text)
      if (formatted !== text) {
        editor.replaceRange(formatted, 
          { line: from.line, ch: 0 }, 
          { line: from.line, ch: text.length }
        )
      }
    } else {
      // Format selection
      text = editor.getSelection()
      const formatted = formatJsonText(text)
      if (formatted !== text) {
        editor.replaceSelection(formatted)
      }
    }
  })
}

/**
 * Format a single line of JSON
 * @param {string} line - Line to format
 * @returns {string} - Formatted line
 */
function formatJsonLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return line
  
  // Simple indentation rules for JSON
  const indentLevel = (trimmed.match(/^[\s]*/)[0].length / 2) || 0
  const baseIndent = '  '.repeat(indentLevel)
  
  return baseIndent + trimmed
}

/**
 * Format JSON text block
 * @param {string} text - Text to format
 * @returns {string} - Formatted text
 */
function formatJsonText(text) {
  try {
    // Try to parse and reformat as JSON
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If not valid JSON, just clean up indentation
    return text.split('\n').map(line => formatJsonLine(line)).join('\n')
  }
}

/**
 * Add JSON-specific keyboard shortcuts
 * @param {CodeMirror} editor - CodeMirror editor instance
 * @param {Object} existingKeys - Existing keyboard shortcuts
 * @returns {Object} - Enhanced keyboard shortcuts
 */
export function getEnhancedKeyMap(editor, existingKeys = {}) {
  return {
    ...existingKeys,
    'Ctrl-Shift-F': () => smartIndentJson(editor),
    'Alt-Shift-F': () => smartIndentJson(editor), // Alternative for different OS
    'Ctrl-/': 'toggleComment', // JSON doesn't support comments, but useful for debugging
  }
}
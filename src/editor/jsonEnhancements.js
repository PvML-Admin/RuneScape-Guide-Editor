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
 * Auto-indent JSON blocks - works with selection or current cursor position
 * @param {CodeMirror} editor - CodeMirror editor instance
 */
export function autoIndentJsonBlocks(editor) {
  if (!editor) return
  
  const selection = editor.listSelections()[0]
  const hasSelection = editor.somethingSelected()
  
  if (hasSelection) {
    // Format selected text
    const selectedText = editor.getSelection()
    if (selectedText.trim()) {
      const formatted = formatJsonText(selectedText)
      if (formatted !== selectedText) {
        editor.replaceSelection(formatted)
        return true
      }
    }
    return false
  } else {
    // Find and format JSON block containing cursor
    const cursor = editor.getCursor()
    const content = editor.getValue()
    const lines = content.split('\n')
    
    // Find the JSON block that contains the cursor
    let jsonBlock = findJsonBlockAtCursor(lines, cursor.line)
    
    if (jsonBlock) {
      const blockLines = lines.slice(jsonBlock.start, jsonBlock.end + 1)
      const blockText = blockLines.join('\n')
      
      if (blockText.trim()) {
        const formatted = formatJsonText(blockText)
        
        if (formatted !== blockText) {
          const startPos = { line: jsonBlock.start, ch: 0 }
          const endPos = { line: jsonBlock.end, ch: blockLines[blockLines.length - 1].length }
          
          editor.replaceRange(formatted, startPos, endPos)
          return true
        }
      }
    }
    
    return false
  }
}

/**
 * Find JSON block that contains the specified line
 * @param {string[]} lines - Array of lines
 * @param {number} cursorLine - Line number where cursor is located
 * @returns {Object|null} - JSON block info or null if not found
 */
function findJsonBlockAtCursor(lines, cursorLine) {
  let inJsonBlock = false
  let jsonBlockStart = -1
  let currentCommand = ''
  
  // Scan from beginning to find the JSON block containing cursor
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check for JSON embed commands
    if (line.startsWith('.embed:json') || line.startsWith('.componentsV2:json')) {
      inJsonBlock = true
      jsonBlockStart = i + 1
      currentCommand = line
      continue
    }
    
    // Check for other commands that end JSON blocks
    if (line.startsWith('.') && line.length > 1 && !line.startsWith('.embed:json') && !line.startsWith('.componentsV2:json')) {
      if (inJsonBlock && jsonBlockStart !== -1 && cursorLine >= jsonBlockStart && cursorLine < i) {
        // Cursor is in this JSON block
        return {
          start: jsonBlockStart,
          end: i - 1,
          command: currentCommand
        }
      }
      inJsonBlock = false
      jsonBlockStart = -1
      continue
    }
  }
  
  // Handle case where JSON block extends to end of content
  if (inJsonBlock && jsonBlockStart !== -1 && cursorLine >= jsonBlockStart) {
    return {
      start: jsonBlockStart,
      end: lines.length - 1,
      command: currentCommand
    }
  }
  
  return null
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
 * Format JSON text block with enhanced structure handling
 * @param {string} text - Text to format
 * @returns {string} - Formatted text
 */
function formatJsonText(text) {
  const trimmed = text.trim()
  if (!trimmed) return text
  
  try {
    // Try to parse and reformat as JSON
    const parsed = JSON.parse(trimmed)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If not valid JSON, apply smart indentation based on structure
    return formatJsonLikeText(trimmed)
  }
}

/**
 * Format JSON-like text with proper indentation even if not valid JSON
 * @param {string} text - Text to format
 * @returns {string} - Formatted text with proper indentation
 */
function formatJsonLikeText(text) {
  const lines = text.split('\n')
  const formatted = []
  let indentLevel = 0
  const indentSize = 2
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      formatted.push('')
      continue
    }
    
    // Decrease indent for closing brackets
    if (line.startsWith('}') || line.startsWith(']')) {
      indentLevel = Math.max(0, indentLevel - 1)
    }
    
    // Apply current indentation
    const indent = ' '.repeat(indentLevel * indentSize)
    formatted.push(indent + line)
    
    // Increase indent for opening brackets
    if (line.endsWith('{') || line.endsWith('[')) {
      indentLevel++
    } else if (line.includes('{') && !line.includes('}')) {
      // Handle inline object start
      indentLevel++
    } else if (line.includes('[') && !line.includes(']')) {
      // Handle inline array start
      indentLevel++
    }
    
    // Handle lines that both open and close (like "}")
    if ((line.endsWith('},') || line.endsWith('},')) && (line.includes('{') || line.includes('['))) {
      // No change in indent level for self-contained objects/arrays
    }
  }
  
  return formatted.join('\n')
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
    'Ctrl-Shift-I': () => autoIndentJsonBlocks(editor), // Auto-indent entire JSON blocks
    'Ctrl-Alt-L': () => autoIndentJsonBlocks(editor), // Alternative shortcut
    'Ctrl-/': 'toggleComment', // JSON doesn't support comments, but useful for debugging
  }
}
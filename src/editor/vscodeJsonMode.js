/**
 * VS Code-like JSON Mode for CodeMirror
 * Enhanced JSON syntax highlighting that matches VS Code's behavior exactly
 */

import CodeMirror from 'codemirror'

CodeMirror.defineMode("vscode-json", function(config, parserConfig) {
  const indentUnit = config.indentUnit || 2
  
  function tokenBase(stream, state) {
    let ch = stream.next()
    
    // Handle strings
    if (ch === '"') {
      return tokenString(stream, state)
    }
    
    // Handle numbers
    if (/\d/.test(ch) || (ch === '-' && /\d/.test(stream.peek()))) {
      return tokenNumber(stream, state, ch)
    }
    
    // Handle keywords (true, false, null)
    if (/[a-z]/.test(ch)) {
      stream.backUp(1)
      return tokenKeyword(stream, state)
    }
    
    // Handle punctuation
    if (ch === '{' || ch === '}') {
      return 'bracket brace'
    }
    if (ch === '[' || ch === ']') {
      return 'bracket square'
    }
    if (ch === ':') {
      state.afterColon = true
      return 'punctuation colon'
    }
    if (ch === ',') {
      state.afterColon = false
      return 'punctuation comma'
    }
    
    // Skip whitespace
    if (/\s/.test(ch)) {
      return null
    }
    
    // Error for unexpected characters
    return 'error'
  }
  
  function tokenString(stream, state) {
    let escaped = false
    let ch
    
    while ((ch = stream.next()) != null) {
      if (ch === '"' && !escaped) {
        // Check if this is a property name (followed by colon after whitespace)
        const pos = stream.pos
        const originalPos = pos
        stream.eatSpace()
        
        if (stream.peek() === ':') {
          // This is a property name - return to end of string
          stream.pos = originalPos
          return 'string property'
        }
        
        // This is a string value - return to end of string
        stream.pos = originalPos
        return 'string'
      }
      escaped = !escaped && ch === '\\'
    }
    
    // Unclosed string
    return 'string error'
  }
  
  function tokenNumber(stream, state, firstChar) {
    let hasDecimal = false
    let hasExponent = false
    
    if (firstChar === '-') {
      // Already consumed the minus
    }
    
    // Integer part
    if (stream.peek() === '0') {
      stream.next()
      if (/\d/.test(stream.peek())) {
        // Leading zero followed by digit is invalid
        stream.eatWhile(/\d/)
        return 'number error'
      }
    } else {
      stream.eatWhile(/\d/)
    }
    
    // Decimal part
    if (stream.peek() === '.') {
      hasDecimal = true
      stream.next()
      if (!/\d/.test(stream.peek())) {
        return 'number error'
      }
      stream.eatWhile(/\d/)
    }
    
    // Exponent part
    if (/[eE]/.test(stream.peek())) {
      hasExponent = true
      stream.next()
      if (/[+-]/.test(stream.peek())) {
        stream.next()
      }
      if (!/\d/.test(stream.peek())) {
        return 'number error'
      }
      stream.eatWhile(/\d/)
    }
    
    return 'number'
  }
  
  function tokenKeyword(stream, state) {
    stream.eatWhile(/[a-z]/)
    const word = stream.current()
    
    if (word === 'true' || word === 'false' || word === 'null') {
      return 'atom'
    }
    
    return 'error'
  }
  
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        context: null,
        indent: 0,
        afterColon: false
      }
    },
    
    token: function(stream, state) {
      if (stream.eatSpace()) return null
      
      return state.tokenize(stream, state)
    },
    
    indent: function(state, textAfter) {
      if (state.tokenize !== tokenBase) return 0
      
      const firstChar = textAfter && textAfter.charAt(0)
      if (firstChar === '}' || firstChar === ']') {
        return Math.max(0, state.indent - indentUnit)
      }
      
      return state.indent
    },
    
    electricChars: "}]",
    
    fold: "brace",
    
    closeBrackets: {
      pairs: '()[]{}""',
      explode: '[]{}',
      override: {
        '"': function(cm) {
          // Custom quote handling for JSON strings
          const pos = cm.getCursor()
          const line = cm.getLine(pos.line)
          const before = line.slice(0, pos.ch)
          const after = line.slice(pos.ch)
          
          // If we're closing a string, don't add another quote
          if (after.charAt(0) === '"') {
            cm.setCursor(pos.line, pos.ch + 1)
            return
          }
          
          // Add closing quote
          cm.replaceSelection('""')
          cm.setCursor(pos.line, pos.ch + 1)
        }
      }
    }
  }
})

CodeMirror.defineMIME("application/vscode-json", "vscode-json")

export default "vscode-json"

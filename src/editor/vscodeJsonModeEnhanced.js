/**
 * Enhanced VS Code-like JSON Mode for CodeMirror
 * Properly distinguishes property names from string values like VS Code
 */

import CodeMirror from 'codemirror'

CodeMirror.defineMode("vscode-json-enhanced", function(config, parserConfig) {
  const indentUnit = config.indentUnit || 2
  
  function tokenBase(stream, state) {
    let ch = stream.next()
    
    // Handle strings with context awareness
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
    
    // Handle punctuation with state tracking
    if (ch === '{') {
      state.context = { type: 'object', indent: state.indent + indentUnit, prev: state.context }
      state.expectingKey = true
      return 'bracket brace-open'
    }
    if (ch === '}') {
      if (state.context && state.context.type === 'object') {
        state.context = state.context.prev
      }
      state.expectingKey = false
      return 'bracket brace-close'
    }
    if (ch === '[') {
      state.context = { type: 'array', indent: state.indent + indentUnit, prev: state.context }
      state.expectingKey = false
      return 'bracket square-open'
    }
    if (ch === ']') {
      if (state.context && state.context.type === 'array') {
        state.context = state.context.prev
      }
      return 'bracket square-close'
    }
    if (ch === ':') {
      state.expectingKey = false
      state.expectingValue = true
      return 'punctuation colon'
    }
    if (ch === ',') {
      // After comma in object, we expect a key
      if (state.context && state.context.type === 'object') {
        state.expectingKey = true
      }
      state.expectingValue = false
      return 'punctuation comma'
    }
    
    // Skip whitespace
    if (/\s/.test(ch)) {
      return null
    }
    
    // Don't mark unexpected characters as errors to avoid red highlighting
    return null
  }
  
  function tokenString(stream, state) {
    let escaped = false
    let ch
    
    while ((ch = stream.next()) != null) {
      if (ch === '"' && !escaped) {
        // Determine if this is a property name or string value based on context
        if (state.expectingKey || (state.context && state.context.type === 'object' && state.expectingKey !== false)) {
          // This is a property name
          return 'string property'
        } else {
          // This is a string value
          return 'string value'
        }
      }
      escaped = !escaped && ch === '\\'
    }
    
    // Unclosed string - don't mark as error to avoid red highlighting
    return 'string'
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
        // Leading zero followed by digit - don't mark as error
        stream.eatWhile(/\d/)
        return 'number'
      }
    } else {
      stream.eatWhile(/\d/)
    }
    
    // Decimal part
    if (stream.peek() === '.') {
      hasDecimal = true
      stream.next()
      if (!/\d/.test(stream.peek())) {
        return 'number'
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
        return 'number'
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
    
    // Don't mark unknown words as errors to avoid red highlighting
    return null
  }
  
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        context: null,
        indent: 0,
        expectingKey: false,
        expectingValue: false
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
        return state.context ? state.context.indent - indentUnit : 0
      }
      
      return state.context ? state.context.indent : 0
    },
    
    electricChars: "}]",
    
    fold: "brace",
    
    closeBrackets: {
      pairs: '()[]{}""',
      explode: '[]{}',
      override: {
        '"': function(cm) {
          const pos = cm.getCursor()
          const line = cm.getLine(pos.line)
          const after = line.slice(pos.ch)
          
          if (after.charAt(0) === '"') {
            cm.setCursor(pos.line, pos.ch + 1)
            return
          }
          
          cm.replaceSelection('""')
          cm.setCursor(pos.line, pos.ch + 1)
        }
      }
    }
  }
})

CodeMirror.defineMIME("application/vscode-json-enhanced", "vscode-json-enhanced")

export default "vscode-json-enhanced"

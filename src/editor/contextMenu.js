// VS Code-style context menu for CodeMirror editor

export function initContextMenu(editor) {
  let contextMenu = null
  
  // Create context menu HTML
  function createContextMenu() {
    const menu = document.createElement('div')
    menu.className = 'vscode-context-menu'
    menu.innerHTML = `
      <div class="vscode-context-item" data-action="cut">
        <span class="vscode-context-icon">✂️</span>
        <span class="vscode-context-text">Cut</span>
        <span class="vscode-context-shortcut">Ctrl+X</span>
      </div>
      <div class="vscode-context-item" data-action="copy">
        <span class="vscode-context-icon">📋</span>
        <span class="vscode-context-text">Copy</span>
        <span class="vscode-context-shortcut">Ctrl+C</span>
      </div>
      <div class="vscode-context-item" data-action="paste">
        <span class="vscode-context-icon">📄</span>
        <span class="vscode-context-text">Paste</span>
        <span class="vscode-context-shortcut">Ctrl+V</span>
      </div>
      <div class="vscode-context-separator"></div>
      <div class="vscode-context-item" data-action="selectAll">
        <span class="vscode-context-icon">🔘</span>
        <span class="vscode-context-text">Select All</span>
        <span class="vscode-context-shortcut">Ctrl+A</span>
      </div>
      <div class="vscode-context-separator"></div>
      <div class="vscode-context-item" data-action="undo">
        <span class="vscode-context-icon">↶</span>
        <span class="vscode-context-text">Undo</span>
        <span class="vscode-context-shortcut">Ctrl+Z</span>
      </div>
      <div class="vscode-context-item" data-action="redo">
        <span class="vscode-context-icon">↷</span>
        <span class="vscode-context-text">Redo</span>
        <span class="vscode-context-shortcut">Ctrl+Y</span>
      </div>
      <div class="vscode-context-separator"></div>
      <div class="vscode-context-item" data-action="find">
        <span class="vscode-context-icon">🔍</span>
        <span class="vscode-context-text">Find</span>
        <span class="vscode-context-shortcut">Ctrl+F</span>
      </div>
      <div class="vscode-context-item" data-action="replace">
        <span class="vscode-context-icon">🔄</span>
        <span class="vscode-context-text">Replace</span>
        <span class="vscode-context-shortcut">Ctrl+H</span>
      </div>
      <div class="vscode-context-separator"></div>
      <div class="vscode-context-item" data-action="formatDocument">
        <span class="vscode-context-icon">📐</span>
        <span class="vscode-context-text">Format Document</span>
        <span class="vscode-context-shortcut">Shift+Alt+F</span>
      </div>
      <div class="vscode-context-item" data-action="autoIndentJson">
        <span class="vscode-context-icon">🔧</span>
        <span class="vscode-context-text">Auto Indent JSON</span>
        <span class="vscode-context-shortcut">Button in toolbar</span>
      </div>
      <div class="vscode-context-separator"></div>
      <div class="vscode-context-item" data-action="insertLineAbove">
        <span class="vscode-context-icon">⬆️</span>
        <span class="vscode-context-text">Insert Line Above</span>
        <span class="vscode-context-shortcut">Ctrl+Shift+Enter</span>
      </div>
      <div class="vscode-context-item" data-action="insertLineBelow">
        <span class="vscode-context-icon">⬇️</span>
        <span class="vscode-context-text">Insert Line Below</span>
        <span class="vscode-context-shortcut">Ctrl+Enter</span>
      </div>
      <div class="vscode-context-item" data-action="duplicateLine">
        <span class="vscode-context-icon">📄</span>
        <span class="vscode-context-text">Copy Line Down</span>
        <span class="vscode-context-shortcut">Shift+Alt+Down</span>
      </div>
      <div class="vscode-context-item" data-action="moveLineUp">
        <span class="vscode-context-icon">🔼</span>
        <span class="vscode-context-text">Move Line Up</span>
        <span class="vscode-context-shortcut">Alt+Up</span>
      </div>
      <div class="vscode-context-item" data-action="moveLineDown">
        <span class="vscode-context-icon">🔽</span>
        <span class="vscode-context-text">Move Line Down</span>
        <span class="vscode-context-shortcut">Alt+Down</span>
      </div>
    `
    
    document.body.appendChild(menu)
    return menu
  }
  
  // Show context menu at position
  function showContextMenu(x, y) {
    hideContextMenu()
    
    if (!contextMenu) {
      contextMenu = createContextMenu()
    }
    
    // Update menu items based on current state
    updateMenuItems()
    
    contextMenu.style.left = x + 'px'
    contextMenu.style.top = y + 'px'
    contextMenu.style.display = 'block'
    
    // Add click listener to menu items
    contextMenu.addEventListener('click', handleMenuClick)
    
    // Add global click listener to hide menu
    setTimeout(() => {
      document.addEventListener('click', hideContextMenu)
    }, 10)
  }
  
  // Hide context menu
  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.style.display = 'none'
      contextMenu.removeEventListener('click', handleMenuClick)
    }
    document.removeEventListener('click', hideContextMenu)
  }
  
  // Update menu items based on current editor state
  function updateMenuItems() {
    if (!contextMenu) return
    
    const hasSelection = editor.somethingSelected()
    const canUndo = editor.historySize().undo > 0
    const canRedo = editor.historySize().redo > 0
    
    // Enable/disable items based on state
    const cutItem = contextMenu.querySelector('[data-action="cut"]')
    const copyItem = contextMenu.querySelector('[data-action="copy"]')
    const undoItem = contextMenu.querySelector('[data-action="undo"]')
    const redoItem = contextMenu.querySelector('[data-action="redo"]')
    
    if (hasSelection) {
      cutItem.classList.remove('vscode-context-disabled')
      copyItem.classList.remove('vscode-context-disabled')
    } else {
      cutItem.classList.add('vscode-context-disabled')
      copyItem.classList.add('vscode-context-disabled')
    }
    
    if (canUndo) {
      undoItem.classList.remove('vscode-context-disabled')
    } else {
      undoItem.classList.add('vscode-context-disabled')
    }
    
    if (canRedo) {
      redoItem.classList.remove('vscode-context-disabled')
    } else {
      redoItem.classList.add('vscode-context-disabled')
    }
  }
  
  // Helper functions for advanced features
  function formatDocument() {
    const content = editor.getValue()
    try {
      // Try to format as JSON first
      const parsed = JSON.parse(content)
      const formatted = JSON.stringify(parsed, null, 2)
      editor.setValue(formatted)
    } catch (e) {
      // If not JSON, do basic formatting (normalize line endings, trim whitespace)
      const lines = content.split('\n').map(line => line.trimRight())
      const formatted = lines.join('\n').trim()
      editor.setValue(formatted)
    }
  }
  
  function autoIndentJson() {
    // Import and use the enhanced JSON auto-indent function
    import('../editor/jsonEnhancements.js').then(module => {
      module.autoIndentJsonBlocks(editor)
    })
  }
  
  function insertLineAbove() {
    const cursor = editor.getCursor()
    editor.replaceRange('\n', { line: cursor.line, ch: 0 })
    editor.setCursor({ line: cursor.line, ch: 0 })
  }
  
  function insertLineBelow() {
    const cursor = editor.getCursor()
    const lineContent = editor.getLine(cursor.line)
    editor.replaceRange('\n', { line: cursor.line, ch: lineContent.length })
    editor.setCursor({ line: cursor.line + 1, ch: 0 })
  }
  
  function duplicateLine() {
    const cursor = editor.getCursor()
    const lineContent = editor.getLine(cursor.line)
    editor.replaceRange('\n' + lineContent, { line: cursor.line, ch: lineContent.length })
    editor.setCursor({ line: cursor.line + 1, ch: cursor.ch })
  }
  
  function moveLineUp() {
    const cursor = editor.getCursor()
    if (cursor.line === 0) return // Can't move first line up
    
    const currentLine = editor.getLine(cursor.line)
    const previousLine = editor.getLine(cursor.line - 1)
    
    // Replace both lines
    editor.replaceRange(currentLine + '\n' + previousLine, 
      { line: cursor.line - 1, ch: 0 }, 
      { line: cursor.line + 1, ch: 0 })
    
    // Move cursor up
    editor.setCursor({ line: cursor.line - 1, ch: cursor.ch })
  }
  
  function moveLineDown() {
    const cursor = editor.getCursor()
    const lastLine = editor.lastLine()
    if (cursor.line === lastLine) return // Can't move last line down
    
    const currentLine = editor.getLine(cursor.line)
    const nextLine = editor.getLine(cursor.line + 1)
    
    // Replace both lines
    editor.replaceRange(nextLine + '\n' + currentLine, 
      { line: cursor.line, ch: 0 }, 
      { line: cursor.line + 2, ch: 0 })
    
    // Move cursor down
    editor.setCursor({ line: cursor.line + 1, ch: cursor.ch })
  }

  // Handle menu item clicks
  function handleMenuClick(e) {
    e.preventDefault()
    e.stopPropagation()
    
    const item = e.target.closest('.vscode-context-item')
    if (!item || item.classList.contains('vscode-context-disabled')) return
    
    const action = item.dataset.action
    
    switch (action) {
      case 'cut':
        if (editor.somethingSelected()) {
          navigator.clipboard.writeText(editor.getSelection())
          editor.replaceSelection('')
        }
        break
        
      case 'copy':
        if (editor.somethingSelected()) {
          navigator.clipboard.writeText(editor.getSelection())
        }
        break
        
      case 'paste':
        navigator.clipboard.readText().then(text => {
          editor.replaceSelection(text)
        }).catch(err => {
          console.warn('Could not read clipboard:', err)
        })
        break
        
      case 'selectAll':
        editor.execCommand('selectAll')
        break
        
      case 'undo':
        editor.undo()
        break
        
      case 'redo':
        editor.redo()
        break
        
      case 'find':
        editor.execCommand('find')
        break
        
      case 'replace':
        editor.execCommand('replace')
        break
        
      case 'formatDocument':
        formatDocument()
        break
        
      case 'autoIndentJson':
        autoIndentJson()
        break
        
      case 'insertLineAbove':
        insertLineAbove()
        break
        
      case 'insertLineBelow':
        insertLineBelow()
        break
        
      case 'duplicateLine':
        duplicateLine()
        break
        
      case 'moveLineUp':
        moveLineUp()
        break
        
      case 'moveLineDown':
        moveLineDown()
        break
    }
    
    hideContextMenu()
    editor.focus()
  }
  
  // Add right-click listener to editor
  editor.on('contextmenu', (cm, e) => {
    e.preventDefault()
    showContextMenu(e.pageX, e.pageY)
  })
  
  // Hide menu on escape key
  editor.on('keydown', (cm, e) => {
    if (e.key === 'Escape') {
      hideContextMenu()
    }
  })
  
  // Cleanup function
  return function cleanup() {
    if (contextMenu) {
      document.body.removeChild(contextMenu)
      contextMenu = null
    }
    document.removeEventListener('click', hideContextMenu)
  }
}

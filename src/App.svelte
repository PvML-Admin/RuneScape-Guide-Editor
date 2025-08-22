<script>
  import DiscordView from './components/discordView/DiscordView.svelte'
  import ErrorView from './components/errorView/ErrorView.svelte'
  import Toolbar from './components/toolbar/Toolbar.svelte'
  import NotificationCenter from './components/ui/NotificationCenter.svelte'
  import LoadingSpinner from './components/ui/LoadingSpinner.svelte'

  import CodeMirror from 'codemirror'
  import 'codemirror/lib/codemirror.css'
  import 'codemirror/addon/display/placeholder.js'
  // Removed Dracula theme - now using VS Code theme by default
  import 'codemirror/addon/edit/closebrackets'
  import 'codemirror/addon/edit/matchbrackets'
  import 'codemirror/addon/edit/trailingspace'
  import 'codemirror/addon/selection/active-line'
  // JSON mode enhancements
  import 'codemirror/mode/javascript/javascript.js'
  import 'codemirror/addon/fold/foldcode.js'
  import 'codemirror/addon/fold/foldgutter.js'
  import 'codemirror/addon/fold/brace-fold.js'
  import 'codemirror/addon/fold/indent-fold.js'
  // VS Code-like JSON theme and mode
  import './editor/vscodeJsonTheme.css'
  import './editor/vscodeJsonMode.js'
  import './editor/vscodeJsonModeEnhanced.js'
  // Removed debugging CSS that was causing red highlights

  import './editor/autoIndent'
  import { onMount, onDestroy } from 'svelte'
  import {
    updateStyleFormat,
    updateSingleLineStyleFormat
  } from './editor/styleFormat'
  import autoformatText from './editor/autoformat'
  import { 
    shouldUseJsonMode, 
    getEnhancedOptions, 
    toggleJsonMode,
    getEnhancedKeyMap 
  } from './editor/jsonEnhancements'
  import { populateConstants } from './pvmeSettings'
  import { text, activeDropdown } from './stores'
  import { editorFeatures, editorTheme } from './stores/ui'
  import { get } from 'svelte/store'
  import { initContextMenu } from './editor/contextMenu.js'

  let editor
  let validText = $text
  let previewText = $text
  let showView = true
  let scrollBottom = false
  let contextMenuCleanup = null
  let debounceTimer = null
  let codeMirrorWrapper = null

  function closeActiveDropdown() {
    const activeId = get(activeDropdown)
    if (!activeId) return

    // Reset our state first to un-highlight the button
    activeDropdown.set(null)

    // Now, tell Flowbite to hide its element
    try {
      const dropdownElement = document.getElementById(activeId)
      // The toggle button is needed to initialize the Flowbite instance
      const toggleElement = document.querySelector(`[data-dropdown-toggle="${activeId}"]`)

      if (dropdownElement && toggleElement) {
        // @ts-ignore - Flowbite may not be properly typed
        const Dropdown = window.Flowbite?.Dropdown || window.Dropdown
        if (Dropdown) {
          const dropdownInstance = new Dropdown(dropdownElement, toggleElement)
          // Check if it's visible before trying to hide, to avoid errors
          if (dropdownInstance.isVisible()) {
            dropdownInstance.hide()
          }
        } else {
          // Fallback if Flowbite JS isn't loaded or fails
          dropdownElement.classList.add('hidden')
        }
      }
    } catch (error) {
      console.warn(`Flowbite dropdown force close failed:`, error)
    }
  }

  // Global click handler to close dropdowns when clicking outside
  function handleGlobalClick(event) {
    // Check if the click is on a dropdown button or inside a dropdown
    const target = event.target
    const isDropdownButton = target.closest('[data-dropdown-toggle]')
    const isInsideDropdown = target.closest('[id*="Templates"], [id*="Information"], [id*="Options"]')
    const isCodeMirror = target.closest('.CodeMirror')

    // The CodeMirror mousedown event will handle clicks inside the editor.
    // This handler will take care of clicks everywhere else.
    if (!isDropdownButton && !isInsideDropdown && !isCodeMirror) {
      closeActiveDropdown()
    }
  }

  onMount(async () => {
    // Add global click listener
    document.addEventListener('click', handleGlobalClick)
    
    // Base editor configuration - VS Code theme by default
    const baseOptions = {
      mode: 'vscode-json-enhanced',  // Use our enhanced VS Code JSON mode
      theme: $editorTheme,  // Use theme from store
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      autofocus: true,
      tabSize: 2,
      cursorScrollMargin: 12,
      showTrailingSpace: true,
      styleActiveLine: true,
      viewportMargin: Infinity,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
    }
    
    // Apply JSON enhancements if enabled
    const editorOptions = getEnhancedOptions(baseOptions, $editorFeatures.jsonModeEnabled)
    editor = CodeMirror.fromTextArea(document.getElementById('input'), editorOptions)
    
    // Disabled JSON validation to avoid false error highlighting
    // VS Code doesn't show red errors on valid JSON in this context
    // if ($editorFeatures.jsonModeEnabled) {
    //   const { initJsonValidation } = await import('./editor/jsonValidation.js')
    //   initJsonValidation(editor)
    // }

    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.setSize('100%', '100%')
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.on('change', updater)
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.on('inputRead', newInput)

    // *** THE FIX ***
    // We attach a mousedown listener directly to the editor's wrapper element
    // during the CAPTURE phase. This ensures our handler runs BEFORE
    // CodeMirror's internal handlers can stop the event's propagation.
    // @ts-ignore
    codeMirrorWrapper = editor.getWrapperElement()
    codeMirrorWrapper.addEventListener('mousedown', closeActiveDropdown, true)
    
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.on('focus', () => {
      console.log('CodeMirror focus - closing dropdowns')
      activeDropdown.set(null)
    })
    
    // Also add direct DOM event listener to the CodeMirror wrapper
    setTimeout(() => {
      const codeMirrorElement = document.querySelector('.CodeMirror')
      if (codeMirrorElement) {
        codeMirrorElement.addEventListener('mousedown', (e) => {
          console.log('Direct CodeMirror DOM mousedown - closing dropdowns')
          activeDropdown.set(null)
        }, true) // Use capture phase
      }
    }, 100)

    // Base keyboard shortcuts
    const baseKeys = {
      'Ctrl-B': bold,
      'Ctrl-I': italic,
      'Ctrl-U': underline,
      'Ctrl-Alt-S': strikethrough,
      'Ctrl-Alt-1': h1,
      'Ctrl-Alt-2': h2,
      'Ctrl-Alt-3': h3,
      Enter: 'newlineAndIndentContinueMarkdownList',
      Tab: 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList',
      // VS Code-style shortcuts for context menu features
      'Shift-Alt-F': () => {
        // Format document
        const content = editor.getValue()
        try {
          const parsed = JSON.parse(content)
          const formatted = JSON.stringify(parsed, null, 2)
          editor.setValue(formatted)
        } catch (e) {
          const lines = content.split('\n').map(line => line.trimRight())
          const formatted = lines.join('\n').trim()
          editor.setValue(formatted)
        }
      },
      'Ctrl-Shift-Enter': () => {
        // Insert line above
        const cursor = editor.getCursor()
        editor.replaceRange('\n', { line: cursor.line, ch: 0 })
        editor.setCursor({ line: cursor.line, ch: 0 })
      },
      'Ctrl-Enter': () => {
        // Insert line below
        const cursor = editor.getCursor()
        const lineContent = editor.getLine(cursor.line)
        editor.replaceRange('\n', { line: cursor.line, ch: lineContent.length })
        editor.setCursor({ line: cursor.line + 1, ch: 0 })
      },
      'Shift-Alt-Down': () => {
        // Duplicate line
        const cursor = editor.getCursor()
        const lineContent = editor.getLine(cursor.line)
        editor.replaceRange('\n' + lineContent, { line: cursor.line, ch: lineContent.length })
        editor.setCursor({ line: cursor.line + 1, ch: cursor.ch })
      },
      'Ctrl-Shift-I': async () => {
        // Auto-indent JSON blocks
        const { autoIndentJsonBlocks } = await import('./editor/jsonEnhancements.js')
        autoIndentJsonBlocks(editor)
      },
      'Ctrl-Alt-L': async () => {
        // Alternative auto-indent JSON blocks shortcut
        const { autoIndentJsonBlocks } = await import('./editor/jsonEnhancements.js')
        autoIndentJsonBlocks(editor)
      }
    }
    
    // Apply enhanced keyboard shortcuts if JSON mode is enabled
    const keyMap = $editorFeatures.jsonModeEnabled 
      ? getEnhancedKeyMap(editor, baseKeys) 
      : baseKeys
    
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.setOption('extraKeys', keyMap)
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.setValue($text)
    validateText()
    
    // Initialize VS Code-style context menu
    contextMenuCleanup = initContextMenu(editor)
    
    // Make editor globally accessible after initialization
    window.updateEditorContent = function(newContent) {
      if (editor && typeof editor.setValue === 'function') {
        try {
          editor.setValue(newContent)
          $text = newContent
          editor.focus()
          console.log('✅ Global updateEditorContent: Successfully updated editor')
          return true
        } catch (error) {
          console.log('❌ Global updateEditorContent: Error updating editor:', error)
          return false
        }
      }
      console.log('❌ Global updateEditorContent: Editor not available')
      return false
    }
    
    // Also make the editor instance globally accessible for advanced use cases
    window.getEditorInstance = function() {
      return editor
    }
  })

  // Reactive statement to update editor theme when store changes
  $: if (editor && $editorTheme) {
    editor.setOption('theme', $editorTheme)
  }

  onDestroy(() => {
    // Clean up debounce timer on component destruction
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    // Clean up global click listener
    document.removeEventListener('click', handleGlobalClick)
    // Clean up context menu
    if (contextMenuCleanup) {
      contextMenuCleanup()
    }
    // Clean up the direct CodeMirror listener
    if (codeMirrorWrapper) {
      codeMirrorWrapper.removeEventListener('mousedown', closeActiveDropdown, true)
    }
  })

  function newInput(cm, _change) {
    autoformatText(cm)
  }

  // Debounced function to update preview text for real-time updates
  function updatePreviewText() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      previewText = $text
    }, 300) // 300ms delay - adjust as needed
  }

  function validateText() {
    validText = $text
    // Also update preview text immediately when validation passes
    previewText = $text
  }

  function updateInlineFormat(textBeforeSelection, textAfterSelection) {
    updateStyleFormat(editor, textBeforeSelection, textAfterSelection)
    editor.focus()
  }

  function updateLineFormat(lineStartText, lineEndText = '') {
    updateSingleLineStyleFormat(editor, lineStartText, lineEndText)
    editor.focus()
  }

  function bold() {
    updateInlineFormat('**', '**')
  }

  function italic() {
    updateInlineFormat('*', '*')
  }

  function underline() {
    updateInlineFormat('__', '__')
  }

  function strikethrough() {
    updateInlineFormat('~~', '~~')
  }

  function link() {
    updateInlineFormat('[', '](<#>)')
  }

  function h1() {
    updateLineFormat('# ', '\n.tag:[title]')
  }

  function h2() {
    updateLineFormat('## __', '__\n.tag:[tagname]')
  }

  function h3() {
    updateLineFormat('### ')
  }

  function updater(cm, _change) {
    $text = cm.getValue()
    
    // Smart mode detection if enabled
    if ($editorFeatures.smartModeDetection && $editorFeatures.jsonModeEnabled) {
      const shouldUseJson = shouldUseJsonMode($text)
      const currentMode = cm.getOption('mode')
      const isCurrentlyJson = currentMode && currentMode.name === 'javascript'
      
      if (shouldUseJson && !isCurrentlyJson) {
        toggleJsonMode(cm, true)
      } else if (!shouldUseJson && isCurrentlyJson) {
        toggleJsonMode(cm, false)
      }
    }
    
    // Trigger debounced preview update for real-time visualization
    updatePreviewText()
  }

  function command(event) {
    editor.replaceSelection(event.detail.command)
    editor.focus()
  }

  function toggleScrollBottom() {
    scrollBottom = !scrollBottom
    editor.focus()
  }

  function clearEditor() {
    if (confirm('Are you sure you want to clear all text in the editor? This action cannot be undone.')) {
      editor.setValue('')
      $text = ''
      editor.focus()
    }
  }

  async function autoIndentJson() {
    if (editor) {
      const { autoIndentJsonBlocks } = await import('./editor/jsonEnhancements.js')
      const success = autoIndentJsonBlocks(editor)
      if (success) {
        // Optional: Show success notification
        console.log('JSON auto-indented successfully')
      } else {
        // Optional: Show info that no JSON was found or formatted
        console.log('No JSON content found to format')
      }
      editor.focus()
    }
  }

  function insertTemplate(event) {
    if (editor && event.detail) {
      const template = event.detail
      const cursor = editor.getCursor()
      editor.replaceRange('\n' + template + '\n', cursor)
      editor.focus()
    }
  }

  function replaceContent(event) {
    if (editor && event.detail) {
      const newContent = event.detail
      try {
        editor.setValue(newContent)
        $text = newContent
        editor.focus()
        console.log('✅ replaceContent: Successfully updated editor content')
      } catch (error) {
        console.log('❌ replaceContent: Error updating editor:', error)
        // Fallback: just update the text store
        $text = newContent
      }
    } else {
      console.log('⚠️ replaceContent: Editor or event detail not available')
    }
  }

  // Make editor globally accessible for components that need direct access
  function getEditorInstance() {
    return editor
  }
</script>

<main>
  <div class="flex flex-col h-screen bg-gray-900">
    <Toolbar
      {editor}
      on:bold={bold}
      on:italic={italic}
      on:underline={underline}
      on:strikethrough={strikethrough}
      on:h1={h1}
      on:h2={h2}
      on:h3={h3}
      on:link={link}
      on:unorderedList={() => updateLineFormat('⬥ ')}
      on:orderedList={() => updateLineFormat('1. ')}
      on:inlineCode={() => updateInlineFormat('`', '`')}
      on:codeBlock={() => updateInlineFormat('```', '```')}
      on:autoIndentJson={autoIndentJson}
      on:clearEditor={clearEditor}
      on:command={command}
      on:toggleView={() => (showView = !showView)}
      on:toggleScrollBottom={toggleScrollBottom}
      on:insertTemplate={insertTemplate}
      on:replaceContent={replaceContent}
    />
    <div class="flex-grow flex flex-row overflow-auto">
      <div
        class="w-1/2 ml-4 mr-2 mb-4 flex flex-col"
        class:w-full={showView === false}
        class:mr-4={showView === false}
      >
        <textarea
          id="input"
          placeholder="Click ❔ for tips on autoformatting..."
        ></textarea>
        <ErrorView text={$text} on:noCriticalErrors={validateText} />
      </div>
      {#await populateConstants()}
        <div class="ml-2 flex items-center space-x-3">
          <LoadingSpinner size="md" color="white" />
          <p class="text-white">Loading data...</p>
        </div>
      {:then}
        {#if showView}
          <div class="w-1/2 mr-4 ml-2 mb-4 overflow-auto" id="scroll-view">
            <DiscordView text={previewText} {scrollBottom} />
          </div>
        {/if}
      {:catch error}
        <div class="ml-2 p-4 bg-red-600 text-white rounded">
          <p class="font-bold">Failed to load essential data</p>
          <p class="text-sm mt-1">{error.message}</p>
          <button
            class="mt-2 px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
            on:click={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      {/await}
    </div>
  </div>

  <!-- Notification Center -->
  <NotificationCenter />
</main>

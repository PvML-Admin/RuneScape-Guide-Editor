<script>
  import DiscordView from './components/discordView/DiscordView.svelte'
  import ErrorView from './components/errorView/ErrorView.svelte'
  import Toolbar from './components/toolbar/Toolbar.svelte'
  import NotificationCenter from './components/ui/NotificationCenter.svelte'
  import LoadingSpinner from './components/ui/LoadingSpinner.svelte'

  import CodeMirror from 'codemirror'
  import 'codemirror/lib/codemirror.css'
  import 'codemirror/addon/display/placeholder.js'
  import 'codemirror/theme/dracula.css'
  import 'codemirror/addon/edit/closebrackets'
  import 'codemirror/addon/edit/matchbrackets'
  import 'codemirror/addon/edit/trailingspace'
  import 'codemirror/addon/selection/active-line'

  import './editor/autoIndent'
  import { onMount, onDestroy } from 'svelte'
  import {
    updateStyleFormat,
    updateSingleLineStyleFormat
  } from './editor/styleFormat'
  import autoformatText from './editor/autoformat'
  import { populateConstants } from './pvmeSettings'
  import { text, activeDropdown } from './stores'
  import { get } from 'svelte/store'

  let editor
  let validText = $text
  let previewText = $text
  let showView = true
  let scrollBottom = false
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
    
    editor = CodeMirror.fromTextArea(document.getElementById('input'), {
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      autofocus: true,
      tabSize: 2,
      cursorScrollMargin: 12,
      showTrailingSpace: true,
      styleActiveLine: true,
      viewportMargin: Infinity
    })

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

    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.setOption('extraKeys', {
      'Ctrl-B': bold,
      'Ctrl-I': italic,
      'Ctrl-U': underline,
      'Ctrl-Alt-S': strikethrough,
      'Ctrl-Alt-1': h1,
      'Ctrl-Alt-2': h2,
      'Ctrl-Alt-3': h3,
      Enter: 'newlineAndIndentContinueMarkdownList',
      Tab: 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList'
    })
    // @ts-ignore - CodeMirror methods may not be properly typed
    editor.setValue($text)
    validateText()
  })

  onDestroy(() => {
    // Clean up debounce timer on component destruction
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    // Clean up global click listener
    document.removeEventListener('click', handleGlobalClick)
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
</script>

<main>
  <div class="flex flex-col h-screen bg-gray-900">
    <Toolbar
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
      on:clearEditor={clearEditor}
      on:command={command}
      on:toggleView={() => (showView = !showView)}
      on:toggleScrollBottom={toggleScrollBottom}
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

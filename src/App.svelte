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
  import { text } from './stores'

  let editor
  let validText = $text
  let previewText = $text
  let showView = true
  let scrollBottom = false
  let debounceTimer = null

  onMount(async () => {
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

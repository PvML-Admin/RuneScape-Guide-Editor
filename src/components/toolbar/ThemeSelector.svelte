<script>
  import 'flowbite'
  import Palette from 'svelte-bootstrap-icons/lib/Palette.svelte'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import { activeDropdown } from '../../stores'
  import { discordTheme, editorTheme } from '../../stores/ui.js'

  const DROPDOWN_ID = 'ThemeSelector'
  
  // Available Discord themes
  const discordThemes = [
    { id: 'theme-dark', name: 'Dark Theme', description: 'Default Discord dark theme' },
    { id: 'theme-light', name: 'Light Theme', description: 'Discord light theme' }
  ]

  // Available Editor themes
  const editorThemes = [
    { id: 'vscode-json', name: 'VS Code Dark', description: 'VS Code dark theme with JSON highlighting' },
    { id: 'vscode-light', name: 'VS Code Light', description: 'VS Code light theme with JSON highlighting' },
    { id: 'dracula', name: 'Dracula', description: 'Popular dark theme with purple accents' }
  ]
  
  // Reactive statement to track if this dropdown is active
  $: isDropdownOpen = $activeDropdown === DROPDOWN_ID

  // Track dropdown state
  function handleDropdownToggle(event) {
    // Prevent Flowbite from interfering with our state management
    event.preventDefault()
    event.stopPropagation()
    
    if ($activeDropdown === DROPDOWN_ID) {
      activeDropdown.set(null)
    } else {
      activeDropdown.set(DROPDOWN_ID)
    }
  }

  function selectDiscordTheme(themeId) {
    discordTheme.set(themeId)
    activeDropdown.set(null)
  }

  function selectEditorTheme(themeId) {
    editorTheme.set(themeId)
    activeDropdown.set(null)
  }

  // Get current theme names for display
  $: currentDiscordTheme = discordThemes.find(t => t.id === $discordTheme)?.name || 'Dark Theme'
  $: currentEditorTheme = editorThemes.find(t => t.id === $editorTheme)?.name || 'VS Code Dark'
</script>

<button
  id="ThemeSelectorButton"
  data-dropdown-toggle="ThemeSelector"
  type="button"
  class="rounded {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border h-10"
  title="Select Discord theme"
  on:click={handleDropdownToggle}
>
  <Palette />
</button>

<div
  id="ThemeSelector"
  class="z-10 hidden rounded shadow vscode-dropdown"
>
  <div class="m-4 flex-col inline-flex text-white text-left text-sm min-w-max">
    
    <!-- Discord Theme Options -->
    <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">DISCORD THEMES</div>
    
    {#each discordThemes as theme}
      <button
        on:click={() => selectDiscordTheme(theme.id)}
        class="vscode-template-button flex items-center text-left p-3 border {$discordTheme === theme.id ? 'bg-blue-600' : ''}"
        type="button"
        title={theme.description}
      >
        <div class="flex-1">
          <div class="font-medium">{theme.name}</div>
          <div class="text-xs text-gray-400 mt-1">{theme.description}</div>
        </div>
        {#if $discordTheme === theme.id}
          <div class="ml-2 text-blue-400">✓</div>
        {/if}
      </button>
    {/each}
    
    <!-- Separator -->
    <div class="vscode-template-separator my-3 border-t"></div>
    
    <!-- Editor Theme Options -->
    <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">EDITOR THEMES</div>
    
    {#each editorThemes as theme}
      <button
        on:click={() => selectEditorTheme(theme.id)}
        class="vscode-template-button flex items-center text-left p-3 border {$editorTheme === theme.id ? 'bg-blue-600' : ''}"
        type="button"
        title={theme.description}
      >
        <div class="flex-1">
          <div class="font-medium">{theme.name}</div>
          <div class="text-xs text-gray-400 mt-1">{theme.description}</div>
        </div>
        {#if $editorTheme === theme.id}
          <div class="ml-2 text-blue-400">✓</div>
        {/if}
      </button>
    {/each}
    
    <!-- Theme Preview -->
    <div class="vscode-template-separator my-3 border-t"></div>
    <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">CURRENT THEMES</div>
    
    <div class="p-3 border border-gray-600 rounded bg-gray-800">
      <div class="text-xs text-gray-400 mb-2">Active themes:</div>
      <div class="text-sm mb-1"><strong>Discord:</strong> {currentDiscordTheme}</div>
      <div class="text-sm"><strong>Editor:</strong> {currentEditorTheme}</div>
    </div>
    
  </div>
</div>

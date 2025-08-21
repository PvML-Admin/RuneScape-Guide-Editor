<script>
  import 'flowbite'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import { activeDropdown } from '../../stores'

  export let dispatch
  const DROPDOWN_ID = 'CommandOptions'
  
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

  function handleDropdownShow() {
    activeDropdown.set(DROPDOWN_ID)
  }

  function handleDropdownHide() {
    activeDropdown.set(null)
  }

  function selectCommand(command) {
    try {
      // Try to access Dropdown from global flowbite or window
      // @ts-ignore - Flowbite may not be properly typed
      const Dropdown = window.Flowbite?.Dropdown || window.Dropdown
      if (Dropdown) {
        const dropdown = new Dropdown(
          document.getElementById('CommandOptions'),
          document.getElementById('CommandButton')
        )
        dropdown.hide()
      }
    } catch (error) {
      console.warn('Flowbite not available:', error)
    }

    dispatch('command', { command: command })
  }
</script>

<button
  id="CommandButton"
  data-dropdown-toggle="CommandOptions"
  type="button"
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border"
  title="Insert command"
  on:click={handleDropdownToggle}
>
  Command&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="CommandOptions"
  class="z-10 hidden rounded shadow vscode-dropdown"
>
  <div class="m-4 flex-col inline-flex text-white text-left text-sm">
    <button
      title="."
      on:click={() => selectCommand('.')}
      class="rounded-t flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      .
    </button>
    <button
      title=".img:url"
      on:click={() => selectCommand('.img:')}
      class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      .img:url
    </button>
    <button
      title=".tag:word/delete"
      on:click={() => selectCommand('.tag:')}
      class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      .tag:word
    </button>
    <button
      title=".embed:json"
      on:click={() => selectCommand('.embed:json')}
      class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      .embed:json
    </button>
    <button
      title=".componentsV2:json"
      on:click={() => selectCommand('.componentsV2:json')}
      class="rounded-b mb-2 flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      .componentsV2:json
    </button>
    <button
      title="$linkmsg_tagword$"
      on:click={() => selectCommand('$linkmsg_tagword$')}
      class="rounded-t flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
      type="button"
    >
      $linkmsg_tagword$
    </button>
  </div>
</div>

<script>
  import 'flowbite'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'

  export let dispatch

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
  class="inline-flex items-center rounded bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 active:bg-indigo-800 text-sm border border-indigo-700"
  title="Insert command"
>
  Command&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="CommandOptions"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800"
>
  <div class="m-4 flex-col inline-flex text-white text-left text-sm">
    <button
      title="."
      on:click={() => selectCommand('.')}
      class="rounded-t flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      .
    </button>
    <button
      title=".img:url"
      on:click={() => selectCommand('.img:')}
      class="flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      .img:url
    </button>
    <button
      title=".tag:word/delete"
      on:click={() => selectCommand('.tag:')}
      class="flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      .tag:word
    </button>
    <button
      title=".embed:json"
      on:click={() => selectCommand('.embed:json')}
      class="flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      .embed:json
    </button>
    <button
      title=".componentsV2:json"
      on:click={() => selectCommand('.componentsV2:json')}
      class="rounded-b mb-2 flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      .componentsV2:json
    </button>
    <button
      title="$linkmsg_tagword$"
      on:click={() => selectCommand('$linkmsg_tagword$')}
      class="rounded-t flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
      type="button"
    >
      $linkmsg_tagword$
    </button>
  </div>
</div>

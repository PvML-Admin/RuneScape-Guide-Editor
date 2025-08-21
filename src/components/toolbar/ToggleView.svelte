<script>
  import { createEventDispatcher } from 'svelte'
  import Eye from 'svelte-bootstrap-icons/lib/Eye.svelte'
  import EyeSlash from 'svelte-bootstrap-icons/lib/EyeSlash.svelte'

  export let dispatch = createEventDispatcher()
  let showView = true

  function toggleView() {
    showView = !showView
    dispatch('toggleView')
  }
</script>

<button
  on:click={toggleView}
  class="rounded-r inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600 mr-4"
  title="Toggle discord preview. Can help with lag when editing large guides"
  type="button"
>
  {#if showView}
    <Eye />
  {:else}
    <EyeSlash />
  {/if}
</button>

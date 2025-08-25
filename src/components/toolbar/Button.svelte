<script>
  export let corner = ''
  export let title = ''
</script>

<button
  on:click
  class="{corner} inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600 h-10"
  {title}
  type="button"
>
  <slot />
</button>

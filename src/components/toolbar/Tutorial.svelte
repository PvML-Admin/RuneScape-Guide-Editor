<script>
  import QuestionCircle from 'svelte-bootstrap-icons/lib/QuestionCircle.svelte'
  import { onMount } from 'svelte'
  import { activeDropdown } from '../../stores'

  const DROPDOWN_ID = 'TutorialOptions'
  
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

  onMount(async () => {
    document.addEventListener('DOMContentLoaded', (_event) => {
      if (!localStorage.getItem('first-visit')) {
        document.getElementById('TutorialButton').click()
        localStorage.setItem('first-visit', 'false')
      }
    })
  })
</script>

<button
  id="TutorialButton"
  data-dropdown-toggle="TutorialOptions"
  type="button"
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border"
  title="Tutorial"
  on:click={handleDropdownToggle}
>
  Tutorial&nbsp;
</button>

<div
  id="TutorialOptions"
  class="z-10 hidden rounded shadow vscode-dropdown"
  style="max-width:669px"
>
  <div class="m-4 flex-col inline-flex text-white text-left text-sm">
    <h2 class="text-lg">How to use the guide editor</h2>
    <p>
      This guide editor allows us to test out changes to various guides and see
      how they would look in Discord.
    </p>
    <p>
      Various tools can help to start guides from a template, insert formatting,
      and use Discord emojis much easier than doing it manually. Relevant
      information and syntax is described in the <QuestionCircle
        style="display:inline"
      ></QuestionCircle> menu bar icon.
    </p>
  </div>
</div>

<style>
  h2 {
    margin-top: 8px;
  }

  p {
    margin-bottom: 0.3rem;
  }
</style>

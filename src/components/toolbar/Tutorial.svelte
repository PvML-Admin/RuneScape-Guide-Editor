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
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border h-10"
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
    <h2 class="text-lg">How Can I Change an Existing PvME Guide?</h2>
    <p>You most likely arrived here by clicking a link within a PvME guide that prompted you to load a guide into the website. You should see that guide displayed on the page.</p>
    <p>To have changes made to this guide <b>without touching GitHub</b> simply: <br>1. Make your desired changes to the left-hand side of the page<br>2. When satisfied, click the "Export to .txt" button in the menu bar<br>3. Send the .txt file in the <a href="https://discord.com/channels/534508796639182860/1020853673317908500" class="text-blue-400 visited:text-purple-400">PvME Discord #suggestion channel</a><br><br></p>
    <h2 class="text-lg">How to Use the Guide Editor</h2>
    <p>This guide editor allows us to test out changes to various guides and see how they would look in Discord. Additionally, it tells us whenever the syntax of a guide has a problem that requires fixing before it can be merged.</p>
    <p>Various tools can help to start guides from a template, insert formatting, and use Discord emojis much easier than doing it manually. Relevant information and syntax is described in the <QuestionCircle style="display:inline"></QuestionCircle> menu bar icon.</p>
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

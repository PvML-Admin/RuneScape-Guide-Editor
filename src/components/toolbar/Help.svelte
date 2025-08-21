<script>
  import 'flowbite'
  import QuestionCircle from 'svelte-bootstrap-icons/lib/QuestionCircle.svelte'
  import { activeDropdown } from '../../stores'

  const DROPDOWN_ID = 'HelpInformation'
  
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
</script>

<button
  id="HelpButton"
  data-dropdown-toggle="HelpInformation"
  type="button"
  class="rounded-l {isDropdownOpen ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600"
  title="Help"
  on:click={handleDropdownToggle}
>
  <QuestionCircle />
</button>

<div
  id="HelpInformation"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800 overflow-auto"
  style="max-height: 80vh;"
>
  <div class="m-4 flex-col inline-flex text-white text-left text-sm">
    <h2 class="text-lg">Auto formatting</h2>
    <table class="table-auto my-2">
      <thead class="bg-slate-800">
        <tr>
          <th>Input</th>
          <th>Output</th>
          <th>List</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>-></code></td>
          <td><code>→</code></td>
          <td></td>
        </tr>
        <tr>
          <td><code>;gbarge;</code>, <code>;greaterbarge;</code></td>
          <td><code>&lt;:gbarge:535532879250456578&gt;</code></td>
          <td
            ><a
              href="https://raw.githubusercontent.com/pvme/pvme-settings/master/emojis/emojis.json"
              class="text-blue-400 visited:text-purple-400">emojis.json</a
            ></td
          >
        </tr>
        <tr>
          <td><code>;#armour-and-weapons;</code></td>
          <td><code>&lt;#689235882724818962&gt;</code></td>
          <td
            ><a
              href="https://raw.githubusercontent.com/pvme/pvme-settings/pvme-discord/channels.json"
              class="text-blue-400 visited:text-purple-400">channels.json</a
            ></td
          >
        </tr>
        <tr>
          <td><code>;@&pride of zaros;</code></td>
          <td><code>&lt;@&581216406570532875&gt;</code></td>
          <td
            ><a
              href="https://raw.githubusercontent.com/pvme/pvme-settings/pvme-discord/roles.json"
              class="text-blue-400 visited:text-purple-400">roles.json</a
            ></td
          >
        </tr>
        <tr>
          <td><code>;@pleb;</code></td>
          <td><code>&lt;@207588233780002818&gt;</code></td>
          <td
            ><a
              href="https://raw.githubusercontent.com/pvme/pvme-settings/settings/users/users.json"
              class="text-blue-400 visited:text-purple-400">users.json</a
            ></td
          >
        </tr>
      </tbody>
    </table>
    <h2 class="text-lg">Embed auto formatting</h2>
    <p>
      <i
        >*Will be replaced by <a
          href="https://github.com/pvme/guide-editor/issues/9"
          class="text-blue-400 visited:text-purple-400">embed form editor</a
        >.</i
      >
    </p>
    <table class="table-auto my-2">
      <thead class="bg-slate-800">
        <tr>
          <th>Input</th>
          <th>Output</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>;b1;</code>, <code>;u1;</code></td>
          <td><code>⬥&nbsp;</code></td>
        </tr>
        <tr>
          <td><code>;b2;</code>, <code>;u2;</code></td>
          <td><code>\u00a0\u00a0\u00a0\u00a0•&nbsp;</code></td>
        </tr>
        <tr>
          <td><code>;b3;</code>, <code>;u2;</code></td>
          <td
            ><code>\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0-&nbsp;</code
            ></td
          >
        </tr>
        <tr>
          <td><code>;nl;</code>, <code>;newline;</code></td>
          <td><code>\n</code></td>
        </tr>
        <tr>
          <td><code>;empty;</code></td>
          <td><code>\u200B</code></td>
        </tr>
        <tr>
          <td><code>;space;</code></td>
          <td><code>\u00a0</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<style>
  td,
  th {
    padding: 5px;
    border-width: 2px;
    border-color: rgb(30 41 59);
  }

  code {
    background-color: rgb(30 41 59);
    padding: 1px;
  }

  h2 {
    margin-top: 8px;
  }
</style>

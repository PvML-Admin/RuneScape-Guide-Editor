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
  class="rounded-l {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border"
  title="Help"
  on:click={handleDropdownToggle}
>
  <QuestionCircle />
</button>

<div
  id="HelpInformation"
  class="z-10 hidden rounded shadow vscode-dropdown overflow-auto"
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

      </tbody>
    </table>
    <h2 class="text-lg">Embed auto formatting</h2>
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
  /* Table styling for better visibility */
  table {
    border-collapse: separate;
    border-spacing: 0;
    border: 2px solid #4a5568;
    border-radius: 6px;
    overflow: hidden;
  }

  th {
    padding: 8px 12px;
    background-color: #2d3748 !important;
    color: #ffffff !important;
    font-weight: 600;
    border-bottom: 2px solid #4a5568;
    border-right: 1px solid #4a5568;
  }

  th:last-child {
    border-right: none;
  }

  td {
    padding: 8px 12px;
    background-color: #1a202c;
    border-bottom: 1px solid #4a5568;
    border-right: 1px solid #4a5568;
  }

  td:last-child {
    border-right: none;
  }

  tr:last-child td {
    border-bottom: none;
  }

  /* Alternating row colors for better readability */
  tbody tr:nth-child(even) td {
    background-color: #2d3748;
  }

  code {
    background-color: #4a5568 !important;
    color: #e2e8f0 !important;
    padding: 3px 6px !important;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
  }

  /* Links in table */
  td a {
    color: #63b3ed !important;
  }

  td a:visited {
    color: #b794f6 !important;
  }

  td a:hover {
    color: #90cdf4 !important;
  }

  h2 {
    margin-top: 8px;
  }
</style>

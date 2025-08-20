<script>
  import 'flowbite'

  import Button from './Button.svelte'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import Clipboard from 'svelte-bootstrap-icons/lib/Clipboard.svelte'

  let copyPromise = null

  const link = ''

  const embedTextFormatting = `{
  "embed": {
    "title": "__Embed Template Example__",
    "description": "Ask questions if you get stumped",
    "color": 39423,
    "fields": [
      {
        "name": "__Header 1__",
        "value": "⬥ Header 1 subpoint\\n\\u00a0\\u00a0\\u00a0\\u00a0• Header1 subsubpoint\\n\\u200B"
      },
      {
        "name": "__Header 2__",
        "value": "⬥ Header 2 subpoint\\n\\u00a0\\u00a0\\u00a0\\u00a0• Header2 subsubpoint\\n\\u200B"
      },
      {
        "name": "__Header 3__",
        "value": "⬥ Header 3 subpoint\\n\\u00a0\\u00a0\\u00a0\\u00a0• Header3 subsubpoint with hyperlink to google [here](https://www.google.com/)\\n\\u200B"
      }
    ]
  }
}
.embed:json`

  const componentsV2Example = `{
  "type": 17,
  "components": [
    {
      "type": 9,
      "components": [
        {
          "type": 10,
          "content": "### Example Section Title\\nThis is an example of Components V2 with text and media side by side.\\n\\n⬥ **Key Point 1**: Important information here\\n⬥ **Key Point 2**: More details with \`code formatting\`\\n⬥ **Key Point 3**: [Links work too](https://example.com)"
        }
      ],
      "accessory": {
        "type": 11,
        "media": {
          "url": "https://example.com/images/example.png"
        }
      }
    },
    {
      "type": 14,
      "spacing": 2
    },
    {
      "type": 9,
      "components": [
        {
          "type": 10,
          "content": "### Another Section\\nComponents V2 allows for flexible layouts with multiple text and media blocks.\\n\\n**Benefits:**\\n- Rich multimedia content\\n- Flexible spacing\\n- Professional appearance\\n- Mobile responsive"
        }
      ],
      "accessory": {
        "type": 11,
        "media": {
          "url": "https://example.com/images/example2.gif"
        }
      }
    }
  ]
}
.componentsV2:json`

  let templateText = link

  async function copyToClipboard() {
    await new Promise((r) => setTimeout(r, 400))
    try {
      // @ts-ignore - Flowbite may not be properly typed
      const Dropdown = window.Flowbite?.Dropdown || window.Dropdown
      if (Dropdown) {
        const dropdown = new Dropdown(
          document.getElementById('TemplateInformation'),
          document.getElementById('TemplateButton')
        )
        dropdown.hide()
      }
    } catch (error) {
      console.warn('Flowbite not available:', error)
    }
    navigator.clipboard.writeText(templateText)
  }
</script>

<button
  id="TemplateButton"
  data-dropdown-toggle="TemplateInformation"
  type="button"
  class="inline-flex items-center rounded bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 active:bg-indigo-800 text-sm border border-indigo-700"
  title="Templates"
>
  Template&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="TemplateInformation"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800"
>
  <div class="flex-grow flex flex-row">
    <div
      class="ml-4 my-4 mr-2 inline-flex flex-col text-white text-left text-sm"
    >
      <button
        title="Embed formatting"
        on:click={() => (templateText = embedTextFormatting)}
        class="flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
        type="button"
      >
        Embed formatting
      </button>
      <button
        title="Components V2 example"
        on:click={() => (templateText = componentsV2Example)}
        class="flex-wrap text-left bg-indigo-600 hover:bg-indigo-700 p-2 active:bg-indigo-800 border border-indigo-700"
        type="button"
      >
        Components V2
      </button>
    </div>
    <div class="flex-col">
      <div class="pl-2 pr-4 py-4 text-sm text-white flex-grow">
        <pre
          class="overflow-auto bg-slate-800 px-2"
          style="height: 40vh; width: 30vw;">
{templateText}
            </pre>
      </div>
      <div class="flex items-center ml-2 mr-4 mb-4 text-white">
        <Button
          on:click={() => {
            copyPromise = copyToClipboard()
          }}
          corner={'rounded'}
          title="Copy to clipboard"
        >
          <Clipboard></Clipboard>
          &nbsp;Copy
        </Button>
        {#if copyPromise}
          {#await copyPromise}
            <p class="ml-2">☑️ Copied</p>
          {/await}
        {/if}
      </div>
    </div>
  </div>
</div>

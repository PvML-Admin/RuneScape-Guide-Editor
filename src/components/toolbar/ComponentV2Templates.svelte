<script>
  import { createEventDispatcher } from 'svelte'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import Clipboard from 'svelte-bootstrap-icons/lib/Clipboard.svelte'
  import Button from './Button.svelte'

  let selectedTemplate = ''
  let copyPromise

  const templates = {
    'Container (Type 17)': `{
  "type": 17,
  "accent_color": 10454367,
  "components": [
    {
      "type": 10,
      "content": "Your content here"
    }
  ]
}
.componentsV2:json`,

    'Text Content (Type 10)': `{
  "type": 10,
  "content": "Your text content here"
}`,

    'Text with Image Accessory (Type 9)': `{
  "type": 9,
  "components": [
    {
      "type": 10,
      "content": "Your text content here"
    }
  ],
  "accessory": {
    "type": 11,
    "media": {
      "url": "https://example.com/your-image.png"
    }
  }
}`,

    'Text with Button Accessory (Type 9)': `{
  "type": 9,
  "components": [
    {
      "type": 10,
      "content": "Your text content here"
    }
  ],
  "accessory": {
    "type": 2,
    "style": 1,
    "custom_id": "your_button_id",
    "label": "Button Label"
  }
}`,

    'Media Gallery (Type 12)': `{
  "type": 12,
  "items": [
    {
      "media": {
        "url": "https://example.com/image1.png"
      },
      "description": "Image 1 description"
    },
    {
      "media": {
        "url": "https://example.com/image2.png"
      },
      "description": "Image 2 description"
    }
  ]
}`,

    'Media/Image (Type 11)': `{
  "type": 11,
  "media": {
    "url": "https://example.com/your-image.png"
  }
}`,

    'Spacer (Type 14)': `{
  "type": 14,
  "spacing": 1
}`,

    'Button Row (Type 1)': `{
  "type": 1,
  "components": [
    {
      "type": 2,
      "style": 1,
      "custom_id": "button1_id",
      "label": "Button 1"
    },
    {
      "type": 2,
      "style": 2,
      "custom_id": "button2_id",
      "label": "Button 2"
    }
  ]
}`,

    'Select Menu (Type 3)': `{
  "type": 3,
  "custom_id": "select_menu_id",
  "placeholder": "Choose an option",
  "min_values": 1,
  "max_values": 1,
  "options": [
    {
      "label": "Option 1",
      "value": "option1_value",
      "description": "Description for option 1"
    },
    {
      "label": "Option 2", 
      "value": "option2_value",
      "description": "Description for option 2"
    }
  ]
}`,

    'Single Button (Type 2)': `{
  "type": 2,
  "style": 1,
  "custom_id": "your_button_id",
  "label": "Button Label"
}`
  }

  function selectTemplate(templateName) {
    selectedTemplate = templates[templateName]
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(selectedTemplate)
  }

  // Initialize with first template
  selectTemplate('Container (Type 17)')
</script>

<button
  id="ComponentV2TemplatesButton"
  data-dropdown-toggle="ComponentV2Templates"
  type="button"
  class="inline-flex items-center rounded bg-purple-600 hover:bg-purple-700 text-white px-2 py-2 active:bg-purple-800 text-sm border border-purple-700"
  title="Get ComponentV2 templates"
>
  ComponentV2 Templates&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="ComponentV2Templates"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800"
>
  <div class="flex-grow flex flex-row">
    <div
      class="ml-4 my-4 mr-2 inline-flex flex-col text-white text-left text-sm"
    >
      {#each Object.keys(templates) as templateName, index}
        <button
          title={templateName}
          on:click={() => selectTemplate(templateName)}
          class="{index === 0
            ? 'rounded-t'
            : index === Object.keys(templates).length - 1
              ? 'rounded-b'
              : ''} flex-wrap text-left bg-purple-600 hover:bg-purple-700 p-2 active:bg-purple-800 border border-purple-700 min-w-max"
          type="button"
        >
          {templateName}
        </button>
      {/each}
    </div>
    <div class="flex-col">
      <div class="pl-2 pr-4 py-4 text-sm text-white flex-grow">
        <pre
          class="overflow-auto bg-slate-800 px-2"
          style="height: 40vh; width: 45vw;">
{selectedTemplate}
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

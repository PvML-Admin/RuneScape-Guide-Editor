<script>
  import 'flowbite'

  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import Clipboard from 'svelte-bootstrap-icons/lib/Clipboard.svelte'
  import Button from './Button.svelte'
  import { activeDropdown } from '../../stores'

  let selectedTemplate = ''
  let copyPromise
  const DROPDOWN_ID = 'UnifiedTemplates'
  
  // Reactive statement to track if this dropdown is active
  $: isDropdownOpen = $activeDropdown === DROPDOWN_ID

  // Table of Contents functionality (from ToCDropdown.svelte)
  let toc = ''

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

  function getToCChapters() {
    const codeMirrorElement = document.querySelector('.CodeMirror')
    // @ts-ignore - CodeMirror instance attached to DOM element
    const text = codeMirrorElement?.CodeMirror?.getValue() || ''
    const lines = text.split('\n')
    const chapters = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('# ') && line.includes('.tag:[')) {
        const match = line.match(/\.tag:\[([^\]]+)\]/)
        if (match) {
          chapters.push([i + 1, match[1]])
        }
      }
    }
    
    return chapters
  }

  function formatChapters(chapters) {
    return chapters.map(chapter => `[${chapter[1]}]($linkmsg_${chapter[1]}$)`).join('\\n⬥ ')
  }

  function generateCompactToC() {
    const chapters = getToCChapters()
    let chaptersFormatted = ''
    for (const result of chapters) {
      chaptersFormatted += `\\n⬥ [${result[1]}]($linkmsg_${result[1]}$)`
    }

    toc = `{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://example.com/guide-editor/>), or visit <id:customize> and select Entry Editor*${chaptersFormatted}",
    "color": 39423
  }
}
.embed:json
.pin:delete`
  }

  function generateCategorizedToC() {
    const chapters = getToCChapters()
    let fields = []
    for (const chapter of chapters) {
      fields.push(`      {
        "name": "__${chapter[1]}__",
        "value": "[Link]($linkmsg_${chapter[1]}$)",
        "inline": true
      }`)
    }

    toc = `{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://example.com/guide-editor/>), or visit <id:customize> and select Entry Editor*",
    "color": 39423,
    "fields": [
      {
        "name": "__Category__",
        "value": "${formatChapters(chapters)}",
        "inline": true
      }
    ]
  }
}
.embed:json
.pin:delete`
  }

  function generateComponentV2ToC() {
    const chapters = getToCChapters()
    let tocLinks = ''
    
    if (chapters.length > 0) {
      // Generate links from detected chapters
      tocLinks = chapters.map(chapter => `[${chapter[1]}]($linkmsg_${chapter[1]}$)`).join('\\n')
    } else {
      // Generic default template if no chapters detected
      tocLinks = '[Section 1]($linkmsg_section1$)\\n[Section 2]($linkmsg_section2$)\\n[Section 3]($linkmsg_section3$)\\n[Section 4]($linkmsg_section4$)\\n[Conclusion]($linkmsg_conclusion$)'
    }

    toc = `{
  "type": 17,
  "accent_color": 10454367,
  "components": [
    {
      "type": 10,
      "content": "## Table of Contents"
    },
    {
      "type": 14,
      "spacing": 1
    },
    {
      "type": 10,
      "content": "${tocLinks}"
    },
    {
      "type": 14,
      "spacing": 1
    },
    {
      "type": 10,
      "content": "_Customize this footer text or remove this section entirely_"
    }
  ]
}
.componentsV2:json`
  }

  // ComponentV2 Templates functionality
  const componentV2Templates = {
    'Container': `{
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

    'Text Content': `{
  "type": 10,
  "content": "Your text content here"
},`,

    'Text with Image Accessory': `{
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
},`,

    'Text with Button Accessory': `{
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
},`,

    'Media Gallery': `{
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
},`,

    'Media/Image': `{
  "type": 11,
  "media": {
    "url": "https://example.com/your-image.png"
  }
},`,

    'Spacer': `{
  "type": 14,
  "spacing": 1
},`,

    'Button Row': `{
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
},`,

    'Select Menu': `{
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
},`,

    'Single Button': `{
  "type": 2,
  "style": 1,
  "custom_id": "your_button_id",
  "label": "Button Label"
},`
  }

  // Template Menu functionality (basic templates)
  const basicTemplates = {
    'Embed Example': `{
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
.embed:json`,

    'Components V2 Example': `{
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
  }

  function selectTemplate(template) {
    selectedTemplate = template
  }

  async function copyToClipboard() {
    try {
      // @ts-ignore - Flowbite may not be properly typed
      const Dropdown = window.Flowbite?.Dropdown || window.Dropdown
      if (Dropdown) {
        const dropdown = new Dropdown(
          document.getElementById('UnifiedTemplates'),
          document.getElementById('UnifiedTemplatesButton')
        )
        dropdown.hide()
      }
    } catch (error) {
      console.warn('Flowbite not available:', error)
    }
    navigator.clipboard.writeText(selectedTemplate)
  }

  // Initialize with first template
  selectTemplate(basicTemplates['Embed Example'])
</script>

<button
  id="UnifiedTemplatesButton"
  data-dropdown-toggle="UnifiedTemplates"
  type="button"
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600"
  title="Templates and ComponentV2 examples"
  on:click={handleDropdownToggle}
>
  Templates&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="UnifiedTemplates"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800"
>
  <div class="flex-grow flex flex-row">
    <div class="ml-4 my-4 mr-2 inline-flex flex-col text-white text-left text-sm min-w-max">
      
      <!-- Table of Contents Section -->
      <div class="text-xs font-semibold text-gray-400 mb-2 px-2">TABLE OF CONTENTS</div>
      <button
        on:click={() => { generateCompactToC(); selectTemplate(toc); }}
        class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
        type="button"
        title="Generate compact table of contents"
      >
        Compact
      </button>
      <button
        on:click={() => { generateCategorizedToC(); selectTemplate(toc); }}
        class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
        type="button"
        title="Generate categorized table of contents"
      >
        Categorized
      </button>
      <button
        on:click={() => { generateComponentV2ToC(); selectTemplate(toc); }}
        class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600 mb-3"
        type="button"
        title="Generate ComponentV2 table of contents"
      >
        ComponentV2
      </button>

      <!-- Basic Templates Section -->
      <div class="text-xs font-semibold text-gray-400 mb-2 px-2">BASIC TEMPLATES</div>
      {#each Object.keys(basicTemplates) as templateName, index}
        <button
          on:click={() => selectTemplate(basicTemplates[templateName])}
          class="flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
          type="button"
          title={templateName}
        >
          {templateName}
        </button>
      {/each}

      <!-- Separator -->
      <div class="my-3 border-t border-gray-600"></div>

      <!-- ComponentV2 Templates Section -->
      <div class="text-xs font-semibold text-gray-400 mb-2 px-2">COMPONENTV2 TYPES</div>
      {#each Object.keys(componentV2Templates) as templateName, index}
        <button
          on:click={() => selectTemplate(componentV2Templates[templateName])}
          class="{index === Object.keys(componentV2Templates).length - 1 ? 'rounded-b' : ''} flex-wrap text-left bg-gray-700 hover:bg-gray-600 p-2 active:bg-gray-800 border border-gray-600"
          type="button"
          title={templateName}
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
{selectedTemplate || 'Select a template to preview'}
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

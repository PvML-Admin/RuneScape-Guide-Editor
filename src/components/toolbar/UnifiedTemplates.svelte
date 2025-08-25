<script>
  import 'flowbite'

  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import Clipboard from 'svelte-bootstrap-icons/lib/Clipboard.svelte'
  import Button from './Button.svelte'
  import { activeDropdown } from '../../stores'
  import { text } from '../../stores'

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

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  function getToCChapters() {
    // Enhanced logic that works with both embeds and componentsV2
    // Parse .tag:name from text (supports multiple formats)
    const regexp = /\.tag:(\[([^\]]+)\]|([^\n\s]+))/g
    const chapters = [...$text.matchAll(regexp)]
    
    // Process matches to extract tag names
    return chapters.map(match => {
      // match[2] is for .tag:[name] format, match[3] is for .tag:name format
      const tagName = match[2] || match[3]
      return [match.index, tagName]
    })
  }

  function formatChapters(chapters) {
    return chapters.map(chapter => 
      `⬥ [${capitalizeFirstLetter(chapter[1])}]($linkmsg_${chapter[1]}$)`
    ).join('\\n')
  }

  function generateCompactToC() {
    const chapters = getToCChapters()
    const chaptersFormatted = formatChapters(chapters)

    toc = `{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://example.com/guide-editor/>), or visit <id:customize> and select Entry Editor*\\n${chaptersFormatted}",
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
        "name": "__${capitalizeFirstLetter(chapter[1])}__",
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
      // Generate links from detected chapters with capitalization
      tocLinks = chapters.map(chapter => 
        `[${capitalizeFirstLetter(chapter[1])}]($linkmsg_${chapter[1]}$)`
      ).join('\\n')
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

  // PVME Guide Templates
  const pvmeGuideTemplates = {
    'Boss Guide Template': `# __Boss Name__
.img:https://img.pvme.io/images/ssAwdSFcqC.png
*Note: a **Table of Contents** can be found in the pins.*

.
## __Introduction__
.tag:intro
[Intro to the boss, key reasons for hunting it and any overall guide commentary.]

This is an **advanced guide** which assumes a strong underlying knowledge of all mechanics and information presented in <\\#linkbasicguide>.

.
## <:melee:1096130867279171706> __Melee Strategy__ [copy section below for each combat style]
.tag:melee
### __Preset Suggestions__
.tag:presets
{
  "embed": {
    "color": 39423,
    "image": {
      "url": "https://img.pvme.io/images/ULpvc5dTZC.png"
    },
    "fields": [
      {
        "name": "__Presets, Relics and Familiars__",
        "value": "⬥ [Melee - Basic](https://pvme.github.io/preset-maker/#/#linktopreset) <:melee:1096130867279171706>\\n⬥ [Melee - Advanced](https://pvme.github.io/preset-maker/#/linktopreset) <:melee:1096130867279171706>"
      }
    ]
  }
}
.embed:json

.
### __Rotations__
.tag:rotations
This rotation aims for [use one of these patterns: 4:00–4:30 / sub-3m / 15–17s] kill times.

.
**Outside instance**
[At wars / outside gate]

**Inside instance**
[Before boss spawns]

**Main fight**
[When boss spawns]

.
## __Example Kills__
.tag:examples
<:melee:1096130867279171706> Melee example kills - [Youtube Link](<#>)
.

.
Content managed by: [<@123>]
Content maintained by: [<@123>]

.
{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://pvme.io/guide-editor/?id={{channel:id}}>), or visit <id:customize> and select Entry Editor*\\n⬥ [Introduction]($linkmsg_intro$)\\n⬥ [Melee Strategy]($linkmsg_melee$)\\n\\u00a0\\u00a0\\u00a0\\u00a0• [Preset Suggestions]($linkmsg_presets$)\\n\\u00a0\\u00a0\\u00a0\\u00a0• [Rotations]($linkmsg_rotations$)\\n⬥ [Example Kills]($linkmsg_examples$)",
    "color": 39423
  }
}
.embed:json
.pin:delete`,

    'AFK Boss Guide Template': `# __AFK Boss Name__
.img:https://img.pvme.io/images/ssAwdSFcqC.png
*Note: a **Table of Contents** can be found in the pins.*

.
## __Disclaimer__
.tag:disclaimer
⬥ **IF YOU CANNOT GET A METHOD TO WORK __DO NOT__ MESSAGE THE CREATOR(S)**
    • It is **more than likely __user error__ or __cutting corners__**, use <#656898197561802760> if you cannot get it to work

.
## <:melee:1096130867279171706> __Method 1: Melee AFK__ [copy section below for each method]
.tag:method1

.
### __Requirements__
You only need to include things which differ from the lists in <#1251377307315077151>, e.g., situational perks <:demonslayerperk:689502842653900818>, niche items <:iritsticks:690987265371144202> or specific ability unlocks for the action bar]
.
{
  "embed": {
    "description": "⬥ The following **ARE REQUIRED** for this method to work:\\n\\u00a0\\u00a0\\u00a0\\u00a0• **Cutting corners will result in failure**\\n\\u00a0\\u00a0\\u00a0\\u00a0• A more extensive list can be found in <#1251377307315077151>",
    "color": 39423,
    "fields": [
      {
        "name": "__Items__",
        "value": "⬥ [Item](#wiki-link) <emoji>\\n\\u00a0\\u00a0\\u00a0\\u00a0• Notes (if needed)\\n⬥ [Item](#wiki-link) <emoji>\\n\\u00a0\\u00a0\\u00a0\\u00a0• Notes (if needed)"
      },
      {
        "name": "__Abilities__",
        "value": "⬥ [Codex-unlocked abilities](#wiki-link) <emoji>\\n\\u00a0\\u00a0\\u00a0\\u00a0• Notes (if needed)\\n⬥ [Talent Tree abilities](#wiki-link) <emoji>\\n\\u00a0\\u00a0\\u00a0\\u00a0• Notes (if needed)"
      },
      {
        "name": "__Other__",
        "value": "⬥ [Other](#wiki-link) <emoji>\\n\\u00a0\\u00a0\\u00a0\\u00a0• Notes (if needed)"
      }
    ]
  }
}
.embed:json

.
### __Positioning__
.img:https://img.pvme.io/images/SmRV0soAtP.png
⬥ Notes if needed

.
### __Preset Suggestions__
.
{
  "embed": {
    "color": 39423,
    "image": {
      "url": "https://img.pvme.io/images/ULpvc5dTZC.png"
    },
    "fields": [
      {
        "name": "__Presets, Relics and Familiars__",
        "value": "⬥ [Melee - Advanced](https://pvme.github.io/preset-maker/#/#linktopreset) <:melee:1096130867279171706>\\n⬥ [Magic - Advanced](https://pvme.github.io/preset-maker/#/linktopreset) <:magic:689504724159823906>"
      }
    ]
  }
}
.embed:json

.
### __Action Bars__
.img:https://img.pvme.io/images/uDqiLvEHFf.png
⬥ Notes if needed

.
## __Example Kills__
.tag:examples
<:melee:1096130867279171706> Method 1: Melee example kills - [Youtube Link](<#>)
.

.
Content managed by: [<@123>]
Content maintained by: [<@123>]

.
{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://pvme.io/guide-editor/?id={{channel:id}}>), or visit <id:customize> and select Entry Editor*\\n⬥ [Disclaimer]($linkmsg_disclaimer$)\\n⬥ [ Method 1: Melee AFK]($linkmsg_method1$)\\n⬥ [Example Kills]($linkmsg_examples$)",
    "color": 39423
  }
}
.embed:json
.pin:delete`,

    'Slayer Guide Template': `# __[Slayer Creature Name]__
*Note: a **Table of Contents** can be found in the pins.*

.
## __Introduction__
.tag:intro
[Brief overview]

.
### __Stats__
.tag:stats
⬥ <:slayer:797896049548066857> level: X  
⬥ <:slayer:797896049548066857> XP per kill: X  
⬥ Optimal kills per hour: ~X <emoji of combat style 1> (AFK)  
⬥ Optimal <:slayer:797896049548066857> XP per hour: ~X <emoji of combat style 1> (AFK)

.
### __Desirable drops__
.tag:drops
⬥ Name <emoji>
    • Required for the Slayer collection log (remove if not required)

.
## __Location and How to Get there__
[If there are multiple locations, move this section into each Method (after __Requirements__ section)]

[⬥ Notes if needed]
.img:https://img.pvme.io/images/SmRV0soAtP.png

.
## <:melee:1096130867279171706> __Method 1: Melee AFK__ [copy section below for each method]
.tag:method1
[Describe method]
[List other essentials, e.g.:
⬥ Pray <:soulsplit:615613924506599497> and <:sorrow:1137941003895046284>
⬥ Sustain prayer with <:demonhornnecklace:975765831248130079> + <:ectoplasmator:1023152065431744542> and <:powderofpenance:928221126360969226>
⬥ Ensure <:elderovl:841419289831800882>, <:weppoison:689525476158472288> and <:aggressionpotion:925794592199147581> are active at all times]

.
### __Preset Suggestions__
.
{
  "embed": {
    "color": 39423,
    "image": {
      "url": "https://img.pvme.io/images/ULpvc5dTZC.png"
    },
    "fields": [
      {
        "name": "__Presets, Relics and Familiars__",
        "value": "⬥ [Melee - Advanced](https://pvme.github.io/preset-maker/#/#linktopreset) <:melee:1096130867279171706>\\n⬥ [Magic - Advanced](https://pvme.github.io/preset-maker/#/linktopreset) <:magic:689504724159823906>"
      }
    ]
  }
}
.embed:json

.
### __Strategy [Optional section]__
[Use this section if extra guidance is needed, or users find common issues]

.
### __Action Bars__
.img:https://img.pvme.io/images/uDqiLvEHFf.png
⬥ Notes if needed

.
## __Example Kills__
.tag:examples
<:melee:1096130867279171706> Method 1: Melee example kills - [Youtube Link](<#>)
.

.
Content managed by: [<@123>]
Content maintained by: [<@123>]

.
{
  "embed": {
    "title": "__Table of Contents__",
    "description": "*To edit this guide in our web editor [click here](<https://pvme.io/guide-editor/?id={{channel:id}}>), or visit <id:customize> and select Entry Editor*",
    "fields": [
      {
        "name": "__Information__",
        "value": "⬥ [Intro]($linkmsg_intro$)\\n⬥ [Stats]($linkmsg_stats$)\\n⬥ [Drops]($linkmsg_drops$)",
        "inline": true
      },
      {
        "name": "__Methods__",
        "value": "⬥ [Method 1: Melee AFK]($linkmsg_method1$)",
        "inline": true
      }
    ]
  }
}
.embed:json`,

    'Disclaimer Template': `.
> ## ⚠️ Disclaimer
> **This guide may not work after changes to [INSERT DESCRIPTION HERE]**
> Know of a newer method/rotation? Share it in <#1020853673317908500> to help keep this guide up-to-date!
`
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
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border h-10"
  title="Templates and ComponentV2 examples"
  on:click={handleDropdownToggle}
>
  Templates&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="UnifiedTemplates"
  class="z-10 hidden rounded shadow vscode-dropdown"
>
  <div class="flex-grow flex flex-row">
    <div class="ml-4 my-4 mr-2 inline-flex flex-col text-white text-left text-sm min-w-max">
      
      <!-- Table of Contents Section -->
      <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">TABLE OF CONTENTS</div>
      <button
        on:click={() => { generateCompactToC(); selectTemplate(toc); }}
        class="vscode-template-button flex-wrap text-left p-2 border"
        type="button"
        title="Generate compact table of contents"
      >
        Compact
      </button>
      <button
        on:click={() => { generateCategorizedToC(); selectTemplate(toc); }}
        class="vscode-template-button flex-wrap text-left p-2 border"
        type="button"
        title="Generate categorized table of contents"
      >
        Categorized
      </button>
      <button
        on:click={() => { generateComponentV2ToC(); selectTemplate(toc); }}
        class="vscode-template-button flex-wrap text-left p-2 border mb-3"
        type="button"
        title="Generate ComponentV2 table of contents"
      >
        ComponentV2
      </button>

      <!-- Separator -->
      <div class="vscode-template-separator my-3 border-t"></div>

      <!-- Basic Templates Section -->
      <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">BASIC TEMPLATES</div>
      {#each Object.keys(basicTemplates) as templateName, index}
        <button
          on:click={() => selectTemplate(basicTemplates[templateName])}
          class="vscode-template-button flex-wrap text-left p-2 border"
          type="button"
          title={templateName}
        >
          {templateName}
        </button>
      {/each}

      <!-- Separator -->
      <div class="vscode-template-separator my-3 border-t"></div>

      <!-- PVME Guide Templates Section -->
      <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">PVME GUIDE TEMPLATES</div>
      {#each Object.keys(pvmeGuideTemplates) as templateName, index}
        <button
          on:click={() => selectTemplate(pvmeGuideTemplates[templateName])}
          class="vscode-template-button flex-wrap text-left p-2 border"
          type="button"
          title={templateName}
        >
          {templateName}
        </button>
      {/each}

      <!-- Separator -->
      <div class="vscode-template-separator my-3 border-t"></div>

      <!-- ComponentV2 Templates Section -->
      <div class="vscode-template-section-header text-xs font-semibold mb-2 px-2">COMPONENTV2 TYPES</div>
      {#each Object.keys(componentV2Templates) as templateName, index}
        <button
          on:click={() => selectTemplate(componentV2Templates[templateName])}
          class="vscode-template-button {index === Object.keys(componentV2Templates).length - 1 ? 'rounded-b' : ''} flex-wrap text-left p-2 border"
          type="button"
          title={templateName}
        >
          {templateName}
        </button>
      {/each}
    </div>
    
    <div class="flex-col">
      <div class="pl-2 pr-4 py-4 text-sm flex-grow">
        <pre
          class="vscode-template-preview overflow-auto px-2"
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



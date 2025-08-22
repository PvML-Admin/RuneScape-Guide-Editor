<script>
  import { createEventDispatcher } from 'svelte'
  import { activeDropdown } from '../../stores'
  import { text } from '../../stores'
  import Button from './Button.svelte'
  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import ChatDots from 'svelte-bootstrap-icons/lib/ChatDots.svelte'

  const dispatch = createEventDispatcher()
  
  export let editor = null

  // Monitor editor prop changes
  $: {
    if (editor) {
      console.log('Discord Assistant: Editor connected')
    }
  }

  // Function to directly update the editor content
  function updateEditorContent(newContent) {
    // Update the text store first - this is crucial for reactivity
    $text = newContent
    
    // Method 1: Try the passed editor prop directly
    if (editor && typeof editor.setValue === 'function') {
      try {
        editor.setValue(newContent)
        editor.focus()
        return true
      } catch (error) {
        console.log('Editor prop failed:', error)
      }
    }
    
    // Method 2: Try global window function (set up in App.svelte)
    if (typeof window !== 'undefined' && typeof window.updateEditorContent === 'function') {
      try {
        const success = window.updateEditorContent(newContent)
        if (success) return true
      } catch (error) {
        console.log('Global function failed:', error)
      }
    }
    
    // Method 3: Try to find and update the CodeMirror editor directly
    const codeMirrorElement = document.querySelector('.CodeMirror')
    if (codeMirrorElement && codeMirrorElement.CodeMirror) {
      try {
        codeMirrorElement.CodeMirror.setValue(newContent)
        codeMirrorElement.CodeMirror.focus()
        return true
      } catch (error) {
        console.log('CodeMirror direct access failed:', error)
      }
    }
    
    // Method 4: Dispatch event to parent components
    dispatch('replaceContent', newContent)
    
    // Method 5: Delayed retry for event propagation
    setTimeout(() => {
      if (editor && typeof editor.setValue === 'function') {
        try {
          editor.setValue(newContent)
          editor.focus()
        } catch (error) {
          // Silent fail on delayed attempt
        }
      }
    }, 150)
    
    return false
  }

  let isOpen = false
  
  // Shared Discord command patterns
  const discordPatterns = {
    commandAtEnd: /\s*\.(embed|componentsV2|componentsv2):?json\s*$/i,
    malformedCommand: /\.(embed|componentsV2|componentsv2):\s*"?json[^"\n]*"?/gi,
    quotedJson: /\.(embed|componentsV2|componentsv2):\s*"json"/gi,
    bareCommand: /\.(embed|componentsV2|componentsv2)\s*$/gi
  }
     let chatMessages = [
     {
       sender: 'assistant',
       content: `**Discord JSON Assistant**

 Available commands and features:

 **JSON Repair:**
 • \`fix json\` - Automatically fix syntax errors, missing commas, and quotes
 • \`validate json\` - Check JSON structure and Discord format compliance

 **Template Generation:**  
 • \`basic embed\` - Generate simple embed template
 • \`embed with fields\` - Generate embed template with field examples
 • \`basic components\` - Generate ComponentsV2 template
 • \`components with buttons\` - Generate ComponentsV2 template with buttons

 **Reference Information:**
 • \`color codes\` - Discord color values and hex codes
 • \`embed limits\` - Character limits and field restrictions
 • \`button types\` - Available button styles and properties

 **Usage:** Type any command above, or ask questions about Discord JSON formatting, structure, or troubleshooting.`
     }
   ]
   let userInput = ''
   let chatContainer
   let chatInput
   let isProcessing = false

  // Common Discord JSON issues and solutions
  const commonIssues = {
    'missing comma': {
      description: 'Missing commas between JSON properties',
      solution: 'Add commas after each property except the last one',
      example: '{"title": "Test", "description": "Content"}'
    },
    'invalid json': {
      description: 'JSON syntax errors',
      solution: 'Check for missing quotes, brackets, or invalid characters',
      example: 'Use double quotes for strings, not single quotes'
    },
    'embed too long': {
      description: 'Embed content exceeds Discord limits',
      solution: 'Title: 256 chars, Description: 4096 chars, Field names: 256 chars, Field values: 1024 chars',
      example: 'Split long content into multiple fields or embeds'
    },
    'color format': {
      description: 'Invalid color format',
      solution: 'Use decimal numbers (0-16777215) for colors',
      example: 'Red: 16711680, Green: 65280, Blue: 255, Purple: 10181046'
    },
    'componentsv2 type': {
      description: 'ComponentsV2 missing required type field',
      solution: 'ComponentsV2 must have "type": 17',
      example: '{"type": 17, "components": [...]}'
    },
    'button style': {
      description: 'Invalid button style',
      solution: 'Button styles: 1=Primary(blue), 2=Secondary(gray), 3=Success(green), 4=Danger(red), 5=Link',
      example: '{"type": 2, "style": 1, "custom_id": "my_button", "label": "Click Me"}'
    },
    'too many components': {
      description: 'Exceeds Discord component limits',
      solution: 'Max 40 total components, max 5 buttons per action row, max 25 select menu options',
      example: 'Split into multiple messages or reduce component count'
    }
  }

  // Quick fix templates
  const quickTemplates = {
    'basic embed': {
      name: 'Basic Embed',
      json: `{
  "embed": {
    "title": "Your Title Here",
    "description": "Your description here\\n\\nSupports **markdown** formatting!",
    "color": 39423
  }
}`
    },
    'embed with fields': {
      name: 'Embed with Fields',
      json: `{
  "embed": {
    "title": "Guide Title",
    "description": "Main description content",
    "color": 39423,
    "fields": [
      {
        "name": "Field 1",
        "value": "Field content here",
        "inline": true
      },
      {
        "name": "Field 2", 
        "value": "More content",
        "inline": true
      }
    ]
  }
}`
    },
    'basic componentsv2': {
      name: 'Basic ComponentsV2',
      json: `{
  "type": 17,
  "accent_color": 10454367,
  "components": [
    {
      "type": 10,
      "content": "## Your Title Here"
    },
    {
      "type": 14,
      "spacing": 1
    },
    {
      "type": 10,
      "content": "Your content here with **markdown** support!"
    }
  ]
}`
    },
    'componentsv2 with buttons': {
      name: 'ComponentsV2 with Buttons',
      json: `{
  "type": 17,
  "accent_color": 10454367,
  "components": [
    {
      "type": 10,
      "content": "## Interactive Content"
    },
    {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 1,
          "custom_id": "primary_button",
          "label": "Primary Action"
        },
        {
          "type": 2,
          "style": 2,
          "custom_id": "secondary_button",
          "label": "Secondary"
        }
      ]
    }
  ]
}`
    }
  }

     function toggleDropdown() {
     isOpen = !isOpen
     if (isOpen) {
       $activeDropdown = 'discord-assistant'
       // Auto-focus the input when dropdown opens
       setTimeout(() => {
         if (chatInput) {
           chatInput.focus()
         }
       }, 100)
     } else {
       $activeDropdown = null
     }
   }

  function closeDropdown() {
    isOpen = false
    $activeDropdown = null
  }

  // Close dropdown when clicking outside or when another dropdown opens
  $: if ($activeDropdown !== 'discord-assistant' && $activeDropdown !== null) {
    isOpen = false
  }

  function addMessage(sender, content, isInitial = false) {
    if (isInitial && chatMessages.length > 0) return // Don't add initial message if chat already has messages
    
    chatMessages = [...chatMessages, { sender, content, timestamp: new Date() }]
    
    // Scroll to bottom after message is added
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 10)
  }

  function analyzeCurrentJson() {
    const currentText = $text.trim()
    if (!currentText) {
      return 'Editor is empty. No content to analyze.'
    }

    // Look for JSON blocks with flexible matching
    const embedMatch = currentText.match(/\.embed:json\s*\n?([\s\S]*?)(?=\n\.|$)/i)
    const componentMatch = currentText.match(/\.componentsV2:json\s*\n?([\s\S]*?)(?=\n\.|$)/i)
    
    // Also look for other common Discord command formats
    const embedAltMatch = currentText.match(/\.embed\s*\n?([\s\S]*?)(?=\n\.|$)/i)
    const componentAltMatch = currentText.match(/\.componentsv2\s*\n?([\s\S]*?)(?=\n\.|$)/i)
    
    // Look for JSON with command AFTER (reverse pattern)
    const embedReverseMatch = currentText.match(/([\s\S]*?)\.embed:json/i)
    const componentReverseMatch = currentText.match(/([\s\S]*?)\.componentsV2:json/i)
    const embedAltReverseMatch = currentText.match(/([\s\S]*?)\.embed/i)
    const componentAltReverseMatch = currentText.match(/([\s\S]*?)\.componentsv2/i)
    
    // If no Discord command blocks found, check if the entire content looks like JSON
    if (!embedMatch && !componentMatch && !embedAltMatch && !componentAltMatch && 
        !embedReverseMatch && !componentReverseMatch && !embedAltReverseMatch && !componentAltReverseMatch) {
      const trimmedContent = currentText.trim()
      if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
        // Analyze raw JSON
        try {
          const parsed = JSON.parse(trimmedContent)
          let analysis = ['**JSON validation: PASSED**']
          
          // Try to determine what type of JSON this might be
          if (parsed.embed) {
            analysis.push('**Format detected:** Embed JSON (consider adding `.embed:json` suffix)')
            // Check embed limits
            if (parsed.embed.title?.length > 256) {
              analysis.push('**Validation error:** Title exceeds 256 character limit')
            }
            if (parsed.embed.description?.length > 4096) {
              analysis.push('**Validation error:** Description exceeds 4096 character limit')
            }
          } else if (parsed.type === 17) {
            analysis.push('**Format detected:** ComponentsV2 JSON (consider adding `.componentsV2:json` suffix)')
            if (parsed.components?.length > 40) {
              analysis.push('**Validation error:** Component count exceeds limit (max 40)')
            }
          } else {
            analysis.push('**Format detected:** Generic JSON (not Discord-specific)')
          }
          
          return analysis.join('\n')
        } catch (e) {
          return `**JSON validation: FAILED**\n\nSyntax error: ${e.message}\n\nRun "fix json" command to attempt automatic repair.`
        }
      }
      
      return `**No JSON content detected**\n\n**Expected formats:**\n• \`.embed:json\` followed by embed JSON\n• \`.componentsV2:json\` followed by component JSON\n• Raw JSON content for analysis`
    }

    let analysis = []
    
    // Check embed JSON (strict format)
    if (embedMatch) {
      try {
        const embedJson = JSON.parse(embedMatch[1])
        analysis.push('✅ Embed JSON (.embed:json) is valid!')
        
        // Check embed limits
        if (embedJson.embed?.title?.length > 256) {
          analysis.push('⚠️ Title is too long (max 256 characters)')
        }
        if (embedJson.embed?.description?.length > 4096) {
          analysis.push('⚠️ Description is too long (max 4096 characters)')
        }
        if (embedJson.embed?.fields?.length > 25) {
          analysis.push('⚠️ Too many fields (max 25)')
        }
      } catch (e) {
        analysis.push(`❌ Embed JSON (.embed:json) error: ${e.message}`)
      }
    }
    
    // Check embed JSON (alternative format)
    if (embedAltMatch && !embedMatch) {
      try {
        const embedJson = JSON.parse(embedAltMatch[1])
        analysis.push('✅ Embed JSON (.embed) is valid!')
        
        // Check embed limits
        if (embedJson.embed?.title?.length > 256) {
          analysis.push('⚠️ Title is too long (max 256 characters)')
        }
        if (embedJson.embed?.description?.length > 4096) {
          analysis.push('⚠️ Description is too long (max 4096 characters)')
        }
        if (embedJson.embed?.fields?.length > 25) {
          analysis.push('⚠️ Too many fields (max 25)')
        }
      } catch (e) {
        analysis.push(`❌ Embed JSON (.embed) error: ${e.message}`)
      }
    }

    // Check component JSON (strict format)
    if (componentMatch) {
      try {
        const componentJson = JSON.parse(componentMatch[1])
        analysis.push('✅ ComponentsV2 JSON (.componentsV2:json) is valid!')
        
        // Check component limits
        if (componentJson.type !== 17) {
          analysis.push('⚠️ ComponentsV2 must have "type": 17')
        }
        if (componentJson.components?.length > 40) {
          analysis.push('⚠️ Too many components (max 40)')
        }
      } catch (e) {
        analysis.push(`❌ ComponentsV2 JSON (.componentsV2:json) error: ${e.message}`)
      }
    }
    
    // Check component JSON (alternative format)
    if (componentAltMatch && !componentMatch) {
      try {
        const componentJson = JSON.parse(componentAltMatch[1])
        analysis.push('✅ ComponentsV2 JSON (.componentsv2) is valid!')
        
        // Check component limits
        if (componentJson.type !== 17) {
          analysis.push('⚠️ ComponentsV2 must have "type": 17')
        }
        if (componentJson.components?.length > 40) {
          analysis.push('⚠️ Too many components (max 40)')
        }
      } catch (e) {
        analysis.push(`❌ ComponentsV2 JSON (.componentsv2) error: ${e.message}`)
      }
    }
    
    // Check reverse patterns (command after JSON)
    if (embedReverseMatch && !embedMatch && !embedAltMatch) {
      try {
        const embedJson = JSON.parse(embedReverseMatch[1])
        analysis.push('✅ Embed JSON (with .embed:json after) is valid!')
        
        // Check embed limits
        if (embedJson.embed?.title?.length > 256) {
          analysis.push('⚠️ Title is too long (max 256 characters)')
        }
        if (embedJson.embed?.description?.length > 4096) {
          analysis.push('⚠️ Description is too long (max 4096 characters)')
        }
        if (embedJson.embed?.fields?.length > 25) {
          analysis.push('⚠️ Too many fields (max 25)')
        }
      } catch (e) {
        analysis.push(`❌ Embed JSON (with .embed:json after) error: ${e.message}`)
      }
    }
    
    if (embedAltReverseMatch && !embedMatch && !embedAltMatch && !embedReverseMatch) {
      try {
        const embedJson = JSON.parse(embedAltReverseMatch[1])
        analysis.push('✅ Embed JSON (with .embed after) is valid!')
        
        // Check embed limits
        if (embedJson.embed?.title?.length > 256) {
          analysis.push('⚠️ Title is too long (max 256 characters)')
        }
        if (embedJson.embed?.description?.length > 4096) {
          analysis.push('⚠️ Description is too long (max 4096 characters)')
        }
        if (embedJson.embed?.fields?.length > 25) {
          analysis.push('⚠️ Too many fields (max 25)')
        }
      } catch (e) {
        analysis.push(`❌ Embed JSON (with .embed after) error: ${e.message}`)
      }
    }

    return analysis.join('\n')
  }





     function processUserInput() {
     if (!userInput.trim() || isProcessing) return
     
     const input = userInput.trim()
     addMessage('user', input)
     userInput = ''
     isProcessing = true

     // Simple AI-like responses based on keywords
     setTimeout(() => {
       let response = generateResponse(input)
       addMessage('assistant', response)
       isProcessing = false
       
       // Re-focus the input after processing is complete
       setTimeout(() => {
         if (chatInput && isOpen) {
           chatInput.focus()
         }
       }, 100)
     }, 500)
   }

  function generateResponse(input) {
    const lowerInput = input.toLowerCase()
    
    // Fix JSON syntax (flexible matching)
    if (lowerInput.includes('fix') || lowerInput.includes('repair') || 
        lowerInput.includes('syntax error') || lowerInput.includes('invalid json') ||
        lowerInput.includes('fix json') || lowerInput.includes('repair json') ||
        lowerInput.includes('broken') || lowerInput.includes('error')) {
      // Use the same reliable approach as the buttons
      const currentText = $text.trim()
      
      if (!currentText) {
        return `**Error: No content found**\n\nEditor is empty. Paste JSON content before running repair operations.`
      }
      
      let fixedText = currentText
      let fixes = []
      
      // Remove this - we'll do command cleanup LAST instead
      
      // Apply the same reliable fixes
      const beforeCommaFix = fixedText
      fixedText = fixedText.replace(/("[\w\s_]+")(\s*\n\s*)("[\w\s_]+":\s*)/g, '$1,$2$3')
      if (fixedText !== beforeCommaFix) {
        fixes.push('added missing commas after property names')
      }
      
      const beforeValueCommaFix = fixedText
      fixedText = fixedText.replace(/(["}]|\d+|true|false|null)(\s*\n\s*)("[\w\s_]+":\s*)/g, '$1,$2$3')
      if (fixedText !== beforeValueCommaFix) {
        fixes.push('added missing commas after property values')
      }
      
      const beforeArrayCommaFix = fixedText
      fixedText = fixedText.replace(/(})\s*\n\s*({)/g, '$1,\n    $2')
      if (fixedText !== beforeArrayCommaFix) {
        fixes.push('added missing commas between array objects')
      }
      
      const beforeTrailingCommaFix = fixedText
      fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1')
      if (fixedText !== beforeTrailingCommaFix) {
        fixes.push('removed trailing commas')
      }
      
      // 5. Fix unquoted property names (ONLY inside JSON, never touch commands)
      const beforeUnquotedFix = fixedText
      
      // Split content to separate JSON from Discord commands
      const commandMatch = fixedText.match(discordPatterns.commandAtEnd)
      const jsonPart = commandMatch ? fixedText.replace(discordPatterns.commandAtEnd, '').trim() : fixedText
      const commandPart = commandMatch ? commandMatch[0].trim() : ''
      
      // Fix ONLY the JSON part
      let fixedJsonPart = jsonPart
      fixedJsonPart = fixedJsonPart.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3')
      fixedJsonPart = fixedJsonPart.replace(/(\n\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3')
      
      // Reconstruct with original command
      if (commandPart) {
        fixedText = fixedJsonPart + '\n' + commandPart
      } else {
        fixedText = fixedJsonPart
      }
      
      if (fixedText !== beforeUnquotedFix) {
        fixes.push('added quotes around property names')
      }
      
      // 6. Fix single quotes to double quotes
      const beforeQuoteFix = fixedText
      fixedText = fixedText.replace(/'/g, '"')
      if (fixedText !== beforeQuoteFix) {
        fixes.push('changed single quotes to double quotes')
      }
      
      // 7. Fix unquoted string values (basic cases)
      const beforeUnquotedValuesFix = fixedText
      // Fix simple unquoted values like: "key": value -> "key": "value"
      fixedText = fixedText.replace(/("[\w\s_]+"\s*:\s*)([a-zA-Z][a-zA-Z0-9\s]*?)(\s*[,}\]])/g, (match, key, value, end) => {
        // Don't quote boolean values, numbers, or already quoted strings
        if (value.match(/^(true|false|null|\d+(\.\d+)?|".*")$/)) {
          return match
        }
        return key + '"' + value.trim() + '"' + end
      })
      if (fixedText !== beforeUnquotedValuesFix) {
        fixes.push('added quotes around string values')
      }
      

      
      // LAST: Clean up Discord commands (after all JSON fixes to avoid re-quoting)
      const beforeFinalCommandCleanup = fixedText
      fixedText = fixedText.replace(discordPatterns.quotedJson, '.$1:json')
      fixedText = fixedText.replace(discordPatterns.malformedCommand, '.$1:json')
      fixedText = fixedText.replace(discordPatterns.bareCommand, '.$1:json')
      if (fixedText !== beforeFinalCommandCleanup) {
        fixes.push('cleaned Discord command format')
      }

      if (currentText !== fixedText) {
        const success = updateEditorContent(fixedText)
        return `**Applied fixes:**\n${fixes.map(f => '• ' + f).join('\n')}`
      } else {
        return `**No syntax errors detected**\n\nJSON structure appears valid.\n\n**Alternative actions:**\n• Run content analysis for Discord limit validation\n• Check for logical errors in field values\n• Verify structure matches Discord API requirements`
      }
    }
    
    // Analyze current JSON (flexible matching)
    if (lowerInput.includes('analyze') || lowerInput.includes('analyse') || 
        lowerInput.includes('check') || lowerInput.includes('validate') || 
        lowerInput.includes('current') || lowerInput.includes('my json')) {
      return analyzeCurrentJson()
    }
    
    // Common issues
    for (const [key, issue] of Object.entries(commonIssues)) {
      if (lowerInput.includes(key) || lowerInput.includes(key.replace(' ', ''))) {
        return `**${issue.description}**\n\n${issue.solution}\n\nExample: \`${issue.example}\``
      }
    }
    
    // Template requests (flexible matching)
    if (lowerInput.includes('basic embed') || 
        (lowerInput.includes('embed') && (lowerInput.includes('simple') || lowerInput.includes('basic')))) {
      return 'Basic embed template:\n\n```json\n' + quickTemplates['basic embed'].json + '\n```'
    }
    
    if (lowerInput.includes('embed') && lowerInput.includes('field')) {
      return 'Embed with fields template:\n\n```json\n' + quickTemplates['embed with fields'].json + '\n```'
    }
    
    if (lowerInput.includes('componentsv2') || 
        lowerInput.includes('components v2') || 
        lowerInput.includes('componentv2') ||
        lowerInput.includes('component v2') ||
        lowerInput.includes('components') && lowerInput.includes('v2')) {
      if (lowerInput.includes('button')) {
        return 'ComponentsV2 with buttons template:\n\n```json\n' + quickTemplates['componentsv2 with buttons'].json + '\n```'
      } else {
        return 'Basic ComponentsV2 template:\n\n```json\n' + quickTemplates['basic componentsv2'].json + '\n```'
      }
    }
    
    // Color help (flexible matching)
    if (lowerInput.includes('color') || lowerInput.includes('colour') || lowerInput.includes('colors') || lowerInput.includes('colours')) {
      return `**Discord Color Codes (Decimal format):**

🔴 Red: 16711680
🟢 Green: 65280  
🔵 Blue: 255
🟣 Purple: 10181046
🟡 Yellow: 16776960
🟠 Orange: 16753920
⚫ Black: 0
⚪ White: 16777215
🔘 Discord Blurple: 5865242

Use online color pickers to convert hex values to decimal format.`
    }
    
    // Button help (flexible matching)
    if (lowerInput.includes('button') || lowerInput.includes('buttons') || lowerInput.includes('btn')) {
      return `**Discord Button Styles:**

1 = Primary (Blue)
2 = Secondary (Gray)  
3 = Success (Green)
4 = Danger (Red)
5 = Link (requires URL)

**Button Template:**
\`\`\`json
{
  "type": 2,
  "style": 1,
  "custom_id": "unique_id_here",
  "label": "Button Text"
}
\`\`\``
    }
    
    // Generic help
    if (lowerInput.includes('help') || lowerInput.includes('how')) {
      return `**Available operations:**

• **Template generation** - Request "basic embed" or "componentsV2 template"
• **Content analysis** - Run "analyze json" for current editor content
• **Syntax repair** - Execute "fix json" for automatic error correction
• **Reference data** - Query "color codes" or "button styles"
• **Error troubleshooting** - Describe specific error messages

Enter command or question for assistance.`
    }
    
    // Default response
    return `**Command not recognized**

Available operations:
• Template generation (basic embed, componentsV2)
• JSON syntax repair (fix json)
• Content analysis and validation
• Reference information (colors, button styles)

Examples: "basic embed", "fix json", "analyze json", "color codes"`
  }

  function insertTemplate(templateKey) {
    const template = quickTemplates[templateKey]
    if (template) {
      const templateContent = '\n' + template.json + '\n'
      
      // Use our robust updateEditorContent function
      const success = updateEditorContent(templateContent)
      
      // Fallback to event dispatch if direct update failed
      if (!success) {
      dispatch('insertTemplate', template.json)
      }
      
      addMessage('assistant', `**Template inserted: ${template.name}**\n\nContent added to editor. Customize fields as needed.`)
    }
  }
</script>

<div class="relative">
     <button
     on:click={toggleDropdown}
     title="Discord JSON Assistant - Get help with embeds and components"
     class="inline-flex items-center rounded {isOpen ? 'bg-gray-700 border-white' : 'bg-gray-700 border-gray-600'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border"
   >
     <ChatDots />
     <span class="ml-1">Assistant</span>
     <CaretDownFill class="ml-1" />
   </button>

  {#if isOpen}
    <div class="absolute top-full left-0 mt-1 w-[600px] border border-gray-600 rounded-lg shadow-lg z-50 discord-assistant-dropdown vscode-dropdown">
      <!-- Chat Header -->
      <div class="p-3 border-b border-gray-600 flex justify-between items-center">
        <h3 class="text-white font-semibold">JSON Assistant</h3>
        <button on:click={closeDropdown} class="text-gray-400 hover:text-white">✕</button>
      </div>
      


      <!-- Chat Messages -->
      <div bind:this={chatContainer} class="h-96 overflow-y-auto p-5 space-y-3">
        {#each chatMessages as message}
          <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-lg p-3 rounded-lg {message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} text-sm leading-relaxed">
              {#if message.content.includes('```json')}
                {@html message.content.replace(/```json\n([\s\S]*?)\n```/g, '<pre class="bg-gray-900 p-2 rounded mt-1 text-xs overflow-x-auto"><code>$1</code></pre>')}
              {:else}
                {@html message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
              {/if}
            </div>
          </div>
        {/each}
        
        {#if isProcessing}
          <div class="flex justify-start">
            <div class="bg-gray-700 text-gray-100 p-2 rounded-lg text-sm">
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Chat Input -->
      <div class="p-4 border-t border-gray-600">
                 <form on:submit|preventDefault={processUserInput} class="flex space-x-2">
           <input
             bind:this={chatInput}
             bind:value={userInput}
             placeholder="Type command or question..."
             class="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
             disabled={isProcessing}
             on:keydown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault()
                 processUserInput()
               }
             }}
           />
           <button
             type="submit"
             disabled={!userInput.trim() || isProcessing}
             class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm"
           >
             Send
           </button>
         </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .discord-assistant-dropdown {
    max-height: 700px;
  }
  
  :global(.discord-assistant-dropdown pre) {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  :global(.discord-assistant-dropdown code) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
  }
</style>


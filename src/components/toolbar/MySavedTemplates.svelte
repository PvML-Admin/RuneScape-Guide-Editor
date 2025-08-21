<script>
  import 'flowbite'

  import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte'
  import Clipboard from 'svelte-bootstrap-icons/lib/Clipboard.svelte'
  import Plus from 'svelte-bootstrap-icons/lib/Plus.svelte'
  import Trash from 'svelte-bootstrap-icons/lib/Trash.svelte'
  import PencilSquare from 'svelte-bootstrap-icons/lib/PencilSquare.svelte'
  import Download from 'svelte-bootstrap-icons/lib/Download.svelte'
  import Upload from 'svelte-bootstrap-icons/lib/Upload.svelte'
  import Button from './Button.svelte'
  import { text, activeDropdown } from '../../stores'

  let selectedTemplate = ''
  let copyPromise
  let savedTemplates = []
  let showSaveDialog = false
  let saveTemplateName = ''
  let editingTemplate = null
  let editName = ''
  const DROPDOWN_ID = 'MySavedTemplates'
  
  // Reactive statement to track if this dropdown is active
  $: isDropdownOpen = $activeDropdown === DROPDOWN_ID

  // Load saved templates from localStorage
  function loadSavedTemplates() {
    try {
      const stored = localStorage.getItem('mySavedTemplates')
      if (stored) {
        savedTemplates = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load saved templates:', error)
      savedTemplates = []
    }
  }

  // Save templates to localStorage
  function saveSavedTemplates() {
    try {
      localStorage.setItem('mySavedTemplates', JSON.stringify(savedTemplates))
    } catch (error) {
      console.warn('Failed to save templates:', error)
    }
  }

  // Load templates on component mount
  loadSavedTemplates()

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

  function selectTemplate(template) {
    selectedTemplate = template.content
  }

  async function copyToClipboard() {
    try {
      // @ts-ignore - Flowbite may not be properly typed
      const Dropdown = window.Flowbite?.Dropdown || window.Dropdown
      if (Dropdown) {
        const dropdown = new Dropdown(
          document.getElementById('MySavedTemplates'),
          document.getElementById('MySavedTemplatesButton')
        )
        dropdown.hide()
      }
    } catch (error) {
      console.warn('Flowbite not available:', error)
    }
    navigator.clipboard.writeText(selectedTemplate)
  }

  function openSaveDialog() {
    // Check if there's content in the editor
    if (!$text.trim()) {
      alert('Please add some content to the editor before saving a template.')
      return
    }
    
    showSaveDialog = true
    saveTemplateName = ''
  }

  function closeSaveDialog() {
    showSaveDialog = false
    saveTemplateName = ''
  }

  function saveTemplate() {
    if (!saveTemplateName.trim()) {
      alert('Please provide a name for the template.')
      return
    }

    if (!$text.trim()) {
      alert('No content found in the editor to save.')
      return
    }

    const newTemplate = {
      id: Date.now(),
      name: saveTemplateName.trim(),
      content: $text.trim(),
      createdAt: new Date().toISOString()
    }

    savedTemplates = [...savedTemplates, newTemplate]
    saveSavedTemplates()
    closeSaveDialog()
    
    // Select the newly saved template
    selectTemplate(newTemplate)
  }

  function deleteTemplate(templateId) {
    if (confirm('Are you sure you want to delete this template?')) {
      savedTemplates = savedTemplates.filter(t => t.id !== templateId)
      saveSavedTemplates()
      
      // Clear selected template if it was deleted
      const deletedTemplate = savedTemplates.find(t => t.id === templateId)
      if (deletedTemplate && selectedTemplate === deletedTemplate.content) {
        selectedTemplate = savedTemplates.length > 0 ? savedTemplates[0].content : ''
      }
    }
  }

  function startEdit(template) {
    editingTemplate = template.id
    editName = template.name
  }

  function saveEdit(templateId) {
    if (!editName.trim()) {
      alert('Template name cannot be empty.')
      return
    }

    savedTemplates = savedTemplates.map(t => 
      t.id === templateId ? { ...t, name: editName.trim() } : t
    )
    saveSavedTemplates()
    editingTemplate = null
    editName = ''
  }

  function cancelEdit() {
    editingTemplate = null
    editName = ''
  }

  // Export templates to JSON file
  function exportTemplates() {
    if (savedTemplates.length === 0) {
      alert('No templates to export.')
      return
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: savedTemplates
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `my-saved-templates-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Import templates from JSON file
  function importTemplates(event) {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target.result
        if (typeof result !== 'string') {
          throw new Error('Failed to read file content.')
        }
        const importData = JSON.parse(result)
        
        // Validate import data structure
        if (!importData.templates || !Array.isArray(importData.templates)) {
          throw new Error('Invalid template file format.')
        }

        // Validate each template has required fields
        const validTemplates = importData.templates.filter(template => 
          template.name && template.content && typeof template.name === 'string' && typeof template.content === 'string'
        )

        if (validTemplates.length === 0) {
          alert('No valid templates found in the file.')
          return
        }

        // Ask user how to handle import
        const action = confirm(
          `Found ${validTemplates.length} template(s) to import.\n\n` +
          'Click "OK" to ADD to existing templates\n' +
          'Click "Cancel" to REPLACE all existing templates'
        )

        if (action) {
          // Add to existing templates (with new IDs to avoid conflicts)
          const newTemplates = validTemplates.map(template => ({
            ...template,
            id: Date.now() + Math.random(), // Ensure unique ID
            importedAt: new Date().toISOString()
          }))
          savedTemplates = [...savedTemplates, ...newTemplates]
        } else {
          // Replace existing templates
          savedTemplates = validTemplates.map(template => ({
            ...template,
            id: Date.now() + Math.random(), // Ensure unique ID
            importedAt: new Date().toISOString()
          }))
        }

        saveSavedTemplates()
        
        // Select first imported template
        if (savedTemplates.length > 0) {
          selectTemplate(savedTemplates[savedTemplates.length - 1])
        }

        alert(`Successfully imported ${validTemplates.length} template(s)!`)
        
      } catch (error) {
        console.error('Import error:', error)
        alert(`Failed to import templates: ${error.message}`)
      }
    }
    
    reader.readAsText(file)
    // Reset file input
    event.target.value = ''
  }

  // Initialize with first template if available
  $: if (savedTemplates.length > 0 && !selectedTemplate) {
    selectTemplate(savedTemplates[0])
  }
</script>

<button
  id="MySavedTemplatesButton"
  data-dropdown-toggle="MySavedTemplates"
  type="button"
  class="inline-flex items-center rounded {isDropdownOpen ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700'} hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600"
  title="My saved templates"
  on:click={handleDropdownToggle}
>
  My Saved Templates&nbsp;<CaretDownFill class="mt-1"></CaretDownFill>
</button>

<div
  id="MySavedTemplates"
  class="z-10 hidden rounded shadow bg-slate-700 border border-slate-800"
>
  <div class="flex-grow flex flex-row">
    <div class="ml-4 my-4 mr-2 inline-flex flex-col text-white text-left text-sm min-w-max">
      <!-- Add New Template Button -->
      <button
        on:click={openSaveDialog}
        class="flex items-center gap-2 rounded-t bg-green-600 hover:bg-green-500 p-2 active:bg-green-700 border border-green-500 min-w-max"
        type="button"
        title="Save new template"
      >
        <Plus width={14} height={14} />
        Save New Template
      </button>
      
      <!-- Import/Export Buttons -->
      <div class="flex">
        <button
          on:click={exportTemplates}
          class="flex items-center gap-2 flex-1 bg-gray-600 hover:bg-gray-500 p-2 active:bg-gray-700 border border-gray-500 min-w-max"
          type="button"
          title="Export templates to file"
        >
          <Download width={14} height={14} />
          Export
        </button>
        <label
          class="flex items-center gap-2 flex-1 bg-gray-600 hover:bg-gray-500 p-2 active:bg-gray-700 border border-gray-500 min-w-max cursor-pointer"
          title="Import templates from file"
        >
          <Upload width={14} height={14} />
          Import
          <input
            type="file"
            accept=".json"
            on:change={importTemplates}
            class="hidden"
          />
        </label>
      </div>
      
      <!-- Saved Templates List -->
      {#each savedTemplates as template, index}
        <div class="flex items-center {index === savedTemplates.length - 1 ? 'rounded-b' : ''} bg-gray-600 border border-gray-500">
          {#if editingTemplate === template.id}
            <input
              bind:value={editName}
              class="flex-1 bg-gray-700 text-white p-2 border-none outline-none text-sm"
              placeholder="Template name"
              on:keydown={(e) => {
                if (e.key === 'Enter') saveEdit(template.id)
                if (e.key === 'Escape') cancelEdit()
              }}
            />
            <button
              on:click={() => saveEdit(template.id)}
              class="px-2 py-2 hover:bg-gray-500"
              title="Save changes"
            >
              ✓
            </button>
            <button
              on:click={cancelEdit}
              class="px-2 py-2 hover:bg-gray-500"
              title="Cancel"
            >
              ✕
            </button>
          {:else}
            <button
              on:click={() => selectTemplate(template)}
              class="flex-1 text-left hover:bg-gray-500 p-2 active:bg-gray-700 min-w-max truncate"
              type="button"
              title={template.name}
            >
              {template.name}
            </button>
            <button
              on:click={() => startEdit(template)}
              class="px-2 py-2 hover:bg-gray-500"
              title="Rename template"
            >
              <PencilSquare width={12} height={12} />
            </button>
            <button
              on:click={() => deleteTemplate(template.id)}
              class="px-2 py-2 hover:bg-gray-500"
              title="Delete template"
            >
              <Trash width={12} height={12} />
            </button>
          {/if}
        </div>
      {/each}
      
      {#if savedTemplates.length === 0}
        <div class="rounded-b bg-slate-600 p-3 text-gray-300 text-xs italic">
          No saved templates yet.<br/>
          Click "Save New Template" to get started.
        </div>
      {/if}
    </div>
    
    <div class="flex-col">
      <div class="pl-2 pr-4 py-4 text-sm text-white flex-grow">
        <pre
          class="overflow-auto bg-slate-800 px-2"
          style="height: 40vh; width: 45vw;">
{selectedTemplate || 'Select a template to preview'}
        </pre>
      </div>
      <div class="flex items-start ml-2 mr-4 mb-4 gap-4">
        <div class="flex items-center text-white">
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
        
        <!-- Storage Disclaimer -->
        <div class="flex-1 p-2 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded text-yellow-200 text-xs">
          <div class="flex items-start gap-2">
            <span class="text-yellow-400 mt-0.5">⚠️</span>
            <div>
              <strong>Note:</strong> This is stored in your local browser storage and will be removed if you clear your browsing data for this website.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Save Template Dialog -->
{#if showSaveDialog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-slate-700 rounded-lg p-6 w-96 max-w-full mx-4">
      <h3 class="text-white text-lg font-semibold mb-4">Save Current Editor Content</h3>
      
      <div class="mb-4">
        <p class="text-gray-300 text-sm mb-3">
          This will save your current editor content as a reusable template.
        </p>
        
        <label for="template-name" class="block text-white text-sm font-medium mb-2">
          Template Name
        </label>
        <input
          id="template-name"
          bind:value={saveTemplateName}
          class="w-full px-3 py-2 bg-slate-600 text-white border border-slate-500 rounded focus:border-green-500 focus:outline-none"
          placeholder="Enter template name..."
          maxlength="50"
          on:keydown={(e) => {
            if (e.key === 'Enter') saveTemplate()
            if (e.key === 'Escape') closeSaveDialog()
          }}
        />
      </div>
      
      <div class="flex gap-3 justify-end">
        <button
          on:click={closeSaveDialog}
          class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
        >
          Cancel
        </button>
        <button
          on:click={saveTemplate}
          class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
        >
          Save Template
        </button>
      </div>
    </div>
  </div>
{/if}

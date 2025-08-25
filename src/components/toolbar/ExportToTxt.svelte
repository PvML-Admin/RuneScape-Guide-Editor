<script>
  import { text } from './../../stores'

  function exportText() {
    // Extract the first header from the text for the filename
    function getFirstHeader(text) {
      const lines = text.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Check for markdown headers (# Header)
        if (trimmedLine.startsWith('#')) {
          return trimmedLine.replace(/^#+\s*/, '').trim()
        }
        
        // Check for embed titles ("title": "Header")
        const titleMatch = trimmedLine.match(/"title":\s*"([^"]+)"/)
        if (titleMatch) {
          return titleMatch[1].trim()
        }
        
        // Check for .tag: markers (.tag:header)
        const tagMatch = trimmedLine.match(/\.tag:\[?([^\]]+)\]?/)
        if (tagMatch) {
          return tagMatch[1].trim()
        }
      }
      
      return null
    }
    
    // Clean filename to remove invalid characters
    function sanitizeFilename(name) {
      return name
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .substring(0, 100) // Limit length
    }
    
    // Get the filename
    const firstHeader = getFirstHeader($text)
    const filename = firstHeader 
      ? `${sanitizeFilename(firstHeader)}.txt`
      : 'GuideEditorExport.txt'
    
    const file = new File([$text], filename, {
      type: 'text/plain'
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
</script>

<button
  on:click={exportText}
  class="inline-flex items-center rounded bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600 h-10"
  title="Export to text file"
  type="button"
>
  Export to .txt file
</button>

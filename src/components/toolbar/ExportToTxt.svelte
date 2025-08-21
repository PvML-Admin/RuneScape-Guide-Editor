<script>
  import { text } from './../../stores'

  function exportText() {
    const file = new File([$text], 'GuideEditorExport.txt', {
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
  class="inline-flex items-center rounded bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 active:bg-gray-800 text-sm border border-gray-600"
  title="Export to text file"
  type="button"
>
  Export to .txt file
</button>

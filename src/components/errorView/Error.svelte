<script>
  export let error

  function formatErrorLine(line) {
    return line[0] === line[1] ? `line: ${line[0]}` : `lines: ${line.join('-')}`
  }

  function formatErrorEmoji(errorType) {
    let emoji = ''
    switch (errorType) {
      case 'error':
        emoji = '❌'
        break
      case 'warn':
      case 'warning':
        emoji = '⚠'
        break
      default:
        emoji = errorType
    }
    return emoji
  }
</script>

<tr>
  <td>{formatErrorLine(error.line)}</td>
  <td>{@html formatErrorEmoji(error.type)} {error.text}</td>
</tr>

<style>
  td {
    font-size: 14px;
    color: #d4d4d4; /* VS Code text color to match editor */
    padding: 4px 8px; /* Better spacing */
  }
  
  /* Style the table row for better VS Code appearance */
  tr:hover {
    background-color: rgba(255, 255, 255, 0.04); /* Subtle hover like VS Code */
  }
</style>

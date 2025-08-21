import { toHTML, rules, htmlTag } from '@riskymh/discord-markdown'
import { channels, users, roles } from './pvmeSettings'
import markdown from 'simple-markdown'
import { sanitizeDiscordContent, sanitizeURL } from './utils/sanitizer.js'

/* Disable list formatting (work-around)
For more info, see: https://github.com/pvme/guide-editor/issues/27
*/
rules.list.match = () => {
  return false
}

/* Disable header formatting for normal message content (matches Discord behavior)
Headers (# ## ###) only work in ComponentsV2 contexts, not in regular Discord messages
*/
const originalHeadingMatch = rules.heading.match
rules.heading.match = (source, state, prevCapture) => {
  // Check if we're in ComponentsV2 context by looking at the call stack
  const isComponentContext = new Error().stack?.includes('renderTextContent')
  
  if (isComponentContext && typeof originalHeadingMatch === 'function') {
    return originalHeadingMatch(source, state, prevCapture)
  }
  
  // Disable headers in normal message context (matches Discord behavior)
  return false
}

/* Overide blockquote formatting to use discord format. 
FROM:
<blockquote>text<br>more text</blockquote>

TO:
<div class="blockquoteContainer">
    <div class="blockquoteDivider"></div><blockquote>text<br>more text</blockquote>
</div> */
rules.blockQuote.html = (node, output, state) => {
  // todo: make sure output(node.content, state) is correct
  const blockQuote = htmlTag(
    'blockquote',
    output(node.content, state),
    null,
    state
  )
  const divider = '<div class="blockquoteDivider"></div>' + blockQuote
  return htmlTag('div', divider, { class: 'blockquoteContainer' }, state)
}

/* Overide inline code formatting to use discord format.
FROM:
<code>text</code>

TO:
<code class="inline">text</code> */
rules.inlineCode.html = (node, output, state) => {
  return htmlTag(
    'code',
    markdown.sanitizeText(node.content.trim()),
    { class: 'inline' },
    state
  )
}

/**
 * Post-process Discord subtext formatting (-#) after markdown conversion
 * @param {string} htmlContent - HTML content from markdown processor
 * @returns {string} - Content with -# converted to Discord subtext divs
 */
function formatDiscordSubtext(htmlContent) {
  if (!htmlContent) return htmlContent

  let result = htmlContent

  // Pre-process: Handle -# before standard markdown processing interferes
  // Split the HTML into lines and process each line individually
  const lines = result.split(/(<br\s*\/?>|<\/p><p>|<p>|<\/p>)/i)
  
  const processedLines = lines.map(line => {
    // Skip HTML tags
    if (line.match(/^<[^>]+>$/)) {
      return line
    }
    
    const trimmedLine = line.trim()
    
    // Only process lines that start with -# (and aren't already processed)
    if (trimmedLine.match(/^-#\s+/) && !line.includes('discord-subtext')) {
      const subtextContent = trimmedLine.replace(/^-#\s+/, '')
      return `<div class="discord-subtext">${subtextContent}</div>`
    }
    
    return line
  })
  
  result = processedLines.join('')
  
  // Clean up any remaining paragraph tags around subtext
  result = result.replace(/<p><div class="discord-subtext">(.*?)<\/div><\/p>/g, '<div class="discord-subtext">$1</div>')

  return result
}

// add attachmentUrls for links not contained in <url>
let messageAttachments = []

rules.url.parse = (capture) => {
  const sanitizedUrl = sanitizeURL(capture[1])
  const urlToUse = sanitizedUrl || '#'
  messageAttachments.push(urlToUse)
  return {
    content: [
      {
        type: 'text',
        content: urlToUse
      }
    ],
    target: urlToUse
  }
}

function formatSpecialChannels(originalContent) {
  /* Overide inline code formatting to use discord format.
    FROM:
    <id:customize>
    <id:guide>

    TO:
    <span class="d-mention d-channel">#Channels & Roles</span>
    <span class="d-mention d-channel">#Server Guide</span>
    */

  // known bug: currently formats links in code blocks
  let content = originalContent

  content = content.replaceAll(
    '&lt;id:customize&gt;',
    `<span class="d-mention d-channel">#Channels & Roles</span>`
  )
  // content.replaceAll('&lt;id:customize&gt;', "hi");
  content = content.replaceAll(
    '&lt;id:guide&gt;',
    `<span class="d-mention d-channel">#Server Guide</span>`
  )
  // content.replaceAll('cool', 'not');

  return content
}

export default function markdownToHTML(messageContent) {
  // todo: linkmsg formatting
  messageAttachments = []

  // convert discord markdown to HTML
  let content = toHTML(messageContent, {
    discordCallback: {
      channel: (node) => '#' + channels[node.id],
      user: (node) => '@' + users[node.id],
      role: (node) => '@' + roles[node.id]
    },
    // allow for named links: [name](url)
    // may need to be disabled for embed titles? but should never happen
    embed: true
  })

  // format <id:guide> and <id:customize>
  content = formatSpecialChannels(content)

  // Post-process Discord subtext (-#) after markdown conversion
  content = formatDiscordSubtext(content)

  // Final sanitization step
  content = sanitizeDiscordContent(content)

  return { content, messageAttachments }
}

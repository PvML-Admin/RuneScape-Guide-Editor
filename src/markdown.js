import { toHTML, rules, htmlTag } from '@riskymh/discord-markdown'
import { channels, users, roles, pvmeSpreadsheet } from './pvmeSettings'
import markdown from 'simple-markdown'
import { sanitizeDiscordContent, sanitizeURL } from './utils/sanitizer.js'

/* Disable list formatting (work-around)
For more info, see: https://github.com/pvme/guide-editor/issues/27
*/
rules.list.match = () => {
  return false
}

/* Headers work everywhere now - no conflicts with -# processing */

/* Add support for h3 headers (###) since discord-markdown might not support them by default */
const originalHeadingMatch = rules.heading.match
const originalHeadingParse = rules.heading.parse

rules.heading.match = (source, state, prevCapture) => {
  // First try the original heading match
  const originalMatch = typeof originalHeadingMatch === 'function' ? originalHeadingMatch(source, state, prevCapture) : null
  if (originalMatch) return originalMatch
  
  // If that fails, try to match ### headers specifically
  const h3Match = /^(#{3})\s+(.+?)(?:\n|$)/.exec(source)
  if (h3Match) {
    return h3Match
  }
  
  return null
}

rules.heading.parse = (capture, parse, state) => {
  // If we have the original parse function and it's not our h3 match, use it
  if (typeof originalHeadingParse === 'function' && capture[1].length !== 3) {
    return originalHeadingParse(capture, parse, state)
  }
  
  // Handle our custom h3 parsing
  return {
    level: capture[1].length,
    content: parse(capture[2].trim(), state)
  }
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

String.prototype.replaceAt = function(startIndex, replacement, endIndex) {
  return this.substring(0, startIndex) + replacement + this.substring(endIndex);
}

function formatPVMESpreadsheet(originalContent) {
  // known bug: currently formats prices in code blocks
  let content = originalContent;

  const regexp = /\$data_pvme:([^$]+)\$/g;
  const cellRegexp = /^([^!]+)!([A-Za-z]+)(\d+)$/;
  const results = [...content.matchAll(regexp)];
  for (const result of results.reverse()) {
    const [pvmeFormat, cellId] = result;
    const startIndex = result.index;
    const endIndex = startIndex + pvmeFormat.length;
    
    const cellMatch = cellId.match(cellRegexp);
    let cellValue;
    if (cellMatch) {
      const [_, worksheet, col, row] = cellMatch;
      cellValue = pvmeSpreadsheet?.cells?.[worksheet]?.[col]?.[row];
    } else {
      cellValue = pvmeSpreadsheet?.cell_aliases?.[cellId];
    }

    if (cellValue)
      content = content.replaceAt(startIndex, cellValue, endIndex);
  }
  return content;
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

export default function markdownToHTML(messageContent, options = {}) {
  // todo: linkmsg formatting
  messageAttachments = []

  // STEP 1: Replace -# with safe placeholder that won't be processed as markdown
  let processedContent = messageContent
  const subtextMap = new Map()
  let subtextCounter = 0

  processedContent = processedContent.replace(/^-#\s+(.+)$/gm, (match, content) => {
    const id = `SUBTEXTPLACEHOLDER${subtextCounter++}`
    subtextMap.set(id, content.trim())
    return id
  })

  // STEP 2: Process normal markdown (headers work, placeholders are ignored)
  console.log('Before toHTML:', processedContent)
  let content = toHTML(processedContent, {
    discordCallback: {
      channel: (node) => '#' + channels[node.id],
      user: (node) => '@' + users[node.id],
      role: (node) => '@' + roles[node.id]
    },
    // allow for named links: [name](url)
    // may need to be disabled for embed titles? but should never happen
    embed: true
  })
  console.log('After toHTML:', content)

  // format PVME spreadsheet
  content = formatPVMESpreadsheet(content)

  // format <id:guide> and <id:customize>
  content = formatSpecialChannels(content)

  // STEP 3: Replace placeholders with subtext HTML
  subtextMap.forEach((subtextContent, placeholder) => {
    // Replace placeholder whether it's wrapped in <p> tags or not
    content = content.replace(
      new RegExp(`<p>${placeholder}</p>`, 'g'),
      `<div class="discord-subtext">${subtextContent}</div>`
    )
    content = content.replace(
      new RegExp(placeholder, 'g'),
      `<div class="discord-subtext">${subtextContent}</div>`
    )
  })

  // Final sanitization step
  content = sanitizeDiscordContent(content)

  return { content, messageAttachments }
}

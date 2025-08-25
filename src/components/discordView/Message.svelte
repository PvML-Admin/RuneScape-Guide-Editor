<script>
  import markdownToHTML from './../../markdown'
  import Embed from './Embed.svelte'
  import Attachment from './Attachment.svelte'
  import ComponentsV2 from './ComponentsV2.svelte'
  import { sanitizeDiscordContent } from './../../utils/sanitizer.js'

  export let content
  export let command

  let oldContent
  let oldCommand
  let messageFormatted

  // Validate Discord component limits
  function validateComponentLimits(json) {
    const errors = []

    if (!json.components || !Array.isArray(json.components)) {
      return errors
    }

    // Check total component limit per ComponentsV2 container
    // Note: Discord's actual limit is 40 components per MESSAGE (across all ComponentsV2 containers)
    // But since each .componentsV2:json block creates a separate message, we validate per container
    if (json.components.length > 40) {
      errors.push(
        `ComponentsV2 container exceeds limit: Discord allows maximum 40 components per message, found ${json.components.length} in this container`
      )
    }

    let actionRowCount = 0

    json.components.forEach((component, index) => {
      // Count action rows (type 1) - Discord allows max 5 action rows per message
      if (component.type === 1) {
        actionRowCount++
        if (actionRowCount > 5) {
          errors.push(
            `Too many Action Rows: Discord allows maximum 5 action rows per message (found ${actionRowCount})`
          )
        }

        // Validate components within action row - max 5 buttons/selects per row
        if (component.components && Array.isArray(component.components)) {
          if (component.components.length > 5) {
            errors.push(
              `Action Row ${index + 1} exceeds limit: Discord allows maximum 5 components per action row (found ${component.components.length})`
            )
          }

          // Check individual components in action row
          component.components.forEach((actionComponent) => {
            // Validate select dropdown options (type 3) - max 25 options
            if (
              actionComponent.type === 3 &&
              actionComponent.options &&
              Array.isArray(actionComponent.options)
            ) {
              if (actionComponent.options.length > 25) {
                errors.push(
                  `Select Menu in Action Row ${index + 1} exceeds options limit: Discord allows maximum 25 options per select menu (found ${actionComponent.options.length})`
                )
              }
            }
          })
        }
      }

      // Validate type 9 (Section) components - max 3 text components + 1 accessory
      if (
        component.type === 9 &&
        component.components &&
        Array.isArray(component.components)
      ) {
        if (component.components.length > 3) {
          errors.push(
            `Section component at index ${index + 1} exceeds limit: Discord allows maximum 3 components per section (found ${component.components.length})`
          )
        }
      }
    })

    return errors
  }

  $: if (content !== oldContent || command !== oldCommand) {
    oldContent = content
    oldCommand = command

    if (command === '.embed:json') {
      try {
        const parsed = JSON.parse(content)
        messageFormatted = {
          content: '',
          embed: parsed.embed
        }
      } catch (e) {
        // Show a more helpful error message with the JSON error
        messageFormatted = {
          content: `<div style="color: #ff6b6b; background: #2d1b1b; padding: 8px; border-radius: 4px; border-left: 4px solid #ff6b6b; margin: 4px 0;">
            <strong>⚠️ Invalid JSON Embed</strong><br>
            <small>${e.message}</small>
          </div>`,
          embed: null
        }
      }
    } else if (command === '.componentsV2:json') {
      try {
        const parsed = JSON.parse(content)

        // Validate Discord's component limits
        const validationErrors = validateComponentLimits(parsed)
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors
            .map((error) => `• ${error}`)
            .join('<br>')
          messageFormatted = {
            content: `<div style="color: #ff6b6b; background: #2d1b1b; padding: 8px; border-radius: 4px; border-left: 4px solid #ff6b6b; margin: 4px 0;">
              <strong>⚠️ ComponentsV2 Validation Errors</strong><br>
              <small>${errorMessages}</small>
            </div>`,
            componentsV2: null
          }
        } else {
          messageFormatted = {
            content: '',
            componentsV2: parsed
          }
        }
      } catch (e) {
        // Show a more helpful error message with the JSON error
        messageFormatted = {
          content: `<div style="color: #ff6b6b; background: #2d1b1b; padding: 8px; border-radius: 4px; border-left: 4px solid #ff6b6b; margin: 4px 0;">
            <strong>⚠️ Invalid JSON Components V2</strong><br>
            <small>${e.message}</small>
          </div>`,
          componentsV2: null
        }
      }
    } else {
      messageFormatted = markdownToHTML(content)
      if (command.startsWith('.img')) {
        const attachmentUrl = command.substring('.img:'.length)
        // Validate attachment URL
        try {
          new URL(attachmentUrl)
          messageFormatted.commandAttachment = attachmentUrl
        } catch {
          // Invalid URL, don't add attachment
          console.warn('Invalid attachment URL:', attachmentUrl)
        }
      }
    }

    // Content is already sanitized by markdownToHTML, no need for double sanitization
  }
</script>

<!-- todo: don't use nested object -->
<div class="message-text hover:message-selected">
  <div class="markup">
    {@html messageFormatted.content}
  </div>
  {#if messageFormatted.messageAttachments}
    {#each messageFormatted.messageAttachments as attachment}
      <Attachment url={attachment} />
    {/each}
  {/if}
  {#if messageFormatted.commandAttachment}
    <Attachment url={messageFormatted.commandAttachment} />
  {/if}
</div>

{#if messageFormatted.embed}
  <Embed {...messageFormatted.embed} />
{/if}

{#if messageFormatted.componentsV2}
  <ComponentsV2 componentsV2={messageFormatted.componentsV2} />
{/if}

<style>
  .hover\:message-selected:hover {
    /* background-color: #36393f; */
    background-color: #2f3136;
  }
</style>

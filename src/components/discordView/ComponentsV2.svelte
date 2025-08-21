<script>
  import markdownToHTML from '../../markdown.js'

  export let componentsV2

  /**
   * Convert Discord color integer to hex color
   * @param {number} colorInt - Discord color integer
   * @returns {string} - Hex color string (e.g., "#ff5733")
   */
  function intToHexColor(colorInt) {
    if (!colorInt || typeof colorInt !== 'number') {
      return '#5865f2' // Default Discord blurple
    }
    return `#${colorInt.toString(16).padStart(6, '0')}`
  }

  // Get the accent color for the container border
  $: accentColor = intToHexColor(componentsV2?.accent_color)

  /**
   * Render text content with markdown support and basic list formatting
   * @param {string} content - The markdown content to render
   * @returns {string} - Sanitized HTML
   */
  function renderTextContent(content) {
    if (!content) return ''

    // Pre-process content to convert simple bullet lists
    let processedContent = content

    // Convert lines starting with "- " to HTML bullet points
    // Split by \n, process each line, then rejoin
    const lines = processedContent.split('\n')
    const processedLines = lines.map((line) => {
      // Check if line starts with "- " (bullet point)
      if (line.trim().startsWith('- ')) {
        const bulletContent = line.trim().substring(2) // Remove "- "
        return `• ${bulletContent}` // Use bullet character
      }
      return line
    })
    processedContent = processedLines.join('\n')

    // Fix for standalone headers: Discord markdown processor needs content after headers
    // If content ends with a header line (# ## ###), add a newline to ensure it processes
    const trimmedContent = processedContent.trim()
    if (trimmedContent.match(/^#+\s+.+$/)) {
      // Content is just a single header line, add newline to make it process correctly
      processedContent = processedContent + '\n'
    }

    const { content: htmlContent } = markdownToHTML(processedContent)

    return htmlContent // Already sanitized by markdownToHTML and subtext formatting is handled in markdownToHTML
  }

  /**
   * Check if a URL is a video (basic check)
   * @param {string} url - Media URL
   * @returns {boolean} - True if likely a video
   */
  function isVideo(url) {
    // .gif files should be treated as images, not videos
    const urlWithoutQuery = url.split('?')[0]
    return /\.(mp4|webm|mov|avi)$/i.test(urlWithoutQuery)
  }

  /**
   * Check if a URL is a valid media URL
   * @param {string} url - Media URL to validate
   * @returns {boolean} - True if valid media URL
   */
  function isValidMediaUrl(url) {
    if (!url || typeof url !== 'string') return false
    try {
      new URL(url) // Validate URL format
      // Check for media file extensions anywhere in the URL (before query params)
      const urlWithoutQuery = url.split('?')[0]
      return (
        /\.(png|jpe?g|gif|webp|mp4|webm|mov|avi)$/i.test(urlWithoutQuery) ||
        url.includes('cdn.discordapp.com')
      ) // Allow all Discord CDN URLs
    } catch {
      return false
    }
  }
</script>

{#if componentsV2}
  <div class="accessory">
    <div
      class="components-v2-wrapper"
      style="border-left-color: {accentColor};"
    >
      {#each componentsV2.components || [] as component}
        {#if component.type === 9}
          <!-- Text + Media Container -->
          <div class="component-block">
            <div class="component-content">
              <!-- Text Content -->
              {#if component.components && component.components.length > 0}
                <div class="component-text">
                  {#each component.components as textComponent}
                    {#if textComponent.type === 10 && textComponent.content}
                      <div class="component-markdown markup">
                        {@html renderTextContent(textComponent.content)}
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}

              <!-- Media Accessory -->
              {#if component.accessory && component.accessory.type === 11 && component.accessory.media && isValidMediaUrl(component.accessory.media.url)}
                <div class="component-media">
                  {#if isVideo(component.accessory.media.url)}
                    <video
                      src={component.accessory.media.url}
                      class="component-video"
                      controls
                      preload="metadata"
                    >
                      <track kind="captions" />
                      Your browser does not support the video tag.
                    </video>
                  {:else}
                    <!-- Discord Image with Fallback -->
                    <div class="discord-image-container">
                      <img
                        src={component.accessory.media.url}
                        alt="Component media"
                        class="component-image"
                        loading="eager"
                        style="width: auto; height: auto; max-width: 120px; max-height: 90px; border-radius: 4px;"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                      />
                      <!-- Simple fallback when Discord image fails -->
                      <div
                        class="discord-image-fallback"
                        style="display: none; border: 2px dashed #4f545c; padding: 8px; background: #36393f; color: #72767d; border-radius: 4px; max-width: 120px; font-size: 11px; text-align: center;"
                      >
                        Image unavailable
                      </div>
                    </div>
                  {/if}
                </div>

                <!-- Button Accessory -->
              {:else if component.accessory && component.accessory.type === 2}
                <div class="component-button-accessory">
                  <button
                    class="discord-button discord-button-style-{component
                      .accessory.style || 2}"
                    disabled
                    title="Custom ID: {component.accessory.custom_id ||
                      'No ID'}"
                  >
                    {#if component.accessory.emoji && component.accessory.emoji.name}
                      <span class="button-emoji"
                        >{component.accessory.emoji.name}</span
                      >
                    {/if}
                    {component.accessory.label || 'Button'}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {:else if component.type === 10}
          <!-- Text-only Component -->
          <div class="component-block">
            {#if component.content}
              <div class="component-markdown markup">
                {@html renderTextContent(component.content)}
              </div>
            {/if}
          </div>
        {:else if component.type === 12}
          <!-- Media Gallery Component -->
          <div class="component-block">
            {#if component.items && component.items.length > 0}
              <div class="component-media-gallery">
                {#each component.items as item}
                  {#if item.media && isValidMediaUrl(item.media.url)}
                    <div class="component-gallery-media">
                      {#if isVideo(item.media.url)}
                        <video
                          src={item.media.url}
                          class="component-gallery-video"
                          controls
                          preload="metadata"
                        >
                          <track kind="captions" />
                          Your browser does not support the video tag.
                        </video>
                      {:else}
                        <!-- Discord Gallery Image with Fallback -->
                        <div class="discord-gallery-image-container">
                          <img
                            src={item.media.url}
                            alt={item.description || 'Component media'}
                            class="component-gallery-image"
                            loading="eager"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                          />
                          <!-- Simple fallback when Discord image fails -->
                          <div
                            class="discord-gallery-image-fallback"
                            style="display: none; border: 2px dashed #4f545c; padding: 16px; background: #36393f; color: #72767d; border-radius: 4px; font-size: 14px; text-align: center;"
                          >
                            Image unavailable
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {:else if component.type === 1}
          <!-- Action Row Container -->
          <div class="component-block">
            <div class="discord-action-row">
              {#each component.components || [] as actionComponent}
                {#if actionComponent.type === 2}
                  <!-- Button in Action Row -->
                  <button
                    class="discord-button discord-button-style-{actionComponent.style ||
                      2}"
                    disabled
                    title="Custom ID: {actionComponent.custom_id || 'No ID'}"
                  >
                    {#if actionComponent.emoji && actionComponent.emoji.name}
                      <span class="button-emoji"
                        >{actionComponent.emoji.name}</span
                      >
                    {/if}
                    {actionComponent.label || 'Button'}
                  </button>
                {:else if actionComponent.type === 3}
                  <!-- Select in Action Row -->
                  <div class="discord-select-container">
                    <select
                      class="discord-select"
                      disabled
                      title="Custom ID: {actionComponent.custom_id || 'No ID'}"
                    >
                      <option
                        >{actionComponent.placeholder ||
                          'Select an option...'}</option
                      >
                      {#each actionComponent.options || [] as option}
                        <option
                          value={option.value}
                          title={option.description || ''}
                        >
                          {#if option.emoji && option.emoji.name}
                            {option.emoji.name}
                          {/if}
                          {option.label || 'Option'}
                        </option>
                      {/each}
                    </select>
                  </div>
                {:else}
                  <!-- Unknown Action Component -->
                  <div
                    class="component-error"
                    style="color: orange; border: 1px solid orange; padding: 4px; margin: 2px;"
                  >
                    ⚠️ Unknown action component type: {actionComponent.type}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {:else if component.type === 2}
          <!-- Standalone Button Component -->
          <div class="component-block">
            <div class="discord-action-row">
              <button
                class="discord-button discord-button-style-{component.style || 2}"
                disabled
                title="Custom ID: {component.custom_id || 'No ID'}"
              >
                {#if component.emoji && component.emoji.name}
                  <span class="button-emoji">{component.emoji.name}</span>
                {/if}
                {component.label || 'Button'}
              </button>
            </div>
          </div>
        {:else if component.type === 3}
          <!-- Standalone Select Menu Component -->
          <div class="component-block">
            <div class="discord-select-container">
              <select
                class="discord-select"
                disabled
                title="Custom ID: {component.custom_id || 'No ID'}"
              >
                <option
                  >{component.placeholder || 'Select an option...'}</option
                >
                {#each component.options || [] as option}
                  <option
                    value={option.value}
                    title={option.description || ''}
                  >
                    {#if option.emoji && option.emoji.name}
                      {option.emoji.name}
                    {/if}
                    {option.label || 'Option'}
                  </option>
                {/each}
              </select>
            </div>
          </div>
        {:else if component.type === 14}
          <!-- Spacer Component -->
          <div class="component-spacer" data-spacing={component.spacing}></div>
        {:else}
          <!-- Unknown Component Type -->
          <div
            class="component-error"
            style="color: red; border: 1px solid red; padding: 8px; margin: 4px 0;"
          >
            ⚠️ Unknown component type: {component.type}
            <br />Component data: {JSON.stringify(component, null, 2)}
          </div>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div
    class="component-error"
    style="color: orange; border: 1px solid orange; padding: 8px; margin: 4px 0;"
  >
    ⚠️ No Components V2 data provided
    <br />Received: {JSON.stringify(componentsV2, null, 2)}
  </div>
{/if}

<style>
  /* Use Discord-compatible styling with higher specificity */
  .components-v2-wrapper {
    background-color: #2f3136;
    border-left: 4px solid #5865f2;
    border-radius: 4px;
    padding: 16px;
    margin: 5px 0;
    max-width: 650px; /* Middle ground between narrow and wide to match Discord's dynamic sizing */
    width: 100%;
    min-width: 480px; /* Adjusted minimum width based on Discord's responsive behavior */
  }

  .component-block {
    margin-bottom: 16px;
  }

  .component-block:last-child {
    margin-bottom: 0;
  }

  .component-content {
    display: flex;
    flex-direction: row;
    gap: 16px;
    align-items: flex-start;
  }

  .component-text {
    flex: 1;
    min-width: 0;
  }

  .component-markdown.markup {
    color: #dcddde !important;
    line-height: 1.375;
  }

  .component-markdown.markup :global(h1),
  .component-markdown.markup :global(h2),
  .component-markdown.markup :global(h3) {
    color: #ffffff !important;
    font-weight: 600 !important;
    margin: 0 0 8px 0 !important;
  }

  .component-markdown.markup :global(h1) {
    font-size: 20px !important;
  }

  .component-markdown.markup :global(h2) {
    font-size: 18px !important;
  }

  .component-markdown.markup :global(h3) {
    font-size: 16px !important;
  }

  .component-markdown.markup :global(p) {
    margin: 0 0 8px 0 !important;
    color: #dcddde !important;
  }

  .component-markdown.markup :global(ul),
  .component-markdown.markup :global(ol) {
    margin: 0 0 8px 16px !important;
    color: #dcddde !important;
  }

  .component-markdown.markup :global(li) {
    margin: 0 0 4px 0 !important;
  }

  .component-markdown.markup :global(code) {
    background-color: #2f3136 !important;
    color: #b9bbbe !important;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    font-size: 14px !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
  }

  .component-markdown.markup :global(pre) {
    background-color: #2f3136 !important;
    color: #b9bbbe !important;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    font-size: 14px !important;
    padding: 8px !important;
    border-radius: 4px !important;
    overflow-x: auto !important;
    margin: 0 0 8px 0 !important;
  }

  .component-markdown.markup :global(a) {
    color: #00aff4 !important;
    text-decoration: none !important;
  }

  .component-markdown.markup :global(a:hover) {
    text-decoration: underline !important;
  }

  .component-markdown.markup :global(strong) {
    font-weight: 600 !important;
    color: #ffffff !important;
  }

  .component-markdown.markup :global(em) {
    font-style: italic !important;
  }

  .component-markdown.markup :global(.discord-subtext) {
    color: #72767d !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 1.375 !important;
    margin: 4px 0 8px 0 !important;
  }

  /* Discord-style headers for Components V2 */
  .component-markdown.markup :global(h1) {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin: 16px 0 8px 0 !important;
    line-height: 1.2 !important;
  }

  .component-markdown.markup :global(h2) {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin: 12px 0 6px 0 !important;
    line-height: 1.2 !important;
  }

  .component-markdown.markup :global(h3) {
    font-size: 1.125rem !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin: 8px 0 4px 0 !important;
    line-height: 1.2 !important;
  }

  .component-media {
    flex-shrink: 0;
    max-width: 140px; /* Much smaller thumbnail-like sizing to match Discord */
  }

  .component-image,
  .component-video {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 4px !important;
    display: block !important;
  }

  /* Type 12 Media Gallery - Larger sizing within narrower Discord container */
  .component-media-gallery {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .component-gallery-media {
    width: 100%;
    max-width: 100%; /* Take full width of the narrower container */
  }

  .component-gallery-image,
  .component-gallery-video {
    width: auto !important;
    height: auto !important;
    max-width: 100% !important;
    max-height: 450px !important; /* Adjusted height for the intermediate container size */
    min-width: 250px !important; /* Adjusted minimum size for intermediate container */
    border-radius: 4px !important;
    display: block !important;
  }

  .discord-gallery-image-container {
    width: 100%;
    max-width: 100%; /* Take full width of the container */
  }

  /* Discord Button Accessories */
  .component-button-accessory {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .discord-button {
    border: none;
    border-radius: 3px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: not-allowed;
    transition:
      background-color 0.17s ease,
      color 0.17s ease;
    min-height: 32px;
    min-width: 60px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    line-height: 1;
    opacity: 0.6; /* Disabled appearance */
  }

  /* Discord Button Styles */
  .discord-button-style-1 {
    /* Primary/Blurple */
    background-color: #5865f2;
    color: #ffffff;
  }

  .discord-button-style-2 {
    /* Secondary/Grey */
    background-color: #4f545c;
    color: #ffffff;
  }

  .discord-button-style-3 {
    /* Success/Green */
    background-color: #3ba55c;
    color: #ffffff;
  }

  .discord-button-style-4 {
    /* Danger/Red */
    background-color: #ed4245;
    color: #ffffff;
  }

  .discord-button-style-5 {
    /* Link/Transparent */
    background-color: transparent;
    color: #00aff4;
  }

  /* Discord Action Rows */
  .discord-action-row {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex-wrap: wrap;
    margin: 8px 0;
  }

  /* Enhanced button styling with emoji support */
  .button-emoji {
    margin-right: 6px;
    font-size: 16px;
  }

  /* Discord Select Components */
  .discord-select-container {
    flex: 1;
    min-width: 200px;
    max-width: 100%;
  }

  .discord-select {
    width: 100%;
    background-color: #2f3136;
    border: 1px solid #4f545c;
    border-radius: 3px;
    color: #dcddde;
    font-size: 14px;
    font-family: inherit;
    padding: 8px 12px;
    min-height: 32px;
    cursor: not-allowed;
    opacity: 0.6;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23dcddde' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 32px;
  }

  .discord-select:focus {
    border-color: #5865f2;
    outline: none;
  }

  .discord-select option {
    background-color: #2f3136;
    color: #dcddde;
    padding: 8px 12px;
  }

  .discord-select option:hover {
    background-color: #36393f;
  }

  .component-spacer {
    display: flex;
    align-items: center;
    margin: 12px 0;
    position: relative;
  }

  .component-spacer::before {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #4f545c;
    opacity: 0.6;
  }

  .component-spacer[data-spacing='1'] {
    margin: 8px 0;
  }

  .component-spacer[data-spacing='2'] {
    margin: 16px 0;
  }

  .component-spacer[data-spacing='3'] {
    margin: 24px 0;
  }

  .component-spacer[data-spacing='4'] {
    margin: 32px 0;
  }

  .component-error {
    background-color: #f04747;
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    margin: 8px 0;
  }

  /* Responsive adjustments for Discord-matched Components V2 */
  @media (max-width: 768px) {
    .components-v2-wrapper {
      max-width: 100% !important;
      min-width: 300px !important;
      margin: 8px 4px !important;
    }

    .component-content {
      flex-direction: column !important;
    }

    .component-media {
      max-width: none !important;
    }
  }

  @media (max-width: 640px) {
    .components-v2-wrapper {
      padding: 12px !important;
      min-width: 280px !important;
    }
  }

  @media (max-width: 480px) {
    .components-v2-wrapper {
      min-width: 250px !important;
      padding: 8px !important;
    }

    .component-gallery-image,
    .component-gallery-video {
      min-width: 150px !important;
    }
  }
</style>

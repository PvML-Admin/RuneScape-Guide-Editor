<script>
  import { notifications, dismissNotification } from '../../stores/ui.js'
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  // Icons for different notification types
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const colors = {
    success: 'bg-green-600 border-green-700',
    error: 'bg-red-600 border-red-700',
    warning: 'bg-yellow-600 border-yellow-700',
    info: 'bg-blue-600 border-blue-700'
  }
</script>

<div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
  {#each $notifications as notification (notification.id)}
    <div
      class="p-4 rounded-lg shadow-lg text-white border-l-4 {colors[
        notification.type
      ] || colors.info}"
      in:fly={{ x: 300, duration: 300 }}
      out:fade={{ duration: 200 }}
      animate:flip={{ duration: 200 }}
    >
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3">
          <span class="text-lg flex-shrink-0 mt-0.5">
            {icons[notification.type] || icons.info}
          </span>
          <div class="flex-1">
            <p class="text-sm font-medium break-words">
              {notification.message}
            </p>
          </div>
        </div>
        <button
          class="ml-2 flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          on:click={() => dismissNotification(notification.id)}
          aria-label="Dismiss notification"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  {/each}
</div>

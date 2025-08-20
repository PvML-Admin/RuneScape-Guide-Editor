import { fetchWithRetry, withErrorHandling } from './utils/errorHandler.js'
import { addNotification } from './stores/ui.js'

export let channels = {}
export let users = {}
export let roles = {}

export let channelsFormat = {}
export let usersFormat = {}
export let rolesFormat = {}
export let emojisFormat = {}

export async function populateConstants() {
  // Load all constants in parallel with proper error handling
  const results = await Promise.allSettled([
    withErrorHandling(() => setEmojis(), 'Loading emojis')
  ])

  // Check if any critical operations failed
  const failedOperations = results.filter(
    (result) => result.status === 'rejected'
  )

  if (failedOperations.length > 0) {
    addNotification({
      type: 'warning',
      message: `${failedOperations.length} data sources failed to load. Some features may not work correctly.`,
      duration: 10000
    })
  } else {
    addNotification({
      type: 'success',
      message: 'All data sources loaded successfully!',
      duration: 3000
    })
  }
}

async function rawGithubGetRequest(url, operationName) {
  return await fetchWithRetry(url, { method: 'GET' }, operationName, 'api')
}

export async function rawGithubTextRequest(
  url,
  operationName = 'text request'
) {
  const res = await rawGithubGetRequest(url, operationName)
  return await res.text()
}

export async function rawGithubJSONRequest(
  url,
  operationName = 'JSON request'
) {
  const res = await rawGithubGetRequest(url, operationName)
  return await res.json()
}

async function setEmojis() {
  const emojisJSON = await rawGithubJSONRequest(
    'https://raw.githubusercontent.com/pvme/pvme-settings/master/emojis/emojis.json',
    'emojis'
  )
  emojisFormat = {}
  for (const category of emojisJSON.categories) {
    for (const emoji of category.emojis) {
      const emojiFormat = `<:${emoji.emoji_name}:${emoji.emoji_id}>`
      emojisFormat[emoji.emoji_name] = emojiFormat
      for (const alias of emoji.aliases) {
        emojisFormat[alias] = emojiFormat
      }
    }
  }
  emojisFormat['wenspore'] =
    `<:wenarrow:971025697046925362> <:grico:787904334812807238> <:deathsporearrows:900758234527301642>`
}

import { embedSchema } from './embedSchema'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true })
const validator = ajv.compile(embedSchema)

function formatError(error) {
  if (error.keyword === 'additionalProperties')
    return `Unrecognized property '${error.params.additionalProperty}'`
  else return `'${error.instancePath.slice(1)}' ${error.message}`
}

function validateEmbedSchema(results, commandLine, embed, originalText) {
  const valid = validator(embed)
  if (!valid) {
    for (const error of validator.errors) {
      // Try to find the actual line number where the error occurs in the JSON
      let actualLine = commandLine
      
      // Extract the property name from the error
      const propertyName = error.keyword === 'additionalProperties' 
        ? error.params?.additionalProperty 
        : error.instancePath?.replace(/^\//, '')
      
      if (propertyName && originalText) {
        const lines = originalText.split('\n')
        
        // Try multiple search strategies
        let found = false
        
        // Strategy 1: Look for the exact property path
        if (error.instancePath) {
          const pathParts = error.instancePath.split('/').filter(part => part)
          
          // For nested properties like /fields/0/value
          if (pathParts.length > 0) {
            const lastProperty = pathParts[pathParts.length - 1]
            
            // Look for the property as a JSON key
            const propertyPattern = new RegExp(`"${lastProperty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`)
            
            for (let i = 0; i < lines.length; i++) {
              if (propertyPattern.test(lines[i])) {
                actualLine = i + 1
                found = true
                break
              }
            }
          }
        }
        
        // Strategy 2: additionalProperties errors
        if (!found && error.keyword === 'additionalProperties') {
          const propertyPattern = new RegExp(`"${propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`)
          
          for (let i = 0; i < lines.length; i++) {
            if (propertyPattern.test(lines[i])) {
              actualLine = i + 1
              found = true
              break
            }
          }
        }
        
        // Strategy 3: Simple search fallback
        if (!found && propertyName) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`"${propertyName}"`)) {
              actualLine = i + 1
              found = true
              break
            }
          }
        }
      }
      
      results.push({
        line: actualLine,
        type: 'error',
        text: formatError(error)
      })
    }
  }
}

function findSyntaxErrors(text) {
  /* state values
   * 0 - parsing message content
   * 1 - parsing message commands
   */
  const lines = text.split('\n')
  let state = 0
  const messages = []
  const tags = new Set()

  const results = []

  let message = {
    text: '',
    firstline: 1
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (line[0] === '.') {
      line = line.slice(1)

      if (line.trim().length === 0) {
        if (!message.lastline) {
          message.lastline = i
        }
        messages.push(message)
        message = {
          text: '',
          firstline: i + 2
        }
        state = 0
        continue
      }

      if (line[0] !== '.') {
        if (state === 0) {
          message.lastline = i
          state = 1
        }

        if (line.indexOf(':') === -1) {
          results.push({
            line: i + 1,
            type: 'error',
            text: 'Command must contain colon'
          })
          continue
        } else {
          if (line[line.indexOf(':') + 1] == ' ') {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Command must not have trailing whitespace after the colon and before the content'
            })
            continue
          }
        }

        const parse = line.trim().match(/^(.*?):(.*)$/)
        const base = parse[1]
        const param = parse[2]

        if (base === 'img' || base === 'file') {
          if (!param.match(/https?:\/\/.*?/)) {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Invalid attachment URL'
            })
          }
          if (message.attachment) {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Message already contains attachment'
            })
          }

          message.attachment = true
        } else if (base === 'tag') {
          if (message.tag) {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Message already tagged'
            })
          }

          if (tags.has(param)) {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Tag already defined'
            })
          } else {
            tags.add(param)
            message.tag = param
          }
        } else if (base === 'pin') {
          if (param !== 'delete' && param !== '') {
            results.push({
              line: i + 1,
              type: 'error',
              text: 'Pin parameter must either be delete or empty'
            })
          }
        } else if (base === 'embed') {
          if (param !== 'json' && param !== '') {
            // Suppress any further checking of the content
            message.text = ''

            results.push({
              line: i + 1,
              type: 'error',
              text: 'Embed parameter must either be json or empty'
            })
          }

          if (param === 'json') {
            let json

            try {
              json = JSON.parse(message.text)
            } catch (e) {
              // Suppress any further checking of the content
              message.text = ''

              results.push({
                line: i + 1,
                type: 'error',
                text: 'JSON embed object is invalid'
              })
              continue
            }

            let embed

            message.text = json.content ? json.content : ''
            delete json.content

            if (json.embeds) {
              // if (json.embeds > 1) {
              // 	const err = new Error("Message too long");
              // 	err.reply = "Message #" + (messages.length + 1) +
              // 		" contains multiple embeds, limit 1 embed per" +
              // 		" message.";
              // 	throw err;
              // }

              embed = json.embeds[0]
            } else if (json.embed) {
              embed = json.embed
            } else {
              embed = json
            }

            try {
              if (embed.fields) {
                for (let j = 0; j < embed.fields.length; j++) {
                  if (embed.fields[j].name.trim().length == 0) {
                    // Find the actual line where the empty name field is
                    let nameLineNumber = i + 1
                    const lines = text.split('\n')
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                      if (lines[lineIdx].includes('"name"') && lines[lineIdx].includes('""')) {
                        nameLineNumber = lineIdx + 1
                        break
                      }
                    }
                    
                    results.push({
                      line: nameLineNumber,
                      type: 'error',
                      text: 'JSON embed object is invalid: "name" is empty in an embed field'
                    })
                  }
                  if (embed.fields[j].value.trim() == 0) {
                    // Find the actual line where the empty value field is
                    let valueLineNumber = i + 1
                    const lines = text.split('\n')
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                      if (lines[lineIdx].includes('"value"') && lines[lineIdx].includes('""')) {
                        valueLineNumber = lineIdx + 1
                        break
                      }
                    }
                    
                    results.push({
                      line: valueLineNumber,
                      type: 'error',
                      text: 'JSON embed object is invalid: "value" is empty in an embed field'
                    })
                  }
                }
              }
            } catch (e) {
              console.warn('Error parsing embed fields: ' + e)
            }

            // TODO: validate embed object
            validateEmbedSchema(results, i + 1, embed, text)
          }
        } else if (base === 'componentsV2') {
          if (param !== 'json' && param !== '') {
            // Suppress any further checking of the content
            message.text = ''

            results.push({
              line: i + 1,
              type: 'error',
              text: 'ComponentsV2 parameter must either be json or empty'
            })
          }

          if (param === 'json') {
            let json

            try {
              json = JSON.parse(message.text)
            } catch (e) {
              // Suppress any further checking of the content
              message.text = ''

              results.push({
                line: i + 1,
                type: 'error',
                text: 'JSON componentsV2 object is invalid'
              })
              continue
            }

            // Basic Components V2 structure validation
            if (!json.type || json.type !== 17) {
              results.push({
                line: i + 1,
                type: 'error',
                text: 'ComponentsV2 must have type: 17'
              })
            }

            // Check Discord's 40 component limit per message
            if (
              json.components &&
              Array.isArray(json.components) &&
              json.components.length > 40
            ) {
              results.push({
                line: i + 1,
                type: 'error',
                text: `ComponentsV2 exceeds Discord's 40 component limit per message (found ${json.components.length} components)`
              })
            }

            // Validate individual component limits
            if (json.components && Array.isArray(json.components)) {
              let actionRowCount = 0

              json.components.forEach((component, index) => {
                // Count action rows (type 1) - Discord allows max 5 action rows per message
                if (component.type === 1) {
                  actionRowCount++
                  if (actionRowCount > 5) {
                    results.push({
                      line: i + 1,
                      type: 'error',
                      text: `Too many Action Rows (type 1): Discord allows maximum 5 action rows per message (found ${actionRowCount})`
                    })
                  }

                  // Validate components within action row - max 5 buttons/selects per row
                  if (
                    component.components &&
                    Array.isArray(component.components)
                  ) {
                    if (component.components.length > 5) {
                      results.push({
                        line: i + 1,
                        type: 'error',
                        text: `Action Row ${index + 1} exceeds component limit: Discord allows maximum 5 components per action row (found ${component.components.length})`
                      })
                    }

                    // Check individual components in action row
                    component.components.forEach(
                      (actionComponent, actionIndex) => {
                        // Validate select dropdown options (type 3) - max 25 options
                        if (
                          actionComponent.type === 3 &&
                          actionComponent.options &&
                          Array.isArray(actionComponent.options)
                        ) {
                          if (actionComponent.options.length > 25) {
                            results.push({
                              line: i + 1,
                              type: 'error',
                              text: `Select Menu in Action Row ${index + 1} exceeds options limit: Discord allows maximum 25 options per select menu (found ${actionComponent.options.length})`
                            })
                          }
                        }
                      }
                    )
                  }
                }

                // Validate type 9 (Section) components - max 3 text components + 1 accessory
                if (
                  component.type === 9 &&
                  component.components &&
                  Array.isArray(component.components)
                ) {
                  if (component.components.length > 3) {
                    results.push({
                      line: i + 1,
                      type: 'error',
                      text: `Section component (type 9) at index ${index + 1} exceeds limit: Discord allows maximum 3 components per section (found ${component.components.length})`
                    })
                  }
                }
              })
            }

            if (!json.components || !Array.isArray(json.components)) {
              results.push({
                line: i + 1,
                type: 'error',
                text: 'ComponentsV2 must have a components array'
              })
            } else {
              // Validate individual components
              for (let j = 0; j < json.components.length; j++) {
                const component = json.components[j]

                if (!component.type) {
                  results.push({
                    line: i + 1,
                    type: 'error',
                    text: `Component ${j + 1} is missing required type property`
                  })
                }

                // Validate text + media components (type 9)
                if (component.type === 9) {
                  if (component.components) {
                    for (let k = 0; k < component.components.length; k++) {
                      const textComponent = component.components[k]
                      if (
                        textComponent.type === 10 &&
                        (!textComponent.content ||
                          textComponent.content.trim().length === 0)
                      ) {
                        results.push({
                          line: i + 1,
                          type: 'warning',
                          text: `Component ${j + 1} text block ${k + 1} has empty content`
                        })
                      }
                    }
                  }
                }

                // Validate text-only components (type 10)
                if (component.type === 10) {
                  if (
                    !component.content ||
                    component.content.trim().length === 0
                  ) {
                    results.push({
                      line: i + 1,
                      type: 'warning',
                      text: `Component ${j + 1} (type 10) has empty content`
                    })
                  }
                }

                // Validate media gallery components (type 12)
                if (component.type === 12) {
                  if (
                    !component.items ||
                    !Array.isArray(component.items) ||
                    component.items.length === 0
                  ) {
                    results.push({
                      line: i + 1,
                      type: 'warning',
                      text: `Component ${j + 1} (type 12) should have items array with at least one item`
                    })
                  } else {
                    for (let k = 0; k < component.items.length; k++) {
                      const item = component.items[k]
                      if (!item.media || !item.media.url) {
                        results.push({
                          line: i + 1,
                          type: 'warning',
                          text: `Component ${j + 1} item ${k + 1} is missing media.url`
                        })
                      }
                    }
                  }
                }

                // Validate spacer components (type 14)
                if (component.type === 14) {
                  if (
                    !component.spacing ||
                    component.spacing < 1 ||
                    component.spacing > 4
                  ) {
                    results.push({
                      line: i + 1,
                      type: 'warning',
                      text: `Component ${j + 1} spacing should be between 1-4`
                    })
                  }
                }
              }
            }

            message.text = json.content ? json.content : ''
            delete json.content
          }
        } else if (base === 'react') {
          // React command handling - currently empty
        } else {
          results.push({
            line: i + 1,
            type: 'error',
            text: 'No such command'
          })
        }
        continue
      }
    }

    if (state === 1) {
      messages.push(message)
      message = {
        text: '',
        firstline: i + 1
      }
      state = 0
    }

    message.text += '\n' + line
  }

  if (!message.lastline) {
    message.lastline = lines.length
  }
  messages.push(message)

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    let msgLinks = message.text.match(/_[a-zA-Z0-9]*$/gm)
    if (msgLinks) {
      for (let j = 0; j < msgLinks.length; j++) {
        let keyword = msgLinks[j].slice(1, -1)
        if (!tags.has(keyword)) {
          results.push({
            line: [message.firstline, message.lastline],
            type: 'warn',
            text: `Message uses a "linkmsg_${keyword}$ without ${keyword} being defined in a .tag: command`
          })
        }
      }
    }

    message.text = message.text
      .slice(1)
      .replace(
        /\$linkmsg_(.*?)\$/g,
        'https://discordapp.com/channels/00000000000000000000/00000000000000000000/00000000000000000000'
      )

    if (message.text.match(/^[ \n]/)) {
      message.text = '\u200b' + message.text
    }

    if (message.text.match(/\n$/)) {
      message.text = message.text + '\u200b'
    }

    if (message.text === '') {
      message.text = '\u200b'
    }

    if (message.text.length > 2000) {
      results.push({
        line: [message.firstline, message.lastline],
        type: 'error',
        text: 'Message text exceeds 2000 characters'
      })
    }
  }

  for (let i = 0; i < results.length; i++) {
    if (!Array.isArray(results[i].line)) {
      results[i].line = [results[i].line, results[i].line]
    }
  }

  return results
}

export default findSyntaxErrors

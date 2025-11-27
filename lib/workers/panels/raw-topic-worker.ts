/**
 * Raw Topic Worker
 * Handles JSON formatting for raw topic viewer panels off the main thread
 * - Formats JSON messages with pretty printing
 * - Handles message truncation for large messages
 * - Maintains panel configurations
 */

import type {
  RawTopicWorkerCommand,
  RawTopicWorkerResponse,
  RawTopicWorkerConfig,
} from './panel-worker-types'

// ============================================================================
// Panel State
// ============================================================================

interface PanelState {
  config: RawTopicWorkerConfig
}

const panelStates = new Map<string, PanelState>()

// Default configuration values
const DEFAULT_MAX_MESSAGE_LENGTH = 10000
const DEFAULT_PRETTY_PRINT = true

// ============================================================================
// Command Handlers
// ============================================================================

function handleConfigure(config: RawTopicWorkerConfig): void {
  panelStates.set(config.panelId, { config })
}

function handleFormatMessage(panelId: string, message: any, timestamp: number): void {
  const state = panelStates.get(panelId)
  
  // Use default config if panel not configured yet
  const maxLength = state?.config.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH
  const prettyPrint = state?.config.prettyPrint ?? DEFAULT_PRETTY_PRINT

  try {
    // Safety check for undefined or null data
    if (message === undefined || message === null) {
      sendFormattedMessage(panelId, "No message data available", timestamp)
      return
    }

    // Format the JSON
    let jsonString = JSON.stringify(
      message,
      null,
      prettyPrint ? 2 : 0
    )

    // Apply max length truncation
    if (jsonString && jsonString.length > maxLength) {
      jsonString = jsonString.slice(0, maxLength) + "\n... (truncated)"
    }

    sendFormattedMessage(panelId, jsonString, timestamp)
  } catch (error) {
    const errorMessage = "Error formatting message: " +
      (error instanceof Error ? error.message : "Unknown error")
    sendFormattedMessage(panelId, errorMessage, timestamp)
  }
}

function handleRemovePanel(panelId: string): void {
  panelStates.delete(panelId)
}

// ============================================================================
// Response Helpers
// ============================================================================

function sendFormattedMessage(panelId: string, formattedMessage: string, timestamp: number): void {
  const response: RawTopicWorkerResponse = {
    type: 'FORMATTED_MESSAGE',
    panelId,
    formattedMessage,
    timestamp,
  }

  self.postMessage(response)
}

function sendError(panelId: string, error: string): void {
  const response: RawTopicWorkerResponse = {
    type: 'ERROR',
    panelId,
    error,
  }

  self.postMessage(response)
}

// ============================================================================
// Main Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent<RawTopicWorkerCommand>) => {
  const command = event.data

  try {
    switch (command.type) {
      case 'CONFIGURE':
        handleConfigure(command.config)
        break

      case 'FORMAT_MESSAGE':
        handleFormatMessage(command.panelId, command.message, command.timestamp)
        break

      case 'REMOVE_PANEL':
        handleRemovePanel(command.panelId)
        break

      default:
        console.error('[RawTopicWorker] Unknown command type:', command)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const panelId = 'panelId' in command ? command.panelId : 'unknown'
    sendError(panelId, errorMessage)
    console.error('[RawTopicWorker] Error processing command:', error)
  }
}

// Export empty object to make this a module
export {}



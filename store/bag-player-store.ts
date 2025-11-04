import { create } from 'zustand'
import { toast } from 'sonner'
import type { MessageRecord } from '@/lib/db/live-capture-db'
import { bagPlayerDB, type UnifiedRecording, rosTimeToMs } from '@/lib/db/bag-player-db'

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'loading'

export interface TopicVisualization {
  topicName: string
  topicType: string
  enabled: boolean
  color: string
}

export interface PlaybackMessage {
  topicName: string
  topicType: string
  timestamp: number
  rosTimestamp: { sec: number; nanosec: number }
  data: any
}

interface BagPlayerState {
  // Current recording
  currentRecording: UnifiedRecording | null
  allMessages: MessageRecord[]
  
  // Playback state
  status: PlaybackStatus
  currentTime: number // in milliseconds
  playbackSpeed: number
  
  // Topic selection
  availableTopics: TopicVisualization[]
  selectedTopics: string[]
  
  // Visualization data
  currentMessages: Map<string, PlaybackMessage>
  
  // Playback control
  animationFrameId: number | null
  playbackStartTime: number | null
  recordingStartTime: number | null
  recordingEndTime: number | null
  
  // Message index for efficient seeking
  messageIndex: number
  
  // Actions
  loadRecording: (recording: UnifiedRecording) => Promise<void>
  unloadRecording: () => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (timeMs: number) => void
  setPlaybackSpeed: (speed: number) => void
  toggleTopicSelection: (topicName: string) => void
  selectAllTopics: () => void
  deselectAllTopics: () => void
  
  // Internal
  playbackLoop: () => void
  updateCurrentMessages: (targetTime: number) => void
}

// Color palette for topic visualization
const TOPIC_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6'  // teal
]

export const useBagPlayerStore = create<BagPlayerState>((set, get) => ({
  currentRecording: null,
  allMessages: [],
  status: 'idle',
  currentTime: 0,
  playbackSpeed: 1.0,
  availableTopics: [],
  selectedTopics: [],
  currentMessages: new Map(),
  animationFrameId: null,
  playbackStartTime: null,
  recordingStartTime: null,
  recordingEndTime: null,
  messageIndex: 0,

  loadRecording: async (recording: UnifiedRecording) => {
    const state = get()
    
    // Stop any current playback
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    set({ status: 'loading' })

    try {
      console.log('[BagPlayer] Loading recording:', recording.name)
      
      // Load messages
      const messages = await bagPlayerDB.getRecordingMessages(recording)
      
      console.log('[BagPlayer] Loaded messages:', messages.length)

      // Sort messages by timestamp
      messages.sort((a, b) => {
        const aTime = rosTimeToMs(a.rosTimestamp)
        const bTime = rosTimeToMs(b.rosTimestamp)
        return aTime - bTime
      })

      // Get unique topics and create visualization config
      const topicMap = new Map<string, { type: string; count: number }>()
      for (const msg of messages) {
        const existing = topicMap.get(msg.topicName)
        if (existing) {
          existing.count++
        } else {
          topicMap.set(msg.topicName, { type: msg.topicType, count: 1 })
        }
      }

      const topics: TopicVisualization[] = Array.from(topicMap.entries()).map(
        ([name, info], index) => ({
          topicName: name,
          topicType: info.type,
          enabled: false,
          color: TOPIC_COLORS[index % TOPIC_COLORS.length]
        })
      )

      // Calculate time bounds
      const startTime = messages.length > 0 ? rosTimeToMs(messages[0].rosTimestamp) : 0
      const endTime = messages.length > 0 ? rosTimeToMs(messages[messages.length - 1].rosTimestamp) : 0

      set({
        currentRecording: recording,
        allMessages: messages,
        availableTopics: topics,
        selectedTopics: [],
        currentTime: 0,
        recordingStartTime: startTime,
        recordingEndTime: endTime,
        messageIndex: 0,
        status: 'idle',
        currentMessages: new Map()
      })

      toast.success(`Loaded recording: ${recording.name}`)
      console.log('[BagPlayer] Recording loaded successfully')
    } catch (error) {
      console.error('[BagPlayer] Failed to load recording:', error)
      toast.error('Failed to load recording')
      set({ status: 'idle' })
    }
  },

  unloadRecording: () => {
    const state = get()
    
    // Stop playback
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    set({
      currentRecording: null,
      allMessages: [],
      availableTopics: [],
      selectedTopics: [],
      currentMessages: new Map(),
      status: 'idle',
      currentTime: 0,
      recordingStartTime: null,
      recordingEndTime: null,
      messageIndex: 0,
      animationFrameId: null,
      playbackStartTime: null
    })

    toast.info('Recording unloaded')
  },

  play: () => {
    const state = get()

    if (!state.currentRecording || state.allMessages.length === 0) {
      toast.warning('No recording loaded')
      return
    }

    if (state.selectedTopics.length === 0) {
      toast.warning('Please select at least one topic to visualize')
      return
    }

    // If at the end, restart from beginning
    if (state.currentTime >= (state.recordingEndTime || 0) - (state.recordingStartTime || 0)) {
      set({ currentTime: 0, messageIndex: 0 })
    }

    set({
      status: 'playing',
      playbackStartTime: performance.now()
    })

    // Start playback loop
    const frameId = requestAnimationFrame(get().playbackLoop)
    set({ animationFrameId: frameId })

    toast.success('Playback started')
  },

  pause: () => {
    const state = get()

    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    set({
      status: 'paused',
      animationFrameId: null,
      playbackStartTime: null
    })

    toast.info('Playback paused')
  },

  stop: () => {
    const state = get()

    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    set({
      status: 'stopped',
      currentTime: 0,
      messageIndex: 0,
      animationFrameId: null,
      playbackStartTime: null,
      currentMessages: new Map()
    })

    toast.info('Playback stopped')
  },

  seek: (timeMs: number) => {
    const state = get()
    const { recordingStartTime, recordingEndTime, allMessages } = state

    if (!recordingStartTime || !recordingEndTime) return

    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(timeMs, recordingEndTime - recordingStartTime))

    // Find the message index for this time
    const targetAbsoluteTime = recordingStartTime + clampedTime
    let newIndex = 0
    
    for (let i = 0; i < allMessages.length; i++) {
      const msgTime = rosTimeToMs(allMessages[i].rosTimestamp)
      if (msgTime <= targetAbsoluteTime) {
        newIndex = i
      } else {
        break
      }
    }

    set({
      currentTime: clampedTime,
      messageIndex: newIndex
    })

    // Update current messages for the seeked position
    get().updateCurrentMessages(clampedTime)

    // If playing, restart from new position
    if (state.status === 'playing') {
      set({ playbackStartTime: performance.now() })
    }
  },

  setPlaybackSpeed: (speed: number) => {
    const state = get()
    set({ playbackSpeed: speed })

    // If playing, adjust the start time to account for speed change
    if (state.status === 'playing') {
      set({ playbackStartTime: performance.now() })
    }

    toast.info(`Playback speed: ${speed}x`)
  },

  toggleTopicSelection: (topicName: string) => {
    const state = get()
    const isSelected = state.selectedTopics.includes(topicName)

    if (isSelected) {
      set({
        selectedTopics: state.selectedTopics.filter(t => t !== topicName)
      })
    } else {
      set({
        selectedTopics: [...state.selectedTopics, topicName]
      })
    }

    // Update topic enabled state
    const updatedTopics = state.availableTopics.map(t =>
      t.topicName === topicName ? { ...t, enabled: !isSelected } : t
    )
    set({ availableTopics: updatedTopics })
  },

  selectAllTopics: () => {
    const state = get()
    const allTopicNames = state.availableTopics.map(t => t.topicName)
    const updatedTopics = state.availableTopics.map(t => ({ ...t, enabled: true }))
    
    set({
      selectedTopics: allTopicNames,
      availableTopics: updatedTopics
    })
  },

  deselectAllTopics: () => {
    const state = get()
    const updatedTopics = state.availableTopics.map(t => ({ ...t, enabled: false }))
    
    set({
      selectedTopics: [],
      availableTopics: updatedTopics
    })
  },

  playbackLoop: () => {
    const state = get()
    const {
      playbackStartTime,
      currentTime,
      playbackSpeed,
      recordingStartTime,
      recordingEndTime,
      status
    } = state

    if (status !== 'playing' || !playbackStartTime || !recordingStartTime || !recordingEndTime) {
      return
    }

    // Calculate elapsed time
    const now = performance.now()
    const elapsed = (now - playbackStartTime) * playbackSpeed
    const newTime = currentTime + elapsed

    // Check if we've reached the end
    const duration = recordingEndTime - recordingStartTime
    if (newTime >= duration) {
      set({
        currentTime: duration,
        status: 'stopped',
        animationFrameId: null,
        playbackStartTime: null
      })
      toast.info('Playback finished')
      return
    }

    // Update current time and messages
    set({
      currentTime: newTime,
      playbackStartTime: now
    })

    get().updateCurrentMessages(newTime)

    // Schedule next frame
    const frameId = requestAnimationFrame(get().playbackLoop)
    set({ animationFrameId: frameId })
  },

  updateCurrentMessages: (targetTime: number) => {
    const state = get()
    const { allMessages, recordingStartTime, selectedTopics, messageIndex } = state

    if (!recordingStartTime) return

    const targetAbsoluteTime = recordingStartTime + targetTime
    const newMessages = new Map<string, PlaybackMessage>()

    // Find all messages up to the target time for selected topics
    // Start from current index for efficiency
    let i = messageIndex

    while (i < allMessages.length) {
      const msg = allMessages[i]
      const msgTime = rosTimeToMs(msg.rosTimestamp)

      if (msgTime > targetAbsoluteTime) {
        break
      }

      // Only include selected topics
      if (selectedTopics.includes(msg.topicName)) {
        newMessages.set(msg.topicName, {
          topicName: msg.topicName,
          topicType: msg.topicType,
          timestamp: msgTime,
          rosTimestamp: msg.rosTimestamp,
          data: msg.data
        })
      }

      i++
    }

    set({
      currentMessages: newMessages,
      messageIndex: Math.max(0, i - 1)
    })
  }
}))

// Helper to format playback time as MM:SS.mmm
export function formatPlaybackTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor(ms % 1000)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}


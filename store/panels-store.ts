import { create } from 'zustand'
import {
  parseMcapFile,
  deserializeCdrMessage,
  timestampToSeconds,
  type McapMessage,
  type McapMetadata,
  type McapTopic
} from '@/lib/rosbag/mcap-reader'

export interface SeriesConfig {
  id: string
  topic: string
  messagePath: string
  label: string
  color: string
  enabled: boolean
}

export interface PlotPanelConfig {
  id: string
  type: 'plot'
  series: SeriesConfig[]
  xAxisLabel: string
  yAxisLabel: string
  showLegend: boolean
  yMin?: number
  yMax?: number
}

export interface GaugePanelConfig {
  id: string
  type: 'gauge'
  topic: string
  messagePath: string
  label?: string
  min: number
  max: number
  colorMode: 'preset' | 'custom'
  colorMap: 'red-to-green' | 'rainbow' | 'turbo'
  customGradient: { start: string; end: string }
  reverseColors: boolean
  reverseDirection: boolean
}

// Union type for all panel types (extensible for future panel types)
export type PanelConfig = PlotPanelConfig | GaugePanelConfig

interface PanelsState {
  // File state
  file: File | null
  metadata: McapMetadata | null
  messages: McapMessage[] | null
  isLoading: boolean
  error: string | null
  
  // Playback state
  currentTime: bigint
  isPlaying: boolean
  playbackSpeed: number
  
  // Panel configurations
  panels: PanelConfig[]
  
  // Getters (for backward compatibility and convenience)
  plotPanels: PlotPanelConfig[]
  gaugePanels: GaugePanelConfig[]
  
  // Actions
  loadFile: (file: File) => Promise<void>
  clearFile: () => void
  setCurrentTime: (time: bigint) => void
  play: () => void
  pause: () => void
  setPlaybackSpeed: (speed: number) => void
  
  // Panel management (generic)
  removePanel: (panelId: string) => void
  
  // Plot panel specific
  addPlotPanel: () => void
  removePlotPanel: (panelId: string) => void
  updatePlotPanel: (panelId: string, config: Partial<PlotPanelConfig>) => void
  
  // Series management
  addSeries: (panelId: string, series: Omit<SeriesConfig, 'id'>) => void
  updateSeries: (panelId: string, seriesId: string, updates: Partial<SeriesConfig>) => void
  removeSeries: (panelId: string, seriesId: string) => void
  
  // Gauge panel specific
  addGaugePanel: () => void
  updateGaugePanel: (panelId: string, config: Partial<GaugePanelConfig>) => void
  
  // Data access
  getMessagesForTopic: (topic: string, startTime?: bigint, endTime?: bigint) => McapMessage[]
  getDeserializedMessage: (message: McapMessage) => any
}

let playbackInterval: NodeJS.Timeout | null = null

export const usePanelsStore = create<PanelsState>((set, get) => ({
  // Initial state
  file: null,
  metadata: null,
  messages: null,
  isLoading: false,
  error: null,
  
  currentTime: 0n,
  isPlaying: false,
  playbackSpeed: 1,
  
  panels: [],
  plotPanels: [],
  gaugePanels: [],
  
  // Load MCAP file
  loadFile: async (file: File) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await parseMcapFile(file, (progress) => {
        console.log('MCAP parsing progress:', progress)
      })
      
      set({
        file,
        metadata: result.metadata,
        messages: result.messages,
        currentTime: result.metadata.startTime,
        isLoading: false,
        error: null
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file'
      set({
        isLoading: false,
        error: errorMessage,
        file: null,
        metadata: null,
        messages: null
      })
      throw error
    }
  },
  
  clearFile: () => {
    const { pause } = get()
    pause()
    
    set({
      file: null,
      metadata: null,
      messages: null,
      currentTime: 0n,
      isPlaying: false,
      error: null,
      panels: []
    })
  },
  
  setCurrentTime: (time: bigint) => {
    const { metadata } = get()
    if (!metadata) return
    
    // Clamp time to valid range
    const clampedTime = time < metadata.startTime 
      ? metadata.startTime 
      : time > metadata.endTime 
      ? metadata.endTime 
      : time
    
    set({ currentTime: clampedTime })
  },
  
  play: () => {
    const { metadata, currentTime } = get()
    if (!metadata) return
    
    // If at end, restart from beginning
    if (currentTime >= metadata.endTime) {
      set({ currentTime: metadata.startTime })
    }
    
    set({ isPlaying: true })
    
    // Start playback loop
    if (playbackInterval) {
      clearInterval(playbackInterval)
    }
    
    const frameRate = 30 // 30 FPS
    const frameTime = 1000 / frameRate
    
    playbackInterval = setInterval(() => {
      const state = get()
      if (!state.isPlaying || !state.metadata) {
        if (playbackInterval) {
          clearInterval(playbackInterval)
          playbackInterval = null
        }
        return
      }
      
      // Calculate time increment based on playback speed
      const increment = BigInt(Math.floor((frameTime / 1000) * state.playbackSpeed * 1e9))
      const newTime = state.currentTime + increment
      
      if (newTime >= state.metadata.endTime) {
        // Reached end - pause
        set({ currentTime: state.metadata.endTime, isPlaying: false })
        if (playbackInterval) {
          clearInterval(playbackInterval)
          playbackInterval = null
        }
      } else {
        set({ currentTime: newTime })
      }
    }, frameTime)
  },
  
  pause: () => {
    set({ isPlaying: false })
    if (playbackInterval) {
      clearInterval(playbackInterval)
      playbackInterval = null
    }
  },
  
  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed })
  },
  
  // Panel management (generic - works for all panel types)
  removePanel: (panelId: string) => {
    set((state) => ({
      panels: state.panels.filter(p => p.id !== panelId),
      plotPanels: state.plotPanels.filter(p => p.id !== panelId),
      gaugePanels: state.gaugePanels.filter(p => p.id !== panelId)
    }))
  },
  
  // Plot panel specific
  addPlotPanel: () => {
    const newPanel: PlotPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'plot',
      series: [],
      xAxisLabel: 'Time',
      yAxisLabel: 'Value',
      showLegend: true
    }
    
    set((state) => ({
      panels: [...state.panels, newPanel],
      plotPanels: [...state.plotPanels, newPanel]
    }))
  },
  
  removePlotPanel: (panelId: string) => {
    set((state) => ({
      panels: state.panels.filter(p => p.id !== panelId),
      plotPanels: state.plotPanels.filter(p => p.id !== panelId)
    }))
  },
  
  updatePlotPanel: (panelId: string, config: Partial<PlotPanelConfig>) => {
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'plot' ? { ...p, ...config } as PlotPanelConfig : p
      ),
      plotPanels: state.plotPanels.map(p =>
        p.id === panelId ? { ...p, ...config } as PlotPanelConfig : p
      )
    }))
  },
  
  // Series management
  addSeries: (panelId: string, series: Omit<SeriesConfig, 'id'>) => {
    const newSeries: SeriesConfig = {
      ...series,
      id: `series-${Date.now()}-${Math.random()}`
    }
    
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? { ...p, series: [...p.series, newSeries] }
          : p
      ),
      plotPanels: state.plotPanels.map(p =>
        p.id === panelId
          ? { ...p, series: [...p.series, newSeries] }
          : p
      )
    }))
  },
  
  updateSeries: (panelId: string, seriesId: string, updates: Partial<SeriesConfig>) => {
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? {
              ...p,
              series: p.series.map(s =>
                s.id === seriesId ? { ...s, ...updates } : s
              )
            }
          : p
      ),
      plotPanels: state.plotPanels.map(p =>
        p.id === panelId
          ? {
              ...p,
              series: p.series.map(s =>
                s.id === seriesId ? { ...s, ...updates } : s
              )
            }
          : p
      )
    }))
  },
  
  removeSeries: (panelId: string, seriesId: string) => {
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? { ...p, series: p.series.filter(s => s.id !== seriesId) }
          : p
      ),
      plotPanels: state.plotPanels.map(p =>
        p.id === panelId
          ? { ...p, series: p.series.filter(s => s.id !== seriesId) }
          : p
      )
    }))
  },
  
  // Gauge panel specific
  addGaugePanel: () => {
    const defaultTopic = get().metadata?.topics[0]?.name || ''
    const newPanel: GaugePanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'gauge',
      topic: defaultTopic,
      messagePath: '.data',
      min: 0,
      max: 100,
      colorMode: 'preset',
      colorMap: 'red-to-green',
      customGradient: { start: '#ef4444', end: '#22c55e' },
      reverseColors: false,
      reverseDirection: false
    }
    
    set((state) => ({
      panels: [...state.panels, newPanel],
      gaugePanels: [...state.gaugePanels, newPanel]
    }))
  },
  
  updateGaugePanel: (panelId: string, config: Partial<GaugePanelConfig>) => {
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'gauge' ? { ...p, ...config } as GaugePanelConfig : p
      ),
      gaugePanels: state.gaugePanels.map(p =>
        p.id === panelId ? { ...p, ...config } as GaugePanelConfig : p
      )
    }))
  },
  
  // Data access
  getMessagesForTopic: (topic: string, startTime?: bigint, endTime?: bigint) => {
    const { messages } = get()
    if (!messages) return []
    
    return messages.filter(msg => {
      if (msg.topic !== topic) return false
      if (startTime !== undefined && msg.logTime < startTime) return false
      if (endTime !== undefined && msg.logTime > endTime) return false
      return true
    })
  },
  
  getDeserializedMessage: (message: McapMessage) => {
    // If data is already an object, return it
    if (typeof message.data === 'object' && !(message.data instanceof Uint8Array)) {
      return message.data
    }
    
    // If data is Uint8Array (CDR encoded), deserialize it
    if (message.data instanceof Uint8Array) {
      return deserializeCdrMessage(message.data, message.schemaName)
    }
    
    return message.data
  }
}))



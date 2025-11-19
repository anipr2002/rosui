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

export interface Page {
  id: string
  name: string
  layout: 'single' | 'twoColumn' | 'threeColumn' | 'fourColumn'
  createdAt: number
}

export interface BasePanelConfig {
  id: string
  type: string
  // Layout
  pageId: string
  colspan: number
  rowspan: number
  color: string
}

export interface PlotPanelConfig extends BasePanelConfig {
  type: 'plot'
  series: SeriesConfig[]
  xAxisLabel: string
  yAxisLabel: string
  showLegend: boolean
  yMin?: number
  yMax?: number
}

export interface GaugePanelConfig extends BasePanelConfig {
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

export interface IndicatorRule {
  id: string
  comparison: 'equal' | 'less' | 'lessOrEqual' | 'greater' | 'greaterOrEqual'
  compareWith: string | number | boolean
  color: string
  label: string
}

export interface IndicatorPanelConfig extends BasePanelConfig {
  type: 'indicator'
  topic: string
  messagePath: string
  style: 'bulb' | 'background'
  rules: IndicatorRule[]
}

export interface RawTopicViewerPanelConfig extends BasePanelConfig {
  type: 'raw-topic-viewer'
  topic: string
  maxMessageLength: number
  prettyPrint: boolean
  showTimestamp: boolean
}

export interface DiagnosticsPanelConfig extends BasePanelConfig {
  type: 'diagnostics'
  topic: string
  minLevel: 0 | 1 | 2 | 3 // 0=OK, 1=WARN, 2=ERROR, 3=STALE
  searchFilter: string
  sortBy: 'name' | 'level' | 'time'
  showPinned: boolean
  pinnedDiagnostics: string[]
}

// Union type for all panel types (extensible for future panel types)
export type PanelConfig = PlotPanelConfig | GaugePanelConfig | IndicatorPanelConfig | RawTopicViewerPanelConfig | DiagnosticsPanelConfig

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
  pages: Page[]
  activePageId: string | null
  
  // Getters (for backward compatibility and convenience)
  plotPanels: PlotPanelConfig[]
  gaugePanels: GaugePanelConfig[]
  indicatorPanels: IndicatorPanelConfig[]
  rawTopicViewerPanels: RawTopicViewerPanelConfig[]
  diagnosticsPanels: DiagnosticsPanelConfig[]
  
  // Actions
  loadFile: (file: File) => Promise<void>
  clearFile: () => void
  setCurrentTime: (time: bigint) => void
  play: () => void
  pause: () => void
  setPlaybackSpeed: (speed: number) => void
  
  // Page management
  addPage: () => void
  removePage: (pageId: string) => void
  renamePage: (pageId: string, name: string) => void
  setActivePage: (pageId: string) => void
  updatePageLayout: (pageId: string, layout: Page['layout']) => void

  // Panel management (generic)
  removePanel: (panelId: string) => void
  updatePanel: (panelId: string, updates: Partial<PanelConfig>) => void
  resizePanel: (panelId: string, colspan: number, rowspan: number) => void
  movePanel: (panels: PanelConfig[]) => void
  
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
  
  // Indicator panel specific
  addIndicatorPanel: () => void
  updateIndicatorPanel: (panelId: string, config: Partial<IndicatorPanelConfig>) => void
  addIndicatorRule: (panelId: string, rule: Omit<IndicatorRule, 'id'>) => void
  updateIndicatorRule: (panelId: string, ruleId: string, updates: Partial<IndicatorRule>) => void
  removeIndicatorRule: (panelId: string, ruleId: string) => void
  reorderIndicatorRules: (panelId: string, startIndex: number, endIndex: number) => void
  
  // Raw topic viewer panel specific
  addRawTopicViewerPanel: () => void
  updateRawTopicViewerPanel: (panelId: string, config: Partial<RawTopicViewerPanelConfig>) => void
  
  // Diagnostics panel specific
  addDiagnosticsPanel: () => void
  updateDiagnosticsPanel: (panelId: string, config: Partial<DiagnosticsPanelConfig>) => void
  togglePinnedDiagnostic: (panelId: string, diagnosticName: string) => void
  
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
  pages: [],
  activePageId: null,

  plotPanels: [],
  gaugePanels: [],
  indicatorPanels: [],
  rawTopicViewerPanels: [],
  diagnosticsPanels: [],
  
  // Load MCAP file
  loadFile: async (file: File) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await parseMcapFile(file, (progress) => {
        console.log('MCAP parsing progress:', progress)
      })
      
      // Create default page if none exists
      const defaultPageId = `page-${Date.now()}`
      const defaultPage: Page = {
        id: defaultPageId,
        name: 'Page 1',
        layout: 'threeColumn',
        createdAt: Date.now()
      }

      set({
        file,
        metadata: result.metadata,
        messages: result.messages,
        currentTime: result.metadata.startTime,
        isLoading: false,
        error: null,
        pages: [defaultPage],
        activePageId: defaultPageId,
        panels: [] // Reset panels on new file load
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file'
      set({
        isLoading: false,
        error: errorMessage,
        file: null,
        metadata: null,
        messages: null,
        pages: [],
        activePageId: null,
        panels: []
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
      panels: [],
      pages: [],
      activePageId: null
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

  // Page management
  addPage: () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `Page ${get().pages.length + 1}`,
      layout: 'threeColumn',
      createdAt: Date.now()
    }
    set(state => ({
      pages: [...state.pages, newPage],
      activePageId: newPage.id
    }))
  },

  removePage: (pageId: string) => {
    set(state => {
      const newPages = state.pages.filter(p => p.id !== pageId)
      // If we removed the active page, switch to another one
      let newActiveId = state.activePageId
      if (state.activePageId === pageId) {
        newActiveId = newPages.length > 0 ? newPages[0].id : null
      }
      
      // Also remove panels on this page
      const newPanels = state.panels.filter(p => p.pageId !== pageId)
      
      return {
        pages: newPages,
        activePageId: newActiveId,
        panels: newPanels,
        // Update derived lists
        plotPanels: newPanels.filter(p => p.type === 'plot') as PlotPanelConfig[],
        gaugePanels: newPanels.filter(p => p.type === 'gauge') as GaugePanelConfig[],
        indicatorPanels: newPanels.filter(p => p.type === 'indicator') as IndicatorPanelConfig[],
        rawTopicViewerPanels: newPanels.filter(p => p.type === 'raw-topic-viewer') as RawTopicViewerPanelConfig[],
        diagnosticsPanels: newPanels.filter(p => p.type === 'diagnostics') as DiagnosticsPanelConfig[]
      }
    })
  },

  renamePage: (pageId: string, name: string) => {
    set(state => ({
      pages: state.pages.map(p => p.id === pageId ? { ...p, name } : p)
    }))
  },

  setActivePage: (pageId: string) => {
    set({ activePageId: pageId })
  },

  updatePageLayout: (pageId: string, layout: Page['layout']) => {
    set(state => ({
      pages: state.pages.map(p => p.id === pageId ? { ...p, layout } : p)
    }))
  },
  
  // Panel management (generic - works for all panel types)
  removePanel: (panelId: string) => {
    set((state) => {
      const newPanels = state.panels.filter(p => p.id !== panelId)
      return {
        panels: newPanels,
        plotPanels: newPanels.filter(p => p.type === 'plot') as PlotPanelConfig[],
        gaugePanels: newPanels.filter(p => p.type === 'gauge') as GaugePanelConfig[],
        indicatorPanels: newPanels.filter(p => p.type === 'indicator') as IndicatorPanelConfig[],
        rawTopicViewerPanels: newPanels.filter(p => p.type === 'raw-topic-viewer') as RawTopicViewerPanelConfig[],
        diagnosticsPanels: newPanels.filter(p => p.type === 'diagnostics') as DiagnosticsPanelConfig[]
      }
    })
  },

  updatePanel: (panelId: string, updates: Partial<PanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p => p.id === panelId ? { ...p, ...updates } as PanelConfig : p)
      return {
        panels: newPanels,
        plotPanels: newPanels.filter(p => p.type === 'plot') as PlotPanelConfig[],
        gaugePanels: newPanels.filter(p => p.type === 'gauge') as GaugePanelConfig[],
        indicatorPanels: newPanels.filter(p => p.type === 'indicator') as IndicatorPanelConfig[],
        rawTopicViewerPanels: newPanels.filter(p => p.type === 'raw-topic-viewer') as RawTopicViewerPanelConfig[],
        diagnosticsPanels: newPanels.filter(p => p.type === 'diagnostics') as DiagnosticsPanelConfig[]
      }
    })
  },

  resizePanel: (panelId: string, colspan: number, rowspan: number) => {
    set((state) => {
      const newPanels = state.panels.map(p => p.id === panelId ? { ...p, colspan, rowspan } : p)
      return {
        panels: newPanels,
        plotPanels: newPanels.filter(p => p.type === 'plot') as PlotPanelConfig[],
        gaugePanels: newPanels.filter(p => p.type === 'gauge') as GaugePanelConfig[],
        indicatorPanels: newPanels.filter(p => p.type === 'indicator') as IndicatorPanelConfig[],
        rawTopicViewerPanels: newPanels.filter(p => p.type === 'raw-topic-viewer') as RawTopicViewerPanelConfig[],
        diagnosticsPanels: newPanels.filter(p => p.type === 'diagnostics') as DiagnosticsPanelConfig[]
      }
    })
  },

  movePanel: (panels: PanelConfig[]) => {
    set((state) => {
      // We only update the order of panels for the current page
      // But we need to keep panels from other pages intact
      // The passed 'panels' array should contain all panels for the current page in the new order
      
      // This is a bit tricky because 'panels' argument might only have the panels for the current page
      // So we need to merge it with panels from other pages
      
      const activePageId = state.activePageId
      if (!activePageId) return {}

      const otherPagePanels = state.panels.filter(p => p.pageId !== activePageId)
      const newPanels = [...otherPagePanels, ...panels]
      
      return {
        panels: newPanels,
        plotPanels: newPanels.filter(p => p.type === 'plot') as PlotPanelConfig[],
        gaugePanels: newPanels.filter(p => p.type === 'gauge') as GaugePanelConfig[],
        indicatorPanels: newPanels.filter(p => p.type === 'indicator') as IndicatorPanelConfig[],
        rawTopicViewerPanels: newPanels.filter(p => p.type === 'raw-topic-viewer') as RawTopicViewerPanelConfig[],
        diagnosticsPanels: newPanels.filter(p => p.type === 'diagnostics') as DiagnosticsPanelConfig[]
      }
    })
  },
  
  // Plot panel specific
  addPlotPanel: () => {
    const state = get()
    if (!state.activePageId) return

    const newPanel: PlotPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'plot',
      pageId: state.activePageId,
      colspan: 1,
      rowspan: 12,
      color: 'bg-white',
      series: [],
      xAxisLabel: 'Time',
      yAxisLabel: 'Value',
      showLegend: true
    }
    
    set((state) => {
      const newPanels = [...state.panels, newPanel]
      return {
        panels: newPanels,
        plotPanels: [...state.plotPanels, newPanel]
      }
    })
  },
  
  removePlotPanel: (panelId: string) => {
    set((state) => {
      const newPanels = state.panels.filter(p => p.id !== panelId)
      return {
        panels: newPanels,
        plotPanels: state.plotPanels.filter(p => p.id !== panelId)
      }
    })
  },
  
  updatePlotPanel: (panelId: string, config: Partial<PlotPanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'plot' ? { ...p, ...config } as PlotPanelConfig : p
      )
      return {
        panels: newPanels,
        plotPanels: state.plotPanels.map(p =>
          p.id === panelId ? { ...p, ...config } as PlotPanelConfig : p
        )
      }
    })
  },
  
  // Series management
  addSeries: (panelId: string, series: Omit<SeriesConfig, 'id'>) => {
    const newSeries: SeriesConfig = {
      ...series,
      id: `series-${Date.now()}-${Math.random()}`
    }
    
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? { ...p, series: [...p.series, newSeries] }
          : p
      )
      return {
        panels: newPanels,
        plotPanels: state.plotPanels.map(p =>
          p.id === panelId
            ? { ...p, series: [...p.series, newSeries] }
            : p
        )
      }
    })
  },
  
  updateSeries: (panelId: string, seriesId: string, updates: Partial<SeriesConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? {
              ...p,
              series: p.series.map(s =>
                s.id === seriesId ? { ...s, ...updates } : s
              )
            }
          : p
      )
      return {
        panels: newPanels,
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
      }
    })
  },
  
  removeSeries: (panelId: string, seriesId: string) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'plot'
          ? { ...p, series: p.series.filter(s => s.id !== seriesId) }
          : p
      )
      return {
        panels: newPanels,
        plotPanels: state.plotPanels.map(p =>
          p.id === panelId
            ? { ...p, series: p.series.filter(s => s.id !== seriesId) }
            : p
        )
      }
    })
  },
  
  // Gauge panel specific
  addGaugePanel: () => {
    const state = get()
    if (!state.activePageId) return

    const defaultTopic = get().metadata?.topics[0]?.name || ''
    const newPanel: GaugePanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'gauge',
      pageId: state.activePageId,
      colspan: 1,
      rowspan: 12,
      color: 'bg-white',
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
    
    set((state) => {
      const newPanels = [...state.panels, newPanel]
      return {
        panels: newPanels,
        gaugePanels: [...state.gaugePanels, newPanel]
      }
    })
  },
  
  updateGaugePanel: (panelId: string, config: Partial<GaugePanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'gauge' ? { ...p, ...config } as GaugePanelConfig : p
      )
      return {
        panels: newPanels,
        gaugePanels: state.gaugePanels.map(p =>
          p.id === panelId ? { ...p, ...config } as GaugePanelConfig : p
        )
      }
    })
  },
  
  // Indicator panel specific
  addIndicatorPanel: () => {
    const state = get()
    if (!state.activePageId) return

    const defaultTopic = get().metadata?.topics[0]?.name || ''
    const newPanel: IndicatorPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'indicator',
      pageId: state.activePageId,
      colspan: 1,
      rowspan: 12,
      color: 'bg-white',
      topic: defaultTopic,
      messagePath: '.data',
      style: 'bulb',
      rules: []
    }
    
    set((state) => {
      const newPanels = [...state.panels, newPanel]
      return {
        panels: newPanels,
        indicatorPanels: [...state.indicatorPanels, newPanel]
      }
    })
  },
  
  updateIndicatorPanel: (panelId: string, config: Partial<IndicatorPanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'indicator' ? { ...p, ...config } as IndicatorPanelConfig : p
      )
      return {
        panels: newPanels,
        indicatorPanels: state.indicatorPanels.map(p =>
          p.id === panelId ? { ...p, ...config } as IndicatorPanelConfig : p
        )
      }
    })
  },
  
  addIndicatorRule: (panelId: string, rule: Omit<IndicatorRule, 'id'>) => {
    const newRule: IndicatorRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random()}`
    }
    
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'indicator'
          ? { ...p, rules: [...p.rules, newRule] }
          : p
      )
      return {
        panels: newPanels,
        indicatorPanels: state.indicatorPanels.map(p =>
          p.id === panelId
            ? { ...p, rules: [...p.rules, newRule] }
            : p
        )
      }
    })
  },
  
  updateIndicatorRule: (panelId: string, ruleId: string, updates: Partial<IndicatorRule>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'indicator'
          ? {
              ...p,
              rules: p.rules.map(r =>
                r.id === ruleId ? { ...r, ...updates } : r
              )
            }
          : p
      )
      return {
        panels: newPanels,
        indicatorPanels: state.indicatorPanels.map(p =>
          p.id === panelId
            ? {
                ...p,
                rules: p.rules.map(r =>
                  r.id === ruleId ? { ...r, ...updates } : r
                )
              }
            : p
        )
      }
    })
  },
  
  removeIndicatorRule: (panelId: string, ruleId: string) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'indicator'
          ? { ...p, rules: p.rules.filter(r => r.id !== ruleId) }
          : p
      )
      return {
        panels: newPanels,
        indicatorPanels: state.indicatorPanels.map(p =>
          p.id === panelId
            ? { ...p, rules: p.rules.filter(r => r.id !== ruleId) }
            : p
        )
      }
    })
  },
  
  reorderIndicatorRules: (panelId: string, startIndex: number, endIndex: number) => {
    set((state) => {
      const reorder = (rules: IndicatorRule[]) => {
        const result = Array.from(rules)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        return result
      }
      
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'indicator'
          ? { ...p, rules: reorder(p.rules) }
          : p
      )
      
      return {
        panels: newPanels,
        indicatorPanels: state.indicatorPanels.map(p =>
          p.id === panelId
            ? { ...p, rules: reorder(p.rules) }
            : p
        )
      }
    })
  },
  
  // Raw topic viewer panel specific
  addRawTopicViewerPanel: () => {
    const state = get()
    if (!state.activePageId) return

    const defaultTopic = get().metadata?.topics[0]?.name || ''
    const newPanel: RawTopicViewerPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'raw-topic-viewer',
      pageId: state.activePageId,
      colspan: 1,
      rowspan: 12,
      color: 'bg-white',
      topic: defaultTopic,
      maxMessageLength: 5000,
      prettyPrint: true,
      showTimestamp: true
    }
    
    set((state) => {
      const newPanels = [...state.panels, newPanel]
      return {
        panels: newPanels,
        rawTopicViewerPanels: [...state.rawTopicViewerPanels, newPanel]
      }
    })
  },
  
  updateRawTopicViewerPanel: (panelId: string, config: Partial<RawTopicViewerPanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'raw-topic-viewer' ? { ...p, ...config } as RawTopicViewerPanelConfig : p
      )
      return {
        panels: newPanels,
        rawTopicViewerPanels: state.rawTopicViewerPanels.map(p =>
          p.id === panelId ? { ...p, ...config } as RawTopicViewerPanelConfig : p
        )
      }
    })
  },
  
  // Diagnostics panel specific
  addDiagnosticsPanel: () => {
    const state = get()
    if (!state.activePageId) return

    const defaultTopic = get().metadata?.topics.find(t => 
      t.name.includes('diagnostics')
    )?.name || get().metadata?.topics[0]?.name || '/diagnostics'
    
    const newPanel: DiagnosticsPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'diagnostics',
      pageId: state.activePageId,
      colspan: 1,
      rowspan: 12,
      color: 'bg-white',
      topic: defaultTopic,
      minLevel: 0,
      searchFilter: '',
      sortBy: 'level',
      showPinned: true,
      pinnedDiagnostics: []
    }
    
    set((state) => {
      const newPanels = [...state.panels, newPanel]
      return {
        panels: newPanels,
        diagnosticsPanels: [...state.diagnosticsPanels, newPanel]
      }
    })
  },
  
  updateDiagnosticsPanel: (panelId: string, config: Partial<DiagnosticsPanelConfig>) => {
    set((state) => {
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'diagnostics' ? { ...p, ...config } as DiagnosticsPanelConfig : p
      )
      return {
        panels: newPanels,
        diagnosticsPanels: state.diagnosticsPanels.map(p =>
          p.id === panelId ? { ...p, ...config } as DiagnosticsPanelConfig : p
        )
      }
    })
  },
  
  togglePinnedDiagnostic: (panelId: string, diagnosticName: string) => {
    set((state) => {
      const panel = state.diagnosticsPanels.find(p => p.id === panelId)
      if (!panel) return state
      
      const isPinned = panel.pinnedDiagnostics.includes(diagnosticName)
      const newPinnedDiagnostics = isPinned
        ? panel.pinnedDiagnostics.filter(name => name !== diagnosticName)
        : [...panel.pinnedDiagnostics, diagnosticName]
      
      const newPanels = state.panels.map(p =>
        p.id === panelId && p.type === 'diagnostics'
          ? { ...p, pinnedDiagnostics: newPinnedDiagnostics }
          : p
      )
      
      return {
        panels: newPanels,
        diagnosticsPanels: state.diagnosticsPanels.map(p =>
          p.id === panelId
            ? { ...p, pinnedDiagnostics: newPinnedDiagnostics }
            : p
        )
      }
    })
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



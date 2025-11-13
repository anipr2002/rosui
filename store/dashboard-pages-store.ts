import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Panel {
  id: string
  color: string
  colspan: number
  rowspan: number
  panelType: string
  config?: any // Panel-specific configuration (e.g., LivePlotConfig for plot panels)
}

export type LayoutType = 'single' | 'twoColumn' | 'threeColumn' | 'fourColumn'

export interface DashboardPage {
  id: string
  name: string
  panels: Panel[]
  layout: LayoutType
  createdAt: number
}

interface DashboardPagesState {
  pages: DashboardPage[]
  activePageId: string | null
  nextPageNumber: number
  
  // Actions
  addPage: () => void
  removePage: (id: string) => void
  renamePage: (id: string, name: string) => void
  setActivePage: (id: string) => void
  updatePagePanels: (id: string, panels: Panel[]) => void
  updatePageLayout: (id: string, layout: LayoutType) => void
  getActivePage: () => DashboardPage | null
}

const createDefaultPage = (id: string, name: string): DashboardPage => ({
  id,
  name,
  panels: [
    {
      id: '1',
      color: 'bg-blue-50',
      colspan: 1,
      rowspan: 1,
      panelType: 'Default'
    },
    {
      id: '2',
      color: 'bg-green-50',
      colspan: 1,
      rowspan: 1,
      panelType: 'Default'
    },
    {
      id: '3',
      color: 'bg-purple-50',
      colspan: 1,
      rowspan: 1,
      panelType: 'Default'
    }
  ],
  layout: 'threeColumn',
  createdAt: Date.now()
})

export const useDashboardPagesStore = create<DashboardPagesState>()(
  persist(
    (set, get) => ({
      pages: [createDefaultPage('page-1', 'Dashboard 1')],
      activePageId: 'page-1',
      nextPageNumber: 2,

      addPage: () => {
        const { nextPageNumber } = get()
        const newPage = createDefaultPage(
          `page-${Date.now()}`,
          `Dashboard ${nextPageNumber}`
        )
        set((state) => ({
          pages: [...state.pages, newPage],
          activePageId: newPage.id,
          nextPageNumber: nextPageNumber + 1
        }))
      },

      removePage: (id) => {
        const { pages, activePageId } = get()
        
        // Don't allow removing the last page
        if (pages.length <= 1) {
          return
        }

        const pageIndex = pages.findIndex((p) => p.id === id)
        if (pageIndex === -1) {
          return
        }

        const newPages = pages.filter((p) => p.id !== id)
        
        // If we're removing the active page, switch to another
        let newActivePageId = activePageId
        if (activePageId === id) {
          // Switch to the previous page, or the next one if it's the first
          const newIndex = pageIndex > 0 ? pageIndex - 1 : 0
          newActivePageId = newPages[newIndex].id
        }

        set({
          pages: newPages,
          activePageId: newActivePageId
        })
      },

      renamePage: (id, name) => {
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, name } : page
          )
        }))
      },

      setActivePage: (id) => {
        const { pages } = get()
        if (pages.find((p) => p.id === id)) {
          set({ activePageId: id })
        }
      },

      updatePagePanels: (id, panels) => {
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, panels } : page
          )
        }))
      },

      updatePageLayout: (id, layout) => {
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, layout } : page
          )
        }))
      },

      getActivePage: () => {
        const { pages, activePageId } = get()
        return pages.find((p) => p.id === activePageId) || null
      }
    }),
    {
      name: 'dashboard-pages-storage',
      partialize: (state) => ({
        pages: state.pages,
        activePageId: state.activePageId,
        nextPageNumber: state.nextPageNumber
      })
    }
  )
)


'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, X, Edit2, Check } from 'lucide-react'

import { useDashboardPagesStore } from '@/store/dashboard-pages-store'

const PageTabs = React.memo(() => {
  const { pages, activePageId, addPage, removePage, renamePage, setActivePage } = useDashboardPagesStore()
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingPageId])

  const handleTabClick = useCallback((pageId: string) => {
    if (editingPageId !== pageId) {
      setActivePage(pageId)
    }
  }, [editingPageId, setActivePage])

  const handleAddPage = useCallback(() => {
    addPage()
  }, [addPage])

  const handleRemovePage = useCallback((e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    
    // Only show confirmation if the page has panels
    const page = pages.find((p) => p.id === pageId)
    if (page && page.panels.length > 0) {
      if (!window.confirm(`Are you sure you want to close "${page.name}"? All panels will be lost.`)) {
        return
      }
    }
    
    removePage(pageId)
  }, [pages, removePage])

  const handleStartRename = useCallback((e: React.MouseEvent, pageId: string, currentName: string) => {
    e.stopPropagation()
    setEditingPageId(pageId)
    setEditingName(currentName)
  }, [])

  const handleFinishRename = useCallback(() => {
    if (editingPageId && editingName.trim()) {
      renamePage(editingPageId, editingName.trim())
    }
    setEditingPageId(null)
    setEditingName('')
  }, [editingPageId, editingName, renamePage])

  const handleCancelRename = useCallback(() => {
    setEditingPageId(null)
    setEditingName('')
  }, [])

  const handleDoubleClick = useCallback((pageId: string, currentName: string) => {
    setEditingPageId(pageId)
    setEditingName(currentName)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }, [handleFinishRename, handleCancelRename])

  return (
    <div className="mb-4">
      <div className="bg-white border rounded-xl shadow-none overflow-hidden">
        <div className="flex items-center bg-gray-50 border-b">
          {/* Tabs */}
          <div className="flex items-center overflow-x-auto flex-1">
            {pages.map((page) => {
              const isActive = page.id === activePageId
              const isEditing = page.id === editingPageId

              return (
                <div
                  key={page.id}
                  onClick={() => handleTabClick(page.id)}
                  onDoubleClick={() => handleDoubleClick(page.id, page.name)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-3 border-r cursor-pointer
                    transition-colors min-w-[140px] max-w-[200px]
                    ${isActive
                      ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-500'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleFinishRename}
                        className="flex-1 px-1 py-0.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleFinishRename}
                        className="p-0.5 hover:bg-indigo-100 rounded"
                      >
                        <Check className="h-3 w-3 text-indigo-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium truncate flex-1">
                        {page.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(e, page.id, page.name)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Rename page"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={(e) => handleRemovePage(e, page.id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Close page"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add Page Button */}
          <button
            onClick={handleAddPage}
            className="flex items-center justify-center p-3 hover:bg-gray-100 transition-colors border-l"
            title="Add new page"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
})

PageTabs.displayName = 'PageTabs'

export { PageTabs }


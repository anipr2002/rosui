import { useEffect, useRef } from 'react'
import { useDashboardPagesStore } from '@/store/dashboard-pages-store'
import { useTopicsStore } from '@/store/topic-store'
import type { Panel } from '@/store/dashboard-pages-store'
import type { LivePlotConfig } from '@/components/dashboard/advanced/layouts/panels/plot/types'

/**
 * Extract topics needed by a panel
 */
function getTopicsFromPanel(panel: Panel): string[] {
  if (panel.panelType !== 'Plot Panel') {
    return []
  }

  const config = panel.config as LivePlotConfig
  if (!config || !config.series) {
    // Handle legacy config
    if (config?.topic) {
      return [config.topic]
    }
    return []
  }

  // Get unique topics from all enabled series
  const topics = config.series
    .filter((s) => s.enabled)
    .map((s) => s.topic)
  
  return [...new Set(topics)]
}

/**
 * Get all topics needed by a page's panels
 */
function getPageTopics(panels: Panel[]): Set<string> {
  const topics = new Set<string>()
  panels.forEach((panel) => {
    getTopicsFromPanel(panel).forEach((topic) => topics.add(topic))
  })
  return topics
}

/**
 * Hook to manage topic subscriptions based on active page
 * Unsubscribes from topics when switching pages to improve performance
 */
export function usePageSubscriptions() {
  const { pages, activePageId } = useDashboardPagesStore()
  const { subscribers, removeSubscriber, createSubscriber, topics } = useTopicsStore()
  
  const previousPageIdRef = useRef<string | null>(null)
  const previousTopicsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const activePage = pages.find((p) => p.id === activePageId)
    if (!activePage) return

    // Get topics needed by current page
    const currentTopics = getPageTopics(activePage.panels)

    // If page changed, manage subscriptions
    if (previousPageIdRef.current !== null && previousPageIdRef.current !== activePageId) {
      const previousTopics = previousTopicsRef.current

      // Topics to unsubscribe from (in previous page but not in current)
      const topicsToUnsubscribe = new Set<string>()
      previousTopics.forEach((topic) => {
        if (!currentTopics.has(topic)) {
          topicsToUnsubscribe.add(topic)
        }
      })

      // Topics to subscribe to (in current page but not in previous)
      const topicsToSubscribe = new Set<string>()
      currentTopics.forEach((topic) => {
        if (!previousTopics.has(topic)) {
          topicsToSubscribe.add(topic)
        }
      })

      // Unsubscribe from topics no longer needed
      topicsToUnsubscribe.forEach((topicName) => {
        const subscriber = subscribers.get(topicName)
        if (subscriber) {
          console.log(`[PageSubscriptions] Unsubscribing from: ${topicName}`)
          try {
            removeSubscriber(topicName)
          } catch (error) {
            console.error(`Failed to unsubscribe from ${topicName}:`, error)
          }
        }
      })

      // Subscribe to new topics needed
      topicsToSubscribe.forEach((topicName) => {
        const topic = topics.find((t) => t.name === topicName)
        if (topic && !subscribers.has(topicName)) {
          console.log(`[PageSubscriptions] Subscribing to: ${topicName}`)
          try {
            createSubscriber(topicName, topic.type)
          } catch (error) {
            console.error(`Failed to subscribe to ${topicName}:`, error)
          }
        }
      })

      console.log(
        `[PageSubscriptions] Active topics: ${currentTopics.size}, ` +
        `Unsubscribed: ${topicsToUnsubscribe.size}, ` +
        `Subscribed: ${topicsToSubscribe.size}`
      )
    }

    // Update refs
    previousPageIdRef.current = activePageId
    previousTopicsRef.current = currentTopics
  }, [activePageId, pages, subscribers, removeSubscriber, createSubscriber, topics])

  // Cleanup: unsubscribe from all topics when component unmounts
  useEffect(() => {
    return () => {
      const currentTopics = previousTopicsRef.current
      currentTopics.forEach((topicName) => {
        try {
          removeSubscriber(topicName)
        } catch (error) {
          console.error(`Failed to cleanup subscription for ${topicName}:`, error)
        }
      })
    }
  }, [removeSubscriber])
}


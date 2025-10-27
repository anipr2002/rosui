import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { messageTypeParser } from '@/lib/ros/messageTypeParser'

export interface ActionInfo {
  name: string
  type: string
}

export interface ActionDefinition {
  goal: {
    type: string
    definition: string
    defaultMessage: any
  }
  result: {
    type: string
    definition: string
  }
  feedback: {
    type: string
    definition: string
  }
}

export interface GoalStatus {
  goalId: string
  status: number
  text: string
}

export interface ActionGoal {
  actionName: string
  goal: any
  result: any
  feedback: any[]
  status: GoalStatus | null
  error: string | null
  isActive: boolean
  timestamp: number
  goalId?: string
  goalHandle?: ROSLIB.Goal
}

interface ActionsState {
  actions: ActionInfo[]
  isLoadingActions: boolean
  actionDefinitions: Map<string, ActionDefinition>
  isLoadingDefinitions: Map<string, boolean>
  activeGoals: Map<string, ActionGoal>
  actionClients: Map<string, ROSLIB.ActionClient>
  getActionsList: () => Promise<void>
  getActionDefinition: (actionType: string) => Promise<ActionDefinition | null>
  sendGoal: (actionName: string, actionType: string, goal: any) => Promise<string>
  cancelGoal: (actionName: string, goalId: string) => void
  cancelAllGoals: (actionName: string) => void
  cleanup: () => void
}

export const useActionsStore = create<ActionsState>((set, get) => ({
  actions: [],
  isLoadingActions: false,
  actionDefinitions: new Map(),
  isLoadingDefinitions: new Map(),
  activeGoals: new Map(),
  actionClients: new Map(),

  getActionsList: async () => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      console.error('ROS connection not available')
      return
    }

    set({ isLoadingActions: true })

    ros.getActionServers(
      (actionServers) => {
        if (actionServers.length === 0) {
          set({ actions: [], isLoadingActions: false })
          return
        }

        // For each action server, we need to get its type
        // Action server names typically follow the pattern: /action_name
        // We'll need to call getTopicsAndRawTypes and filter for action-related topics
        const promises = actionServers.map(
          (actionName) =>
            new Promise<ActionInfo>((resolve, reject) => {
              // Action servers expose topics like:
              // /action_name/goal, /action_name/result, /action_name/feedback
              // We can get the type from the goal topic
              const goalTopic = `${actionName}/goal`
              
              ros.getTopicType(
                goalTopic,
                (topicType) => {
                  // Topic type will be like: action_package/ActionNameActionGoal
                  // We need to extract the action type: action_package/ActionNameAction
                  let actionType = topicType
                  if (topicType.endsWith('ActionGoal')) {
                    actionType = topicType.replace(/ActionGoal$/, 'Action')
                  } else if (topicType.endsWith('Goal')) {
                    actionType = topicType.replace(/Goal$/, 'Action')
                  }
                  
                  resolve({ name: actionName, type: actionType })
                },
                (error) => {
                  console.warn(`Failed to get type for ${actionName}, using default`)
                  // If we can't get the type, just use the action name
                  resolve({ name: actionName, type: 'unknown' })
                }
              )
            })
        )

        Promise.all(promises)
          .then((actionsWithTypes) => {
            set({ actions: actionsWithTypes, isLoadingActions: false })
            console.log(
              `Loaded ${actionsWithTypes.length} action servers successfully`
            )
          })
          .catch((error) => {
            console.error('Error fetching action types:', error)
            set({ isLoadingActions: false })
          })
      },
      (error) => {
        console.error('Failed to load action servers:', error)
        set({ isLoadingActions: false })
      }
    )
  },

  getActionDefinition: async (actionType: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      return null
    }

    const cachedDef = get().actionDefinitions.get(actionType)
    if (cachedDef) {
      return cachedDef
    }

    set((state) => ({
      isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
        actionType,
        true
      ),
    }))

    return new Promise<ActionDefinition | null>((resolve) => {
      try {
        // Use getTopicsAndRawTypes to get all topic definitions including action topics
        ros.getTopicsAndRawTypes(
          (result: { types: string[]; topics: string[]; typedefs_full_text: string[] }) => {
            try {
              // Find the action name from the actions list
              const action = get().actions.find(a => a.type === actionType)
              if (!action) {
                console.error(`Action not found for type: ${actionType}`)
                set((state) => ({
                  isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
                    actionType,
                    false
                  ),
                }))
                resolve(null)
                return
              }

              const actionName = action.name

              // Look for action-related topics
              // Action topics follow the pattern: /action_name/goal, /action_name/feedback, /action_name/result
              const goalTopicName = `${actionName}/goal`
              const feedbackTopicName = `${actionName}/feedback`
              const resultTopicName = `${actionName}/result`

              const goalTopicIndex = result.topics.indexOf(goalTopicName)
              const feedbackTopicIndex = result.topics.indexOf(feedbackTopicName)
              const resultTopicIndex = result.topics.indexOf(resultTopicName)

              if (goalTopicIndex === -1) {
                console.error(`Goal topic not found: ${goalTopicName}`)
                set((state) => ({
                  isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
                    actionType,
                    false
                  ),
                }))
                resolve(null)
                return
              }

              // Get the message types and definitions
              const goalType = result.types[goalTopicIndex]
              const goalDefinition = result.typedefs_full_text[goalTopicIndex]

              const feedbackType = feedbackTopicIndex !== -1 
                ? result.types[feedbackTopicIndex] 
                : 'unknown'
              const feedbackDefinition = feedbackTopicIndex !== -1 
                ? result.typedefs_full_text[feedbackTopicIndex] 
                : ''

              const resultType = resultTopicIndex !== -1 
                ? result.types[resultTopicIndex] 
                : 'unknown'
              const resultDefinition = resultTopicIndex !== -1 
                ? result.typedefs_full_text[resultTopicIndex] 
                : ''

              console.log(`Action ${actionType} - Goal type: ${goalType}`)
              console.log('Goal definition:', goalDefinition)

              // Load type definitions into parser
              const typesToLoad: string[] = []
              const defsToLoad: string[] = []

              if (goalDefinition) {
                typesToLoad.push(goalType)
                defsToLoad.push(goalDefinition)
              }
              if (feedbackDefinition) {
                typesToLoad.push(feedbackType)
                defsToLoad.push(feedbackDefinition)
              }
              if (resultDefinition) {
                typesToLoad.push(resultType)
                defsToLoad.push(resultDefinition)
              }

              if (typesToLoad.length > 0) {
                messageTypeParser.loadTypeDefinitions(defsToLoad, typesToLoad)
              }

              // Create default message for the goal
              let defaultMessage = messageTypeParser.createDefaultMessage(goalType)
              console.log('Default message for goal:', defaultMessage)

              // Fallback if parser fails
              if (!defaultMessage || Object.keys(defaultMessage).length === 0) {
                console.log('Parser failed to create default message, creating fallback')
                defaultMessage = {}

                const defLines = goalDefinition
                  .split('\n')
                  .filter((line) => line.trim() && !line.startsWith('#'))
                for (const line of defLines) {
                  const parts = line.trim().split(/\s+/)
                  if (parts.length >= 2) {
                    const type = parts[0]
                    const name = parts[1].replace(/\[.*\]/, '')
                    const cleanName = name.startsWith('_') ? name.substring(1) : name

                    if (type === 'string') {
                      defaultMessage[cleanName] = ''
                    } else if (
                      type.includes('int') ||
                      type.includes('float') ||
                      type.includes('uint')
                    ) {
                      defaultMessage[cleanName] = 0
                    } else if (type === 'bool') {
                      defaultMessage[cleanName] = false
                    } else {
                      defaultMessage[cleanName] = {}
                    }
                  }
                }
                console.log('Created fallback default message:', defaultMessage)
              }

              const definition: ActionDefinition = {
                goal: {
                  type: goalType,
                  definition: goalDefinition,
                  defaultMessage,
                },
                result: {
                  type: resultType,
                  definition: resultDefinition,
                },
                feedback: {
                  type: feedbackType,
                  definition: feedbackDefinition,
                },
              }

              set((state) => ({
                actionDefinitions: new Map(state.actionDefinitions).set(
                  actionType,
                  definition
                ),
                isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
                  actionType,
                  false
                ),
              }))

              resolve(definition)
            } catch (error) {
              console.error(`Error processing action definition for ${actionType}:`, error)
              set((state) => ({
                isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
                  actionType,
                  false
                ),
              }))
              resolve(null)
            }
          },
          (error: any) => {
            console.error(`Failed to get topics and types for ${actionType}:`, error)
            set((state) => ({
              isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
                actionType,
                false
              ),
            }))
            resolve(null)
          }
        )
      } catch (error) {
        console.error(`Failed to get action definition for ${actionType}:`, error)
        set((state) => ({
          isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
            actionType,
            false
          ),
        }))
        resolve(null)
      }
    })
  },

  sendGoal: async (actionName: string, actionType: string, goal: any) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      throw new Error('ROS connection not available')
    }

    // Get or create action client
    let actionClient = get().actionClients.get(actionName)
    if (!actionClient) {
      actionClient = new ROSLIB.ActionClient({
        ros,
        serverName: actionName,
        actionName: actionType,
      })

      set((state) => ({
        actionClients: new Map(state.actionClients).set(actionName, actionClient!),
      }))
    }

    const goalId = `${actionName}-${Date.now()}`

    return new Promise<string>((resolve, reject) => {
      try {
        const rosGoal = new ROSLIB.Goal({
          actionClient,
          goalMessage: goal,
        })

        // Create goal entry with the goal handle
        const actionGoal: ActionGoal = {
          actionName,
          goal,
          result: null,
          feedback: [],
          status: null,
          error: null,
          isActive: true,
          timestamp: Date.now(),
          goalId,
          goalHandle: rosGoal,
        }

        set((state) => ({
          activeGoals: new Map(state.activeGoals).set(goalId, actionGoal),
        }))

        // Handle feedback
        rosGoal.on('feedback', (feedback: any) => {
          const { activeGoals } = get()
          const currentGoal = activeGoals.get(goalId)
          if (currentGoal) {
            set((state) => ({
              activeGoals: new Map(state.activeGoals).set(goalId, {
                ...currentGoal,
                feedback: [...currentGoal.feedback, feedback],
              }),
            }))
          }
        })

        // Handle result
        rosGoal.on('result', (result: any) => {
          const { activeGoals } = get()
          const currentGoal = activeGoals.get(goalId)
          if (currentGoal) {
            set((state) => ({
              activeGoals: new Map(state.activeGoals).set(goalId, {
                ...currentGoal,
                result,
                isActive: false,
              }),
            }))
          }
        })

        // Handle status
        rosGoal.on('status', (status: any) => {
          const { activeGoals } = get()
          const currentGoal = activeGoals.get(goalId)
          if (currentGoal) {
            // Use the actual goal_id from status if available
            const actualGoalId = status.goal_id?.id || goalId
            
            set((state) => ({
              activeGoals: new Map(state.activeGoals).set(goalId, {
                ...currentGoal,
                status: {
                  goalId: actualGoalId,
                  status: status.status,
                  text: status.text || '',
                },
                // Update isActive based on status
                isActive: status.status === 0 || status.status === 1 || status.status === 6,
              }),
            }))
          }
        })

        // Send the goal
        rosGoal.send()
        resolve(goalId)
      } catch (error) {
        const { activeGoals } = get()
        const currentGoal = activeGoals.get(goalId)
        if (currentGoal) {
          set((state) => ({
            activeGoals: new Map(state.activeGoals).set(goalId, {
              ...currentGoal,
              error: error instanceof Error ? error.message : String(error),
              isActive: false,
            }),
          }))
        }
        reject(error)
      }
    })
  },

  cancelGoal: (actionName: string, goalId: string) => {
    const { activeGoals } = get()
    const goal = activeGoals.get(goalId)
    
    if (goal && goal.isActive && goal.goalHandle) {
      try {
        // Cancel the goal on the server
        goal.goalHandle.cancel()
        
        // Update goal status to cancelled
        set((state) => ({
          activeGoals: new Map(state.activeGoals).set(goalId, {
            ...goal,
            isActive: false,
            status: {
              goalId,
              status: 2, // PREEMPTED
              text: 'Goal cancelled by user',
            },
          }),
        }))
        
        console.log(`Cancelled goal ${goalId}`)
      } catch (error) {
        console.error(`Failed to cancel goal ${goalId}:`, error)
        
        // Still update the local state even if cancel fails
        set((state) => ({
          activeGoals: new Map(state.activeGoals).set(goalId, {
            ...goal,
            isActive: false,
            error: error instanceof Error ? error.message : 'Failed to cancel goal',
          }),
        }))
      }
    }
  },

  cancelAllGoals: (actionName: string) => {
    const actionClient = get().actionClients.get(actionName)
    if (actionClient) {
      actionClient.cancel()
      
      // Update all active goals for this action
      const { activeGoals } = get()
      const newActiveGoals = new Map(activeGoals)
      
      activeGoals.forEach((goal, goalId) => {
        if (goal.actionName === actionName && goal.isActive) {
          newActiveGoals.set(goalId, {
            ...goal,
            isActive: false,
            status: {
              goalId,
              status: 2, // PREEMPTED
              text: 'All goals cancelled',
            },
          })
        }
      })
      
      set({ activeGoals: newActiveGoals })
    }
  },

  cleanup: () => {
    const { actionClients } = get()
    
    // Dispose all action clients
    actionClients.forEach((client) => {
      client.dispose()
    })
    
    set({
      actions: [],
      isLoadingActions: false,
      actionDefinitions: new Map(),
      isLoadingDefinitions: new Map(),
      activeGoals: new Map(),
      actionClients: new Map(),
    })
  },
}))

